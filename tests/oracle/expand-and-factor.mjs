// Oracle for the lesson "expand-and-factor" (expand, combine and factor linear expressions, grade 7). Written from
// what the student sees only: the prompt, the board and the choices. Every expression is parsed into an exact
// polynomial (coefficients as Q fractions, monomials in any letters) and compared by value, so "equivalent" means
// equal for every value of the letters. Properties are named from the shape of the two sides (order changed, grouping
// changed, a factor times a sum), statements about checks are judged by evaluating the expressions.
// See docs/lessons/QUALITY_LAYER.md, "O: the oracle".
import { Q, texPlain, choiceWhere } from '../../tools/quality/oracle-kit.mjs';

// ---------------------------------------------------------------- polynomials
const clean = s => String(s ?? '').replace(/[−–]/g, '-').replace(/[’‘]/g, "'").replace(/·/g, '*').replace(/×/g, '*').replace(/÷/g, '/').trim();
function dec(t) {
  const m = String(t).match(/^(\d*)(?:\.(\d+))?$/);
  if (!m || (m[1] === '' && !m[2])) throw new Error(`not a number: ${t}`);
  const d = m[2] ? 10 ** m[2].length : 1;
  return Q(Number((m[1] || '0') + (m[2] || '')), d);
}
/** a polynomial: Map monomial key ('' | 'x' | 'x^2' | 'xy') → Q (no zero entries) */
const keyOf = vars => Object.keys(vars).sort().map(v => (vars[v] === 1 ? v : `${v}^${vars[v]}`)).join('');
const parseKey = k => { const o = {}; for (const m of k.matchAll(/([a-z])(?:\^(\d+))?/gi)) o[m[1]] = Number(m[2] ?? 1); return o; };
const P = (k, c) => { const m = new Map(); if (c.n !== 0) m.set(k, c); return m; };
const constP = c => P('', c);
function padd(a, b, s = 1) {
  const m = new Map(a);
  for (const [k, c] of b) { const v = (m.get(k) ?? Q(0)).add(s < 0 ? c.neg() : c); if (v.n === 0) m.delete(k); else m.set(k, v); }
  return m;
}
function pmul(a, b) {
  let m = new Map();
  for (const [ka, ca] of a) for (const [kb, cb] of b) {
    const va = parseKey(ka), vb = parseKey(kb);
    for (const [v, e] of Object.entries(vb)) va[v] = (va[v] ?? 0) + e;
    m = padd(m, P(keyOf(va), ca.mul(cb)));
  }
  return m;
}
const isConst = a => [...a.keys()].every(k => k === '');
const cval = a => a.get('') ?? Q(0);
const peq = (a, b) => a.size === b.size && [...a].every(([k, c]) => b.has(k) && b.get(k).eq(c));
const coef = (a, k) => a.get(k) ?? Q(0);

