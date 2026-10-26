// Oracle for the lesson "arithmetic-sequences" (Algebra 1: common difference, f(n) and a_n notation, the discrete
// graph, recursive and explicit forms, which term has a value, two terms, rewriting and relabelling, context index
// choice; HSF-IF.A.3, HSF-BF.A.2, HSF-LE.A.2). Role O of docs/lessons/QUALITY_LAYER.md: every item is worked out from
// what the student sees (prompt, board, choices, the drawn strip / graph points). Students are 14-18.
//
// Method: every definition the student reads (in a prompt or a choice) is parsed into a SEQUENCE = a set of whole
// term numbers lo..hi (hi may be Infinity) and a value for each. Explicit: a_n = <expression in n> with its domain.
// Recursive: a seed (a_1 = v) plus a step rule (a_n = a_(n-1) + d, or forward a_(n+1) = a_n + d) WITH its range; it
// defines a sequence only when the rule starts right after the seed (backward rule from seed + 1, forward rule from
// the seed). A rule with no seed, no range, or a_n = a_n + d defines nothing (the lesson asks for COMPLETE
// definitions). Two definitions are "the same sequence" when they have the same term numbers and the same values.
// Choices that make a claim (an argument, a verdict + reason) are tested claim by claim against the maths.
import { nums, texPlain, Q } from '../../tools/quality/oracle-kit.mjs';

const EPS = 1e-9;
const eq = (a, b) => Math.abs(a - b) < EPS;
const clean = v => (Math.abs(v) < EPS ? 0 : Math.round(v * 1e9) / 1e9);
const isWhole = v => eq(v, Math.round(v));
const norm = s => String(s ?? '').replace(/[−–]/g, '-').replace(/[·×]/g, '*').replace(/…/g, '...').replace(/\s+/g, ' ').trim();
const num = s => Number(String(s).replace(/[−–]/g, '-').replace(/[$,]/g, ''));

// ---------------------------------------------------------------- expressions in n (or x)
function tokenize(s) {
  const t = [];
  let i = 0;
  while (i < s.length) {
    const c = s[i];
    if (c === ' ') { i++; continue; }
    const m = s.slice(i).match(/^\d+(?:\.\d+)?|^\.\d+/);
    if (m) { t.push({ k: 'num', v: Number(m[0]) }); i += m[0].length; continue; }
    if (c === 'n' || c === 'x') { t.push({ k: 'var' }); i++; continue; }
    if ('+-*()'.includes(c)) { t.push({ k: c }); i++; continue; }
    return null;
  }
  return t;
}
/** plain expression → function of n, or null */
function parseExpr(str) {
  const t = tokenize(norm(str));
  if (!t || !t.length) return null;
  let p = 0;
  const peek = () => t[p], eat = k => (t[p] && t[p].k === k ? t[p++] : null);
  function expr() {
    let f = term();
    if (!f) return null;
    for (;;) {
      if (eat('+')) { const g = term(); if (!g) return null; const a = f; f = n => a(n) + g(n); }
      else if (eat('-')) { const g = term(); if (!g) return null; const a = f; f = n => a(n) - g(n); }
      else return f;
    }
  }
  function term() {
    let f = unary();
    if (!f) return null;
    for (;;) {
      const k = peek()?.k;
      if (k === '*') { p++; const g = unary(); if (!g) return null; const a = f; f = n => a(n) * g(n); }
      else if (k === 'var' || k === '(' || k === 'num') { const g = primary(); if (!g) return null; const a = f; f = n => a(n) * g(n); }
      else return f;
    }
  }
  function unary() {
    if (eat('-')) { const g = unary(); return g ? n => -g(n) : null; }
    if (eat('+')) return unary();
    return primary();
  }
  function primary() {
    const tk = peek();
    if (!tk) return null;
    if (tk.k === 'num') { p++; const v = tk.v; return () => v; }
    if (tk.k === 'var') { p++; return n => n; }
    if (tk.k === '(') { p++; const f = expr(); if (!f || !eat(')')) return null; return f; }
    return null;
  }
  const f = expr();
  return f && p === t.length ? f : null;
}

// ---------------------------------------------------------------- definitions → sequences
/** a_n, a_n-1, a_1, a_-2 → a[n], a[n-1], a[1], a[-2]; f(n+1), g(0) → f[n+1], g[0] */
function conv(text) {
  return norm(text)
    .replace(/\b([A-Za-z])_(n(?:[+-]\d+)?|-?\d+)/g, '$1[$2]')
    .replace(/\b([A-Za-z])\(\s*(n\s*[+-]\s*\d+|n|-?\d+)\s*\)/g, (_, a, b) => `${a}[${b.replace(/\s/g, '')}]`);
}
/** "n ≥ 2", "2 ≤ n ≤ 15" → { lo, hi } */
function parseDomain(s) {
  s = norm(s);
  let m;
  if ((m = s.match(/^(-?\d+) ?≤ ?n ?≤ ?(-?\d+)$/))) return { lo: Number(m[1]), hi: Number(m[2]) };
  if ((m = s.match(/^n ?≥ ?(-?\d+)$/))) return { lo: Number(m[1]), hi: Infinity };
  return null;
}
const idxOff = s => (s === 'n' ? 0 : /^n[+-]\d+$/.test(s) ? Number(s.slice(1)) : null);

