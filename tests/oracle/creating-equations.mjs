// Oracle for the lesson "creating-equations" (Algebra 1: writing equations and inequalities from constraints;
// secondary-t6-06, A-CED.A.1-3, N-Q.A.1-2).
// Role O of docs/lessons/QUALITY_LAYER.md: every practice item is worked out from what the student sees. The story in
// the prompt is turned into the model a careful teacher would write (linear expressions in the story's letters, with
// the bound phrase deciding the symbol), every choice is parsed into maths (a relation, a list of relations, a set of
// allowed values) and compared by meaning (two relations are the same when one is a positive multiple of the other,
// sides swapped allowed), and every reason in a choice is checked (numbers it computes, claims it makes, the
// conclusion it draws). The students are high schoolers (14-18).
import { nums, Q } from '../../tools/quality/oracle-kit.mjs';

// ---------------------------------------------------------------- small helpers
const EPS = 1e-9;
const near = (a, b) => Math.abs(a - b) <= 1e-7 * Math.max(1, Math.abs(a), Math.abs(b));
const isWhole = v => near(v, Math.round(v));
const P = q => String(q.prompt ?? '').replace(/\s+/g, ' ').trim();
const norm = s => String(s ?? '').replace(/−/g, '-').replace(/[   ]/g, ' ').replace(/\s+/g, ' ').trim();
const idx = (q, pred) => (q.choices ?? []).findIndex(c => pred(norm(c)));
/** index of the one choice that passes; -1 if none or several */
function only(q, pred) {
  const hits = (q.choices ?? []).map((c, i) => (pred(norm(c), i) ? i : -1)).filter(i => i >= 0);
  return hits.length === 1 ? hits[0] : -1;
}
const count = (q, pred) => (q.choices ?? []).filter((c, i) => pred(norm(c), i)).length;

// ---------------------------------------------------------------- linear expressions
// A linear form: { c: { letter: coef }, k: const }. Numbers are JS floats; all story numbers are short decimals.
const L = (c = {}, k = 0) => ({ c, k });
const addL = (a, b, s = 1) => {
  const c = { ...a.c };
  for (const [v, x] of Object.entries(b.c)) c[v] = (c[v] ?? 0) + s * x;
  for (const v of Object.keys(c)) if (Math.abs(c[v]) < EPS) delete c[v];
  return L(c, a.k + s * b.k);
};
const scaleL = (a, s) => { const c = {}; for (const [v, x] of Object.entries(a.c)) c[v] = x * s; return L(c, a.k * s); };
const isConst = a => Object.keys(a.c).length === 0;
function tokens(s) {
  const t = [], str = norm(s).replace(/×|·|\*/g, '*').replace(/÷/g, '/').replace(/\$/g, '');
  let i = 0;
  while (i < str.length) {
    const ch = str[i];
    if (ch === ' ') { i++; continue; }
    const m = str.slice(i).match(/^\d+(?:\.\d+)?|^\.\d+/);
    if (m) { t.push({ n: Number(m[0]) }); i += m[0].length; continue; }
    if (/[A-Za-z]/.test(ch)) { t.push({ v: ch }); i++; continue; }
    if ('+-*/()'.includes(ch)) { t.push({ o: ch }); i++; continue; }
    throw new Error(`token ${ch} in "${s}"`);
  }
  return t;
}
/** parse a linear expression ("15 + 5g", "8(t + 5)", "0.75(1) + 1.5(8)") → linear form */
function lin(s) {
  const t = tokens(s); let p = 0;
  const peek = () => t[p];
  function expr() {
    let a = term();
    while (peek() && (peek().o === '+' || peek().o === '-')) { const o = t[p++].o; a = addL(a, term(), o === '+' ? 1 : -1); }
    return a;
  }
  function term() {
    let a = factor();
    for (;;) {
      const k = peek();
      if (!k) break;
      if (k.o === '*') { p++; a = mul(a, factor()); continue; }
      if (k.o === '/') { p++; const b = factor(); if (!isConst(b)) throw new Error('divide by a letter'); a = scaleL(a, 1 / b.k); continue; }
      if (k.n !== undefined || k.v !== undefined || k.o === '(') { a = mul(a, factor()); continue; }
      break;
    }
    return a;
  }
  function factor() {
    const k = t[p++];
    if (!k) throw new Error(`end of "${s}"`);
    if (k.o === '-') return scaleL(factor(), -1);
    if (k.o === '+') return factor();
    if (k.n !== undefined) return L({}, k.n);
    if (k.v !== undefined) return L({ [k.v]: 1 }, 0);
    if (k.o === '(') { const a = expr(); if (!t[p] || t[p].o !== ')') throw new Error(`no ) in "${s}"`); p++; return a; }
    throw new Error(`unexpected ${JSON.stringify(k)} in "${s}"`);
  }
  function mul(a, b) {
    if (isConst(a)) return scaleL(b, a.k);
    if (isConst(b)) return scaleL(a, b.k);
    throw new Error(`not linear: "${s}"`);
  }
  const r = expr();
  if (p !== t.length) throw new Error(`left over in "${s}"`);
  return r;
}
const evalL = (a, vals) => Object.entries(a.c).reduce((s, [v, x]) => s + x * vals[v], a.k);

// ---------------------------------------------------------------- relations
const OPS = { '≤': '<=', '≥': '>=', '<': '<', '>': '>', '=': '=' };
const FLIP = { '<=': '>=', '>=': '<=', '<': '>', '>': '<', '=': '=' };
/** "A op B" or a chain "A op B op C" → list of { f, op } meaning f op 0 */
function rels(s) {
  const parts = norm(s).replace(/<=/g, '≤').replace(/>=/g, '≥').split(/(≤|≥|<|>|=)/).map(x => x.trim());
  if (parts.length < 3) throw new Error(`no relation in "${s}"`);
  const out = [];
  for (let i = 1; i < parts.length; i += 2) {
    out.push({ f: addL(lin(parts[i - 1]), lin(parts[i + 1]), -1), op: OPS[parts[i]] });
  }
  return out;
}
const rel = s => { const r = rels(s); if (r.length !== 1) throw new Error(`chain "${s}"`); return r[0]; };
const holds = (op, v) => (op === '<=' ? v <= EPS : op === '>=' ? v >= -EPS : op === '<' ? v < -EPS : op === '>' ? v > EPS : Math.abs(v) <= EPS);
const relHolds = (r, vals) => holds(r.op, evalL(r.f, vals));
/** same relation: one is a positive multiple of the other (any multiple for =) */
function sameRel(a, b) {
  for (const s of [1, -1]) {
    const op = s === 1 ? b.op : FLIP[b.op];
    if (op !== a.op) continue;
    const fb = scaleL(b.f, s);
    const vars = new Set([...Object.keys(a.f.c), ...Object.keys(fb.c)]);
    let ratio = null, ok = true;
    for (const v of vars) {
      const x = a.f.c[v] ?? 0, y = fb.c[v] ?? 0;
      if (Math.abs(x) < EPS && Math.abs(y) < EPS) continue;
      if (Math.abs(x) < EPS || Math.abs(y) < EPS) { ok = false; break; }
      const r = x / y; if (ratio === null) ratio = r; else if (!near(r, ratio)) { ok = false; break; }
    }
    if (!ok || ratio === null) continue;
    if (!near(a.f.k, ratio * fb.k)) continue;
    if (a.op !== '=' && ratio <= 0) continue;
    return true;
  }
  return false;
}
const tryRel = s => { try { return rel(s); } catch { return null; } };
const mk = (coefs, op, rhs) => ({ f: L(Object.fromEntries(Object.entries(coefs).filter(([, x]) => Math.abs(x) > EPS)), -rhs), op });

