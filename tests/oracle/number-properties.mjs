// number-properties oracle (role O, docs/lessons/QUALITY_LAYER.md). Works every practice item out from what the
// student sees: the board TeX (exact: fractions, roots, repeat bars), the plain choices, the prompt, and the claim
// table / chain slate of the picture. Numbers are held exactly as r + Σ c·π^e·√k (k square-free), so "rational"
// means "only the plain part is left"; roots of non-squares, π and their products are irrational (√k for square-free
// k > 1 and π^e are independent over the rationals). Property names come from the shape of the rewrite (two
// operands swapped, the grouping moved, a factor spread over a sum, an identity element dropped); claims are judged
// by their maths, never by wording that sounds like the lesson.
//
// Families with many right answers (differAt, ownValue, counterType): solve returns one valid value (the first
// small whole number that works, scanned 1, 2, 3, …, then 0, −1, …) so the sweep can type it through check().
import { Q } from '../../tools/quality/oracle-kit.mjs';

// ================================================================ exact numbers r + Σ c·π^e·√k
const gcdI = (a, b) => { a = Math.abs(a); b = Math.abs(b); while (b) [a, b] = [b, a % b]; return a; };
function sqfree(n) {   // n = s² · k with k square-free
  let s = 1, k = 1;
  for (let p = 2; p * p <= n; p++) { let e = 0; while (n % p === 0) { n /= p; e++; } s *= p ** Math.floor(e / 2); if (e % 2) k *= p; }
  return [s, k * n];
}
class S {
  constructor(m = new Map()) { this.m = m; }   // key "e|k" → Frac (nonzero)
  static q(f) { const m = new Map(); if (f.n !== 0) m.set('0|1', f); return new S(m); }
  static term(c, e, k) { const m = new Map(); if (c.n !== 0) m.set(`${e}|${k}`, c); return new S(m); }
  static int(n) { return S.q(Q(n)); }
  add(o) { const m = new Map(this.m); for (const [k, v] of o.m) { const s = (m.get(k) ?? Q(0)).add(v); if (s.n === 0) m.delete(k); else m.set(k, s); } return new S(m); }
  neg() { const m = new Map(); for (const [k, v] of this.m) m.set(k, v.neg()); return new S(m); }
  sub(o) { return this.add(o.neg()); }
  mul(o) {
    let r = new S();
    for (const [k1, v1] of this.m) for (const [k2, v2] of o.m) {
      const [e1, r1] = k1.split('|').map(Number), [e2, r2] = k2.split('|').map(Number);
      const g = gcdI(r1, r2);
      r = r.add(S.term(v1.mul(v2).mul(g), e1 + e2, (r1 / g) * (r2 / g)));
    }
    return r;
  }
  div(o) {
    if (o.isZero()) throw new Error('undefined: division by 0');
    if (o.m.size !== 1) throw new Error('division by a sum of roots');
    const [[k, c]] = [...o.m];
    const [e, r] = k.split('|').map(Number);
    return this.mul(S.term(Q(1).div(c.mul(r)), -e, r));
  }
  pow(n) {
    if (!n.isRational() || n.rat().d !== 1) throw new Error('non-integer power');
    let p = n.rat().n;
    if (p < 0) return S.int(1).div(this.pow(S.int(-p)));
    if (p === 0 && this.isZero()) throw new Error('0^0');
    let r = S.int(1);
    while (p-- > 0) r = r.mul(this);
    return r;
  }
  sqrt() {
    if (!this.isRational()) throw new Error('root of an irrational');
    const q = this.rat();
    if (q.n < 0) throw new Error('not real: root of a negative');
    if (q.n === 0) return new S();
    const [s, k] = sqfree(q.n * q.d);
    return S.term(Q(s, q.d), 0, k);
  }
  isZero() { return this.m.size === 0; }
  isRational() { return [...this.m.keys()].every(k => k === '0|1'); }
  rat() { return this.m.get('0|1') ?? Q(0); }
  eq(o) { return this.sub(o).isZero(); }
  approx() { let s = 0; for (const [k, v] of this.m) { const [e, r] = k.split('|').map(Number); s += v.value * Math.PI ** e * Math.sqrt(r); } return s; }
}

