// Oracle for the lesson "linear-models" (Algebra 1, secondary-t6-32: writing linear equations from a context).
// Written from what the student sees only (docs/lessons/QUALITY_LAYER.md, "O: the oracle"): the prompt, the board, the
// choices and the drawn picture (a plane shows only the keys in its `show` list; a table's diffs and a restriction
// stack's result row appear only with the worked solution, so neither is read as a given). Stories are read into a
// rate and a start; every model is parsed into exact numbers (Q); a choice question judges each choice by the maths
// of its claim and returns -1 when no single choice is right. Students are 14-18: `sane` judges the worlds for them.
import { Q, texPlain, choiceWhere } from '../../tools/quality/oracle-kit.mjs';

// ---------------------------------------------------------------- numbers
const norm = s => String(s ?? '').replace(/[−–]/g, '-').replace(/ /g, ' ');
const N = '-?\\$?\\d[\\d,]*(?:\\.\\d+)?';
/** '−3' '$2.50' '1,450' → exact Q */
function qs(s) {
  const t = norm(s).replace(/[$,\s%]/g, '');
  const m = t.match(/^(-?)(\d*)(?:\.(\d+))?$/);
  if (!m || (m[2] === '' && !m[3])) throw new Error(`not a number: ${s}`);
  const d = m[3] ? 10 ** m[3].length : 1, n = Number((m[2] || '0') + (m[3] || ''));
  return Q(m[1] ? -n : n, d);
}
const tryQ = s => { try { return qs(s); } catch { return null; } };
/** every number of a text in order, as Q (a hyphen between a word and a digit, "30-gallon", is not a minus) */
const numsQ = t => [...norm(t).matchAll(/(?<![\w.])(-?)\$?(\d[\d,]*(?:\.\d+)?)/g)].map(m => qs(m[1] + m[2]));
const isWhole = q => q.d === 1;
const floorQ = q => Math.floor(q.n / q.d);
const ceilQ = q => Math.ceil(q.n / q.d);
/** a shown decimal (rounded to 2 places, or exact) matches the exact value */
const shows = (txt, q) => { const v = tryQ(txt); return !!v && (v.eq(q) || Math.abs(v.value - q.value) < 0.0051); };

// ---------------------------------------------------------------- linear expressions
function tokens(s) {
  const t = norm(s).replace(/·|×|\\cdot/g, '*').replace(/\s+/g, '').replace(/\$/g, '');
  const out = [];
  for (let i = 0; i < t.length;) {
    let m;
    if ((m = t.slice(i).match(/^\d+(?:\.\d+)?/))) { out.push({ n: qs(m[0]) }); i += m[0].length; continue; }
    if ((m = t.slice(i).match(/^[A-Za-z]/))) { out.push({ v: m[0] }); i += 1; continue; }
    if ('+-*/()'.includes(t[i])) { out.push({ o: t[i] }); i++; continue; }
    return null;
  }
  return out;
}
const lin = (k = {}, c = Q(0)) => ({ k, c });
const linAdd = (a, b, sg = 1) => {
  const k = { ...a.k };
  for (const [v, x] of Object.entries(b.k)) k[v] = (k[v] ?? Q(0)).add(x.mul(sg));
  return lin(k, a.c.add(b.c.mul(sg)));
};
const isConst = a => Object.values(a.k).every(x => x.eq(0));
const linScale = (a, s) => { const k = {}; for (const [v, x] of Object.entries(a.k)) k[v] = x.mul(s); return lin(k, a.c.mul(s)); };
function parseLin(s) {
  const T = tokens(s);
  if (!T || !T.length) return null;
  let i = 0;
  const eat = o => (T[i]?.o === o ? (i++, true) : false);
  const mul = (a, b) => { if (isConst(a)) return linScale(b, a.c); if (isConst(b)) return linScale(a, b.c); throw new Error('nl'); };
  function expr() { let a = term(); for (;;) { if (eat('+')) a = linAdd(a, term()); else if (eat('-')) a = linAdd(a, term(), -1); else return a; } }
  function term() {
    let a = unary();
    for (;;) {
      const p = T[i];
      if (eat('*')) a = mul(a, unary());
      else if (eat('/')) { const b = unary(); if (!isConst(b) || b.c.eq(0)) throw new Error('div'); a = linScale(a, Q(1).div(b.c)); }
      else if (p && (p.v || p.o === '(')) a = mul(a, unary());
      else return a;
    }
  }
  function unary() {
    if (eat('-')) return linScale(unary(), -1);
    if (eat('+')) return unary();
    const p = T[i++];
    if (!p) throw new Error('end');
    if (p.n) return lin({}, p.n);
    if (p.v) return lin({ [p.v]: Q(1) });
    if (p.o === '(') { const a = expr(); if (!eat(')')) throw new Error(')'); return a; }
    throw new Error('tok');
  }
  try { const a = expr(); return i === T.length ? a : null; } catch { return null; }
}
const varsOf = a => Object.keys(a.k).filter(v => !a.k[v].eq(0));
/** one-variable linear expression → { m, b, v } */
function mbOfExpr(s) {
  const a = parseLin(s);
  if (!a) return null;
  const vs = varsOf(a);
  if (vs.length > 1) return null;
  return { m: vs.length ? a.k[vs[0]] : Q(0), b: a.c, v: vs[0] ?? null };
}
/** the first "Y = <expr in x>" with a number in it: { y, x, m, b } */
function modelIn(text) {
  for (const mm of norm(text).matchAll(/(?<![\w])([A-Za-z]) = ((?:\d[\d.]*|[a-z](?![a-zA-Z])|[ +\-*·()])+)/g)) {
    let e = mm[2].replace(/[\s.]+$/, '');
    while (e && !mbOfExpr(e)) e = e.slice(0, -1).trimEnd();    // "150 − 2t (t" → "150 − 2t"
    if (!/\d/.test(e)) continue;
    const r = mbOfExpr(e);
    if (r && r.v) return { y: mm[1], x: r.v, m: r.m, b: r.b, src: e };
  }
  return null;
}
const sameMB = (a, m, b) => a && a.m.eq(m) && a.b.eq(b);

