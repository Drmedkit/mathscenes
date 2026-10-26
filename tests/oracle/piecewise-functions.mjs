// Oracle for the lesson "piecewise-functions" (Algebra 1, secondary-t7-12: piecewise and step functions, function
// notation, breakpoint ownership, open / filled dots, step functions, the greatest integer function, tiered prices,
// count vs measure domains, coverage and overlap audits, curved pieces).
// Written from what the student sees only (docs/lessons/QUALITY_LAYER.md, "O: the oracle"): the prompt, the board (a
// `cases` rule is parsed into expressions and conditions), the choices and the drawn graph(s). The picture is
// `data.picture.g` (one plane: pieces with lo / hi and their end markers 'open' / 'closed' / 'none', points, vertical
// segs) or `data.picture.opts` (graphs A-C). `reveal` is answer-side and never read (the view drops it anyway).
// Graph questions are judged by comparing what each graph draws with the rule, input by input (a seg is a vertical
// connector, never part of a function; an end with no marker is unknown: it may or may not hold the point). Choices are
// judged by the maths of their claims; a choice question returns -1 when not exactly one choice is right.
// Students are 14-18: `sane` judges the worlds (prices, tiers, times, domains) and flags two-right-answer items.
import { texPlain, choiceWhere, nums } from '../../tools/quality/oracle-kit.mjs';

// ---------------------------------------------------------------- numbers and text
const norm = s => String(s ?? '').replace(/[−–]/g, '-');
const N = s => Number(norm(s).replace(/[$,\s]/g, ''));
const NUM = '-?\\$?\\d+(?:\\.\\d+)?';
const near = (a, b) => Math.abs(a - b) <= 1e-7 * Math.max(1, Math.abs(a), Math.abs(b));
const clean = v => (Number.isFinite(v) ? Math.round(v * 1e9) / 1e9 + 0 : v);
const has = (arr, v) => arr.some(w => near(w, v));
const uniq = arr => arr.reduce((o, v) => (has(o, v) ? o : [...o, v]), []);
const sameSet = (a, b) => uniq(a).length === uniq(b).length && uniq(a).every(v => has(b, v));
const plainTex = t => texPlain(String(t).replace(/\\\$/g, '$'));
/** "(4, −3)" → [4, -3], every pair in a text */
const pairsIn = t => [...norm(t).matchAll(new RegExp(`\\((${NUM}), (${NUM})\\)`, 'g'))].map(m => [N(m[1]), N(m[2])]);

// ---------------------------------------------------------------- expressions: one variable, + − × ÷ ^ ( ), implicit ×
// a/b between two plain numbers is one number (the lesson writes (1/2)x as 1/2x)
function compile(src) {
  const s = norm(src).replace(/[×·]/g, '*').replace(/\$/g, '').replace(/\s+/g, '');
  const T = [];
  for (let i = 0; i < s.length;) {
    const r = s.slice(i);
    let m;
    if ((m = r.match(/^(\d+(?:\.\d+)?)\/(\d+(?:\.\d+)?)/))) { T.push({ n: Number(m[1]) / Number(m[2]) }); i += m[0].length; continue; }
    if ((m = r.match(/^\d+(?:\.\d+)?|^\.\d+/))) { T.push({ n: Number(m[0]) }); i += m[0].length; continue; }
    if (/[A-Za-z]/.test(r[0])) { T.push({ v: true }); i++; continue; }
    if ('+-*/^()'.includes(r[0])) { T.push({ o: r[0] }); i++; continue; }
    return null;
  }
  if (!T.length) return null;
  let i = 0;
  const eat = o => (T[i]?.o === o ? (i++, true) : false);
  const startsAtom = t => t && (t.n !== undefined || t.v || t.o === '(');
  function expr() {
    let a = term();
    for (;;) {
      if (eat('+')) { const l = a, r = term(); a = x => l(x) + r(x); }
      else if (eat('-')) { const l = a, r = term(); a = x => l(x) - r(x); }
      else return a;
    }
  }
  function term() {
    let a = unary();
    for (;;) {
      if (eat('*')) { const l = a, r = unary(); a = x => l(x) * r(x); }
      else if (eat('/')) { const l = a, r = unary(); a = x => l(x) / r(x); }
      else if (startsAtom(T[i])) { const l = a, r = power(); a = x => l(x) * r(x); }
      else return a;
    }
  }
  function unary() {
    if (eat('-')) { const r = unary(); return x => -r(x); }
    if (eat('+')) return unary();
    return power();
  }
  function power() {
    const b = atom();
    if (eat('^')) { const e = unary(); return x => b(x) ** e(x); }
    return b;
  }
  function atom() {
    const t = T[i++];
    if (!t) throw new Error('end');
    if (t.n !== undefined) return () => t.n;
    if (t.v) return x => x;
    if (t.o === '(') { const a = expr(); if (!eat(')')) throw new Error('no )'); return a; }
    throw new Error('unexpected ' + JSON.stringify(t));
  }
  try { const f = expr(); return i === T.length ? f : null; } catch { return null; }
}
const evalText = s => { const f = compile(s); if (!f) throw new Error(`cannot read "${s}"`); return clean(f(0)); };

// ---------------------------------------------------------------- conditions
/** "−3 ≤ x < 2", "x > 4", "x = 2", "x ≠ 1" → { v, lo, loIn, hi, hiIn } / { ne } (null bounds = unbounded) */
function parseCond(s) {
  const t = norm(s).replace(/\$/g, '').replace(/\s+/g, ' ').trim();
  let m = t.match(new RegExp(`^(${NUM}) ?(<|≤) ?([A-Za-z]) ?(<|≤) ?(${NUM})$`));
  if (m) return { v: m[3], lo: N(m[1]), loIn: m[2] === '≤', hi: N(m[5]), hiIn: m[4] === '≤' };
  m = t.match(new RegExp(`^([A-Za-z]) ?(<|≤|>|≥|=|≠) ?(${NUM})$`));
  if (!m) return null;
  const a = N(m[3]), v = m[1];
  switch (m[2]) {
    case '<': return { v, lo: null, hi: a, hiIn: false };
    case '≤': return { v, lo: null, hi: a, hiIn: true };
    case '>': return { v, lo: a, loIn: false, hi: null };
    case '≥': return { v, lo: a, loIn: true, hi: null };
    case '=': return { v, lo: a, loIn: true, hi: a, hiIn: true };
    default: return { v, ne: a };
  }
}
function holds(c, x) {
  if (!c) return false;
  if (c.all) return true;
  if (c.ne !== undefined) return !near(x, c.ne);
  if (c.lo !== null && c.lo !== undefined) { if (near(x, c.lo)) { if (!c.loIn) return false; } else if (x < c.lo) return false; }
  if (c.hi !== null && c.hi !== undefined) { if (near(x, c.hi)) { if (!c.hiIn) return false; } else if (x > c.hi) return false; }
  return true;
}
const condKey = c => (c ? JSON.stringify([c.lo ?? null, c.lo != null ? !!c.loIn : null, c.hi ?? null, c.hi != null ? !!c.hiIn : null, c.ne ?? null]) : 'null');
const sameCond = (a, b) => !!a && !!b && condKey(a) === condKey(b);
const ends = c => (c ? [c.lo, c.hi, c.ne].filter(v => v !== null && v !== undefined) : []);

