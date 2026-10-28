// Oracle for the lesson "polynomial-division" (Algebra 2, lesson 4: long and synthetic division). Role O,
// docs/lessons/QUALITY_LAYER.md. Written from what the student sees only: the prompt, the board TeX, the choices and
// the picture data the page draws (the long-division layout's P and D and how many cycles are shown, the synthetic
// tableau's coefficient row and c, the reverse area box's side and cells). Every expression is parsed into an exact
// one-variable polynomial in x with rational coefficients (quotients are kept as num/den), and every division is done
// here with exact long division: P = D·Q + R with R = 0 or deg R < deg D. Choices are judged one by one (a choice is
// right when its maths is right); exactly one right choice, or -1 (the sweep reports it).
import { Q } from '../../tools/quality/oracle-kit.mjs';

// ============================================================ dense polynomials: coefficient arrays, index = power
const Z = Q(0);
const trim = a => { const b = a.slice(); while (b.length && b[b.length - 1].n === 0) b.pop(); return b; };
const pc = q => trim([typeof q === 'object' ? q : Q(q)]);
const padd = (a, b) => { const r = []; for (let i = 0; i < Math.max(a.length, b.length); i++) r.push((a[i] ?? Z).add(b[i] ?? Z)); return trim(r); };
const pneg = a => a.map(c => c.neg());
const psub = (a, b) => padd(a, pneg(b));
const pmul = (a, b) => {
  if (!a.length || !b.length) return [];
  const r = Array.from({ length: a.length + b.length - 1 }, () => Z);
  a.forEach((x, i) => b.forEach((y, j) => { r[i + j] = r[i + j].add(x.mul(y)); }));
  return trim(r);
};
const pscale = (a, q) => trim(a.map(c => c.mul(q)));
const deg = a => (a.length ? a.length - 1 : -Infinity);
const peq = (a, b) => psub(a, b).length === 0;
const pat = (a, x) => a.reduceRight((s, c) => s.mul(x).add(c), Z);
const mono = (c, k) => { const r = Array.from({ length: k + 1 }, () => Z); r[k] = c; return trim(r); };
const X = [Z, Q(1)];
/** exact long division: { Q, R, cycles: [{ t, residualAfter }] } */
function divmod(P, D) {
  if (!D.length) throw new Error('division by the zero polynomial');
  let R = P.slice(), Qt = [];
  const cycles = [];
  while (R.length && deg(R) >= deg(D)) {
    const k = deg(R) - deg(D), c = R[R.length - 1].div(D[D.length - 1]);
    const t = mono(c, k);
    Qt = padd(Qt, t); R = psub(R, pmul(t, D));
    cycles.push({ t, after: R });
  }
  return { Q: Qt, R, cycles };
}
/** rational roots of a polynomial with rational coefficients (rational root theorem on the cleared integer form) */
function ratRoots(a) {
  if (!a.length) return null;
  if (deg(a) <= 0) return [];
  let L = 1; for (const c of a) L = lcm(L, c.d);
  const ints = a.map(c => c.mul(Q(L)).n);
  let lo = 0; while (ints[lo] === 0) lo++;
  const out = lo > 0 ? [Q(0)] : [];
  const b = ints.slice(lo);
  if (b.length <= 1) return out;
  const divs = n => { n = Math.abs(n); const r = []; for (let i = 1; i <= n; i++) if (n % i === 0) r.push(i); return r; };
  const seen = new Set();
  for (const p of divs(b[0])) for (const q of divs(b[b.length - 1])) for (const s of [1, -1]) {
    const r = Q(s * p, q); const key = r.toString();
    if (seen.has(key)) continue; seen.add(key);
    if (pat(a, r).n === 0) out.push(r);
  }
  return out;
}
const gcdN = (a, b) => { a = Math.abs(a); b = Math.abs(b); while (b) [a, b] = [b, a % b]; return a; };
const lcm = (a, b) => a / gcdN(a, b) * b;

/** a quotient n/d of polynomials */
class Rat {
  constructor(n, d = [Q(1)]) { this.n = n; this.d = d; }
  add(o) { return new Rat(padd(pmul(this.n, o.d), pmul(o.n, this.d)), pmul(this.d, o.d)); }
  neg() { return new Rat(pneg(this.n), this.d); }
  sub(o) { return this.add(o.neg()); }
  mul(o) { return new Rat(pmul(this.n, o.n), pmul(this.d, o.d)); }
  div(o) { if (!o.n.length) throw new Error('division by 0'); return new Rat(pmul(this.n, o.d), pmul(this.d, o.n)); }
  pow(e) {
    const p = e.poly();
    if (!p || deg(p) > 0 || (p[0] ?? Z).d !== 1 || (p[0] ?? Z).n < 0) throw new Error('bad exponent');
    const k = (p[0] ?? Z).n; let r = new Rat([Q(1)]);
    for (let i = 0; i < k; i++) r = r.mul(this);
    return r;
  }
  poly() { const { Q: q, R } = divmod(this.n, this.d); return R.length ? null : q; }
  eq(o) { return peq(pmul(this.n, o.d), pmul(o.n, this.d)); }
}

