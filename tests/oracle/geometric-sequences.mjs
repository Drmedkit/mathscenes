// Oracle for the lesson "geometric-sequences" (Algebra 1: common ratio, classify, fraction / decimal / negative
// ratios, f(n) notation, recursive and explicit forms, terms far apart, zero-based index, relabel vs rewrite, percent
// factors, story models, thresholds, model type, forms agree, broken models; HSF-BF.A.2, HSF-IF.A.3, HSF-LE.A.2,
// HSF-LE.A.1.c, HSF-IF.C.8.b). Role O of docs/lessons/QUALITY_LAYER.md: every item is worked out from what the student
// sees (the prompt and choices as HTML, so 3 · 2^(n−1) keeps its exponent; the board; the drawn strip). Students 14-18.
//
// Method: every formula or definition the student reads is parsed into an expression tree over exact rationals
// (BigInt), with n and sequence references a_(n−1) / f(n−1). A definition becomes a SEQUENCE = a first term number lo
// and a value for every whole n ≥ lo. Explicit: a_n = <expr in n> with its domain. Recursive: a seed plus a step rule
// a_n = <expr in a_(n−1)> whose range starts right after the seed; a rule with no seed defines nothing. Two definitions
// are "the same" when they have the same first term number and the same values. Stories are read into a model
// (start value, factor per step, first index 0 for "now / after n years", 1 for "row 1 / first bounce"). Choices that
// make a claim are tested claim by claim.
import { nums, texPlain } from '../../tools/quality/oracle-kit.mjs';

// ---------------------------------------------------------------- exact rationals
const bgcd = (a, b) => { a = a < 0n ? -a : a; b = b < 0n ? -b : b; while (b) [a, b] = [b, a % b]; return a; };
class R {
  constructor(n, d = 1n) {
    if (d === 0n) throw new Error('division by zero');
    if (d < 0n) { n = -n; d = -d; }
    const g = bgcd(n, d) || 1n; this.n = n / g; this.d = d / g;
  }
  static of(v) {
    if (v instanceof R) return v;
    if (typeof v === 'bigint') return new R(v);
    if (typeof v === 'number') { if (Number.isInteger(v)) return new R(BigInt(v)); return R.parse(String(v)); }
    return R.parse(v);
  }
  /** "−1,250.5", "3/4", "−1/2" */
  static parse(s) {
    s = String(s).replace(/[−–]/g, '-').replace(/[,$\s]/g, '');
    let m;
    if ((m = s.match(/^(-?)(\d+)\/(\d+)$/))) return new R((m[1] ? -1n : 1n) * BigInt(m[2]), BigInt(m[3]));
    if ((m = s.match(/^(-?)(\d*)(?:\.(\d+))?$/)) && (m[2] || m[3])) {
      const f = m[3] ?? '', n = BigInt((m[2] || '0') + f), d = 10n ** BigInt(f.length);
      return new R(m[1] ? -n : n, d);
    }
    return null;
  }
  add(o) { o = R.of(o); return new R(this.n * o.d + o.n * this.d, this.d * o.d); }
  sub(o) { o = R.of(o); return new R(this.n * o.d - o.n * this.d, this.d * o.d); }
  mul(o) { o = R.of(o); return new R(this.n * o.n, this.d * o.d); }
  div(o) { o = R.of(o); return new R(this.n * o.d, this.d * o.n); }
  neg() { return new R(-this.n, this.d); }
  pow(e) {
    e = R.of(e);
    if (e.d !== 1n) return null;
    let k = e.n, base = this;
    if (k < 0n) { if (this.n === 0n) return null; base = new R(this.d, this.n); k = -k; }
    if (k > 4000n) return null;
    return new R(base.n ** k, base.d ** k);
  }
  eq(o) { o = R.of(o); return o !== null && this.n === o.n && this.d === o.d; }
  cmp(o) { o = R.of(o); const x = this.n * o.d - o.n * this.d; return x > 0n ? 1 : x < 0n ? -1 : 0; }
  get isInt() { return this.d === 1n; }
  get v() { return Number(this.n) / Number(this.d); }
}
const Rq = s => R.parse(s);
const req = (a, b) => !!a && !!b && a.eq(b);

// ---------------------------------------------------------------- text
/** HTML (or plain) → one normalized text: fractions (a/b), x^{e}, a_{i}, '-' for minus, '*' for times, '/' for ÷ */
function txt(html) {
  let s = String(html ?? '');
  for (let i = 0; i < 4; i++) s = s.replace(/<span class="fr"><span>([^<]*)<\/span><span>([^<]*)<\/span><\/span>/g, '($1/$2)');
  s = s.replace(/<sup>(.*?)<\/sup>/g, '^{$1}').replace(/<sub>(.*?)<\/sub>/g, '_{$1}').replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&')
    .replace(/[−–]/g, '-').replace(/[·×]/g, '*').replace(/÷/g, '/').replace(/…/g, '...').replace(/’/g, "'")
    .replace(/(\d),(\d{3})(?!\d)/g, '$1$2').replace(/(\d),(\d{3})(?!\d)/g, '$1$2')
    .replace(/\b([a-mo-zA-Z])\(\s*(n\s*[+-]\s*\d+|n|\d+)\s*\)/g, (_, a, b) => `${a}_{${b.replace(/\s/g, '')}}`)
    .replace(/\s+/g, ' ').trim();
  return s;
}
/** TeX → the same normalized text */
function tex(t) {
  let s = String(t ?? '');
  for (let i = 0; i < 4; i++) s = s.replace(/\\[dt]?frac\{([^{}]*)\}\{([^{}]*)\}/g, '($1/$2)');
  s = s.replace(/\\left|\\right/g, '').replace(/\\cdot|\\times/g, '*').replace(/\\div/g, '/').replace(/\\ge(q)?/g, '≥').replace(/\\le(q)?/g, '≤')
    .replace(/\\text\{([^{}]*)\}/g, '$1').replace(/\\[,;:! ]|\\quad/g, ' ').replace(/\\dots/g, '...').replace(/\\square/g, '□')
    .replace(/_([A-Za-z0-9])/g, '_{$1}').replace(/\^([A-Za-z0-9])/g, '^{$1}').replace(/[−–]/g, '-')
    .replace(/\s+/g, ' ').trim();
  return s;
}
const P = q => txt(q.promptHtml ?? q.prompt);
const C = q => (q.choicesHtml ?? q.choices ?? []).map(txt);
const NUM = '-?\\d+(?:\\.\\d+)?';
const rnum = s => R.parse(String(s).replace(/[()]/g, ''));
/** a base or factor as written: 5, -3, (-3), ((2/3)), (-(1/2)) */
const BASE = String.raw`(\((?:[^()]|\([^()]*\))*\)|-?\d+(?:\.\d+)?)`;
/** a regex from a raw string where @B stands for BASE */
const rx = s => new RegExp(s.replace(/@B/g, BASE));

