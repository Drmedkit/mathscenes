// Oracle for the lesson "conditional-statements" (Geometry: if-then statements and logical language). Written from
// what the student sees only: the prompt (statements, domains, cases), the choices, and the drawn shapes (their
// right-angle squares and tick marks). Every truth value is decided by checking the statement over its stated domain
// (integers listed, a set D, any integer / any real number, shapes by their marks); converse, inverse, contrapositive
// and the negations of "all" / "some" are recognised by their logical meaning (each clause is matched to p, ~p, q or ~q
// by what it says, not by how the lesson words it). Reason-carrying choices count only when the verdict is right AND
// the reason is true AND it actually supports the verdict. See docs/lessons/QUALITY_LAYER.md, "O: the oracle".
import { choiceWhere } from '../../tools/quality/oracle-kit.mjs';

// ---------------------------------------------------------------- numbers and predicates
const num = s => Number(String(s).replace(/−/g, '-'));
const isPrime = v => { if (!Number.isInteger(v) || v < 2) return false; for (let d = 2; d * d <= v; d++) if (v % d === 0) return false; return true; };
const isInt = v => Number.isInteger(v);
const mult = (v, k) => isInt(v) && v % k === 0;
const factor = (v, k) => isInt(v) && v !== 0 && k % v === 0;
const even = v => isInt(v) && v % 2 === 0;
const odd = v => isInt(v) && Math.abs(v % 2) === 1;

/** compile an expression in one variable: n, 3n, n², n − 5, (n + 1)², n(n + 3), |n|, −n */
function compileExpr(src, vr) {
  let s = String(src).trim().replace(/−/g, '-');
  if (!new RegExp(`^[\\d\\s${vr}+\\-*()²|.]+$`).test(s)) return null;
  s = s.replace(/\|([^|]+)\|/g, 'Math.abs($1)').replace(/²/g, '**2')
    .replace(new RegExp(`(\\d)\\s*(${vr}|\\(|M)`, 'g'), '$1*$2')
    .replace(new RegExp(`(${vr}|\\))\\s*\\(`, 'g'), '$1*(')
    .replace(new RegExp(`\\)\\s*(${vr})`, 'g'), ')*$1');
  // unary minus before a power: -n**2 is a JS syntax error, and −n² means −(n²)
  s = s.replace(/(^|[(\s+*])-\s*([a-z]\*\*2)/g, '$1-($2)');
  try { const f = new Function(vr, `return (${s});`); f(1); return f; } catch { return null; }
}
const CMP = { '<': (a, b) => a < b, '>': (a, b) => a > b, '≤': (a, b) => a <= b, '≥': (a, b) => a >= b, '=': (a, b) => a === b, '≠': (a, b) => a !== b };
const normExpr = s => String(s).replace(/\s+/g, '').replace(/−/g, '-');

/** a mathematical clause about one variable → { lhs, f } (f: value → boolean), or null */
function mathClause(text, vr) {
  let s = String(text).trim().replace(/\.$/, '').replace(/^the number /i, '');
  const V = vr;
  let m;
  // bare Euler / table labels
  if ((m = s.match(/^(not )?(?:a )?(multiple of|factor of) (−?\d+)$/))) { const k = num(m[3]); const g = m[2] === 'multiple of' ? v => mult(v, k) : v => factor(v, k); return { lhs: V, f: m[1] ? v => !g(v) : g }; }
  if ((m = s.match(/^(not )?(even|odd|prime|positive|negative)$/))) { const g = PROP[m[2]]; return { lhs: V, f: m[1] ? v => !g(v) : g }; }
  if ((m = s.match(/^(.+?) is (not )?(positive|negative|even|odd|prime)$/))) {
    const e = compileExpr(m[1], V); if (!e) return null; const g = PROP[m[3]];
    return { lhs: normExpr(m[1]), f: m[2] ? v => !g(e(v)) : v => g(e(v)) };
  }
  if ((m = s.match(/^(.+?) is (not )?(?:a )?(multiple of|factor of|divisible by) (−?\d+)$/))) {
    const e = compileExpr(m[1], V); if (!e) return null; const k = num(m[4]);
    const g = m[3] === 'factor of' ? v => factor(v, k) : v => mult(v, k);
    return { lhs: normExpr(m[1]), f: m[2] ? v => !g(e(v)) : v => g(e(v)) };
  }
  if ((m = s.match(/^(.+?) is (greater|less) than (or equal to )?(−?\d+(?:\.\d+)?)$/))) {
    const e = compileExpr(m[1], V); if (!e) return null; const k = num(m[4]);
    const op = m[2] === 'greater' ? (m[3] ? '≥' : '>') : (m[3] ? '≤' : '<');
    return { lhs: normExpr(m[1]), f: v => CMP[op](e(v), k) };
  }
  if ((m = s.match(/^(.+?) (<|>|≤|≥|=|≠) (.+)$/))) {
    const a = compileExpr(m[1], V), b = compileExpr(m[3], V); if (!a || !b) return null;
    return { lhs: normExpr(m[1]), f: v => CMP[m[2]](a(v), b(v)) };
  }
  return null;
}
const PROP = { positive: v => v > 0, negative: v => v < 0, even, odd, prime: isPrime };

// ---------------------------------------------------------------- domains
/** the stated domain → { vr, vals, real } */
function domainOf(p) {
  let m = p.match(/Domain: ([a-z]) is one of the (even |odd )?integers (−?\d+) to (−?\d+)/);
  if (m) { const a = num(m[3]), b = num(m[4]); const vals = []; for (let v = a; v <= b; v++) if (!m[2] || (m[2] === 'even ' ? even(v) : odd(v))) vals.push(v); return { vr: m[1], vals, real: false }; }
  m = p.match(/Domain D = \{([^}]*)\}/);
  if (m) return { vr: 'x', vals: m[1].split(',').map(t => num(t.trim())), real: false };
  m = p.match(/\(([a-z]) is any (integer|real number)\)/);
  if (m) return { vr: m[1], vals: wide(m[2] === 'real number'), real: m[2] === 'real number', any: true };
  return null;
}
function wide(real) { const out = []; for (let v = -60; v <= 60; v += real ? 0.25 : 1) out.push(v); return out; }
const allSame = (f, g, vals) => vals.every(v => f(v) === g(v));
const allOpp = (f, g, vals) => vals.every(v => f(v) !== g(v));