// ---------------------------------------------------------------- a piecewise rule
/** the `cases` rows of a board: [{ text, f, cond, condText }] (null when there is no cases block) */
function casesOf(board) {
  const m = String(board).match(/\\begin\{cases\}([\s\S]*?)\\end\{cases\}/);
  if (!m) return null;
  return m[1].split(/\\\\/).map(row => {
    const [e, c] = row.split('&');
    const text = plainTex(e).replace(/,\s*$/, '').trim(), condText = plainTex(c ?? '').trim();
    return { text, f: compile(text), cond: parseCond(condText), condText };
  });
}
/** "3x − 1 if x < 1; x + 1 if x ≥ 1" → the same shape */
function rowsOfText(s) {
  return norm(s).split(/;\s*/).map(part => {
    const m = part.match(/^(.*?) (?:if|for) (.*)$/);
    if (!m) return null;
    return { text: m[1].trim(), f: compile(m[1]), cond: parseCond(m[2]), condText: m[2] };
  });
}
/** every output the rule gives at x (distinct) */
const outs = (P, x) => uniq(P.filter(p => holds(p.cond, x)).map(p => clean(p.f(x))));
const breaks = P => uniq(P.flatMap(p => ends(p.cond)));
/** test inputs: the breakpoints, the midpoints between them and points far out */
function testXs(crit, extra = []) {
  const c = uniq([...crit, ...extra]).sort((a, b) => a - b);
  if (!c.length) return [-5, 0, 5];
  const xs = [c[0] - 7.3, c[c.length - 1] + 7.3, ...c];
  for (let i = 1; i < c.length; i++) xs.push((c[i - 1] + c[i]) / 2);
  return xs;
}
/** no input gets two different outputs */
const isFn = P => testXs(breaks(P)).every(x => outs(P, x).length <= 1);
/** no input meets two conditions */
const noOverlap = P => testXs(breaks(P)).every(x => P.filter(p => holds(p.cond, x)).length <= 1);
const constant = p => near(p.f(0), p.f(1)) && near(p.f(0), p.f(-2.7)) && near(p.f(0), p.f(3.9));

// ---------------------------------------------------------------- solving f(x) = c on a piece
function polyCoef(f) {
  const y0 = f(0), y1 = f(1), y2 = f(2);
  if (![y0, y1, y2].every(Number.isFinite)) return null;
  const a = (y2 - 2 * y1 + y0) / 2, b = y1 - y0 - a, c = y0;
  const ok = [3.7, -2.3, 5.1].every(x => near(f(x), a * x * x + b * x + c));
  return ok ? [a, b, c] : null;
}
function rootsOn(p, c) {
  const g = x => p.f(x) - c;
  const pc = polyCoef(p.f);
  let cand = [];
  if (pc) {
    let [a, b, k] = pc;
    k -= c;
    if (Math.abs(a) < 1e-12) {
      if (Math.abs(b) < 1e-12) { if (Math.abs(k) < 1e-12) { const lo = p.cond?.lo ?? null, hi = p.cond?.hi ?? null; return [lo, hi, lo !== null && hi !== null ? (lo + hi) / 2 : null, lo !== null ? lo + 1 : null, hi !== null ? hi - 1 : null, 0].filter(x => x !== null && holds(p.cond, x)).slice(0, 1); } }
      else cand = [-k / b];
    } else {
      const D = b * b - 4 * a * k;
      if (D > -1e-12) { const s = Math.sqrt(Math.max(0, D)); cand = [(-b - s) / (2 * a), (-b + s) / (2 * a)]; }
    }
  } else {
    const c0 = p.cond ?? {};
    const L = c0.lo ?? (c0.hi ?? 0) - 300, R = c0.hi ?? (c0.lo ?? 0) + 300;
    const n = 30000;
    let px = L, pv = g(L);
    for (let i = 0; i <= n; i++) {
      const x = L + ((R - L) * i) / n, v = g(x);
      if (v === 0) cand.push(x);
      else if (Number.isFinite(v) && Number.isFinite(pv) && Math.sign(v) * Math.sign(pv) < 0) {
        let a = px, b = x;
        for (let k = 0; k < 200; k++) { const mid = (a + b) / 2, mv = g(mid); if (Math.sign(mv) === Math.sign(g(a))) a = mid; else b = mid; }
        const r = (a + b) / 2;
        if (Math.abs(g(r)) < 1e-6) cand.push(r);
      }
      px = x; pv = v;
    }
    for (const e of ends(p.cond)) if (Number.isFinite(g(e)) && Math.abs(g(e)) < 1e-9) cand.push(e);
  }
  // snap to the ends, keep what the condition holds
  return uniq(cand.map(x => { for (const e of ends(p.cond)) if (Math.abs(x - e) < 1e-7) return e; return clean(x); }).filter(x => holds(p.cond, x)));
}
const solveEq = (P, c) => uniq(P.flatMap(p => rootsOn(p, c)));