// ---------------------------------------------------------------- expressions
function tokenize(s) {
  const t = [];
  let i = 0;
  while (i < s.length) {
    const c = s[i];
    if (c === ' ') { i++; continue; }
    let m;
    if ((m = s.slice(i).match(/^\d+(?:\.\d+)?/))) { t.push({ k: 'num', v: R.parse(m[0]) }); i += m[0].length; continue; }
    if ((m = s.slice(i).match(/^([A-Za-z])_\{/))) {
      // a reference a_{expr}
      let depth = 1, j = i + m[0].length;
      while (j < s.length && depth) { if (s[j] === '{') depth++; else if (s[j] === '}') depth--; j++; }
      if (depth) return null;
      const inner = parseExpr(s.slice(i + m[0].length, j - 1));
      if (!inner) return null;
      t.push({ k: 'ref', name: m[1], idx: inner }); i = j; continue;
    }
    if (c === 'n' && !/[A-Za-z]/.test(s[i + 1] ?? '')) { t.push({ k: 'n' }); i++; continue; }
    if ('+-*/()^{}'.includes(c)) { t.push({ k: c }); i++; continue; }
    return null;
  }
  return t;
}
/** text → (env) => R | null; env = { n: R, ref(name, idx: R) } */
function parseExpr(str) {
  const t = tokenize(str);
  if (!t || !t.length) return null;
  let p = 0;
  const peek = () => t[p], eat = k => (t[p] && t[p].k === k ? t[p++] : null);
  const lift = (f, g, op) => e => { const a = f(e), b = g(e); return a && b ? op(a, b) : null; };
  function expr() {
    let f = term();
    if (!f) return null;
    for (;;) {
      if (eat('+')) { const g = term(); if (!g) return null; f = lift(f, g, (a, b) => a.add(b)); }
      else if (eat('-')) { const g = term(); if (!g) return null; f = lift(f, g, (a, b) => a.sub(b)); }
      else return f;
    }
  }
  function term() {
    let f = unary();
    if (!f) return null;
    for (;;) {
      const k = peek()?.k;
      if (k === '*') { p++; const g = unary(); if (!g) return null; f = lift(f, g, (a, b) => a.mul(b)); }
      else if (k === '/') { p++; const g = unary(); if (!g) return null; f = lift(f, g, (a, b) => (b.n === 0n ? null : a.div(b))); }
      else if (k === 'n' || k === '(' || k === 'num' || k === 'ref') { const g = power(); if (!g) return null; f = lift(f, g, (a, b) => a.mul(b)); }
      else return f;
    }
  }
  function unary() {
    if (eat('-')) { const g = unary(); return g ? e => { const a = g(e); return a ? a.neg() : null; } : null; }
    if (eat('+')) return unary();
    return power();
  }
  function power() {
    const b = primary();
    if (!b) return null;
    if (eat('^')) {
      let x;
      if (eat('{')) { x = expr(); if (!x || !eat('}')) return null; }
      else { x = primary(); if (!x) return null; }
      return lift(b, x, (a, e) => a.pow(e));
    }
    return b;
  }
  function primary() {
    const tk = peek();
    if (!tk) return null;
    if (tk.k === 'num') { p++; const v = tk.v; return () => v; }
    if (tk.k === 'n') { p++; return e => e.n ?? null; }
    if (tk.k === 'ref') { p++; return e => { const i = tk.idx(e); return i && e.ref ? e.ref(tk.name, i) : null; }; }
    if (tk.k === '(') { p++; const f = expr(); if (!f || !eat(')')) return null; return f; }
    return null;
  }
  const f = expr();
  return f && p === t.length ? f : null;
}
const evalAt = (f, n) => { try { return f({ n: R.of(n) }); } catch { return null; } };
const constExpr = s => { const f = parseExpr(s); return f ? evalAt(f, 0) : null; };
const usesN = s => /(^|[^A-Za-z_{])n(?![A-Za-z])/.test(s.replace(/[A-Za-z]_\{[^}]*\}/g, ''));

// ---------------------------------------------------------------- definitions → sequences
/** "a_{n} = 3 * 2^{n-1} for n ≥ 1", "a_{1} = 5, a_{n} = 2 * a_{n-1} for n ≥ 2", "... (n ≥ 2)", "..., n ≥ 0" */
function parseDef(text, defaultLo = null) {
  let s = text.replace(/\.$/, '').trim(), lo = null, m;
  if ((m = s.match(/^(.*?)(?:,? for n ?≥ ?|,? \(n ?≥ ?|, n ?≥ ?)(-?\d+)\)?$/))) { s = m[1]; lo = Number(m[2]); }
  const parts = s.split(/,\s+(?=[A-Za-z]_\{)/);
  let seed = null, rule = null, expl = null;
  for (const part of parts) {
    const pm = part.match(/^([A-Za-z])_\{([^}]*)\} ?= ?(.+)$/);
    if (!pm) return { ok: false, why: `cannot read "${part}"` };
    const [, name, idx, rhs] = pm;
    if (/^-?\d+$/.test(idx)) {
      if (usesN(rhs) || /_\{/.test(rhs)) return { ok: false, why: 'seed?' };
      const v = constExpr(rhs);
      if (!v) return { ok: false, why: 'seed value?' };
      if (seed) return { ok: false, why: 'two seeds' };
      seed = { name, at: Number(idx), v };
      continue;
    }
    const im = idx.match(/^n(?:([+-])(\d+))?$/);
    if (!im) return { ok: false, why: 'index?' };
    const L = im[1] ? (im[1] === '-' ? -1 : 1) * Number(im[2]) : 0;
    const f = parseExpr(rhs);
    if (!f) return { ok: false, why: `cannot read "${rhs}"` };
    const refs = [...rhs.matchAll(/([A-Za-z])_\{([^}]*)\}/g)];
    if (refs.length) {
      if (refs.some(r => r[1] !== name)) return { ok: false, why: 'names' };
      const offs = refs.map(r => r[2].match(/^n(?:([+-])(\d+))?$/));
      if (offs.some(o => !o)) return { ok: false, why: 'ref index?' };
      const Rs = new Set(offs.map(o => (o[1] ? (o[1] === '-' ? -1 : 1) * Number(o[2]) : 0)));
      if (Rs.size !== 1) return { ok: false, why: 'mixed refs' };
      const Ro = [...Rs][0];
      if (L - Ro !== 1) return { ok: false, why: 'the rule does not step from one term to the next' };
      rule = { name, L, f };
    } else expl = { name, L, f };
  }
  if (expl) {
    if (seed || rule || expl.L !== 0) return { ok: false, why: 'mixed' };
    const lo2 = lo ?? defaultLo;
    if (lo2 === null) return { ok: false, why: 'no domain' };
    return { ok: true, kind: 'explicit', name: expl.name, lo: lo2, domGiven: lo !== null, f: expl.f, at: k => (k < lo2 ? null : evalAt(expl.f, k)) };
  }
  if (!rule) return { ok: false, why: 'nothing' };
  if (!seed) return { ok: false, why: 'no seed' };
  if (seed.name !== rule.name) return { ok: false, why: 'names' };
  if (lo === null) return { ok: false, why: 'no range for the rule' };
  if (lo + rule.L !== seed.at + 1) return { ok: false, why: 'the rule range does not start right after the seed' };
  const memo = new Map([[seed.at, seed.v]]);
  const at = k => {
    if (!Number.isInteger(k) || k < seed.at) return null;
    for (let j = seed.at + 1; j <= k; j++) {
      if (memo.has(j)) continue;
      const nVal = j - rule.L;
      const v = rule.f({ n: R.of(nVal), ref: (nm, i) => (i.isInt ? memo.get(Number(i.n)) ?? null : null) });
      if (!v) return null;
      memo.set(j, v);
    }
    return memo.get(k);
  };
  return { ok: true, kind: 'recursive', name: seed.name, lo: seed.at, seed: seed.v, at };
}
function sameSeq(a, b, count = 10) {
  if (!a?.ok || !b?.ok || a.lo !== b.lo) return false;
  for (let k = a.lo; k <= a.lo + count; k++) if (!req(a.at(k), b.at(k))) return false;
  return true;
}
const geoSeq = (a1, r, lo = 1) => ({ ok: true, lo, at: k => (k < lo ? null : R.of(a1).mul(R.of(r).pow(k - lo))) });
/** a list that starts at term lo: the listed values, then the geometric continuation */
function listSeq(L, lo = 1) {
  const r = L[0].n === 0n ? null : L[1].div(L[0]);
  return { ok: true, lo, at: k => (k < lo ? null : k - lo < L.length ? L[k - lo] : r ? L[0].mul(r.pow(k - lo)) : null) };
}
const ratios = L => L.slice(1).map((v, i) => (L[i].n === 0n ? null : v.div(L[i])));
const isGeo = L => L.every(v => v.n !== 0n) && ratios(L).every(r => req(r, ratios(L)[0]));
const isArith = L => L.slice(1).every((v, i) => req(v.sub(L[i]), L[1].sub(L[0])));
const boardList = q => tex(q.board).replace(/\.\.\.|\?/g, '').split(',').map(x => x.trim()).filter(Boolean).map(rnum);
/** the first sentence (the definition), cut before the question */
const firstPart = p => p.split(/\. (?=What|Which|Relabel|The same|Fill|Check|Is |In |Show)/)[0];
const strip = q => q.data?.picture?.strip ?? null;
function table(q) {
  const s = strip(q);
  if (!s) return null;
  const m = new Map();
  s.ns.forEach((n, i) => { const v = s.vals[i]; if (v) m.set(n, new R(BigInt(v.n), BigInt(v.d))); });
  return m;
}
const ORD = ['zeroth', 'first', 'second', 'third', 'fourth', 'fifth', 'sixth', 'seventh', 'eighth', 'ninth', 'tenth'];

// ---------------------------------------------------------------- story models
/** the model a story describes: start S, factor f per step, first index lo; null when it cannot be read */
function storyModel(p) {
  let m;
  const pct = x => R.parse(x).div(100);
  if ((m = p.match(/starts with \$?(\d+(?:\.\d+)?) and earns (\d+(?:\.\d+)?)% interest per (year|month)/))) return { S: R.parse(m[1]), f: R.of(1).add(pct(m[2])), lo: 0, pct: R.parse(m[2]) };
  if ((m = p.match(/An account starts with \$(\d+(?:\.\d+)?) and earns (\d+(?:\.\d+)?)% interest per year/))) return { S: R.parse(m[1]), f: R.of(1).add(pct(m[2])), lo: 0, pct: R.parse(m[2]) };
  if ((m = p.match(/starts with (\d+(?:\.\d+)?) cells and (doubles|triples|quadruples) every hour/))) return { S: R.parse(m[1]), f: R.of({ doubles: 2, triples: 3, quadruples: 4 }[m[2]]), lo: 0 };
  if ((m = p.match(/has (\d+(?:\.\d+)?) mg of a medicine in the body; every \d+ hours half of it is left/))) return { S: R.parse(m[1]), f: new R(1n, 2n), lo: 0 };
  if ((m = p.match(/bought for \$(\d+(?:\.\d+)?) keeps (\d+(?:\.\d+)?)% of its value each year/))) return { S: R.parse(m[1]), f: pct(m[2]), lo: 0, keep: R.parse(m[2]) };
  if ((m = p.match(/(?:has|of) (\d+(?:\.\d+)?) people(?: now)? (?:and )?grows (\d+(?:\.\d+)?)% per year/))) return { S: R.parse(m[1]), f: R.of(1).add(pct(m[2])), lo: 0, pct: R.parse(m[2]) };
  if ((m = p.match(/(?:worth|is worth) \$(\d+(?:\.\d+)?) now (?:and )?loses (\d+(?:\.\d+)?)% of its value (?:each|every) year/))) return { S: R.parse(m[1]), f: R.of(1).sub(pct(m[2])), lo: 0, pct: R.parse(m[2]), loss: true };
  if ((m = p.match(/has (\d+(?:\.\d+)?) fish now, and the number grows (\d+(?:\.\d+)?)% per year/))) return { S: R.parse(m[1]), f: R.of(1).add(pct(m[2])), lo: 0, pct: R.parse(m[2]) };
  if ((m = p.match(/first bounce reaches (\d+(?:\.\d+)?) inches[,;] (?:and )?each bounce reaches \((\d+)\/(\d+)\) of the (?:height of the )?one before/))) return { S: R.parse(m[1]), f: new R(BigInt(m[2]), BigInt(m[3])), lo: 1 };
  if ((m = p.match(/has (\d+(?:\.\d+)?) cans in row 1, and each row has (\d+) times as many cans as the row before/))) return { S: R.parse(m[1]), f: R.parse(m[2]), lo: 1 };
  if ((m = p.match(/Row 1 of a can display has (\d+(?:\.\d+)?) cans, and each row has (\d+) times as many cans as the row before/))) return { S: R.parse(m[1]), f: R.parse(m[2]), lo: 1 };
  return null;
}
const modelSeq = M => ({ ok: true, lo: M.lo, at: k => (k < M.lo ? null : M.S.mul(M.f.pow(k - M.lo))) });

// ---------------------------------------------------------------- families
const F = {};   // solve → answer
const T = {};   // choice families: q → truth(choiceText, i) | null

F.termRead = q => {
  const p = P(q), Tb = table(q);
  let m;
  if ((m = p.match(/What is a_\{(\d+)\}\?/))) return Tb.get(Number(m[1]))?.v;
  if ((m = p.match(/For which term number n is a_\{n\} = (-?\d+(?:\.\d+)?)\?/))) {
    const v = R.parse(m[1]), hits = [...Tb].filter(([, x]) => x.eq(v));
    return hits.length === 1 ? hits[0][0] : undefined;
  }
  return undefined;
};

/** the table of indexDomain: the listed values (prompt) or the strip */
function idTable(q) {
  const p = P(q), m = p.match(/for n = (\d+) to (\d+): ([^A-Z]*?)\. Which/);
  if (m) { const L = m[3].split(',').map(x => R.parse(x.trim())); return new Map(L.map((v, i) => [Number(m[1]) + i, v])); }
  return table(q);
}
T.indexDomain = q => {
  const p = P(q), Tb = idTable(q);
  const asked = p.match(/What is a_\{(\d+(?:\.\d+)?)\}\?/);
  const askedIdx = asked ? Number(asked[1]) : null;
  return c => {
    let m;
    if (/^It is not a sequence/.test(c)) return false;
    if ((m = c.match(/^There is none: n counts positions 1, 2, 3, \.\.\., so (\d+(?:\.\d+)?) is not a term number$/)))
      return askedIdx !== null && Number(m[1]) === askedIdx && !Tb.has(askedIdx);
    if (askedIdx !== null && !Tb.has(askedIdx)) return false;   // a value for a term number that does not exist
    if ((m = c.match(/^a_\{(\d+(?:\.\d+)?)\} = (-?\d+(?:\.\d+)?)(?:, .*)?$/))) { const v = Tb.get(Number(m[1])); return !!v && v.eq(R.parse(m[2])) && !/halfway/.test(c); }
    if ((m = c.match(/^a_\{(\d+)\} and a_\{(\d+)\} are different terms with the same value, (-?\d+(?:\.\d+)?)$/))) {
      const i = Number(m[1]), j = Number(m[2]), v = R.parse(m[3]);
      return i !== j && req(Tb.get(i), v) && req(Tb.get(j), v);
    }
    return false;
  };
};

const ratioOf = L => (L[0].n === 0n ? null : L[1].div(L[0]));
F.findR = q => ratioOf(boardList(q))?.v;
F.findRfrac = q => { const r = ratioOf(boardList(q)); return r ? [Number(r.n), Number(r.d)] : undefined; };
F.findRdec = F.findR;
F.findRneg = F.findR;

T.ratioCheck = q => {
  const L = boardList(q), g = isGeo(L), a = isArith(L), r = ratioOf(L), d = L[1].sub(L[0]);
  return c => {
    let m;
    if (/^Not geometric: the ratios are not all equal$/.test(c)) return !g;
    if ((m = c.match(/^Geometric, with common ratio (.+)$/))) return g && req(constExpr(m[1]), r);
    if ((m = c.match(/^Arithmetic, with common difference (.+)$/))) return a && req(constExpr(m[1]), d);
    return false;
  };
};

T.classify = q => {
  const L = boardList(q), g = isGeo(L), a = isArith(L);
  return c => ({ 'Neither': !g && !a, 'Geometric only': g && !a, 'Arithmetic only': a && !g, 'Both arithmetic and geometric': a && g })[c] ?? false;
};

T.whichGeo = () => c => { const L = c.split(',').map(x => R.parse(x.trim())); return L.every(Boolean) && L.length >= 3 && isGeo(L); };

T.signCause = q => {
  const L = boardList(q), g = isGeo(L), r = ratioOf(L);
  return c => {
    let m;
    if (/^There is no common ratio/.test(c)) return !g;
    if ((m = c.match(/^r = (.+)$/))) return g && req(constExpr(m[1]), r);
    return false;
  };
};

F.fEval = q => {
  const p = P(q), m = p.match(/^([A-Za-z])_\{n\} = (.+?) for n ≥ (-?\d+)\. What is \1_\{(-?\d+)\}\?/);
  if (!m) return undefined;
  const f = parseExpr(m[2]), k = Number(m[4]);
  return f && k >= Number(m[3]) ? evalAt(f, k)?.v : undefined;
};

/** shiftNote: the asked expression (a_{n+1}, f_{n-1}, a_{n}+1 ...) at the given n, from the table */
function shiftVal(q) {
  const p = P(q), Tb = table(q), m = p.match(/When n = (-?\d+), what is (.+?)\?$/);
  if (!m || !Tb) return null;
  const f = parseExpr(m[2]);
  return f ? f({ n: R.of(Number(m[1])), ref: (nm, i) => (i.isInt ? Tb.get(Number(i.n)) ?? null : null) }) : null;
}
T.shiftNote = q => { const v = shiftVal(q); return v ? c => req(R.parse(c), v) : null; };

/** the definition in the first sentence of the prompt, and the asked term */
const promptDef = (q, lo = null) => parseDef(firstPart(P(q)), lo);
F.recNext = q => {
  const S = promptDef(q), m = P(q).match(/What is [A-Za-z]_\{(\d+)\}\?/);
  return S.ok && m ? S.at(Number(m[1]))?.v : undefined;
};
T.recList = q => {
  const S = promptDef(q), m = P(q).match(/\(([A-Za-z])_\{(\d+)\} to \1_\{(\d+)\}\)/);
  if (!S.ok || !m) return null;
  const want = [];
  for (let k = Number(m[2]); k <= Number(m[3]); k++) want.push(S.at(k));
  return c => { const L = c.split(',').map(x => R.parse(x.trim())); return L.length === want.length && L.every((v, i) => req(v, want[i])); };
};

T.recWrite = q => {
  const L = boardList(q), lo = Number(P(q).match(/from n = (-?\d+)/)?.[1] ?? 1);
  if (!isGeo(L)) return null;
  const S = listSeq(L, lo);
  return c => sameSeq(parseDef(c), S);
};

/** recFromStory: start and factor read from the story text */
function storySeed(p) {
  const head = p.split(/ Let [a-z]_\{n\}/)[0];
  const S = nums(head.replace(/\b[Rr]ound 1\b/, 'round'))[0];
  let f = null, m;
  if (/half as many/.test(head)) f = new R(1n, 2n);
  else if ((m = head.match(/(\d+) times as many/))) f = R.parse(m[1]);
  else if ((m = head.match(/reaches \((\d+)\/(\d+)\) of the height/))) f = new R(BigInt(m[1]), BigInt(m[2]));
  const lo = Number(p.match(/\(n = (\d+) is the first\)/)?.[1] ?? 1);
  return S !== undefined && f ? { S: R.of(S), f, lo } : null;
}
T.recFromStory = q => { const M = storySeed(P(q)); return M ? c => sameSeq(parseDef(c), modelSeq(M)) : null; };

F.countHops = q => {
  const p = P(q);
  let m;
  if ((m = p.match(/from [A-Za-z]_\{(\d+)\} to [A-Za-z]_\{(\d+)\}\?/))) return Number(m[2]) - Number(m[1]);
  if ((m = p.match(rx(String.raw`^([A-Za-z])_\{(\d+)\} = (-?\d+(?:\.\d+)?) and every term is @B times the term before\. Then \1_\{(\d+)\} = (.+?)\^\{□\}\. What goes in the box\?`)))) {
    const s = Number(m[2]), a = R.parse(m[3]), r = constExpr(m[4]), k = Number(m[5]);
    const fm = m[6].match(rx(String.raw`^(.+?) \* @B$`));
    if (!fm || !req(constExpr(fm[1]), a) || !req(constExpr(fm[2]), r)) return undefined;
    return k - s;
  }
  return undefined;
};

T.deriveWhy = q => {
  const p = P(q);
  let m;
  if ((m = p.match(/^Check the explicit formula [A-Za-z]_\{n\} = (.+?) at n = (\d+)\. What does it give, and why\?/))) {
    const f = parseExpr(m[1]), v = f && evalAt(f, Number(m[2]));
    if (!v) return null;
    return c => {
      const cm = c.match(rx(String.raw`^(-?\d+(?:\.\d+)?), because @B\^\{(-?\d+)\} = (-?\d+(?:\.\d+)?)(: the first term takes no steps)?$`));
      if (!cm) return false; // "because the first term already has one factor r": not a reason, and not the value
      const claim = constExpr(cm[2])?.pow(Number(cm[3]));
      return req(R.parse(cm[1]), v) && req(claim, R.parse(cm[4]));
    };
  }
  if ((m = p.match(rx(String.raw`^([A-Za-z])_\{(\d+)\} = (-?\d+(?:\.\d+)?) and each term is @B times the term before\. Which product is \1_\{(\d+)\}\?`)))) {
    const v = geoSeq(R.parse(m[3]), constExpr(m[4]), Number(m[2])).at(Number(m[5]));
    return c => !/\+/.test(c) && req(constExpr(c), v);
  }
  return null;
};

/** "a_{n} = <formula>. What is a_{k}?" */
function evalAsked(q) {
  const m = P(q).match(/^([A-Za-z])_\{n\} = (.+?)\. What is \1_\{(\d+)\}\?/);
  const f = m && parseExpr(m[2]);
  return f ? evalAt(f, Number(m[3])) : null;
}
F.evalTerm = q => evalAsked(q)?.v;
F.evalFrac = q => { const v = evalAsked(q); return v ? [Number(v.n), Number(v.d)] : undefined; };

F.writeExp = q => { const L = boardList(q); const r = ratioOf(L); return r ? [L[0].v, r.v] : undefined; };

T.expFromTable = q => {
  const L = boardList(q), lo = Number(P(q).match(/shows [A-Za-z]_\{(\d+)\}/)?.[1] ?? 1);
  return c => { const S = parseDef(c, lo); return S.ok && S.lo === lo && L.every((v, i) => req(S.at(lo + i), v)); };
};

T.recToExp = q => { const S = promptDef(q); return S.ok ? c => sameSeq(parseDef(c, S.lo), S) : null; };
T.expToRec = q => { const S = promptDef(q); return S.ok ? c => sameSeq(parseDef(c), S) : null; };

/** two given terms "a_{i} = u and a_{j} = w" */
function twoTerms(p) {
  const m = p.match(/([A-Za-z])_\{(\d+)\} = (-?\d+(?:\.\d+)?) and \1_\{(\d+)\} = (-?\d+(?:\.\d+)?)/);
  return m ? { i: Number(m[2]), u: R.parse(m[3]), j: Number(m[4]), w: R.parse(m[5]) } : null;
}
/** number of real r with r^g = q (q ≠ 0) */
const realRoots = (q, g) => (g % 2 ? 1 : q.cmp(0) > 0 ? 2 : 0);

T.gapRatio = q => {
  const G = twoTerms(P(q));
  if (!G || G.u.n === 0n) return null;
  const g = G.j - G.i, Q = G.w.div(G.u), count = realRoots(Q, g);
  return c => {
    let set;
    if (/^No real common ratio/.test(c)) {
      const cm = c.match(/r\^\{(\d+)\} would be negative$/);
      return count === 0 && !!cm && Number(cm[1]) === g;
    }
    let m;
    if ((m = c.match(/^r = (.+?) or r = (.+)$/))) set = [constExpr(m[1]), constExpr(m[2])];
    else if ((m = c.match(/^r = (.+?)(?: only)?$/))) set = [constExpr(m[1])];
    else return false;
    if (set.some(x => !x)) return false;
    if (set.length === 2 && set[0].eq(set[1])) return false;
    return set.length === count && set.every(r => req(r.pow(g), Q));
  };
};

F.gapCube = q => {
  const G = twoTerms(P(q));
  if (!G || G.u.n === 0n) return undefined;
  const g = G.j - G.i, Q = G.w.div(G.u);
  if (g % 2 === 0) return undefined; // two real ratios: no single answer (sane reports it)
  const x = Math.sign(Q.v) * Math.abs(Q.v) ** (1 / g);
  const r = R.parse(String(Math.round(x * 1e6) / 1e6));
  return r && req(r.pow(g), Q) ? r.v : x;
};

F.backFirst = q => {
  const p = P(q), m = p.match(/has r = (.+?) and ([A-Za-z])_\{(\d+)\} = (-?\d+(?:\.\d+)?)\. What is \2_\{(\d+)\}\?/);
  if (!m) return undefined;
  const r = constExpr(m[1]), v = R.parse(m[4]), k = Number(m[3]), t = Number(m[5]);
  return r && r.n !== 0n ? v.mul(r.pow(t - k)).v : undefined;
};

T.backFormula = q => {
  const G = twoTerms(P(q));
  if (!G || G.u.n === 0n) return null;
  const g = G.j - G.i, count = realRoots(G.w.div(G.u), g);
  return c => {
    const parts = c.replace(/^only /, '').split(/ or /);
    const seqs = parts.map(x => parseDef(x, 1));
    if (seqs.some(s => !s.ok)) return false;
    // every listed formula is geometric and passes through both terms; they are different; none is missing
    for (const s of seqs) {
      const a1 = s.at(1), a2 = s.at(2);
      if (!a1 || a1.n === 0n || !a2) return false;
      const r = a2.div(a1);
      if (!sameSeq(s, geoSeq(a1, r, 1))) return false;
      if (!req(s.at(G.i), G.u) || !req(s.at(G.j), G.w)) return false;
    }
    if (seqs.length === 2 && sameSeq(seqs[0], seqs[1])) return false;
    return seqs.length === count;
  };
};

F.zeroStart = q => {
  const p = P(q), M = storyModel(p), m = p.match(/What is ([A-Za-z])_\{(\d+)\}\?/);
  return M && m ? modelSeq(M).at(Number(m[2]))?.v : undefined;
};

/** which first index the story's own words give: row n / bounce n → 1, after n hours / years from now → 0 */
function storyLo(p) {
  if (/in row n\b|row number|bounce n\b|bounce number|check number|day number/.test(p)) return 1;
  if (/after n |n years from now|years from now|starting now|since/.test(p)) return 0;
  return null;
}
T.zeroOrOne = q => {
  const p = P(q), M = storyModel(p);
  if (!M) return null;
  const lo = storyLo(p) ?? M.lo;
  const want = modelSeq({ ...M, lo });
  return c => { const S = parseDef(c); return S.ok && S.domGiven && sameSeq(S, want); };
};

/** relabel: the original a, and b_n = a_{n+k} */
function relabelGivens(q) {
  const p = P(q), a = promptDef(q);
  const m = p.match(/b_\{n\} = a_\{n\+(\d+)\}/);
  if (!a.ok || !m) return null;
  const k = Number(m[1]);
  return { a, k, b: { ok: true, lo: a.lo - k, at: j => (j < a.lo - k ? null : a.at(j + k)) } };
}
T.relabel = q => { const G = relabelGivens(q); return G ? c => { const S = parseDef(c); return S.ok && S.domGiven && sameSeq(S, G.b); } : null; };
F.relabelValue = q => {
  const G = relabelGivens(q), m = P(q).match(/What is b_\{(\d+)\}\?/);
  return G && m ? G.b.at(Number(m[1]))?.v : undefined;
};

F.rewriteCoef = q => {
  const m = P(q).match(/^Rewrite [A-Za-z]_\{n\} = (.+?) \(n ≥ (-?\d+)\) in the form [A-Za-z]_\{n\} = □ \* (.+?)\^\{n\}, same n/);
  const f = m && parseExpr(m[1]), b = m && constExpr(m[3]);
  if (!f || !b || b.n === 0n) return undefined;
  const lo = Number(m[2]), box = evalAt(f, lo).div(b.pow(lo));
  return box.v;
};

T.rewriteVsRelabel = q => {
  const m = P(q).match(/rewrites ([A-Za-z])_\{n\} = (.+?) for n ≥ (-?\d+) as \1_\{n\} = (.+?)\. What changed\?/);
  if (!m) return null;
  const lo = Number(m[3]), A = parseDef(`a_{n} = ${m[2]}`, lo), B = parseDef(`a_{n} = ${m[4]}`, lo);
  if (!A.ok || !B.ok) return null;
  const same = sameSeq(A, B);
  return c => {
    let cm;
    if ((cm = c.match(/^Only the form: same n, same domain n ≥ (-?\d+), and [A-Za-z]_\{(\d+)\} is still (-?\d+(?:\.\d+)?)$/)))
      return same && Number(cm[1]) === lo && req(A.at(Number(cm[2])), R.parse(cm[3]));
    if ((cm = c.match(/^The first term is now (-?\d+(?:\.\d+)?)$/))) return !same && req(B.at(lo), R.parse(cm[1]));
    if (/^The sequence now starts at n = /.test(c)) return false; // a rewrite keeps n and the domain
    if ((cm = c.match(/^Every term is now (\d+(?:\.\d+)?) times smaller$/))) {
      const k = R.parse(cm[1]);
      return !k.eq(1) && [0, 1, 2, 3, 4, 5].every(j => req(B.at(lo + j)?.mul(k), A.at(lo + j)));
    }
    return false;
  };
};

T.factorPct = q => {
  const m = P(q).match(/multiplied by (\d+(?:\.\d+)?) every/);
  if (!m) return null;
  const f = R.parse(m[1]), ch = f.sub(1).mul(100);
  return c => {
    let cm;
    if ((cm = c.match(/^It grows by (\d+(?:\.\d+)?)% each year$/))) return f.cmp(1) > 0 && req(R.parse(cm[1]), ch);
    if ((cm = c.match(/^It shrinks by (\d+(?:\.\d+)?)% each year$/))) return f.cmp(1) < 0 && req(R.parse(cm[1]), ch.neg());
    if ((cm = c.match(/^It stays the same: a (\d+(?:\.\d+)?)% change each year$/))) return f.eq(1) && R.parse(cm[1]).eq(0);
    return false;
  };
};

F.compound = q => {
  const p = P(q);
  let m;
  if ((m = p.match(/^\$(\d+(?:\.\d+)?) is put in an account that earns (\d+(?:\.\d+)?)% interest per year, with no deposits or withdrawals\. How much is in it after (\d+) years\?/)))
    return R.parse(m[1]).mul(R.of(1).add(R.parse(m[2]).div(100)).pow(Number(m[3]))).v;
  if ((m = p.match(/grows by (\d+(?:\.\d+)?)% each period\. By what percent has it grown in total after (\d+) periods\?/)))
    return R.of(1).add(R.parse(m[1]).div(100)).pow(Number(m[2])).sub(1).mul(100).v;
  if ((m = p.match(/shrinks by (\d+(?:\.\d+)?)% each period\. By what percent has it shrunk in total after (\d+) periods\?/)))
    return R.of(1).sub(R.of(1).sub(R.parse(m[1]).div(100)).pow(Number(m[2]))).mul(100).v;
  return undefined;
};

/** "X_{n} = <formula> is ... (n ≥ k)" in a story */
function storyFormula(p) {
  const m = p.match(/([A-Za-z])_\{n\} = (.+?) (?:is |mg|square millimeters)/);
  if (!m) return null;
  const f = parseExpr(m[2]);
  if (!f) return null;
  const dm = p.match(/\(n ≥ (-?\d+)\)/);
  let lo = dm ? Number(dm[1]) : storyLo(p);
  if (/check 1 is|day 1 is/.test(p)) lo = 1;
  return { name: m[1], f, lo, seq: { ok: true, lo, at: k => (k < lo ? null : evalAt(f, k)) } };
}
F.ctxEval = q => {
  const p = P(q), Fm = storyFormula(p), m = p.match(/What is [A-Za-z]_\{(\d+)\}/);
  return Fm && m ? evalAt(Fm.f, Number(m[1]))?.v : undefined;
};

T.ctxMeaning = q => {
  const p = P(q), Fm = storyFormula(p);
  if (!Fm) return null;
  const lo = storyLo(p) ?? Fm.lo ?? 1;
  let m;
  if (/Which values of n make sense\?/.test(p)) {
    return c => {
      const cm = c.match(/^n = (\d+), (\d+), (\d+), \.\.\./);
      if (cm) return Number(cm[1]) === lo && Number(cm[2]) === lo + 1 && Number(cm[3]) === lo + 2;
      return false; // "every number n ≥ 1, such as 2.5": a bounce number is whole
    };
  }
  if ((m = p.match(/What does ([A-Za-z])_\{(\d+)\} = (-?\d+(?:\.\d+)?) mean\?/))) {
    const k = Number(m[2]), V = R.parse(m[3]), at = j => evalAt(Fm.f, j), holds = req(at(k), V);
    return c => {
      let cm;
      if ((cm = c.match(/^Bounce (\d+) reaches a height of (\d+(?:\.\d+)?) inches$/))) return holds && Number(cm[1]) === k && req(R.parse(cm[2]), V);
      if ((cm = c.match(/^(\d+) years? from now the lake has (\d+(?:\.\d+)?) fish$/))) return holds && Number(cm[1]) === k && req(R.parse(cm[2]), V);
      if ((cm = c.match(/^The first (\d+) bounces reach (\d+(?:\.\d+)?) inches in total$/))) {
        let s = R.of(0); for (let j = 1; j <= Number(cm[1]); j++) s = s.add(at(j));
        return req(s, R.parse(cm[2]));
      }
      if ((cm = c.match(/^In year (\d+) the lake gains (\d+(?:\.\d+)?) fish$/))) { const j = Number(cm[1]); return j >= 1 && req(at(j).sub(at(j - 1)), R.parse(cm[2])); }
      if ((cm = c.match(/^(\d+(?:\.\d+)?) is the (\w+) number in the list [A-Za-z]_\{(\d+)\}/))) {
        const pos = ORD.indexOf(cm[2]), first = Number(cm[3]);
        return holds && req(R.parse(cm[1]), V) && pos >= 1 && first + pos - 1 === k;
      }
      return false; // "after k seconds", "bounces V times", "takes V years to reach k fish"
    };
  }
  return null;
};

/** threshold: the formula, its first n, the relation and the bound */
function threshold(q) {
  const p = P(q), Fm = storyFormula(p), m = p.match(/with [A-Za-z]_\{n\} (≤|≥) (\d+(?:\.\d+)?)\?/);
  if (!Fm || !m || Fm.lo === null) return null;
  const T0 = R.parse(m[2]), past = v => (m[1] === '≤' ? v.cmp(T0) <= 0 : v.cmp(T0) >= 0);
  let first = null;
  for (let k = Fm.lo; k <= Fm.lo + 300; k++) { const v = evalAt(Fm.f, k); if (v && past(v)) { first = k; break; } }
  return { Fm, rel: m[1], T0, past, first };
}
F.firstCross = q => threshold(q)?.first ?? undefined;

T.crossCheck = q => {
  const H = threshold(q), m = P(q).match(/prove that n = (\d+) is the FIRST n/);
  if (!H || !m) return null;
  const N = Number(m[1]), lo = H.Fm.lo;
  const r = evalAt(H.Fm.f, lo + 1).div(evalAt(H.Fm.f, lo)), monotone = r.cmp(0) > 0;
  return c => {
    const alone = /, and nothing else is needed$/.test(c);
    const facts = c.replace(/, and nothing else is needed$/, '').split(/ and /).map(s => s.match(/^[A-Za-z]_\{(\d+)\} = (\d+(?:\.\d+)?) (<|>|≤|≥) (\d+(?:\.\d+)?)$/));
    if (facts.some(f => !f)) return false;
    const F2 = facts.map(f => ({ k: Number(f[1]), v: R.parse(f[2]), rel: f[3], t: R.parse(f[4]) }));
    // every stated value and comparison is true
    for (const f of F2) {
      if (!req(evalAt(H.Fm.f, f.k), f.v) || !f.t.eq(H.T0)) return false;
      const cmp = f.v.cmp(f.t), ok = { '<': cmp < 0, '>': cmp > 0, '≤': cmp <= 0, '≥': cmp >= 0 }[f.rel];
      if (!ok) return false;
    }
    const hasN = F2.some(f => f.k === N && H.past(f.v));
    const before = F2.some(f => f.k === N - 1 && !H.past(f.v));
    if (!hasN || H.first !== N || !monotone) return false;
    if (alone) return N === lo;
    return before || N === lo;
  };
};

T.modelType = q => {
  const p = P(q).split(/\. Which kind/)[0];
  const factor = /\d+(?:\.\d+)?%|\bdoubles\b|\btriples\b|\bhalves\b|times as/.test(p);
  const amount = /\$\d+(?:\.\d+)? (?:more|less|into)|deposits \$|\b\d+(?:\.\d+)? (?:cm|mm|inches|feet|gallons|liters|pounds|pages)\b/.test(p);
  return c => {
    if (/^Arithmetic/.test(c)) return amount && !factor;
    if (/^Geometric/.test(c)) return factor && !amount;
    if (/^Neither/.test(c)) return factor && amount;
    return false;
  };
};

T.critique = q => {
  const p = P(q), M = storyModel(p), am = p.match(/models it as ([A-Za-z])_\{n\} = (.+?) \(n = years\)/);
  if (!M || !am) return null;
  const want = modelSeq({ ...M, lo: 0 }), ana = parseDef(`${am[1]}_{n} = ${am[2]}`, 0), anaOk = sameSeq(ana, want);
  return c => {
    let cm;
    if ((cm = c.match(/^(\d+(?:\.\d+)?)% of a growing amount adds more each year: ([A-Za-z]_\{n\} = .+)$/))) return !anaOk && req(R.parse(cm[1]), M.pct) && sameSeq(parseDef(cm[2], 0), want);
    if ((cm = c.match(/^It should be ([A-Za-z]_\{n\} = .+)$/))) return !anaOk && sameSeq(parseDef(cm[1], 0), want);
    if (/^Nothing:/.test(c)) return anaOk;
    return false;
  };
};

/** agreeWhy: the recursion a and the formula b */
function agreeGivens(p) {
  const m = p.match(/^Show that (.+?) \(n ≥ (\d+)\) and b_\{n\} = (.+?) \(n ≥ (\d+)\) give the same sequence/);
  if (!m) return null;
  const A = parseDef(`${m[1]} for n ≥ ${m[2]}`), B = parseDef(`b_{n} = ${m[3]}`, Number(m[4]));
  return A.ok && B.ok ? { A, B } : null;
}
T.agreeWhy = q => {
  const G = agreeGivens(P(q));
  if (!G) return null;
  const { A, B } = G, equal = sameSeq(A, B);
  return c => {
    // a proof: the same first term AND, for every n, the formula obeys the rule (examples, shared numbers prove nothing)
    const m = c.match(/^b_\{1\} = (.+?) = (-?\d+(?:\.\d+)?) = a_\{1\}, and for every n ≥ (\d+), (.+?) \* b_\{n-1\} = (.+?) = b_\{n\}$/);
    if (!m) return false;
    const f1 = constExpr(m[1]), v = R.parse(m[2]), r = constExpr(m[4]), rhs = parseExpr(m[5]);
    if (!f1 || !r || !rhs || !req(f1, v) || !req(B.at(1), v) || !req(A.at(1), v)) return false;
    if (Number(m[3]) !== A.lo + 1) return false;
    for (let n = A.lo + 1; n <= A.lo + 10; n++) {
      if (!req(r.mul(B.at(n - 1)), evalAt(rhs, n)) || !req(evalAt(rhs, n), B.at(n))) return false;
      // the rule really is "multiply by r": the recursion's term n is r times its term n − 1
      if (!req(A.at(n), r.mul(A.at(n - 1)))) return false;
    }
    return equal;
  };
};

T.agreeStep = q => {
  const m = P(q).match(/you need (.+?) = (.+?)\. What does that equal\?/);
  const f = m && parseExpr(m[2]);
  if (!f) return null;
  return c => { const g = parseExpr(c); return !!g && [2, 3, 4, 5, 6, 9].every(n => req(evalAt(g, n), evalAt(f, n))); };
};

/** fixModel / fixValue: the writer's model (front · base^(n + e), domain lo) and the story's model */
function writerModel(p) {
  const m = p.match(/writes ([A-Za-z])_\{n\} = (.+?)(?:, with n = | for n ≥ )/);
  if (!m) return null;
  const fm = m[2].match(rx(String.raw`^(?:(.+?) \* )?@B\^\{n(?:-(\d+))?\}$`));
  if (!fm) return null;
  const c = fm[1] ? constExpr(fm[1]) : R.of(1), b = constExpr(fm[2]), e = fm[3] ? -Number(fm[3]) : 0;
  const dm = p.match(/n ≥ (-?\d+)/);
  if (!c || !b || !dm) return null;
  return { name: m[1], c, b, e, lo: Number(dm[1]) };
}
const wSeq = W => ({ ok: true, lo: W.lo, at: k => (k < W.lo ? null : W.c.mul(W.b.pow(k + W.e))) });
function fixGivens(q) {
  const p = P(q), M = storyModel(p), W = writerModel(p);
  if (!M || !W) return null;
  const lo = storyLo(p) ?? M.lo;
  return { p, M, W, want: modelSeq({ ...M, lo }), lo };
}
T.fixModel = q => {
  const G = fixGivens(q);
  if (!G) return null;
  const { M, W, want } = G, fits = W2 => sameSeq(wSeq(W2), want);
  return c => {
    let cm;
    if (/^Nothing:/.test(c)) return fits(W);
    if (/^The domain should include n = /.test(c)) return false;
    if (/^The factor should be the percent itself, written as a decimal$/.test(c)) return !fits(W) && !!M.pct && fits({ ...W, b: M.pct.div(100) });
    if ((cm = c.match(/^The factor should be (\d+(?:\.\d+)?): losing (\d+(?:\.\d+)?)% keeps (\d+(?:\.\d+)?)%$/))) {
      const f = R.parse(cm[1]);
      return !fits(W) && fits({ ...W, b: f }) && !!M.pct && req(R.parse(cm[2]), M.pct) && req(R.parse(cm[3]), R.of(100).sub(M.pct)) && req(f, R.parse(cm[3]).div(100));
    }
    if ((cm = c.match(/^The exponent should be n: [A-Za-z]_\{0\} must be (\d+(?:\.\d+)?), but \w+'s model gives (\d+(?:\.\d+)?) \/ (\d+(?:\.\d+)?) at n = 0$/)))
      return !fits(W) && fits({ ...W, e: 0 }) && req(R.parse(cm[1]), want.at(0)) && req(R.parse(cm[2]).div(R.parse(cm[3])), wSeq({ ...W, lo: 0 }).at(0));
    if (/^The exponent should be n - 1 instead of n$/.test(c)) return !fits(W) && W.e === 0 && fits({ ...W, e: -1 });
    if ((cm = c.match(/^The domain should be n ≥ (\d+):/))) return !fits(W) && fits({ ...W, lo: Number(cm[1]) });
    if ((cm = c.match(/^The front number should be (\d+(?:\.\d+)?): at n = (\d+) the model must give (\d+(?:\.\d+)?) cans, not (\d+(?:\.\d+)?)$/))) {
      const k = Number(cm[2]);
      return !fits(W) && fits({ ...W, c: R.parse(cm[1]) }) && req(R.parse(cm[3]), want.at(k)) && req(R.parse(cm[4]), wSeq(W).at(k));
    }
    return false;
  };
};
F.fixValue = q => {
  const G = fixGivens(q), m = G && G.p.match(/what is [A-Za-z]_\{(\d+)\}\?/);
  return m ? G.want.at(Number(m[1]))?.v : undefined;
};

// ---------------------------------------------------------------- entry points
const pick = (q, t) => { const i = C(q).findIndex((c, i) => t(c, i)); return i >= 0 ? i : undefined; };
const countTrue = (q, t) => C(q).filter((c, i) => t(c, i)).length;

export function solve(q) {
  try {
    if (F[q.family]) {
      const v = F[q.family](q);
      if (v === undefined || v === null || (typeof v === 'number' && !Number.isFinite(v))) return undefined;
      return v;
    }
    if (T[q.family]) {
      const t = T[q.family](q);
      return t ? pick(q, t) : undefined;
    }
  } catch { return undefined; }
  return undefined;
}

/** the drawn strip must agree with the givens: every drawn value, the drawn factor, and the drawn range */
function pictureSeq(q) {
  const f = q.family, p = P(q);
  let m;
  if (f === 'recNext' || f === 'recList') return promptDef(q);
  if (f === 'evalTerm' || f === 'evalFrac') { m = p.match(/^[A-Za-z]_\{n\} = (.+?)\. What/); return m ? parseDef(`a_{n} = ${m[1]}`, 1) : null; }
  if (f === 'zeroStart') { const M = storyModel(p); return M ? modelSeq(M) : null; }
  if (f === 'relabelValue') return relabelGivens(q)?.b ?? null;
  if (['ctxEval', 'firstCross', 'crossCheck'].includes(f)) return storyFormula(p)?.seq ?? null;
  if (f === 'backFirst') {
    m = p.match(/has r = (.+?) and [A-Za-z]_\{(\d+)\} = (-?\d+(?:\.\d+)?)\./);
    if (!m) return null;
    const r = constExpr(m[1]), k = Number(m[2]), v = R.parse(m[3]);
    return { ok: true, lo: 1, at: j => v.mul(r.pow(j - k)), r };
  }
  if (f === 'countHops') {
    m = p.match(rx(String.raw`^([A-Za-z])_\{(\d+)\} = (-?\d+(?:\.\d+)?) and every term is @B times`));
    return m ? geoSeq(R.parse(m[3]), constExpr(m[4]), Number(m[2])) : null;
  }
  return null;
}
function pictureCheck(q) {
  const s = strip(q), p = P(q);
  if (!s) return '';
  const drawn = s.ns.map((n, i) => [n, s.vals[i] ? new R(BigInt(s.vals[i].n), BigInt(s.vals[i].d)) : null]);
  if (['gapRatio', 'gapCube', 'backFormula'].includes(q.family)) {
    const G = twoTerms(p);
    for (const [n, v] of drawn) if (v && !((n === G.i && v.eq(G.u)) || (n === G.j && v.eq(G.w)))) return `the picture draws a_${n} = ${v.v}, which the prompt does not give`;
    if (!drawn.some(([n]) => n === G.i) || !drawn.some(([n]) => n === G.j)) return 'the picture does not show both given terms';
    return '';
  }
  if (['findR', 'ratioCheck', 'classify', 'findRfrac', 'findRdec', 'findRneg', 'signCause', 'recWrite', 'writeExp', 'expFromTable'].includes(q.family)) {
    const L = boardList(q), lo = Number(p.match(/from n = (-?\d+)|shows [A-Za-z]_\{(\d+)\}/)?.slice(1).find(Boolean) ?? 1);
    for (const [n, v] of drawn) if (v && !req(L[n - lo], v)) return `the picture draws a_${n} = ${v.v}, but the list says ${L[n - lo]?.v}`;
    const shown = drawn.filter(([, v]) => v).map(([, v]) => v);
    if (q.family === 'ratioCheck' && !isGeo(L) && isGeo(shown))
      return `the picture shows only ${shown.length} of the ${L.length} terms, all with the same ratio: the term that breaks the ratio (${L[L.length - 1].v}) is not drawn`;
    return '';
  }
  if (q.family === 'countHops') {
    const m = p.match(/from [A-Za-z]_\{(\d+)\} to [A-Za-z]_\{(\d+)\}\?/);
    if (m) {
      const i = Number(m[1]), j = Number(m[2]);
      if (s.ns[0] !== i || s.ns[s.ns.length - 1] !== j)
        return `the picture runs from a_${s.ns[0]}${drawn[0][1] ? ` (= ${drawn[0][1].v}, a value the prompt never gives)` : ''} to a_${s.ns[s.ns.length - 1]}, but the question counts from a_${i} to a_${j}`;
      return '';
    }
  }
  const S = pictureSeq(q);
  if (!S || !S.ok) return '';
  for (const [n, v] of drawn) if (v && !req(S.at(n), v)) return `the picture draws ${s.name ?? 'a'}_${n} = ${v.v}, but the givens make it ${S.at(n)?.v}`;
  if (s.r) {
    const r = new R(BigInt(s.r.n), BigInt(s.r.d)), lo = Math.max(S.lo, s.ns[0]);
    const want = S.r ?? (S.at(lo) && S.at(lo).n !== 0n ? S.at(lo + 1).div(S.at(lo)) : null);
    if (want && !r.eq(want)) return `the picture's factor ${r.v} differs from the givens' ${want.v}`;
  }
  return '';
}
const cents = v =>Math.abs(v * 100 - Math.round(v * 100)) < 1e-6;
export function sane(q) {
  const f = q.family, p = P(q);
  try {
    if (T[f]) {
      const t = T[f](q);
      if (!t) return 'the oracle cannot read this item';
      const k = countTrue(q, t);
      if (k === 0) return 'no choice is right';
      if (k > 1) return `${k} choices are right`;
    }
    // lists said to be geometric must be
    if (['findR', 'findRfrac', 'findRdec', 'findRneg', 'writeExp', 'recWrite', 'expFromTable', 'signCause'].includes(f)) {
      const L = boardList(q);
      if (!isGeo(L) && f !== 'signCause') return 'the list is not geometric';
    }
    if (f === 'termRead') {
      const s = strip(q), m = p.match(/from n = (-?\d+)/);
      if (m && s && s.ns[0] !== Number(m[1])) return 'the prompt and the table start at different n';
    }
    if (f === 'findRdec' || (f === 'findRneg' && /as a decimal/.test(p)) || (f === 'writeExp' && /Type decimals/.test(p))) {
      const r = ratioOf(boardList(q));
      let d = r.d; while (d % 2n === 0n) d /= 2n; while (d % 5n === 0n) d /= 5n;
      if (d !== 1n) return `the ratio ${r.n}/${r.d} has no exact decimal`;
    }
    if (f === 'gapCube') {
      const G = twoTerms(p);
      if (G && (G.j - G.i) % 2 === 0) return 'an even gap: two real ratios, the question asks for one';
    }
    if (f === 'fEval') {
      const m = p.match(/for n ≥ (-?\d+)\. What is [A-Za-z]_\{(-?\d+)\}/);
      if (m && Number(m[2]) < Number(m[1])) return 'the asked term is outside the domain';
    }
    if (f === 'zeroStart') {
      const M = storyModel(p), b = parseDef(tex(q.board).replace(/^([A-Za-z])_\{?n\}?/, '$1_{n}'));
      if (!M) return 'the oracle cannot read the story';
      if (b.ok && !sameSeq(b, modelSeq(M))) return 'the board formula does not match the story';
      const v = F.zeroStart(q);
      if (/cells/.test(p) && !Number.isInteger(v)) return `a fractional number of cells (${v})`;
      if (/\$/.test(p) && !cents(v)) return `an amount that is not whole cents (${v})`;
    }
    if (f === 'recFromStory') {
      const M = storySeed(p), b = texPlain(q.board), bv = nums(b);
      if (M && bv.length && !req(R.of(bv[0]), M.S)) return 'the board start and the story disagree';
    }
    if (f === 'ctxEval' || f === 'ctxMeaning' || f === 'firstCross' || f === 'crossCheck') {
      const Fm = storyFormula(p), M = storyModel(p);
      if (Fm && M) {
        const lo = storyLo(p) ?? M.lo;
        if (!sameSeq(Fm.seq, modelSeq({ ...M, lo }), 6)) return 'the formula does not match the story';
      }
      if (f === 'ctxEval') {
        const v = F.ctxEval(q);
        if (q.unit === 'fish' && !Number.isInteger(v)) return `a fractional number of fish (${v})`;
        if (q.unit === 'dollars' && !cents(v)) return `an amount that is not whole cents (${v})`;
      }
      if (f === 'ctxMeaning') {
        const m = p.match(/What does ([A-Za-z])_\{(\d+)\} = (-?\d+(?:\.\d+)?) mean\?/);
        if (m && Fm && !req(evalAt(Fm.f, Number(m[2])), R.parse(m[3]))) return 'the stated value does not follow from the formula';
      }
      if (f === 'firstCross' || f === 'crossCheck') {
        const H = threshold(q);
        if (!H || H.first === null) return 'the threshold is never passed';
        if (H.first === H.Fm.lo) return 'the very first term is already past the threshold';
        for (let k = H.Fm.lo; k <= H.first; k++) if (evalAt(H.Fm.f, k).eq(H.T0)) return 'a term equals the threshold';
      }
    }
    if (f === 'compound') {
      const v = F.compound(q);
      if (q.unit === 'dollars' && !cents(v)) return `an amount that is not whole cents (${v})`;
    }
    if (f === 'fixValue') {
      const v = F.fixValue(q), G = fixGivens(q);
      if (!G) return 'the oracle cannot read the story';
      if (q.unit === 'people' && !Number.isInteger(v)) return `a fractional number of people (${v})`;
      if (q.unit === 'cans' && !Number.isInteger(v)) return `a fractional number of cans (${v})`;
      if (q.unit === 'dollars' && !cents(v)) return `an amount that is not whole cents (${v})`;
      if (sameSeq(wSeq(G.W), G.want)) return 'the model has no mistake';
    }
    if (f === 'rewriteCoef') {
      const m = p.match(/^Rewrite [A-Za-z]_\{n\} = (.+?) \(n ≥/), fx = m && parseExpr(m[1]), v = F.rewriteCoef(q);
      const bm = p.match(/= □ \* (.+?)\^\{n\}/), b = bm && constExpr(bm[1]);
      if (fx && b && [2, 3, 4].some(n => !req(evalAt(fx, n), R.parse(String(v))?.mul(b.pow(n))))) return 'the coefficient is not a terminating decimal';
    }
    const pic = pictureCheck(q);
    if (pic) return pic;
  } catch (e) { return `oracle error: ${e.message}`; }
  return '';
}

export default { solve, sane };