// ---------------------------------------------------------------- word clauses (p, ~p, q, ~q by meaning)
const SUBJ = /^(a figure|a number|a polygon|a quadrilateral|a triangle|an angle|it|they|two angles|two lines|the angle)\s+/;
/** a clause in words → { key, neg } (a yes/no fact) or { qty, f } (a measured quantity) or { lhs, f, math } */
function wordClause(text, vr) {
  let s = String(text).trim().replace(/\.$/, '').replace(/^(and|but) /i, '');
  if (vr) { const mc = mathClause(s, vr); if (mc) return { ...mc, math: true }; }
  for (const V of ['n', 'x']) { const mc = /\b[nx]\b/.test(s) ? mathClause(s, V) : null; if (mc && new RegExp(`\\b${V}\\b`).test(s)) return { ...mc, math: true }; }
  s = s.toLowerCase();
  let subj = '';
  const sm = s.match(SUBJ); if (sm) s = s.slice(sm[0].length); else { const m2 = s.match(/^(ana|you|the [a-z]+)\s+/); if (m2) { subj = m2[1]; s = s.slice(m2[0].length); } }
  let m;
  const K = x => num(x);
  // measured quantities
  if ((m = s.match(/^measures less than (\d+)°$/))) return { qty: 'deg', f: v => v < K(m[1]) };
  if ((m = s.match(/^measures (\d+)° or more$/))) return { qty: 'deg', f: v => v >= K(m[1]) };
  if ((m = s.match(/^measures (\d+)° or less$/))) return { qty: 'deg', f: v => v <= K(m[1]) };
  if ((m = s.match(/^measures (\d+)°$/))) return { qty: 'deg', f: v => v === K(m[1]) };
  if ((m = s.match(/^does not measure (\d+)°$/))) return { qty: 'deg', f: v => v !== K(m[1]) };
  if ((m = s.match(/^is (?:below|under) (\d+)%$/))) return { qty: subj + '%', f: v => v < K(m[1]) };
  if ((m = s.match(/^is at (\d+)% or more$/))) return { qty: subj + '%', f: v => v >= K(m[1]) };
  if ((m = s.match(/^(?:drops below|is below) (−?\d+)°f$/))) return { qty: 'F', f: v => v < K(m[1]) };
  if ((m = s.match(/^is above (−?\d+)°f$/))) return { qty: 'F', f: v => v > K(m[1]) };
  if ((m = s.match(/^is (−?\d+)°f or (?:higher|above|more)$/))) return { qty: 'F', f: v => v >= K(m[1]) };
  if ((m = s.match(/^is (−?\d+)°f or (?:below|lower|less)$/))) return { qty: 'F', f: v => v <= K(m[1]) };
  if ((m = s.match(/^score (\d+) or more$/))) return { qty: 'score', f: v => v >= K(m[1]) };
  if ((m = s.match(/^score less than (\d+)$/))) return { qty: 'score', f: v => v < K(m[1]) };
  if (s === 'miss a practice') return { key: subj + '|come to every practice', neg: true };
  let neg = false;
  if ((m = s.match(/^(?:does|do|did) not (.+)$/))) { neg = true; s = m[1]; }
  else if ((m = s.match(/^(?:is|are) not (.+)$/))) { neg = true; s = 'be ' + m[1]; }
  else if ((m = s.match(/^(?:is|are) (.+)$/))) s = 'be ' + m[1];
  else {
    const w = s.split(' ');
    const IRR = { has: 'have', won: 'win', passed: 'pass' };
    if (IRR[w[0]]) w[0] = IRR[w[0]];
    else if (/[^s]s$/.test(w[0]) && w[0].length > 3) w[0] = w[0].slice(0, -1);
    s = w.join(' ');
  }
  s = s.replace(/\b(a|an|the)\b\s*/g, '').replace(/\s+/g, ' ').trim();
  return { key: subj + '|' + s, neg };
}
const QTY_VALS = Array.from({ length: 1201 }, (_, i) => -100 + i * 0.25);
/** same meaning (1), opposite meaning (-1), or unrelated (0) */
function relate(a, b, vals) {
  if (!a || !b) return 0;
  if (a.key !== undefined && b.key !== undefined) return a.key !== b.key ? 0 : a.neg === b.neg ? 1 : -1;
  if (a.qty !== undefined && b.qty !== undefined) {
    if (a.qty !== b.qty) return 0;
    return allSame(a.f, b.f, QTY_VALS) ? 1 : allOpp(a.f, b.f, QTY_VALS) ? -1 : 0;
  }
  if (a.math && b.math) {
    if (a.lhs !== b.lhs) return 0;
    return allSame(a.f, b.f, vals) ? 1 : allOpp(a.f, b.f, vals) ? -1 : 0;
  }
  return 0;
}
/** "If A, then B." → [A, B] */
const ifThen = s => { const m = String(s).trim().match(/^If (.+?), then (.+?)\.?$/i); return m ? [m[1], m[2]] : null; };

