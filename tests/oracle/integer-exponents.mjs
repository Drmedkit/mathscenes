// Oracle for the lesson "integer-exponents" (properties of integer exponents, zero and negative exponents, grade 8).
// Written from what the student sees only: the prompt, the board and the choices (read from their HTML, because the
// plain text drops stacked fractions and superscripts: 4²/5² shows as "4^25^2"). Every expression is evaluated
// exactly: numbers as Q fractions, letter terms as monomials with integer exponents (a ≠ 0 is given), so "equal" means
// the same value / the same monomial. Arguments are judged by what they claim: a true equation that uses the product
// rule, or 1 ÷ 0, or "examples do not cover every base". See docs/lessons/QUALITY_LAYER.md, "O: the oracle".
import { Q, choiceWhere } from '../../tools/quality/oracle-kit.mjs';

// ---------------------------------------------------------------- monomial sums with integer exponents
const clean = s => String(s ?? '').replace(/[−–]/g, '-').replace(/[’‘]/g, "'").replace(/[“”]/g, '"');
function dec(t) {
  const m = String(t).match(/^(\d*)(?:\.(\d+))?$/);
  if (!m || (m[1] === '' && !m[2])) throw new Error(`not a number: ${t}`);
  return Q(Number((m[1] || '0') + (m[2] || '')), m[2] ? 10 ** m[2].length : 1);
}
const keyOf = v => Object.keys(v).filter(k => v[k] !== 0).sort().map(k => `${k}^${v[k]}`).join('');
const parseKey = k => { const o = {}; for (const m of k.matchAll(/([a-z])\^(-?\d+)/g)) o[m[1]] = Number(m[2]); return o; };
const P = (k, c) => { const m = new Map(); if (c.n !== 0) m.set(k, c); return m; };
const C = c => P('', c);
function padd(a, b, s = 1) {
  const m = new Map(a);
  for (const [k, c] of b) { const v = (m.get(k) ?? Q(0)).add(s < 0 ? c.neg() : c); if (v.n === 0) m.delete(k); else m.set(k, v); }
  return m;
}
function pmul(a, b) {
  let m = new Map();
  for (const [ka, ca] of a) for (const [kb, cb] of b) {
    const v = parseKey(ka);
    for (const [x, e] of Object.entries(parseKey(kb))) v[x] = (v[x] ?? 0) + e;
    m = padd(m, P(keyOf(v), ca.mul(cb)));
  }
  return m;
}
function pinv(a) {
  if (a.size !== 1) throw new Error('cannot divide by a sum');
  const [[k, c]] = [...a];
  if (c.n === 0) throw new Error('div0');
  const v = parseKey(k);
  for (const x of Object.keys(v)) v[x] = -v[x];
  return P(keyOf(v), Q(1).div(c));
}
function ppow(a, e) {
  if (!Number.isInteger(e)) throw new Error('bad exponent');
  if (e === 0) { if (a.size === 0) throw new Error('0^0'); return C(Q(1)); }
  let r = C(Q(1));
  const base = e < 0 ? pinv(a) : a;
  for (let i = 0; i < Math.abs(e); i++) r = pmul(r, base);
  return r;
}
const peq = (a, b) => a.size === b.size && [...a].every(([k, c]) => b.has(k) && b.get(k).eq(c));
const cval = a => { if ([...a.keys()].some(k => k !== '')) throw new Error('not a number'); return a.get('') ?? Q(0); };