// ---------------------------------------------------------------- the story's words
/** "where V is the water left (gallons) and t is the number of minutes of draining" */
function wordsOf(p) {
  const t = norm(p);
  const w = t.match(/where ([A-Za-z]) is the ([\w ]+?) \((\w+)\) and ([a-z]) is the number of ([\w ]+?)\./);
  if (w) return { y: w[1], yName: w[2], yUnit: w[3], x: w[4], xName: w[5], xSing: sing(w[5]) };
  const u = t.match(/\(([a-z]) = ([\w ]+?), ([A-Za-z]) = ([\w ]+?) in (\w+)\)/);
  if (u) return { y: u[3], yName: u[4], yUnit: u[5], x: u[1], xName: u[2], xSing: sing(u[2]) };
  return null;
}
/** "monthly payments made" → payment, "hours of work" → hour, "smoothies bought" → smoothie */
function sing(phrase) {
  const w = phrase.split(' ').filter(x => x !== 'monthly')[0];
  return w.endsWith('ies') && w !== 'smoothies' && w !== 'coffees' ? w.slice(0, -3) + 'y' : w.endsWith('s') ? w.slice(0, -1) : w;
}

const D = '(\\d[\\d,]*(?:\\.\\d+)?)';
const RATE_RES = [
  `adds \\$?${D} to savings every week`, `adds \\$?${D} every week`,
  `[Ee]ach month \\$?${D} goes toward`, `[Ee]ach game on it costs \\$?${D}`, `[Ee]ach arcade game costs \\$?${D}`,
  `(?:cost|costs|for) \\$?${D} each`, `at \\$?${D} each`, `[Ee]ach \\w+ costs \\$?${D}`,
  `\\$?${D}(?:%| gallons| inches| cm| miles| pages| sheets)? per (?:hour|minute|mile|poster|month|week|ticket|pound|day|year)\\b`,
].map(s => new RegExp(s));
const DOWN = /drain|burns down|loses|paid off|goes toward|gift card pays|paid with a|from the beach|pays for/;
/** a story sentence → { m, b } (null for a story that is not linear) */
function story(s) {
  const t = norm(s);
  if (/speeds up|double|% of its balance/.test(t)) return null;
  const all = [...t.matchAll(/(?<![\w.])\$?(\d[\d,]*(?:\.\d+)?)/g)];
  if (/flat|no matter how many/.test(t) && all.length === 1) return { m: Q(0), b: qs(all[0][1]) };
  let rate = null, at = -1;
  for (const re of RATE_RES) {
    const m = re.exec(t);
    if (m) { rate = qs(m[1]); at = m.index + m[0].indexOf(m[1]); break; }
  }
  if (!rate) return null;
  const rest = all.filter(m => m.index + m[0].indexOf(m[1]) !== at);
  const b = /no other charge|no base pay|empty tray/.test(t) ? Q(0) : rest.length ? qs(rest[0][1]) : null;
  if (!b) return null;
  return { m: DOWN.test(t) ? rate.neg() : rate, b };
}

// ---------------------------------------------------------------- relations and intervals
const SYM = { '≤': 'le', '<': 'lt', '≥': 'ge', '>': 'gt', '=': 'eq' };
/** words of a limit → symbol (the longer phrases first) */
function symOf(phrase) {
  const p = phrase.toLowerCase();
  if (/no more than|at most|does not exceed|must not exceed|not exceed/.test(p)) return '≤';
  if (/no less than|at least/.test(p)) return '≥';
  if (/more than|exceeds/.test(p)) return '>';
  if (/less than|fewer than/.test(p)) return '<';
  return null;
}
const holds = (v, rel, T) => {
  const c = v.cmp(T);
  return rel === '≤' ? c <= 0 : rel === '<' ? c < 0 : rel === '≥' ? c >= 0 : rel === '>' ? c > 0 : c === 0;
};
/** "lhs REL rhs" with one relation symbol → { L, rel, R } */
function relOf(s) {
  const t = norm(s);
  const m = t.match(/^(.*?)\s*(≤|≥|<|>|=)\s*(.*)$/);
  if (!m) return null;
  const L = parseLin(m[1]), R = parseLin(m[3]);
  return L && R ? { L, rel: m[2], R, ls: m[1].trim(), rs: m[3].trim() } : null;
}
/** an interval claim: "0 ≤ h ≤ 16", "0 < t < 12", "h ≥ 0", "Every number T", "Whole numbers with 0 ≤ n ≤ 250" */
function intervalOf(c) {
  let t = norm(c).trim();
  const whole = /^Whole numbers with /.test(t);
  t = t.replace(/^(Whole numbers|Any number) with /, '');
  let m;
  if (/^Every\b/.test(t)) return { whole, lo: null, hi: null, loOpen: true, hiOpen: true };
  if ((m = t.match(new RegExp(`^(${N}) (≤|<) ([A-Za-z]) (≤|<) (${N})`)))) return { whole, lo: qs(m[1]), loOpen: m[2] === '<', hi: qs(m[5]), hiOpen: m[4] === '<', v: m[3] };
  if ((m = t.match(new RegExp(`^([A-Za-z]) (≥|>) (${N})`)))) return { whole, lo: qs(m[3]), loOpen: m[2] === '>', hi: null, hiOpen: true, v: m[1] };
  if ((m = t.match(new RegExp(`^([A-Za-z]) (≤|<) (${N})`)))) return { whole, lo: null, loOpen: true, hi: qs(m[3]), hiOpen: m[2] === '<', v: m[1] };
  return null;
}
const sameIv = (a, b) => !!a && !!b && a.whole === b.whole && ((a.lo === null && b.lo === null) || (a.lo && b.lo && a.lo.eq(b.lo) && a.loOpen === b.loOpen))
  && ((a.hi === null && b.hi === null) || (a.hi && b.hi && a.hi.eq(b.hi) && a.hiOpen === b.hiOpen));