/** the hypothesis and conclusion of a conditional written in any of the lesson's ways, or null */
function condParts(s) {
  s = String(s).trim().replace(/\.$/, '');
  let m = s.match(/^If (.+?), then (.+)$/);
  if (m) return [m[1], m[2]];
  if (/if and only if/.test(s)) return null;
  m = s.match(/^(.+?) (?:if|whenever) (.+)$/);
  if (m) return [m[2], m[1]];
  m = s.match(/^Every (?:angle|number|polygon|figure|triangle|quadrilateral) (?:that|which) (.+?) (is|has) (.+)$/);
  if (m) return [`it ${m[1]}`, `it ${m[2]} ${m[3]}`];
  m = s.match(/^Every (?:angle|number|polygon|figure|triangle|quadrilateral) with (.+?) (is|has) (.+)$/);
  if (m) return [`it has ${m[1]}`, `it ${m[2]} ${m[3]}`];
  m = s.match(/^All pairs of (.+?) are (.+)$/);
  if (m) return [`two angles are ${m[1]}`, `they are ${m[2]}`];
  m = s.match(/^Every (.+?) (is|has) (.+)$/);
  if (m) return [`it is a ${m[1]}`, `it ${m[2]} ${m[3]}`];
  return null;
}

// ---------------------------------------------------------------- statements of fact (statementKind)
const SIDES = { triangle: 3, quadrilateral: 4, square: 4, rectangle: 4, pentagon: 5, hexagon: 6, octagon: 8 };
const WORDNUM = { one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8 };
const RIGHTS = { square: 4, rectangle: 4 };
/** true / false for a closed sentence, 'open', 'not', or undefined when unknown */
function kindOf(S) {
  S = S.trim();
  if (/\?$/.test(S) || /^(Find|Solve|Draw|List|Write|Name|Compute|Simplify|Graph)\b/.test(S)) return 'not';
  const t = S.replace(/\.$/, '');
  if (/(^|[^A-Za-z])[a-z](?![A-Za-z])/.test(t.replace(/\b(a|an)\b/g, '')) || /\bThe number [a-z]\b/.test(t)) return 'open';
  let m;
  if ((m = t.match(/^([−\d][\d\s+−×÷*/=.-]*)$/)) && /=/.test(t)) { const [l, r] = t.split('='); const e1 = compileExpr(l.replace(/×/g, '*'), 'z'), e2 = compileExpr(r.replace(/×/g, '*'), 'z'); return e1 && e2 ? e1(0) === e2(0) : undefined; }
  if ((m = t.match(/^(\d+) is prime$/))) return isPrime(+m[1]);
  if ((m = t.match(/^(\d+) is a multiple of (\d+)$/))) return mult(+m[1], +m[2]);
  if ((m = t.match(/^(\d+) is a factor of (\d+)$/))) return factor(+m[1], +m[2]);
  if ((m = t.match(/^(\d+) is even$/))) return even(+m[1]);
  if ((m = t.match(/^(\d+) is odd$/))) return odd(+m[1]);
  if ((m = t.match(/^A right angle measures (\d+)°$/))) return +m[1] === 90;
  if ((m = t.match(/^An? (\w+) has (exactly )?(\w+) sides$/)) && SIDES[m[1]]) return SIDES[m[1]] === WORDNUM[m[3]];
  if ((m = t.match(/^An? (\w+) has (exactly )?(\w+) right angles$/)) && RIGHTS[m[1]] !== undefined) return RIGHTS[m[1]] === WORDNUM[m[3]];
  if (/^An equilateral triangle has three equal sides$/.test(t)) return true;
  if (/^An equilateral triangle has three equal angles$/.test(t)) return true;
  return undefined;
}