// ---------------------------------------------------------------- the drawn graph
const picOf = q => q.data?.picture ?? {};
function fnOf(fn) {
  switch (fn.k) {
    case 'lin': return x => fn.m * x + fn.b;
    case 'quad': return x => fn.a * (x - fn.h) ** 2 + fn.v;
    case 'exp': return x => fn.a * fn.b ** x;
    default: throw new Error(`unknown drawn curve ${fn.k}`);
  }
}
/** what a graph draws above x: def = points surely on it, amb = an end without a marker, seg = a vertical connector */
function graphAt(parts, x) {
  const def = [], amb = [];
  let seg = false;
  for (const p of parts) {
    if (p.kind === 'piece') {
      const f = fnOf(p.fn), lo = p.lo ?? null, hi = p.hi ?? null;
      const [e0, e1] = p.ends ?? ['none', 'none'];
      if (lo !== null && near(x, lo)) { if (e0 === 'closed') def.push(clean(f(x))); else if (e0 === 'none') amb.push(clean(f(x))); continue; }
      if (hi !== null && near(x, hi)) { if (e1 === 'closed') def.push(clean(f(x))); else if (e1 === 'none') amb.push(clean(f(x))); continue; }
      if ((lo === null || x > lo) && (hi === null || x < hi)) def.push(clean(f(x)));
    } else if (p.kind === 'point') {
      if (near(x, p.x) && !p.open) def.push(p.y);
    } else if (p.kind === 'seg') {
      if (near(x, p.a[0]) && near(p.a[0], p.b[0]) && !near(p.a[1], p.b[1])) seg = true;
    }
  }
  return { def: uniq(def), amb: uniq(amb), seg };
}
function graphCrit(parts) {
  return parts.flatMap(p => (p.kind === 'piece' ? [p.lo, p.hi] : p.kind === 'point' ? [p.x] : p.kind === 'seg' ? [p.a[0]] : [])).filter(v => v !== null && v !== undefined);
}
/** does the graph (parts, in window win) draw exactly the relation truth(x) → [y]? */
function drawsTruth(g, truth, crit = [], strict = false) {
  const { min, max } = g.x;
  const xs = testXs([...graphCrit(g.parts), ...crit, min, max]).filter(x => x >= min - 1e-9 && x <= max + 1e-9);
  for (let i = 0; i <= 96; i++) xs.push(min + ((max - min) * i) / 96);
  for (const x of xs) {
    const G = graphAt(g.parts, x), T = truth(x);
    if (G.seg) return false;
    if (T.some(t => !has(G.def, t) && (strict || !has(G.amb, t)))) return false;
    if (G.def.some(d => !has(T, d))) return false;
  }
  return true;
}
const optIndex = (q, ok) => {
  const hits = (picOf(q).opts ?? []).map((g, i) => (ok(g) ? i : -1)).filter(i => i >= 0);
  return hits.length === 1 ? (q.choices ?? []).findIndex(c => c === `Graph ${'ABCD'[hits[0]]}`) : -1;
};
/** the one value the graph shows above x */
function readGraph(g, x) {
  const G = graphAt(g.parts, x);
  if (G.seg) return undefined;
  if (G.def.length === 1) return G.def[0];
  if (!G.def.length && G.amb.length === 1) return G.amb[0];
  return NaN;
}

// ---------------------------------------------------------------- words → conditions
/** the inequality a threshold phrase means ('≤' '≥' '<' '>') */
function phraseOp(t) {
  t = t.toLowerCase();
  if (/up to and including|or less|not over|no more than|at most|or fewer|or younger/.test(t)) return '≤';
  if (/\bor more\b|\bor older\b|\bat least\b|\bor over\b/.test(t)) return '≥';
  if (/under|less than|fewer than|younger than|below/.test(t)) return '<';
  if (/more than|over|above|older than/.test(t)) return '>';
  return null;
}
/** a tier text "over 3 mi, up to and including 10 mi" → a condition */
function tierCond(t) {
  const c = { lo: null, hi: null };
  for (const cl of t.split(/,| but /)) {
    const op = phraseOp(cl), n = nums(cl);
    if (!op || n.length !== 1) return null;
    if (op === '≤' || op === '<') { c.hi = n[0]; c.hiIn = op === '≤'; } else { c.lo = n[0]; c.loIn = op === '≥'; }
  }
  return c;
}
/** a two-price threshold story → { T, tiers: [{ price, cond }] } */
function twoTier(prompt) {
  const first = norm(prompt).split(/\. (?=[A-Z])/)[0];
  let parts = first.split(/, and /);
  if (parts.length !== 2) parts = first.split(/ and (?=[^,]*\d)/);
  if (parts.length !== 2) throw new Error('cannot split the tiers');
  const priceOf = cl => (/\bno fee\b|\bfree\b/.test(cl) ? 0 : (cl.match(/\$(\d+(?:\.\d+)?)/) ? Number(cl.match(/\$(\d+(?:\.\d+)?)/)[1]) : null));
  const prices = parts.map(priceOf);
  const rest = parts.map((cl, i) => { const n = nums(cl); const k = prices[i] ? n.findIndex(v => near(v, prices[i])) : -1; if (k >= 0) n.splice(k, 1); return n; });
  const common = rest[0].filter(v => has(rest[1], v));
  if (common.length !== 1) throw new Error('no single threshold');
  const T = common[0];
  const tiers = parts.map((cl, i) => {
    const after = cl.replace(/\(up to \d+\)/, '');
    const op = phraseOp(after);
    const c = op === '≤' ? { lo: null, hi: T, hiIn: true } : op === '<' ? { lo: null, hi: T, hiIn: false } : op === '≥' ? { lo: T, loIn: true, hi: null } : op === '>' ? { lo: T, loIn: false, hi: null } : null;
    return { price: prices[i], cond: c };
  });
  return { T, tiers };
}
const tierPrice = (tt, v) => { const h = tt.tiers.filter(t => holds(t.cond, v)); return h.length === 1 ? h[0].price : NaN; };

// ---------------------------------------------------------------- time and units
/** "2 hours 5 minutes", "45 seconds", "3.3 miles" → an amount in `unit` ('hour' | 'minute' | other) */
function amountIn(text, unit) {
  let min = 0, other = 0, any = false;
  for (const m of norm(text).matchAll(/(\d+(?:\.\d+)?) (hours?|minutes?|seconds?|[a-z]+)/g)) {
    const v = Number(m[1]);
    any = true;
    if (/^hour/.test(m[2])) min += v * 60;
    else if (/^minute/.test(m[2])) min += v;
    else if (/^second/.test(m[2])) min += v / 60;
    else other += v;
  }
  if (!any) throw new Error(`no amount in "${text}"`);
  if (unit === 'hour') return clean(min / 60);
  if (unit === 'minute') return clean(min);
  return other;
}
const unitOf = t => (t.match(/each (?:completed |full )?(hour|minute|mile|day|ounce)/)?.[1]);