// ---------------------------------------------------------------- bound phrases
const PHRASES = [
  [/no more than|at most|a maximum of|cannot exceed|up to|can weigh at most/, '<='],
  [/no fewer than|no less than|at least|a minimum of/, '>='],
  [/fewer than|less than|\bunder\b/, '<'],
  [/more than|exceeds|hotter than|\bover\b/, '>'],
  [/exactly|a total of/, '='],
];
function phraseOp(s) {
  s = String(s).toLowerCase();
  let best = null;
  for (const [re, op] of PHRASES) {
    const m = s.match(re);
    if (m && (best === null || m.index < best.at)) best = { op, at: m.index };
  }
  return best?.op;
}
const SYM = { '<=': '≤', '>=': '≥', '<': '<', '>': '>', '=': '=' };

// ---------------------------------------------------------------- reading a story
/** the letters of a pair in order: from the table head drawn on the picture, else the prompt */
function pairVars(q) {
  const head = q.data?.picture?.table?.head;
  if (head) { const v = head.replace(/\\,|\\ /g, '').match(/\(([A-Za-z]),([A-Za-z])\)/); if (v) return [v[1], v[2]]; }
  const m = [...P(q).matchAll(/\b([A-Za-z]) = (?:the )?number of/g)].map(x => x[1]);
  if (m.length >= 2) return m.slice(0, 2);
  const w = P(q).match(/With ([A-Za-z]) [a-z]+ [a-z]+ and ([A-Za-z]) /);
  return w ? [w[1], w[2]] : null;
}
/** the plan (x, y) named in the prompt */
function pairIn(s) {
  const m = norm(s).match(/\((-?\d+(?:\.\d+)?), (-?\d+(?:\.\d+)?)\)/);
  return m ? [Number(m[1]), Number(m[2])] : null;
}
/** letters defined as "x = (the) number of <phrase>" → [{ v, words }] in the order they are defined */
function defs(s) {
  return [...norm(s).matchAll(/\b([A-Za-z]) = (?:the )?(?:number|numbers) of ([a-z ]+?)(?=[,.;)]| and |$)/g)].map(m => ({ v: m[1], words: m[2] }));
}
const STOP = new Set(['batches', 'batch', 'of', 'the', 'boxes', 'box', 'tickets', 'ticket', 'plants', 'number', 'a']);
/** where in the text a defined quantity is first named (its most telling word) */
function firstAt(text, words) {
  const ws = words.split(' ').filter(w => !STOP.has(w));
  const keys = ws.length ? ws : words.split(' ');
  let best = Infinity;
  for (const w of keys) {
    const stem = w.replace(/s$/, '');
    const m = text.toLowerCase().match(new RegExp(`\\b${stem}`, 'i'));
    if (m) best = Math.min(best, m.index);
  }
  return best;
}
/** two items with a per-item amount each: "Adult tickets cost $8 each, child tickets $6 each." → rates by letter */
function twoRates(q) {
  const p = P(q);
  const d = defs(p);
  if (d.length < 2) return null;
  const first = p.split(/(?<=[a-z$\d])\. (?=[A-Z])/)[0];         // the sentence with the two amounts
  const ns = nums(first);
  if (ns.length < 2) return null;
  // order the letters by where their item is named in that sentence
  const order = d.slice(0, 2).map(x => ({ ...x, at: firstAt(first, x.words) })).sort((a, b) => a.at - b.at);
  return { vars: d.slice(0, 2).map(x => x.v), rate: { [order[0].v]: ns[0], [order[1].v]: ns[1] }, first, rest: p.slice(first.length) };
}

// ---------------------------------------------------------------- the planning stories (club, garden, hike)
/** the full model of a planning story: list of { f, op, words } + whole / not negative for both letters */
function planModel(q) {
  const p = P(q);
  let m = p.match(/exactly (\d+) (tickets|plants): ([a-z ]+?) at \$(\d+(?:\.\d+)?) and ([a-z ]+?) at \$(\d+(?:\.\d+)?)\. At least (\d+) must be ([a-z ]+?), and (?:it can spend|the budget is) at most \$(\d+(?:\.\d+)?)/);
  const d = defs(p);
  if (m && d.length >= 2) {
    const [x, y] = [d[0].v, d[1].v];
    const total = +m[1], px = +m[4], py = +m[6], low = +m[7], bud = +m[9];
    return {
      vars: [x, y],
      rules: [
        { ...mk({ [x]: 1, [y]: 1 }, '=', total), key: 'total', words: `exactly ${total} ${m[2]}` },
        { ...mk({ [x]: 1 }, '>=', low), key: 'low', words: `at least ${low} ${m[8]}` },
        { ...mk({ [x]: px, [y]: py }, '<=', bud), key: 'budget', words: `spend at most $${bud}` },
      ],
      nouns: [m[3], m[5]],
    };
  }
  m = p.match(/granola bars \((\d+(?:\.\d+)?) g of protein, \$(\d+(?:\.\d+)?) each\) and yogurt cups \((\d+(?:\.\d+)?) g of protein, \$(\d+(?:\.\d+)?) each\)\. You want at least (\d+(?:\.\d+)?) g of protein and can spend at most \$(\d+(?:\.\d+)?)/);
  if (m && d.length >= 2) {
    const [x, y] = [d[0].v, d[1].v];
    return {
      vars: [x, y],
      rules: [
        { ...mk({ [x]: +m[1], [y]: +m[3] }, '>=', +m[5]), key: 'protein', words: `at least ${m[5]} g of protein` },
        { ...mk({ [x]: +m[2], [y]: +m[4] }, '<=', +m[6]), key: 'budget', words: `spend at most $${m[6]}` },
      ],
      nouns: ['granola bars', 'yogurt cups'],
    };
  }
  return null;
}
const wholeOk = v => v >= -EPS && isWhole(v);
/** which conditions a plan breaks: rule keys, plus 'whole' for a coordinate that is negative or not whole */
function breaks(model, vals) {
  const out = model.rules.filter(r => !relHolds(r, vals)).map(r => r.key);
  if (!model.vars.every(v => wholeOk(vals[v]))) out.push('whole');
  return out;
}
/** a model clause from a choice: a relation, or "x, y whole numbers", or "x, y > 0" */
function clause(s) {
  s = norm(s);
  if (/whole numbers?$/.test(s)) return { whole: s.replace(/whole numbers?$/, '').split(/[ ,]+/).filter(Boolean).sort().join(',') };
  const m = s.match(/^([A-Za-z]), ([A-Za-z]) ([<>≤≥]) (\d+)$/);
  if (m) return { both: [m[1], m[2]].sort().join(','), op: OPS[m[3]], k: +m[4] };
  return tryRel(s);
}
const sameClause = (a, b) => (a?.whole !== undefined || b?.whole !== undefined ? a?.whole === b?.whole
  : a?.both !== undefined || b?.both !== undefined ? a?.both === b?.both && a?.op === b?.op && a?.k === b?.k
    : !!a && !!b && sameRel(a, b));