// ============================================================ text → expression
const plain = s => String(s ?? '').replace(/[−–]/g, '-').replace(/\s+/g, ' ').trim();
/** board TeX → a plain expression string with explicit grouping */
function fromTex(t) {
  let s = String(t ?? '');
  for (let i = 0; i < 8; i++) {
    const b = s;
    s = s.replace(/\\cssId\{[^{}]*\}\{((?:[^{}]|\{[^{}]*\})*)\}/g, '$1')
      .replace(/\\(?:text|mathrm|textbf)\{([^{}]*)\}/g, ' $1 ')
      .replace(/\\[td]?frac\{([^{}]*)\}\{([^{}]*)\}/g, '(($1)/($2))')
      .replace(/\^\{([^{}]*)\}/g, '^($1)');
    if (s === b) break;
  }
  return s.replace(/\\cdot/g, '·').replace(/\\times/g, '×').replace(/\\div/g, '÷').replace(/\\square/g, '☐').replace(/\\left|\\right/g, '')
    .replace(/\\quad|\\qquad|\\[,;:! ]|~/g, ' ').replace(/\\[a-zA-Z]+/g, ' ').replace(/[{}]/g, '').replace(/[−–]/g, '-')
    .replace(/\s+/g, ' ').trim();
}
function tokens(s) {
  const out = [], str = plain(s), re = /\s*(\d+(?:\.\d+)?|\.\d+|x|[-+*·×÷/^()])/y;
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
/** parse → { rat, terms } (terms = the written top-level summands, each with its sign) */
function parse(s) {
  const T = tokens(s);
  let p = 0;
  const peek = () => T[p], next = () => T[p++];
  const startsAtom = t => t !== undefined && (/^[\d.]/.test(t) || t === 'x' || t === '(');
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
    if (/^[\d.]/.test(t)) return new Rat(pc(Q(Number(t))));
    if (t === 'x') return new Rat(X);
    if (t === '(') { const ts = sum(); if (next() !== ')') throw new Error(`missing ) in "${s}"`); return ts.reduce((a, b) => a.add(b)); }
    throw new Error(`unexpected "${t}" in "${s}"`);
  }
  const terms = sum();
  if (p !== T.length) throw new Error(`left over "${T.slice(p).join(' ')}" in "${s}"`);
  return { rat: terms.reduce((a, b) => a.add(b)), terms };
}
const R_ = s => parse(s).rat;
const P = s => { const r = R_(s).poly(); if (!r) throw new Error(`not a polynomial: ${s}`); return r; };
const tryP = s => { try { return P(s); } catch { return null; } };
const tryR = s => { try { return R_(s); } catch { return null; } };
const unparen = s => { s = s.trim(); return /^\(.*\)$/.test(s) && depthOk(s.slice(1, -1)) ? s.slice(1, -1).trim() : s; };
function depthOk(s) { let d = 0; for (const ch of s) { if (ch === '(') d++; else if (ch === ')') { d--; if (d < 0) return false; } } return d === 0; }
const sides = s => { const i = s.indexOf('='); return i < 0 ? null : [s.slice(0, i).trim(), s.slice(i + 1).trim()]; };
/** top-level factors of "(A)(B)(C)" */
function factorsOf(s) {
  s = s.trim(); const out = []; let i = 0;
  while (i < s.length) {
    if (s[i] === ' ') { i++; continue; }
    if (s[i] !== '(') return null;
    let d = 0, j = i;
    for (; j < s.length; j++) { if (s[j] === '(') d++; else if (s[j] === ')') { d--; if (d === 0) break; } }
    out.push(s.slice(i + 1, j)); i = j + 1;
  }
  return out;
}
/** coefficient arrays from the picture data ({p, q} high → low) */
const fromData = arr => trim(arr.map(c => Q(c.p, c.q)).reverse());
const fromRow = s => trim(s.split(',').map(t => Q(plain(t))).reverse());
/** the synthetic bottom row: b0 = a_n, b_j = a_{n-j} + c·b_{j-1} */
function synthRow(Pd, c) {
  const top = Pd.slice().reverse(), out = [];
  top.forEach((a, j) => out.push(j === 0 ? a : a.add(c.mul(out[j - 1]))));
  return out;
}
const num = f => f.n / f.d;
/** a written number, possibly bracketed: "−11", "(−11)", "2/3" */
const numQ = t => { let u = plain(t); while (/^\(.*\)$/.test(u)) u = u.slice(1, -1).trim(); return Q(u); };
/** "A + (S)" with (S) a bracketed group running to the end → [A, S] (the last such top-level split) */
function prodPlusRest(s) {
  s = s.trim();
  if (!s.endsWith(')')) return null;
  let d = 0, open = -1;
  for (let i = s.length - 1; i >= 0; i--) { if (s[i] === ')') d++; else if (s[i] === '(') { d--; if (d === 0) { open = i; break; } } }
  if (open < 0) return null;
  const before = s.slice(0, open).replace(/\s*\+\s*$/, '');
  if (before === s.slice(0, open).trim()) return null;   // no "+" in front of the group
  return [before.trim(), s.slice(open + 1, -1).trim()];
}
/** the quotient factor of a written product of D and Q in either order ("(D)(Q)", "Q(D)", "3x^2(x − 5)"): product ÷ D */
const quotFactor = (prod, D) => { const { Q: qq, R } = divmod(P(prod), D); return R.length ? null : qq; };
const choices = q => (q.choices ?? []).map(plain);
const idxWhere = (q, pred) => { const hits = choices(q).map((c, i) => { try { return pred(c, i) ? i : -1; } catch { return -1; } }).filter(i => i >= 0); return hits.length === 1 ? hits[0] : -1; };
const idxRe = (q, re) => idxWhere(q, c => re.test(c));
const choicePoly = (q, target) => idxWhere(q, c => { const p = tryP(c); return !!p && peq(p, target); });
const choiceRat = (q, target) => idxWhere(q, c => { const r = tryR(c); return !!r && r.eq(target); });
const cOf = D => (deg(D) === 1 && D[1].eq(1) ? D[0].neg() : null);   // x − c → c
const sameRow = (a, b) => a.length === b.length && a.every((x, i) => x.eq(b[i]));
const qrOf = c => { const m = c.match(/^Q = (.+), R = (.+)$/); return m ? [P(m[1]), P(m[2])] : null; };
const powWord = k => (k === 0 ? 'constant term' : k === 1 ? 'x term' : `x^${k} term`);
const coefWord = k => (k === 0 ? 'constant term' : k === 1 ? 'coefficient of x' : `coefficient of x^${k}`);

// ============================================================ the families
const F = {};
const pr = q => plain(q.prompt);
const bd = q => fromTex(q.board);