// ================================================================ text / TeX → tokens → AST
function normTex(t) {
  let s = String(t);
  s = s.replace(/\\overset\{\?\}\{=\}/g, '=').replace(/\\left|\\right/g, '');
  for (let i = 0; i < 8; i++) {
    const b = s;
    s = s.replace(/\\[tdc]?frac\{([^{}]*)\}\{([^{}]*)\}/g, (_, a, d) => (/^-?\d+$/.test(a.trim()) && /^\d+$/.test(d.trim()) ? `${a.trim()}/${d.trim()}` : `((${a})/(${d}))`))
      .replace(/\\sqrt\{([^{}]*)\}/g, '√($1)').replace(/\\overline\{(\d+)\}/g, '[$1]').replace(/\^\{([^{}]*)\}/g, '^($1)');
    if (s === b) break;
  }
  return s.replace(/\\cdot/g, '·').replace(/\\times/g, '×').replace(/\\div/g, '÷').replace(/\\pi/g, 'π').replace(/\\square/g, '□')
    .replace(/\\ldots/g, '…').replace(/\\[,;:! ]/g, ' ').replace(/\\q?quad/g, ' ').replace(/[{}]/g, ' ').replace(/\s+/g, ' ').trim();
}
function tokenize(str) {
  const s = String(str).replace(/[−–]/g, '-'), out = [];
  let i = 0;
  while (i < s.length) {
    const c = s[i];
    if (/\s/.test(c)) { i++; continue; }
    const rest = s.slice(i);
    let m = rest.match(/^(\d+)(?:\.(\d*))?(?:\[(\d+)\])?(?:\/(\d+)(?![\d.[]))?/);
    if (m && /\d/.test(c)) { out.push({ t: 'n', int: m[1], fr: m[2] ?? '', rep: m[3] ?? '', over: m[4] }); i += m[0].length; continue; }
    if (/[a-zA-Z□]/.test(c)) { out.push({ t: 'v', name: c }); i++; continue; }
    if (c === 'π') { out.push({ t: 'pi' }); i++; continue; }
    if (c === '√') { out.push({ t: 'sqrt' }); i++; continue; }
    if ('+-·×*÷/^()='.includes(c)) { out.push({ t: 'o', o: c === '·' || c === '×' ? '*' : c === '÷' ? '/' : c }); i++; continue; }
    throw new Error(`cannot read "${c}" in ${str}`);
  }
  return out;
}
function litValue(tk) {
  let v = Q(Number(tk.int));
  if (tk.fr) v = v.add(Q(Number(tk.fr), 10 ** tk.fr.length));
  if (tk.rep) v = v.add(Q(Number(tk.rep), 10 ** tk.fr.length * (10 ** tk.rep.length - 1)));
  return v;
}
function parse(str) {
  const T = tokenize(str);
  let p = 0;
  const peek = () => T[p], isO = o => T[p]?.t === 'o' && T[p].o === o;
  const startsAtom = tk => tk && (tk.t === 'v' || tk.t === 'pi' || tk.t === 'sqrt' || (tk.t === 'o' && tk.o === '('));
  function expr() {
    let a = term();
    while (isO('+') || isO('-')) { const o = T[p++].o; a = { t: 'op', op: o, l: a, r: term() }; }
    return a;
  }
  function term() {
    let a = unary();
    for (;;) {
      if (isO('*') || isO('/')) { const o = T[p++].o; a = { t: 'op', op: o, l: a, r: unary() }; continue; }
      if (startsAtom(peek())) { a = { t: 'op', op: '*', l: a, r: power(), imp: true }; continue; }
      break;
    }
    return a;
  }
  function unary() {
    if (isO('-')) { p++; const a = unary(); return a.t === 'n' && !a.negd ? { ...a, negd: true, q: a.q?.neg() } : { t: 'neg', a }; }
    if (isO('+')) { p++; return unary(); }
    return power();
  }
  function power() {
    const a = atom();
    if (isO('^')) { p++; return { t: 'op', op: '^', l: a, r: unary() }; }
    return a;
  }
  function atom() {
    const tk = T[p++];
    if (!tk) throw new Error(`unexpected end in ${str}`);
    if (tk.t === 'n') return tk.over !== undefined ? { t: 'n', q: tk.over === '0' ? null : litValue(tk).div(Number(tk.over)), zeroDen: tk.over === '0' } : { t: 'n', q: litValue(tk) };
    if (tk.t === 'v') return { t: 'v', name: tk.name };
    if (tk.t === 'pi') return { t: 'pi' };
    if (tk.t === 'sqrt') return { t: 'sqrt', a: atom() };
    if (tk.t === 'o' && tk.o === '(') { const a = expr(); if (!isO(')')) throw new Error(`missing ) in ${str}`); p++; return a; }
    throw new Error(`unexpected ${JSON.stringify(tk)} in ${str}`);
  }
  const a = expr();
  if (p !== T.length) throw new Error(`trailing tokens in ${str}`);
  return a;
}
function evalA(a, env = {}) {
  switch (a.t) {
    case 'n': if (a.zeroDen || !a.q) throw new Error('undefined: x/0'); return S.q(a.q);
    case 'v': { if (!(a.name in env)) throw new Error(`no value for ${a.name}`); const v = env[a.name]; return v instanceof S ? v : S.q(v); }
    case 'pi': return S.term(Q(1), 1, 1);
    case 'sqrt': return evalA(a.a, env).sqrt();
    case 'neg': return evalA(a.a, env).neg();
    case 'op': {
      const l = evalA(a.l, env), r = evalA(a.r, env);
      return a.op === '+' ? l.add(r) : a.op === '-' ? l.sub(r) : a.op === '*' ? l.mul(r) : a.op === '/' ? l.div(r) : l.pow(r);
    }
  }
  throw new Error('bad node');
}
const val = (str, env) => evalA(parse(str), env);
const texVal = (tex, env) => val(normTex(tex), env);
const toEnv = o => Object.fromEntries(Object.entries(o).map(([k, v]) => [k, v instanceof S ? v : S.q(v)]));
function varsOf(a, out = new Set()) {
  if (a.t === 'v') out.add(a.name);
  for (const k of ['a', 'l', 'r']) if (a[k]) varsOf(a[k], out);
  return out;
}
const TESTS = [Q(2), Q(-3), Q(5, 7), Q(11), Q(-1, 2), Q(13, 3), Q(7)];
/** do two ASTs agree for every value of their letters (tested on several rational points) */
function equivalent(A, B) {
  const vs = [...new Set([...varsOf(A), ...varsOf(B)])];
  for (let t = 0; t < 6; t++) {
    const env = {};
    vs.forEach((v, i) => { env[v] = S.q(TESTS[(t + 2 * i) % TESTS.length]); });
    if (!evalA(A, env).eq(evalA(B, env))) return false;
  }
  return true;
}
function astEq(a, b) {
  if (!a || !b || a.t !== b.t) return false;
  if (a.t === 'n') return !!a.q && !!b.q && a.q.eq(b.q);
  if (a.t === 'v') return a.name === b.name;
  if (a.t === 'pi') return true;
  if (a.t === 'op') return a.op === b.op && astEq(a.l, b.l) && astEq(a.r, b.r);
  return astEq(a.a, b.a);
}
/** split "L = R" (plain or TeX) into two ASTs */
function equation(str, tex = false) {
  const s = tex ? normTex(str) : str;
  const parts = s.split('=');
  if (parts.length !== 2) throw new Error(`not one equation: ${str}`);
  return [parse(parts[0]), parse(parts[1])];
}

// ================================================================ number sets
const SET_ORDER = ['counting', 'whole', 'integer', 'rational', 'irrational', 'real'];
function inSet(v, set) {
  if (set === 'real') return true;
  if (set === 'irrational') return !v.isRational();
  if (!v.isRational()) return false;
  const q = v.rat();
  if (set === 'rational') return true;
  if (q.d !== 1) return false;
  return set === 'integer' || (set === 'whole' ? q.n >= 0 : q.n >= 1);
}
const setsOf = v => SET_ORDER.filter(s => inSet(v, s));
function smallest(v) {
  if (!v.isRational()) return 'irrational';
  const q = v.rat();
  return q.d !== 1 ? 'rational' : q.n >= 1 ? 'counting' : q.n === 0 ? 'whole' : 'integer';
}
function setName(text) {
  const t = text.toLowerCase();
  if (/irrational/.test(t)) return 'irrational';
  if (/rational/.test(t)) return 'rational';
  if (/integer/.test(t)) return 'integer';
  if (/whole/.test(t)) return 'whole';
  if (/counting/.test(t)) return 'counting';
  if (/real/.test(t)) return 'real';
  return null;
}
const SUBSET = { counting: ['counting', 'whole', 'integer', 'rational', 'real'], whole: ['whole', 'integer', 'rational', 'real'], integer: ['integer', 'rational', 'real'], rational: ['rational', 'real'], irrational: ['irrational', 'real'], real: ['real'] };
const subset = (a, b) => SUBSET[a].includes(b);
const OPS = { addition: '+', subtraction: '-', multiplication: '*', division: '/' };

// ================================================================ small helpers
const pv = s => val(s);   // plain value
const num = v => { if (!v.isRational()) throw new Error('not a rational answer'); return v.rat().value; };
function terminates(q) { let d = q.d; for (const p of [2, 5]) while (d % p === 0) d /= p; return d === 1; }
const choiceIdx = (q, pred) => {
  const hits = [];
  (q.choices ?? []).forEach((c, i) => { let ok = false; try { ok = !!pred(c, i); } catch { ok = false; } if (ok) hits.push(i); });
  return hits.length === 1 ? hits[0] : -1;
};
const claimOf = q => q.data?.picture?.claim;
function claimSides(cl) { return [parse(normTex(cl.left)), parse(normTex(cl.right))]; }
/** is this assignment allowed by the claim's scope */
function admissibleRow(cl, env) {
  const sc = cl.scope ?? '';
  const vals = (cl.vars ?? []).map(v => env[v]);
  if (/nonzero/.test(sc) && vals.some(v => v.isZero())) return false;
  if (/≥ 0/.test(sc) && vals.some(v => !v.isRational() || v.rat().n < 0)) return false;
  let m = sc.match(/in \{([^}]*)\}/);
  if (m) { const set = m[1].split(',').map(x => pv(x.trim())); if (vals.some(v => !set.some(s => s.eq(v)))) return false; }
  m = sc.match(/with (.+?) ≠ 0/);
  if (m) for (const e of m[1].split(',')) { let z; try { z = val(e.trim(), env); } catch { return false; } if (z.isZero()) return false; }
  return true;
}
/** the two sides at this assignment, or null when a side has no value */
function sidesAt(cl, env) {
  const [L, R] = claimSides(cl);
  try { return [evalA(L, env), evalA(R, env)]; } catch { return null; }
}
function rowEnv(cl, vals) { const env = {}; cl.vars.forEach((v, i) => { env[v] = texVal(vals[i]); }); return env; }
/** a row counts against the claim: allowed inputs, both sides have values, and they differ */
function rowFails(cl, env) { if (!admissibleRow(cl, env)) return false; const s = sidesAt(cl, env); return !!s && !s[0].eq(s[1]); }
/** the members of "for every a in {…}", or null */
function finiteMembers(cl) {
  const m = (cl.scope ?? '').match(/in \{([^}]*)\}/);
  return m ? m[1].split(',').map(x => pv(x.trim())) : null;
}
const CANDS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 0, -1, -2, -3, -4, -5, 11, 12, 13, 15, 20, 25, 50, 100];