// ---------------------------------------------------------------- shapes (negAllWitness)
const dist = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1]);
function shapeHas(sh, prop) {
  const right = sh.right ?? [], ticks = sh.ticks ?? [];
  const groups = {}; ticks.forEach(t => { if (t) groups[t] = (groups[t] ?? 0) + 1; });
  const maxEq = Math.max(0, ...Object.values(groups));
  switch (prop) {
    case 'four right angles': return right.length === 4;
    case 'a right angle': return right.length >= 1;
    case 'four equal sides': return ticks.length === 4 && maxEq === 4;
    case 'three equal sides': return ticks.length === 3 && maxEq === 3;
    case 'two equal sides': return maxEq >= 2;
    default: return undefined;
  }
}
/** what the drawing shows against what the marks say */
function shapeIssues(sh) {
  const P = sh.pts ?? [], n = P.length, out = [];
  const side = i => dist(P[i], P[(i + 1) % n]);
  const ang = i => { const a = P[(i + n - 1) % n], b = P[i], c = P[(i + 1) % n]; const u = [a[0] - b[0], a[1] - b[1]], w = [c[0] - b[0], c[1] - b[1]]; return Math.acos((u[0] * w[0] + u[1] * w[1]) / (Math.hypot(...u) * Math.hypot(...w))) * 180 / Math.PI; };
  for (const i of sh.right ?? []) if (Math.abs(ang(i) - 90) > 2) out.push(`right-angle mark on a ${ang(i).toFixed(0)}° corner`);
  const t = sh.ticks ?? [];
  for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) {
    const eq = Math.abs(side(i) - side(j)) <= 0.02 * Math.max(side(i), side(j));
    if (t[i] && t[i] === t[j] && !eq) out.push(`sides ${i},${j} share ticks but differ`);
    if ((!t[i] || !t[j] || t[i] !== t[j]) && eq) out.push(`sides ${i},${j} look equal but are not marked equal`);
  }
  return out;
}

// ---------------------------------------------------------------- quantified sentences (negAll / negSome)
/** "Some store … is not open …" → { q: 'some'|'no'|'every', neg }, judged against the base predicate */
function quantOf(c, base, dom) {
  const t = c.trim().replace(/\.$/, '');
  let q = null, rest = t;
  let m;
  if ((m = t.match(/^For (some|no|every) ([a-z]) in the domain, (.+)$/))) {
    q = m[1]; const mc = mathClause(m[3], m[2]); if (!mc || !base?.f) return null;
    const vals = wide(false);
    const r = allSame(mc.f, base.f, vals) ? false : allOpp(mc.f, base.f, vals) ? true : null;
    return r === null ? null : { q, neg: r };
  }
  if (/^(Some|At least one|There is)\b/.test(t)) q = 'some';
  else if (/^No\b/.test(t)) q = 'no';
  else if (/^(All|Every)\b/.test(t)) q = 'every';
  if (!q) return null;
  rest = t.toLowerCase();
  const neg = /\bnot\b|\bwithout\b|\bhas no\b|\bsomething other than\b|\bclosed\b|\bfailed\b/.test(rest);
  return { q, neg };
}
/** the logical form ∃P / ∃¬P / ∀P / ∀¬P of a classified sentence */
const formOf = x => (x.q === 'some' ? (x.neg ? 'E~' : 'E') : x.q === 'no' ? (x.neg ? 'A' : 'A~') : (x.neg ? 'A~' : 'A'));

// ---------------------------------------------------------------- the families
const yes = c => /^(True|Yes|Equivalent)\b/.test(c);
const valOf = c => { const m = c.match(/[a-z] = (−?\d+(?:\.\d+)?)/); return m ? num(m[1]) : null; };