function fullClauses(model) {
  return [...model.rules, { whole: [...model.vars].sort().join(',') }];
}

// ---------------------------------------------------------------- sets of allowed values (one letter)
// { kind: 'all' } | { kind: 'range', lo, loC, hi, hiC } (lo/hi may be ±Infinity) | { kind: 'list', vs } | { kind: 'empty' }
const sameSet = (a, b) => {
  if (!a || !b || a.kind !== b.kind) return false;
  if (a.kind === 'range') return a.lo === b.lo && a.hi === b.hi && (a.lo === -Infinity || a.loC === b.loC) && (a.hi === Infinity || a.hiC === b.hiC);
  if (a.kind === 'list') return a.vs.length === b.vs.length && a.vs.every((v, i) => near(v, b.vs[i]));
  return true;
};
/** a choice like "L > 0", "0 ≤ p ≤ 100", "n ≤ 44" → range */
function rangeOf(s, letter) {
  const r = rels(s);
  let lo = -Infinity, loC = false, hi = Infinity, hiC = false;
  for (const x of r) {
    const a = x.f.c[letter];
    if (!a || Object.keys(x.f.c).length !== 1) return null;
    const v = -x.f.k / a, op = a > 0 ? x.op : FLIP[x.op];
    if (op === '<=' || op === '<') { if (v < hi || (v === hi && op === '<')) { hi = v; hiC = op === '<='; } }
    else if (op === '>=' || op === '>') { if (v > lo || (v === lo && op === '>')) { lo = v; loC = op === '>='; } }
    else return { kind: 'range', lo: v, loC: true, hi: v, hiC: true };
  }
  return { kind: 'range', lo, loC, hi, hiC };
}
/** "0, 0.25, 0.5, …, 2.25" / "0, 1, 2 only" / "0, 1, …, 3 only" / "Separate dots at 0, 1, 2, …, 7" → list */
function listOf(s) {
  const t = norm(s).replace(/^Separate dots at /, '').replace(/ only$/, '');
  const parts = t.split(/,\s*/);
  if (!parts.every(x => x === '…' || x === '...' || /^-?\d+(\.\d+)?$/.test(x))) return null;
  const el = parts.indexOf('…') >= 0 ? parts.indexOf('…') : parts.indexOf('...');
  if (el < 0) return { kind: 'list', vs: parts.map(Number) };
  const head = parts.slice(0, el).map(Number), last = Number(parts[el + 1]);
  if (head.length < 2 || el !== parts.length - 2) return null;
  const step = head[1] - head[0], vs = [];
  for (let v = head[0]; v <= last + EPS; v = Math.round((v + step) * 1e9) / 1e9) vs.push(v);
  if (!near(vs[vs.length - 1], last)) return null;
  return { kind: 'list', vs };
}
const wholeList = (lo, hi) => { const vs = []; for (let v = Math.max(0, Math.ceil(lo - EPS)); v <= hi + EPS; v++) vs.push(v); return vs; };

// ---------------------------------------------------------------- what kind of quantity is it?
/** true = whole numbers only (separate values), false = any part makes sense */
function discrete(text) {
  const s = String(text).toLowerCase();
  if (/any part|by weight|by the minute|amount of|length of|weight of|gallons of gas|rental hours/.test(s)) return false;
  if (/number of (buses|people|tickets|songs|volunteers|drivers|players|members|riders|apples|plants)|tickets/.test(s)) return true;
  return undefined;
}