// ---------------------------------------------------------------- the families
function solve(q) {
  q = { ...q, choices: q.choices?.map(norm) };
  const P = casesOf(q.board), p = norm(q.prompt), ch = (q.choices ?? []).map(norm), g = picOf(q).g;
  const fArg = s => [...norm(s).matchAll(/\b[a-zA-Z]\(([^()]+)\)/g)].map(m => m[1]).filter(a => !/^[a-z]$/.test(a));
  switch (q.family) {
    case 'evalOne': {
      const [rule, ask] = q.board.split(/\\qquad/);
      const f = compile(plainTex(rule).replace(/^.*?=/, ''));
      return clean(f(evalText(fArg(plainTex(ask))[0])));
    }
    case 'readPoint': {
      let m = p.match(new RegExp(`^For a function f, f\\((${NUM})\\) = (${NUM})\\.`));
      if (m) {
        const a = N(m[1]), b = N(m[2]);
        return choiceWhere(q, c => {
          const pt = c.match(/^The point (.*) is on the graph of f\.$/);
          if (pt) { const [[x, y]] = pairsIn(pt[1]); return near(x, a) && near(y, b); }
          return false;   // "f gives b for every input", "f times a is b": not what f(a) = b says
        });
      }
      const f = compile(plainTex(q.board).replace(/^.*?=/, ''));
      m = p.match(new RegExp(`f\\((${NUM}) \\+ (${NUM})\\)`));
      const a = N(m[1]), b = N(m[2]), whole = clean(f(a + b)), split = clean(f(a) + f(b));
      return choiceWhere(q, c => {
        const c0 = norm(c);
        let k = c0.match(new RegExp(`^Yes: both are (${NUM})\\.$`));
        if (k) return near(whole, split) && near(whole, N(k[1]));
        k = c0.match(new RegExp(`^No: f\\((${NUM})\\) = (${NUM}), but f\\((${NUM})\\) \\+ f\\((${NUM})\\) = (${NUM})\\.$`));
        if (k) return !near(whole, split) && near(N(k[1]), a + b) && near(N(k[2]), whole) && near(N(k[5]), split);
        if (/can be split over a sum/.test(c0)) return false;
        throw new Error(`readPoint choice "${c}"`);
      });
    }
    case 'whichRule': case 'whichInput': case 'ownerAtBreak': {
      const same = (a, b) => norm(a).replace(/\s+/g, '') === norm(b).replace(/\s+/g, '');
      if (q.family === 'whichInput') {
        const rule = p.match(/the rule (.*)\?$/)[1], piece = P.filter(r => same(r.text, rule));
        if (piece.length !== 1) throw new Error('rule not on the board');
        return choiceWhere(q, c => { const x = N(c.replace(/^x = /, '')); const h = P.filter(r => holds(r.cond, x)); return h.length === 1 && h[0] === piece[0]; });
      }
      const x = q.family === 'whichRule' ? N(p.match(new RegExp(`x = (${NUM})\\?`))[1]) : N(p.match(new RegExp(`^x = (${NUM})`))[1]);
      const h = P.filter(r => holds(r.cond, x));
      return choiceWhere(q, c => {
        if (/^Both rules/.test(c)) return h.length >= 2;
        if (/^Neither/.test(c)) return h.length === 0;
        return h.length === 1 && same(h[0].text, c);
      });
    }
    case 'nearBreak': {
      const xs = p.match(new RegExp(`inputs (${NUM}), (${NUM}) and (${NUM})`)).slice(1, 4).map(N);
      const rule = p.match(/to the rule (.*)\?$/)[1];
      const piece = P.find(r => norm(r.text).replace(/\s/g, '') === norm(rule).replace(/\s/g, ''));
      const sent = xs.filter(x => { const h = P.filter(r => holds(r.cond, x)); return h.length === 1 && h[0] === piece; });
      return choiceWhere(q, c => sameSet(nums(c), sent));
    }
    case 'isFunction': case 'manyToOne': {
      const fn = isFn(P), single = noOverlap(P);
      return choiceWhere(q, c => {
        let m;
        if (/^Yes: each input meets exactly one condition/.test(c)) return single;
        if (/^No: different inputs may share an output/.test(c)) return fn;
        if ((m = c.match(new RegExp(`^No: the pieces meet at x = (${NUM}), so`)))) return outs(P, N(m[1])).length >= 2;
        if (/^No: a function has one formula|^No: the piece .* is constant|^No: its graph breaks|^Yes: each output may come from only one input|^Yes: a constant rule/.test(c)) return false;
        throw new Error(`isFunction choice "${c}"`);
      });
    }
    case 'isStep': {
      const allConst = P.every(constant);
      return choiceWhere(q, c => {
        let m;
        if (/^Yes: every piece is constant/.test(c)) return allConst;
        if ((m = c.match(/^No: the piece (.*) has a slope/))) { const r = P.find(x => norm(x.text).replace(/\s/g, '') === m[1].replace(/\s/g, '')); return !!r && !constant(r); }
        if (/^No: its steps do not rise|^No: the steps are not all the same width|^No: a constant piece is not|^Yes: its graph has jumps|^Yes: it has different rules/.test(c)) return false;
        throw new Error(`isStep choice "${c}"`);
      });
    }
    case 'stepRead': case 'readOpen': return readGraph(g, N(fArg(p)[0]));
    case 'evalPiece': case 'isolatedPoint': case 'nlEval': {
      const o = outs(P, N(fArg(p)[0]));
      return o.length === 1 ? o[0] : NaN;
    }
    case 'evalBoth': {
      const args = fArg(`${q.pair.lead} ${q.pair.op} ${q.pair.tail}`).map(N);
      return args.map(x => { const o = outs(P, x); return o.length === 1 ? o[0] : NaN; });
    }
    case 'evalBreak': {
      const x = N(fArg(p)[0]), o = outs(P, x);
      return choiceWhere(q, c => (/^Undefined/.test(c) ? o.length === 0 : o.length === 1 && near(N(c), o[0])));
    }
    case 'dotFill': case 'fixDot': {
      const a = N(p.match(new RegExp(`x = (${NUM})`))[1]);
      const touch = P.filter(r => ends(r.cond).some(e => near(e, a)) || holds(r.cond, a));
      const ys = uniq(touch.map(r => clean(r.f(a)))), filled = outs(P, a);
      const state = y => (has(filled, y) ? 'filled' : 'open');
      return choiceWhere(q, c => {
        let m;
        if (/^Open at both/.test(c)) return ys.length === 2 && ys.every(y => state(y) === 'open');
        if (/^Filled at both/.test(c)) return ys.length === 2 && ys.every(y => state(y) === 'filled') && sameSet(pairsIn(c).map(t => t[1]), ys);
        if (/^Join the two dots/.test(c)) return false;
        if ((m = c.match(/^(Open|Filled) at (\(.*?\)), (open|filled) at (\(.*?\))$/i))) {
          const [[x1, y1]] = pairsIn(m[2]), [[x2, y2]] = pairsIn(m[4]);
          return near(x1, a) && near(x2, a) && has(ys, y1) && has(ys, y2) && !near(y1, y2) && state(y1) === m[1].toLowerCase() && state(y2) === m[3].toLowerCase();
        }
        throw new Error(`dot choice "${c}"`);
      });
    }
    case 'joinDot': {
      const [[a, y]] = pairsIn(p);
      const owned = has(outs(P, a), y);
      return choiceWhere(q, c => {
        let m;
        if ((m = c.match(/^A filled dot: (.*) includes (.*)$/))) { const cd = parseCond(m[1]); return owned && P.some(r => sameCond(r.cond, cd)) && holds(cd, a); }
        if (/^An open dot/.test(c)) return !owned;
        if (/side by side|^A filled dot: both lines reach it|^Nothing: the two lines just meet/.test(c)) return false;
        throw new Error(`joinDot choice "${c}"`);
      });
    }
    case 'pieceGraph': case 'segEnds': {
      const m = p.match(/x ↦ (.*?) (?:only )?for (.*?)[?.]/);
      const f = compile(m[1]), cd = parseCond(m[2]);
      if (q.family === 'pieceGraph') return optIndex(q, G => drawsTruth(G, x => (holds(cd, x) ? [clean(f(x))] : []), ends(cd)));
      return choiceWhere(q, c => {
        if (/^A whole line/.test(c)) return cd.lo === null && cd.hi === null;
        const k = c.match(/^From an? (filled|open) dot at (\(.*?\)) to an? (filled|open) dot at (\(.*?\))$/);
        if (!k) throw new Error(`segEnds choice "${c}"`);
        const [[x1, y1]] = pairsIn(k[2]), [[x2, y2]] = pairsIn(k[4]);
        return cd.lo !== null && cd.hi !== null && near(x1, cd.lo) && near(y1, f(cd.lo)) && near(x2, cd.hi) && near(y2, f(cd.hi))
          && (k[1] === 'filled') === !!cd.loIn && (k[3] === 'filled') === !!cd.hiIn;
      });
    }
    case 'wholeGraph': return optIndex(q, G => drawsTruth(G, x => outs(P, x), breaks(P)));
    case 'graphPoints': {
      const a = N(p.match(new RegExp(`x = (${NUM})`))[1]);
      const filled = outs(P, a);
      const open = uniq(P.filter(r => !holds(r.cond, a) && ends(r.cond).some(e => near(e, a))).map(r => clean(r.f(a)))).filter(y => !has(filled, y));
      if (filled.length !== 1 || open.length !== 1) return [NaN, NaN];
      return /^filled/i.test(q.pair.lead) ? [filled[0], open[0]] : [open[0], filled[0]];
    }
    case 'phraseCond': {
      const sentence = p.split(/\. (?=[A-Z])/)[0], op = phraseOp(sentence), T = nums(plainTex(q.board))[0];
      return choiceWhere(q, c => { const k = norm(c).match(new RegExp(`^[a-z] (<|≤|>|≥) (${NUM})$`)); return !!k && k[1] === op && near(N(k[2]), T); });
    }
    case 'twoThreshold': {
      const rows = casesOf(q.board).map(r => tierCond(r.condText));
      return choiceWhere(q, c => { const cs = norm(c).split(/;\s*/).map(parseCond); return cs.length === rows.length && cs.every((x, i) => sameCond(x, rows[i])); });
    }
    case 'startedCost': case 'completedPay': {
      const unit = unitOf(p), rate = q.family === 'startedCost' ? N(p.match(/\$(\d+(?:\.\d+)?)/)[1]) : nums(p)[0];
      const what = p.match(/What does (.*?) (?:cost|earn)\?/)[1];
      const t = amountIn(what, unit);
      return clean(rate * (q.family === 'startedCost' ? Math.ceil(t - 1e-9) : Math.floor(t + 1e-9)));
    }
    case 'startedGraph': {
      const rate = N(p.match(/\$(\d+(?:\.\d+)?)/)[1]), max = N(p.match(/at most (\d+)/)[1]);
      return optIndex(q, G => drawsTruth(G, t => (t > 1e-9 && t <= max + 1e-9 ? [clean(rate * Math.ceil(t - 1e-9))] : []), [0, max]));
    }
    case 'whichWay': {
      const started = /or part of an?/.test(p), completed = /completed|full/.test(p);
      if (started === completed) throw new Error('started or completed?');
      const rate = nums(p)[0], total = nums(p.split(/exactly/)[1])[0], k = clean(total / rate);
      const want = started ? { lo: k - 1, loIn: false, hi: k, hiIn: true } : { lo: k, loIn: true, hi: k + 1, hiIn: false };
      return choiceWhere(q, c => sameCond(parseCond(c), want));
    }
    case 'floorEval': {
      const e = norm(p.split(/Find /).pop()).replace(/\.$/, '')
        .replace(/\[\[([^\]]+)\]\]|int\(([^)]+)\)|⌊([^⌋]+)⌋/g, (_, a, b, c) => `(${Math.floor(evalText(a ?? b ?? c))})`);
      return evalText(e);
    }
    case 'floorSolve': {
      const m = norm(p).match(new RegExp(`⌊x⌋(?: ([+-]) (${NUM}))? = (${NUM})\\?`));
      const k = N(m[3]) - (m[1] ? (m[1] === '+' ? 1 : -1) * N(m[2]) : 0);
      if (!Number.isInteger(k)) return choiceWhere(q, () => false);
      return choiceWhere(q, c => sameCond(parseCond(c), { lo: k, loIn: true, hi: k + 1, hiIn: false }));
    }
    case 'condFromGraph': {
      const f = compile(p.match(/lies on y = (.*)\?$/)[1]);
      const mine = g.parts.filter(x => x.kind === 'piece' && [-3.1, 0.7, 2.9].every(t => near(fnOf(x.fn)(t), f(t))));
      if (mine.length !== 1) throw new Error('no single drawn piece on that line');
      const pc = mine[0], lo = pc.lo ?? null, hi = pc.hi ?? null;
      // an end without a marker: the point is either on the other piece (a join) or nowhere: either symbol may fit
      const okEnd = (e, inc) => (e === 'closed' ? inc : e === 'open' ? !inc : true);
      return choiceWhere(q, c => {
        const cd = parseCond(c);
        if (!cd) return false;
        if ((cd.lo ?? null) !== lo || (cd.hi ?? null) !== hi) return false;
        return (lo === null || okEnd(pc.ends[0], !!cd.loIn)) && (hi === null || okEnd(pc.ends[1], !!cd.hiIn));
      });
    }
    case 'joinOwner': {
      const a = N(p.match(new RegExp(`at x = (${NUM})`))[1]);
      const L = g.parts.find(x => x.kind === 'piece' && near(x.hi ?? NaN, a)), R = g.parts.find(x => x.kind === 'piece' && near(x.lo ?? NaN, a));
      const yl = fnOf(L.fn)(a), yr = fnOf(R.fn)(a), joined = near(yl, yr);
      return choiceWhere(q, c => {
        let m;
        if ((m = c.match(new RegExp(`^Either piece may own x = (${NUM}): both rules give (${NUM}) there`)))) return joined && near(yl, N(m[2]));
        if (/^Either piece/.test(c)) return joined;
        if (/^Both conditions must include/.test(c)) return false;
        if ((m = c.match(/^Only the (left|right) piece can own/))) return !joined && (m[1] === 'left' ? L.ends[1] : R.ends[0]) === 'closed';
        if ((m = c.match(/^Only the (left|right) piece: (.*)$/))) {
          const side = m[1] === 'left' ? L.ends[1] : R.ends[0];
          return !joined && side === 'closed' && /is the filled dot/.test(m[2]);
        }
        throw new Error(`joinOwner choice "${c}"`);
      });
    }
    case 'ruleFromGraph': return choiceWhere(q, c => { const R = rowsOfText(c); return R.every(r => r && r.f && r.cond) && drawsTruth(g, x => outs(R, x), breaks(R)); });
    case 'pieceLine': {
      const [[x1, y1], [x2, y2]] = pairsIn(p);
      const m = (y2 - y1) / (x2 - x1);
      return [clean(m), clean(y1 - m * x1)];
    }
    case 'tierCost': return round2(tierModel(p, q.board).cost);
    case 'tierRule': {
      const T = tierModel(p, q.board);
      return choiceWhere(q, c => {
        const k = norm(c).match(/^(.*) for (.*)$/);
        const f = compile(k[1]), cd = parseCond(k[2]);
        if (!f || !cd) return false;
        if (!(cd.lo !== null && near(cd.lo, T.N) && cd.hi === null)) return false;
        return [T.N + 1, T.N + 7.5, T.N * 2 + 3].every(v => near(f(v), T.at(v)));
      });
    }
    case 'jumpMeaning': {
      const tt = twoTier(p), T = tt.T;
      const below = tierPrice(tt, T - 0.5), above = tierPrice(tt, T + 0.5), atT = tierPrice(tt, T);
      const where = near(atT, below) ? 'just past' : 'at';
      return choiceWhere(q, c => {
        const k = norm(c).match(new RegExp(`^It jumps (up|down) by \\$(${NUM})(?: \\(from \\$(${NUM}) to \\$(${NUM})\\))?, (at|just past) (${NUM})$`));
        if (!k) return false;   // the vague "has a jump" and "left out of the domain": see sane
        return (k[1] === 'up') === above > below && near(N(k[2]), Math.abs(above - below)) && (k[3] === undefined || (near(N(k[3]), below) && near(N(k[4]), above)))
          && k[5] === where && near(N(k[6]), T);
      });
    }
    case 'atThreshold': {
      const v = nums(plainTex(q.board).replace(/^[a-z] =/, ''))[0];
      return tierPrice(twoTier(p), v);
    }
    case 'domainKind': {
      const kind = /whole cents|in cents/.test(p) ? 'cents' : /number of/.test(p) ? 'count' : 'measure';
      return choiceWhere(q, c => (kind === 'cents' ? /multiples of 0\.01/.test(c) : kind === 'count' ? /whole numbers/.test(c) : /every number/.test(c)));
    }
    case 'countGraph': {
      const rate = N(p.match(/\$(\d+(?:\.\d+)?)/)[1]), b = plainTex(q.board);
      let truth;
      if (/…|\.\.\./.test(b) || /\\ldots/.test(q.board)) {
        const n = nums(b), lo = n[0], hi = n[n.length - 1];
        truth = x => (Number.isInteger(Math.round(x * 1e9) / 1e9) && x >= lo - 1e-9 && x <= hi + 1e-9 ? [clean(rate * x)] : []);
      } else {
        const cd = parseCond(b);
        truth = x => (holds(cd, x) ? [clean(rate * x)] : []);
      }
      return optIndex(q, G => drawsTruth(G, truth, []));
    }
    case 'findGap': case 'gapFix': {
      const ex = p.match(new RegExp(`except (${NUM})`));
      const inDom = x => !(ex && near(x, N(ex[1])));
      if (q.family === 'findGap') {
        const gap = x => inDom(x) && outs(P, x).length === 0 && !P.some(r => holds(r.cond, x));
        return choiceWhere(q, c => {
          let m;
          const crit = [...breaks(P), ...nums(c)];
          if (/^Yes: every x/.test(c)) return testXs(crit).every(x => !gap(x)) && noOverlap(P);
          if (/^No: the graph jumps/.test(c)) return false;
          if ((m = c.match(/^No: (?:every x with )?(.*?) gets no output$/))) {
            const cd = parseCond(m[1]);
            return !!cd && testXs(crit).every(x => gap(x) === holds(cd, x));
          }
          throw new Error(`findGap choice "${c}"`);
        });
      }
      const fixOk = R => testXs(breaks(R)).every(x => R.some(r => holds(r.cond, x))) && isFn(R);
      return choiceWhere(q, c => {
        let m;
        if (/^Nothing/.test(c)) return fixOk(P);
        if ((m = c.match(/^Change (.*?) to (.*)$/))) {
          const from = parseCond(m[1]), to = parseCond(m[2]);
          const k = P.findIndex(r => sameCond(r.cond, from));
          if (k < 0) return false;
          return fixOk(P.map((r, i) => (i === k ? { ...r, cond: to } : r)));
        }
        if ((m = c.match(/^Change both: (.*) and (.*)$/))) {
          const [A, B] = [parseCond(m[1]), parseCond(m[2])];
          const R = P.map(r => ({ ...r }));
          // each new condition replaces the old one with the same side (same unbounded end)
          for (const nc of [A, B]) { const k = R.findIndex(r => (r.cond.lo === null) === (nc.lo === null) && (r.cond.hi === null) === (nc.hi === null)); if (k < 0) return false; R[k] = { ...R[k], cond: nc }; }
          return fixOk(R);
        }
        throw new Error(`gapFix choice "${c}"`);
      });
    }
    case 'overlapOk': {
      const a = N(p.match(new RegExp(`include x = (${NUM})`))[1]);
      const vals = P.filter(r => holds(r.cond, a)).map(r => clean(r.f(a)));
      return choiceWhere(q, c => {
        let m;
        if ((m = norm(c).match(new RegExp(`^Yes: at x = (${NUM}) both rules give (${NUM})$`)))) return near(N(m[1]), a) && vals.length >= 2 && vals.every(v => near(v, N(m[2]))) && isFn(P);
        if ((m = norm(c).match(new RegExp(`^No: at x = (${NUM}) the rules give (${NUM}) and (${NUM})$`)))) return near(N(m[1]), a) && !near(N(m[2]), N(m[3])) && sameSet(vals, [N(m[2]), N(m[3])]);
        if (/may never meet two conditions/.test(c)) return false;
        throw new Error(`overlapOk choice "${c}"`);
      });
    }
    case 'overlapInput': return choiceWhere(q, c => outs(P, N(c.replace(/^x = /, ''))).length >= 2);
    case 'findError': return findError(q, P, g);
    case 'nlSolve': {
      const c0 = nums(plainTex(q.board.split(/\\qquad/)[1]))[0];
      const r = solveEq(P, c0);
      return choiceWhere(q, c => sameSet(nums(c), r));
    }
    case 'nlRange': return choiceWhere(q, c => sameRange(P, c));
    case 'nlFeature': return nlFeature(q, P, p);
    default: return undefined;
  }
}
const round2 = v => Math.round(v * 100 + 1e-7 * Math.sign(v)) / 100;