const closed = (lo, hi, whole = false) => ({ whole, lo, hi, loOpen: false, hiOpen: false });

// ---------------------------------------------------------------- the families
const F = {};

// s1: linear or not
const LINEAR_RIGHT = /^Linear: the output changes by the same amount for each equal step of the input$/;
const NOT_RIGHT = /^Not linear: the change for each equal step is not the same$/;
F.isLinearStory = q => {
  const t = norm(q.prompt);
  const linear = !/speeds up|double|% of its balance/.test(t);
  return choiceWhere(q, c => (linear ? LINEAR_RIGHT : NOT_RIGHT).test(norm(c)));
};
function tableRows(p) {
  return [...norm(p).matchAll(new RegExp(`x = (${N}) gives y = (${N})`, 'g'))].map(m => [qs(m[1]), qs(m[2])]);
}
F.unevenTable = q => {
  const R = tableRows(q.prompt);
  if (R.length < 3) return undefined;
  const slopes = R.slice(1).map((r, i) => r[1].sub(R[i][1]).div(r[0].sub(R[i][0])));
  const linear = slopes.every(s => s.eq(slopes[0]));
  const dys = R.slice(1).map((r, i) => r[1].sub(R[i][1]));
  const dyEqual = dys.every(d => d.eq(dys[0]));
  return choiceWhere(q, c => {
    const t = norm(c);
    let m;
    if ((m = t.match(new RegExp(`^Linear, with a rate of (${N}) per unit of x$`)))) return linear && qs(m[1]).eq(slopes[0]);
    if (/^Not linear: the change per unit of x is not constant$/.test(t)) return !linear;
    if (/^Not linear: the changes in y are not equal$/.test(t)) return !linear && !dyEqual;
    return false;
  });
};

// s1: the start value
function arrowPairs(p) {
  return [...norm(p).matchAll(new RegExp(`(${N})(?: [a-z]+)? → (${N})`, 'g'))].map(m => [qs(m[1]), qs(m[2])]);
}
const startFromPoints = P => {
  if (P.length < 2) return null;
  const m = P[1][1].sub(P[0][1]).div(P[1][0].sub(P[0][0]));
  return { m, b: P[0][1].sub(m.mul(P[0][0])), fits: P.every(([x, y]) => y.eq(P[0][1].add(m.mul(x.sub(P[0][0]))))) };
};
F.startValue = q => {
  const P = arrowPairs(q.prompt);
  if (P.length >= 2) return startFromPoints(P).b.value;
  const s = story(norm(q.prompt).split(/ In the model/)[0]);
  return s ? s.b.value : undefined;
};
const pointsOf = t => [...norm(t).matchAll(new RegExp(`\\((${N}), (${N})\\)`, 'g'))].map(m => [qs(m[1]), qs(m[2])]);
F.startGraph = q => { const s = startFromPoints(pointsOf(q.prompt)); return s ? s.b.value : undefined; };

// s1: proportional
F.propOrNot = q => {
  const s = story(norm(q.prompt).split(/ Is the relationship/)[0]);
  if (!s) return undefined;
  const prop = s.b.eq(0) && !s.m.eq(0);
  return choiceWhere(q, c => {
    const t = norm(c);
    if (/^Proportional/.test(t)) return prop;
    if (/^Linear but not proportional: there is a nonzero start$/.test(t)) return !prop && !s.b.eq(0);
    return false;
  });
};
const firstSentence = p => norm(p).split(/\. (?=\d)/)[0];
F.doubleTest = q => {
  const s = story(firstSentence(q.prompt));
  const m = norm(q.prompt).match(new RegExp(`What do (${N}) [\\w ]+ cost\\?`));
  if (!s || !m) return undefined;
  return s.b.add(s.m.mul(qs(m[1]))).value;
};

