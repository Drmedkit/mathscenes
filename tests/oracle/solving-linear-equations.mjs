// Oracle for the lesson "solving-linear-equations" (Algebra 1: solving linear equations and inequalities, solution
// sets, literal equations, compound inequalities, context; A-REI.A.1, A-REI.B.3, A-CED.A.3).
// Role O of docs/lessons/QUALITY_LAYER.md: every practice item is worked out from what the student sees (the prompt
// HTML where the fraction bars live, the board TeX, the choice HTML). Expressions are parsed into exact functions of
// their letters (fractions kept exact with Q). A statement (equation, inequality, chain, and / or, "all real
// numbers", "no solution") becomes a set of numbers: two sets are compared at every boundary number, between them and
// beyond them, which is exact for unions of intervals. A choice is judged by the maths of its claim: its conclusion
// AND its reason (a step is applied to both sides and the sides compared; "x = 0 makes both true", "move it and change
// its sign", "a solving step only goes one way" are never reasons). The students are high schoolers (14-18).
import { Q } from '../../tools/quality/oracle-kit.mjs';

// ---------------------------------------------------------------- text → maths
const decode = s => String(s ?? '')
  .replace(/&#8202;|&#8201;|&thinsp;|&nbsp;|&#160;/g, ' ').replace(/&minus;/g, '−').replace(/&times;/g, '×')
  .replace(/&divide;/g, '÷').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&le;/g, '≤').replace(/&ge;/g, '≥')
  .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(Number(d))).replace(/&amp;/g, '&');
/** prompt / choice HTML → maths text: a fraction span as ((a)/(b)) */
function htmlMath(h) {
  let s = String(h ?? '').replace(/<\/?i>/g, '');
  for (let i = 0; i < 4; i++) s = s.replace(/<span class="fr"><span>([^<]*)<\/span><span>([^<]*)<\/span><\/span>/g, '(($1)/($2))');
  return decode(s.replace(/<br\s*\/?>/g, ' ').replace(/<\/?[a-zA-Z][^>]*>/g, '')).replace(/\s+/g, ' ').trim();
}
/** board TeX → maths text */
function texMath(tex) {
  let s = String(tex ?? '');
  for (let i = 0; i < 6; i++) {
    const before = s;
    s = s.replace(/\\(?:text|mathrm)\{([^{}]*)\}/g, '$1')
      .replace(/\\[td]?frac\{([^{}]*)\}\{([^{}]*)\}/g, '(($1)/($2))')
      .replace(/\\[td]?frac(\d)(\d)/g, '(($1)/($2))')
      .replace(/_\{?(\d)\}?/g, (_, d) => String.fromCharCode(0x2080 + Number(d)));
    if (s === before) break;
  }
  return s.replace(/\\times/g, '×').replace(/\\div/g, '÷').replace(/\\cdot/g, '·').replace(/\\ge(q)?\b/g, '≥')
    .replace(/\\le(q)?\b/g, '≤').replace(/\\ne(q)?\b/g, '≠').replace(/\\Rightarrow/g, '⇒').replace(/\\longrightarrow|\\rightarrow|\\to\b/g, '⟶')
    .replace(/\\left|\\right/g, '').replace(/\\[,;:! ]|\\quad|\\qquad|~/g, ' ').replace(/[{}]/g, '').replace(/\s+/g, ' ').trim();
}
const norm = s => String(s).replace(/[−–]/g, '-').replace(/\s+/g, ' ').trim();
const tight = s => norm(s).replace(/\s+/g, '');

// ---------------------------------------------------------------- expressions: exact functions of their letters
function decQ(t) {
  const m = String(t).match(/^(\d*)(?:\.(\d+))?$/);
  if (!m || (m[1] === '' && !m[2])) throw new Error(`not a number: ${t}`);
  return Q(Number((m[1] || '0') + (m[2] || '')), m[2] ? 10 ** m[2].length : 1);
}
/** parse → f(look) where look(name) gives the letter's value (Q). Letters: one letter, maybe a subscript digit. */
function parse(text) {
  const s = norm(text).replace(/×|·/g, '*').replace(/÷/g, '/').replace(/\$/g, '').replace(/(\d),(?=\d{3})/g, '$1');
  const toks = [];
  const re = /\s*(\d+\.?\d*|\.\d+|[A-Za-z][₀-₉]?|[-+*/()])/y;
  let i = 0;
  while (i < s.length) {
    if (/\s/.test(s[i])) { i++; continue; }
    re.lastIndex = i; const m = re.exec(s);
    if (!m) throw new Error(`bad char in ${s}`);
    toks.push(m[1]); i = re.lastIndex;
  }
  let p = 0;
  const peek = () => toks[p], next = () => toks[p++];
  function E() {
    let f = T();
    while (peek() === '+' || peek() === '-') { const op = next(), g = T(), a = f; f = op === '+' ? e => a(e).add(g(e)) : e => a(e).sub(g(e)); }
    return f;
  }
  function T() {
    let f = U();
    for (;;) {
      const t = peek();
      if (t === '*') { next(); const g = U(), a = f; f = e => a(e).mul(g(e)); }
      else if (t === '/') { next(); const g = U(), a = f; f = e => a(e).div(g(e)); }
      else if (t !== undefined && (t === '(' || /^[\d.A-Za-z]/.test(t))) { const g = U(), a = f; f = e => a(e).mul(g(e)); }
      else break;
    }
    return f;
  }
  function U() {
    const t = peek();
    if (t === '-') { next(); const g = U(); return e => g(e).neg(); }
    if (t === '+') { next(); return U(); }
    return P();
  }
  function P() {
    const t = next();
    if (t === '(') { const f = E(); if (next() !== ')') throw new Error('missing )'); return f; }
    if (t === undefined) throw new Error('unexpected end');
    if (/^[A-Za-z]/.test(t)) return e => e(t);
    if (/^[\d.]/.test(t)) { const v = decQ(t); return () => v; }
    throw new Error(`unexpected ${t}`);
  }
  const f = E();
  if (p !== toks.length) throw new Error(`trailing tokens in ${s}`);
  f.letters = [...new Set(toks.filter(t => /^[A-Za-z]/.test(t)))];
  return f;
}
const toQ = v => (typeof v === 'object' && v && 'n' in v ? v : Q(v));
/** a one-letter expression: every letter is "x" → (x: Q) => Q */
const ex = text => { const f = parse(text); const g = x => f(() => toQ(x)); g.letters = f.letters; return g; };
const at = (f, v) => { try { return f(toQ(v)); } catch { return null; } };
const PTS = [Q(0), Q(1), Q(2), Q(-3), Q(7, 5), Q(11), Q(-5, 2)];
function sameFn(f, g) {
  for (const v of PTS) {
    const a = at(f, v), b = at(g, v);
    if (a === null && b === null) continue;
    if (a === null || b === null || !a.eq(b)) return false;
  }
  return true;
}
/** the linear form {a, b} of f (a·x + b), or null */
function linOf(f) {
  const f0 = at(f, 0), f1 = at(f, 1);
  if (!f0 || !f1) return null;
  const a = f1.sub(f0), b = f0;
  for (const v of [2, -3, 7, Q(5, 3)]) { const y = at(f, v); if (!y || !y.eq(a.mul(toQ(v)).add(b))) return null; }
  return { a, b };
}
const qOf = t => ex(t)(Q(0));
const vOut = v => (v.d === 1 ? v.n : v.value);