const F = {
  statementKind(q) {
    const S = q.prompt.match(/“(.+)”/)[1];
    const k = kindOf(S);
    if (k === undefined) return undefined;
    const want = k === 'not' ? /^Not a statement/ : k === 'open' ? /^An open sentence/ : k ? /^A true statement/ : /^A false statement/;
    return choiceWhere(q, c => want.test(c));
  },
  openTruth(q) {
    const d = domainOf(q.prompt);
    const m = q.prompt.match(/the open sentence (.+) true\?$/);
    const mc = mathClause(m[1], d.vr);
    return d.vals.filter(mc.f).length;
  },
  negateIneq(q) {
    const d = domainOf(q.prompt);
    const m = q.prompt.match(/negation of (.+)\?$/);
    const P = mathClause(m[1], d.vr);
    return choiceWhere(q, c => { const C = mathClause(c, d.vr); return !!C && allOpp(C.f, P.f, d.vals); });
  },
  negateProperty(q) {
    const p = q.prompt;
    let m = p.match(/negation of “(.+?)”(?: \([^)]*\))?\?$/);
    if (/\(n is any integer\)/.test(p)) {
      const P = mathClause(m[1], 'n'), vals = wide(false);
      return choiceWhere(q, c => { const C = mathClause(c, 'n'); return !!C && allOpp(C.f, P.f, vals); });
    }
    const a = p.match(/the angle measures between (\d+)° and (\d+)°/);
    if (a) {
      const lo = +a[1], hi = +a[2], vals = []; for (let v = lo; v <= hi; v += 0.5) vals.push(v);
      const angle = s => { s = s.toLowerCase(); let k;
        if ((k = s.match(/measures less than (\d+)°/))) return v => v < +k[1];
        if ((k = s.match(/measures more than (\d+)°/))) return v => v > +k[1];
        if ((k = s.match(/measures (\d+)° or more/))) return v => v >= +k[1];
        if ((k = s.match(/measures (\d+)° or less/))) return v => v <= +k[1];
        return null; };
      const P = angle(m[1]);
      return choiceWhere(q, c => { const C = angle(c); return !!C && allOpp(C, P, vals); });
    }
    const P = wordClause(m[1]);
    return choiceWhere(q, c => relate(wordClause(c), P) === -1);
  },
  negBoundary(q) {
    const p = q.prompt;
    const d = domainOf(p);
    const m = p.match(/negation of “(.+?)” is “(.+?)”/);
    if (d) {
      const A = mathClause(m[1], d.vr), B = mathClause(m[2], d.vr);
      const hits = d.vals.filter(v => !A.f(v) && !B.f(v));
      return hits.length === 1 ? hits[0] : undefined;
    }
    const A = wordClause(m[1]), B = wordClause(m[2]);
    const hits = []; for (let v = -60; v <= 150; v++) if (!A.f(v) && !B.f(v)) hits.push(v);
    return hits.length === 1 ? hits[0] : undefined;
  },
  ifThen(q) {
    const S = q.prompt.match(/“(.+)”/)[1];
    const [P, Qc] = condParts(S).map(x => wordClause(x));
    return choiceWhere(q, c => { const it = ifThen(c); return !!it && relate(wordClause(it[0]), P) === 1 && relate(wordClause(it[1]), Qc) === 1; });
  },
  hypConc(q) {
    const S = q.prompt.match(/“(.+)”/)[1];
    const parts = condParts(S);
    if (!parts) return choiceWhere(q, c => /^There is none/.test(c));
    const [P, Qc] = parts.map(x => wordClause(x));
    return choiceWhere(q, c => { const m = c.match(/^Hypothesis: (.+?)\. Conclusion: (.+?)\.$/); return !!m && relate(wordClause(m[1]), P) === 1 && relate(wordClause(m[2]), Qc) === 1; });
  },
  breaker(q) {
    const d = domainOf(q.prompt);
    const [a, b] = ifThen(q.prompt.match(/Statement: (.+?\.) Which/)[1]);
    const P = mathClause(a, d.vr), Qc = mathClause(b, d.vr);
    return choiceWhere(q, c => { const v = valOf(c); return v !== null && d.vals.includes(v) && P.f(v) && !Qc.f(v); });
  },
  caseValue(q) {
    const p = q.prompt;
    let pv, qv;
    let m = p.match(/^Domain: .+?\. (If .+?\.) Put in [a-z] = (−?\d+):/);
    if (m) {
      const d = domainOf(p); const [a, b] = ifThen(m[1]);
      const v = num(m[2]);
      const A = mathClause(a, d.vr), B = mathClause(b, d.vr);
      if (!A || !B) return undefined;
      pv = A.f(v); qv = B.f(v);
    } else if ((m = p.match(/^Statement: (If .+?\.) Case: (.+?) is (true|false); (.+?) is (true|false)\./))) {
      pv = m[3] === 'true'; qv = m[5] === 'true';
    } else if ((m = p.match(/^Statement: (If .+?\.) Case: (.+?), and (.+?)\. In this case/))) {
      const [a, b] = ifThen(m[1]);
      const rp = relate(wordClause(m[2]), wordClause(a)), rq = relate(wordClause(m[3]), wordClause(b));
      if (!rp || !rq) return undefined;
      pv = rp === 1; qv = rq === 1;
    } else return undefined;
    const val = !pv || qv;
    return choiceWhere(q, c => (val ? c === 'True' : c === 'False'));
  },
  whichConverse(q) { return whichForm(q, 'converse'); },
  converseTrue(q) {
    const d = domainOf(q.prompt);
    const [a, b] = ifThen(q.prompt.match(/Its converse is “(.+?)”/)[1]);
    const A = mathClause(a, d.vr), B = mathClause(b, d.vr);
    const bad = d.vals.filter(v => A.f(v) && !B.f(v));
    return choiceWhere(q, c => {
      if (/^Yes: no n in the domain/.test(c)) return bad.length === 0;
      if (/^Yes/.test(c)) return false; // "a true statement always has a true converse" is false
      const v = valOf(c); return v !== null && bad.includes(v);
    });
  },
  iffMeans(q) {
    const S = q.prompt.match(/“(.+)”/)[1].replace(/\.$/, '');
    const d = domainOf(q.prompt);
    const [x, y] = S.split(' if and only if ');
    const vr = d?.vr ?? 'n';
    const A = wordClause(x, vr), B = wordClause(y, vr), vals = wide(false);
    return choiceWhere(q, c => {
      const m = c.match(/^(If .+?\.) And (if .+?\.)$/);
      if (!m) return false;
      const c1 = ifThen(m[1]), c2 = ifThen('I' + m[2].slice(1));
      const dir = (it, P, Q) => relate(wordClause(it[0], vr), P, vals) === 1 && relate(wordClause(it[1], vr), Q, vals) === 1;
      return (dir(c1, A, B) && dir(c2, B, A)) || (dir(c1, B, A) && dir(c2, A, B));
    });
  },
  iffTrue(q) {
    const d = domainOf(q.prompt);
    const S = q.prompt.match(/domain\? (.+?)\.$/)[1];
    const [x, y] = S.split(' if and only if ');
    const A = mathClause(x, d.vr), B = mathClause(y, d.vr);
    const ab = d.vals.every(v => !A.f(v) || B.f(v)), ba = d.vals.every(v => !B.f(v) || A.f(v));
    const iff = ab && ba;
    return choiceWhere(q, c => {
      if (/^True: both directions hold/.test(c)) return iff;
      if (/^True: every n that makes the first part true/.test(c)) return false; // one direction does not prove "iff"
      if (/^False: only one direction holds/.test(c)) return ab !== ba;
      const v = valOf(c); if (v === null || !d.vals.includes(v)) return false;
      if (/makes the first part true and the second part false/.test(c)) return A.f(v) && !B.f(v);
      if (/makes the second part true and the first part false/.test(c)) return B.f(v) && !A.f(v);
      return false; // "n = v has neither part" agrees with the iff
    });
  },
  ifAsIff(q) {
    const m = q.prompt.match(/“(If .+?\.)” What happened: (.+?), and (.+?)\. Is the promise broken\?/);
    const [a, b] = ifThen(m[1]);
    const rp = relate(wordClause(m[2]), wordClause(a)), rq = relate(wordClause(m[3]), wordClause(b));
    if (!rp || !rq) return undefined;
    const hyp = rp === 1, conc = rq === 1, broken = hyp && !conc;
    return choiceWhere(q, c => {
      if (/^Yes: the hypothesis happened and the conclusion did not/.test(c)) return broken;
      if (/^Yes/.test(c)) return false;
      if (/^No: the promise does not cover this case/.test(c)) return !hyp;
      if (/^No: the promise only says what happens when the hypothesis is true/.test(c)) return !hyp;
      return false; // "only broken when the hypothesis is false"
    });
  },
  allTrue(q) {
    const d = domainOf(q.prompt);
    const S = q.prompt.match(/for every [a-z] in the domain, (.+?)\.$/)[1];
    const it = ifThen(S);
    let ok;
    if (it) { const A = mathClause(it[0], d.vr), B = mathClause(it[1], d.vr); ok = v => !A.f(v) || B.f(v); }
    else { const A = mathClause(S, d.vr); ok = A.f; }
    const exc = d.vals.filter(v => !ok(v));
    return choiceWhere(q, c => {
      if (/^True: no member has/.test(c)) return exc.length === 0;
      if (/^True: it works for/.test(c)) return false; // examples never prove "every"
      const v = valOf(c); return v !== null && exc.includes(v);
    });
  },
  implicitAll(q) {
    const S = q.prompt.match(/written: (.+?)\. \(n is any integer\.\)/)[1];
    const A = mathClause(S, 'n');
    if (!A) return undefined;
    const vals = wide(false), fails = vals.filter(v => !A.f(v));
    return choiceWhere(q, c => {
      if (/^True for every integer/.test(c)) return fails.length === 0;
      if (/^True: it works/.test(c)) return false;
      const v = valOf(c); return v !== null && !A.f(v);
    });
  },
  someTrue(q) {
    const d = domainOf(q.prompt);
    const m = q.prompt.match(/makes both “(.+?)” and “(.+?)” true/);
    const A = mathClause(m[1], d.vr), B = mathClause(m[2], d.vr);
    const wit = d.vals.filter(v => A.f(v) && B.f(v));
    return choiceWhere(q, c => {
      if (/^False: no n in the domain has both/.test(c)) return wit.length === 0;
      if (/^False/.test(c)) return false; // "every one has it, so 'some' is wrong"
      const v = valOf(c); return v !== null && wit.includes(v);
    });
  },
  witnessCount(q) {
    const d = domainOf(q.prompt);
    const m = q.prompt.match(/makes both (.+?) and (.+?) true\.”/);
    const A = mathClause(m[1], d.vr), B = mathClause(m[2], d.vr);
    return d.vals.filter(v => A.f(v) && B.f(v)).length;
  },
  equivOnD(q) {
    const d = domainOf(q.prompt);
    const m = q.prompt.match(/Are (.+?) and (.+?) equivalent on D\?/);
    const A = mathClause(m[1], 'x'), B = mathClause(m[2], 'x');
    const diff = d.vals.filter(v => A.f(v) !== B.f(v));
    return choiceWhere(q, c => {
      if (/^Equivalent on D: the same truth value at every member/.test(c)) return diff.length === 0;
      if (/^Equivalent/.test(c)) return false; // agreeing at one member is not enough
      const v = valOf(c); return v !== null && d.vals.includes(v) && diff.includes(v);
    });
  },
  formsEquiv(q) {
    const m = q.prompt.match(/\(p → q\) with (?:its [a-z]+, )?(~?[pq]) (→|↔) (~?[pq])[:\s]/);
    const lit = (s, p, qq) => { const v = s.endsWith('p') ? p : qq; return s.startsWith('~') ? !v : v; };
    const orig = (p, qq) => !p || qq;
    const other = m[2] === '↔' ? (p, qq) => lit(m[1], p, qq) === lit(m[3], p, qq) : (p, qq) => !lit(m[1], p, qq) || lit(m[3], p, qq);
    const cases = [[true, true], [true, false], [false, true], [false, false]];
    const differ = cases.filter(([p, qq]) => orig(p, qq) !== other(p, qq));
    const TF = s => s === 'true';
    return choiceWhere(q, c => {
      if (/^Equivalent: the same truth value in all four cases/.test(c)) return differ.length === 0;
      if (/^Equivalent/.test(c)) return false;
      if (/one of them is about ~p and ~q/.test(c)) return false; // not a reason
      const k = c.match(/differ when p is (true|false) and q is (true|false)/);
      return !!k && differ.some(([p, qq]) => p === TF(k[1]) && qq === TF(k[2]));
    });
  },
  negAll(q) { return negQuant(q, 'A'); },
  negSome(q) { return negQuant(q, 'E'); },
  negAllWitness(q) {
    const m = q.prompt.match(/The statement “(?:Not every|It is false that every) (?:quadrilateral|triangle) shown (?:has|have) (.+?)”|The statement “Not all the (?:quadrilaterals|triangles) shown have (.+?)”/);
    const prop = m[1] ?? m[2];
    const toks = q.data?.picture?.euler?.tokens ?? [];
    return choiceWhere(q, c => {
      const L = c.match(/([A-F])$/)?.[1]; const t = toks.find(x => x.letter === L);
      if (!t?.shape) return false;
      const h = shapeHas(t.shape, prop); return h === false;
    });
  },
  negSomeTruth(q) {
    const d = domainOf(q.prompt);
    const some = c => { let m = c.match(/makes both “(.+?)” and “(.+?)” true/); const preds = m ? [m[1], m[2]] : [c.match(/makes “(.+?)” true/)[1]]; const P = preds.map(x => mathClause(x, d.vr)); return d.vals.some(v => P.every(p => p.f(v))); };
    return choiceWhere(q, c => (/^Some/.test(c) ? some(c) : /^No/.test(c) ? !some(c) : false));
  },
  whichInverse(q) { return whichForm(q, 'inverse'); },
  inverseFalse(q) {
    const d = domainOf(q.prompt);
    const [a, b] = ifThen(q.prompt.match(/Its inverse is “(.+?)”/)[1]);
    const A = mathClause(a, d.vr), B = mathClause(b, d.vr);
    const bad = d.vals.filter(v => A.f(v) && !B.f(v));
    return choiceWhere(q, c => {
      if (/^None/.test(c)) return false; // "the inverse of a true statement is true" is false
      const v = valOf(c); return v !== null && bad.includes(v);
    });
  },
  whichContra(q) { return whichForm(q, 'contrapositive'); },
  nameForm(q) {
    const p = q.prompt;
    const d = domainOf(p);
    const vr = d?.vr, vals = d?.any ? d.vals : wide(false);
    const [a, b] = ifThen(p.match(/Statement: (If .+?\.) New/)[1]);
    const [x, y] = ifThen(p.match(/New statement: (If .+?\.) What/)[1]);
    const names = formsOf(wordClause(a, vr), wordClause(b, vr), wordClause(x, vr), wordClause(y, vr), vals);
    if (names.length !== 1) return -1; // none, or several (p and q mean the same or the opposite)
    return choiceWhere(q, c => c.toLowerCase() === `the ${names[0]}`);
  },
};