// ================================================================ property names
function stepProp(L, R) {
  let a = L, b = R;
  for (;;) {
    if (a.t === 'op' && b.t === 'op' && a.op === b.op) {
      if (astEq(a.l, b.l) && !astEq(a.r, b.r)) { a = a.r; b = b.r; continue; }
      if (astEq(a.r, b.r) && !astEq(a.l, b.l)) { a = a.l; b = b.l; continue; }
    }
    if (a.t === 'neg' && b.t === 'neg') { a = a.a; b = b.a; continue; }
    break;
  }
  if (astEq(a, b)) return null;
  if (!equivalent(a, b)) return { prop: 'false' };
  const opName = o => (o === '+' ? 'addition' : o === '*' ? 'multiplication' : o);
  if (a.t === 'op' && b.t === 'op' && a.op === b.op && astEq(a.l, b.r) && astEq(a.r, b.l)) return { prop: 'commutative', op: opName(a.op) };
  if (a.t === 'op' && b.t === 'op' && a.op === b.op) {
    const o = a.op;
    const assoc = (x, y) => x.l.t === 'op' && x.l.op === o && y.r.t === 'op' && y.r.op === o && astEq(x.l.l, y.l) && astEq(x.l.r, y.r.l) && astEq(x.r, y.r.r);
    if (assoc(a, b) || assoc(b, a)) return { prop: 'associative', op: opName(o) };
  }
  const ident = (x, y) => x.t === 'op' && ((x.op === '+' && ((x.r.t === 'n' && x.r.q?.n === 0 && astEq(x.l, y)) || (x.l.t === 'n' && x.l.q?.n === 0 && astEq(x.r, y))))
    || (x.op === '*' && ((x.r.t === 'n' && x.r.q?.eq(1) && astEq(x.l, y)) || (x.l.t === 'n' && x.l.q?.eq(1) && astEq(x.r, y)))));
  if (ident(a, b)) return { prop: 'identity', op: opName(a.op) };
  if (ident(b, a)) return { prop: 'identity', op: opName(b.op) };
  const isSum = x => x.t === 'op' && (x.op === '+' || x.op === '-');
  const prodOfSum = x => x.t === 'op' && x.op === '*' && (isSum(x.l) || isSum(x.r));
  if ((prodOfSum(a) && isSum(b)) || (prodOfSum(b) && isSum(a))) return { prop: 'distributive' };
  return { prop: 'other' };
}
function propOfText(t) {
  const m = t.match(/\b(commutative|associative|identity|distributive) property(?: of (addition|multiplication))?/i);
  return m ? { prop: m[1].toLowerCase(), op: m[2]?.toLowerCase() } : null;
}
const sameProp = (a, b) => !!a && !!b && a.prop === b.prop && (a.prop === 'distributive' || a.op === b.op);