// ---------------------------------------------------------------- statements and their solution sets
const RELS = /(<=|>=|≤|≥|=|<|>)/;
const FLIP = { '<': '>', '>': '<', '≤': '≥', '≥': '≤', '=': '=' };
const holds = (a, rel, b) => { const c = a.cmp(b); return rel === '<' ? c < 0 : rel === '>' ? c > 0 : rel === '≤' ? c <= 0 : rel === '≥' ? c >= 0 : c === 0; };
/** "lhs REL rhs" → { L, R, rel } */
function relation(text) {
  const parts = norm(text).split(RELS);
  if (parts.length !== 3) throw new Error(`not one relation: ${text}`);
  return { L: ex(parts[0]), R: ex(parts[2]), rel: { '<=': '≤', '>=': '≥' }[parts[1]] ?? parts[1] };
}
/**
 * a statement about x → { test(x): bool, roots: Q[], ill: bool }. Forms: "All real numbers", "No solution (∅)",
 * "A or B", "A and B", a chain "a < x ≤ b", one relation. A chain of three or more parts that no number satisfies
 * ("6 ≤ x < 1") is ill-formed: not a way to write a set (ill = true).
 */
function stmt(text) {
  const t = norm(text).replace(/\s*\(∅\)\s*$/, '').replace(/\.$/, '');
  if (/^all real numbers$/i.test(t)) return { test: () => true, roots: [], ill: false };
  if (/^no solution$/i.test(t) || t === '∅') return { test: () => false, roots: [], ill: false };
  let parts;
  if ((parts = t.split(/ or /)).length > 1) {
    const s = parts.map(stmt);
    return { test: x => s.some(u => u.test(x)), roots: s.flatMap(u => u.roots), ill: s.some(u => u.ill) };
  }
  if ((parts = t.split(/ and /)).length > 1) {
    const s = parts.map(stmt);
    return { test: x => s.every(u => u.test(x)), roots: s.flatMap(u => u.roots), ill: s.some(u => u.ill) };
  }
  const bits = t.split(RELS);
  if (bits.length < 3) throw new Error(`no relation in ${text}`);
  const fs = [], rels = [];
  for (let i = 0; i < bits.length; i++) i % 2 ? rels.push({ '<=': '≤', '>=': '≥' }[bits[i]] ?? bits[i]) : fs.push(ex(bits[i]));
  const roots = [];
  for (let i = 0; i < rels.length; i++) {
    const d = linOf(x => fs[i](x).sub(fs[i + 1](x)));
    if (!d) throw new Error(`not linear: ${text}`);
    if (d.a.n !== 0) roots.push(d.b.neg().div(d.a));
  }
  const test = x => rels.every((r, i) => holds(fs[i](x), r, fs[i + 1](x)));
  const s = { test, roots, ill: false };
  if (rels.length > 1 && isEmpty(s)) s.ill = true;
  return s;
}
/** the numbers where two sets could differ: every boundary, between boundaries, beyond them */
function probes(...sets) {
  const r = sets.flatMap(s => s.roots).sort((a, b) => a.cmp(b));
  const out = [Q(-100000), Q(100000), Q(0)];
  r.forEach((v, i) => { out.push(v, v.sub(1), v.add(1)); if (i) out.push(v.add(r[i - 1]).div(2)); });
  return out;
}
const sameS = (a, b) => probes(a, b).every(x => a.test(x) === b.test(x));
const isEmpty = s => probes(s).every(x => !s.test(x));
const isAll = s => probes(s).every(x => s.test(x));
/** the claim text names exactly the set s (an ill-formed chain never does) */
const claims = (text, s) => { try { const c = stmt(text); return !c.ill && sameS(c, s); } catch { return false; } };
const relSet = r => ({ test: x => holds(r.L(x), r.rel, r.R(x)), roots: rootsOf(r), ill: false });
function rootsOf(r) { const d = linOf(x => r.L(x).sub(r.R(x))); return d && d.a.n !== 0 ? [d.b.neg().div(d.a)] : []; }
const setOf = text => stmt(text);
/** an equation's set as { kind: 'one', x } | { kind: 'all' } | { kind: 'none' } */
function kindOf(r) {
  const d = linOf(x => r.L(x).sub(r.R(x)));
  if (!d) throw new Error('not linear');
  if (d.a.n !== 0) return { kind: 'one', x: d.b.neg().div(d.a) };
  return d.b.n === 0 ? { kind: 'all' } : { kind: 'none' };
}
const sameSides = (e, f) => sameFn(e.L, f.L) && sameFn(e.R, f.R) && e.rel === f.rel;
const scaledSides = (e, f, k) => sameFn(x => e.L(x).mul(k), f.L) && sameFn(x => e.R(x).mul(k), f.R);
/** relation r says "A rel B" (either way round) */
function relMatches(r, A, B, rel) {
  if (sameFn(r.L, A) && sameFn(r.R, B)) return r.rel === rel;
  if (sameFn(r.L, B) && sameFn(r.R, A)) return r.rel === FLIP[rel];
  return false;
}

// ---------------------------------------------------------------- steps on both sides
/**
 * apply a move written in words to the relation e → the new relation (null when the text is not a move). × or ÷ by a
 * negative number turns an inequality symbol. "the left side only" changes the left side alone.
 */