/** which of converse / inverse / contrapositive (or 'original') X → Y is, for P → Q */
function formsOf(P, Q, X, Y, vals) {
  const r = (u, w) => relate(u, w, vals), out = [];
  if (r(X, P) === 1 && r(Y, Q) === 1) out.push('original');
  if (r(X, Q) === 1 && r(Y, P) === 1) out.push('converse');
  if (r(X, P) === -1 && r(Y, Q) === -1) out.push('inverse');
  if (r(X, Q) === -1 && r(Y, P) === -1) out.push('contrapositive');
  return out;
}
/** the one form X -> Y is, or null when it is none or several (p and q mean the same or the opposite) */
function classify(P, Q, X, Y, vals) { const f = formsOf(P, Q, X, Y, vals); return f.length === 1 ? f[0] : null; }
function whichForm(q, want) {
  const p = q.prompt;
  const d = domainOf(p);
  const vr = d?.vr, vals = d?.any ? d.vals : wide(false);
  const [a, b] = ifThen(p.match(/Statement: (If .+?\.) Which/)[1]);
  const P = wordClause(a, vr), Q = wordClause(b, vr);
  // a choice counts when, read by meaning, it IS that form (it may also be another one when p and q mean the same)
  return choiceWhere(q, c => { const it = ifThen(c); return !!it && formsOf(P, Q, wordClause(it[0], vr), wordClause(it[1], vr), vals).includes(want); });
}
function negQuant(q, kind) {
  const p = q.prompt;
  const S = p.match(/this statement\? (.+)$/)[1];
  let base = null;
  const m = S.match(/^For (?:every|some) ([a-z]) in the domain, (.+?)\.$/);
  if (m) base = mathClause(m[2], m[1]);
  const orig = quantOf(S, base);
  if (!orig) return undefined;
  const target = { A: 'E~', E: 'A~' }[formOf(orig)];
  return choiceWhere(q, c => { const x = quantOf(c, base); return !!x && formOf(x) === target; });
}