/** parse an expression in letters into a polynomial; '□' / '?' throw */
function parse(text) {
  const s = clean(text);
  const toks = [];
  const re = /\s*(\d+\.?\d*|\.\d+|[A-Za-z]|[-+*/^()])/y;
  let i = 0;
  while (i < s.length) {
    if (/\s/.test(s[i])) { i++; continue; }
    re.lastIndex = i;
    const m = re.exec(s);
    if (!m) throw new Error(`bad char in "${s}"`);
    toks.push(m[1]); i = re.lastIndex;
  }
  let p = 0;
  const peek = () => toks[p], next = () => toks[p++];
  function expr() {
    let v = term();
    while (peek() === '+' || peek() === '-') { const o = next(); v = padd(v, term(), o === '+' ? 1 : -1); }
    return v;
  }
  function term() {
    let v = unary();
    for (;;) {
      const t = peek();
      if (t === '*') { next(); v = pmul(v, unary()); }
      else if (t === '/') { next(); const d = unary(); if (!isConst(d) || cval(d).n === 0) throw new Error('bad divisor'); v = pmul(v, constP(Q(1).div(cval(d)))); }
      else if (t !== undefined && (t === '(' || /^[\d.A-Za-z]/.test(t))) v = pmul(v, power());
      else break;
    }
    return v;
  }
  function unary() {
    if (peek() === '-') { next(); return pmul(constP(Q(-1)), unary()); }
    if (peek() === '+') { next(); return unary(); }
    return power();
  }
  function power() {
    let b = primary();
    if (peek() === '^') { next(); const e = Number(next()); let r = constP(Q(1)); for (let k = 0; k < e; k++) r = pmul(r, b); b = r; }
    return b;
  }
  function primary() {
    const t = next();
    if (t === '(') { const v = expr(); if (next() !== ')') throw new Error('missing )'); return v; }
    if (t === undefined) throw new Error('unexpected end');
    if (/^[A-Za-z]$/.test(t)) return P(t, Q(1));
    if (/^[\d.]/.test(t)) return constP(dec(t));
    throw new Error(`unexpected ${t}`);
  }
  const v = expr();
  if (p !== toks.length) throw new Error(`trailing tokens in "${s}"`);
  return v;
}
const tryParse = t => { try { return parse(t); } catch { return null; } };
const at = (a, vals) => { let s = Q(0); for (const [k, c] of a) { let t = c; for (const [v, e] of Object.entries(parseKey(k))) for (let i = 0; i < e; i++) t = t.mul(vals[v]); s = s.add(t); } return s; };
const num = t => { const s = clean(t); const m = s.match(/^(-?)(\d+)\/(\d+)$/); if (m) return Q(Number(m[2]), Number(m[3])).mul(m[1] ? -1 : 1); return s.startsWith('-') ? dec(s.slice(1)).neg() : dec(s); };
const gcdI = (a, b) => { a = Math.abs(a); b = Math.abs(b); while (b) [a, b] = [b, a % b]; return a; };

/** the signed top-level terms of an expression text: '3 − 3k + 11' → ['3', '-3k', '11'] */
function topTerms(text) {
  const s = clean(text).replace(/\s+/g, '');
  const out = []; let depth = 0, cur = '';
  for (let i = 0; i < s.length; i++) {
    const ch = s[i];
    if (ch === '(') depth++;
    if (ch === ')') depth--;
    if (depth === 0 && (ch === '+' || ch === '-') && cur !== '' && !/[*/^]$/.test(cur)) { out.push(cur); cur = ch === '-' ? '-' : ''; continue; }
    cur += ch;
  }
  if (cur) out.push(cur);
  return out;
}

// ---------------------------------------------------------------- shapes (which property)
/** the property that turns side a into side b: 'commutative' | 'associative' | 'distributive' | 'none' */
function propertyOf(a, b) {
  const A = tryParse(a), B = tryParse(b);
  if (!A || !B || !peq(A, B)) return 'none';
  const sa = clean(a).replace(/\s+/g, ''), sb = clean(b).replace(/\s+/g, '');
  const prodOfSum = s => /(\d|[a-z]|\))\(|\)(\d|[a-z]|\()/i.test(s) && /\([^()]*[-+][^()]*\)/.test(s);
  // a factor times a sum on one side only (or a sum turned into a factor times a sum): distributive
  const flat = s => s.replace(/[()]/g, '');
  if (prodOfSum(sa) !== prodOfSum(sb)) return 'distributive';
  if (flat(sa) === flat(sb)) return 'associative';
  // the same pieces in another order: commutative (signed terms of a sum, or factors of a product)
  const pieces = s => (/[-+]/.test(flat(s).replace(/^-/, '')) ? topTerms(flat(s)) : flat(s).split('*'));
  const ps = x => pieces(x).slice().sort().join('|');
  if (ps(sa) === ps(sb)) return 'commutative';
  return 'other';
}