// s1: the rate and the start in words
F.rateWords = q => {
  const M = modelIn(q.prompt), W = wordsOf(q.prompt);
  const a = norm(q.prompt).match(new RegExp(`What does the (${N}) tell you`));
  if (!M || !W || !a) return undefined;
  const asked = qs(a[1]);
  const uWord = W.yUnit === 'dollars' ? null : W.yUnit;
  return choiceWhere(q, c => {
    const t = norm(c);
    let k;
    if ((k = t.match(new RegExp(`^Each (\\w+) (adds|takes away) (${N})(?: ([\\w%]+))?(?:%)?: the rate is (${N}) (\\w+) per (\\w+)$`)))) {
      const amt = qs(k[3]), r = qs(k[5]);
      return asked.eq(M.m) && k[1] === W.xSing && k[7] === W.xSing && (k[2] === 'adds') === (M.m.cmp(0) > 0)
        && amt.eq(M.m.cmp(0) < 0 ? M.m.neg() : M.m) && r.eq(M.m) && k[6] === W.yUnit;
    }
    if ((k = t.match(new RegExp(`^At the start, the ([\\w ]+?) is (${N})`)))) return asked.eq(M.b) && !asked.eq(M.m) && k[1] === W.yName && qs(k[2]).eq(M.b);
    void uWord;
    return false;
  });
};
F.bothNumbers = q => {
  const M = modelIn(q.prompt), W = wordsOf(q.prompt);
  if (!M || !W) return undefined;
  return choiceWhere(q, c => {
    const k = norm(c).match(new RegExp(`^(${N}) (\\w+) is the ([\\w ]+?) at ([a-z]) = 0; the ([\\w ]+?) changes by (${N}) (\\w+) per (\\w+)$`));
    if (!k) return false;
    return qs(k[1]).eq(M.b) && k[2] === W.yUnit && k[3] === W.yName && k[4] === W.x && k[5] === W.yName
      && qs(k[6]).eq(M.m) && k[7] === W.yUnit && k[8] === W.xSing;
  });
};

// s2: variables
F.defineVars = q => {
  const t = norm(q.prompt);
  const a = t.match(/right definition of ([A-Za-z])\?/), mm = t.match(/In the model ([A-Za-z]) = m([a-z]) \+ b/);
  if (!a || !mm) return undefined;
  const asked = a[1];
  if (asked === mm[1]) return choiceWhere(q, c => new RegExp(`^${asked} = the (?!number of)[\\w ]+, in \\w+$`).test(norm(c)));
  if (asked === mm[2]) return choiceWhere(q, c => new RegExp(`^${asked} = the number of [\\w ]+, counted from when .+$`).test(norm(c)));
  return undefined;
};
const clock = s => { const m = s.match(/(\d+):(\d+)/); return Number(m[1]) * 60 + Number(m[2]); };
F.restartClock = q => {
  const t = norm(q.prompt), M = modelIn(t);
  const m = t.match(/= (minutes|hours) after (\d+:\d+) [ap]m\. A new model counts u = (?:minutes|hours) after (\d+:\d+) [ap]m/);
  if (!M || !m) return undefined;
  let shift = Q(clock(m[3]) - clock(m[2]));
  if (m[1] === 'hours') shift = shift.div(60);
  const b2 = M.b.add(M.m.mul(shift));
  return choiceWhere(q, c => {
    const r = relOf(c);
    if (!r || r.rel !== '=' || r.ls !== M.y) return false;
    const e = mbOfExpr(r.rs);
    return !!e && e.v === 'u' && e.m.eq(M.m) && e.b.eq(b2);
  });
};

// s2: equations from a rate and a start
F.buildModel = q => {
  const t = norm(q.prompt);
  const s = story(t.split(/ Let /)[0]);
  const v = t.match(/Let ([a-z]) be the number of [\w ]+ and ([A-Za-z]) the /);
  if (!s || !v) return undefined;
  return choiceWhere(q, c => {
    const r = relOf(c);
    if (!r || r.rel !== '=' || r.ls !== v[2]) return false;
    const e = mbOfExpr(r.rs);
    return !!e && e.v === v[1] && e.m.eq(s.m) && e.b.eq(s.b);
  });
};
F.modelPair = q => { const s = story(norm(q.prompt).split(/ Write the model/)[0]); return s ? [s.m.value, s.b.value] : undefined; };
F.drainModel = F.modelPair;

// s2: the rate from two points
function twoObs(p) {
  const t = norm(p).replace(/What is the rate.*$/, '');
  const m = t.match(new RegExp(`after (${N}) \\w+ the [\\w ]+? is (${N})%?(?: \\w+)?,? and after (${N}) \\w+ it is (${N})`));
  return m ? [[qs(m[1]), qs(m[2])], [qs(m[3]), qs(m[4])]] : null;
}
F.rateTwoPoints = q => { const P = twoObs(q.prompt); return P ? P[1][1].sub(P[0][1]).div(P[1][0].sub(P[0][0])).value : undefined; };
F.rateTable = q => { const s = startFromPoints(arrowPairs(q.prompt)); return s ? s.m.value : undefined; };
F.backStart = q => {
  const t = norm(q.prompt);
  const m = t.match(new RegExp(`changes by (-?\\$?-?[\\d.]+)(?: \\w+)? per \\w+\\. After (${N}) \\w+ it is (${N})`));
  if (!m) return undefined;
  const rate = qs(m[1].replace('$-', '-').replace('-$', '-'));
  return qs(m[3]).sub(rate.mul(qs(m[2]))).value;
};
function twoObsModel(p) {
  const t = norm(p);
  const m = t.match(new RegExp(`After (${N}) \\w+ the [\\w ]+? is (${N})%?(?: \\w+)?; after (${N}) \\w+ it is (${N})`));
  return m ? startFromPoints([[qs(m[1]), qs(m[2])], [qs(m[3]), qs(m[4])]]) : null;
}
F.twoPointModel = q => { const s = twoObsModel(q.prompt); return s ? [s.m.value, s.b.value] : undefined; };