// pdqr-roles
F.roleName = q => {
  // whole numbers: "This line records a ÷ d: ... Which number is the divisor?"
  const w = pr(q).match(/^This line records (\d+) ÷ (\d+): .+ Which number is the (\w+)\?$/);
  if (w) {
    const a = Number(w[1]), d = Number(w[2]), qq = Math.floor(a / d);
    const t = { dividend: a, divisor: d, quotient: qq, remainder: a - qq * d }[w[3]];
    if (t === undefined) return undefined;
    return idxWhere(q, c => Number(c) === t);
  }
  const m = pr(q).match(/dividing (.+) by (.+?)\. Which expression is the (\w+)\?$/); if (!m) return undefined;
  const Pp = P(m[1]), D = P(m[2]), { Q: qq, R } = divmod(Pp, D);
  const target = { dividend: Pp, divisor: D, quotient: qq, remainder: R }[m[3]];
  if (!target) return undefined;
  return choicePoly(q, target);
};
F.rebuildP = q => {
  const m = pr(q).match(/by (.+) gives the quotient (.+) and the remainder (.+)\. Which polynomial is P\?$/); if (!m) return undefined;
  return choicePoly(q, padd(pmul(P(m[1]), P(m[2])), P(m[3])));
};

// remainder-degree-bound
F.stopCheck = q => {
  const m = pr(q).match(/^Long division by D = (.+) has reached the residual (.+)\. Is the division finished\?$/); if (!m) return undefined;
  const D = P(m[1]), S = P(m[2]);
  const done = S.length === 0 || deg(S) < deg(D);
  return idxRe(q, done ? /^Finished: this residual is the remainder$/ : /^Not finished: another quotient term fits$/);
};
F.remCandidates = q => {
  const m = pr(q).match(/^You divide a polynomial by (.+) and finish the division\./); if (!m) return undefined;
  const D = P(m[1]);
  return idxWhere(q, c => { const r = P(c); return r.length === 0 || deg(r) < deg(D); });
};
F.smallDividend = q => {
  const m = pr(q).match(/^Divide (.+) by (.+)\. Which result is right\?$/); if (!m) return undefined;
  const { Q: qq, R } = divmod(P(m[1]), P(m[2]));
  return idxWhere(q, c => { const r = qrOf(c); return !!r && peq(r[0], qq) && peq(r[1], R); });
};

// reverse-area-model
F.areaSide = q => {
  const m = pr(q).match(/^A rectangle has area (.+) and one side (.+)\. The cells/); if (!m) return undefined;
  const { Q: qq, R } = divmod(P(m[1]), P(m[2]));
  if (R.length || deg(qq) !== 1 || !qq[1].eq(1)) return -1;
  return num(qq[0]);
};
F.areaSide3 = q => {
  const m = pr(q).match(/area (.+) and side (.+) down the left/); if (!m) return undefined;
  const { Q: qq, R } = divmod(P(m[1]), P(m[2]));
  if (R.length || deg(qq) !== 2 || !qq[2].eq(1)) return -1;
  return [num(qq[1]), num(qq[0])];
};

// rational-form-restriction
const denOf = q => { const m = bd(q).match(/^\(\((.+)\)\/\((.+)\)\)$/); return m ? [P(m[1]), P(m[2])] : null; };
F.excluded = q => {
  const nd = denOf(q); if (!nd) return undefined;
  const r = ratRoots(nd[1]);
  return r && r.length === 1 && deg(nd[1]) === 1 ? num(r[0]) : -1;
};
F.restrictionPick = q => {
  const nd = denOf(q); if (!nd) return undefined;
  const D = nd[1], roots = ratRoots(D) ?? [];
  if (deg(D) > 1) return -1;
  return idxWhere(q, c => {
    let m = c.match(/^It has a value for every x except x = (.+)$/);
    if (m) return roots.length === 1 && roots[0].eq(Q(m[1]));
    m = c.match(/^It has a value for every x(, because .*)?$/);
    if (m) {
      if (roots.length) return false;
      // "because D is not the zero polynomial" is no reason (x + 3 is not the zero polynomial either); a bare claim is
      return !m[1];
    }
    return false;
  });
};

// q-plus-r-over-d
F.rewriteQR = q => {
  const m = pr(q).match(/^Use this identity to write (.+) as Q \+ R\/D\. Which is right\?$/); if (!m) return undefined;
  const fr = R_(m[1]), D = fr.d, roots = ratRoots(D) ?? [];
  return idxWhere(q, c => {
    const k = c.match(/^(.+), (?:for (every x|x ≠ (.+))|where (.+) ≠ 0)$/); if (!k) return false;
    if (!R_(k[1]).eq(fr)) return false;
    // "where E ≠ 0" excludes the zeros of E; E must be the divisor itself (up to a constant) to name the right ones
    if (k[4]) { const E = P(k[4]); return deg(E) === deg(D) && (divmod(D, E).R.length === 0); }
    const excl = k[3] ? [Q(k[3])] : [];
    return excl.length === roots.length && excl.every(e => roots.some(r => r.eq(e)));
  });
};
F.qrFill = q => {
  const pf = pr(q).match(/Fill in \((.+)\)\/\((.+)\) = (x \+ )?☐ \+ ☐\/\(.+\), for x ≠ .+\.$/);
  if (pf) {
    const { Q: qq, R } = divmod(P(pf[1]), P(pf[2]));
    if (deg(R) > 0) return -1;
    if (pf[3]) return deg(qq) === 1 && qq[1].eq(1) ? [(qq[0] ?? Z).toString(), (R[0] ?? Z).toString()] : -1;
    return deg(qq) <= 0 ? [(qq[0] ?? Z).toString(), (R[0] ?? Z).toString()] : -1;
  }
  const m = pr(q).match(/Write (-?\d+)\/(\d+) as a whole number plus a fraction\.$/); if (!m) return undefined;
  const a = Number(m[1]), d = Number(m[2]);
  const w = Math.floor(a / d);
  return [w, a - w * d];
};