// ================================================================ closure claims
/** "The integers are closed under division by nonzero integers" / "A rational number times an irrational ..." */
function parseClaim(text) {
  let m = text.match(/The (\w+) numbers are closed under (\w+)|The (integers) are closed under (\w+)/i);
  if (m) {
    const set = setName(m[1] ?? m[3]), op = OPS[(m[2] ?? m[4]).toLowerCase()];
    return { in1: set, in2: set, op, out: set, nonzeroDiv: /nonzero/.test(text), nonzero1: false };
  }
  m = text.match(/A (nonzero )?rational number times an irrational number is (?:always )?irrational/i);
  if (m) return { in1: 'rational', in2: 'irrational', op: '*', out: 'irrational', nonzero1: !!m[1], either: true };
  throw new Error(`unknown claim: ${text}`);
}
/** a written example "E1 = E2" / "E has no value" / "E": inputs, op, value (null = no value), stated value ok */
function readExample(text) {
  const t = text.replace(/,?\s*(?:not a whole number|which is rational|so it is not an integer).*$/, '').replace(/\s+is (?:not in the set|irrational).*$/, '').trim();
  const noValue = /has no value/.test(t);
  const e = t.replace(/\s*has no value.*$/, '');
  const parts = e.split('=');
  const A = parse(parts[0]);
  if (A.t !== 'op') return null;
  let x, y;
  try { x = evalA(A.l); y = evalA(A.r); } catch { return null; }
  let v = null;
  try { v = evalA(A); } catch { v = null; }
  let statedOk = true;
  if (parts.length === 2) { try { statedOk = v !== null && pv(parts[1]).eq(v); } catch { statedOk = false; } }
  if (noValue) statedOk = v === null;
  return { op: A.op, x, y, v, statedOk };
}
function inputsAllowed(cl, ex) {
  if (ex.op !== cl.op) return false;
  const okPair = (a, b) => inSet(a, cl.in1) && inSet(b, cl.in2) && !(cl.nonzero1 && a.isZero());
  if (!(okPair(ex.x, ex.y) || (cl.either && okPair(ex.y, ex.x)))) return false;
  if (cl.op === '/' && cl.nonzeroDiv && ex.y.isZero()) return false;
  return true;
}
const isCounter = (cl, ex) => !!ex && inputsAllowed(cl, ex) && ex.v !== null && ex.statedOk && !inSet(ex.v, cl.out);
/** is the set closed under the op (number sets; division by nonzero) */
function closedNamed(set, op) {
  const T = { counting: '+*', whole: '+*', integer: '+-*', rational: '+-*/', real: '+-*/', irrational: '' };
  return T[set].includes(op);
}