// s2: checks
F.unitCheck = q => {
  const t = norm(q.prompt), W = wordsOf(t);
  const s = story(t.split(/ Sam writes/)[0]);
  const sam = modelIn(t.split(/Sam writes/)[1] ?? '');
  if (!W || !s || !sam) return undefined;
  if (sameMB(sam, s.m, s.b)) return -1;                       // Sam is right: no "fails" choice can be
  const k = sam.m.cmp(0) < 0 ? sam.m.neg() : sam.m;
  return choiceWhere(q, c => {
    const m = norm(c).match(new RegExp(`^It fails: (${N}) is in (\\w+), so (${N})([a-z]) is not in (\\w+); the rate in (\\w+) per (\\w+) must multiply ([a-z])$`));
    if (!m) return false;
    return qs(m[1]).eq(k) && qs(m[3]).eq(k) && m[4] === sam.x && m[8] === sam.x && (k.eq(s.b) || k.eq(s.b.neg()))
      && m[2] === W.yUnit && m[5] === W.yUnit && m[6] === W.yUnit && m[7] === W.xSing && !sam.m.eq(s.m);
  });
};
/** "102 − 6 · 9" / "5 + 45 · 9" / "45 · 9" → { a, sg, B, X } */
function evalShown(e) {
  const t = norm(e).trim();
  let m;
  if ((m = t.match(new RegExp(`^(${N}) ([+-]) (${N}) · (${N})$`)))) return { a: qs(m[1]), B: qs(m[3]).mul(m[2] === '-' ? -1 : 1), X: qs(m[4]) };
  if ((m = t.match(new RegExp(`^(${N}) · (${N})$`)))) return { a: Q(0), B: qs(m[1]), X: qs(m[2]) };
  return null;
}
F.pointCheck = q => {
  const t = norm(q.prompt), M = modelIn(t);
  const r = t.match(new RegExp(`A record says: (${N}) \\w+ → (${N})`));
  if (!M || !r) return undefined;
  const x = qs(r[1]), y = qs(r[2]), v = M.b.add(M.m.mul(x)), fits = v.eq(y);
  return choiceWhere(q, c => {
    const k = norm(c).match(new RegExp(`^(Yes|No): (.+?) = (${N}), (?:not (${N})|the data point)$`));
    if (!k) return false;
    const e = evalShown(k[2]);
    if (!e) return false;
    const shown = qs(k[3]);
    const isModel = e.a.eq(M.b) && e.B.eq(M.m) && e.X.eq(x) && e.a.add(e.B.mul(e.X)).eq(shown);
    if (k[1] === 'Yes') return fits && isModel && !k[4];
    return !fits && isModel && !!k[4] && qs(k[4]).eq(y);
  });
};

// s2: targets and limits
F.targetEq = q => {
  const t = norm(q.prompt), M = modelIn(t);
  const a = t.match(new RegExp(`exactly (${N})`));
  if (!M || !a) return undefined;
  const T = qs(a[1]);
  return choiceWhere(q, c => {
    const r = relOf(c);
    if (!r || r.rel !== '=') return false;
    const d = linAdd(r.L, r.R, -1), vs = varsOf(d);
    if (vs.length !== 1 || vs[0] !== M.x) return false;
    return sameRel(d, lin({ [M.x]: M.m }, M.b.sub(T)));
  });
};
function sameRel(a, b) {
  const va = varsOf(a)[0], vb = varsOf(b)[0];
  if (va !== vb) return false;
  const s = a.k[va].div(b.k[vb]);
  return a.c.eq(b.c.mul(s)) && s.cmp(0) > 0;
}
F.targetValue = q => {
  const r = relOf(texPlain(q.board));
  if (!r || r.rel !== '=') return undefined;
  const d = linAdd(r.L, r.R, -1), v = varsOf(d)[0];
  return v ? d.c.neg().div(d.k[v]).value : undefined;
};
F.phraseIneq = q => {
  const t = norm(q.prompt), W = wordsOf(t);
  const m = t.match(new RegExp(`condition "(?:the [\\w ]+? must be|there must be) (.+?) (${N})(?:%| [a-z]+)?" with a symbol`));
  if (!W || !m) return undefined;
  const sym = symOf(m[1]);
  const v = /condition "there must be/.test(t) ? W.x : W.y;
  const T = qs(m[2]);
  return choiceWhere(q, c => {
    const k = norm(c).match(new RegExp(`^([A-Za-z]) (≤|≥|<|>|=) (${N})$`));
    return !!k && k[1] === v && k[2] === sym && qs(k[3]).eq(T);
  });
};
F.budgetIneq = q => {
  const t = norm(q.prompt), M = modelIn(t);
  const m = t.match(new RegExp(`Someone (.+?) (${N})`));
  if (!M || !m) return undefined;
  const sym = symOf(m[1]), T = qs(m[2]);
  return choiceWhere(q, c => {
    const r = relOf(c);
    if (!r || r.rel !== sym || !isConst(r.R) || !r.R.c.eq(T)) return false;
    const e = mbOfExpr(r.ls);
    return !!e && e.v === M.x && e.m.eq(M.m) && e.b.eq(M.b);
  });
};

