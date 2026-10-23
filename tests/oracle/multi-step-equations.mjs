// Oracle for the lesson "multi-step-equations" (multi-step linear equations with rational coefficients, 8.EE.C.7.b).
// Role O of docs/lessons/QUALITY_LAYER.md: every practice item is worked out from what the student sees (the prompt
// HTML, where the fraction bars live, the board TeX and the choice HTML). Expressions are parsed into exact
// functions of x (fractions kept exact with Q); equations are solved here; a choice is judged by the maths of its
// claim (its conclusion AND its reason: "Yes: they look almost the same" is never a reason).
import { Q } from '../../tools/quality/oracle-kit.mjs';

// ---------------------------------------------------------------- text → maths
const decode = s => String(s ?? '')
  .replace(/&#8202;|&#8201;|&thinsp;|&nbsp;|&#160;/g, ' ').replace(/&minus;/g, '−').replace(/&times;/g, '×')
  .replace(/&divide;/g, '÷').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&le;/g, '≤').replace(/&ge;/g, '≥')
  .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(Number(d))).replace(/&amp;/g, '&');
/** choice / prompt HTML → maths text: a fraction span as ((a)/(b)), a mixed number (w&#8202;fraction) as (w+((a)/(b))) */
function htmlMath(h) {
  let s = String(h ?? '').replace(/<\/?i>/g, '');
  for (let i = 0; i < 4; i++) {
    s = s.replace(/(\d+)&#8202;<span class="fr"><span>([^<]*)<\/span><span>([^<]*)<\/span><\/span>(?:&#8202;)?/g, '($1+(($2)/($3)))')
      .replace(/<span class="fr"><span>([^<]*)<\/span><span>([^<]*)<\/span><\/span>/g, '(($1)/($2))');
  }
  // only real tags go (a bare "<" between numbers is a less-than sign)
  return decode(s.replace(/<br\s*\/?>/g, '\n').replace(/<\/?[a-zA-Z][^>]*>/g, '')).replace(/[ \t]+/g, ' ').trim();
}
/** board TeX → maths text */
function texMath(tex) {
  let s = String(tex ?? '');
  for (let i = 0; i < 6; i++) {
    const before = s;
    s = s.replace(/\\(?:text|mathrm)\{([^{}]*)\}/g, '$1')
      .replace(/(\d+)\\tfrac\{([^{}]*)\}\{([^{}]*)\}/g, '($1+(($2)/($3)))')
      .replace(/\\[td]?frac\{([^{}]*)\}\{([^{}]*)\}/g, '(($1)/($2))');
    if (s === before) break;
  }
  return s.replace(/\\overset\{\?\}\{=\}/g, '=').replace(/\\times/g, '×').replace(/\\div/g, '÷').replace(/\\cdot/g, '·')
    .replace(/\\square/g, '□').replace(/\\ge(q)?\b/g, '≥').replace(/\\le(q)?\b/g, '≤').replace(/\\Rightarrow/g, '⇒')
    .replace(/\\left|\\right/g, '').replace(/\\[,;:! ]|\\quad|\\qquad|~/g, ' ').replace(/[{}]/g, '').replace(/\s+/g, ' ').trim();
}
const norm = s => String(s).replace(/[−–]/g, '-');

// ---------------------------------------------------------------- expressions as exact functions of x
function decQ(t) {
  const m = String(t).match(/^(\d*)(?:\.(\d+))?$/);
  if (!m || (m[1] === '' && !m[2])) throw new Error(`not a number: ${t}`);
  const d = m[2] ? 10 ** m[2].length : 1;
  return Q(Number((m[1] || '0') + (m[2] || '')), d);
}
/** parse an expression in x (any single letter) → (xValue: Q) => Q  (throws on a bad text / division by 0) */
function expr(text) {
  const s = norm(text).replace(/×|·/g, '*').replace(/÷/g, '/').replace(/\$/g, '').replace(/,(?=\d{3})/g, '');
  const toks = [];
  const re = /\s*(\d+\.?\d*|\.\d+|[A-Za-z]|[-+*/()□])/y;
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
    while (peek() === '+' || peek() === '-') { const op = next(), g = T(), a = f; f = op === '+' ? x => a(x).add(g(x)) : x => a(x).sub(g(x)); }
    return f;
  }
  function T() {
    let f = U();
    for (;;) {
      const t = peek();
      if (t === '*') { next(); const g = U(), a = f; f = x => a(x).mul(g(x)); }
      else if (t === '/') { next(); const g = U(), a = f; f = x => a(x).div(g(x)); }
      else if (t !== undefined && (t === '(' || /^[\d.A-Za-z□]/.test(t))) { const g = U(), a = f; f = x => a(x).mul(g(x)); }
      else break;
    }
    return f;
  }
  function U() {
    const t = peek();
    if (t === '-') { next(); const g = U(); return x => g(x).neg(); }
    if (t === '+') { next(); return U(); }
    return P();
  }
  function P() {
    const t = next();
    if (t === '(') { const f = E(); if (next() !== ')') throw new Error('missing )'); return f; }
    if (t === undefined) throw new Error('unexpected end');
    if (t === '□') throw new Error('a box');
    if (/^[A-Za-z]$/.test(t)) return x => x;
    if (/^[\d.]/.test(t)) { const v = decQ(t); return () => v; }
    throw new Error(`unexpected ${t}`);
  }
  const f = E();
  if (p !== toks.length) throw new Error(`trailing tokens in ${s}`);
  return f;
}
const PTS = [Q(0), Q(1), Q(2), Q(-3), Q(7, 5), Q(11), Q(-5, 2)];
const toQ = v => (typeof v === 'object' && v && 'n' in v ? v : Q(v));
const at = (f, v) => { try { return f(toQ(v)); } catch { return null; } };
/** two expressions equal for every x (sampled: both linear or rational in x) */
function sameFn(f, g) {
  for (const v of PTS) {
    const a = at(f, v), b = at(g, v);
    if (a === null && b === null) continue;
    if (a === null || b === null || !a.eq(b)) return false;
  }
  return true;
}
/** the linear form {a, b} of f (a·x + b), or null when f is not linear */
function linOf(f) {
  const f0 = at(f, 0), f1 = at(f, 1);
  if (!f0 || !f1) return null;
  const a = f1.sub(f0), b = f0;
  for (const v of [2, -3, 7, Q(5, 3)]) { const y = at(f, v); if (!y || !y.eq(a.mul(toQ(v)).add(b))) return null; }
  return { a, b };
}