// ---------------------------------------------------------------- tiered prices
/** the tier story → { N (threshold), at(v) (the true cost above N), cost (at the asked amount), lowFlat } */
function tierModel(p, board) {
  const b = plainTex(board);
  let m;
  const asked = () => nums(b.replace(/^[a-z] =/, ''))[0];
  // base price including N units, then r per unit over N
  if ((m = p.match(/\$(\d+(?:\.\d+)?) a (?:day|month|week)(?: and)? includ(?:ing|es) (\d+(?:\.\d+)?) [^;]*?; each [^$]*?over \d+(?:\.\d+)?[^$]*?\$(\d+(?:\.\d+)?)/))) {
    const base = Number(m[1]), n = Number(m[2]), r = Number(m[3]);
    const at = v => (v <= n ? base : base + r * (v - n));
    return { N: n, at, lowFlat: true, base, rate: r, get cost() { return at(asked()); } };
  }
  // a per unit for the first N units, b per unit above N
  if ((m = p.match(/\$(\d+(?:\.\d+)?) (?:an?|per) (\w+) for the first (\d+(?:\.\d+)?) [^$]*?\$(\d+(?:\.\d+)?) (?:an?|per) \w+ (?:for every \w+ over|above) (\d+(?:\.\d+)?)/))) {
    const a = Number(m[1]), n = Number(m[3]), r = Number(m[4]);
    if (Number(m[5]) !== n) throw new Error('two thresholds');
    const at = v => (v <= n ? a * v : a * n + r * (v - n));
    return { N: n, at, lowFlat: false, base: a * n, rate: r, get cost() { return at(asked()); } };
  }
  // first ounce, then each additional ounce or part of one
  if ((m = p.match(/\$(\d+(?:\.\d+)?) for the first (\w+) and \$(\d+(?:\.\d+)?) for each additional \w+ or part of an? \w+\. What does an? (\d+(?:\.\d+)?)/))) {
    const a = Number(m[1]), r = Number(m[3]), w = Number(m[4]);
    const at = v => a + r * Math.max(0, Math.ceil(v - 1 - 1e-9));
    return { N: 1, at, lowFlat: true, base: a, rate: r, w, get cost() { return at(w); } };
  }
  throw new Error('tier story not read');
}