function applyMove(e, text) {
  const t = norm(text);
  let m, side = 'both';
  const one = /\b(?:the )?left side(?: only)?$/;
  if ((m = t.match(/^(Add|Subtract) (.+?) (?:to|from) (both sides|the left side(?: only)?)$/i))) {
    const g = ex(m[2]), s = m[1].toLowerCase() === 'add' ? 1 : -1;
    side = one.test(m[3]) ? 'left' : 'both';
    const L = x => e.L(x).add(g(x).mul(s)), R = side === 'both' ? x => e.R(x).add(g(x).mul(s)) : e.R;
    return { L, R, rel: e.rel, ok: true };
  }
  if ((m = t.match(/^(Multiply|Divide) (both sides|the left side(?: only)?) by (.+)$/i))) {
    side = one.test(m[2]) ? 'left' : 'both';
    const g = ex(m[3]);
    const div = m[1].toLowerCase() === 'divide';
    if (g.letters.length) {
      // × or ÷ by an expression in x: not a number, the step is not reversible for every x
      const L = x => (div ? e.L(x).div(g(x)) : e.L(x).mul(g(x))), R = side === 'both' ? x => (div ? e.R(x).div(g(x)) : e.R(x).mul(g(x))) : e.R;
      return { L, R, rel: e.rel, ok: false, byX: true };
    }
    const k0 = g(Q(0));
    if (div && k0.n === 0) return null;
    const k = div ? Q(1).div(k0) : k0;
    const L = x => e.L(x).mul(k), R = side === 'both' ? x => e.R(x).mul(k) : e.R;
    return { L, R, rel: k.n < 0 ? FLIP[e.rel] : e.rel, ok: k.n !== 0, k };
  }
  return null;
}
/** a move is an equivalence step: the same operation on both whole sides, × or ÷ by a nonzero number */
const safeMove = (e, text) => { const f = applyMove(e, text); return !!f && f.ok && !/left side/i.test(text); };

// ---------------------------------------------------------------- reading the item
const P = q => htmlMath(q.promptHtml ?? q.prompt);
const B = q => texMath(q.board);
const ch = q => (q.choicesHtml ?? q.choices ?? []).map(htmlMath);
function pick(truths) { const hits = truths.map((t, i) => (t ? i : -1)).filter(i => i >= 0); return hits.length === 1 ? hits[0] : -1; }
const tryB = fn => { try { return !!fn(); } catch { return false; } };
/** the board's lines (split on \\, line numbers "\text{3}\quad" dropped) */
const boardLines = q => String(q.board).split(/\\\\/).map(l => texMath(l.replace(/^\s*\\text\{\d+\}\\quad\s*/, '')));
/** the bold parts of the prompt HTML, as maths text */
const bolds = q => [...String(q.promptHtml ?? '').matchAll(/<b>([\s\S]*?)<\/b>/g)].map(m => htmlMath(m[1]));