// s3: whole numbers or any amount
const COUNTED = /^(?:monthly payments made|smoothies bought|tickets bought|posters printed|games played|months of membership|weeks of saving|coffees bought|boxes|tickets|posters|hours billed)$/;
const MEASURED = /^(?:hours of video|hours of burning|hours of driving|hours on the water|weeks of growth|minutes of filling|minutes of draining|miles driven|hours of work)$/;
F.discreteOrNot = q => {
  const t = norm(q.prompt);
  const m = t.match(/The input is the (.+?)\. Which/);
  if (!m) return undefined;
  const inp = m[1];
  let whole = null;
  if (/^(?:distance|weight|time since)|gallons|pounds/.test(inp)) whole = false;
  else if (/^number of (?:tickets|coffees bought|boxes|posters|hours billed|smoothies|games)$/.test(inp)) whole = true;
  if (whole === null) return undefined;
  return choiceWhere(q, c => (whole ? /^Whole numbers only/ : /^Any number from 0 up, decimals too$/).test(norm(c)));
};
F.graphForm = q => {
  const t = norm(q.prompt);
  const m = t.match(/given what [a-z] \(the ([\w ]+?)\) means/);
  if (!m) return undefined;
  const whole = COUNTED.test(m[1]) ? true : MEASURED.test(m[1]) ? false : null;
  if (whole === null) return undefined;
  return choiceWhere(q, c => (whole ? /^Only separate dots, at 0, 1, 2/ : /^A solid line from x = 0 on$/).test(norm(c)));
};

// s3: bounds
const zeroOf = M => M.b.neg().div(M.m);
F.boundIneq = q => {
  const t = norm(q.prompt);
  let want;
  let m;
  if ((m = t.match(/has (\d+) seats\. Ticket revenue is R = \d+n/))) want = closed(Q(0), qs(m[1]), true);
  else if ((m = t.match(new RegExp(`T = (.+?) gives the temperature in °F, t hours after \\d+ [ap]m, for (${N}) ≤ t ≤ (${N})`)))) {
    const e = mbOfExpr(m[1]);
    if (!e) return undefined;
    const a = e.b.add(e.m.mul(qs(m[2]))), b = e.b.add(e.m.mul(qs(m[3])));
    want = a.cmp(b) <= 0 ? closed(a, b) : closed(b, a);
  } else {
    const M = modelIn(t);
    if (!M || M.m.cmp(0) >= 0) return undefined;
    want = closed(Q(0), zeroOf(M));
  }
  return choiceWhere(q, c => sameIv(intervalOf(c), want));
};
F.emptyTime = q => { const M = modelIn(q.prompt); return M && M.m.cmp(0) < 0 ? zeroOf(M).value : undefined; };
F.feasible = q => {
  const t = norm(q.prompt), M = modelIn(t);
  const cap = t.match(new RegExp(`pay at most (${N})`));
  if (!M || !cap) return undefined;
  const hiB = qs(cap[1]).sub(M.b).div(M.m);
  let lo = Q(0), hi = hiB, m;
  if ((m = t.match(new RegExp(`at least (${N}) hours?`)))) lo = qs(m[1]);
  else if ((m = t.match(new RegExp(`(?:closes in|only) (${N}) hours?`)))) { const k = qs(m[1]); if (k.cmp(hi) < 0) hi = k; }
  else return undefined;
  const c0 = lo.cmp(hi);
  return choiceWhere(q, c => {
    const s = norm(c);
    if (/^No value works/.test(s)) return c0 > 0;
    const o = s.match(new RegExp(`^Only ([a-z]) = (${N})$`));
    if (o) return c0 === 0 && qs(o[2]).eq(lo);
    return c0 < 0 && sameIv(intervalOf(s), closed(lo, hi));
  });
};
F.feasibleMax = q => {
  const t = norm(q.prompt), M = modelIn(t);
  const b = t.match(new RegExp(`The budget is (${N}), and (.+?)\\. What is the greatest`));
  if (!M || !b) return undefined;
  const cap = numsQ(b[2]);
  if (cap.length !== 1) return undefined;
  const byBudget = qs(b[1]).sub(M.b).div(M.m);
  return Math.min(floorQ(byBudget), cap[0].value);
};

// s3: the whole-number boundary
function boundaryAnswer(board) {
  const r = relOf(texPlain(board));
  if (!r || !isConst(r.R)) return null;
  const v = varsOf(r.L)[0];
  if (!v) return null;
  const a = r.L.k[v], c = r.L.c, T = r.R.c;
  const x = T.sub(c).div(a);
  const ok = n => holds(c.add(a.mul(n)), r.rel, T);
  let n;
  if ((r.rel === '≥' || r.rel === '>') === (a.cmp(0) > 0)) { n = Math.max(0, ceilQ(x) - 1); while (!ok(n)) n++; }
  else { n = floorQ(x) + 1; while (n >= 0 && !ok(n)) n--; }
  return { n, x, a, c, T, rel: r.rel, at: k => c.add(a.mul(k)) };
}
F.wholeBoundary = q => { const r = boundaryAnswer(q.board); return r && r.n >= 0 ? r.n : undefined; };
F.boundaryWhy = q => {
  const r = boundaryAnswer(q.board);
  if (!r) return undefined;
  return choiceWhere(q, c => {
    const s = norm(c);
    let m;
    if ((m = s.match(new RegExp(`^(${N}), because (${N}) \\w+ give (${N}), short of (${N})$`)))) {
      const k = qs(m[2]);
      return qs(m[1]).eq(r.n) && k.eq(r.n - 1) && r.at(k).eq(qs(m[3])) && qs(m[4]).eq(r.T) && !holds(r.at(k), r.rel, r.T);
    }
    if ((m = s.match(new RegExp(`^(${N}), because (${N}) \\w+ would cost (${N}), over (${N})$`)))) {
      const k = qs(m[2]);
      return qs(m[1]).eq(r.n) && k.eq(r.n + 1) && r.at(k).eq(qs(m[3])) && qs(m[4]).eq(r.T) && !holds(r.at(k), r.rel, r.T);
    }
    if ((m = s.match(new RegExp(`^(${N}), because (${N}) \\w+ raise exactly (${N}), not more$`)))) {
      const k = qs(m[2]);
      return qs(m[1]).eq(r.n) && k.eq(r.n - 1) && r.at(k).eq(qs(m[3])) && qs(m[3]).eq(r.T) && r.rel === '>';
    }
    return false;                                              // "nearest", "always round up", "drop the decimal", "the exact solution"
  });
};