/** one definition (explicit or recursive) → { ok, lo, hi, at, name } or { ok: false, why } */
function parseDef(text, defaultDomain = null) {
  let s = conv(text).replace(/\.$/, '');
  let dom = null, m;
  if ((m = s.match(/^(.*?),? for (.+)$/))) { dom = parseDomain(m[2]); if (!dom) return { ok: false, why: 'domain?' }; s = m[1]; }
  else if ((m = s.match(/^(.*?), ((?:-?\d+ ?≤ ?)?n ?[≥≤] ?-?\d+)$/))) { dom = parseDomain(m[2]); s = m[1]; }
  const parts = s.split(/, /);
  let seed = null, rule = null, expl = null;
  for (const part of parts) {
    const pm = part.match(/^([A-Za-z]+)\[([^\]]+)\] ?= ?(.+)$/);
    if (!pm) return { ok: false, why: `cannot read "${part}"` };
    const [, name, idx, rhs] = pm;
    if (/^-?\d+$/.test(idx)) {
      const v = parseExpr(rhs);
      if (!v || /[\[n]/.test(rhs)) return { ok: false, why: 'seed?' };
      seed = { name, at: Number(idx), v: v(0) };
      continue;
    }
    const lo = idxOff(idx);
    if (lo === null) return { ok: false, why: 'index?' };
    const rm = rhs.match(/^([A-Za-z]+)\[([^\]]+)\] ?([+-]) ?(\d+(?:\.\d+)?)$/);
    if (rm) {
      const ro = idxOff(rm[2]);
      if (ro === null || rm[1] !== name) return { ok: false, why: 'rule?' };
      rule = { name, step: lo - ro, lhs: lo, d: (rm[3] === '-' ? -1 : 1) * Number(rm[4]) };
      continue;
    }
    if (/\[/.test(rhs)) return { ok: false, why: 'rule?' };
    const f = parseExpr(rhs);
    if (!f || lo !== 0) return { ok: false, why: 'expression?' };
    expl = { name, f };
  }
  if (expl) {
    if (seed || rule) return { ok: false, why: 'mixed' };
    const D = dom ?? defaultDomain;
    if (!D) return { ok: false, why: 'no domain' };
    return { ok: true, kind: 'explicit', name: expl.name, lo: D.lo, hi: D.hi, at: expl.f, f: expl.f, domGiven: !!dom };
  }
  if (!rule) return { ok: false, why: 'nothing' };
  if (!seed) return { ok: false, why: 'no seed' };
  if (rule.step !== 1) return { ok: false, why: 'the rule does not step from one term to the next' };
  if (!dom) return { ok: false, why: 'no range for the rule' };
  if (seed.name !== rule.name) return { ok: false, why: 'names' };
  // rule defines term (n + lhs) for n in dom; it must start right after the seed
  const first = dom.lo + rule.lhs, last = dom.hi + rule.lhs;
  if (first !== seed.at + 1 || last < first) return { ok: false, why: 'the rule range does not start right after the seed' };
  const { v, at } = seed, d = rule.d;
  return { ok: true, kind: 'recursive', name: seed.name, lo: at, hi: last, at: n => v + (n - at) * d, seed: v, d };
}
/** same term numbers, same values */
function sameSeq(a, b) {
  if (!a?.ok || !b?.ok || a.lo !== b.lo || a.hi !== b.hi) return false;
  const top = Math.min(a.hi, a.lo + 40);
  for (let n = a.lo; n <= top; n++) if (!eq(a.at(n), b.at(n))) return false;
  if (Number.isFinite(a.hi) && !eq(a.at(a.hi), b.at(b.hi))) return false;
  return true;
}
/** same values in the same order (labels may differ) */
const sameTerms = (a, b) => a?.ok && b?.ok && a.hi - a.lo === b.hi - b.lo &&
  Array.from({ length: Math.min(41, a.hi - a.lo + 1) }, (_, i) => i).every(i => eq(a.at(a.lo + i), b.at(b.lo + i)));
const shift = (s, k) => ({ ...s, lo: s.lo - k, hi: s.hi - k, at: n => s.at(n + k) });