// ---------------------------------------------------------------- reading the item
const board = q => texPlain(q.board ?? '');
/** the expression after "Expand:", "Combine like terms:", "Simplify:", ... */
function asked(q) {
  const m = q.prompt.match(/^(?:Expand(?:, then combine)?|Combine(?: like terms)?|Simplify|Add|Subtract|Multiply|Factor completely|Factor out the greatest common factor):\s*(.*)$/);
  return m ? m[1].replace(/\.$/, '') : null;
}
/** the answer of a pair item "□x + □" from a polynomial */
function pairOf(q, poly) {
  const v = (q.pair?.op ?? '').trim().match(/^([a-z])\s*\+$/i)?.[1];
  if (!v) return undefined;
  if ([...poly.keys()].some(k => k !== '' && k !== v)) return undefined;
  let a = coef(poly, v), b = cval(poly);
  const lead = (q.pair?.lead ?? '').trim();
  if (lead) {
    const k = num(lead.replace(/\($/, ''));
    a = a.div(k); b = b.div(k);
  }
  return [a.value, b.value];
}
const choicePoly = (q, target) => choiceWhere(q, c => { const p = tryParse(c); return !!p && peq(p, target); });
/** a factored choice k(…) / kx(…) / x(…) that equals target with nothing common left inside */
function completeFactor(q, target) {
  return choiceWhere(q, c => {
    const m = clean(c).match(/^(.*?)\((.*)\)$/);
    if (!m) return false;
    const outer = tryParse(m[1] === '-' ? '-1' : m[1] || '1'), inner = tryParse(m[2]);
    if (!outer || !inner || !peq(pmul(outer, inner), target)) return false;
    const cs = [...inner.values()];
    if (cs.some(x => x.d !== 1)) return true;   // fractional parts: not a whole-number factoring question
    const g = cs.reduce((s, x) => gcdI(s, x.n), 0);
    if (g !== 1) return false;
    // no letter common to every inner term
    const keys = [...inner.keys()];
    const common = keys.length ? Object.keys(parseKey(keys[0])).filter(v => keys.every(k => v in parseKey(k))) : [];
    return common.length === 0;
  });
}

// ---------------------------------------------------------------- families
const F = {};

F.equalSign = q => {
  const p = clean(q.prompt);
  let m;
  if ((m = p.match(/What number goes in the box\? (.*) = □ \+ (.*)$/))) return at(parse(m[1]), {}).sub(at(parse(m[2]), {})).value;
  if ((m = p.match(/writes: (.*)\. True or false\?/))) {
    const parts = m[1].split('=').map(x => at(parse(x), {}));
    const ok = parts.every(v => v.eq(parts[0]));
    return choiceWhere(q, c => {
      const k = clean(c).match(/^False: (.*) is (-?[\d.]+), not (-?[\d.]+)$/);
      if (k) return !ok && at(parse(k[1]), {}).eq(num(k[2])) && !num(k[2]).eq(num(k[3])) && parts.some(v => v.eq(num(k[3])));
      return /^True: every step is worked out right/.test(c) ? ok : false;
    });
  }
  if ((m = p.match(/True or false\? (.*) = (.*)$/))) {
    const L = at(parse(m[1]), {}), R = at(parse(m[2]), {});
    return choiceWhere(q, c => {
      let k;
      if ((k = clean(c).match(/^True: both sides are worth (-?[\d.]+)$/))) return L.eq(R) && L.eq(num(k[1]));
      if ((k = clean(c).match(/^False: the left side is (-?[\d.]+), the right side is (-?[\d.]+)$/))) return !L.eq(R) && L.eq(num(k[1])) && R.eq(num(k[2]));
      return false;   // "both have a 4", "2 + 2 is 4", "the answer comes after =", "11 is bigger": not reasons for (in)equality
    });
  }
  return undefined;
};

F.likeTerms = q => {
  const p = clean(q.prompt);
  let m;
  if ((m = p.match(/Which term is a like term of (.*)\?$/))) {
    const k = [...parse(m[1]).keys()][0];
    return choiceWhere(q, c => { const t = tryParse(c); return !!t && t.size === 1 && [...t.keys()][0] === k; });
  }
  if (/What do \w and \w really stand for\?/.test(p)) return choiceWhere(q, c => /^Numbers: each letter can stand for any value/.test(c));
  if ((m = p.match(/Can (.*) be written with fewer terms\?/))) {
    const e = parse(m[1]), n = topTerms(m[1]).length;
    if (e.size < n) return choiceWhere(q, c => { const k = clean(c).match(/^Yes: it is (.*)$/); return !!k && peq(parse(k[1]), e); });
    return choiceWhere(q, c => /^No: .* are unlike terms/.test(c));
  }
  if ((m = p.match(/What is the coefficient of ([a-z]) in (.*)\?$/))) return coef(parse(m[2]), m[1]).value;
  return undefined;
};

F.property = q => {
  const m = clean(q.prompt).match(/Which property makes this true\? (.*) = (.*)$/);
  const kind = propertyOf(m[1], m[2]);
  const pat = { commutative: /^Commutative/, associative: /^Associative/, distributive: /^Distributive/, none: /^None/ }[kind];
  return pat ? choiceWhere(q, c => pat.test(c)) : undefined;
};

F.areaToSum = q => {
  const m = clean(q.prompt).match(/its area is (.*)\. Write the area as a sum/);
  return pairOf(q, parse(m[1]));
};
F.areaToProduct = q => {
  const m = clean(q.prompt).match(/has the area (.*)\. Which product/);
  return choicePoly(q, parse(m[1]));
};

/** the two expressions of a board "A \quad B" */
const twoOf = q => {
  const b = String(q.board ?? '').split(/\\quad|\\qquad/).map(x => texPlain(x).trim()).filter(Boolean);
  return b.length === 2 ? b : null;
};
F.equivalent = q => {
  const two = twoOf(q);
  if (!two) return undefined;
  const [A, B] = two.map(parse), same = peq(A, B);
  return choiceWhere(q, c => {
    let k;
    if ((k = clean(c).match(/^No: at x = (-?[\d.]+) they are (-?[\d.]+) and (-?[\d.]+)$/))) {
      const x = num(k[1]);
      return !same && at(A, { x }).eq(num(k[2])) && at(B, { x }).eq(num(k[3])) && !num(k[2]).eq(num(k[3]));
    }
    if (/^Yes: they are equal for every x/.test(c)) return same;
    return false;   // one matching value, "look the same", "only when x = 0": not the meaning of equivalent
  });
};

const pairQ = q => pairOf(q, parse(asked(q)));
F.expand = q => (q.input === 'pair' ? pairQ(q) : choicePoly(q, parse(asked(q))));
F.collect = q => {
  const e = parse(asked(q));
  if (q.input === 'num') {
    const v = q.unit?.trim();
    if (!v || [...e.keys()].some(k => k !== v)) return undefined;
    return coef(e, v).value;
  }
  if (q.input === 'pair') return pairOf(q, e);
  return choicePoly(q, e);
};
F.expandCollect = q => pairQ(q);

F.signedTerms = q => {
  const p = clean(q.prompt);
  let m;
  if (/minus sign in front of the parentheses is the same as multiplying by which number/.test(p)) return -1;
  if ((m = p.match(/What is the coefficient of ([a-z]) in (.*)\?$/))) return coef(parse(m[2]), m[1]).value;
  if ((m = p.match(/What are the terms of (.*)\?$/))) {
    const ts = topTerms(m[1]).map(parse);
    return choiceWhere(q, c => { const cs = c.split(',').map(x => tryParse(x)); return cs.length === ts.length && cs.every((x, i) => x && peq(x, ts[i])); });
  }
  if ((m = p.match(/Which expression is the same as (.*)\?$/))) return choicePoly(q, parse(m[1]));
  return undefined;
};

F.subtract = q => {
  const p = clean(q.prompt);
  let e;
  const m = p.match(/^Subtract (.*) from (.*)\.$/);
  if (m) e = padd(parse(m[2]), parse(m[1]), -1);
  else e = parse(asked(q));
  return q.input === 'pair' ? pairOf(q, e) : choicePoly(q, e);
};

F.factorOut = q => {
  const p = clean(q.prompt);
  let m;
  if ((m = p.match(/^Factor out (\S+): (.*) = /))) return pairOf(q, parse(m[2]));
  if ((m = p.match(/^Can you factor (\S+) out of (.*)\?$/))) {
    const e = parse(m[2]), k = num(m[1]);
    return choiceWhere(q, c => {
      const x = clean(c).match(/^Yes: (.*)$/);
      if (!x) return false;
      const y = x[1].match(/^(-?[\d./]+)\((.*)\)$/);
      return !!y && num(y[1]).eq(k) && peq(pmul(constP(k), parse(y[2])), e);
    });
  }
  return undefined;
};

F.gcf = q => completeFactor(q, parse(asked(q)));

F.twoFactorings = q => {
  const p = clean(q.prompt);
  const m = p.match(/The task says (factor(?: completely)?) (.*?)\. (\w+) writes (.*?)\. (\w+) writes (.*?)\. Who is right/);
  const target = parse(m[2]), complete = /completely/.test(m[1]);
  const okA = peq(parse(m[4]), target), okB = peq(parse(m[6]), target);
  const gcfDone = s => { const y = s.match(/^(.*?)\((.*)\)$/); const inner = parse(y[2]); return [...inner.values()].reduce((g, x) => gcdI(g, x.n), 0) === 1; };
  const a = okA && (!complete || gcfDone(m[4])), b = okB && (!complete || gcfDone(m[6]));
  if (a && b) return choiceWhere(q, c => /^Both/.test(c));
  if (a) return choiceWhere(q, c => c.startsWith(`Only ${m[3]}`));
  if (b) return choiceWhere(q, c => c.startsWith(`Only ${m[5]}`));
  return choiceWhere(q, c => /^Neither/.test(c));
};

F.twoVar = q => {
  const p = clean(q.prompt);
  let m;
  if ((m = p.match(/^Factor completely: (.*)$/))) return completeFactor(q, parse(m[1]));
  if ((m = p.match(/^Simplify: (.*)$/))) return choicePoly(q, parse(m[1]));
  return undefined;
};

F.nameStep = q => {
  const p = clean(q.prompt);
  let m;
  if (/only writes the answer/.test(p)) {
    // "show that" asks for the chain of steps with their reasons; a bare answer shows nothing
    return choiceWhere(q, c => /^No: each step needs its reason/.test(c));
  }
  if ((m = p.match(/Which property justifies this step\? (.*) = (.*)$/))) {
    const kind = propertyOf(m[1], m[2]);
    const pat = { commutative: /^Commutative/, associative: /^Associative/, distributive: /^Distributive/ }[kind];
    return pat ? choiceWhere(q, c => pat.test(c)) : undefined;
  }
  return undefined;
};

F.faultyStep = q => {
  const rows = String(q.board).replace(/\\begin\{aligned\}|\\end\{aligned\}/g, '').split(/\\\\/)
    .map(r => texPlain(r.replace(/\\text\{step \d+\}/g, '').replace(/=\{\}/g, '').replace(/&/g, ' ')).trim()).filter(Boolean);
  const polys = rows.map(parse);
  for (let i = 1; i < polys.length; i++) if (!peq(polys[i], polys[i - 1])) return choiceWhere(q, c => c.trim() === `Step ${i}`);
  return choiceWhere(q, c => /^No step/.test(c));
};

F.counter = q => {
  const p = clean(q.prompt);
  let m;
  if ((m = p.match(/^Are (.*) and (.*) equivalent\?$/))) {
    const A = parse(m[1]), B = parse(m[2]), same = peq(A, B);
    return choiceWhere(q, c => {
      const k = clean(c).match(/^No: the first one is (.*)$/);
      if (k) return !same && peq(parse(k[1]), A);
      const y = clean(c).match(/^Yes: the first one is (.*)$/);
      if (y) return same && peq(parse(y[1]), A);
      return false;   // matching at one value or starting with the same number proves nothing
    });
  }
  const two = twoOf(q);
  if (!two) return undefined;
  const [A, B] = two.map(parse), same = peq(A, B);
  if (/What shows they are equivalent\?/.test(p)) {
    // only a rewrite that holds for every x shows it (the three values are a check, not a proof)
    return same ? choiceWhere(q, c => /turns one into the other, for every x/.test(c)) : -1;
  }
  if ((m = p.match(/differ at x = (-?[\d.]+)\./))) {
    const x = num(m[1]);
    const differs = !at(A, { x }).eq(at(B, { x }));
    return differs ? choiceWhere(q, c => /^Not equivalent: one value where they differ is enough/.test(c)) : -1;
  }
  if (/Which check shows that .* are NOT equivalent\?/.test(p)) {
    return choiceWhere(q, c => {
      const k = clean(c).match(/^x = (-?[\d.]+): they give (-?[\d.]+) and (-?[\d.]+)$/);
      if (!k) return false;
      const x = num(k[1]);
      return at(A, { x }).eq(num(k[2])) && at(B, { x }).eq(num(k[3])) && !num(k[2]).eq(num(k[3]));
    });
  }
  return undefined;
};

F.context = q => {
  const p = clean(q.prompt);
  let m;
  if ((m = p.match(/costs \$x and an? (.*?) that costs \$(\d+)\. The cost of (\d+) (\w+) is (\d+)\(x \+ (\d+)\) or (\d+)x \+ (\d+) dollars\. What does the (\d+) in/))) {
    const each = Number(m[2]), n = Number(m[3]), asked = Number(m[9]);
    if (asked === n * each) return choiceWhere(q, c => new RegExp(`^The cost of the ${n} `).test(c));
    return undefined;
  }
  if ((m = p.match(/The cost of (\d+) \w+ is (\d+\(x \+ \d+\)) or (\d+x \+ \d+) dollars\. Which form shows the cost of ONE (.*?) right inside it/))) {
    return choiceWhere(q, c => c.startsWith(`${m[2]}: the x + `));
  }
  if ((m = p.match(/is (\d+\(x \+ \d+\)) or (\d+x \+ \d+) dollars\. \w+ says the two forms describe two different shopping trips/))) {
    const same = peq(parse(m[1]), parse(m[2]));
    return choiceWhere(q, c => (same ? /^No: they are equal for every x/.test(c) : /^Yes: different forms/.test(c)));
  }
  if ((m = p.match(/Its perimeter is (.*?) or (.*?)\. Which form shows "(.*)"\?/))) {
    const prod = m[1].includes('(') ? m[1] : m[2], sum = m[1].includes('(') ? m[2] : m[1];
    // "…, twice" is a product of the sum; "two lengths plus two widths" is a sum of two products
    const want = /twice$/.test(m[3]) ? prod : sum;
    return choiceWhere(q, c => c.trim() === want);
  }
  return undefined;
};

F.monomial = q => choicePoly(q, parse(asked(q)));

F.monoFactor = q => {
  const p = clean(q.prompt);
  let m;
  if ((m = p.match(/^Fill in: (.*) = (.*)\( \? \)$/))) {
    const target = parse(m[1]), outer = parse(m[2] === '-' ? '-1' : m[2]);
    return choiceWhere(q, c => { const x = tryParse(c); return !!x && peq(pmul(outer, x), target); });
  }
  if ((m = p.match(/^Factor out the greatest common factor: (.*)$/))) return completeFactor(q, parse(m[1]));
  return undefined;
};

export function solve(q) {
  const f = F[q.family];
  return f ? f(q) : undefined;
}

// ---------------------------------------------------------------- the world
export function sane(q) {
  const out = [];
  // (a factor of 0, "Expand: 0(3k + 8)", is intended: the topic JSON names a zero multiplier as a contrast case)
  let s; try { s = solve(q); } catch { s = undefined; }
  if (q.input === 'choice' && s === -1) out.push('no single right choice');
  if (q.family === 'equivalent' || q.family === 'counter') {
    const m = clean(q.prompt).match(/When x = (-?[\d.]+), (.*) and (.*) are both (-?[\d.]+)\./) ?? clean(q.prompt).match(/^(.*) and (.*) match at x = (-?[\d.]+)/);
    if (m && /^When/.test(clean(q.prompt))) {
      const x = num(m[1]), v = num(m[4]);
      if (!at(parse(m[2]), { x }).eq(v) || !at(parse(m[3]), { x }).eq(v)) out.push('the stated matching value is wrong');
    }
  }
  return [...new Set(out)].join('; ');
}

export default { solve, sane };