// s3: exact targets
F.exactOrNot = q => {
  const t = norm(q.prompt), M = modelIn(t);
  const a = t.match(new RegExp(`Can the total be exactly (${N})\\?`));
  if (!M || !a) return undefined;
  const T = qs(a[1]), x = T.sub(M.b).div(M.m);
  const inv = t.match(new RegExp(`(?:Only (${N}) \\w+ are left|paper for only (${N}) posters|holds at most (${N}) games)`));
  const cap = inv ? qs(inv[1] ?? inv[2] ?? inv[3]) : null;
  const reach = isWhole(x) && x.cmp(0) >= 0 && (!cap || x.cmp(cap) <= 0);
  return choiceWhere(q, c => {
    const s = norm(c);
    let m;
    if ((m = s.match(new RegExp(`^Yes: (${N}) \\w+ costs? exactly (${N})$`)))) return reach && qs(m[1]).eq(x) && qs(m[2]).eq(T);
    if ((m = s.match(new RegExp(`^No: (${N}) cannot be reached exactly$`)))) return !reach && qs(m[1]).eq(T);
    if ((m = s.match(new RegExp(`^No: it would take (${N}) \\w+, not a whole number$`)))) return !isWhole(x) && x.cmp(0) >= 0 && shows(m[1], x);
    if ((m = s.match(new RegExp(`^No: it would take (${N}) \\w+, a negative count$`)))) return x.cmp(0) < 0 && shows(m[1], x);
    if ((m = s.match(new RegExp(`^No: it takes (${N}) \\w+, and only (${N}) are available$`)))) return isWhole(x) && !!cap && x.cmp(cap) > 0 && qs(m[1]).eq(x) && qs(m[2]).eq(cap);
    return false;
  });
};
F.reachable = q => {
  const M = modelIn(q.prompt);
  if (!M) return undefined;
  return choiceWhere(q, c => { const v = tryQ(c); if (!v) return false; const x = v.sub(M.b).div(M.m); return isWhole(x) && x.cmp(0) >= 0; });
};

// s3: validity
F.validInterval = q => {
  const t = norm(q.prompt);
  let hi, good, m;
  if ((m = t.match(new RegExp(`uses (${N}) sheets per minute from a tray of (${N}) sheets`)))) { hi = qs(m[2]).div(qs(m[1])); good = /used up/; }
  else if ((m = t.match(new RegExp(`plus (${N}) per mile for the first (${N}) miles; after (${N}) miles the rate per mile changes`)))) { hi = qs(m[2]); good = /holds only/; }
  else {
    const M = modelIn(t);
    if (!M || M.m.cmp(0) >= 0) return undefined;
    hi = zeroOf(M); good = /is empty|burned down|reach the beach/;
  }
  return choiceWhere(q, c => {
    const s = norm(c);
    const k = s.match(new RegExp(`^(${N}) ≤ ([a-z]) ≤ (${N}) \\w+: (.+)$`));
    if (!k || !qs(k[1]).eq(0) || !qs(k[3]).eq(hi) || !good.test(k[4])) return false;
    const at = k[4].match(new RegExp(`^at (?:[a-z] = )?(${N}) `));
    return !at || qs(at[1]).eq(hi);
  });
};
F.extrapolate = q => {
  const t = norm(q.prompt), M = modelIn(t);
  let m;
  if ((m = t.match(/from (\d{4}) to (\d{4}) fits .*?\(t = years since (\d{4})\)\. Someone uses it to predict (\d{4}) \(t = (\d+)\)/))) {
    const lo = Number(m[1]) - Number(m[3]), hi = Number(m[2]) - Number(m[3]), T = Number(m[4]) - Number(m[3]);
    return choiceWhere(q, c => {
      const k = norm(c).match(new RegExp(`^Not reliable: the data cover only t = (${N}) to (${N}), and nothing shows the rate stays (${N}) per year for (${N}) more years$`));
      return !!k && M && qs(k[1]).eq(lo) && qs(k[2]).eq(hi) && qs(k[3]).eq(M.m) && qs(k[4]).eq(T - hi);
    });
  }
  if ((m = t.match(new RegExp(`from (\\d{4}) to (\\d{4}) fits .*?\\(t = years since (\\d{4})\\)\\. At t = (${N}) the model gives (${N})`)))) {
    const lo = Number(m[1]) - Number(m[3]), hi = Number(m[2]) - Number(m[3]);
    const v = M ? M.b.add(M.m.mul(qs(m[4]))) : null;
    return choiceWhere(q, c => {
      const k = norm(c).match(new RegExp(`^The model has been used far outside its data \\((${N}) ≤ t ≤ (${N})\\); a negative count shows it no longer applies$`));
      return !!k && !!v && v.cmp(0) < 0 && qs(k[1]).eq(lo) && qs(k[2]).eq(hi) && qs(m[4]).cmp(hi) > 0;
    });
  }
  return undefined;
};