// ---------------------------------------------------------------- range and features of curved pieces
/** a range text "−2 ≤ y ≤ 2, or y = 5", "y ≥ −2", "all real numbers", "A > 0" → membership test */
function rangeTest(text) {
  const t = norm(text).trim();
  if (/^all real numbers/.test(t)) return { has: () => true, nums: [] };
  const cs = t.split(/, or | or /).map(parseCond);
  if (cs.some(c => !c)) return null;
  return { has: y => cs.some(c => holds(c, y)), nums: cs.flatMap(ends) };
}
function inRange(P, y) { return solveEq(P, y).length > 0; }
function sameRange(P, text) {
  const R = rangeTest(text);
  if (!R) return false;
  const crit = [...R.nums];
  for (const r of P) for (const e of ends(r.cond)) crit.push(clean(r.f(e)));
  for (const r of P) { const pc = polyCoef(r.f); if (pc && Math.abs(pc[0]) > 1e-12) crit.push(clean(pc[2] - pc[1] ** 2 / (4 * pc[0]))); }
  const ys = testXs(crit);
  for (const c of uniq(crit)) ys.push(c + 1e-4, c - 1e-4);
  return ys.every(y => R.has(y) === inRange(P, y));
}
function nlFeature(q, P, p) {
  if (/domain/.test(p)) {
    const dom = x => P.some(r => holds(r.cond, x));
    return choiceWhere(q, c => {
      const t = norm(c);
      const test = /^all real numbers/.test(t) ? () => true : (cd => (cd ? x => holds(cd, x) : null))(parseCond(t));
      if (!test) return false;
      return testXs([...breaks(P), ...nums(t)]).every(x => test(x) === dom(x));
    });
  }
  if (/range/.test(p)) return choiceWhere(q, c => sameRange(P, c));
  if (/cross the x-axis/.test(p)) { const r = solveEq(P, 0); return choiceWhere(q, c => sameSet(nums(c), r)); }
  if (/keeps growing/.test(p)) {
    const last = P.find(r => r.cond.hi === null);
    const far = [50, 100, 200].map(x => last.f(x)), lim = far[2];
    const levels = Math.abs(far[1] - far[2]) < 1e-6;
    const reaches = v => solveEq([last], v).length > 0;
    return choiceWhere(q, c => {
      let m;
      if ((m = norm(c).match(new RegExp(`^It gets closer and closer to (${NUM}) \\w+ but never reaches`)))) return levels && near(lim, N(m[1])) && !reaches(N(m[1]));
      if ((m = norm(c).match(new RegExp(`^It levels off at (${NUM})`)))) return levels && near(lim, N(m[1])) && reaches(N(m[1]));
      if ((m = norm(c).match(new RegExp(`^It drops below (${NUM})`)))) return P.some(r => testXs(ends(r.cond)).some(x => holds(r.cond, x) && r.f(x) < N(m[1])));
      if ((m = norm(c).match(new RegExp(`^It reaches (${NUM}) \\w+ after`)))) return reaches(N(m[1]));
      throw new Error(`nlFeature choice "${c}"`);
    });
  }
  return undefined;
}