// ================================================================ the families
const F = {
  commName(q) {
    const [L, R] = equation(q.board, true);
    const p = stepProp(L, R);
    return choiceIdx(q, c => sameProp(propOfText(c), p));
  },
  nameStep(q) { return F.commName(q); },
  whichStep(q) {
    const want = propOfText(q.prompt);
    return choiceIdx(q, c => { const [L, R] = equation(c); return sameProp(stepProp(L, R), want); });
  },
  commSwap(q) {
    const second = normTex(q.board.split('\\qquad')[1]).replace(/=\s*\?\s*$/, '');
    return num(val(second));
  },
  assocPair(q) {
    const [a, b] = q.board.split(/\\quad\s*\\text\{and\}\s*\\quad/);
    return [num(texVal(a)), num(texVal(b))];
  },
  identityPick(q) {
    const op = /addition/.test(q.prompt) ? '+' : '*', e = op === '+' ? 0 : 1;
    return choiceIdx(q, c => {
      const [L, R] = equation(c);
      return L.t === 'op' && L.op === op && L.r.t === 'n' && L.r.q?.eq(e) && astEq(L.l, R);
    });
  },
  identityFill(q) {
    // the box value that keeps every number unchanged: test the given number and others
    const [L, R] = equation(q.board, true);
    const given = evalA(R);
    const replace = (a, v) => (a.t === 'n' && a.q && S.q(a.q).eq(given) ? { t: 'v', name: 'X' } : a.t === 'op' ? { ...a, l: replace(a.l, v), r: replace(a.r, v) } : a);
    const L2 = replace(L), R2 = replace(R);
    const hits = [0, 1, -1, 2].filter(b => [given, S.int(3), S.q(Q(-5, 2)), S.int(7)].every(X => { try { return evalA(L2, { X, '□': S.int(b) }).eq(evalA(R2, { X, '□': S.int(b) })); } catch { return false; } }));
    return hits.length === 1 ? hits[0] : undefined;
  },
  opposite(q) { return num(solveBox(q.board)); },
  recipNum(q) { return num(solveBox(q.board)); },
  toZero(q) { const v = solveBox(q.board); return choiceIdx(q, c => pv(c).eq(v)); },
  reciprocal(q) { const v = solveBox(q.board); return choiceIdx(q, c => pv(c).eq(v)); },
  zeroRecip(q) {
    if (/Which of these has no reciprocal/.test(q.prompt)) return choiceIdx(q, c => pv(c).isZero());
    // "the reciprocal of 0": 0 · x = 0 for every x, so no number times 0 makes 1
    return choiceIdx(q, c => /^0 has no reciprocal: 0 times any number is 0, never 1\.?$/.test(c));
  },
  distArea(q) { return num(texVal(q.board.split('=')[0])); },
  distForm(q) {
    const src = /Factor/.test(q.prompt) ? normTex(q.board.split('=')[0]) : normTex(q.board);
    const G = parse(src), factor = /Factor/.test(q.prompt);
    return choiceIdx(q, c => {
      const A = parse(c);
      if (!equivalent(A, G)) return false;
      // factored: a number times a bracket; expanded: no product of a sum left
      const isSum = x => x.t === 'op' && (x.op === '+' || x.op === '-');
      const hasProdOfSum = x => x.t === 'op' && ((x.op === '*' && (isSum(x.l) || isSum(x.r))) || hasProdOfSum(x.l) || hasProdOfSum(x.r)) || (x.t === 'neg' && hasProdOfSum(x.a));
      return factor ? A.t === 'op' && A.op === '*' && (isSum(A.r) || isSum(A.l)) : !hasProdOfSum(A);
    });
  },
  smartGroup(q) {
    const total = texVal(q.board);
    return choiceIdx(q, c => { const [L, R] = equation(c); return evalA(L).eq(total) && evalA(R).eq(total); });
  },
  chainProduct(q) { return num(texVal(q.board)); },
  cancelChain(q) { return num(texVal(q.board)); },
  powerEval(q) { return num(texVal(q.board)); },
  irrValue(q) { return num(texVal(q.board)); },
  cancelWhich(q) {
    return choiceIdx(q, c => { const [L, R] = equation(c); return evalA(L).eq(evalA(R)); });
  },
  oneCounter(q) {
    const cl = claimOf(q);
    const fails = cl.rows.some(r => rowFails(cl, rowEnv(cl, r.vals)));
    if (!fails) return -1;
    return choiceIdx(q, c => /^The claim is false: one row that fails is enough\.?$/.test(c));
  },
  proved(q) {
    const cl = claimOf(q);
    const envs = cl.rows.map(r => rowEnv(cl, r.vals));
    let verdict;
    const members = finiteMembers(cl);
    if (envs.some(e => rowFails(cl, e))) verdict = 'Disproved';
    else if (members && cl.vars.length === 1) {
      // a claim about a small finite set is settled by its members (the student sees the set and can check each)
      verdict = members.some(v => rowFails(cl, { [cl.vars[0]]: v })) ? 'Disproved' : 'Proved';
    } else verdict = 'Not proved by these checks';
    return choiceIdx(q, c => c.trim() === verdict);
  },
  equivQ(q) {
    const cl = claimOf(q);
    const [L, R] = claimSides(cl);
    if (equivalent(L, R)) {
      // a general reason, not "they matched in the rows" and not "they agree at one value"
      return choiceIdx(q, c => /^Yes/.test(c) && !/every row|agree at/.test(c) && (!/=/.test(c) || chainHolds(c)));
    }
    return choiceIdx(q, c => {
      const m = c.match(/^No: at (\w) = (\S+?) they are (\S+) and (\S+?)\.?$/);
      if (!m) return false;
      const env = { [m[1]]: pv(m[2]) };
      const [l, r] = [evalA(L, env), evalA(R, env)];
      return l.eq(pv(m[3])) && r.eq(pv(m[4])) && !l.eq(r);
    });
  },
  differAt(q) {
    const cl = claimOf(q);
    for (const x of CANDS) { const env = { [cl.vars[0]]: S.int(x) }; if (rowFails(cl, env)) return x; }
    return undefined;
  },
  separating(q) {
    const cl = claimOf(q);
    return choiceIdx(q, c => {
      const env = {};
      for (const m of c.matchAll(/(\w) = ([−-]?[\d./]+)/g)) env[m[1]] = pv(m[2]);
      if (cl.vars.some(v => !(v in env))) return false;
      return rowFails(cl, env);
    });
  },
  ownValue(q) {
    // Not covered: every value that breaks the claim is right, and the sweep compares with the lesson's one stored
    // value. On the first run the lesson's check() accepted the oracle's pick (the first small whole number that
    // breaks the claim) on every item; the code below is kept for that probe (OWN_VALUE_PROBE=1).
    if (!globalThis.process?.env?.OWN_VALUE_PROBE) return undefined;
    const cl = claimOf(q);
    const keep = (q.prompt.match(/Keep (.+?)\. Type/)?.[1] ?? '');
    const env = {};
    for (const m of keep.matchAll(/(\w) = ([−-]?[\d./]+)/g)) env[m[1]] = pv(m[2]);
    const free = q.prompt.match(/Type a value of (\w)/)[1];
    for (const x of CANDS) if (rowFails(cl, { ...env, [free]: S.int(x) })) return x;
    return undefined;
  },
  setRule(q) {
    let m = q.prompt.match(/Is (\S+) a whole number\?/);
    if (m) {
      const v = pv(m[1]), yes = inSet(v, 'whole');
      return choiceIdx(q, c => {
        if (!yes) return false;
        const mm = c.match(/^Yes: the whole numbers are ([\d, ]+), …$/);
        return !!mm && mm[1].split(',').map(Number).every((n, i) => n === i);
      });
    }
    m = q.prompt.match(/Which number is (?:an? )?(.+?)(?: but not (?:an? )?(.+?))?\?/);
    const A = setName(m[1]), B = m[2] ? setName(m[2]) : null;
    return choiceIdx(q, c => { const v = pv(c); return inSet(v, A) && (!B || !inSet(v, B)); });
  },
  countMembers(q) {
    const set = setName(q.prompt.match(/are (.+?)\?/)[1]);
    return listOf(q.board).filter(v => inSet(v, set)).length;
  },
  allSets(q) {
    const v = texVal(q.board), want = setsOf(v);
    return choiceIdx(q, c => {
      if (/^None/.test(c)) return want.length === 0;
      const names = c.replace(/ only$/, '').split(/,\s*|\s+and\s+/).map(setName);
      if (names.some(n => !n)) return false;
      return names.length === want.length && want.every(w => names.includes(w));
    });
  },
  subsetTrue(q) { return choiceIdx(q, c => statement(c)); },
  partitionTrue(q) { return choiceIdx(q, c => statement(c)); },
  display(q) {
    let verdict;
    const b = q.board, p = q.prompt;
    const arrow = b.split('\\to');
    if (arrow.length === 2) verdict = texVal(arrow[0]).isRational() ? 'Rational' : 'Irrational';   // the exact number is named
    else if (/\\overline/.test(b)) verdict = 'Rational';                                           // a repeating block
    else if (/goes on by a rule: after each \d, one more 0 than last time/.test(p)) verdict = 'Irrational';   // gaps grow: never repeats
    else if (/no bar and no rule/.test(p) || /calculator shows [\d.]+, a full display, for some number/.test(p)) verdict = 'Cannot tell from this';
    else return undefined;
    return choiceIdx(q, c => c.trim() === verdict);
  },
  approx(q) {
    const [L, R] = equation(q.board, true);
    const same = evalA(L).eq(evalA(R));
    return choiceIdx(q, c => (same ? /^Yes: .* written another way\.?$/.test(c) : /^No: .* is only an approximation of .*\.?$/.test(c)));
  },
  placeIt(q) {
    let v;
    try { v = texVal(q.board); } catch (e) { if (/not real/.test(e.message)) return choiceIdx(q, c => /^Outside the map/.test(c)); throw e; }
    const want = smallest(v);
    return choiceIdx(q, c => { const m = c.match(/^In (\w+)$/); return !!m && setName(m[1]) === want; });
  },
  closedFinite(q) {
    const m = q.board.match(/\\\{(.*?)\\\}\s*\\text\{ under \}\s*(.+)$/);
    const set = m[1].split(',').map(x => texVal(x.trim()));
    const op = normTex(m[2]).trim() === '+' ? '+' : '*';
    const apply = (a, b) => (op === '+' ? a.add(b) : a.mul(b));
    const inS = v => set.some(s => s.eq(v));
    const closed = set.every(a => set.every(b => inS(apply(a, b))));
    const n = set.length;
    return choiceIdx(q, c => {
      let mm = c.match(/^Closed: all (\d+) (?:sums|products) are in the set\.?$/);
      if (mm) return closed && [n * n, (n * (n + 1)) / 2].includes(Number(mm[1]));
      mm = c.match(/^Closed: (.+) = (.+) is in the set\.?$/);
      if (mm) return closed && n === 1 && exampleOk(mm[1], mm[2], op, inS) && inS(pv(mm[2]));
      mm = c.match(/^Not closed: (.+) = (.+) is not in the set\.?$/);
      if (mm) return exampleOk(mm[1], mm[2], op, inS) && !inS(pv(mm[2]));
      return false;   // "every sum is some number", "cannot tell": not reasons about this set
    });
  },
  closedNamed(q) {
    const m = q.prompt.match(/Are the (.+?) closed under (\w+)/);
    const set = setName(m[1]), op = OPS[m[2]];
    const closed = closedNamed(set, op);
    const cl = { in1: set, in2: set, op, out: set, nonzeroDiv: op === '/' };
    return choiceIdx(q, c => {
      if (/^No: /.test(c)) return !closed && isCounter(cl, readExample(c.slice(4)));
      if (/^Yes: /.test(c)) return closed && !/every pair I tried|always a number/.test(c);
      return false;
    });
  },
  counterPick(q) {
    const cl = parseClaim(q.prompt);
    return choiceIdx(q, c => isCounter(cl, readExample(c)));
  },
  counterType(q) {
    let m = q.prompt.match(/Type an integer b so that (−?\d+) ÷ b is not an integer/);
    if (m) { const n = pv(m[1]); for (const b of CANDS) if (b !== 0 && n.div(S.int(b)).rat().d !== 1) return b; return undefined; }
    m = q.prompt.match(/Type a whole number b so that (\d+) − b is not a whole number/);
    if (m) { const n = Number(m[1]); for (let b = 0; b < 1000; b++) if (n - b < 0) return b; }
    return undefined;
  },
  admissible(q) {
    const cl = parseClaim(q.prompt);
    const exText = q.prompt.match(/offers a counterexample: (.+?)\. Does it count\?/)[1];
    const ex = readExample(exText);
    const counts = isCounter(cl, ex);
    const yes = c => /^Yes\b|^It counts/.test(c), no = c => /^No\b|does not count/.test(c);
    const cand = (q.choices ?? []).map((c, i) => [c, i]).filter(([c]) => (counts ? yes(c) : no(c)));
    if (cand.length === 1) return cand[0][1];
    const good = cand.filter(([c]) => reasonTrue(c, cl, ex));
    return good.length === 1 ? good[0][1] : -1;
  },
  sumForm(q) {
    const fr = [...q.board.matchAll(/(-?)\\frac\{(-?\d+)\}\{(\d+)\}/g)].map(m => [Number(m[2]) * (m[1] ? -1 : 1), Number(m[3])]);
    const [[a, b], [c, d]] = fr;
    if (/\\cdot|\\times/.test(q.board)) return [a * c, b * d];
    return [a * d + b * c, b * d];
  },
  whyRational(q) {
    if (/^Pat says/.test(q.prompt)) {
      const m = q.board.match(/\\frac\{(.+)\}\{(\d+)\}/);
      const top = texVal(m[1]), v = texVal(q.board);
      if (v.isRational()) return -1;   // Pat's number would be rational after all
      return choiceIdx(q, c => /^No: /.test(c) && !inSet(top, 'integer'));
    }
    // a general argument: letters for ANY two rationals, integers over a nonzero integer
    const prod = /product/.test(q.prompt);
    return choiceIdx(q, c => /^Write them as a\/b and c\/d with integers and b, d ≠ 0\./.test(c)
      && (prod ? /The product is ac\/bd/.test(c) : /The sum is ad \+ bc\/bd/.test(c)) && /integers over a nonzero integer/.test(c));
  },
  contradiction(q) {
    const X = parse(normTex(q.board.replace(/\\text\{Suppose \}/, '')).split('=')[0]);
    return choiceIdx(q, c => {
      const m = c.match(/^Then √(\d+) = (.+?)(?:, which is rational| ;|;)/);
      if (!m || /same argument works for 0/.test(c) || !/the supposition is false/.test(c)) return false;
      const E = parse(m[2]), root = S.int(1).mul(val(`√${m[1]}`));
      if (root.isRational()) return false;
      // X(√n) = q  ⇔  √n = E(q): check with X written at √n replaced by E(q) for several q
      for (const qq of [Q(3), Q(-7, 2), Q(10)]) {
        const r = evalA(E, { q: S.q(qq) });
        if (!r.isRational()) return false;
        if (!substRoot(X, m[1], r).eq(S.q(qq))) return false;
      }
      return true;
    });
  },
  isIrrational(q) { return choiceIdx(q, c => !pv(c).isRational()); },
};
/** value of X with every √n in it read as r */
function substRoot(X, n, r) {
  const sub = a => (a.t === 'sqrt' && a.a.t === 'n' && a.a.q?.eq(Number(n)) ? { t: 'v', name: '__r' } : a.t === 'op' ? { ...a, l: sub(a.l), r: sub(a.r) } : a.t === 'neg' ? { ...a, a: sub(a.a) } : a);
  return evalA(sub(X), { __r: S.q(r.rat()) });
}
/** the box value of "… □ … = …" (linear in □) */
function solveBox(board) {
  const [L, R] = equation(board, true);
  const g = b => evalA(L, { '□': b }).sub(evalA(R, { '□': b }));
  const g0 = g(S.int(0)), g1 = g(S.int(1)), slope = g1.sub(g0);
  if (slope.isZero()) throw new Error('no single box value');
  return g0.neg().div(slope);
}
function listOf(board) { return normTex(board).split(',').map(s => s.trim()).filter(Boolean).map(s => val(s)); }
function exampleOk(lhs, rhs, op, inS) {
  const A = parse(lhs);
  if (A.t !== 'op' || A.op !== op) return false;
  return inS(evalA(A.l)) && inS(evalA(A.r)) && evalA(A).eq(pv(rhs));
}
/** "x + x = 1x + 1x = (1 + 1)x (distributive) makes …": every link of the chain is an identity */
function chainHolds(c) {
  const body = c.replace(/^Yes:\s*/, '').replace(/\s*\([a-z ]+\)\s*makes.*$/, '').replace(/\s*makes.*$/, '');
  const parts = body.split('=').map(s => parse(s.trim()));
  for (let i = 1; i < parts.length; i++) if (!equivalent(parts[i - 1], parts[i])) return false;
  return true;
}
/** truth of a statement about number sets */
function statement(c) {
  const t = c.trim().replace(/\.$/, '');
  let m;
  if ((m = t.match(/^Every (\w+) numbers? is an? (\w+)(?: numbers?)?$/)) || (m = t.match(/^Every (integer) is an? (\w+)(?: numbers?)?$/))) return subset(setName(m[1]), setName(m[2]));
  if ((m = t.match(/^Some (\w+) numbers are not (\w+)(?: numbers)?$/))) return !subset(setName(m[1]), setName(m[2]));
  if ((m = t.match(/^The (\w+) numbers are a part of the (\w+) numbers$/))) return subset(setName(m[1]), setName(m[2]));
  if ((m = t.match(/^Every real number is rational or irrational, never both$/))) return true;   // the partition of the reals
  if ((m = t.match(/^Some numbers, like (.+), are both rational and irrational$/))) return false;   // the two sets do not meet
  if ((m = t.match(/^(.+) is irrational because it has a root sign$/))) return false;             // a root sign decides nothing
  if ((m = t.match(/^(.+) is irrational and real$/))) return inSet(pv(m[1]), 'irrational');
  if ((m = t.match(/^(.+) is (\w+), so it is not a real number$/))) return inSet(pv(m[1]), setName(m[2])) && !inSet(pv(m[1]), 'real');
  if ((m = t.match(/^(.+) is a fraction, so it is not an integer$/))) return !inSet(pv(m[1]), 'integer');
  if ((m = t.match(/^(.+) is an? (\w+), so it is not an? (\w+)(?: number)?$/))) { const v = pv(m[1]); return inSet(v, setName(m[2])) && !inSet(v, setName(m[3])); }
  if ((m = t.match(/^(.+) is (\w+), because (.+) = (.+)$/))) {
    const v = pv(m[1]);
    const rhs = m[4].replace(/[−-]/g, '-').match(/^(-?\d+)\/(\d+)$/);
    return inSet(v, setName(m[2])) && pv(m[3]).eq(pv(m[4])) && !!rhs && Number(rhs[2]) !== 0;
  }
  throw new Error(`unknown statement: ${c}`);
}
/** the reason of an admissibility verdict, judged */
function reasonTrue(c, cl, ex) {
  let m;
  if ((m = c.match(/(\S+) is not an? (?:nonzero )?(\w+)(?: number)?/)) && !/always/.test(c)) {
    const v = pv(m[1]), set = setName(m[2]);
    return !inSet(v, set) || (/nonzero/.test(c) && v.isZero());
  }
  if (/the claim excludes 0 as a divisor/.test(c)) return cl.op === '/' && cl.nonzeroDiv && ex.y.isZero();
  if ((m = c.match(/(\S+) and (\S+) are (\w+), and (\S+) is not/))) return inSet(pv(m[1]), setName(m[3])) && inSet(pv(m[2]), setName(m[3])) && !inSet(pv(m[4]), setName(m[3]));
  return false;   // "always whole", "one example is always enough", "root sign", "you cannot take", "= 0 anyway"
}