/** evaluate a plain expression: numbers, letters, + - * / · × ÷ ^ ( ); a/b of plain numbers is one fraction */
function ev(text) {
  const s = clean(text).replace(/(^|[^\d.)^])(\d+)\/(\d+)(?![\d^])/g, '$1(($2)/($3))').replace(/×|·/g, '*').replace(/÷/g, '/').replace(/\s+/g, ' ');
  const toks = s.match(/\d+\.?\d*|\.\d+|[a-z]|[-+*/^()]/g) ?? [];
  let p = 0;
  const peek = () => toks[p], next = () => toks[p++];
  function expr() { let v = term(); while (peek() === '+' || peek() === '-') { const o = next(); v = padd(v, term(), o === '+' ? 1 : -1); } return v; }
  function term() {
    let v = unary();
    for (;;) {
      const t = peek();
      if (t === '*') { next(); v = pmul(v, unary()); }
      else if (t === '/') { next(); v = pmul(v, pinv(unary())); }
      else if (t !== undefined && (t === '(' || /^[\d.a-z]/.test(t))) v = pmul(v, power());
      else break;
    }
    return v;
  }
  function unary() { if (peek() === '-') { next(); return pmul(C(Q(-1)), unary()); } if (peek() === '+') { next(); return unary(); } return power(); }
  function power() {
    const b = primary();
    if (peek() === '^') {
      next();
      let e;
      if (peek() === '(') { next(); e = cval(expr()); next(); }
      else if (peek() === '-') { next(); e = cval(primary()).neg(); }
      else e = cval(primary());
      if (e.d !== 1) throw new Error('fraction exponent');
      return ppow(b, e.n);
    }
    return b;
  }
  function primary() {
    const t = next();
    if (t === '(') { const v = expr(); if (next() !== ')') throw new Error('missing )'); return v; }
    if (t !== undefined && /^[a-z]$/.test(t)) return P(`${t}^1`, Q(1));
    if (t !== undefined && /^[\d.]/.test(t)) return C(dec(t));
    throw new Error(`unexpected ${t} in "${s}"`);
  }
  const v = expr();
  if (p !== toks.length) throw new Error(`trailing tokens in "${s}"`);
  return v;
}
const tryEv = t => { try { return ev(t); } catch { return null; } };
/** choice HTML → plain maths: fraction spans as ((a)/(b)), <sup>e</sup> as ^(e) */
function htmlMath(h) {
  let s = String(h ?? '').replace(/&nbsp;|&#160;/g, ' ').replace(/&minus;/g, '-').replace(/<\/?i>/g, '');
  for (let g = 0; g < 10; g++) {
    const before = s;
    s = s.replace(/<sup>([^<]*)<\/sup>/g, '^($1)');
    s = s.replace(/<span class="fr"><span>([^<]*)<\/span><span>([^<]*)<\/span><\/span>/g, '(($1)/($2))');
    if (s === before) break;
  }
  return clean(s.replace(/<[^>]+>/g, ''));
}
const choiceText = (q, i) => (q.choicesHtml ? htmlMath(q.choicesHtml[i]) : clean(q.choices[i]));
/** a choice value: the expression before a ":" reason; with "=", every side must agree */
function choiceVal(q, i) {
  const t = choiceText(q, i).split(':')[0];
  const sides = t.split('=').map(x => tryEv(x));
  if (sides.some(x => !x)) return null;
  return sides.every(x => peq(x, sides[0])) ? sides[0] : null;
}
const pickEqual = (q, target) => choiceWhere(q, (c, i) => { const v = choiceVal(q, i); return !!v && peq(v, target); });
/** the integer e with base^e = value */
function expOf(base, value) {
  for (let e = -12; e <= 12; e++) { try { if (peq(ppow(base, e), value)) return e; } catch { /* 0^0 */ } }
  // big powers: a number base, by logarithms (exact Q arithmetic would overflow)
  try {
    const b = cval(base).value, v = cval(value).value;
    if (b > 0 && v > 0) { const e = Math.round(Math.log(v) / Math.log(b)); if (Math.abs(b ** e / v - 1) < 1e-9) return e; }
  } catch { /* letters */ }
  // a letter base: the exponent of that letter in a single term
  if (base.size === 1 && value.size === 1) {
    const [kb] = [...base.keys()], [kv, cv] = [...value][0];
    const vb = parseKey(kb), vv = parseKey(kv), x = Object.keys(vb)[0];
    if (Object.keys(vb).length === 1 && vb[x] === 1 && cv.eq(Q(1)) && Object.keys(vv).every(k => k === x)) return vv[x] ?? 0;
  }
  return undefined;
}
const ans = (q, x) => { const v = cval(x); return q.input === 'frac' ? v.pair : v.value; };

// ---------------------------------------------------------------- families
const F = {};

/** "Write X as one power of B" / "X = B to what power?" / "X = y to what power?" */
function exponentQ(q) {
  const p = clean(q.prompt);
  let m;
  if ((m = p.match(/^Write (.*) as one power of (.*?)\. Type the exponent\.$/))) return expOf(ev(m[2]), ev(m[1]));
  if ((m = p.match(/^(.*) = (\(?[\w./]+\)?) to what power\?/))) return expOf(ev(m[2]), ev(m[1]));
  if ((m = p.match(/^(.*) is (\d+) to what power, and what is its value\? Type the value\.$/))) return ans(q, ev(m[1]));
  return null;
}
/** "What is X?" / "Find the value: X." / "Find the value of X." / "Use a rule …: X." / "Write X as a decimal/fraction." */
function valueQ(q) {
  const p = clean(q.prompt).replace(/ \(a minus sign goes in the top box\)| A decimal or a fraction is fine\.| \(a decimal is fine\)/g, '');
  let m;
  if ((m = p.match(/(?:What is|Find the value of|Find the value:|then find the value:) (.*?)[.?]$/))) return ans(q, ev(m[1]));
  if ((m = p.match(/^Write (.*) as a (decimal|fraction)\.$/))) return ans(q, ev(m[1]));
  return null;
}
const numFam = q => { const e = exponentQ(q); if (e !== null && e !== undefined) return e; const v = valueQ(q); return v === null ? undefined : v; };
for (const f of ['prodExp', 'quotExp', 'powPow', 'powQuot', 'negBase', 'zeroExp', 'tenDec', 'tenExp', 'negExp', 'minusPair', 'zeroMix', 'lawVal', 'sumPow', 'monoExp']) {
  F[f] = q => (q.input === 'choice' ? pickQ(q) : numFam(q));
}
/** choice families: "Which is equal to X?", "What is X?", "Which number is equal to X?", "Write X as one power.", "Simplify X …" */
function pickQ(q) {
  const p = clean(q.prompt);
  let m;
  if ((m = p.match(/^(?:Which is equal to|What is|Which number is equal to) (.*)\?$/))) return pickEqual(q, ev(m[1]));
  if ((m = p.match(/^Write (.*) as one power\.$/))) return pickEqual(q, ev(m[1]));
  if ((m = p.match(/^Simplify (.*?)(?:, with [a-z, ]+ ≠ 0| as far as you can)\.$/))) {
    // "15bx^3 ÷ 3b^6x^3": the board draws it as one fraction, top over bottom
    const parts = m[1].split('÷');
    return pickEqual(q, parts.length === 2 ? ev(`(${parts[0]})/(${parts[1]})`) : ev(m[1]));
  }
  return undefined;
}
for (const f of ['prodPick', 'quotPick', 'powProd', 'negSame', 'negWhich', 'monoPick']) F[f] = q => pickQ(q);

F.zeroContrast = q => choiceWhere(q, (c, i) => choiceText(q, i).split(',').every(eq => {
  const [l, r] = eq.split('=');
  const a = tryEv(l), b = tryEv(r);
  return !!a && !!b && peq(a, b);
}));

/** a true equation chain in an argument ("a = b = c"): every side has the same value */
function trueChain(t) {
  const parts = t.split('=').map(x => x.replace(/[,.]?\s*(and|so|but|would).*$/, '').trim()).filter(Boolean);
  if (parts.length < 2) return false;
  const vs = parts.map(tryEv);
  return vs.every(v => v && peq(v, vs[0]));
}
F.justify = q => {
  const p = clean(q.prompt);
  let m;
  const T = i => choiceText(q, i);
  if ((m = p.match(/says (\d+)\^\(?0\)? = 0, "because there are no \d+s\." Which argument shows \w+ is wrong\?/))) {
    // a counter-example by the product rule: b^n × b^0 = b^n, which is not 0
    return choiceWhere(q, (c, i) => { const k = T(i).match(/^Then (.*?) would be 0, but the product rule says it is (.*?) = (\d+)\.$/); return !!k && peq(ev(k[2]), ev(k[3])) && cval(ev(k[3])).n !== 0; });
  }
  if ((m = p.match(/^Why must (\d+)\^\(?0\)? be 1\?$/))) {
    return choiceWhere(q, (c, i) => { const t = T(i); const eqs = t.split(',')[0]; return /\^\(0\)/.test(eqs) && trueChain(eqs) && /only multiplying by 1 changes nothing/.test(t); });
  }
  if (/^Why does 0\^-?\(?-?1\)? have no value\?$/.test(p) || /^Why does 0\^/.test(p)) return choiceWhere(q, (c, i) => /would be 1 ÷ 0, and dividing by 0 has no value/.test(T(i)));
  if (/Does that prove a\^\(?0\)? = 1 for every nonzero a\?/.test(p)) return choiceWhere(q, (c, i) => /^No: examples do not cover every base\. The product rule argument does/.test(T(i)));
  if ((m = p.match(/^Why must (\d+)\^-(\d+) be 1\/(\d+)\?$/))) {
    return choiceWhere(q, (c, i) => { const t = T(i); const k = t.match(/^(.*?), so .* is the number that multiplies (\d+) to make 1\.$/); return !!k && trueChain(k[1]) && Number(k[2]) === Number(m[1]) ** Number(m[2]); });
  }
  return undefined;
};

export function solve(q) {
  const f = F[q.family];
  return f ? f(q) : undefined;
}

// ---------------------------------------------------------------- the world
export function sane(q) {
  const out = [];
  let s; try { s = solve(q); } catch { s = undefined; }
  if (q.input === 'choice' && s === -1) out.push('no single right choice');
  if (q.input === 'choice' && typeof s === 'number' && s >= 0 && /^(prodPick|quotPick|powProd|negSame|negWhich|monoPick)$/.test(q.family)) {
    const v = choiceVal(q, s);
    const twins = (q.choices ?? []).filter((_, i) => i !== s && (() => { const w = choiceVal(q, i); return w && v && peq(w, v); })());
    if (twins.length) out.push('two choices have the same value');
  }
  return [...new Set(out)].join('; ');
}

export default { solve, sane };