/** "lhs REL rhs" (one relation) → { L, R, rel } */
function relation(text) {
  const m = norm(text).match(/^(.*?)(<=|>=|≤|≥|=|<|>)(.*)$/);
  if (!m || /[=<>≤≥]/.test(m[3])) throw new Error(`not one relation: ${text}`);
  return { L: expr(m[1]), R: expr(m[3]), rel: { '<=': '≤', '>=': '≥' }[m[2]] ?? m[2] };
}
const eqOf = text => { const r = relation(text); if (r.rel !== '=') throw new Error('not an equation'); return r; };
/** the solution set of a linear equation: { kind: 'one', x } | { kind: 'all' } | { kind: 'none' } */
function solSet(e) {
  const d = linOf(x => e.L(x).sub(e.R(x)));
  if (!d) throw new Error('not linear');
  if (d.a.n !== 0) return { kind: 'one', x: d.b.neg().div(d.a) };
  return d.b.n === 0 ? { kind: 'all' } : { kind: 'none' };
}
const sameSet = (s, t) => s.kind === t.kind && (s.kind !== 'one' || s.x.eq(t.x));
const sol = e => { const s = solSet(e); return s.kind === 'one' ? s.x : null; };
/** line `f` is `e` with every term of both sides × k (side by side) */
const scaledSides = (e, f, k) => sameFn(x => e.L(x).mul(k), f.L) && sameFn(x => e.R(x).mul(k), f.R);
/** a number text → Q */
const qOf = t => expr(t)(Q(0));
const isWhole = v => v.d === 1;
const lcm = (a, b) => { const g = (x, y) => (y ? g(y, x % y) : x); return (a / g(a, b)) * b; };
/** every number written in an equation's text (coefficients and constants, exact) */
function numbersIn(text) {
  const out = [];
  const s = norm(text);
  for (const m of s.matchAll(/\(\(([^()]*)\)\/\((\d+(?:\.\d+)?)\)\)|(\d+\.\d+|\d+)/g)) {
    if (m[1] !== undefined) {
      const den = decQ(m[2]);
      if (/^\d+(\.\d+)?$/.test(m[1].trim())) { out.push(decQ(m[1].trim()).div(den)); continue; }
      // a numerator with x in it ((x + 3)/4, (2x)/3): every number in it, and x's own coefficient, over the bar
      for (const t of m[1].split(/[-+]/).map(u => u.trim()).filter(Boolean)) {
        const c = t.match(/^(\d+(?:\.\d+)?)?\s*([A-Za-z])?$/);
        if (c) out.push(decQ(c[1] ?? '1').div(den));
      }
    } else out.push(decQ(m[3]));
  }
  return out;
}
/** the least positive whole number that makes every number of the text whole */
const clearer = text => numbersIn(text).reduce((k, v) => lcm(k, v.d), 1);
const isChoice = q => q.input === 'choice';
const ch = q => (q.choicesHtml ?? q.choices ?? []).map(htmlMath);
/** the one index whose claim is true (-1: none or more than one) */
function pick(truths) { const hits = truths.map((t, i) => (t ? i : -1)).filter(i => i >= 0); return hits.length === 1 ? hits[0] : -1; }
const tryB = fn => { try { return !!fn(); } catch { return false; } };
const P = q => htmlMath(q.promptHtml ?? q.prompt);
const B = q => texMath(q.board);
const vOut = v => (v.d === 1 ? v.n : v.value);
const frOut = v => v.pair;
const out = (q, v) => (q.input === 'frac' ? frOut(v) : vOut(v));
/** a kind claim: "Every number is a solution" / "No solution" / "Exactly one solution" / "x = 0" */
function kindClaim(c, s) {
  if (/^Every number is a solution/.test(c)) return s.kind === 'all';
  if (/^No solution/.test(c)) return s.kind === 'none';
  if (/^Exactly one solution/.test(c)) return s.kind === 'one';
  return false; // "x = 0" names a value, not how many; "every equation has a solution" is false
}