// ================================================================ sane: the item's world
function claimTableIssues(q) {
  const cl = claimOf(q);
  if (!cl?.rows) return '';
  for (const r of cl.rows) {
    if (!r.vals || r.vals.includes('?') || r.left === undefined) continue;
    const env = rowEnv(cl, r.vals), s = sidesAt(cl, env);
    if (!s) return `row ${r.vals.join(', ')}: a side has no value`;
    if (!s[0].eq(texVal(r.left)) || !s[1].eq(texVal(r.right))) return `row ${r.vals.join(', ')}: the table shows ${r.left} and ${r.right}`;
    if (r.ok !== undefined && r.ok !== s[0].eq(s[1])) return `row ${r.vals.join(', ')} is marked ${r.ok ? 'working' : 'failing'}`;
  }
  return '';
}
function sane(q) {
  const t = claimTableIssues(q);
  if (t) return t;
  const f = q.family;
  if (f === 'commSwap') {
    const first = normTex(q.board.split('\\qquad')[0]).split('=');
    if (!val(first[0]).eq(val(first[1]))) return `the first equation ${first.join('=')} is false`;
    const v = val(normTex(q.board.split('\\qquad')[1]).replace(/=\s*\?\s*$/, ''));
    if (/as a decimal/.test(q.prompt) && !terminates(v.rat())) return 'asked as a decimal, but it never ends';
  }
  if (f === 'recipNum') { const v = solveBox(q.board); if (!terminates(v.rat())) return 'the reciprocal is not a terminating decimal'; }
  if (f === 'distArea') { const [l, r] = q.board.split('='); if (!texVal(l).eq(texVal(r))) return 'the split does not equal the product'; }
  if (f === 'oneCounter') {
    const cl = claimOf(q), m = q.prompt.match(/(\d+) rows? work/);
    const works = cl.rows.filter(r => { const s = sidesAt(cl, rowEnv(cl, r.vals)); return s && s[0].eq(s[1]); }).length;
    if (m && Number(m[1]) !== works) return `the prompt says ${m[1]} rows work, the table has ${works}`;
  }
  if (f === 'proved') {
    const cl = claimOf(q), members = finiteMembers(cl);
    if (members && cl.vars.length === 1 && !cl.rows.some(r => rowFails(cl, rowEnv(cl, r.vals)))) {
      const missing = members.filter(v => !cl.rows.some(r => texVal(r.vals[0]).eq(v)));
      if (missing.length) return `the table leaves out ${missing.map(v => v.rat()).join(', ')} of the set: "Not proved by these checks" is true as well as "${missing.some(v => rowFails(cl, { [cl.vars[0]]: v })) ? 'Disproved' : 'Proved'}"`;
    }
  }
  if (f === 'differAt') {
    const cl = claimOf(q), m = q.prompt.match(/agree at \w = (.+?)\. Type/);
    if (m) for (const x of m[1].split(/ and /)) { const s = sidesAt(cl, { [cl.vars[0]]: pv(x) }); if (!s || !s[0].eq(s[1])) return `they do not agree at ${x}`; }
  }
  if (f === 'nameStep' || f === 'whichStep') {
    const lines = q.data?.picture?.chain?.lines ?? [];
    for (let i = 1; i < lines.length; i++) if (!equivalent(parse(lines[i - 1]), parse(lines[i]))) return `chain step ${i} is not equivalent`;
  }
  if (f === 'counterType') { const m = q.prompt.match(/so that (−?\d+) ÷ b/); if (m && pv(m[1]).isZero()) return '0 ÷ b is always an integer: no answer'; }
  if (f === 'partitionTrue' || f === 'irrValue') {
    for (const tk of q.data?.picture?.map?.tokens ?? []) {
      let v; try { v = texVal(tk.tex); } catch { continue; }
      if (setName(tk.at) !== smallest(v)) return `the map puts ${tk.tex} in ${tk.at}`;
    }
  }
  return '';
}

export default {
  solve(q) {
    const f = F[q.family];
    if (!f) return undefined;
    return f(q);
  },
  sane,
};