// ---------------------------------------------------------------- sane: the world for a 14-18-year-old
function sane(q) {
  const f = q.family, t = norm(q.prompt);
  const M = modelIn(t), W = wordsOf(t);
  if (/must be does not exceed/.test(t)) return 'garbled wording: "must be does not exceed"';
  if (f === 'isLinearStory') {
    const T = q.data?.picture?.t;
    if (T && T.xs?.length >= 3) {
      const ys = T.ys.map(qs), d = ys.slice(1).map((y, i) => y.sub(ys[i]));
      const lin = d.every(x => x.eq(d[0]));
      const said = !/speeds up|double|% of its balance/.test(t);
      if (lin !== said) return `the table (${T.ys.join(', ')}) does not match the story`;
    }
  }
  if (f === 'startValue') {
    const P = arrowPairs(t);
    if (P.length >= 2) { const s = startFromPoints(P); if (!s.fits) return 'the log is not on one line'; if (s.b.cmp(0) < 0) return `the start is ${s.b}`; }
  }
  if (f === 'startGraph') { const s = startFromPoints(pointsOf(t)); if (s && !s.fits) return 'the points are not on one line'; if (s && s.b.cmp(0) < 0) return `the start is ${s.b}`; }
  if (f === 'rateTable') { const s = startFromPoints(arrowPairs(t)); if (s && !s.fits) return 'the log is not on one line'; }
  if (f === 'doubleTest') {
    const s = story(firstSentence(t));
    const g = t.match(new RegExp(`\\. (${N}) [\\w ]+ cost (${N})\\.`));
    if (s && g && !s.b.add(s.m.mul(qs(g[1]))).eq(qs(g[2]))) return `the given ${g[1]} → ${g[2]} does not match the story`;
  }
  if (['modelPair', 'drainModel', 'buildModel', 'graphForm', 'unitCheck', 'defineVars'].includes(f)) {
    const s = story(t.split(/ Let | Write the model| The graph draws| Sam writes| In the model/)[0].replace(/^.*?depends on [\w ]+: /, ''));
    if (s && s.b.cmp(0) <= 0 && !/no other charge|no base pay/.test(t)) return `the story starts at ${s.b}`;
    if (s && /%/.test(t) && s.b.cmp(100) > 0) return `a battery at ${s.b}%`;
  }
  if (f === 'rateTwoPoints' || f === 'twoPointModel') {
    const P = f === 'rateTwoPoints' ? twoObs(t) : null;
    const s = P ? startFromPoints(P) : twoObsModel(t);
    if (s) {
      if (/amount owed|water left|distance left|candle height|card balance|battery/.test(t) && s.m.cmp(0) >= 0) return 'an amount that should go down does not';
      if (/total paid|bill|fare|order total|savings|cost/.test(t) && !/amount owed|card balance/.test(t) && s.m.cmp(0) <= 0) return 'a total that should grow does not';
      if (s.b.cmp(0) < 0) return `the start would be ${s.b}`;
    }
  }
  if (f === 'backStart') { const v = F.backStart(q); if (v !== undefined && v < 0) return `the start would be ${v}`; }
  if ((f === 'targetValue' || f === 'targetEq') && M) {
    const r = f === 'targetValue' ? relOf(texPlain(q.board)) : null;
    const T = r ? r.R.c : tryQ(t.match(new RegExp(`exactly (${N})`))?.[1] ?? '');
    if (T) {
      const x = T.sub(M.b).div(M.m);
      if (x.cmp(0) < 0) return `the target is reached at ${x}, before the start`;
      if (W && COUNTED.test(W.xName) && !isWhole(x)) return `an exact target at ${x} ${W.xName}`;
    }
  }
  if (f === 'feasible' && M) {
    const g = t.match(new RegExp(`pay at most (${N}), so .*?, which gives h ≤ (${N})`));
    if (g && !qs(g[1]).sub(M.b).div(M.m).eq(qs(g[2]))) return `the budget gives h ≤ ${qs(g[1]).sub(M.b).div(M.m)}, not ${g[2]}`;
  }
  if (f === 'wholeBoundary' || f === 'boundaryWhy') {
    const r = boundaryAnswer(q.board);
    const g = t.match(new RegExp(`(?:gives the boundary|Solving gives t > ) ?(${N})`));
    if (r && g && !shows(g[1], r.x)) return `the stated boundary ${g[1]} is not ${r.x}`;
    if (r && isWhole(r.x) && (r.rel === '≤' || r.rel === '≥')) return 'the boundary is a whole number: no rounding to decide';
  }
  if (f === 'extrapolate' && M) {
    const g = t.match(new RegExp(`At t = (${N}) the model gives (${N})`));
    if (g && !M.b.add(M.m.mul(qs(g[1]))).eq(qs(g[2]))) return `the model gives ${M.b.add(M.m.mul(qs(g[1])))} at t = ${g[1]}, not ${g[2]}`;
    const y = t.match(/predict (\d{4}) \(t = (\d+)\).*?/), s = t.match(/years since (\d{4})/);
    if (y && s && Number(y[1]) - Number(s[1]) !== Number(y[2])) return 'the year and t do not match';
  }
  if (f === 'rateWords' && M && M.m.eq(M.b)) return 'the rate and the start are the same number';
  if (f === 'emptyTime' || f === 'boundIneq' || f === 'validInterval') {
    if (M && M.m.cmp(0) < 0 && /%/.test(t) && M.b.cmp(100) > 0) return `a battery at ${M.b}%`;
  }
  return '';
}

function solve(q) {
  const fn = F[q.family];
  return fn ? fn(q) : undefined;
}

export default { solve, sane };