// ---------------------------------------------------------------- families
const F = {
  evalTerm(q) {
    const m = P(q).match(/^What is (.+) when x = (.+)\?$/);
    return vOut(expr(m[1])(qOf(m[2])));
  },
  coefMeaning(q) {
    const p = P(q);
    let m;
    if ((m = p.match(/^x is a negative number\. What can you say about (.+)\?$/))) {
      const f = expr(m[1]), v = f(Q(-1)); // x < 0: the sign of the term is the sign of c · (negative)
      return pick(ch(q).map(c => (/^It is positive/.test(c) ? v.n > 0 : /^It is negative/.test(c) ? v.n < 0 && !/because of the minus sign/.test(c) : false)));
    }
    m = p.match(/^What does (.+) mean\?$/);
    const f = expr(m[1]);
    return pick(ch(q).map(c => tryB(() => {
      const t = c.replace(/^(.+) divided by (.+)$/, '($1)/($2)').replace(/^(.+) multiplied by (.+)$/, '($1)*($2)');
      return sameFn(f, expr(t));
    })));
  },
  formMatch(q) {
    const p = P(q);
    let m;
    if ((m = p.match(/^Are (.+) and (.+) equal\?$/))) {
      const f = expr(m[1]), g = expr(m[2]), eq = sameFn(f, g);
      return pick(ch(q).map(c => {
        if (/^Yes, for every x: dividing by (\S+) is multiplying by (.+)$/.test(c)) { const mm = c.match(/^Yes, for every x: dividing by (\S+) is multiplying by (.+)$/); return eq && qOf(mm[1]).mul(qOf(mm[2])).eq(1); }
        const ow = c.match(/^Only when x = (.+)$/);
        if (ow) { const k = qOf(ow[1]), a = f(k), b = g(k); return !eq && a.eq(b); }
        if (/^No/.test(c)) return !eq;
        return false;
      }));
    }
    if ((m = p.match(/^Is (.+) the same as (.+)\?$/))) {
      const eq = sameFn(expr(m[1]), expr(m[2]));
      return pick(ch(q).map(c => (/^No/.test(c) ? !eq && tryB(() => { const mm = c.match(/^No: (.+) is a rounded value; (.+) is exact$/); return mm && !qOf(mm[1]).eq(qOf(mm[2])); }) : /^Yes: (.+) = (.+)$/.test(c) ? eq && tryB(() => { const mm = c.match(/^Yes: (.+) = (.+)$/); return qOf(mm[1]).eq(qOf(mm[2])); }) : false)));
    }
    m = p.match(/^Which (?:decimal form|one) is the same as (.+)\?$/);
    const f = expr(m[1]);
    return pick(ch(q).map(c => tryB(() => sameFn(f, expr(c)))));
  },
  mixedCoef(q) {
    const p = P(q);
    let m;
    if ((m = p.match(/^Write (.+?) with one fraction:/))) { const f = linOf(expr(m[1])); return out(q, f.a); }
    return out(q, sol(eqOf(B(q))));
  },
  barSplit(q) {
    const f = expr(B(q));
    return pick(ch(q).map(c => tryB(() => sameFn(f, expr(c)))));
  },
  /** "Multiply every term of E by k. Which line do you get?" — the line whose sides are k × the sides */
  barClear(q) { return F.clearLine(q); },
  clearLine(q) {
    const e = eqOf(B(q)), k = qOf(P(q).match(/ by (.+?)\. Which line/)[1]);
    return pick(ch(q).map(c => tryB(() => scaledSides(e, eqOf(c), k))));
  },
  sameSet(q) {
    const p = P(q);
    let e1, e2, m;
    if ((m = p.match(/^Are (.+?) and (.+?) equivalent(?: equations)?\?$/))) { e1 = eqOf(m[1]); e2 = eqOf(m[2]); }
    else if ((m = p.match(/^(.+?) and (.+?) are both true when x = (.+?)\. Are they equivalent\?$/))) { e1 = eqOf(m[1]); e2 = eqOf(m[2]); }
    else return undefined;
    const s1 = solSet(e1), s2 = solSet(e2), equiv = sameSet(s1, s2);
    return pick(ch(q).map(c => {
      let mm;
      if ((mm = c.match(/^No: the first has x = (.+), the second x = (.+)$/))) return !equiv && s1.kind === 'one' && s2.kind === 'one' && s1.x.eq(qOf(mm[1])) && s2.x.eq(qOf(mm[2]));
      if ((mm = c.match(/^Yes: the second is the first times (.+)$/))) return equiv && tryB(() => scaledSides(e1, e2, qOf(mm[1])));
      if ((mm = c.match(/^Yes: each has exactly one solution, x = (.+)$/))) return equiv && s1.kind === 'one' && s1.x.eq(qOf(mm[1]));
      if (/^No: the second has no solution$/.test(c)) return !equiv && s2.kind === 'none';
      if ((mm = c.match(/^No: the second is true for every x, the first only for (.+)$/))) return !equiv && s2.kind === 'all' && s1.kind === 'one' && s1.x.eq(qOf(mm[1]));
      // "they look almost the same", "they look different", "equivalent means equal for every x",
      // "x = 3 makes both true": not reasons that decide equivalence
      return false;
    }));
  },
  scaleKeep(q) {
    const s = solSet(eqOf(P(q).match(/same solutions as (.+)\?$/)[1]));
    return pick(ch(q).map(c => tryB(() => sameSet(s, solSet(eqOf(c))))));
  },
  scaleBy(q) {
    const m = P(q).match(/^Multiply every term on both sides of (.+) by (.+?)\. Are the solutions still the same\?$/);
    const e = eqOf(m[1]), k = qOf(m[2]), s = solSet(e);
    const same = k.n !== 0 || s.kind === 'all';
    return pick(ch(q).map(c => {
      let mm;
      if ((mm = c.match(/^Yes: (.+) is not 0, so the step can be undone$/))) return same && k.n !== 0 && qOf(mm[1]).eq(k);
      if (/^No: it becomes 0 = 0, true for every number$/.test(c)) return !same && k.n === 0;
      return false; // "a negative multiplier flips", "only the LCD keeps it", "new-looking equation", "0 clears", "same thing to both sides"
    }));
  },
  lcdPick(q) {
    const m = P(q).match(/ in (.+)\?$/);
    return clearer(m[1]);
  },
  validMult(q) {
    const m = P(q).match(/^Does multiplying every term of (.+) by (\d+) clear all the (fractions|decimals)\?$/);
    const text = m[1], k = Number(m[2]);
    const clears = numbersIn(text).every(v => isWhole(v.mul(k)));
    const dens = numbersIn(text).map(v => v.d).filter(d => d > 1);
    return pick(ch(q).map(c => {
      let mm;
      if ((mm = c.match(/^Yes: (\d+) is a common multiple of (\d+) and (\d+)$/))) {
        const a = Number(mm[2]), b = Number(mm[3]);
        return clears && Number(mm[1]) === k && k % a === 0 && k % b === 0 && dens.every(d => a % d === 0 || b % d === 0 || lcm(a, b) % d === 0) && [a, b].every(d => text.includes(`/(${d})`) || dens.includes(d));
      }
      if ((mm = c.match(/^Yes: as fractions the denominators are (\d+) and (\d+), and (\d+) is a multiple of both$/))) {
        const a = Number(mm[1]), b = Number(mm[2]);
        return clears && Number(mm[3]) === k && k % a === 0 && k % b === 0 && dens.every(d => lcm(a, b) % d === 0);
      }
      if ((mm = c.match(/^No: (\d+) is not a multiple of (\d+), a fraction is left$/))) return !clears && Number(mm[1]) === k && k % Number(mm[2]) !== 0 && dens.includes(Number(mm[2]));
      if (/^No: (\d+) is too small$/.test(c)) return !clears;
      return false; // "only the LCD works", "changes the solution", "one of the denominators", "any multiplier", "only 10, 100, 1000"
    }));
  },
  clearSolve(q) { return out(q, sol(eqOf(B(q)))); },
  collectLine(q) {
    const e = eqOf(B(q));
    return pick(ch(q).map(c => tryB(() => { const f = eqOf(c); return sameFn(e.L, f.L) && sameFn(e.R, f.R); })));
  },
  collectSolve(q) { return out(q, sol(eqOf(B(q)))); },
  distFirst(q) {
    const p = P(q);
    let m;
    if ((m = p.match(/^First step for (.+): distribute\. Which line is right\?$/))) {
      const e = eqOf(m[1]);
      return pick(ch(q).map(c => tryB(() => { const f = eqOf(c); return sameFn(e.L, f.L) && sameFn(e.R, f.R); })));
    }
    m = p.match(/^Which first step for (.+) is right\?$/);
    const e = eqOf(m[1]);
    return pick(ch(q).map(c => moveOk(e, c)));
  },
  distSolve(q) { return out(q, sol(eqOf(B(q)))); },
  barSolve(q) { return out(q, sol(eqOf(B(q)))); },
  bothLine(q) {
    const m = P(q).match(/^Subtract (.+?) from both sides of (.+)\. Which line do you get\?$/);
    const t = expr(m[1]), e = eqOf(m[2]);
    return pick(ch(q).map(c => tryB(() => { const f = eqOf(c); return sameFn(x => e.L(x).sub(t(x)), f.L) && sameFn(x => e.R(x).sub(t(x)), f.R); })));
  },
  bothSolve(q) { return out(q, sol(eqOf(B(q)))); },
  planFirst(q) {
    const p = P(q);
    let m;
    if ((m = p.match(/^Plan for (.+): which first move is right\?$/))) {
      const e = eqOf(m[1]);
      return pick(ch(q).map(c => moveOk(e, c)));
    }
    if ((m = p.match(/^What is the quickest first move for (.+)\?$/))) {
      const e = eqOf(m[1]), Le = linOf(e.L), hasDec = /\d\.\d/.test(m[1]);
      return pick(ch(q).map(c => {
        let mm;
        if ((mm = c.match(/^Multiply both sides by (\d+) to clear the decimals$/))) return hasDec && clearer(m[1]) <= Number(mm[1]) && Number(mm[1]) % clearer(m[1]) === 0 && !Le?.a;
        if ((mm = c.match(/^Multiply both sides by (.+)$/))) return Le && Le.b.n === 0 && linOf(e.R)?.a.n === 0 && Le.a.mul(qOf(mm[1])).eq(1);
        return false; // "Subtract 3/4 from both sides": 3/4 multiplies x, it is not added
      }));
    }
    if ((m = p.match(/^(.+) mixes decimals and a third\. Which plan keeps it exact\?$/))) {
      const k = clearer(m[1]);
      return pick(ch(q).map(c => {
        let mm;
        if ((mm = c.match(/^Write the decimals as fractions, then × (\d+) on every term$/))) return Number(mm[1]) % k === 0;
        if ((mm = c.match(/^Multiply every term by (\d+)$/))) return Number(mm[1]) % k === 0;
        return false; // rounding x/3 to 0.33x is not exact
      }));
    }
    return undefined;
  },
  planSolve(q) { return out(q, sol(eqOf(B(q)))); },
  exactForm(q) {
    const p = P(q);
    if (/A friend says every line must be rounded/.test(p)) {
      // keeping exact values is always allowed and exact; rounding middle lines can change the answer
      return pick(ch(q).map(c => /^Kai: exact values in the middle keep the answer exact$/.test(c)));
    }
    const m = p.match(/^Solving (.+) gives x = (.+)\. Which other way/);
    const v = sol(eqOf(m[1]));
    if (!v || !v.eq(qOf(m[2]))) return -1;
    return pick(ch(q).map(c => tryB(() => qOf(c).eq(v))));
  },
  howMany(q) {
    const s = solSet(eqOf(P(q).match(/^How many solutions does (.+) have\?$/)[1]));
    return pick(ch(q).map(c => kindClaim(c, s)));
  },
  zeroTrap(q) {
    const s = solSet(eqOf(P(q).match(/^Kai solves (.+?)\. His x-terms cancel/)[1]));
    return pick(ch(q).map(c => kindClaim(c, s)));
  },
  makeKind(q) {
    const p = P(q);
    const [Ls, Rs] = p.match(/^(.+?)\. Which/)[1].split('=');
    const L = linOf(expr(Ls));
    if (/makes EVERY number a solution/.test(p)) {
      // R = c·x + □ : □ = L(0), and the x-coefficients must already match
      const R0 = linOf(expr(Rs.replace('□', '0')));
      if (!R0.a.eq(L.a)) return undefined;
      return vOut(L.b.sub(R0.b));
    }
    if (/makes the equation have NO solution/.test(p)) return vOut(L.a); // □x + c: same slope, different constant
    return undefined;
  },
  checkCand(q) {
    const p = P(q);
    let m, e, a;
    if ((m = p.match(/^Is x = (.+?) a solution of (.+)\?$/))) { a = qOf(m[1]); e = eqOf(m[2]); }
    else if ((m = p.match(/^Ana multiplied (.+?) by \S+ and got .+?, so x = .+?\. Is (.+?) a solution of the original equation\?$/))) { e = eqOf(m[1]); a = qOf(m[2]); }
    else return undefined;
    const l = e.L(a), r = e.R(a), ok = l.eq(r);
    return pick(ch(q).map(c => {
      let mm;
      if ((mm = c.match(/^Yes: both sides of the original equal (.+)$/))) return ok && l.eq(qOf(mm[1]));
      if ((mm = c.match(/^No: the left side is (.+), not (.+)$/))) return !ok && l.eq(qOf(mm[1])) && r.eq(qOf(mm[2]));
      if ((mm = c.match(/^No: in the original the left is (.+) and the right is (.+)$/))) return !ok && l.eq(qOf(mm[1])) && r.eq(qOf(mm[2]));
      return false; // a check in a derived equation, or doing the steps again, does not check the original
    }));
  },
  checkSide(q) {
    const m = P(q).match(/^Check x = (.+?) in (.+)\. What is the (left|right) side worth\?$/);
    const e = eqOf(m[2]), a = qOf(m[1]);
    return out(q, m[3] === 'left' ? e.L(a) : e.R(a));
  },
  estimate(q) {
    const p = P(q);
    let m;
    if ((m = p.match(/^Lee solves (.+) and gets x = (.+)\. Is that reasonable\?$/))) {
      const x = sol(eqOf(m[1])).value, v = qOf(m[2]).value;
      const reasonable = Math.abs(v - x) <= 0.25 * Math.abs(x);
      return pick(ch(q).map(c => {
        let mm;
        if ((mm = c.match(/^No: x should be about (.+)$/))) { const n = qOf(mm[1]).value; return !reasonable && Math.abs(n - x) <= 0.25 * Math.abs(x); }
        return false; // "that is what the calculation gave" / "0.19 is close to 0.2" do not check the size of x
      }));
    }
    if ((m = p.match(/^(.+?)\. Rounding .+ What is right\?$/))) {
      const e = eqOf(m[1]), s = solSet(e);
      return pick(ch(q).map(c => {
        let mm;
        if ((mm = c.match(/^Collect exactly first: (.+), so x = (.+)$/))) {
          const f = eqOf(mm[1]);
          return s.kind === 'one' && sameSet(solSet(f), s) && s.x.eq(qOf(mm[2]));
        }
        if ((mm = c.match(/^x is about (.+)$/))) return s.kind === 'one' && Math.abs(qOf(mm[1]).value - s.x.value) <= 0.25 * Math.abs(s.x.value);
        if (/^They round to the same number, so there is no solution$/.test(c)) return s.kind === 'none';
        return false;
      }));
    }
    if ((m = p.match(/best estimate of x in (.+)\?$/))) {
      const x = sol(eqOf(m[1])).value;
      const d = ch(q).map(c => Math.abs(qOf(c.replace(/^About /, '')).value - x));
      const best = Math.min(...d);
      return pick(d.map(v => v === best));
    }
    return undefined;
  },
  nameProp(q) {
    const m = P(q).match(/^Which property justifies the step from (.+) to (.+)\?$/);
    const a = eqOf(m[1]), b = eqOf(m[2]);
    let prop = null;
    if (sameFn(a.L, b.L) && sameFn(a.R, b.R)) prop = /\(/.test(m[1]) ? 'Distributive property' : 'Combining like terms';
    else {
      const dL = linOf(x => b.L(x).sub(a.L(x))), dR = linOf(x => b.R(x).sub(a.R(x)));
      const La = linOf(a.L), Lb = linOf(b.L), Ra = linOf(a.R), Rb = linOf(b.R);
      if (dL && dR && dL.a.eq(dR.a) && dL.b.eq(dR.b)) {
        const lead = dL.a.n !== 0 ? dL.a : dL.b;
        prop = lead.n < 0 ? 'Subtraction property of equality' : 'Addition property of equality';
      } else {
        // the same factor on both whole sides
        let k = null;
        for (const [u, v] of [[La, Lb], [Ra, Rb]]) for (const key of ['a', 'b']) if (u[key].n !== 0) k ??= v[key].div(u[key]);
        if (k && scaledSides(a, b, k)) prop = k.n === 1 && k.d > 1 ? 'Division property of equality' : 'Multiplication property of equality';
      }
    }
    return pick(ch(q).map(c => c === prop));
  },
  firstBad(q) {
    const lines = String(q.board).split(/\\\\/).map(t => texMath(t).replace(/^\(\d+\)\s*/, ''));
    const sets = lines.map(t => solSet(eqOf(t)));
    let bad = 0;
    for (let i = 1; i < sets.length; i++) if (!sameSet(sets[i], sets[i - 1])) { bad = i + 1; break; }
    return pick(ch(q).map(c => (bad ? c === `Line ${bad}` : /^None/.test(c))));
  },
  oneValue(q) {
    const p = P(q);
    let m;
    const r = relation(B(q).replace('=', '=')), id = sameFn(r.L, r.R);
    if ((m = p.match(/^Pat says .+ Is that enough to show they are equal\?$/))) {
      return pick(ch(q).map(c => {
        const mm = c.match(/^No: at x = (.+?) the left is (.+) and the right is (.+)$/);
        if (mm) { const v = qOf(mm[1]); return !id && r.L(v).eq(qOf(mm[2])) && r.R(v).eq(qOf(mm[3])); }
        return false; // agreeing at one (or three) values does not show it
      }));
    }
    if ((m = p.match(/^Pat checked .+ Is that a proof that they are equal for every x\?$/))) {
      return pick(ch(q).map(c => (/^No, but the distributive property proves it for every x$/.test(c) ? id && /\(/.test(B(q)) : /^No: it is false$/.test(c) ? !id : false)));
    }
    return undefined;
  },
  planMeaning(q) {
    const p = P(q);
    const m = p.match(/A = (.+?) and B = (.+?)\.(?:\s|$)/);
    const A = expr(m[1]), Bf = expr(m[2]);
    const s = solSet({ L: A, R: Bf });
    if (q.input !== 'choice') return out(q, s.x);
    const la = linOf(A), lb = linOf(Bf);
    return pick(ch(q).map(c => {
      let mm;
      if ((mm = c.match(/^At (.+?) \w+ both cost \$(.+)$/))) return s.kind === 'one' && s.x.eq(qOf(mm[1])) && A(s.x).eq(qOf(mm[2]));
      if ((mm = c.match(/^After (.+?) \w+, A is the cheaper one$/))) return s.kind === 'one' && s.x.eq(qOf(mm[1])) && la.a.cmp(lb.a) < 0;
      if ((mm = c.match(/^A costs \$(.+)$/))) return false; // x is a count of miles/visits, not a price
      return false;
    }));
  },
  feasible(q) {
    const p = P(q);
    const e = eqOf(p.match(/Solving (.+?) (?:\(x = weeks from now\) )?gives/)[1]);
    const s = solSet(e);
    return pick(ch(q).map(c => {
      let mm;
      if (/^From now on they never have the same amount$/.test(c)) return s.kind === 'none' || (s.kind === 'one' && s.x.n < 0);
      if ((mm = c.match(/^They have the same amount after (.+) weeks$/))) return s.kind === 'one' && s.x.n >= 0 && s.x.eq(qOf(mm[1]));
      if ((mm = c.match(/^They will be equal in (.+) weeks$/))) return s.kind === 'one' && s.x.n >= 0 && s.x.eq(qOf(mm[1]));
      if (/^No whole number of tickets makes them cost the same$/.test(c)) return s.kind !== 'one' || !isWhole(s.x) || s.x.n < 0;
      if ((mm = c.match(/^They cost the same at (.+) tickets$/))) return s.kind === 'one' && isWhole(s.x) && s.x.n >= 0 && s.x.eq(qOf(mm[1]));
      return false; // "Round: they cost the same at 5 tickets": at 5 they do not
    }));
  },
  writeModel(q) {
    const p = P(q);
    const m = p.match(/A costs \$([\d.]+) plus \$([\d.]+) a \w+; B costs \$([\d.]+) plus \$([\d.]+) a \w+\./);
    const A = expr(`${m[1]} + ${m[2]}x`), Bf = expr(`${m[3]} + ${m[4]}x`);
    const want = /“A is cheaper than B”/.test(p) ? '<' : /“A costs at most as much as B”/.test(p) ? '≤' : /“cost the same”/.test(p) ? '=' : null;
    if (!want) return undefined;
    return pick(ch(q).map(c => tryB(() => relMatches(relation(c), A, Bf, want))));
  },
  storyFor(q) {
    const r = relation(B(q));
    return pick(ch(q).map(c => {
      const s = storyRel(c);
      return !!s && relMatches(r, s.A, s.B, s.rel);
    }));
  },
};

/** is the choice "Move: line" a right first move for e (the move done correctly, the line keeps the solutions) */
function moveOk(e, c) {
  return tryB(() => {
    const mm = c.match(/^(.+?): (.+)$/);
    if (!mm) return false;
    const f = eqOf(mm[2]), mv = mm[1];
    if (!sameSet(solSet(e), solSet(f))) return false;
    let k;
    if ((k = mv.match(/^Divide both sides by (.+)$/))) return scaledSides(e, f, Q(1).div(qOf(k[1])));
    if ((k = mv.match(/^Multiply both sides by (.+)$/))) return scaledSides(e, f, qOf(k[1]));
    if ((k = mv.match(/^× (\S+) on every term$/))) return scaledSides(e, f, qOf(k[1]));
    if (/^Distribute$/.test(mv)) return sameFn(e.L, f.L) && sameFn(e.R, f.R);
    return false; // "× 4 on the fractions only" is not a move that keeps the balance
  });
}
const FLIP = { '<': '>', '>': '<', '≤': '≥', '≥': '≤', '=': '=' };
/** relation r says "A rel B" (either way round) */
function relMatches(r, A, Bf, rel) {
  if (sameFn(r.L, A) && sameFn(r.R, Bf)) return r.rel === rel;
  if (sameFn(r.L, Bf) && sameFn(r.R, A)) return r.rel === FLIP[rel];
  return false;
}
/** a story choice → { A, B, rel } of the relation it asks for, or null (it asks something else) */
function storyRel(c) {
  let m;
  if ((m = c.match(/^Ride A: \$([\d.]+) plus \$([\d.]+) a mile; ride B: \$([\d.]+) plus \$([\d.]+) a mile\. (.+)$/))) {
    if (!/^After how many miles do they cost the same\?$/.test(m[5])) return null;
    return { A: expr(`${m[1]} + ${m[2]}x`), B: expr(`${m[3]} + ${m[4]}x`), rel: '=' };
  }
  if ((m = c.match(/^Tank A holds ([\d.]+) gal and (gains|loses) ([\d.]+) gal a day; tank B holds ([\d.]+) gal and (gains|loses) ([\d.]+) gal a day\. (.+)$/))) {
    const sa = m[2] === 'loses' ? '-' : '+', sb = m[5] === 'loses' ? '-' : '+';
    const rel = /does A hold at least as much as B\?$/.test(m[7]) ? '≥' : /does A hold less than B\?$/.test(m[7]) ? '<' : /does A hold more than B\?$/.test(m[7]) ? '>' : /does A hold at most as much as B\?$/.test(m[7]) ? '≤' : null;
    if (!rel) return null;
    return { A: expr(`${m[1]} ${sa} ${m[3]}x`), B: expr(`${m[4]} ${sb} ${m[6]}x`), rel };
  }
  return null;
}

// ---------------------------------------------------------------- the world
function sane(q) {
  const out = [];
  const p = P(q);
  let m;
  try {
    switch (q.family) {
      case 'zeroTrap': {
        const mm = p.match(/^Kai solves (.+?)\. His x-terms cancel and his last line is (.+?)\. He writes/);
        const e = eqOf(mm[1]), last = eqOf(mm[2]);
        const d = linOf(x => e.L(x).sub(e.R(x)));
        if (d.a.n !== 0) out.push('the x-terms do not cancel');
        const sk = solSet(e).kind, lk = last.L(Q(0)).eq(last.R(Q(0))) ? 'all' : 'none';
        if (d.a.n === 0 && sk !== lk) out.push(`his last line ${mm[2]} does not follow from the equation`);
        break;
      }
      case 'checkCand': {
        if ((m = p.match(/^Ana multiplied (.+?) by (\S+) and got (.+?), so x = (.+?)\. Is/))) {
          const e = eqOf(m[1]), k = qOf(m[2]), f = eqOf(m[3]), s = solSet(f);
          if (!(s.kind === 'one' && s.x.eq(qOf(m[4])))) out.push(`x = ${m[4]} does not solve her line ${m[3]}`);
          if (scaledSides(e, f, k) && s.kind === 'one' && e.L(s.x).eq(e.R(s.x)) === false) out.push('her line is a right × but the check fails');
        }
        break;
      }
      case 'exactForm': {
        if ((m = p.match(/^Solving (.+) gives x = (.+)\. Which other way/))) {
          const v = sol(eqOf(m[1]));
          if (!v || !v.eq(qOf(m[2]))) out.push(`${m[1]} does not give x = ${m[2]}`);
        }
        if ((m = p.match(/^Kai solves (.+) and keeps x = (.+?) as a fraction/))) {
          const v = sol(eqOf(m[1]));
          if (!v || !v.eq(qOf(m[2]))) out.push(`${m[1]} does not give x = ${m[2]}`);
        }
        break;
      }
      case 'feasible': {
        if ((m = p.match(/gives x = (.+?)\. What does/))) {
          const e = eqOf(p.match(/Solving (.+?) (?:\(x = weeks from now\) )?gives/)[1]);
          const s = solSet(e);
          if (!(s.kind === 'one' && s.x.eq(qOf(m[1])))) out.push(`the equation does not give x = ${m[1]}`);
        }
        const mm = p.match(/Mia has \$([\d.]+) and saves \$([\d.]+) a week\. Leo has \$([\d.]+) and saves \$([\d.]+) a week\. Solving (.+?) \(x/);
        if (mm) { const e = eqOf(mm[5]); if (!sameFn(e.L, expr(`${mm[1]} + ${mm[2]}x`)) || !sameFn(e.R, expr(`${mm[3]} + ${mm[4]}x`))) out.push('the equation is not the story'); }
        const mt = p.match(/Club A: \$([\d.]+) plus \$([\d.]+) a ticket\. Club B: \$([\d.]+) plus \$([\d.]+) a ticket\. Solving (.+?) gives/);
        if (mt) { const e = eqOf(mt[5]); if (!sameFn(e.L, expr(`${mt[1]} + ${mt[2]}x`)) || !sameFn(e.R, expr(`${mt[3]} + ${mt[4]}x`))) out.push('the equation is not the story'); }
        break;
      }
      case 'planMeaning': {
        const mm = p.match(/A costs \$([\d.]+) plus \$([\d.]+) a (\w+), B costs \$([\d.]+) plus \$([\d.]+) a \w+\. With x \w+, A = (.+?) and B = (.+?)\.(?:\s|$)/);
        if (mm) {
          if (!sameFn(expr(mm[6]), expr(`${mm[1]} + ${mm[2]}x`)) || !sameFn(expr(mm[7]), expr(`${mm[4]} + ${mm[5]}x`))) out.push('A or B is not the story');
          const s = solSet({ L: expr(mm[6]), R: expr(mm[7]) });
          if (s.kind !== 'one' || s.x.n <= 0) out.push('they never cost the same');
          else if (!isWhole(s.x)) out.push(`they cost the same at ${s.x.value} ${mm[3]}s: not a whole number`);
          const g = p.match(/Solving A = B gives x = (.+?)\./);
          if (g && !(s.kind === 'one' && s.x.eq(qOf(g[1])))) out.push(`A = B does not give x = ${g[1]}`);
        }
        break;
      }
      case 'estimate': {
        if ((m = p.match(/Rounding ([\d.]+) and ([\d.]+) both to ([\d.]+) first/))) {
          const to = Number(m[3]);
          const nearHalf = v => Math.round(v * 2) / 2, nearTenth = v => Math.round(v * 10) / 10;
          for (const v of [Number(m[1]), Number(m[2])]) if (nearHalf(v) !== to && nearTenth(v) !== to && Math.round(v) !== to) out.push(`${v} does not round to ${to}`);
        }
        if ((m = p.match(/best estimate of x in (.+)\?$/))) {
          const x = sol(eqOf(m[1])).value;
          const d = ch(q).map(c => Math.abs(qOf(c.replace(/^About /, '')).value - x)).sort((a, b) => a - b);
          if (d[1] - d[0] < 0.02 * Math.abs(x)) out.push('two estimates are about as good');
        }
        break;
      }
      case 'howMany': {
        const s = solSet(eqOf(p.match(/^How many solutions does (.+) have\?$/)[1]));
        if (s.kind === 'one' && s.x.n === 0 && ch(q).includes('x = 0')) out.push('the one solution is x = 0: the "x = 0" choice is right too');
        break;
      }
      case 'makeKind': {
        if (/NO solution/.test(p)) {
          const [Ls, Rs] = p.match(/^(.+?)\. Which/)[1].split('=');
          const L = linOf(expr(Ls)), c = qOf(Rs.replace(/□\s*x\s*\+/, '').trim());
          if (L.b.eq(c)) out.push('with the same slope the constants are equal: every number, not none');
        }
        break;
      }
      case 'planFirst': case 'distFirst': case 'formMatch': case 'barClear': case 'clearLine': default: break;
    }
  } catch (e) { out.push(`could not read: ${e.message}`); }
  if (isChoice(q)) {
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