// ================================================================ the families
const SOLVE = {
  // ---- 1 equation-as-condition
  eqTest(q) {
    const r = rel(P(q).match(/The condition is (.+?)\. Which/)[1]);
    const v = Object.keys(r.f.c)[0];
    return only(q, c => { const m = c.match(/^([A-Za-z]) = (-?\d+(?:\.\d+)?)$/); return !!m && m[1] === v && relHolds(r, { [v]: +m[2] }); });
  },
  eqMeaning(q) {
    // an equation with one letter is a condition: true for exactly one value, false for the others
    return only(q, c => /^It is a condition: true for exactly the right number/.test(c));
  },

  // ---- 2 inequality-as-allowed-set
  allowedSet(q) {
    const r = rel(P(q).match(/the condition is (.+?)\. Which/)[1]);
    const v = Object.keys(r.f.c)[0], set = rangeOf(P(q).match(/the condition is (.+?)\. Which/)[1], v);
    return only(q, c => {
      let m = c.match(/^Only (\d+(?:\.\d+)?)/);
      if (m) return set.lo === set.hi && set.lo === +m[1];
      m = c.match(/^Every \w+ (below|above) (\d+(?:\.\d+)?), and (\d+(?:\.\d+)?) itself (too|left out)$/);
      if (!m) return false;
      const n = +m[2], inc = m[4] === 'too';
      return m[1] === 'below' ? set.lo === -Infinity && set.hi === n && set.hiC === inc
        : set.hi === Infinity && set.lo === n && set.loC === inc;
    });
  },
  boundaryCand(q) {
    const m = P(q).match(/The condition is (.+?)\. Is ([A-Za-z]) = (-?\d+(?:\.\d+)?) allowed\?/);
    const r = rel(m[1]), ok = relHolds(r, { [m[2]]: +m[3] });
    return only(q, c => {
      const k = c.match(/^(Yes|No): (.+) is (true|false)$/);
      if (!k) return false;
      const claim = tryRel(k[2]);
      if (!claim) return false;
      const truth = holds(claim.op, claim.f.k);
      return (k[3] === 'true') === truth && (k[1] === 'Yes') === ok;
    });
  },

  // ---- 3 test-candidates
  pairTest(q) {
    const p = P(q), r = rel(p.match(/the rule is (.+?)\. Which/)[1]), vars = pairVars(q), pr = pairIn(p.split('Which check')[1]);
    const vals = { [vars[0]]: pr[0], [vars[1]]: pr[1] }, left = evalL(addL(r.f, L({}, 0)), vals) - r.f.k, ok = relHolds(r, vals);
    return only(q, c => checkClaim(c, left, ok, r, vals));
  },
  pairValue(q) {
    const p = P(q), r = rel(p.match(/The rule is (.+?) \(/)[1]), vars = pairVars(q), pr = pairIn(p.split('Test the pair')[1]);
    return evalL(r.f, { [vars[0]]: pr[0], [vars[1]]: pr[1] }) - r.f.k;
  },

  // ---- 4 conjunction-of-constraints
  bothValue(q) {
    const m = P(q).match(/: (.+?) and (.+?)\. Which value/);
    const a = rel(m[1]), b = rel(m[2]);
    return only(q, c => { const k = c.match(/^([A-Za-z]) = (-?\d+)$/); return !!k && relHolds(a, { [k[1]]: +k[2] }) && relHolds(b, { [k[1]]: +k[2] }); });
  },
  pairBoth(q) {
    const p = P(q);
    const m = p.match(/fits at most (\d+) trays\. A tray of cookies earns \$(\d+(?:\.\d+)?) and a tray of muffins \$(\d+(?:\.\d+)?)\. The goal is to earn at least \$(\d+(?:\.\d+)?)/);
    const cap = +m[1], ec = +m[2], em = +m[3], goal = +m[4];
    const pr = pairIn(p.split('Does')[1]), vars = pairVars(q);           // (c, m)
    const iC = vars.indexOf('c'), iM = vars.indexOf('m');
    const c = pr[iC], mm = pr[iM], trays = c + mm, earn = ec * c + em * mm;
    const fits = trays <= cap, earns = earn >= goal, both = fits && earns;
    return only(q, t => {
      let k;
      if ((k = t.match(/^No: (\d+) trays is more than (\d+)$/))) return !both && +k[1] === trays && +k[2] === cap && trays > cap;
      if ((k = t.match(/^No: (\d+(?:\.\d+)?)\((\d+(?:\.\d+)?)\) \+ (\d+(?:\.\d+)?)\((\d+(?:\.\d+)?)\) = (\d+(?:\.\d+)?), less than (\d+(?:\.\d+)?)$/)))
        return !both && termsMatch([[+k[1], +k[2]], [+k[3], +k[4]]], [[ec, c], [em, mm]]) && near(+k[5], earn) && earn < goal && +k[6] === goal;
      if ((k = t.match(/^No: it fits \((\d+) ≤ (\d+)\), but earns only \$(\d+(?:\.\d+)?), less than \$(\d+(?:\.\d+)?)$/)))
        return !both && +k[1] === trays && +k[2] === cap && fits && near(+k[3], earn) && !earns && +k[4] === goal;
      if (/^No: it must earn exactly/.test(t)) return false;                         // the goal is a bound, not an exact amount
      if ((k = t.match(/^Yes: it earns \$(\d+(?:\.\d+)?), at least \$(\d+(?:\.\d+)?)$/))) return both && near(+k[1], earn) && +k[2] === goal;
      if ((k = t.match(/^Yes: (\d+) ≤ (\d+) and (\d+(?:\.\d+)?) ≥ (\d+(?:\.\d+)?)\. Both hold$/))) return both && +k[1] === trays && +k[2] === cap && near(+k[3], earn) && +k[4] === goal;
      if ((k = t.match(/^Yes: (\d+) trays fit on the table$/))) return both && +k[1] === trays;
      if ((k = t.match(/^Yes: (\d+(?:\.\d+)?)\((\d+(?:\.\d+)?)\) \+ (\d+(?:\.\d+)?)\((\d+(?:\.\d+)?)\) = (\d+(?:\.\d+)?) ≥ (\d+(?:\.\d+)?)$/)))
        return both && termsMatch([[+k[1], +k[2]], [+k[3], +k[4]]], [[ec, c], [em, mm]]) && near(+k[5], earn) && +k[6] === goal;
      return false;
    });
  },

  // ---- 5 bound-phrase-to-symbol
  phraseSymbol(q) {
    const op = phraseOp(P(q).match(/“(.+?)”/)[1]);
    return only(q, c => c === SYM[op]);
  },
  phraseWrite(q) {
    const p = P(q), quote = p.match(/“(.+?)”/)[1], op = phraseOp(quote);
    const n = nums(quote)[0], v = p.match(/Let ([A-Za-z]) =/)[1];
    const want = mk({ [v]: 1 }, op, n);
    return only(q, c => { const r = tryRel(c); return !!r && sameRel(r, want); });
  },

  // ---- 6 define-variables
  defineVar(q) {
    // the letter is the unknown amount of the thing that is priced/paid "per" or "each": the number (or measured amount,
    // with its unit) of gallons / pounds / hours / weeks / buses / adult tickets, named by its first letter
    // (the unit the rate is "per": gallon, pound, hour, week, bus, adult ticket)
    const p = P(q);
    const unit = (p.match(/ per (\w+)/) ?? p.match(/for each (\w+)/) ?? p.match(/^Each (\w+)/) ?? p.match(/sells (\w+ \w+) for/))?.[1];
    if (!unit) return undefined;
    const stem = unit.replace(/s$/, '').replace(/e?s$/, '').slice(0, 4).toLowerCase();
    return only(q, c => {
      const d = c.slice(c.indexOf('=') + 1).trim().toLowerCase();
      if (!/^the (number|amount|weight)\b/.test(d)) return false;             // a quantity, not a label, a rate or a total
      if (/\bone\b/.test(d)) return false;                                    // "on one bus", "of one gallon": a given number
      return d.split(/[ ,]+/).some(w => w.startsWith(stem));
    });
  },
  unitCheck(q) {
    const t = twoRates(q), total = +P(q).match(/exactly \$?(\d+(?:\.\d+)?)/)[1];
    const want = mk(t.rate, '=', total);
    return only(q, c => { const r = tryRel(c); return !!r && sameRel(r, want); });
  },

  // ---- 7 one-var-equation
  feeRate(q) { return feeChoice(q); },
  groupEq(q) {
    const p = P(q), ns = nums(p);
    const v = (q.choices ?? []).map(c => norm(c).match(/[A-Za-z]/)?.[0]).find(Boolean);
    const [groups, extra, total] = ns;
    const want = { f: addL(scaleL(L({ [v]: 1 }, extra), groups), L({}, total), -1), op: '=' };
    if (!/exactly/.test(p)) return undefined;
    return only(q, c => { const r = tryRel(c); return !!r && sameRel(r, want); });
  },

  // ---- 8 one-var-inequality
  rateIneq(q) {
    const p = P(q), ns = nums(p);
    const v = (q.choices ?? []).map(c => norm(c).match(/[A-Za-z]/)?.[0]).find(Boolean);
    const [rate, bound] = ns, op = phraseOp(p.replace(/^.*?\.(?= )/, ''));   // the bound phrase comes after the rate
    const want = mk({ [v]: rate }, op, bound);
    return only(q, c => { const r = tryRel(c); return !!r && sameRel(r, want); });
  },
  feeIneq(q) { return feeChoice(q); },

  // ---- 9 two-var-resource
  budget2(q) { return twoChoice(q); },
  total2(q) { return twoChoice(q); },

  // ---- 10 two-var-comparison
  timesAsMany(q) {
    const p = P(q), d = defs(p), letterOf = noun => d.find(x => x.words === noun)?.v;
    let m, want;
    if ((m = p.match(/There are (\d+) times as many ([a-z ]+?) as ([a-z ]+?)\./))) want = mk({ [letterOf(m[2])]: 1, [letterOf(m[3])]: -+m[1] }, '=', 0);
    else if ((m = p.match(/For every one of the ([a-z ]+?) there are (\d+) ([a-z ]+?)\./))) want = mk({ [letterOf(m[3])]: 1, [letterOf(m[1])]: -+m[2] }, '=', 0);
    else if ((m = p.match(/There are (\d+) more ([a-z ]+?) than ([a-z ]+?)\./))) want = mk({ [letterOf(m[2])]: 1, [letterOf(m[3])]: -1 }, '=', +m[1]);
    else return undefined;
    return only(q, c => { const r = tryRel(c); return !!r && sameRel(r, want); });
  },
  atLeastTwice(q) {
    const p = P(q);
    const m = p.match(/must have (at least|no more than) (twice|\d+ times) as many ([a-z ]+?) as ([a-z ]+?)\. With ([A-Za-z]) and ([A-Za-z]) the numbers of each/);
    const k = m[2] === 'twice' ? 2 : parseInt(m[2], 10);
    const want = mk({ [m[5]]: 1, [m[6]]: -k }, phraseOp(m[1]), 0);
    return only(q, c => { const r = tryRel(c); return !!r && sameRel(r, want); });
  },
  compareCheck(q) {
    const p = P(q), m = p.match(/There are (\d+) times as many .+? if there are (\d+) /);
    return +m[1] * +m[2];
  },

  // ---- 11 implicit-bounds
  unstatedBound(q) {
    const s = situation(P(q)), v = P(q).match(/^([A-Za-z]) is /)[1];
    return only(q, c => {
      if (/^No sign bound/.test(c)) return s.kind === 'all';
      if (/^No bound/.test(c)) return s.kind === 'all';
      let r; try { r = rangeOf(c, v); } catch { return false; }
      return sameSet(r, s);
    });
  },
  boundCandidate(q) {
    const p = P(q), m = p.match(/Can ([A-Za-z]) = (−?-?\d+(?:\.\d+)?) happen\?/);
    const val = Number(norm(m[2])), s = situation(p);
    const ok = s.kind === 'all' || ((val > s.lo || (s.loC && val === s.lo)) && (val < s.hi || (s.hiC && val === s.hi)));
    return only(q, c => (ok ? /^Yes/.test(c) : /^No/.test(c)) && reasonOk(c, val, s));
  },

  // ---- 12 discrete-vs-continuous
  discreteOrNot(q) {
    const d = discrete(P(q));
    if (d === undefined) return undefined;
    return only(q, c => (d ? /^Separated values/.test(c) : /^Any value in a range/.test(c)));
  },
  fracValue(q) {
    const p = P(q), d = discrete(p);
    const m = p.match(/allows ([A-Za-z]) ≤ (\d+(?:\.\d+)?)\. Is [A-Za-z] = (\d+(?:\.\d+)?) a sensible value\?/);
    if (d === undefined || !m) return undefined;
    const max = +m[2], v = +m[3];
    const ok = v >= 0 && v <= max && (!d || isWhole(v));
    return only(q, c => {
      if (/^Yes: (\d+(?:\.\d+)?) is in the range and a part makes sense$/.test(c)) return ok && !d;
      if (/^No: variables are whole numbers$/.test(c)) return false;            // not every variable is
      if (/^No: (people|tickets) come whole$|^No: you can’t rent part of a bus$/.test(c)) return !ok && d && !isWhole(v);
      return false;
    });
  },

  // ---- 13 assemble-system
  systemPick(q) {
    const model = planModel(q);
    if (!model) return undefined;
    const need = fullClauses(model);
    return only(q, c => {
      const have = c.split(';').map(x => clause(x));
      if (have.some(x => !x)) return false;
      return have.length === need.length && need.every(n => have.some(h => sameClause(n, h))) && have.every(h => need.some(n => sameClause(n, h)));
    });
  },
  missingCon(q) {
    const model = planModel(q);
    if (!model) return undefined;
    const given = P(q).match(/A model reads: (.+?)\. Which condition/)[1].split(';').map(x => clause(x));
    const missing = fullClauses(model).filter(n => !given.some(h => sameClause(n, h)));
    if (missing.length === 0) return only(q, c => /^Nothing/.test(c));
    if (missing.length > 1) return -1;
    return only(q, c => !/^Nothing/.test(c) && sameClause(clause(c), missing[0]));
  },

  // ---- 14 viability-of-candidates
  viablePair(q) {
    const model = planModel(q), pr = pairIn(P(q).split('Is the plan')[1]);
    if (!model) return undefined;
    const vals = { [model.vars[0]]: pr[0], [model.vars[1]]: pr[1] }, br = breaks(model, vals);
    const hits = viableClaims(q, model, vals, br);
    return hits.length === 1 ? hits[0] : -1;
  },
  whichViable(q) {
    const model = planModel(q);
    if (!model) return undefined;
    return only(q, c => { const pr = pairIn(c); return !!pr && breaks(model, { [model.vars[0]]: pr[0], [model.vars[1]]: pr[1] }).length === 0; });
  },

  // ---- 15 bound-rounding
  busRound(q) {
    const p = P(q);
    let m = p.match(/Each bus seats (\d+) students and (\d+) students are going/);
    if (m) return Math.ceil(+m[2] / +m[1] - EPS);
    m = p.match(/Tickets cost \$(\d+(?:\.\d+)?) and you have \$(\d+(?:\.\d+)?)/);
    if (m) return Math.floor(+m[2] / +m[1] + EPS);
    return undefined;
  },
  intEnd(q) {
    const m = P(q).match(/n is a whole number with (n [<>≤≥] \d+)\. What is the (GREATEST|LEAST) value/);
    const r = rel(m[1]);
    const ok = []; for (let n = 0; n <= 1000; n++) if (relHolds(r, { n })) ok.push(n);
    if (!ok.length) return undefined;
    return m[2] === 'GREATEST' ? (ok[ok.length - 1] === 1000 ? undefined : ok[ok.length - 1]) : ok[0];
  },
  solveRound(q) {
    const p = P(q);
    let m = p.match(/charges \$(\d+(?:\.\d+)?) to join plus \$(\d+(?:\.\d+)?) per class\. Maya can spend at most \$(\d+(?:\.\d+)?)/);
    if (m) return Math.floor((+m[3] - +m[1]) / +m[2] + EPS);
    m = p.match(/has \$(\d+(?:\.\d+)?) saved and adds \$(\d+(?:\.\d+)?) a week\. He needs at least \$(\d+(?:\.\d+)?)/);
    if (m) return Math.max(0, Math.ceil((+m[3] - +m[1]) / +m[2] - EPS));
    return undefined;
  },

  // ---- 16 represent-allowed-values
  pickRep(q) {
    const p = P(q);
    const m = p.match(/at \$(\d+(?:\.\d+)?) (?:each|a gallon), with \$(\d+(?:\.\d+)?) to spend/);
    const price = +m[1], money = +m[2], max = money / price, d = discrete(p);
    if (d === undefined) return undefined;
    return only(q, c => {
      let k;
      if ((k = c.match(/^A solid segment from (\d+) to (\d+)\/(\d+), both ends closed$/))) return !d && +k[1] === 0 && near(+k[2] / +k[3], max);
      if (/^An arrow/.test(c)) return false;                                     // a count or an amount is never negative
      const l = listOf(c);
      return !!l && d && sameSet(l, { kind: 'list', vs: wholeList(0, max) });
    });
  },
  notation(q) {
    const p = P(q);
    let want;
    let m = p.match(/Tickets cost \$(\d+(?:\.\d+)?); you have \$(\d+(?:\.\d+)?)/);
    if (m) want = { lo: 0, loC: true, hi: Math.floor(+m[2] / +m[1] + EPS), hiC: true };
    else if ((m = p.match(/needs at least (\d+) tickets sold/))) want = { lo: +m[1], loC: true, hi: Infinity, hiC: false };
    else return undefined;
    return only(q, c => {
      const whole = /, n a whole number$/.test(c);
      if (!whole) return false;                                                  // tickets come whole
      let r; try { r = rangeOf(c.replace(/, n a whole number$/, ''), 'n'); } catch { return false; }
      // as whole numbers: "n ≤ 3" alone also allows negatives, "0 < n" drops 0
      return sameSet(r, { kind: 'range', ...want });
    });
  },
  pairRange(q) {
    const t = twoRates(q), p = P(q);
    const bud = +p.match(/spend at most \$(\d+(?:\.\d+)?)/)[1], pr = pairIn(p.split('Is the pair')[1]);
    const vals = { [t.vars[0]]: pr[0], [t.vars[1]]: pr[1] };
    const cost = t.rate[t.vars[0]] * pr[0] + t.rate[t.vars[1]] * pr[1], ok = cost <= bud + EPS;
    return only(q, c => {
      let k;
      if ((k = c.match(/^No: (\d+(?:\.\d+)?)\((\d+(?:\.\d+)?)\) \+ (\d+(?:\.\d+)?)\((\d+(?:\.\d+)?)\) = (\d+(?:\.\d+)?), more than (\d+(?:\.\d+)?)\./)))
        return !ok && termsMatch([[+k[1], +k[2]], [+k[3], +k[4]]], t.vars.map(v => [t.rate[v], vals[v]])) && near(+k[5], cost) && +k[6] === bud;
      return false;                                                              // the "Yes" reasons ignore the shared budget
    });
  },

  // ---- 17 empty-feasible-set
  noOption(q) {
    const m = P(q).match(/: ([A-Za-z] ≥ \d+) and ([A-Za-z] ≤ \d+)\. What can/);
    const a = rel(m[1]), b = rel(m[2]), v = Object.keys(a.f.c)[0];
    const any = wholeList(0, 1000).some(n => relHolds(a, { [v]: n }) && relHolds(b, { [v]: n }));
    return only(q, c => {
      if (/^No value works/.test(c)) return !any;
      const k = c.match(/^([A-Za-z]) = (\d+)/);
      return !!k && relHolds(a, { [v]: +k[2] }) && relHolds(b, { [v]: +k[2] });
    });
  },
  betweenInt(q) {
    const m = P(q).match(/: (\d+) ≤ (\d+)g ≤ (\d+), g a whole number/);
    const lo = +m[1], k = +m[2], hi = +m[3];
    const ok = g => isWhole(g) && g >= 0 && k * g >= lo - EPS && k * g <= hi + EPS;
    const any = wholeList(0, 1000).some(ok);
    return only(q, c => {
      if (/^No whole number works$/.test(c)) return !any;
      const t = c.match(/^g = (\d+(?:\.\d+)?)$/);
      return !!t && ok(+t[1]);
    });
  },

  // ---- 18 model-assumption
  blocks(q) {
    const p = P(q);
    const m = p.match(/costs \$(\d+(?:\.\d+)?) plus \$(\d+(?:\.\d+)?) per hour; you have \$(\d+(?:\.\d+)?)/);
    const max = (+m[3] - +m[1]) / +m[2];
    let want;
    if (/any part of an hour/.test(p)) want = { kind: 'range', lo: 0, loC: true, hi: max, hiC: true };
    else if (/whole hours/.test(p)) want = { kind: 'list', vs: wholeList(0, max) };
    else if (/quarter-hour blocks/.test(p)) { const vs = []; for (let i = 0; i / 4 <= max + EPS; i++) vs.push(i / 4); want = { kind: 'list', vs }; }
    else return undefined;
    return only(q, c => {
      const k = c.match(/^Any value from (\d+(?:\.\d+)?) to (\d+(?:\.\d+)?)$/);
      if (k) return sameSet({ kind: 'range', lo: +k[1], loC: true, hi: +k[2], hiC: true }, { ...want, hi: want.hi === undefined ? undefined : round6(want.hi) });
      return sameSet(listOf(c), want);
    });
  },
  packs(q) {
    const m = P(q).match(/at least (\d+) .+? packs of (\d+)/);
    return Math.ceil(+m[1] / +m[2] - EPS) * +m[2];
  },
};
const round6 = v => Math.round(v * 1e6) / 1e6;

// ---------------------------------------------------------------- shared family pieces
/** the pairs a·x written in a check match the story's (rate, value) pairs, in either order */
function termsMatch(written, story) {
  const key = ([a, b]) => `${a}|${b}`;
  const w = written.map(key).sort().join(';'), s = story.map(key).sort().join(';');
  return w === s;
}
/** pairTest: a check is right when it works out the WHOLE left side, every claim in it is true, and the conclusion fits */
function checkClaim(c, left, ok, r, vals) {
  const m = c.match(/^(.+?) = (-?\d+(?:\.\d+)?), (and|but) (.+?): \((-?\d+(?:\.\d+)?), (-?\d+(?:\.\d+)?)\) (satisfies it|does not satisfy it)$/);
  if (!m) return false;
  let worked; try { worked = lin(m[1]); } catch { return false; }
  if (!isConst(worked) || !near(worked.k, left) || !near(+m[2], left)) return false;
  // the worked expression must use every term of the rule (a lucky number is not a check)
  const termsUsed = (m[1].match(/\(/g) ?? []).length;
  if (termsUsed !== Object.keys(r.f.c).length) return false;
  let claim = m[4], truth;
  let k;
  if ((k = claim.match(/^(.+) is (true|false)$/))) { const cr = tryRel(k[1]); if (!cr) return false; if (holds(cr.op, cr.f.k) !== (k[2] === 'true')) return false; }
  else if ((k = claim.match(/^(-?\d+(?:\.\d+)?) is not less than (-?\d+(?:\.\d+)?)$/))) { if (+k[1] < +k[2]) return false; }
  else { const cr = tryRel(claim); if (!cr || !holds(cr.op, cr.f.k)) return false; }
  return (m[7] === 'satisfies it') === ok;
}
/** feeRate / feeIneq: fee + rate·x op total (the extra number in the story is not part of the bill) */
function feeChoice(q) {
  const p = P(q);
  const money = [...p.matchAll(/\$(\d+(?:\.\d+)?)/g)].map(m => +m[1]);
  const v = p.match(/for ([A-Za-z]) (hours|miles|GB)\b/)?.[1];
  if (money.length !== 3 || !v) return undefined;
  const last = p.match(/The (?:bill|fare|rental) is (.+?) \$/)[1];
  const op = phraseOp(last);
  const want = mk({ [v]: money[1] }, op, money[2] - money[0]);
  return only(q, c => { const r = tryRel(c); return !!r && sameRel(r, want); });
}
/** budget2 / total2: rate·x + rate·y op bound, each rate on its own item's letter */
function twoChoice(q) {
  const t = twoRates(q);
  if (!t) return undefined;
  const op = phraseOp(t.rest), bound = nums(t.rest)[0];
  const want = mk(t.rate, op, bound);
  return only(q, c => { const r = tryRel(c); return !!r && sameRel(r, want); });
}
/** the allowed set of a quantity nobody bounded */
function situation(p) {
  let m;
  if (/side length/.test(p)) return { kind: 'range', lo: 0, loC: false, hi: Infinity, hiC: false };
  if (/number of hours .* works/.test(p)) return { kind: 'range', lo: 0, loC: true, hi: Infinity, hiC: false };
  if (/number of minutes .* phone call/.test(p)) return { kind: 'range', lo: 0, loC: true, hi: Infinity, hiC: false };
  if (/percentage of seats filled/.test(p)) return { kind: 'range', lo: 0, loC: true, hi: 100, hiC: true };
  if ((m = p.match(/number of riders on a (\d+)-seat bus/))) return { kind: 'range', lo: 0, loC: true, hi: +m[1], hiC: true };
  if (/temperature/.test(p)) return { kind: 'all' };
  return null;
}
/** boundCandidate: the reason must be true too */
function reasonOk(c, v, s) {
  if (/^Yes: any number fits a formula$/.test(c)) return false;
  if (/^Yes: it is a typical value$/.test(c)) return v > 0;
  if (/^Yes: zero is possible here$/.test(c)) return v === 0;
  if (/^Yes: temperatures can be negative$/.test(c)) return s.kind === 'all' && v < 0;
  if (/^No: real quantities must be positive$/.test(c)) return false;          // not true in general (0 hours, −5 °F)
  if (/^No: a negative value makes no sense here$/.test(c)) return v < 0 && s.kind !== 'all';
  const k = c.match(/^No: a length of (\d+) is no tile$/);
  if (k) return +k[1] === v && v === 0;
  const h = c.match(/^No: there is a largest value, (\d+)$/);
  if (h) return s.kind === 'range' && +h[1] === s.hi && v > s.hi;
  return false;
}
/** viablePair: every choice whose claim is true */
function viableClaims(q, model, vals, br) {
  const out = [];
  (q.choices ?? []).forEach((raw, i) => {
    const c = norm(raw);
    let k;
    if (/^Viable: it meets every condition$/.test(c)) { if (br.length === 0) out.push(i); return; }
    if ((k = c.match(/^Not viable: it breaks “(.+)”$/))) {
      const r = model.rules.find(x => x.words === k[1]);
      if (r && br.includes(r.key)) out.push(i);
      return;
    }
    if ((k = c.match(/^Not viable: (-?\d+(?:\.\d+)?) ([a-z ]+) is impossible$/))) {
      const n = Number(k[1]), j = model.nouns.findIndex(w => k[2].slice(0, 4) === w.slice(0, 4));
      const v = model.vars[j];
      if (v !== undefined && near(vals[v], n) && !wholeOk(n)) out.push(i);
    }
  });
  return out;
}

// ================================================================ solve / sane
export function solve(q) {
  const f = SOLVE[q.family];
  if (!f) return undefined;
  const r = f(q);
  return r === -1 ? undefined : r;
}

/** can whole numbers (not negative) of the two items make exactly this total? */
function reachable(t, total) {
  const [x, y] = t.vars, a = t.rate[x], b = t.rate[y];
  for (let i = 0; i * a <= total + EPS; i++) { const r = (total - i * a) / b; if (r >= -EPS && isWhole(r)) return true; }
  return false;
}
const money = p => [...String(p).matchAll(/\$(\d+(?:\.\d+)?)/g)].map(m => +m[1]);
export function sane(q) {
  const p = P(q), fam = q.family;
  try {
    // the answer must be one choice: none or two right choices is unfair
    if (q.input === 'choice' && SOLVE[fam]) {
      const r = SOLVE[fam](q);
      if (r === -1) return 'no single right choice (none or several choices are true)';
    }
    switch (fam) {
      case 'eqTest': case 'eqMeaning': {
        const r = rel(p.match(/(?:condition is|equation) (.+?)(?:\. Which| say\?)/)[1]), v = Object.keys(r.f.c)[0];
        const x = -r.f.k / r.f.c[v];
        if (!(x > 0 && isWhole(x))) return `the count ${v} = ${x} is not a positive whole number`;
        const ns = nums(p);
        if (/shovel|bags/.test(p) && ns[0] > 80) return 'a bag of soil that heavy';
        break;
      }
      case 'allowedSet': case 'boundaryCand': {
        const r = rel(p.match(/the condition is (.+?)\. (?:Which|Is)/i)[1]);
        const story = phraseOp(p.split(/With|The condition/)[0]);
        if (story && story !== r.op) return `the story says ${SYM[story]} but the condition uses ${SYM[r.op]}`;
        break;
      }
      case 'pairTest': case 'pairValue': {
        const t = twoRates(q), r = rel(p.match(/the rule is (.+?)(?:\. Which| \()/i)[1]);
        const bound = nums(t.rest)[0];
        if (!sameRel(r, mk(t.rate, '<=', bound))) return 'the rule does not match the story';
        break;
      }
      case 'bothValue': {
        const m = p.match(/at least (\d+) [a-z]+\. .*?\$(\d+(?:\.\d+)?).*?\$(\d+(?:\.\d+)?)\. With/);
        const a = rel(p.match(/: (.+?) and/)[1]), b = rel(p.match(/ and ([^.]+?)\. Which/)[1]);
        if (!sameRel(a, mk({ n: 1 }, '>=', +m[1])) || !sameRel(b, mk({ n: +m[2] }, '<=', +m[3]))) return 'the conditions do not match the story';
        break;
      }
      case 'pairBoth': {
        const m = p.match(/at most (\d+) trays.*?earns \$(\d+(?:\.\d+)?) and a tray of muffins \$(\d+(?:\.\d+)?)\. The goal is to earn at least \$(\d+(?:\.\d+)?)\./);
        const a = rel(p.match(/: (c \+ m ≤ \d+) and/)[1]), b = rel(p.match(/ and (\d+c \+ \d+m ≥ \d+)\./)[1]);
        if (!sameRel(a, mk({ c: 1, m: 1 }, '<=', +m[1])) || !sameRel(b, mk({ c: +m[2], m: +m[3] }, '>=', +m[4]))) return 'the rules do not match the story';
        break;
      }
      case 'unitCheck': {
        const t = twoRates(q), up = nums(t.rest)[0], total = nums(t.rest)[1];
        if (total > up) return `the total ${total} is more than the limit ${up}`;
        if (!reachable(t, total)) return `no whole numbers of the two items make exactly ${total}`;
        break;
      }
      case 'total2': {
        const t = twoRates(q);
        if (phraseOp(t.rest) === '=' && !reachable(t, nums(t.rest)[0])) return `no whole numbers of the two items make exactly ${nums(t.rest)[0]}`;
        break;
      }
      case 'feeRate': case 'feeIneq': {
        const m = money(p);
        if (m[2] <= m[0]) return 'the total is not more than the fixed fee';
        if (fam === 'feeRate') { const x = (m[2] - m[0]) / m[1]; if (!(x > 0)) return 'no positive amount fits'; }
        break;
      }
      case 'groupEq': {
        const [g, e, t] = nums(p), x = t / g - e;
        if (!(x > 0) || !isWhole(x * 100)) return `the unknown is ${x}, not a sensible ${/books/.test(p) ? 'count' : 'price'}`;
        if (/books/.test(p) && !isWhole(x)) return `${x} books on a shelf`;
        break;
      }
      case 'compareCheck': {
        const m = p.match(/There are (\d+) times as many (.+?) as (.+?), so ([A-Za-z]) = (\d+)([A-Za-z])\./);
        if (!m || +m[1] !== +m[5]) return 'the equation does not match the sentence';
        break;
      }
      case 'busRound': {
        const r = rel(p.match(/: (.+?)\. What/)[1]);
        let m = p.match(/Each bus seats (\d+) students and (\d+) students/);
        if (m && !sameRel(r, mk({ b: +m[1] }, '>=', +m[2]))) return 'the inequality does not match the story';
        if (m && +m[2] % +m[1] === 0) return 'the buses come out exactly: nothing to round';
        m = p.match(/Tickets cost \$(\d+(?:\.\d+)?) and you have \$(\d+(?:\.\d+)?)/);
        if (m && !sameRel(r, mk({ n: +m[1] }, '<=', +m[2]))) return 'the inequality does not match the story';
        break;
      }
      case 'solveRound': {
        const r = rel(p.match(/: (.+?)\. What/)[1]);
        let m = p.match(/charges \$(\d+(?:\.\d+)?) to join plus \$(\d+(?:\.\d+)?) per class\. Maya can spend at most \$(\d+(?:\.\d+)?)/);
        if (m && !sameRel(r, mk({ c: +m[2] }, '<=', +m[3] - +m[1]))) return 'the inequality does not match the story';
        if (m && +m[3] < +m[1]) return 'Maya cannot even pay the joining fee';
        m = p.match(/has \$(\d+(?:\.\d+)?) saved and adds \$(\d+(?:\.\d+)?) a week\. He needs at least \$(\d+(?:\.\d+)?)/);
        if (m && !sameRel(r, mk({ w: +m[2] }, '>=', +m[3] - +m[1]))) return 'the inequality does not match the story';
        if (m && +m[3] <= +m[1]) return 'Sam already has enough';
        break;
      }
      case 'intEnd': {
        if (SOLVE.intEnd(q) === undefined) return 'no whole number fits';
        break;
      }
      case 'blocks': {
        const m = p.match(/costs \$(\d+(?:\.\d+)?) plus \$(\d+(?:\.\d+)?) per hour; you have \$(\d+(?:\.\d+)?): .+?, so h ≤ (\d+(?:\.\d+)?)\./);
        const max = (+m[3] - +m[1]) / +m[2];
        if (!near(max, +m[4])) return `the budget gives h ≤ ${round6(max)}, not ${m[4]}`;
        break;
      }
      case 'packs': {
        const m = p.match(/at least (\d+) .+? the least you can buy is (\d+)\. .+? packs of (\d+) \(p packs, (\d+)p ≥ (\d+)\)/);
        if (!m || +m[1] !== +m[2] || +m[3] !== +m[4] || +m[1] !== +m[5]) return 'the numbers in the story disagree';
        if (+m[1] % +m[3] === 0) return 'the packs come out exactly: the assumption changes nothing';
        break;
      }
      case 'fracValue': {
        const m = p.match(/allows [A-Za-z] ≤ (\d+(?:\.\d+)?)\. Is [A-Za-z] = (\d+(?:\.\d+)?)/);
        if (m && +m[2] > +m[1]) return 'the value is outside the range, and the choices do not say so';
        if (m && isWhole(+m[2])) return 'a whole value: the question is about parts';
        break;
      }
      case 'viablePair': case 'whichViable': case 'systemPick': case 'missingCon': {
        const model = planModel(q);
        if (!model) return 'the story could not be read';
        // a plan story should have at least one viable plan, or the item teaches a dead end
        const [x, y] = model.vars;
        let any = false;
        for (let a = 0; a <= 40 && !any; a++) for (let b = 0; b <= 40 && !any; b++) if (breaks(model, { [x]: a, [y]: b }).length === 0) any = true;
        if (!any) return 'no plan meets every condition';
        break;
      }
      case 'pairRange': {
        const t = twoRates(q), bud = +p.match(/spend at most \$(\d+(?:\.\d+)?)/)[1];
        const m = p.match(/On its own, ([A-Za-z]) can be at most (\d+) and ([A-Za-z]) at most (\d+)\./);
        const own = v => Math.floor(bud / t.rate[v] + EPS);
        if (own(m[1]) !== +m[2] || own(m[3]) !== +m[4]) return 'the separate maximums are wrong';
        break;
      }
      case 'betweenInt': case 'noOption': break;
      default: break;
    }
    // prices a teenager would meet
    if (/tickets? cost|each/.test(p) && fam !== 'pairBoth') for (const v of money(p)) if (v === 0) return 'a price of $0';
  } catch (e) {
    return `could not read the item (${e.message})`;
  }
  return '';
}

export default { solve, sane };