// ---------------------------------------------------------------- sane: what is impossible or unfair
function sane(q) {
  const out = [];
  const eu = q.data?.picture?.euler;
  // the drawn sort must match the predicates (the student sees where each member lands)
  if (eu?.tokens?.some(t => t.tex !== undefined)) {
    const vr = domainOf(q.prompt)?.vr ?? 'n';
    const P = eu.P ? mathClause(eu.P, vr) : null, Qc = eu.Q ? mathClause(eu.Q, vr) : null;
    if (P && (Qc || !eu.Q)) for (const t of eu.tokens) {
      const v = num(t.tex), z = (P.f(v) ? 'p' : '') + (Qc?.f(v) ? 'q' : '') || 'o';
      if (z !== t.zone) { out.push(`${t.tex} is drawn in zone ${t.zone}, but it belongs in ${z}`); break; }
    }
  }
  if (eu?.tokens?.some(t => t.shape)) for (const t of eu.tokens) { const iss = t.shape ? shapeIssues(t.shape) : []; if (iss.length) { out.push(`shape ${t.letter} (${t.shape.name}): ${iss[0]}`); break; } }
  // a stated case must be true arithmetic
  const cm = q.prompt.match(/Case: (.+?) is (true|false); (.+?) is (true|false)\./);
  if (cm) for (const [s, tv] of [[cm[1], cm[2]], [cm[3], cm[4]]]) {
    const k = kindOf(s.charAt(0).toUpperCase() + s.slice(1));
    if (typeof k === 'boolean' && k !== (tv === 'true')) out.push(`the case says "${s}" is ${tv}`);
  }
  // a stated converse / inverse must really be that form
  for (const [re, name] of [[/The statement “(.+?)” is true for every n in the domain\. Its (converse|inverse) is “(.+?)”/, null]]) {
    const m = q.prompt.match(re);
    if (m) {
      const d = domainOf(q.prompt); const o = ifThen(m[1]), n2 = ifThen(m[3]);
      const mm = t => ({ ...mathClause(t, d.vr), math: true });
      const k = formsOf(mm(o[0]), mm(o[1]), mm(n2[0]), mm(n2[1]), wide(false));
      if (!k.includes(m[2])) out.push(`the stated ${m[2]} is really ${k.join('/') || 'something else'}`);
      const A = mathClause(o[0], d.vr), B = mathClause(o[1], d.vr);
      if (!d.vals.every(v => !A.f(v) || B.f(v))) out.push('"is true for every n in the domain" is false');
      void name;
    }
  }
  if (q.input === 'choice') {
    let r; try { r = F[q.family]?.(q); } catch { r = undefined; }
    if (r === -1) out.push('no single right choice');
  }
  if (q.input === 'num') {
    let r; try { r = F[q.family]?.(q); } catch { r = undefined; }
    if (F[q.family] && r === undefined) out.push('no single right number');
  }
  return [...new Set(out)].join('; ');
}

export default {
  solve(q) {
    const f = F[q.family];
    if (!f) return undefined;
    try { return f(q); } catch { return undefined; }
  },
  sane,
};
