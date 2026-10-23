// Oracle for the lesson "one-step-inequalities" (one-step equations and inequalities with rational numbers, grade 7).
// Written from what the student sees only: the prompt, the board TeX (where the plain text loses a fraction bar,
// n/−3 shows as "n−3"), the choices and, for the graph item, the number line drawn (the boundary mark, open or closed
// dot, and the shaded direction). Equations and inequalities are parsed into exact linear forms and solved here; a
// choice is judged by its own content (its solution set, the value it substitutes, the operation it names and whether
// that operation keeps or reverses the order). Answer-side picture fields (test marks, the solution board) are not
// read. See docs/lessons/QUALITY_LAYER.md, "O: the oracle".
import { Q, choiceWhere } from '../../tools/quality/oracle-kit.mjs';

// ---------------------------------------------------------------- linear forms a·v + b
const clean = s => String(s ?? '').replace(/[−–]/g, '-').replace(/[’‘]/g, "'");
function dec(t) {
  const m = String(t).match(/^(\d*)(?:\.(\d+))?$/);
  if (!m || (m[1] === '' && !m[2])) throw new Error(`not a number: ${t}`);
  return Q(Number((m[1] || '0') + (m[2] || '')), m[2] ? 10 ** m[2].length : 1);
}
const lin = (a, b) => ({ a, b });
const K = b => lin(Q(0), b);
const add = (x, y, s = 1) => lin(s > 0 ? x.a.add(y.a) : x.a.sub(y.a), s > 0 ? x.b.add(y.b) : x.b.sub(y.b));
function mul(x, y) {
  if (x.a.n !== 0 && y.a.n !== 0) throw new Error('not linear');
  return x.a.n === 0 ? lin(y.a.mul(x.b), y.b.mul(x.b)) : lin(x.a.mul(y.b), x.b.mul(y.b));
}
function div(x, y) { if (y.a.n !== 0 || y.b.n === 0) throw new Error('bad divisor'); return lin(x.a.div(y.b), x.b.div(y.b)); }
function closeOf(s, i) { let d = 0; for (let j = i; j < s.length; j++) { if (s[j] === '{') d++; if (s[j] === '}' && --d === 0) return j; } return -1; }
/** TeX → plain maths: \frac{a}{b} → ((a)/(b)), \le → ≤ … */
function texPlainMath(tex) {
  let s = String(tex ?? '');
  for (let g = 0; g < 20; g++) {
    const m = s.match(/(\d*)\\[dt]?frac\{/);
    if (!m) break;
    const at = m.index + m[1].length, a0 = s.indexOf('{', at), a1 = closeOf(s, a0), b1 = closeOf(s, a1 + 1);
    const f = `((${s.slice(a0 + 1, a1)})/(${s.slice(a1 + 2, b1)}))`;
    s = s.slice(0, m.index) + (m[1] ? `(${m[1]}+${f})` : f) + s.slice(b1 + 1);
  }
  return s.replace(/\\le(q)?\b/g, '≤').replace(/\\ge(q)?\b/g, '≥').replace(/\\times|\\cdot/g, '*').replace(/\\div/g, '/')
    .replace(/\\Rightarrow/g, '⇒').replace(/\\left|\\right/g, '').replace(/\\[,;:! ]|\\quad|\\qquad/g, ' ').replace(/\\text\{[^{}]*\}/g, ' ')
    .replace(/[{}]/g, '').replace(/\s+/g, ' ').trim();
}
/** parse a linear expression in one letter (plain text: fractions a/b bind as one number) */
function parseLin(text) {
  const s = clean(text).replace(/(\d+(?:\.\d+)?)\/(\d+(?:\.\d+)?)/g, '(($1)/($2))').replace(/×|·/g, '*').replace(/÷/g, '/').replace(/\$/g, '');
  const toks = s.match(/\d+\.?\d*|\.\d+|[A-Za-z]|[-+*/()]/g) ?? [];
  let p = 0;
  let letter = null;
  const peek = () => toks[p], next = () => toks[p++];
  function expr() { let v = term(); while (peek() === '+' || peek() === '-') { const o = next(); v = add(v, term(), o === '+' ? 1 : -1); } return v; }
  function term() {
    let v = unary();
    for (;;) {
      const t = peek();
      if (t === '*') { next(); v = mul(v, unary()); }
      else if (t === '/') { next(); v = div(v, unary()); }
      else if (t !== undefined && (t === '(' || /^[\d.A-Za-z]/.test(t))) v = mul(v, primary());
      else break;
    }
    return v;
  }
  function unary() { if (peek() === '-') { next(); return mul(K(Q(-1)), unary()); } if (peek() === '+') { next(); return unary(); } return primary(); }
  function primary() {
    const t = next();
    if (t === '(') { const v = expr(); if (next() !== ')') throw new Error('missing )'); return v; }
    if (t !== undefined && /^[A-Za-z]$/.test(t)) { if (letter && letter !== t) throw new Error('two letters'); letter = t; return lin(Q(1), Q(0)); }
    if (t !== undefined && /^[\d.]/.test(t)) return K(dec(t));
    throw new Error(`unexpected ${t} in "${s}"`);
  }
  const v = expr();
  if (p !== toks.length) throw new Error(`trailing tokens in "${s}"`);
  v.letter = letter;
  return v;
}
const REL = /(≤|≥|<|>|=)/;
const FLIP = { '<': '>', '>': '<', '≤': '≥', '≥': '≤', '=': '=' };
/** "lhs REL rhs" → the solution { v, rel, bound } (rel '=' for an equation; 'none' / 'all' when a = 0) */
function solveRel(text) {
  const parts = clean(text).split(REL);
  if (parts.length !== 3) throw new Error(`not one relation: ${text}`);
  const L = parseLin(parts[0]), R = parseLin(parts[2]);
  const a = L.a.sub(R.a), c = R.b.sub(L.b), rel = parts[1];
  if (a.n === 0) return { v: L.letter ?? R.letter, rel: holds(Q(0), rel, c) ? 'all' : 'none' };
  return { v: L.letter ?? R.letter, rel: a.n < 0 ? FLIP[rel] : rel, bound: c.div(a), a };
}
function holds(x, rel, y) {
  const k = x.cmp(y);
  return rel === '<' ? k < 0 : rel === '>' ? k > 0 : rel === '≤' ? k <= 0 : rel === '≥' ? k >= 0 : k === 0;
}
/** does value x satisfy "lhs REL rhs"? */
function satisfies(text, x) {
  const parts = clean(text).split(REL);
  const L = parseLin(parts[0]), R = parseLin(parts[2]);
  return holds(L.a.mul(x).add(L.b), parts[1], R.a.mul(x).add(R.b));
}
const num = t => { const s = clean(t).trim(); const m = s.match(/^(-?)(\d+(?:\.\d+)?)\/(\d+)$/); if (m) return dec(m[2]).div(Number(m[3])).mul(m[1] ? -1 : 1); return s.startsWith('-') ? dec(s.slice(1)).neg() : dec(s); };
/** a choice "k ≤ 18.5" / "k = 18.5 only" / "0 < s ≤ 12.5" → { lo, loIn, hi, hiIn, eq } */
function setOf(text) {
  const t = clean(text).replace(/ only$/, '').replace(/\s/g, '');
  let m;
  const N = '(-?\\d+(?:\\.\\d+)?(?:/\\d+)?)';
  if ((m = t.match(new RegExp(`^${N}(<|≤)[a-z](<|≤)${N}$`)))) return { lo: num(m[1]), loIn: m[2] === '≤', hi: num(m[4]), hiIn: m[3] === '≤' };
  if ((m = t.match(new RegExp(`^[a-z](≤|≥|<|>|=)${N}$`)))) {
    const x = num(m[2]);
    if (m[1] === '=') return { eq: x };
    if (m[1] === '<' || m[1] === '≤') return { hi: x, hiIn: m[1] === '≤' };
    return { lo: x, loIn: m[1] === '≥' };
  }
  return null;
}
const sameSet = (A, B) => !!A && !!B && ['lo', 'hi', 'eq'].every(k => (A[k] === undefined) === (B[k] === undefined) && (A[k] === undefined || A[k].eq(B[k])))
  && (A.lo === undefined || A.loIn === B.loIn) && (A.hi === undefined || A.hiIn === B.hiIn);
const asSet = s => (s.rel === '=' ? { eq: s.bound } : s.rel === '<' || s.rel === '≤' ? { hi: s.bound, hiIn: s.rel === '≤' } : { lo: s.bound, loIn: s.rel === '≥' });
/** the board relation (before any ⇒) */
const boardRel = q => texPlainMath(q.board).split('⇒')[0].replace(/\*\s*\(-?[\d.]+\)\s*$/, '').trim();
const ans = (q, x) => (q.input === 'frac' ? x.pair : x.value);

// ---------------------------------------------------------------- families
const F = {};

const solveFam = q => {
  const s = solveRel(boardRel(q));
  if (s.rel === 'all' || s.rel === 'none') return undefined;
  if (q.input === 'choice') return choiceWhere(q, c => sameSet(setOf(c), asSet(s)) || (s.rel === '=' && /No solution/.test(c) && false));
  return ans(q, s.bound);
};
F.solveAdd = solveFam;
F.solveScale = solveFam;

F.graph = q => {
  const P = q.data?.picture?.params;
  const mk = P?.marks?.[0], st = P?.sets?.[0];
  if (!mk) return undefined;
  const v = Q(mk.v), closed = mk.dot === 'closed';
  const shown = !st ? { eq: v } : st.dir < 0 ? { hi: v, hiIn: closed } : { lo: v, loIn: closed };
  return choiceWhere(q, c => { try { const s = solveRel(c); return s.rel !== 'all' && s.rel !== 'none' && sameSet(asSet(s), shown); } catch { return false; } });
};

F.testPoint = q => {
  const p = clean(q.prompt);
  const m = p.match(/^Which value of ([a-z]) (does not make|makes) (.*) true\?/);
  const rel = boardRel(q);
  const want = m[2] === 'makes';
  return choiceWhere(q, c => { const k = clean(c).match(/= (.*)$/); return !!k && satisfies(rel, num(k[1])) === want; });
};

F.boundaryNum = q => solveRel(boardRel(q)).bound.value;

F.contextCount = q => {
  const p = clean(q.prompt);
  const s = solveRel(boardRel(q));
  // whole things only: the fewest that reach "at least", the most that stay within "at most"
  if (s.rel === '≥' || s.rel === '>') { let n = Math.ceil(s.bound.value - 1e-12); if (s.rel === '>' && s.bound.eq(Q(n))) n++; return n; }
  if (s.rel === '≤' || s.rel === '<') { let n = Math.floor(s.bound.value + 1e-12); if (s.rel === '<' && s.bound.eq(Q(n))) n--; return n; }
  return /fewest/.test(p) ? Math.ceil(s.bound.value) : Math.floor(s.bound.value);
};

/** the solution set of an amount that cannot be negative (a length, a weight, a time left …) */
function amountSet(s, strictZero) {
  const S = asSet(s);
  if (S.hi !== undefined && S.lo === undefined) return { lo: Q(0), loIn: !strictZero, hi: S.hi, hiIn: S.hiIn };
  return S;
}
F.contextSet = q => {
  const s = solveRel(boardRel(q));
  return choiceWhere(q, c => sameSet(setOf(c), amountSet(s, false)));
};
F.geometry = q => {
  const s = solveRel(boardRel(q));
  // a side, a width, a height or an angle is more than 0
  return choiceWhere(q, c => sameSet(setOf(c), amountSet(s, true)));
};

const eqFam = q => {
  const p = clean(q.prompt);
  const s = solveRel(boardRel(q));
  if (s.rel === 'all' || s.rel === 'none') return undefined;
  if (q.input === 'choice') {
    if (/^Which value of/.test(p)) return choiceWhere(q, c => { const k = clean(c).match(/= (.*)$/); return !!k && num(k[1]).eq(s.bound); });
    return choiceWhere(q, c => sameSet(setOf(c), asSet(s)));
  }
  return ans(q, s.bound);
};
F.addEq = eqFam;
F.mulEq = eqFam;
F.ratEq = eqFam;

/** the one operation that isolates the letter in "lhs REL rhs": { kind: 'add'|'sub'|'mul'|'div', k } */
function moveOf(text) {
  const parts = clean(text).split(REL);
  const side = /[a-z]/.test(parts[0]) ? parts[0] : parts[2];
  const L = parseLin(side);
  if (!L.a.eq(Q(1))) {
    // k·v or v/k: dividing by k, or multiplying by the divisor when written v/k
    const tex = String(side);
    return { kind: L.b.n === 0 ? 'scale' : 'mixed', k: L.a };
  }
  return { kind: L.b.n >= 0 ? 'sub' : 'add', k: L.b.n >= 0 ? L.b : L.b.neg() };
}
F.flipMap = q => {
  const p = clean(q.prompt);
  let m;
  if ((m = p.match(/^(-?[\d.]+) (<|>|≤|≥) (-?[\d.]+) is true\. Now (multiply|divide|add|subtract) (?:both numbers by |)(-?[\d.]+)(?: to both numbers| from both numbers)?\. Which is true\?/))) {
    const k0 = num(m[5]);
    const op = x => (m[4] === 'multiply' ? x.mul(k0) : m[4] === 'divide' ? x.div(k0) : m[4] === 'add' ? x.add(k0) : x.sub(k0));
    const a = op(num(m[1])), b = op(num(m[3]));
    return choiceWhere(q, c => { const k = clean(c).match(/^(-?[\d.]+) (<|>|=|≤|≥) (-?[\d.]+)$/); return !!k && num(k[1]).eq(a) && num(k[3]).eq(b) && holds(a, k[2], b); });
  }
  if (/do you keep or reverse the inequality symbol\?/.test(p)) {
    const rel = boardRel(q), mv = moveOf(rel);
    const texSide = texPlainMath(q.board);
    if (mv.kind === 'add' || mv.kind === 'sub') {
      return choiceWhere(q, c => { const k = clean(c).match(/^Keep it: you (add|subtract) (-?[\d.]+)$/); return !!k && k[1].slice(0, 3) === mv.kind && num(k[2]).eq(mv.k); });
    }
    if (mv.kind === 'scale') {
      const neg = mv.k.n < 0;
      // written v/k → multiply by k; written k·v → divide by k
      const quotient = /\(\([a-z]\)\/\((-?[\d.]+)\)\)/.exec(texSide);
      return choiceWhere(q, c => {
        const k = clean(c).match(/^Reverse it: you (divide|multiply) both sides by (-?[\d./]+), a negative number$/);
        if (!neg) return false;
        if (!k) return false;
        if (quotient) return k[1] === 'multiply' && num(k[2]).eq(num(quotient[1]));
        return k[1] === 'divide' && num(k[2]).eq(mv.k);
      }) ?? -1;
    }
  }
  return undefined;
};

F.justify = q => {
  const p = clean(q.prompt);
  let m;
  if (/Why do the boundary plus one test value on each side confirm the whole answer/.test(p)) {
    // one side of the statement only grows or only shrinks, so it switches true/false once, at the boundary
    return choiceWhere(q, c => /can switch between true and false only once: at the boundary/.test(c));
  }
  if ((m = p.match(/^Which property justifies the step from (.*) to (.*)\?$/))) {
    const [from, to] = texPlainMath(q.board).split('⇒').map(x => x.trim());
    const s = solveRel(from), t = solveRel(to);
    if (!sameSet(asSet(s), asSet(t))) return -1;   // the step itself is wrong
    const mv = moveOf(from), quotient = /\(\([a-z]\)\/\((-?[\d.]+)\)\)/.exec(from);
    if (mv.kind === 'add' || mv.kind === 'sub') return choiceWhere(q, c => /^Adding or subtracting the same number on both sides keeps the order\.$/.test(c));
    const neg = mv.k.n < 0, verb = quotient ? 'Multiplying' : 'Dividing';
    return choiceWhere(q, c => clean(c) === `${verb} both sides by the same ${neg ? 'negative number reverses' : 'positive number keeps'} the order.`);
  }
  return undefined;
};

F.signedContext = q => {
  const p = clean(q.prompt);
  const rel = (p.match(/\(([^()]*(?:\([^()]*\)[^()]*)*)\)\s*$/) ?? [])[1] ?? boardRel(q);
  const s = solveRel(rel);
  if (q.input !== 'choice') return ans(q, s.bound);
  const words = { '≥': /^at least (\S+) hours \(h ≥/, '>': /^more than (\S+) hours \(h >/, '≤': /^at most (\S+) hours \(h ≤/, '<': /^less than (\S+) hours \(h </ };
  if (/hours/.test(q.choices.join())) return choiceWhere(q, c => { const k = clean(c).match(words[s.rel] ?? /^$/); return !!k && num(k[1]).eq(s.bound); });
  return choiceWhere(q, c => sameSet(setOf(c), asSet(s)));
};

export function solve(q) {
  const f = F[q.family];
  return f ? f(q) : undefined;
}

// ---------------------------------------------------------------- the world
export function sane(q) {
  const out = [], p = clean(q.prompt);
  let s; try { s = solve(q); } catch { s = undefined; }
  if (q.input === 'choice' && s === -1) out.push('no single right choice');
  // the equation in brackets must say what the story says
  if (q.family === 'signedContext' || q.family === 'geometry' || q.family === 'contextSet') {
    const m = p.match(/\(([^()]*(?:\([^()]*\)[^()]*)*)\)\s*$/);
    if (m && boardRel(q).replace(/\s/g, '') !== '' ) {
      try { const a = solveRel(m[1]), b = solveRel(boardRel(q)); if (!sameSet(asSet(a), asSet(b))) out.push('the bracketed equation and the board differ'); } catch { /* fine */ }
    }
  }
  return [...new Set(out)].join('; ');
}

export default { solve, sane };