// zero-remainder-factor
F.isFactor = q => {
  const m = pr(q).match(/^Long division of (.+) by (.+) gives the identity on the board\. Is/); if (!m) return undefined;
  const { R } = divmod(P(m[1]), P(m[2]));
  if (!R.length) return idxWhere(q, c => { const k = c.match(/^Yes: the remainder is 0, so (.+)$/); if (!k) return false; const sd = sides(k[1]); return !!sd && peq(P(sd[0]), P(sd[1])); });
  return idxWhere(q, c => { const k = c.match(/^No: the remainder is (.+), not 0$/); return !!k && peq(P(k[1]), R); });
};
F.factorPick = q => {
  const m = pr(q).match(/^Dividing (.+) by which of these leaves remainder 0\?$/); if (!m) return undefined;
  const Pp = P(m[1]);
  return idxWhere(q, c => divmod(Pp, P(c)).R.length === 0);
};

// ld-layout
function writtenRow(s) {
  // split at top-level + / − into terms and read each as c·x^k, keeping 0x^k terms
  const str = plain(s), parts = [];
  let cur = '', d = 0;
  for (let i = 0; i < str.length; i++) {
    const ch = str[i];
    if (ch === '(') d++; if (ch === ')') d--;
    if (d === 0 && (ch === '+' || ch === '-') && cur.trim() && !/[\^*·×/]\s*$/.test(cur)) { parts.push(cur); cur = ch === '-' ? '-' : ''; continue; }
    cur += ch;
  }
  if (cur.trim()) parts.push(cur);
  return parts.map(t => {
    const u = t.replace(/\s+/g, '');
    const m = u.match(/^([-+]?)(\d+(?:\/\d+)?)?(x(?:\^(\d+))?)?$/);
    if (!m || (!m[2] && !m[3])) throw new Error(`term ${t}`);
    const c = Q(m[2] ?? '1').mul(m[1] === '-' ? -1 : 1);
    return { c, k: m[3] ? Number(m[4] ?? 1) : 0 };
  });
}
const divOf = q => { const m = pr(q).match(/\((.+)\) ÷ \((.+)\)/) ?? pr(q).match(/^Which method can you use for (.+) ÷ \((.+)\)\?$/) ?? pr(q).match(/^Divide (.+?) by (.+?)(?: with any method that fits)?[.:]/); return m ? [P(m[1]), P(m[2])] : null; };
F.layoutRow = q => {
  const dv = divOf(q); if (!dv) return undefined;
  const Pp = dv[0], n = deg(Pp);
  return idxWhere(q, c => {
    const t = writtenRow(c);
    if (t.length !== n + 1) return false;
    if (!t.every((x, i) => x.k === n - i)) return false;
    return t.every(x => x.c.eq(Pp[x.k] ?? Z));
  });
};
F.placeholderCount = q => { const dv = divOf(q); if (!dv) return undefined; return dv[0].filter((c, i) => i < deg(dv[0]) && c.n === 0).length; };

// ld-next-term
F.monoDivide = q => { const m = pr(q).match(/^Divide: (.+) ÷ (.+)\.$/); if (!m) return undefined; return choiceRat(q, R_(m[1]).div(R_(m[2]))); };
F.nextTerm = q => {
  const m = pr(q).match(/^Long division of \((.+)\) ÷ \((.+)\) has reached the residual (.+)\. What is the next term of the quotient\?$/); if (!m) return undefined;
  const S = P(m[3]), D = P(m[2]);
  if (!S.length || deg(S) < deg(D)) return -1;
  return choicePoly(q, mono(S[S.length - 1].div(D[D.length - 1]), deg(S) - deg(D)));
};

// ld-residual-update
F.subtractRow = q => {
  const m = pr(q).match(/the residual is (.+) and the next quotient term is (.+)\. Subtract .+ · \((.+)\)\. What is the new residual\?$/); if (!m) return undefined;
  const r = psub(P(m[1]), pmul(P(m[2]), P(m[3])));
  if (deg(r) > 1) return -1;
  return [num(r[1] ?? Z), num(r[0] ?? Z)];
};
F.updateChoice = q => {
  const m = pr(q).match(/^First cycle of \((.+)\) ÷ \((.+)\): the quotient term is (.+)\. What is the residual after subtracting\?$/); if (!m) return undefined;
  return choicePoly(q, psub(P(m[1]), pmul(P(m[3]), P(m[2]))));
};

// ld-iterate-stop
F.ldFull = q => {
  const m = pr(q).match(/^Divide (.+) by (.+): fill in (.+)\.$/); if (!m) return undefined;
  const { Q: qq, R } = divmod(P(m[1]), P(m[2]));
  if (deg(R) > 0) return -1;
  // "(D)(x + ☐) + ☐": Q = x + a; "(D) · ☐ + ☐": Q is a number
  if (/\(x \+ ☐\) \+ ☐$/.test(m[3])) return deg(qq) === 1 && qq[1].eq(1) ? [num(qq[0]), num(R[0] ?? Z)] : -1;
  if (deg(qq) > 0) return -1;
  return [num(qq[0] ?? Z), num(R[0] ?? Z)];
};
F.ldRemainder = q => {
  const dv = divOf(q); if (!dv || !/What is the remainder\?$/.test(pr(q))) return undefined;
  const { R } = divmod(dv[0], dv[1]);
  if (deg(R) > 0) return -1;
  return (R[0] ?? Z).toString();
};
F.methodDo = F.ldRemainder;
F.ldQuotientPick = q => { const dv = divOf(q); if (!dv) return undefined; return choicePoly(q, divmod(dv[0], dv[1]).Q); };
F.quadDivQ = F.ldQuotientPick;

// ld-nonmonic-linear
F.nonmonicQ = q => {
  const dv = divOf(q); if (!dv) return undefined;
  const { Q: qq } = divmod(dv[0], dv[1]);
  if (deg(qq) !== 1) return -1;
  return [qq[1].toString(), qq[0].toString()];
};
F.nonmonicFrac = q => {
  const dv = divOf(q); if (!dv) return undefined;
  const { Q: qq, R } = divmod(dv[0], dv[1]);
  return idxWhere(q, c => { const r = qrOf(c); return !!r && peq(r[0], qq) && peq(r[1], R); });
};