// ---------------------------------------------------------------- find the one mistake in a drawn graph
function findError(q, P, g) {
  const drawn = g.parts.filter(x => x.kind === 'piece');
  return choiceWhere(q, c => {
    const t = norm(c);
    let m;
    if (/^Nothing is wrong/.test(t)) return drawsTruth(g, x => outs(P, x), breaks(P), true);
    if ((m = t.match(new RegExp(`^The vertical segment at x = (${NUM}) should not be there`)))) return graphAt(g.parts, N(m[1])).seg;
    if ((m = t.match(new RegExp(`^The dots at x = (${NUM}) are swapped`)))) {
      const a = N(m[1]);
      const L = drawn.find(x => near(x.hi ?? NaN, a)), R = drawn.find(x => near(x.lo ?? NaN, a));
      const rl = P.find(r => r.cond.hi !== null && near(r.cond.hi, a)), rr = P.find(r => r.cond.lo !== null && near(r.cond.lo, a));
      if (!L || !R || !rl || !rr || !!rl.cond.hiIn === !!rr.cond.loIn) return false;
      const want = [rl.cond.hiIn ? 'closed' : 'open', rr.cond.loIn ? 'closed' : 'open'];
      return L.ends[1] === want[1] && R.ends[0] === want[0];
    }
    if ((m = t.match(/^The piece for (.*) is drawn at the wrong height$/))) {
      const cd = parseCond(m[1]), r = P.find(x => sameCond(x.cond, cd));
      const d = drawn.find(x => (x.lo ?? null) === cd.lo && (x.hi ?? null) === cd.hi);
      if (!r || !d) return false;
      const f = fnOf(d.fn), mid = cd.lo !== null && cd.hi !== null ? (cd.lo + cd.hi) / 2 : (cd.lo ?? cd.hi) + (cd.lo !== null ? 1.37 : -1.37);
      return [mid, mid + (cd.lo !== null ? 0.5 : -0.5)].some(x => !near(f(x), r.f(x)));
    }
    if ((m = t.match(/^The filled dot at (\(.*?\)) is missing$/))) {
      const [[a, y]] = pairsIn(m[1]);
      // missing = no marker at all where the rule puts the filled dot (a dot drawn open, or at another height, is a different mistake)
      const ownerEnd = drawn.filter(d => (near(d.lo ?? NaN, a) || near(d.hi ?? NaN, a)) && near(fnOf(d.fn)(a), y));
      return has(outs(P, a), y) && !has(graphAt(g.parts, a).def, y) && ownerEnd.length > 0 && ownerEnd.every(d => d.ends[near(d.lo ?? NaN, a) ? 0 : 1] === 'none');
    }
    throw new Error(`findError choice "${c}"`);
  });
}