// ---------------------------------------------------------------- families
const F = {
  // ---- 1 equivalent means the same solution set
  sameSet(q) {
    const [t1, t2] = String(q.board).split(/\\qquad/).map(texMath);
    const e1 = relation(t1), e2 = relation(t2), s1 = kindOf(e1), s2 = kindOf(e2);
    const equiv = sameS(relSet(e1), relSet(e2));
    return pick(ch(q).map(c => tryB(() => {
      const m = c.match(/^(Equivalent|Not equivalent): (.+)$/);
      if (!m || (m[1] === 'Equivalent') !== equiv) return false;
      const r = m[2];
      let k;
      if ((k = r.match(/^both have only the solution x = (.+)$/))) return s1.kind === 'one' && s2.kind === 'one' && s1.x.eq(qOf(k[1])) && s2.x.eq(qOf(k[1]));
      if ((k = r.match(/^the second is the first times (.+)$/))) return scaledSides(e1, e2, qOf(k[1]));
      if ((k = r.match(/^the second is the first with (.+) added$/))) { const v = qOf(k[1]); return sameFn(x => e1.L(x).add(v), e2.L) && sameFn(x => e1.R(x).add(v), e2.R); }
      if ((k = r.match(/^the second is the first with (.+) taken away$/))) { const v = qOf(k[1]); return sameFn(x => e1.L(x).sub(v), e2.L) && sameFn(x => e1.R(x).sub(v), e2.R); }
      if ((k = r.match(/^x = (.+) solves the first, but the second has x = (.+)$/))) return s1.kind === 'one' && s2.kind === 'one' && s1.x.eq(qOf(k[1])) && s2.x.eq(qOf(k[2]));
      if (/^an equation that changed has a new solution$/.test(r)) return !equiv;
      return false; // "neither one is true for every x", "both are false at x = 0": not reasons about the sets
    })));
  },
  pickEquiv(q) {
    const s = relSet(relation(B(q)));
    return pick(ch(q).map(c => claims(c, s)));
  },
  // ---- 2 steps you can undo
  undoStep(q) {
    const [t1, t2] = String(q.board).split(/\\;?\\longrightarrow\\;?/).map(texMath);
    const e1 = relation(t1), e2 = relation(t2);
    // a step on an equation is the same operation on both sides; a one-side change is not a step (see sane)
    return pick(ch(q).map(c => tryB(() => { const f = applyMove(e2, c); return f && safeMove(e2, c) && sameSides(f, e1); })));
  },
  whyKeeps(q) {
    const [t1, t2] = String(q.board).split(/\\;?\\longrightarrow\\;?/).map(texMath);
    const e1 = relation(t1), e2 = relation(t2);
    return pick(ch(q).map(c => tryB(() => {
      let m;
      if ((m = c.match(/^A solution of the first solves the second, and the step can be undone \((.+)\): nothing lost or gained$/))) {
        const f = applyMove(e2, m[1]);
        return f && f.ok && sameSides(f, e1) && sameS(relSet(e1), relSet(e2));
      }
      if (/^The left side has the same value as before for every x, so the same numbers make it true$/.test(c)) return sameFn(e1.L, e2.L) && sameFn(e1.R, e2.R);
      return false; // "moved to the other side", "x = v makes both lines true", "change one side however you like"
    })));
  },
  // ---- 3 steps that lose or gain solutions
  badStep(q) {
    // "can change the solution set": a step that is not an equivalence step (one side only, × 0, ÷ x, a wrong
    // rewrite) can change it; the same operation on both sides with a nonzero number, or a right rewrite, cannot.
    const text = B(q), e = relation(text);
    return pick(ch(q).map(c => tryB(() => {
      const m = c.match(/^Rewrite (.+) as (.+)$/);
      if (m) {
        if (!tight(text).includes(tight(m[1]))) return false;
        return !sameFn(ex(m[1]), ex(m[2]));
      }
      const f = applyMove(e, c);
      if (!f) return false;
      return !safeMove(e, c);
    })));
  },
  lostSolution(q) {
    const s = relSet(relation(B(q)));
    return pick(ch(q).map(c => tryB(() => {
      const claim = c.replace(/^Only /, '').replace(/(?::|, as) .*$/, '');
      return claims(claim, s);
    })));
  },
  // ---- 4 + 5 order: + / − and positive scaling keep it, negative scaling turns it
  keepDir(q) { return orderStep(q).index; },
  flipNum(q) { return orderStep(q).index; },
  stepIneq(q) { return pickSet(q); },
  doesFlip(q) {
    const m = P(q).match(/you (multiply both sides by|divide both sides by|add|subtract) (.+?)(?: (?:to|from) both sides)?\. What happens/);
    const k = qOf(m[2]);
    const flips = /multiply|divide/.test(m[1]) && k.n < 0;
    return pick(ch(q).map(c => {
      if (/^It reverses the direction: the step multiplies or divides by a negative number$/.test(c)) return flips;
      if (/^It keeps the direction: the step adds, subtracts, or scales by a positive number$/.test(c)) return !flips && !(/multiply|divide/.test(m[1]) && k.n === 0);
      return false; // "negative numbers in the inequality", "subtracting turns it", "× and ÷ never change it"
    }));
  },
  // ---- 6 a reason for every step
  reasonFor(q) {
    const m = P(q).match(/takes line (\d+) .* to line (\d+) /);
    const lines = boardLines(q), a = lines[Number(m[1]) - 1], b = lines[Number(m[2]) - 1];
    const e = relation(a), f = relation(b);
    return pick(ch(q).map(c => tryB(() => {
      let k;
      if ((k = c.match(/^Distributive property: (.+) is (.+)$/))) {
        if (!tight(a).includes(tight(k[1])) || !/\(/.test(k[1])) return false;
        const g = relation(tight(a).replace(tight(k[1]), `(${tight(k[2])})`));
        return sameFn(ex(k[1]), ex(k[2])) && sameSides(g, f);
      }
      if (/^Combine like terms$/.test(c)) return !/\(/.test(a) && sameFn(e.L, f.L) && sameFn(e.R, f.R);
      if (/both sides/.test(c)) { const g = applyMove(e, c); return g && g.ok && sameSides(g, f); }
      return false; // "Subtract 5x" (which side?), "move it and change its sign", "move it as a divisor"
    })));
  },
  propName(q) {
    const m = P(q).match(/from line (\d+) to line (\d+)/);
    const lines = boardLines(q), e = relation(lines[Number(m[1]) - 1]), f = relation(lines[Number(m[2]) - 1]);
    let prop = null;
    if (sameFn(e.L, f.L) && sameFn(e.R, f.R)) prop = /\(/.test(lines[Number(m[1]) - 1]) ? 'distributive property' : 'combining like terms';
    else {
      const dL = linOf(x => f.L(x).sub(e.L(x))), dR = linOf(x => f.R(x).sub(e.R(x)));
      if (dL && dR && dL.a.eq(dR.a) && dL.b.eq(dR.b)) {
        const lead = dL.a.n !== 0 ? dL.a : dL.b;
        prop = lead.n < 0 ? 'subtraction property of equality' : 'addition property of equality';
      } else {
        const Le = linOf(e.L), Lf = linOf(f.L), Re = linOf(e.R), Rf = linOf(f.R);
        let k = null;
        for (const [u, v] of [[Le, Lf], [Re, Rf]]) for (const key of ['a', 'b']) if (u[key].n !== 0) k ??= v[key].div(u[key]);
        if (k && scaledSides(e, f, k)) prop = Math.abs(k.n) === 1 && k.d > 1 ? 'division property of equality' : 'multiplication property of equality';
      }
    }
    return pick(ch(q).map(c => c.toLowerCase() === prop));
  },
  // ---- 7 + 8 + 10 solve
  chainSolve(q) { return solveNum(B(q)); },
  bothSolve(q) { return solveNum(B(q)); },
  lcdSolve(q) { return solveNum(B(q)); },
  nextReason(q) {
    const e = relation(B(q));
    return pick(ch(q).map(c => tryB(() => {
      const m = c.match(/^(.+?), (by the distributive property|because .+|and no reason is needed .+)$/);
      if (!m) return false;
      const f = relation(m[1]), r = m[2];
      let k;
      if (r === 'by the distributive property') return /\(/.test(B(q)) && sameFn(e.L, f.L) && sameFn(e.R, f.R);
      if ((k = r.match(/^because both sides were divided by (.+)$/))) return sameSides(applyMove(e, `Divide both sides by ${k[1]}`), f);
      if ((k = r.match(/^because both sides were multiplied by (.+)$/))) return sameSides(applyMove(e, `Multiply both sides by ${k[1]}`), f);
      if ((k = r.match(/^because (.+) was subtracted from both sides$/))) return sameSides(applyMove(e, `Subtract ${k[1]} from both sides`), f);
      if ((k = r.match(/^because (.+) was added to both sides$/))) return sameSides(applyMove(e, `Add ${k[1]} to both sides`), f);
      return false; // the answer still needs its reasons
    })));
  },
  collectSide(q) {
    const e = relation(B(q));
    return pick(ch(q).map(c => tryB(() => {
      if (/since/.test(c)) return false; // x-terms may be added to / subtracted from both sides like any term
      const f = applyMove(e, c);
      if (!f || !f.ok) return false;
      const L = linOf(f.L), R = linOf(f.R);
      return (L.a.n === 0) !== (R.a.n === 0) && (L.a.n > 0 || R.a.n > 0);
    })));
  },
  // ---- 9 identity / contradiction
  howMany(q) {
    const s = relSet(relation(B(q)));
    return pick(ch(q).map(c => (/^There must be a mistake/.test(c) ? false : claims(c.replace(/^One solution: /, ''), s))));
  },
  whySet(q) {
    const s = relSet(relation(B(q).split('⇒')[0]));
    return pick(ch(q).map(c => tryB(() => {
      let m;
      if ((m = c.match(/^All real numbers: the equation has the same solutions as (.+), which is true for every x$/))) return isAll(s) && isAll(relSet(relation(m[1])));
      if ((m = c.match(/^No solution: the equation has the same solutions as (.+), which is never true$/))) return isEmpty(s) && isEmpty(relSet(relation(m[1])));
      return false; // "x = 0: the x-terms became 0", "x disappeared, so ..." are not why
    })));
  },
  lcdLine(q) {
    const e = relation(B(q)), k = qOf(P(q).match(/ by (\d+)\. Which equation/)[1]);
    return pick(ch(q).map(c => tryB(() => scaledSides(e, relation(c), k))));
  },
  // ---- 11 letters
  rearrange(q) {
    const [formula, target] = bolds(q);
    const [Ls, Rs] = norm(formula).split('=');
    const L = parse(Ls), R = parse(Rs), others = [...new Set([...L.letters, ...R.letters])].filter(v => v !== target);
    return pick(ch(q).map(c => tryB(() => {
      const m = norm(c).match(/^(\S+) = (.+?)(?: \(.+ ≠ .+\))?$/);
      if (!m || m[1] !== target) return false;
      const g = parse(m[2]);
      if (g.letters.includes(target)) return false; // still has the target on the right: not solved for it
      // the choice must make the formula true for every allowed value of the other letters
      let tried = 0;
      for (const env of envs(others, 12)) {
        const look = n => env[n];
        let tv;
        try { tv = g(look); } catch { continue; } // a value that the condition excludes
        const full = n => (n === target ? tv : env[n]);
        let l, r;
        try { l = L(full); r = R(full); } catch { continue; }
        tried++;
        if (!l.eq(r)) return false;
      }
      return tried > 4;
    })));
  },
  formulaCheck(q) {
    const formula = bolds(q)[0], p = P(q);
    const target = p.match(/Solve for (\S+?), then find/)[1];
    const when = p.slice(p.indexOf(' when ') + 6);
    const env = {};
    for (const m of when.matchAll(/([A-Za-z][₀-₉]?) = \$?(−?-?(?:\d{1,3}(?:,\d{3})+|\d+)(?:\.\d+)?)/g)) env[m[1]] = qOf(m[2]);
    const [Ls, Rs] = norm(formula).split('=');
    const L = parse(Ls), R = parse(Rs);
    const D = t => { const look = n => (n === target ? t : env[n]); return L(look).sub(R(look)); };
    // the formula is linear in the target, or in 1 / target (d = m/V): find the root, then check it
    for (const inv of [false, true]) {
      try {
        const G = u => D(inv ? Q(1).div(u) : u);
        const g1 = G(Q(1)), g2 = G(Q(2)), g3 = G(Q(3));
        if (!g3.sub(g2).eq(g2.sub(g1))) continue;
        const a = g2.sub(g1), u = Q(1).sub(g1.div(a));
        const t = inv ? Q(1).div(u) : u;
        if (D(t).n === 0) return vOut(t);
      } catch { /* try the other form */ }
    }
    return undefined;
  },
  nonzeroCond(q) {
    const p = P(q);
    const D = parse(p.match(/divide both sides by (.+?)\. When is that step allowed\?$/)[1]);
    return pick(ch(q).map(c => tryB(() => {
      if (/^Always/.test(c)) return D.letters.length === 0 && D(() => Q(0)).n !== 0;
      const m = c.match(/^Only when (.+)$/);
      if (!m) return false;
      const atoms = m[1].split(/ and /).map(a => a.split('≠').map(u => parse(u.trim())));
      const letters = [...new Set([...D.letters, ...atoms.flatMap(([u, v]) => [...u.letters, ...v.letters])])];
      const consts = [...new Set([0, 1, -1, 2, -2, ...numsIn(p + ' ' + c).flatMap(v => [v, -v])])].map(v => Q(v));
      for (const env of grid(letters, consts)) {
        const look = n => env[n];
        const need = !D(look).eq(0), says = atoms.every(([u, v]) => !u(look).eq(v(look)));
        if (need !== says) return false;
      }
      return true;
    })));
  },
  // ---- 12 a letter that can be 0
  paramCases(q) {
    const p = P(q), env = {};
    for (const m of p.matchAll(/([abc]) = (−?-?\d+(?:\.\d+)?)/g)) env[m[1]] = qOf(m[2]);
    const r = { L: x => env.a.mul(x).add(env.b), R: () => env.c, rel: '=' }, s = relSet(r);
    return pick(ch(q).map(c => tryB(() => {
      const m = c.match(/^One solution: x = (.+)$/);
      if (m) {
        if (env.a.n === 0) return false;
        const v = parse(m[1])(n => env[n]);
        return claims(`x = ${v.toString()}`, s);
      }
      return claims(c, s);
    })));
  },
  paramValue(q) {
    const p = P(q);
    let m;
    if ((m = p.match(/^Solve (.+) when (\w) = (.+?)\. x = \?$/))) {
      const r = twoLetter(m[1]), k = qOf(m[3]);
      const s = kindOf({ L: x => r.L(x, k), R: x => r.R(x, k), rel: '=' });
      return s.kind === 'one' ? vOut(s.x) : undefined;
    }
    m = p.match(/^For which value of (\w) (?:does (.+) have NO solution|is EVERY number a solution of (.+))\? \w = \?$/);
    const r = twoLetter(m[2] ?? m[3]);
    const D = (x, k) => r.L(x, k).sub(r.R(x, k));
    const A = k => D(Q(1), k).sub(D(Q(0), k));
    const a0 = A(Q(0)), a1 = A(Q(1));
    return vOut(a0.neg().div(a1.sub(a0)));
  },
  // ---- 13 + 14 + 15 inequalities
  ineqSolve(q) { return pickSet(q); },
  revSolve(q) { return pickSet(q); },
  ineqGraph(q) {
    const s = relSet(relation(B(q)));
    return pick(ch(q).map(c => tryB(() => {
      const m = c.match(/^(Open|Closed) dot at (.+), shaded to the (left|right)$/);
      const rel = m[3] === 'left' ? (m[1] === 'Closed' ? '≤' : '<') : (m[1] === 'Closed' ? '≥' : '>');
      return claims(`x ${rel} ${m[2]}`, s);
    })));
  },
  revStep(q) {
    const e = relation(B(q)), a = linOf(e.L).a.sub(linOf(e.R).a);
    return pick(ch(q).map(c => tryB(() => {
      if (/^No step: the symbol never turns$/.test(c)) return a.n > 0;
      const m = c.match(/^Divide both sides by (.+)$/);
      if (m) { const k = qOf(m[1]); return k.n < 0 && k.eq(a); }
      return false; // adding or subtracting never turns the symbol
    })));
  },
  ineqCancel(q) { return pickSet(q); },
  constStatement(q) {
    const s = relSet(relation(B(q).split('⇒')[0]));
    return pick(ch(q).map(c => claims(c, s)));
  },
  // ---- 16 compound
  compSolve(q) { return pick(ch(q).map(c => claims(c, setOf(B(q))))); },
  andOr(q) { return pick(ch(q).map(c => claims(c, setOf(B(q))))); },
  compContext(q) {
    const s = setOf(contextSet(P(q)));
    return pick(ch(q).map(c => claims(c, s)));
  },
  // ---- 17 check in the original
  checkVerdict(q) {
    const e = relation(B(q)), v = qOf(P(q).match(/ and got \w = (.+?)\. Is that/)[1]);
    const l = e.L(v), r = e.R(v);
    return pick(ch(q).map(c => tryB(() => {
      let m;
      if ((m = c.match(/^It is not: in the original, the left side is (.+) and the right side is (.+)$/))) return !l.eq(r) && l.eq(qOf(m[1])) && r.eq(qOf(m[2]));
      if ((m = c.match(/^It is a solution: in the original, both sides are (.+)$/))) return l.eq(r) && l.eq(qOf(m[1]));
      return false; // redoing the steps or checking the last line does not check the original
    })));
  },
  checkSide(q) {
    const m = P(q).match(/^Check \w = (.+?) in the ORIGINAL equation (.+)\. What is the value of its (left|right) side\?$/);
    const e = relation(m[2]), v = qOf(m[1]);
    return vOut(m[3] === 'left' ? e.L(v) : e.R(v));
  },
  firstBad(q) {
    const sets = boardLines(q).map(t => relSet(relation(t)));
    let bad = 0;
    for (let i = 1; i < sets.length; i++) if (!sameS(sets[i], sets[i - 1])) { bad = i + 1; break; }
    return pick(ch(q).map(c => (bad ? c === `Line ${bad}` : /^None/.test(c))));
  },
  // ---- 18 test points
  testPoint(q) {
    const m = P(q).match(/^Someone claims the solution set of (.+) is (.+?)\. Test \w = (.+?) in the ORIGINAL\./);
    const e = relation(m[1]), claim = setOf(m[2]), v = qOf(m[3]);
    const T = holds(e.L(v), e.rel, e.R(v)), M = claim.test(v);
    return pick(ch(q).map(c => tryB(() => {
      let k;
      if ((k = c.match(/^No error found: x = (.+?) agrees with the claim, but one test can’t prove the whole set$/))) return qOf(k[1]).eq(v) && T === M;
      if ((k = c.match(/^The claim is wrong: x = (.+?) makes the inequality (true|false), but (.+?) is (not )?in the claimed set$/))) {
        return qOf(k[1]).eq(v) && qOf(k[3]).eq(v) && (k[2] === 'true') === T && !k[4] === M && T !== M;
      }
      return false; // one agreeing test proves nothing; any value can test a claim
    })));
  },
  whichTests(q) {
    const s = setOf(B(q)), c0 = s.roots[0];
    return pick(ch(q).map(c => tryB(() => {
      if (/only$/.test(c)) return false;
      const vs = c.split(/, | and /).map(qOf);
      return vs.length === 3 && vs.some(v => v.eq(c0)) && vs.some(v => v.cmp(c0) < 0) && vs.some(v => v.cmp(c0) > 0);
    })));
  },
  // ---- 19 the complete set
  completeArg(q) {
    const m = P(q).match(/^Which argument proves that the solution set of (.+) is exactly (.+)\?$/);
    const e = relation(m[1]), s = relSet(e);
    return pick(ch(q).map(c => tryB(() => {
      let k;
      if ((k = c.match(/^Each step \((.+)\) can be undone, so the (?:inequality|equation) has exactly the solutions of (.+)$/))) {
        let f = e;
        for (const op of k[1].split(/, /)) {
          let o;
          if ((o = op.match(/^(add|subtract) (.+)$/))) f = applyMove(f, `${o[1]} ${o[2]} ${o[1] === 'add' ? 'to' : 'from'} both sides`);
          else if ((o = op.match(/^divide by (positive )?(.+)$/))) {
            if (o[1] && qOf(o[2]).n <= 0) return false;
            f = applyMove(f, `Divide both sides by ${o[2]}`);
          } else return false;
          if (!f || !f.ok) return false;
        }
        const target = setOf(k[2]);
        return sameS(relSet(f), target) && sameS(s, target);
      }
      if ((k = c.match(/^Subtracting (.+) from both sides \(reversible\) leaves a false statement, false for every x$/))) {
        const f = applyMove(e, `Subtract ${k[1]} from both sides`);
        return linOf(f.L).a.n === 0 && linOf(f.R).a.n === 0 && isEmpty(relSet(f)) && isEmpty(s);
      }
      if ((k = c.match(/^Distributing gives (.+): the same expression on both sides, true for every x$/))) {
        const f = relation(k[1]);
        return sameFn(f.L, f.R) && sameFn(f.L, e.L) && sameFn(f.R, e.R) && isAll(s);
      }
      return false; // a few values that work (or not), "the answer the steps gave", "x cancels, so x = 0"
    })));
  },
  memberVsAll(q) {
    const m = P(q).match(/^x = (.+?) makes (.+) true\. What has this check shown\?$/);
    const v = qOf(m[1]), e = relation(m[2]);
    return pick(ch(q).map(c => tryB(() => {
      const k = c.match(/^Only that (.+) is a solution; it says nothing about other numbers$/);
      return !!k && qOf(k[1]).eq(v) && holds(e.L(v), e.rel, e.R(v));
    })));
  },
  // ---- 20 context
  viable(q) {
    const s = relSet(relation(B(q))), c = s.roots[0];
    // a whole count: the set is a ray; the answer is its whole number nearest the boundary
    const up = s.test(c.add(1000));
    const f = Math.floor(c.value);
    const cands = up ? [f, f + 1, f + 2] : [f + 1, f, f - 1];
    for (const n of cands) if (s.test(Q(n))) return n;
    return undefined;
  },
  domainPick(q) {
    const p = P(q);
    const m = p.match(/^\w is the number of (.+?) you can afford\. The budget inequality gives \w ≤ (.+?)\. Which values/);
    const M = qOf(m[2]);
    const amount = /^(gallons|miles|hours|pounds|minutes|ounces|feet|yards|liters|quarts|cups|kilograms|meters)\b/.test(m[1]);
    return pick(ch(q).map(c => tryB(() => {
      let k;
      if ((k = c.match(/^Any number from 0 to (.+)$/))) return amount && qOf(k[1]).eq(M);
      if ((k = c.match(/^0, 1, 2, …, (\d+)(?: only)?$/))) return !amount && Number(k[1]) === Math.floor(M.value);
      return false; // "any number ≤ M" lets in negative amounts
    })));
  },
  // ---- 21 the model
  modelCheck(q) {
    const st = story(P(q));
    return pick(ch(q).map(c => tryB(() => relMatches(relation(c), st.A, st.B, st.rel))));
  },
  critique(q) {
    const p = P(q), st = story(p);
    const m = p.match(/Sam writes (.+?) and solves it correctly: (.+?)\. Is his answer/);
    const his = relation(m[1]);
    const modelOk = relMatches(his, st.A, st.B, st.rel);
    const algebraOk = sameS(relSet(his), setOf(m[2]));
    const flipped = { ...his, rel: FLIP[his.rel] };
    return pick(ch(q).map(c => tryB(() => {
      let k;
      if (/^Yes: the model fits the words and the algebra is right$/.test(c)) return modelOk && algebraOk;
      if (/^No: the symbol should point the other way$/.test(c)) return !modelOk && relMatches(flipped, st.A, st.B, st.rel);
      if ((k = c.match(/^No: the model is wrong\. “At (most|least)” needs (≤|≥), so his answer points the wrong way$/))) {
        return !modelOk && st.phrase === `at ${k[1]}` && relMatches({ ...his, rel: k[2] }, st.A, st.B, st.rel) && relMatches(flipped, st.A, st.B, st.rel);
      }
      if (/^No: he made an algebra mistake$/.test(c)) return !algebraOk;
      return false; // right algebra does not make a wrong model right; inequalities are fine for word problems
    })));
  },
};

// ---------------------------------------------------------------- helpers for the families
/** the one choice that names the solution set of the board's relation */
function pickSet(q) {
  const s = relSet(relation(B(q)));
  return pick(ch(q).map(c => claims(c, s)));
}
function solveNum(text) {
  const s = kindOf(relation(text));
  return s.kind === 'one' ? vOut(s.x) : undefined;
}
/** keepDir / flipNum: the board "a REL b", a step on both sides → the choice that is what the step gives */
function orderStep(q) {
  const r = relation(B(q)), a = r.L(Q(0)), b = r.R(Q(0));
  const m = P(q).match(/(Add|Subtract|Multiply|Divide) (?:both sides by )?(.+?)(?: (?:to|from) both sides)?\. Which statement/);
  const k = qOf(m[2]);
  const op = { Add: v => v.add(k), Subtract: v => v.sub(k), Multiply: v => v.mul(k), Divide: v => v.div(k) }[m[1]];
  const turns = /Multiply|Divide/.test(m[1]) && k.n < 0;
  const A = op(a), Bv = op(b), rel = turns ? FLIP[r.rel] : r.rel;
  const cs = ch(q);
  const index = pick(cs.map(c => tryB(() => {
    const f = relation(c);
    return f.L(Q(0)).eq(A) && f.R(Q(0)).eq(Bv) && f.rel === rel;
  })));
  const trueOnes = cs.filter(c => tryB(() => { const f = relation(c); return holds(f.L(Q(0)), f.rel, f.R(Q(0))); }));
  return { index, trueOnes };
}
/** an equation in x and one more letter (k) → { L(x, k), R(x, k) } */
function twoLetter(text) {
  const [Ls, Rs] = norm(text).split('=');
  const L = parse(Ls), R = parse(Rs);
  const look = (x, k) => n => (n === 'x' ? x : k);
  return { L: (x, k) => L(look(x, k)), R: (x, k) => R(look(x, k)) };
}
/** the words of a compound-inequality context → a statement about v */
function contextSet(p) {
  let m;
  if ((m = p.match(/at least (\d+) and at most (\d+)/))) return `${m[1]} ≤ v ≤ ${m[2]}`;
  if ((m = p.match(/at least (\d+) in tall and under (\d+) in tall/))) return `${m[1]} ≤ v < ${m[2]}`;
  if ((m = p.match(/younger than (\d+) or adults older than (\d+)/))) return `v < ${m[1]} or v > ${m[2]}`;
  if ((m = p.match(/under (\d+) or (\d+) and older/))) return `v < ${m[1]} or v ≥ ${m[2]}`;
  if ((m = p.match(/between (\d+) °F and (\d+) °F, inclusive/))) return `${m[1]} ≤ v ≤ ${m[2]}`;
  throw new Error('unknown context');
}
/** a budget / goal story → { A: the amount as a function of the count, B: the limit, rel, phrase } */
function story(p) {
  let m;
  const lin = (c, r) => x => Q(c).add(Q(r).mul(x));
  const n = t => qOf(t);
  if ((m = p.match(/has \$([\d.]+) saved and adds \$([\d.]+) a week\. He wants at least \$([\d.]+) after/)))
    return { A: lin(n(m[1]), n(m[2])), B: () => n(m[3]), rel: '≥', phrase: 'at least' };
  if ((m = p.match(/charges \$([\d.]+) a month plus \$([\d.]+) per class\. \w+ can spend at most \$([\d.]+) a month/)))
    return { A: lin(n(m[1]), n(m[2])), B: () => n(m[3]), rel: '≤', phrase: 'at most' };
  if ((m = p.match(/gets \$([\d.]+) a week plus \$([\d.]+) per hour\. He needs to earn at least \$([\d.]+) a week/)))
    return { A: lin(n(m[1]), n(m[2])), B: () => n(m[3]), rel: '≥', phrase: 'at least' };
  if ((m = p.match(/An elevator holds at most ([\d.]+) lb\. A ([\d.]+)-lb cart carries \w boxes of ([\d.]+) lb each/)))
    return { A: lin(n(m[2]), n(m[3])), B: () => n(m[1]), rel: '≤', phrase: 'at most' };
  if ((m = p.match(/A taxi charges \$([\d.]+) plus \$([\d.]+) per mile\. \w+ has at most \$([\d.]+) for a ride/)))
    return { A: lin(n(m[1]), n(m[2])), B: () => n(m[3]), rel: '≤', phrase: 'at most' };
  throw new Error('unknown story');
}
/** every whole number written in a text (plain, signs kept) */
const numsIn = t => [...norm(t).matchAll(/(-?)(\d+)/g)].map(m => (m[1] ? -1 : 1) * Number(m[2]));
/** every assignment of the letters to the values (all combinations) */
function* grid(letters, values) {
  const idx = letters.map(() => 0);
  if (!letters.length) { yield {}; return; }
  for (;;) {
    const env = {};
    letters.forEach((l, i) => { env[l] = values[idx[i]]; });
    yield env;
    let i = 0;
    while (i < idx.length && ++idx[i] === values.length) idx[i++] = 0;
    if (i === idx.length) return;
  }
}
/** n pseudo-random assignments of small exact values (fixed, so the oracle is deterministic) */
function* envs(letters, n) {
  const vals = [Q(3), Q(-2), Q(5, 2), Q(7), Q(-11, 3), Q(4), Q(13, 5), Q(-1), Q(9), Q(6, 7), Q(2), Q(-5)];
  for (let i = 0; i < n; i++) {
    const env = {};
    letters.forEach((l, j) => { env[l] = vals[(i * 5 + j * 7 + j * i) % vals.length]; });
    yield env;
  }
}

// ---------------------------------------------------------------- the world
function sane(q) {
  const out = [];
  const p = P(q);
  let m;
  try {
    switch (q.family) {
      case 'keepDir': case 'flipNum': {
        const { trueOnes } = orderStep(q);
        if (trueOnes.length > 1) out.push(`"Which statement is true now?": ${trueOnes.join(' and ')} are both true statements`);
        break;
      }
      case 'lostSolution': {
        if ((m = p.match(/^Ray rewrites (.+?) as (.+?) and gets x = (.+?)\./))) {
          const s = kindOf(relation(m[2]));
          if (!(s.kind === 'one' && s.x.eq(qOf(m[3])))) out.push(`Ray's line ${m[2]} does not give x = ${m[3]}`);
        }
        if ((m = p.match(/^Lee solves (.+?): .*That gives (.+?), so Lee says/))) {
          const e = relation(m[1]), d = linOf(x => e.L(x).sub(e.R(x)));
          if (d.b.n !== 0) out.push('after the constants go, the sides are not both x-terms: dividing by x does not give two numbers');
        }
        break;
      }
      case 'whySet': case 'constStatement': {
        const [t, left] = B(q).split('⇒').map(u => u.trim());
        const e = relation(t), l = relation(left);
        const d = linOf(x => e.L(x).sub(e.R(x)));
        if (d.a.n !== 0) out.push('x does not cancel in the original');
        else {
          const lTrue = holds(l.L(Q(0)), l.rel, l.R(Q(0))), eTrue = holds(e.L(Q(0)), e.rel, e.R(Q(0)));
          if (lTrue !== eTrue) out.push(`the leftover statement ${left} does not follow from ${t}`);
        }
        break;
      }
      case 'undoStep': {
        const [t1, t2] = String(q.board).split(/\\;?\\longrightarrow\\;?/).map(texMath);
        const e1 = relation(t1), e2 = relation(t2);
        const oneSide = ch(q).filter(c => /left side/.test(c) && tryB(() => sameSides(applyMove(e2, c), e1)));
        if (oneSide.length) out.push(`"${oneSide[0]}" also takes the second equation back to the first (that side's partner is 0)`);
        break;
      }
      case 'firstBad': {
        const lines = boardLines(q);
        const v = qOf(p.match(/x = (.+?) does not solve line 1/)[1]), e = relation(lines[0]);
        if (holds(e.L(v), e.rel, e.R(v))) out.push(`x = ${v} does solve line 1`);
        const last = kindOf(relation(lines[lines.length - 1]));
        if (!(last.kind === 'one' && last.x.eq(v))) out.push('the last line is not the value the prompt names');
        break;
      }
      case 'memberVsAll': {
        m = p.match(/^x = (.+?) makes (.+) true\./);
        const e = relation(m[2]), v = qOf(m[1]);
        if (!holds(e.L(v), e.rel, e.R(v))) out.push(`x = ${m[1]} does not make ${m[2]} true`);
        break;
      }
      case 'completeArg': {
        m = p.match(/solution set of (.+) is exactly (.+)\?$/);
        if (!sameS(relSet(relation(m[1])), setOf(m[2]))) out.push(`the solution set of ${m[1]} is not ${m[2]}`);
        break;
      }
      case 'critique': {
        m = p.match(/Sam writes (.+?) and solves it correctly: (.+?)\. Is his answer/);
        if (!sameS(relSet(relation(m[1])), setOf(m[2]))) out.push(`"solves it correctly" but ${m[1]} does not give ${m[2]}`);
        break;
      }
      case 'paramValue': {
        if ((m = p.match(/^For which value of (\w) (does (.+) have NO solution|is EVERY number a solution of (.+))\? \w = \?$/))) {
          const k = F.paramValue(q), r = twoLetter(m[3] ?? m[4]);
          const s = kindOf({ L: x => r.L(x, Q(k)), R: x => r.R(x, Q(k)), rel: '=' });
          if (m[3] && s.kind !== 'none') out.push(`no value of ${m[1]} gives NO solution`);
          if (m[4] && s.kind !== 'all') out.push(`no value of ${m[1]} makes every number a solution`);
        }
        break;
      }
      case 'viable': {
        const v = F.viable(q);
        if (v === undefined || v < 0) out.push('no sensible whole number');
        else if (v === 0) out.push('the answer is 0: nothing to buy or plan');
        break;
      }
      case 'domainPick': {
        m = p.match(/gives \w ≤ (.+?)\. Which/);
        if (qOf(m[1]).cmp(1) < 0) out.push('the budget allows less than 1');
        break;
      }
      case 'revStep': {
        const e = relation(B(q));
        if (linOf(e.L).a.eq(linOf(e.R).a)) out.push('the x-terms cancel: there is no division step');
        break;
      }
      default: break;
    }
  } catch (e) { out.push(`could not read: ${e.message}`); }
  if (q.input === 'choice') {
    let s;
    try { s = solve(q); } catch { s = undefined; }
    if (s === -1) out.push('no single right choice');
  }
  return [...new Set(out)].join('; ');
}

function solve(q) {
  const f = F[q.family];
  if (!f) return undefined;
  return f(q);
}

export default { solve, sane };