// ld-quadratic-divisor
F.quadDivR = q => {
  const dv = divOf(q); if (!dv) return undefined;
  const { R } = divmod(dv[0], dv[1]);
  if (deg(R) > 1) return -1;
  return [(R[1] ?? Z).toString(), (R[0] ?? Z).toString()];
};

// sd-scope
F.sdApplies = q => idxWhere(q, c => cOf(P(c)) !== null);
F.sdC = q => {
  const m = pr(q).match(/by (.+?) with synthetic division\. Which number c/); if (!m) return undefined;
  const c = cOf(P(m[1]));
  return c === null ? -1 : c.toString();
};

// sd-coefficient-row
F.coefRow = q => {
  const dv = divOf(q) ?? (() => { const m = pr(q).match(/synthetic division of (.+) by (.+), which is/); return m ? [P(m[1]), P(m[2])] : null; })();
  if (!dv) return undefined;
  const want = dv[0].slice().reverse();
  return idxWhere(q, c => sameRow(c.split(',').map(t => Q(plain(t))), want));
};
F.rowBack = q => {
  const m = pr(q).match(/^The top row of a synthetic-division tableau is (.+)\. Which dividend/); if (!m) return undefined;
  const row = m[1].split(',').map(t => Q(plain(t)));
  if (row[0].n === 0) return -1;
  return choicePoly(q, trim(row.slice().reverse()));
};

// sd-recurrence
const sdOf = q => {
  const m = pr(q).match(/(?:division of|divide|divides) (.+?) by (.+?)(?: with synthetic division| gives|[.;:])/i);
  if (!m) return null;
  const Pp = P(m[1]), D = P(m[2]), c = cOf(D);
  return c === null ? null : { P: Pp, D, c, row: synthRow(Pp, c) };
};
F.sdNext = q => {
  const s = sdOf(q), m = pr(q).match(/The bottom row so far is (.+)\. What is the next bottom entry\?$/); if (!s || !m) return undefined;
  const k = m[1].split(',').length;
  return s.row[k]?.toString() ?? -1;
};
F.sdLast = q => { const s = sdOf(q); if (!s) return undefined; return s.row[s.row.length - 1].toString(); };

// sd-decode
F.sdDecodeQ = q => {
  const s = sdOf(q); if (!s) return undefined;
  const { Q: qq, R } = divmod(s.P, s.D);
  return idxWhere(q, c => { const r = qrOf(c); return !!r && peq(r[0], qq) && peq(r[1], R); });
};
F.sdDecodeCoef = q => {
  const s = sdOf(q); if (!s) return undefined;
  const m = pr(q).match(/What is the (constant term|coefficient of x(?:\^(\d+))?) in the quotient\?$/); if (!m) return undefined;
  const k = m[1] === 'constant term' ? 0 : Number(m[2] ?? 1);
  return (divmod(s.P, s.D).Q[k] ?? Z).toString();
};

// sd-link-long-division
F.linkBottom = q => {
  const m = pr(q).match(/^(.+) is divided by (.+) both ways\. Bottom row: (.+)\. Which long-division number is entry (\d+) \((.+)\)\?$/); if (!m) return undefined;
  const Pp = P(m[1]), D = P(m[2]), j = Number(m[4]), n = deg(Pp);
  const { Q: qq, R } = divmod(Pp, D);
  // entry j (1-based) of the n + 1 entries: the last is the remainder, entry j < n + 1 is the coefficient of x^(n − j) in Q
  const right = j === n + 1 ? /^It is the remainder$/ : new RegExp(`^It is the ${(n - j) === 0 ? 'constant term' : (n - j) === 1 ? 'coefficient of x' : `coefficient of x\\^${n - j}`} (?:in|of) the quotient$`);
  void qq; void R;
  return idxRe(q, right);
};
F.linkWhyAdd = q => {
  if (!/The tableau ADDS/.test(pr(q))) return undefined;
  // the true reason: synthetic division writes c = −(the divisor's constant), so long division's "subtract d·t" is
  // the tableau's "add c·t"; the other reasons are false
  return idxWhere(q, c => {
    const k = c.match(/^Long division subtracts (.+), and subtracting (.+) is the same as adding (.+)$/);
    return !!k && numQ(k[3]).eq(numQ(k[2]).neg());
  });
};