// ---------------------------------------------------------------- reading the givens
const firstSentence = p => norm(p).split(/\.\s+(?=[A-Z(])|\?\s*/)[0];
const boardNums = q => nums(texPlain(q.board));
const listFromPrompt = p => nums(norm(p).split(/\.\.\.|[A-Za-z(]/)[0]);
const pts = q => q.data?.picture?.graph?.pts ?? null;
const strip = q => q.data?.picture?.strip ?? null;
/** the drawn (n, value) pairs: graph points or strip columns with a value */
function drawn(q) {
  const g = pts(q);
  if (g) return g.map(([n, v]) => ({ n, v }));
  const s = strip(q);
  if (s) return s.ns.map((n, i) => ({ n, v: s.vals[i] })).filter(o => o.v !== null && o.v !== undefined);
  return [];
}
const diffs = vs => vs.slice(1).map((v, i) => clean(v - vs[i]));
const allSame = ds => ds.every(d => eq(d, ds[0]));
/** truth of each choice → the index of the one true choice (first true when several) */
function pick(q, truth) {
  const t = q.choices.map((c, i) => !!truth(norm(c), i));
  const i = t.indexOf(true);
  return i >= 0 ? i : undefined;
}
const countTrue = (q, truth) => q.choices.filter((c, i) => truth(norm(c), i)).length;
const signedStep = (k, word) => (word === 'lower' ? -1 : 1) * Number(k);

// ---------------------------------------------------------------- families: answer + per-choice truth
const F = {};   // solve
const T = {};   // truth(choiceText) builders for choice families (used by sane to count right choices)

F.findD = q => { const v = boardNums(q); return clean(v[1] - v[0]); };

T.consistent = q => {
  const v = boardNums(q), ds = diffs(v), ok = allSame(ds), d = ds[0];
  return c => {
    let m;
    if ((m = c.match(/^Consistent with an arithmetic sequence, d = (-?\d+(?:\.\d+)?)$/))) return ok && eq(num(m[1]), d);
    if (/^Not arithmetic: the differences are not all equal$/.test(c)) return !ok;
    return false; // "the terms go down", "must start at 0 or 1": not reasons
  };
};

F.fRead = q => {
  const p = norm(q.prompt), D = drawn(q);
  let m;
  if ((m = p.match(/What is f\((\d+)\)\?/))) return D.find(o => o.n === Number(m[1]))?.v;
  if ((m = p.match(/For which n is f\(n\) = (-?\d+(?:\.\d+)?)\?/))) { const h = D.filter(o => eq(o.v, num(m[1]))); return h.length === 1 ? h[0].n : undefined; }
  return undefined;
};

T.fMeaning = q => {
  const p = norm(q.prompt);
  let m;
  if ((m = p.match(/When n = (-?\d+), what is f\(n \+ 1\)\?/))) {
    const v = drawn(q).find(o => o.n === Number(m[1]) + 1)?.v;
    return c => eq(num(c), v);
  }
  if ((m = p.match(/f\((-?\d+)\) = (-?\d+(?:\.\d+)?)\. What does that say\?/))) {
    const k = num(m[1]), v = num(m[2]);
    return c => {
      const cm = c.match(/^The output at input (-?\d+(?:\.\d+)?) is (-?\d+(?:\.\d+)?)(?:: term number (-?\d+(?:\.\d+)?) has the value (-?\d+(?:\.\d+)?))?$/);
      if (!cm) return false;
      return eq(num(cm[1]), k) && eq(num(cm[2]), v) && (cm[3] === undefined || (eq(num(cm[3]), k) && eq(num(cm[4]), v)));
    };
  }
  return null;
};

F.termAt = q => {
  // oracle fix: the list may be labelled from n = 0 ("This sequence is labelled from n = 0: …")
  const p = norm(q.prompt), s0 = p.match(/(?:starts at|labelled from|starting at) n = (\d+)/), start = s0 ? Number(s0[1]) : 1;
  const L = listFromPrompt(p.replace(/^(?:The|This) sequence (?:starts at|is labelled from) n = \d+: /, ''));
  let m;
  if ((m = p.match(/What is a_(\d+)\?/))) return L[Number(m[1]) - start];
  if ((m = p.match(/In which position n is the term (-?\d+(?:\.\d+)?)\?/))) { const i = L.findIndex(v => eq(v, num(m[1]))); return i >= 0 ? i + start : undefined; }
  return undefined;
};

F.neighbor = q => {
  const p = norm(q.prompt);
  const m = p.match(/d = (-?\d+(?:\.\d+)?), the term a_n = (-?\d+(?:\.\d+)?)\. What is a_n([+-])(\d+)\?/);
  if (!m) return undefined;
  const d = num(m[1]), v = num(m[2]), k = (m[3] === '-' ? -1 : 1) * Number(m[4]);
  return clean(v + k * d);
};

F.graphRead = q => {
  const p = norm(q.prompt), D = drawn(q);
  let m;
  if ((m = p.match(/For which n is a_n = (-?\d+(?:\.\d+)?)\?/))) { const h = D.filter(o => eq(o.v, num(m[1]))); return h.length === 1 ? h[0].n : undefined; }
  if ((m = p.match(/What is a_(\d+)\?/))) return D.find(o => o.n === Number(m[1]))?.v;
  if (/common difference d\?/.test(p)) { const ds = diffs(D.map(o => o.v)); return allSame(ds) ? ds[0] : undefined; }
  return undefined;
};

/** the definition in the first sentence of the prompt (explicit or recursive), domain n ≥ 1 unless given */
const promptDef = q => parseDef(firstSentence(q.prompt), { lo: 1, hi: Infinity });

T.graphPick = q => {
  const p = norm(q.prompt);
  let m;
  if ((m = p.match(/^(a_n = .+? for n ≥ \d+)\. Is there a point of its graph at n = (-?\d+(?:\.\d+)?)\?/))) {
    const S = parseDef(m[1]), x = num(m[2]);
    const isTermNo = S.ok && isWhole(x) && x >= S.lo && x <= S.hi;
    return c => {
      let cm;
      if ((cm = c.match(/^Yes, at height (-?\d+(?:\.\d+)?)/))) return isTermNo && eq(S.at(x), num(cm[1]));
      if (/^Yes: every point on the line/.test(c)) return false;
      if (/^No: n is a term number, a whole number/.test(c)) return !isTermNo;
      return false;
    };
  }
  if ((m = p.match(/^Which describes the graph of (a_n = .+? for n ≥ \d+)\?/))) {
    const S = parseDef(m[1]);
    if (!S.ok) return null;
    const d = clean(S.at(S.lo + 1) - S.at(S.lo)), b0 = clean(S.at(0));
    return c => {
      let cm;
      if (/^A solid line/.test(c)) return false; // only whole term numbers are points
      if (/^Separate points starting at \(0,/.test(c)) return S.lo === 0 && false;
      if ((cm = c.match(/^Separate points on a line through \((-?\d+(?:\.\d+)?), (-?\d+(?:\.\d+)?)\) with slope (-?\d+(?:\.\d+)?)$/)))
        return eq(clean(S.f(num(cm[1]))), num(cm[2])) && eq(num(cm[3]), d);
      if ((cm = c.match(/^Separate points \((-?\d+), (-?\d+(?:\.\d+)?)\), \((-?\d+), (-?\d+(?:\.\d+)?)\), \.\.\., each (\d+(?:\.\d+)?) (higher|lower) than the one before$/)))
        return num(cm[1]) === S.lo && eq(S.at(S.lo), num(cm[2])) && num(cm[3]) === S.lo + 1 && eq(S.at(S.lo + 1), num(cm[4])) && eq(signedStep(cm[5], cm[6]), d);
      return false;
    };
  }
  return null;
};

/** recursive given in the first sentence of the prompt, or NEXT = NOW + d */
function givenRec(q) {
  const p = norm(q.prompt);
  const m = p.match(/^NEXT = NOW ([+-]) (\d+(?:\.\d+)?), starting with NOW = (-?\d+(?:\.\d+)?) as term 1/);
  if (m) { const d = (m[1] === '-' ? -1 : 1) * num(m[2]), v = num(m[3]); return { ok: true, lo: 1, hi: Infinity, at: n => v + (n - 1) * d }; }
  return parseDef(firstSentence(p));
}

F.recNext = q => { const S = givenRec(q), m = norm(q.prompt).match(/What is [a-z](?:_|\()(\d+)\)?\?/); return S.ok && m ? clean(S.at(Number(m[1]))) : undefined; };
F.recTwo = q => {
  const S = givenRec(q), m = norm(q.prompt).match(/What are (?:[a-z]\((\d+)\) and [a-z]\((\d+)\)|terms (\d+) and (\d+))\?/);
  if (!S.ok || !m) return undefined;
  const i = Number(m[1] ?? m[3]), j = Number(m[2] ?? m[4]);
  return [clean(S.at(i)), clean(S.at(j))];
};

/** the arithmetic sequence a list describes (first two terms), n ≥ 1 */
const listSeq = (L, hi = Infinity) => ({ ok: true, lo: 1, hi, at: n => L[0] + (n - 1) * (L[1] - L[0]) });

T.recWrite = q => { const S = listSeq(boardNums(q)); return c => sameSeq(parseDef(c), S); };
T.recFinite = q => {
  const N = Number(norm(q.prompt).match(/exactly (\d+) terms/)[1]);
  const S = listSeq(boardNums(q), N);
  return c => sameSeq(parseDef(c), S);
};

F.countJumps = q => {
  const p = norm(q.prompt);
  let m;
  if ((m = p.match(/from a_(\d+) to a_(\d+)\?/))) return Number(m[2]) - Number(m[1]);
  if ((m = p.match(/Fill the box: a_(\d+) = (-?\d+(?:\.\d+)?) \+ □ \* (-?\d+(?:\.\d+)?)\./))) {
    // a_1 is the start: a_k = a_1 + (k − 1)·d, so the box holds the number of jumps from a_1
    const L = listFromPrompt(p), a1 = L[0], d = L[1] - L[0];
    if (!eq(num(m[2]), a1) || !eq(num(m[3]), d)) return undefined;
    return Number(m[1]) - 1;
  }
  return undefined;
};

T.deriveForm = q => { const S = listSeq(boardNums(q)); return c => sameSeq(parseDef(c, { lo: 1, hi: Infinity }), S); };

F.evalFar = q => {
  const p = norm(q.prompt), m = p.match(/^a_n = (.+?)\. Find a_(\d+)/), f = m && parseExpr(m[1]);
  return f ? clean(f(Number(m[2]))) : undefined;
};
F.evalMoney = q => {
  const p = norm(q.prompt), m = p.match(/So [A-Za-z]_n = (.+?)\. Find .*? (?:row|week|month) (\d+)\./), f = m && parseExpr(m[1]);
  return f ? clean(f(Number(m[2]))) : undefined;
};

F.formFromList = q => { const L = boardNums(q); return [L[0], clean(L[1] - L[0])]; };

T.formFromGraph = q => {
  const D = drawn(q);
  const S = { ok: true, lo: 1, hi: Infinity, at: n => D[0].v + (n - D[0].n) * (D[1].v - D[0].v) / (D[1].n - D[0].n) };
  return c => sameSeq(parseDef(c, { lo: 1, hi: Infinity }), S);
};

/** "expr = v" on the board side of the prompt: the n that gives v (any real), the sequence */
function position(q) {
  const S = promptDef(q);
  const m = norm(q.prompt).match(/(?:Which term is|Is) (-?\d+(?:\.\d+)?)(?: a term)?/);
  if (!S.ok || !m) return null;
  const v = num(m[1]), a = S.at(1), d = S.at(2) - S.at(1);
  return { S, v, d, n: eq(d, 0) ? null : clean(1 + (v - a) / d) };
}

F.whichN = q => { const P = position(q); return P && P.n !== null ? P.n : undefined; };

T.isTerm = q => {
  const P = position(q);
  if (!P || P.n === null) return null;
  const { S, n, v } = P;
  return c => {
    let m;
    if (/^No: it would come before a_1 \(n < 1\)$/.test(c)) return n < S.lo;
    if ((m = c.match(/^No: it would come after the last term, a_(\d+)$/))) return Number(m[1]) === S.hi && n > S.hi;
    if (/^No: n would not be a whole number$/.test(c)) return !isWhole(n);
    if ((m = c.match(/^Yes: (-?\d+(?:\.\d+)?) = a_(-?\d+)$/))) { const k = Number(m[2]); return eq(num(m[1]), v) && isWhole(n) && k === Math.round(n) && k >= S.lo && k <= S.hi; }
    return false;
  };
};

T.constCase = q => {
  const p = norm(q.prompt), m = p.match(/^(.*?)\. For which n is a_n = (-?\d+(?:\.\d+)?)\?/);
  if (!m) return null;
  const S = parseDef(m[1], { lo: 1, hi: Infinity }), v = num(m[2]);
  if (!S.ok) return null;
  const top = Math.min(S.hi, S.lo + 60), hits = [];
  for (let n = S.lo; n <= top; n++) if (eq(S.at(n), v)) hits.push(n);
  const all = hits.length === top - S.lo + 1;
  return c => {
    let cm;
    if ((cm = c.match(/^Every n ≥ (-?\d+)$/))) return all && Number(cm[1]) === S.lo && S.hi === Infinity;
    if (/^No n at all$/.test(c)) return hits.length === 0;
    if ((cm = c.match(/^(?:Only )?n = (-?\d+)$/))) return hits.length === 1 && hits[0] === Number(cm[1]) && S.hi === top;
    return false;
  };
};

F.twoTerms = q => {
  const m = norm(q.prompt).match(/a_(\d+) = (-?\d+(?:\.\d+)?) and a_(\d+) = (-?\d+(?:\.\d+)?)/);
  if (!m) return undefined;
  const [i, u, j, w] = [Number(m[1]), num(m[2]), Number(m[3]), num(m[4])], d = (w - u) / (j - i);
  return [clean(u - (i - 1) * d), clean(d)];
};

F.gapD = q => {
  const D = drawn(q), d = (D[1].v - D[0].v) / (D[1].n - D[0].n), p = norm(q.prompt);
  if (/What is d\?/.test(p)) return clean(d);
  // oracle fix: the family also asks for a_1 (step back n − 1 jumps from a drawn term)
  if (/What is a_1\?/.test(p)) return clean(D[0].v - (D[0].n - 1) * d);
  return undefined;
};

T.determined = q => {
  const m = norm(q.prompt).match(/a_1 = (-?\d+(?:\.\d+)?) and a_3 = (-?\d+(?:\.\d+)?)/);
  const mid = (num(m[1]) + num(m[2])) / 2;
  return c => {
    let cm;
    if (/^a_2 must be/.test(c)) return false; // nothing says it is arithmetic: a_2 can be anything
    if ((cm = c.match(/^a_2 = (-?\d+(?:\.\d+)?) only if we know the sequence is arithmetic$/))) return eq(num(cm[1]), mid);
    return false;
  };
};

F.recToExp = q => { const S = parseDef(firstSentence(q.prompt)); return S.ok ? [clean(S.at(1)), clean(S.at(2) - S.at(1))] : undefined; };

T.recToExpChoice = q => { const S = parseDef(firstSentence(q.prompt)); return S.ok ? c => sameSeq(parseDef(c), S) : null; };

F.expand = q => {
  const m = norm(q.prompt).match(/^Rewrite a_n = (.+?) in the form/), f = m && parseExpr(m[1]);
  return f ? [clean(f(1) - f(0)), clean(f(0))] : undefined;
};

F.slopeOf = q => { const S = promptDef(q); return S.ok ? clean(S.at(2) - S.at(1)) : undefined; };

F.seedOf = q => { const S = promptDef(q); return S.ok ? clean(S.at(S.lo)) : undefined; };

T.expToRec = q => { const S = promptDef(q); return S.ok ? c => sameSeq(parseDef(c), S) : null; };

/** "Show that A(n) = … lists the same sequence as <recursive>, for EVERY n" */
function equivGivens(q) {
  const m = norm(q.prompt).match(/^Show that A\(n\) = (.+?) lists the same sequence as (.+?), for EVERY n\./);
  if (!m) return null;
  const A = parseExpr(m[1]), R = parseDef(m[2]);
  return A && R.ok ? { A, R } : null;
}
T.equivWhich = q => {
  const G = equivGivens(q);
  if (!G) return null;
  const { A, R } = G, step = clean(A(2) - A(1)), linear = eq(A(3) - A(2), step);
  return c => {
    let m;
    // a proof needs both: the same start AND the same step for every n (examples or shared numbers prove nothing)
    if ((m = c.match(/^A\(1\) = (-?\d+(?:\.\d+)?), and A\(n \+ 1\) - A\(n\) = (-?\d+(?:\.\d+)?) for every n ≥ 1$/)))
      return linear && eq(num(m[1]), A(1)) && eq(num(m[1]), R.seed) && eq(num(m[2]), step) && eq(num(m[2]), R.d) && R.lo === 1;
    return false;
  };
};
F.equivPair = q => {
  const m = norm(q.prompt).match(/^A\(n\) = (.+?)\. Work out/), A = m && parseExpr(m[1]);
  return A ? [clean(A(1)), clean(A(2) - A(1))] : undefined;
};

T.whyLine = q => {
  const p = norm(q.prompt);
  let m;
  if ((m = p.match(/^Why do ALL the points \(n, a_n\) of a_n = (.+?) lie on one line\?/))) {
    const f = parseExpr(m[1]);
    return c => {
      const cm = c.match(/^a_n = (.+?) for every n, so every point is on y = (.+)$/);
      if (!cm) return false;
      const g = parseExpr(cm[1]), h = parseExpr(cm[2]);
      return !!(f && g && h) && [0, 1, 2, 7].every(n => eq(f(n), g(n)) && eq(f(n), h(n)));
    };
  }
  if (/Why is the graph not the whole line\?/.test(p))
    return c => /^n only takes whole values 1, 2, 3, \.\.\., so only those points belong$/.test(c);
  return null;
};

F.slopeBetween = q => {
  const m = norm(q.prompt).match(/are \((-?\d+(?:\.\d+)?), (-?\d+(?:\.\d+)?)\) and \((-?\d+(?:\.\d+)?), (-?\d+(?:\.\d+)?)\)/);
  if (!m) return undefined;
  const [x1, y1, x2, y2] = m.slice(1, 5).map(num);
  return clean((y2 - y1) / (x2 - x1));
};

F.firstVsZero = q => { const S = promptDef(q); return S.ok ? [clean(S.at(1)), clean(S.f ? S.f(0) : S.at(0))] : undefined; };

T.interceptTerm = q => {
  const S = promptDef(q), m = norm(q.prompt).match(/Is (-?\d+(?:\.\d+)?) a term of this sequence\?/);
  if (!S.ok || !m) return null;
  const c0 = num(m[1]), d = S.at(2) - S.at(1);
  const isTermVal = eq(d, 0) ? eq(S.at(1), c0) : (() => { const n = 1 + (c0 - S.at(1)) / d; return isWhole(n) && Math.round(n) >= S.lo; })();
  return c => {
    let cm;
    if ((cm = c.match(/^No: (-?\d+(?:\.\d+)?) is the value at n = 0, outside the domain; the first term is (-?\d+(?:\.\d+)?)$/)))
      return !isTermVal && eq(num(cm[1]), c0) && eq(S.f(0), c0) && eq(num(cm[2]), S.at(1));
    if ((cm = c.match(/^Yes: (-?\d+(?:\.\d+)?) is the first term$/))) return eq(num(cm[1]), c0) && eq(S.at(1), c0);
    // oracle fix: the d = 0 variant ("a_n = −5 for n ≥ 1")
    if ((cm = c.match(/^Yes: d = (-?\d+(?:\.\d+)?), so every term is (-?\d+(?:\.\d+)?)$/))) return eq(num(cm[1]), d) && eq(d, 0) && eq(num(cm[2]), S.at(1)) && eq(S.at(1), c0);
    if ((cm = c.match(/^No: (-?\d+(?:\.\d+)?) is only the value at n = 0$/))) return !isTermVal && eq(num(cm[1]), c0) && eq(S.f(0), c0);
    if ((cm = c.match(/^No: the first term is (-?\d+(?:\.\d+)?)$/))) return !isTermVal && eq(num(cm[1]), S.at(1));
    return false; // "writing it as … makes the sequence start at n = 0": the domain says n ≥ 1
  };
};

T.shiftRule = q => {
  const m = norm(q.prompt).match(/^Rewrite (.+?) with the rule written forward/);
  const S = m && parseDef(m[1]);
  return S?.ok ? c => sameSeq(parseDef(c), S) && /\[n\+1\]/.test(conv(c)) : null;
};

F.shiftBound = q => {
  const p = norm(q.prompt);
  let m;
  if ((m = p.match(/^Check the rewrite: (.+?)\. List from the seed: what is [a-z](?:\((\d+)\)|_(\d+))\?/))) {
    m[2] = m[2] ?? m[3]; // oracle fix: a_k as well as f(k)
    const S = parseDef(m[1]), k = Number(m[2]);
    return S.ok && k >= S.lo && k <= S.hi ? clean(S.at(k)) : undefined;
  }
  if ((m = p.match(/^(.+?)\. Rewritten as .+? for (-?\d+) ≤ n ≤ □\. What is the upper bound\?/))) {
    // forward rule a_(n+1) from n = lo: it must reach the same last term
    const S = parseDef(m[1]);
    return S.ok && Number.isFinite(S.hi) ? S.hi - 1 : undefined;
  }
  return undefined;
};

/** "g(n) = … for n ≥ 1 lists …" / "g(n) = … for n ≥ 1." */
const gDef = q => { const m = norm(q.prompt).match(/^(g\(n\) = .+? for n ≥ \d+)(?: lists|\.)/); return m ? parseDef(m[1]) : { ok: false }; };

F.reindexExp = q => { const G = gDef(q); if (!G.ok) return undefined; const f = shift(G, 1); return [clean(f.at(0)), clean(f.at(1) - f.at(0))]; };

T.sameTerms = q => {
  const G = gDef(q);
  if (!G.ok) return null;
  const target = shift(G, G.lo); // the same terms labelled from n = 0
  return c => sameSeq(parseDef(c), target);
};

T.reindexRec = q => {
  const m = norm(q.prompt).match(/^(.+?)\. Relabel from 0 with g\(n\) = f\(n \+ 1\)\./);
  const S = m && parseDef(m[1]);
  if (!S?.ok) return null;
  const target = shift(S, 1);
  return c => sameSeq(parseDef(c), target);
};

F.relabelBound = q => {
  const p = norm(q.prompt);
  let m;
  if ((m = p.match(/f has exactly (\d+) terms, f\(1\) to f\(\d+\)\. Relabel with g\(n\) = f\(n \+ 1\) for 0 ≤ n ≤ □/))) return Number(m[1]) - 1;
  if ((m = p.match(/^f\(1\), f\(2\), \.\.\. is (.+?), \.\.\. and g\(n\) = f\(n \+ 1\) for n ≥ 0\. What is g\((\d+)\)\?/))) {
    const L = nums(m[1]), k = Number(m[2]);
    return L[k] ?? clean(L[0] + k * (L[1] - L[0]));
  }
  return undefined;
};

F.ctxValue = q => {
  const b = texPlain(q.board), bm = b.match(/[A-Za-z]_(\d+) = (-?\d+(?:\.\d+)?), d = (-?\d+(?:\.\d+)?)/);
  const p = norm(q.prompt), pm = p.match(/What is the value (?:after|in|for) (?:row |floor |week |month |hour )?(\d+)/);
  if (!bm || !pm) return undefined;
  const s = Number(bm[1]), v = num(bm[2]), d = num(bm[3]), k = Number(pm[1]);
  return clean(v + (k - s) * d);
};

/** the story's model: start value, step, and the first n */
function storyModel(q) {
  const p = norm(q.prompt);
  // oracle fix: "Row 1 of …" names the index, not a quantity
  const story = p.split(/ Using n = /)[0], L = nums(story.replace(/\b(Row|Floor|Week|Month) 1\b/, '$1'));
  if (L.length < 2) return null;
  const down = /drops|falls|loses|spends|decreases|less/.test(story);
  const v = L[0], d = (down ? -1 : 1) * L[1];
  if (/\bnow\b|per mile|plus/.test(story) && /from now|driven/.test(p)) return { ok: true, lo: 0, hi: Infinity, at: n => v + n * d };
  if (/(Row|Floor|Week|Month) 1\b/.test(story)) return { ok: true, lo: 1, hi: Infinity, at: n => v + (n - 1) * d };
  return null;
}
T.ctxModel = q => { const S = storyModel(q); return S ? c => sameSeq(parseDef(c), S) : null; };

// ---------------------------------------------------------------- entry points
export function solve(q) {
  if (F[q.family]) {
    const v = F[q.family](q);
    return v === undefined || (typeof v === 'number' && !Number.isFinite(v)) ? undefined : v;
  }
  if (T[q.family]) {
    const t = T[q.family](q);
    // two right choices: the first one is returned so the item stays checked; sane reports it
    return t ? pick(q, t) : undefined;
  }
  return undefined;
}

export function sane(q) {
  const f = q.family, p = norm(q.prompt);
  if (T[f]) {
    const t = T[f](q);
    if (t) {
      const k = countTrue(q, t);
      if (k === 0) return 'no choice is right';
      if (k > 1) return `${k} choices are right`;
    }
  }
  // lists said to be arithmetic must be
  if (['findD', 'recWrite', 'deriveForm', 'formFromList'].includes(f)) {
    const ds = diffs(boardNums(q));
    if (!allSame(ds)) return 'the list is not arithmetic';
  }
  if (['termAt'].includes(f)) {
    const L = listFromPrompt(p.replace(/^The sequence starts at n = 1: /, ''));
    if (!allSame(diffs(L))) return 'the list is not arithmetic';
  }
  if (f === 'recFinite') {
    const N = Number(p.match(/exactly (\d+) terms/)[1]), L = boardNums(q), d = L[1] - L[0];
    if (!eq(L[2] - L[1], d) || !eq(L[L.length - 1], L[0] + (N - 1) * d)) return 'the last term does not fit the jump and the count';
  }
  if (['gapD', 'fRead', 'graphRead', 'formFromGraph', 'fMeaning', 'relabelBound'].includes(f)) {
    const D = drawn(q);
    if (D.length >= 2) {
      const r = D.slice(1).map((o, i) => (o.v - D[i].v) / (o.n - D[i].n));
      if (!r.every(x => eq(x, r[0]))) return 'the drawn terms are not arithmetic';
    }
  }
  if (f === 'formFromGraph') {
    const m = p.match(/The points \((-?\d+(?:\.\d+)?), (-?\d+(?:\.\d+)?)\), \((-?\d+(?:\.\d+)?), (-?\d+(?:\.\d+)?)\)/), D = drawn(q);
    if (m && !(num(m[1]) === D[0].n && eq(num(m[2]), D[0].v) && num(m[3]) === D[1].n && eq(num(m[4]), D[1].v))) return 'the prompt and the graph disagree';
  }
  if (f === 'slopeOf' || f === 'firstVsZero') {
    const S = promptDef(q), D = drawn(q);
    if (S.ok && D.some(o => !eq(S.at(o.n), o.v))) return 'the drawn points do not follow the formula';
  }
  if (f === 'whichN') {
    const P = position(q);
    if (!P || P.n === null) return 'd = 0: no single n';
    if (!isWhole(P.n) || P.n < P.S.lo || P.n > P.S.hi) return `the value is not a term (n = ${P.n})`;
  }
  if (f === 'evalMoney') {
    const m = p.match(/^(.*?) So [A-Za-z]_n = (.+?)\. Find/), fx = m && parseExpr(m[2]);
    if (m && fx) {
      const L = nums(m[1]).filter(x => x !== 1);
      if (L.length >= 2 && !(eq(fx(1), L[0]) && eq(fx(2) - fx(1), L[1]))) return 'the formula does not match the story';
    }
    const v = F.evalMoney(q);
    if (v !== undefined && (v < 0 || (q.unit === 'seats' && !isWhole(v)))) return `impossible amount ${v}`;
  }
  if (f === 'ctxValue') {
    const b = texPlain(q.board), bm = b.match(/[A-Za-z]_(\d+) = (-?\d+(?:\.\d+)?), d = (-?\d+(?:\.\d+)?)/);
    const L = nums(p.split(/ Model it/)[0]).filter(x => x !== 1);
    const sm = p.match(/start at n = (\d+)/);
    if (bm && sm && Number(bm[1]) !== Number(sm[1])) return 'the board start index and the prompt disagree';
    if (bm && L.length >= 2 && !(eq(num(bm[2]), L[0]) && eq(Math.abs(num(bm[3])), L[1]))) return 'the board and the story disagree';
  }
  if (f === 'equivWhich') {
    const G = equivGivens(q);
    if (G) {
      const S = { ok: true, lo: 1, hi: Infinity, at: G.A };
      if (!sameSeq(S, G.R)) return 'the formula and the recursion are not the same sequence: nothing to show';
    }
  }
  if (f === 'twoTerms') {
    const m = p.match(/a_(\d+) = (-?\d+(?:\.\d+)?) and a_(\d+) = (-?\d+(?:\.\d+)?)/), D = drawn(q);
    if (m && D.length === 2 && !(D[0].n === Number(m[1]) && eq(D[0].v, num(m[2])) && D[1].n === Number(m[3]) && eq(D[1].v, num(m[4]))))
      return 'the picture and the prompt disagree';
  }
  return '';
}

export default { solve, sane };