// ---------------------------------------------------------------- sane: the item's world
function sane(q) {
  const p = norm(q.prompt), P = casesOf(q.board), ch = (q.choices ?? []).map(norm);
  const issues = [];
  switch (q.family) {
    case 'manyToOne': {
      const m = p.match(/^(.*) all equal (\S+)\. /);
      for (const a of [...m[1].matchAll(/f\(([^)]+)\)/g)].map(x => N(x[1]))) { const o = outs(P, a); if (o.length !== 1 || !near(o[0], N(m[2]))) issues.push(`f(${a}) is not ${m[2]}`); }
      break;
    }
    case 'joinDot': {
      const [[a, y]] = pairsIn(p);
      const touch = P.filter(r => ends(r.cond).some(e => near(e, a)));
      if (touch.length !== 2 || touch.some(r => !near(r.f(a), y))) issues.push(`the pieces do not both reach (${a}, ${y})`);
      break;
    }
    case 'pieceLine': {
      const side = /left piece/.test(p) ? 'left' : 'right';
      const pcs = picOf(q).g.parts.filter(x => x.kind === 'piece');
      const pc = side === 'left' ? pcs.find(x => x.lo === undefined || x.lo === null) : pcs.find(x => x.hi === undefined || x.hi === null);
      for (const [x, y] of pairsIn(p)) if (!pc || !near(fnOf(pc.fn)(x), y)) issues.push(`the amber point (${x}, ${y}) is not on the ${side} piece`);
      break;
    }
    case 'startedCost': case 'completedPay': {
      const unit = unitOf(p), t = amountIn(p.match(/What does (.*?) (?:cost|earn)\?/)[1], unit);
      const max = p.match(/at most (\d+)/);
      if (max && t > Number(max[1]) + 1e-9) issues.push(`${t} ${unit}s is past the limit of ${max[1]}`);
      if (t <= 0) issues.push('no time used');
      break;
    }
    case 'tierCost': case 'tierRule': {
      if (/\bearns\b/.test(p) && /\bcost\b/.test(p.split(/\. /).slice(-1)[0])) issues.push('a worker\'s pay is asked as "the cost"');
      if (q.family === 'tierRule') {
        const T = tierModel(p, q.board);
        const lm = plainTex(q.board).match(/= \$(\d+(?:\.\d+)?), ([^,]*)$/);
        if (lm && !T.lowFlat) issues.push(`the board shows the lower tier as a flat $${lm[1]} for ${lm[2]}, but below the threshold the ${/earns/.test(p) ? 'pay' : 'cost'} grows per unit`);
      }
      break;
    }
    case 'jumpMeaning': {
      const tt = twoTier(p);
      const vague = ch.find(c => new RegExp(`^The graph has a jump at (${NUM})$`).test(c));
      if (vague && near(N(vague.match(new RegExp(`(${NUM})$`))[1]), tt.T) && !near(tierPrice(tt, tt.T - 0.5), tierPrice(tt, tt.T + 0.5)))
        issues.push(`"${vague}" is also true (the price does jump there), so two choices are right`);
      break;
    }
    case 'atThreshold': case 'phraseCond': break;
    case 'domainKind': {
      for (const c of ch) {
        let m;
        if ((m = c.match(new RegExp(`from (${NUM}) to (${NUM}), like (${NUM})`))) && N(m[3]) > N(m[2])) issues.push(`"${c}": ${m[3]} is not between ${m[1]} and ${m[2]}`);
        if ((m = c.match(/1, 2, 3, …, (\d+)/)) && Number(m[1]) < 4) issues.push(`"${c}" is garbled (it lists 3, then ends at ${m[1]})`);
      }
      break;
    }
    default: break;
  }
  // money in the story: positive and believable
  if (/\$/.test(p)) for (const v of nums(p.replace(/\d+(?:\.\d+)? (?:lb|oz|mi|miles?|GB|kWh|hours?|minutes?|seconds?|days?|mph|years?|min)\b/g, ''))) if (v < 0) issues.push(`a negative amount ${v}`);
  return issues.join('; ');
}

export default { solve, sane };