// inspection-rewrite
F.inspectLinear = q => {
  const m = pr(q).match(/^Rewrite \((.+)\)\/\((.+)\) by inspection as ☐ \+ ☐\//); if (!m) return undefined;
  const { Q: qq, R } = divmod(P(m[1]), P(m[2]));
  if (deg(qq) > 0 || deg(R) > 0) return -1;
  return [(qq[0] ?? Z).toString(), (R[0] ?? Z).toString()];
};
F.inspectSquare = q => {
  const m = pr(q).match(/^Rewrite \((.+)\)\/\((.+)\) by inspection as x \+ ☐ \+ ☐\//); if (!m) return undefined;
  const { Q: qq, R } = divmod(P(m[1]), P(m[2]));
  if (deg(qq) !== 1 || !qq[1].eq(1) || deg(R) > 0) return -1;
  return [(qq[0] ?? Z).toString(), (R[0] ?? Z).toString()];
};

// method-select
F.methodPick = q => {
  const dv = divOf(q); if (!dv) return undefined;
  const c = cOf(dv[1]);
  return idxWhere(q, ch => {
    if (/^Synthetic division only/.test(ch)) return false;
    const k = ch.match(/^Long division, or synthetic division with c = (.+)$/);
    if (k) return c !== null && c.eq(Q(plain(k[1])));
    if (/^Long division only: ordinary synthetic division does not fit this divisor$/.test(ch)) return c === null;
    return false;
  });
};

// verify-expand
const claimOf = q => {
  const m = pr(q).match(/divides (.+) by (.+) and gets Q = (.+), R = (.+?)\. (?:Check|Expand)/); if (!m) return null;
  return { P: P(m[1]), D: P(m[2]), Q: P(m[3]), R: P(m[4]) };
};
F.verifyClaim = q => {
  const c = claimOf(q); if (!c) return undefined;
  const ok = peq(padd(pmul(c.D, c.Q), c.R), c.P);
  return idxRe(q, ok ? /^Right: .+ expands to the dividend$/ : /^Wrong: .+ does not expand to the dividend$/);
};
F.firstMismatch = q => {
  const c = claimOf(q); if (!c) return undefined;
  const E = padd(pmul(c.D, c.Q), c.R), top = Math.max(deg(E), deg(c.P));
  for (let k = top; k >= 0; k--) if (!(E[k] ?? Z).eq(c.P[k] ?? Z)) return idxWhere(q, ch => ch === `They first differ at the ${powWord(k)}`);
  return -1;
};

// verify-remainder-bound
F.finishedPick = q => {
  const m = pr(q).match(/^Every pair below makes (.+) = \((.+)\)Q \+ R true\./); if (!m) return undefined;
  const Pp = P(m[1]), D = P(m[2]);
  return idxWhere(q, c => { const r = qrOf(c); return !!r && peq(padd(pmul(D, r[0]), r[1]), Pp) && (r[1].length === 0 || deg(r[1]) < deg(D)); });
};

// numeric-spot-check
F.spotValue = q => {
  const m = pr(q).match(/^Check the claim (.+) at x = (-?\d+)\. What is the value of the (RIGHT|LEFT) side there\?$/); if (!m) return undefined;
  const sd = sides(m[1]);
  return num(pat(P(m[3] === 'RIGHT' ? sd[1] : sd[0]), Q(Number(m[2]))));
};
F.spotVerdict = q => {
  const m = pr(q).match(/^A classmate claims (.+?)\. Checks: (.+)\. What do the checks show\?$/); if (!m) return undefined;
  const sd = sides(m[1]); const L = P(sd[0]), Rr = P(sd[1]);
  const checks = [...m[2].matchAll(/at x = (-?\d+) the left side is (-?\d+) and the right side is (-?\d+)/g)];
  const differ = checks.some(k => !pat(L, Q(Number(k[1]))).eq(pat(Rr, Q(Number(k[1])))));
  if (differ) return idxRe(q, /^The claim is false: one input where the sides differ is enough$/);
  return idxRe(q, /^No error found yet, but checks at a few inputs cannot prove the identity$/);
};

// update-invariant
F.invariantStep = q => {
  const m = pr(q).match(/^Midway through \((.+)\) ÷ \((.+)\): /); if (!m) return undefined;
  // the right line is a true identity that has the form P = D(Q + t) + (S − tD): judge truth, and require the quotient
  // to have gained the stated next term
  const t = P(pr(q).match(/the next quotient term is (.+?)\. Which line/)[1]);
  const D = P(m[2]);
  const bm = pr(q).match(/: (.+?) = (.+) is true, and/); if (!bm) return undefined;
  const sp = prodPlusRest(bm[2]); if (!sp) return -1;
  const Q0 = quotFactor(sp[0], D); if (!Q0) return -1;
  return idxWhere(q, c => {
    const sd = sides(c); if (!sd || !peq(P(sd[0]), P(sd[1]))) return false;
    const k = prodPlusRest(sd[1]); if (!k) return false;
    const Qn = quotFactor(k[0], D);
    return !!Qn && peq(Qn, padd(Q0, t));
  });
};
F.cycleCount = q => {
  const m = pr(q).match(/Dividing (.+) by (.+), at most how many cycles/); if (!m) return undefined;
  return deg(P(m[1])) - deg(P(m[2])) + 1;
};

// domain-identity-contrast
F.domainCheck = q => {
  const m = pr(q).match(/^The identity (.+) gives the quotient form (.+)\. Which is true at x = (.+)\?$/); if (!m) return undefined;
  const r = Q(plain(m[3]));
  const id = sides(m[1]), qf = sides(m[2]);
  const idHolds = pat(P(id[0]), r).eq(pat(P(id[1]), r));
  const L = R_(qf[0]), Rr = R_(qf[1]);
  const defined = x => pat(x.d, r).n !== 0;
  const qHolds = defined(L) && defined(Rr) && pat(L.n, r).div(pat(L.d, r)).eq(pat(Rr.n, r).div(pat(Rr.d, r)));
  if (idHolds && !qHolds && !defined(L)) return idxRe(q, /^The polynomial identity holds at x = .+, but the quotient form has no value there$/);
  if (idHolds && qHolds) return idxRe(q, /^Both hold/);
  if (!idHolds && qHolds) return idxRe(q, /^Only the quotient form holds/);
  if (!idHolds && !qHolds) return idxRe(q, /^Neither holds/);
  return -1;
};
F.domainFix = q => {
  const m = pr(q).match(/^Sam writes (.+)\. What must he add so it is true\?$/); if (!m) return undefined;
  const sd = sides(m[1]); const L = R_(sd[0]), Rr = R_(sd[1]);
  if (!L.eq(Rr)) return -1;   // not true anywhere-but-a-few-points: no restriction fixes it
  const bad = ratRoots(L.d) ?? [];
  return idxWhere(q, c => {
    const k = c.match(/^“for x ≠ (.+)”$/);
    if (k) return bad.length === 1 && bad[0].eq(Q(plain(k[1])));
    if (/^Nothing/.test(c)) return bad.length === 0;
    return false;
  });
};

// apply-known-factor
const splitMonic = (Pp, D) => {
  const { Q: qq, R } = divmod(Pp, D);
  if (R.length || deg(qq) !== 2 || !qq[2].eq(1)) return null;
  const rs = ratRoots(qq);
  if (!rs || !rs.length) return null;
  const r1 = rs[0], r2 = divmod(qq, [r1.neg(), Q(1)]).Q[0].neg();
  return [r1.neg().toString(), r2.neg().toString()];
};
F.factorFull = q => {
  const m = pr(q).match(/^(.+) is a factor of (.+)\. Divide it out/); if (!m) return undefined;
  return splitMonic(P(m[2]), P(m[1])) ?? -1;
};
F.boxDims = q => {
  const m = pr(q).match(/volume (.+) cubic inches and height (.+?) inches\./); if (!m) return undefined;
  return splitMonic(P(m[1]), P(m[2])) ?? -1;
};
F.quotientFirst = q => {
  const m = pr(q).match(/^(.+) is a factor of (.+)\. Which is the complete factorization\?$/); if (!m) return undefined;
  const Pp = P(m[2]);
  return idxWhere(q, c => {
    const fs = factorsOf(c); if (!fs || !peq(P(c), Pp)) return false;
    // complete: no factor of degree 2 or more still has a rational root
    return fs.every(f => { const p = P(f); return deg(p) <= 1 || (ratRoots(p) ?? []).length === 0; });
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
    const pic = q.data?.picture ?? {};
    const p = pr(q), b = bd(q);
    // the board's identity must be true (roleName, rewriteQR, isFactor, domainCheck, spot checks are about a claim)
    if (['roleName', 'rewriteQR', 'isFactor', 'domainCheck'].includes(q.family)) {
      const sd = sides(b);
      if (sd && !peq(P(sd[0]), P(sd[1]))) out.push(`the board identity ${b} is false`);
      // and it must be the finished division (deg R < deg D) by the divisor the prompt names
      const m = p.match(/(?:dividing|division of) (.+?) by (.+?)(?:\. | gives)/) ?? p.match(/write \((.+)\)\/\((.+)\) as/);
      if (sd && m) {
        const { Q: qq, R } = divmod(P(m[1]), P(m[2]));
        const fs = factorsOf(sd[1].replace(/\s*[-+]\s*\d+$/, ''));
        if (fs && fs.length === 2 && !(peq(P(fs[0]), P(m[2])) && peq(P(fs[1]), qq)) && !(peq(P(fs[1]), P(m[2])) && peq(P(fs[0]), qq))) out.push('the board does not show (D)(Q) for this division');
        void R;
      }
    }
    // the long-division layout and the tableau must draw the division in the prompt / on the board
    const dv = (() => { try { return divOf(q); } catch { return null; } })();
    if (pic.ld) {
      const Pd = fromData(pic.ld.P), Dd = fromData(pic.ld.D);
      const src = dv ?? (() => {
        const m = p.match(/(?:Divide|divides|Dividing|division of) (.+?) by (.+?)(?: gives| and| with|[.,:])/);
        return m ? [P(m[1]), P(m[2])] : null;
      })();
      if (src && (!peq(Pd, src[0]) || !peq(Dd, src[1]))) out.push('the long-division picture shows another division');
      if (pic.ld.P.length !== deg(Pd) + 1) out.push('the layout row is not the full row of the dividend');
      if (typeof pic.ld.upto === 'number') {
        const cyc = divmod(Pd, Dd).cycles;
        if (pic.ld.upto > cyc.length) out.push('the layout shows more cycles than the division has');
        // what the layout shows must not give the asked answer away
        if (['nextTerm', 'subtractRow', 'updateChoice', 'invariantStep'].includes(q.family)) {
          const shown = pic.ld.upto + (pic.ld.tNext ? 1 : 0);
          const asked = q.family === 'nextTerm' ? pic.ld.upto : -1;
          if (asked >= 0 && shown > asked) out.push('the layout already shows the asked quotient term');
          if (q.family === 'nextTerm') {
            const m = p.match(/has reached the residual (.+)\. What/);
            const S = pic.ld.upto === 0 ? Pd : cyc[pic.ld.upto - 1].after;
            if (m && !peq(P(m[1]), S)) out.push(`the residual in the prompt is not the one after ${pic.ld.upto} cycles`);
          }
          if (q.family === 'subtractRow' || q.family === 'updateChoice') {
            const m = p.match(/(?:the next quotient term is|the quotient term is) (.+?)\./);
            if (m && !peq(P(m[1]), cyc[pic.ld.upto].t)) out.push('the stated quotient term is not the next one');
            const r = p.match(/the residual is (.+) and/);
            const S = pic.ld.upto === 0 ? Pd : cyc[pic.ld.upto - 1].after;
            if (r && !peq(P(r[1]), S)) out.push('the stated residual is not the current one');
          }
          if (q.family === 'invariantStep') {
            const m = p.match(/the next quotient term is (.+?)\./);
            if (m && !peq(P(m[1]), cyc[pic.ld.upto].t)) out.push('the stated quotient term is not the next one');
            const bm = p.match(/: (.+?) = (.+) is true, and/);
            const sp = bm && prodPlusRest(bm[2]);
            if (bm && !sp) out.push('cannot read the midway line');
            if (sp) {
              const Qs = cyc.slice(0, pic.ld.upto).reduce((a, c) => padd(a, c.t), []);
              const Q0 = quotFactor(sp[0], Dd);
              if (!Q0 || !peq(Q0, Qs) || !peq(P(sp[1]), cyc[pic.ld.upto - 1]?.after ?? Pd)) out.push('the midway line is not the layout state');
            }
          }
        }
      }
    }
    if (pic.sd) {
      const Pd = fromData(pic.sd.P);
      if (pic.sd.P.length !== deg(Pd) + 1) out.push('the tableau row is not the full coefficient row');
      const s = (() => { try { return sdOf(q); } catch { return null; } })();
      const src = dv ?? (s ? [s.P, s.D] : null) ?? (() => {
        const m = p.match(/^(.+) is a factor of (.+?)\./) ?? p.match(/volume (.+) cubic inches and height (.+?) inches/);
        if (!m) return null;
        return /is a factor/.test(p) ? [P(m[2]), P(m[1])] : [P(m[1]), P(m[2])];
      })() ?? (() => { const m = p.match(/divide (.+?) by (.+?) with/); return m ? [P(m[1]), P(m[2])] : null; })();
      if (src && !peq(Pd, src[0])) out.push('the tableau shows another dividend');
      if (pic.sd.cAsk && pic.sd.c) out.push('the box shows c while c is asked');
      if (pic.sd.c && src) { const c = cOf(src[1]); if (!c || !c.eq(Q(pic.sd.c.p, pic.sd.c.q))) out.push('the tableau uses another c'); }
      const row = pic.sd.c ? synthRow(Pd, Q(pic.sd.c.p, pic.sd.c.q)) : null;
      const sofar = p.match(/The bottom row so far is (.+)\. What/) ?? p.match(/(?:its bottom row is|gives the bottom row) (.+?)\. (?:Which|What)/);
      if (row && sofar) {
        const given = sofar[1].split(',').map(t => Q(plain(t)));
        if (!given.every((g, i) => row[i] && g.eq(row[i]))) out.push('the given bottom row is wrong');
        if (/so far/.test(sofar[0]) && pic.sd.upto !== given.length) out.push('the tableau shows a different number of entries');
      }
    }
    if (pic.link) {
      const Pd = fromData(pic.link.P), c = Q(pic.link.c.p, pic.link.c.q), row = synthRow(Pd, c);
      const m = p.match(/^(.+) is divided by (.+) both ways\. Bottom row: (.+)\. Which long-division number is entry (\d+) \((.+)\)\?$/);
      if (m) {
        if (!peq(P(m[1]), Pd) || !cOf(P(m[2]))?.eq(c)) out.push('the picture shows another division');
        const given = m[3].split(',').map(numQ);
        if (!sameRow(given, row)) out.push('the bottom row in the prompt is wrong');
        if (!numQ(m[5]).eq(row[Number(m[4]) - 1])) out.push(`entry ${m[4]} is not ${m[5]}`);
      }
      const w = p.match(/^Dividing (.+) by (.+): the quotient term (.+) times (.+) is (.+)\. The tableau ADDS (.+) · (.+) = (.+) where long division subtracts\. Why\?$/);
      if (w) {
        const D = P(w[2]), t = P(w[3]);
        const { cycles } = divmod(P(w[1]), D);
        if (!cycles.some(cy => peq(cy.t, t))) out.push(`${w[3]} is not a term of the quotient (the terms are ${cycles.map(cy => show(cy.t)).join(', ')})`);
        if (!peq(pmul(t, D), P(w[5]))) out.push(`${w[3]} times ${w[4]} is not ${w[5]}`);
        if (!numQ(w[6]).mul(numQ(w[7])).eq(numQ(w[8]))) out.push(`${w[6]} · ${w[7]} is not ${w[8]}`);
        if (!numQ(w[6]).eq(c)) out.push(`the tableau's c is not ${w[6]}`);
      }
    }
    if (pic.box) {
      const m = p.match(/(?:area) (.+?) and (?:one )?side (.+?)(?: down the left)?\. /);
      if (m) {
        const { Q: qq } = divmod(P(m[1]), P(m[2]));
        const left = pic.box.left.map(s => P(fromTex(s)));
        const tops = [...qq.keys()].reverse().map(k => mono(qq[k], k)).filter(t => t.length);
        if (!peq(left.reduce(padd, []), P(m[2]))) out.push('the box side is not the divisor');
        pic.box.cells.forEach((row, i) => row.forEach((cell, j) => {
          if (!tops[j] || !peq(P(fromTex(cell)), pmul(left[i], tops[j]))) out.push(`box cell ${i},${j} ${cell} is not a partial product`);
        }));
      }
    }
    // stated facts in the prompts
    let m = p.match(/^(-?\d+) = (\d+) × (-?\d+) \+ (-?\d+)\. Write/);
    if (m) { const [a, d, w, r] = m.slice(1, 5).map(Number); if (a !== d * w + r || r < 0 || r >= d) out.push(`${m[0]} is not the whole-number division`); }
    m = p.match(/Hint: (.+) = \((.+)\)\((.+)\)\.$/);
    if (m && !peq(P(m[1]), pmul(P(m[2]), P(m[3])))) out.push('the hint identity is false');
    if (q.family === 'spotVerdict') {
      const k = p.match(/^A classmate claims (.+?)\. Checks: (.+)\. What/);
      if (k) {
        const sd = sides(k[1]); const L = P(sd[0]), Rr = P(sd[1]);
        for (const c of k[2].matchAll(/at x = (-?\d+) the left side is (-?\d+) and the right side is (-?\d+)/g)) {
          const x = Q(Number(c[1]));
          if (!pat(L, x).eq(Q(Number(c[2]))) || !pat(Rr, x).eq(Q(Number(c[3])))) out.push(`the check at x = ${c[1]} is miscalculated`);
        }
      }
    }
    if (q.family === 'finishedPick') {
      const k = p.match(/^Every pair below makes (.+) = \((.+)\)Q \+ R true\./);
      if (k) for (const c of cs) { const r = qrOf(c); if (r && !peq(padd(pmul(P(k[2]), r[0]), r[1]), P(k[1]))) out.push(`"${c}" does not make it true`); }
    }
    if (q.family === 'verifyClaim') {
      const c = claimOf(q);
      if (c && c.R.length && deg(c.R) >= deg(c.D)) out.push('the claimed remainder is not below the divisor degree');
    }
    if (q.family === 'domainFix' || q.family === 'domainCheck') {
      const k = p.match(/(?:Sam writes|quotient form) (.+?)(?:\. What|\. Which)/);
      if (k) { const sd = sides(k[1]); const L = R_(sd[0]), Rr = R_(sd[1]); if (!L.eq(Rr)) out.push('the quotient form is not equal to P/D'); }
    }
    if (q.family === 'boxDims') {
      const k = p.match(/volume (.+) cubic inches and height (.+?) inches\./);
      if (k) { const d = splitMonic(P(k[1]), P(k[2])); if (d && d.some(v => Number(v) < 0)) out.push('a box side x minus something can be negative'); }
    }
  } catch (e) { out.push(`cannot read: ${e.message}`); }
  return out.join('; ');
}
/** a short plain writing of a polynomial (for messages) */
function show(a) {
  if (!a.length) return '0';
  return [...a.keys()].reverse().filter(k => a[k].n !== 0).map(k => `${a[k]}${k ? (k > 1 ? `x^${k}` : 'x') : ''}`).join(' + ');
}

export default { solve, sane };
