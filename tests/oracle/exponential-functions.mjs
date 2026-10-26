// Oracle for the lesson "exponential-functions" (Algebra 1, lesson 13: exponential growth and decay; 26 sub-goals,
// 54 families; HSF-LE.A.1-3, HSF-IF.C.8.b, HSF-BF.A.1). Role O of docs/lessons/QUALITY_LAYER.md: every item is worked
// out from what the student sees: the prompt and the choices as HTML (so 2^(t/6), (1.01)^(12t) keep their exponent
// grouping), the board, and the drawn table / points / curves. Students are 14-18, so sane() also judges whether
// rates, prices, populations and amounts are believable.
//
// Method: formulas the student reads (f(t) = 7 · 5^t, E(t) = 100(1.1)^t, y = 2^(2t + 1), g(t + 1) ÷ g(t) = …) are parsed
// into expression trees over the variable (t, x or n) and evaluated in doubles; answers are cleaned of float noise
// (12 significant digits) or rounded exactly as the prompt states. Stories are read into a start value, a factor per
// period and a count of periods. Choices that make a claim are tested claim by claim.
import { round } from '../../tools/quality/oracle-kit.mjs';

// ---------------------------------------------------------------- text
const num = s => (s === null || s === undefined ? null : Number(String(s).replace(/[−–]/g, '-').replace(/[,$\s]/g, '')));
const clean = v => Number(Number(v).toPrecision(12));
const close = (a, b, eps = 1e-9) => Math.abs(a - b) <= eps * Math.max(1, Math.abs(a), Math.abs(b));

/** HTML (or plain) → normalized text: x^{e}, '-' for minus, '*' for · and ×, '/' for ÷, no thousands commas */
function txt(html) {
  let s = String(html ?? '');
  s = s.replace(/<sup>(.*?)<\/sup>/g, '^{$1}').replace(/<sub>(.*?)<\/sub>/g, '_{$1}').replace(/<[^>]+>/g, '')
    .replace(/&nbsp;|&#8202;|&#8201;|&thinsp;/g, ' ').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&')
    .replace(/½/g, '(1/2)').replace(/[−–]/g, '-').replace(/[·×]/g, '*').replace(/÷/g, '/').replace(/…/g, '...').replace(/’/g, "'")
    .replace(/(\d),(\d{3})(?!\d)/g, '$1$2').replace(/(\d),(\d{3})(?!\d)/g, '$1$2')
    .replace(/\s+/g, ' ').trim();
  return s;
}
const P = q => txt(q.promptHtml ?? q.prompt);
const C = q => (q.choicesHtml ?? q.choices ?? []).map(txt);
const B = q => txt(String(q.board ?? '').replace(/\\[dt]?frac\{([^{}]*)\}\{([^{}]*)\}/g, '($1/$2)').replace(/\\text\{([^{}]*)\}/g, '$1')
  .replace(/\\cdot/g, '*').replace(/\\left|\\right/g, '').replace(/\\(?:qquad|quad|[,;:! ])/g, ' ').replace(/\{,\}/g, ',').replace(/\\%/g, '%').replace(/\\\$/g, '$'));

// ---------------------------------------------------------------- expressions
/**
 * Parse an expression from the start of s. Returns { f: env => number, end } for the longest prefix that is an
 * expression, or null. env = { t/x/n: number, call(name, value) }. Function calls name(…) only for names in `fns`.
 */
function parseAt(s, fns = '') {
  let i = 0;
  const ws = () => { while (s[i] === ' ') i++; };
  const peekCh = () => { ws(); return s[i]; };
  function number() {
    ws();
    const m = s.slice(i).match(/^\d+(?:\.\d+)?|^\.\d+/);
    if (!m) return null;
    i += m[0].length;
    const v = Number(m[0]);
    return () => v;
  }
  function primary() {
    ws();
    const c = s[i];
    if (c === '(') {
      const save = i; i++;
      const e = expr();
      if (!e || peekCh() !== ')') { i = save; return null; }
      i++;
      return e;
    }
    if (c === '{') {
      const save = i; i++;
      const e = expr();
      if (!e || peekCh() !== '}') { i = save; return null; }
      i++;
      return e;
    }
    if (/[0-9.]/.test(c ?? '')) return number();
    if (/[A-Za-z]/.test(c ?? '') && !/[A-Za-z]/.test(s[i + 1] ?? '')) {
      if (fns.includes(c) && s[i + 1] === '(') {
        const save = i; i += 2;
        const a = expr();
        if (!a || peekCh() !== ')') { i = save; return null; }
        i++;
        return e => e.call(c, a(e));
      }
      if ('txn'.includes(c)) { i++; return e => e[c]; }
    }
    return null;
  }
  function power() {
    const b = primary();
    if (!b) return null;
    ws();
    if (s[i] === '^') {
      const save = i; i++;
      const x = primary();
      if (!x) { i = save; return b; }
      return e => b(e) ** x(e);
    }
    return b;
  }
  function unary() {
    ws();
    if (s[i] === '-') { const save = i; i++; const g = unary(); if (!g) { i = save; return null; } return e => -g(e); }
    return power();
  }
  function term() {
    let f = unary();
    if (!f) return null;
    for (;;) {
      ws();
      const c = s[i];
      if (c === '*' || c === '/') {
        const save = i; i++;
        const g = unary();
        if (!g) { i = save; return f; }
        const a = f; f = c === '*' ? e => a(e) * g(e) : e => a(e) / g(e);
        continue;
      }
      if (c === '(' || c === '{' || /[0-9A-Za-z]/.test(c ?? '')) {
        // implicit multiplication: 100(1.1)^t, 2t, 25t
        const save = i;
        const g = power();
        if (!g) { i = save; return f; }
        const a = f; f = e => a(e) * g(e);
        continue;
      }
      return f;
    }
  }
  function expr() {
    let f = term();
    if (!f) return null;
    for (;;) {
      const save = i;
      ws();
      const c = s[i];
      if (c === '+' || (c === '-' && s[i + 1] === ' ')) {
        i++;
        const g = term();
        if (!g) { i = save; return f; }
        const a = f; f = c === '+' ? e => a(e) + g(e) : e => a(e) - g(e);
        continue;
      }
      i = save;
      return f;
    }
  }
  const f = expr();
  return f ? { f, end: i } : null;
}
const parseAll = (s, fns) => { const r = parseAt(s, fns); return r && s.slice(r.end).trim() === '' ? r.f : null; };
const at = (f, v, extra = {}) => f({ t: v, x: v, n: v, ...extra });

/** every definition NAME(var) = expr in a text: { name: { v, f } } */
function defs(s) {
  const out = {};
  for (const m of s.matchAll(/(?<![A-Za-z])([A-Za-z])\(([txn])\) = /g)) {
    const r = parseAt(s.slice(m.index + m[0].length));
    if (r) out[m[1]] = { v: m[2], f: r.f };
  }
  return out;
}
/** y = expr (first one) */
function yDef(s) {
  const m = s.match(/(?<![A-Za-z])y = /);
  if (!m) return null;
  const r = parseAt(s.slice(m.index + m[0].length));
  return r ? r.f : null;
}
/** the one model in a text: a named definition, else y = … */
function model(s) {
  const d = Object.values(defs(s));
  if (d.length) return d[0].f;
  return yDef(s);
}

// ---------------------------------------------------------------- tables and pictures
function table(q) {
  const t = q.data?.picture?.t;
  if (!t) return null;
  return { name: t.tName, ts: t.ts.map(num), cols: t.cols.map(c => ({ name: c.name, vals: c.vals.map(v => (v === null ? null : num(v))) })) };
}
/** (x, y) pairs of the first column (known values only) */
const rowsOf = (T, col = 0) => T.ts.map((x, k) => [x, T.cols[col].vals[k]]).filter(([, y]) => y !== null);
/** per-unit factor if every gap gives the same one, else null */
function unitFactor(rows) {
  let b = null;
  for (let k = 1; k < rows.length; k++) {
    const [x0, y0] = rows[k - 1], [x1, y1] = rows[k];
    const f = (y1 / y0) ** (1 / (x1 - x0));
    if (b === null) b = f; else if (!close(b, f, 1e-9)) return null;
  }
  return b;
}

// ---------------------------------------------------------------- rounding
function place(s) {
  if (/nearest cent/.test(s)) return 2;
  if (/thousandth/.test(s)) return 3;
  if (/hundredth/.test(s)) return 2;
  if (/tenth/.test(s)) return 1;
  const dp = s.match(/to (\d+) decimal places?/);
  if (dp) return Number(dp[1]);
  if (/nearest whole|nearest dollar|whole fish|nearest (?:fish|person|bacteri)/.test(s)) return 0;
  return null;
}
const roundAs = (v, s) => { const p = place(s); return p === null ? clean(v) : round(v, p); };
const nearTie = (v, p) => { const k = Math.abs(v) * 10 ** p; return Math.abs(k - Math.floor(k) - 0.5) < 1e-6; };

/** the amount at the start of a story: $1,500 / 650 mg / 12,000 residents / 80 grams */
function startAmount(s) {
  const m = s.match(/\$([\d.]+)|([\d.]+) (?:grams|mg|residents|people|fish|bacteria|cells|gallons|members|users)/);
  return m ? num(m[1] ?? m[2]) : null;
}

// ---------------------------------------------------------------- choice helpers
const pickIdx = (q, pred) => { const hits = C(q).map((c, i) => (pred(c, i) ? i : -1)).filter(i => i >= 0); return hits.length === 1 ? hits[0] : -1; };
const pctNum = s => { const m = s.match(/(\d+(?:\.\d+)?)%/); return m ? Number(m[1]) / 100 : null; };

/** compounding periods per year from a word */
function perYear(s) {
  if (/compounded daily/.test(s)) return 365;
  if (/compounded weekly/.test(s)) return 52;
  if (/compounded monthly/.test(s)) return 12;
  if (/compounded quarterly/.test(s)) return 4;
  if (/compounded semiannually|compounded twice a year|compounded every half year/.test(s)) return 2;
  if (/compounded (?:yearly|annually)/.test(s)) return 1;
  return null;
}

/** a story's factor per period: "grows 20%", "loses 15% of its value", "half of it decays", "doubles" */
function storyFactor(s) {
  if (/\bhalf of (?:it|its|what)/.test(s) || /\bhalves\b/.test(s)) return 0.5;
  if (/\bdoubles\b/.test(s)) return 2;
  if (/\btriples\b/.test(s)) return 3;
  const p = pctNum(s);
  if (p === null) return null;
  if (/\b(?:loses|lose|drops|falls|shrinks|decays|decreases|declines|drains|removes|removed)\b/.test(s)) return 1 - p;
  if (/\b(?:grows|gains|rises|increases|earns|interest|growth)\b/.test(s)) return 1 + p;
  return null;
}

// ---------------------------------------------------------------- the families
const F = {
  continueTable(q) {
    const p = P(q), T = table(q), rows = rowsOf(T);
    const b = unitFactor(rows);
    const m = p.match(/in (?:hour|day|week|step|year|month|minute) (\d+)\?/);
    if (b === null || !m) return null;
    const [x, y] = rows[rows.length - 1];
    return clean(y * b ** (Number(m[1]) - x));
  },
  twoPlans(q) {
    const p = P(q);
    const S = num(p.match(/start with ([\d.]+)/)[1]), G = num(p.match(/gain ([\d.]+) \w+ in the first/)[1]);
    const Fc = num(p.match(/multiplying by ([\d.]+)/)[1]), k = num(p.match(/After (\d+) hours/)[1]);
    return clean(S * Fc ** k - (S + G * k));
  },
  decaySubtract(q) {
    const p = P(q);
    const A = num(p.match(/holds ([\d.]+)/)[1]), r = pctNum(p), k = num(p.match(/after (\d+) (?:hours?|days?|years?|weeks?|months?|minutes?)/)[1]);
    return clean(A * (1 - r) ** k);
  },
  decayPick(q) {
    return pickIdx(q, c => { const b = num(c.match(/b = (-?[\d.]+)/)?.[1]); return b > 0 && b < 1; });
  },
  classifyTable(q) {
    const T = table(q), y = T.cols[0].vals, x = T.ts;
    if (!x.every((v, k) => k === 0 || close(v - x[k - 1], 1))) return null;
    const d = y.slice(1).map((v, k) => v - y[k]), r = y.slice(1).map((v, k) => v / y[k]);
    const lin = d.every(v => close(v, d[0])), exp = r.every(v => close(v, r[0]));
    if (lin && exp) return null;
    return pickIdx(q, c => (lin ? /^Linear/.test(c) : exp ? /^Exponential/.test(c) : /^Neither/.test(c)));
  },
  roundedRatios(q) {
    const y = table(q).cols[0].vals, r = y.slice(1).map((v, k) => v / y[k]);
    const exact = r.every(v => close(v, r[0], 1e-12));
    return pickIdx(q, c => (exact ? /^Yes/.test(c) : /^No/.test(c)));
  },
  stepTwo(q) {
    const T = table(q), b = unitFactor(rowsOf(T));
    return b === null ? null : clean(b);
  },
  unequalGaps(q) {
    const b = unitFactor(rowsOf(table(q)));
    return pickIdx(q, c => /per 1 unit of x/.test(c) && (b !== null ? /^Yes/.test(c) && /is the same/.test(c) : /^No/.test(c) && /is not the same/.test(c)));
  },
  situationType(q) {
    const p = P(q);
    let kind = null;
    const fixedAmount = /(?:of|on) (?:its|the|their) (?:original|starting|first)|simple interest/.test(p);
    const DOWN = /\b(?:loses|drops|falls|shrinks|decays|decreases|declines|drains|burns|uses|removes|removed|taken|spends)\b/;
    const UP = /\b(?:grows|gains|rises|increases|earns|adds|added|saves|plants|pays)\b/;
    if (/\bdoubles\b|\btriples\b/.test(p)) kind = 'eg';
    else if (/\bhalves\b|half of (?:what|its|it)/.test(p)) kind = 'ed';
    else if (/%/.test(p) && !fixedAmount) kind = DOWN.test(p) ? 'ed' : UP.test(p) ? 'eg' : null;
    else kind = DOWN.test(p) ? 'ld' : UP.test(p) ? 'lg' : null;
    if (!kind) return null;
    const re = { lg: /^Linear growth/, ld: /^Linear decay/, eg: /^Exponential growth/, ed: /^Exponential decay/ }[kind];
    return pickIdx(q, c => re.test(c));
  },
  simpleVsCompound(q) {
    const p = P(q);
    const Pm = num(p.match(/deposits \$([\d.]+)/)[1]), r = pctNum(p), n = num(p.match(/After (\d+) years/)[1]);
    return round(Pm * (1 + r) ** n - Pm * (1 + r * n), 6);
  },
  overtake(q) {
    const d = defs(P(q)), E = d.E?.f, L = d.L?.f;
    if (!E || !L) return null;
    for (let t = 0; t <= 2000; t++) if (at(E, t) > at(L, t)) return t;
    return null;
  },
  aheadForever(q) {
    const d = defs(P(q)), E = d.E.f, L = d.L.f;
    let first = null;
    for (let t = 0; t <= 5000; t++) if (at(E, t) > at(L, t)) { first = t; break; }
    // after the first pass, does E stay ahead? (check a long run)
    let stays = first !== null;
    if (first !== null) for (let t = first; t <= first + 500; t++) if (!(at(E, t) > at(L, t))) stays = false;
    return pickIdx(q, c => {
      if (/^E passes L at some t, and stays ahead/.test(c)) return first !== null && stays;
      if (/later L catches up/.test(c)) return first !== null && !stays;
      if (/^They never meet/.test(c)) return first === null;
      if (/^L stays ahead for every t/.test(c)) return first === null;
      return false;
    });
  },
  decayVsLinear(q) {
    const p = P(q);
    const S = num(p.match(/each hold ([\d.]+)/)[1]), d = num(p.match(/drains ([\d.]+)/)[1]);
    const hA = S / d;
    return pickIdx(q, c => {
      let m;
      if ((m = c.match(/^A is empty after (\d+) hours; B is never exactly empty$/))) return close(Number(m[1]), hA);
      return false; // B (halving) is never empty, A (a fixed amount) empties: every other claim says otherwise
    });
  },
  evalModel(q) {
    const p = P(q), d = defs(p), name = Object.keys(d)[0];
    const m = p.match(new RegExp(`Find ${name}\\((-?[\\d.]+)\\)`));
    return clean(at(d[name].f, Number(m[1])));
  },
  formFromTable(q) {
    const b = B(q), m = b.match(/t: ([-\d., ]+?) y: ([-\d., ]+)$/);
    const ts = m[1].split(', ').map(Number), ys = m[2].split(', ').map(Number);
    return pickIdx(q, c => { const f = yDef(c); return !!f && ts.every((t, k) => close(at(f, t), ys[k])); });
  },
  readA(q) {
    return clean(at(model(P(q)), 0));
  },
  readATable(q) {
    const rows = rowsOf(table(q)), b = unitFactor(rows);
    if (b === null) return null;
    const [x, y] = rows[0];
    return clean(y * b ** (0 - x));
  },
  growOrDecay(q) {
    const f = model(P(q)), a = at(f, 0), r = at(f, 1) / a;
    if (!(a > 0)) return null;
    return pickIdx(q, c => (close(r, 1) ? /^Neither/.test(c) : r > 1 ? /^Growth/.test(c) : /^Decay/.test(c)));
  },
  pickModel(q) {
    const want = /growth/.test(P(q)) ? 'g' : /decay/.test(P(q)) ? 'd' : null;
    return pickIdx(q, c => {
      const f = yDef(c);
      if (!f) return false;
      const a = at(f, 0), r = at(f, 1) / a, r2 = at(f, 2) / at(f, 1);
      if (!(a > 0) || !close(r, r2)) return false;
      return want === 'g' ? r > 1 && !close(r, 1) : r < 1 && r > 0 && !close(r, 1);
    });
  },
  matchPoints(q) {
    const it = q.data.picture.g.items.find(i => i.kind === 'pts');
    const pts = it.xs.map(x => [x, it.a * it.b ** x]);
    return pickIdx(q, c => { const f = yDef(c); return !!f && pts.every(([x, y]) => close(at(f, x), y)); });
  },
  twoGraphs(q) {
    const T = table(q);
    const fac = col => unitFactor(rowsOf(T, col));
    const A = fac(T.cols.findIndex(c => c.name === 'amber')), Bf = fac(T.cols.findIndex(c => c.name === 'teal'));
    if (A === null || Bf === null) return null;
    return pickIdx(q, c => (close(A, Bf) ? /^Both have the same/.test(c) : A > Bf ? /^The amber/.test(c) : /^The teal/.test(c)));
  },
  decayPoints(q) {
    const f = model(P(q)), a = at(f, 0), b = at(f, 1) / a;
    return pickIdx(q, c => {
      const m = c.match(/^They keep (\w+) \(([\d.]+), ([\d.]+), \.\.\.\) and stay above 0$/);
      if (!m) return false;
      const word = { halving: 0.5, 'dropping to a third': 1 / 3 }[m[1]];
      return (word === undefined || close(word, b)) && close(Number(m[2]), at(f, 5)) && close(Number(m[3]), at(f, 6)) && b > 0 && b < 1 && a > 0;
    });
  },
  rangeChoice(q) {
    const f = yDef(P(q)), a = at(f, 0), b = at(f, 1) / a;
    if (!(b > 0) || close(b, 1)) return null;
    return pickIdx(q, c => (a > 0 ? c === 'y > 0' : c === 'y < 0'));
  },
  asymptote(q) {
    const p = P(q), f = yDef(p), a = at(f, 0), b = at(f, 1) / a;
    const right = /increases \(goes right\)/.test(p), left = /decreases \(goes left\)/.test(p);
    const toZero = (right && b < 1) || (left && b > 1);
    if (!toZero || !(a > 0)) return null;
    return pickIdx(q, c => /^It approaches 0 but never reaches it$/.test(c));
  },
  domainChoice(q) {
    return pickIdx(q, c => /^All real numbers$/i.test(c));
  },
  factorTable(q) {
    let rows;
    const T = table(q);
    if (T) rows = rowsOf(T);
    else rows = q.data.picture.g.items.find(i => i.kind === 'dots').pts.map(([x, y]) => [x, y]);
    const b = unitFactor(rows);
    return b === null ? null : clean(b);
  },
  backA(q) {
    const b = B(q);
    const pts = [...b.matchAll(/y\((-?\d+)\) = (-?[\d.]+)/g)].map(m => [Number(m[1]), Number(m[2])]);
    const want = Number(b.match(/y\((-?\d+)\) = \?/)[1]);
    const fac = unitFactor(pts);
    if (fac === null) return null;
    return clean(pts[0][1] * fac ** (want - pts[0][0]));
  },
  backAWords(q) {
    const p = P(q), fac = storyFactor(p.split(/\. /)[0]);
    const k = num(p.match(/(\d+) years? after/)[1]);
    const v = num(p.match(/(?:it is|is worth|balance is|there are|it has) \$?([\d.]+)/)[1]);
    return clean(v / fac ** k);
  },
  factorToPct(q) {
    const p = P(q), m = p.match(/b = ([\d.]+) per (\w+)/);
    const b = Number(m[1]), per = m[2], r = clean(Math.abs(b - 1) * 100), dir = b > 1 ? 'increase' : 'decrease';
    return pickIdx(q, c => { const k = c.match(/^([\d.]+)% (increase|decrease) per (\w+)$/); return !!k && close(Number(k[1]), r) && k[2] === dir && k[3] === per; });
  },
  pctToFactor(q) {
    return clean(storyFactor(P(q)));
  },
  modelChoice(q) {
    const p = P(q), a = startAmount(p), fac = storyFactor(p);
    return pickIdx(q, c => { const f = model(c); return !!f && [0, 1, 2, 3, 5, 10].every(t => close(at(f, t), a * fac ** t)); });
  },
  modelPair(q) {
    const p = P(q), a = startAmount(p), fac = storyFactor(p);
    return [clean(a), clean(fac)];
  },
  predict(q) {
    const p = P(q), f = model(p);
    const k = num(p.match(/after (\d+(?:\.\d+)?) (?:years|hours|days|months|weeks|minutes)/)[1]);
    return roundAs(at(f, k), p);
  },
  kFactor(q) {
    const p = P(q), fac = storyFactor(p), k = num(p.match(/over (\d+) /)[1]);
    return roundAs(fac ** k, p);
  },
  kPercent(q) {
    const p = P(q), fac = storyFactor(p);
    const m = p.match(/over (\d+) \w+\?|over a \w+ \((\d+) \w+\)/);
    const k = num(m[1] ?? m[2]);
    return roundAs(Math.abs(fac ** k - 1) * 100, p);
  },
  twoPt(q) {
    const pts = [...P(q).matchAll(/\((-?[\d.]+), (-?[\d.]+)\)/g)].map(m => [Number(m[1]), Number(m[2])]);
    const b = unitFactor(pts);
    return b === null ? null : clean(b);
  },
  twoPtModel(q) {
    const pts = [...P(q).matchAll(/\((-?[\d.]+), (-?[\d.]+)\)/g)].map(m => [Number(m[1]), Number(m[2])]);
    const b = unitFactor(pts);
    if (b === null) return null;
    return [clean(pts[0][1] / b ** pts[0][0]), clean(b)];
  },
  periodEval(q) {
    const p = P(q), d = defs(p), name = Object.keys(d)[0];
    const m = p.match(new RegExp(`Find ${name}\\((-?[\\d.]+)\\)`));
    return clean(at(d[name].f, Number(m[1])));
  },
  periodCount(q) {
    const p = P(q);
    // the exponent of the model counts the periods
    const m = p.match(/\)?\^\{([^}]*)\}/);
    const ex = parseAll(m[1].replace(/^\((.*)\)$/, '$1'));
    const k = num(p.match(/(?:in|after) (\d+) (?:hours|years|days|months|minutes)/)[1]);
    return clean(at(ex, k));
  },
  rewritePair(q) {
    const p = P(q), m = p.match(/Rewrite y = (.+?) in the form/);
    const f = parseAll(m[1]);
    const A = at(f, 0), Bv = at(f, 1) / A;
    if (!close(at(f, 2) / at(f, 1), Bv)) return null;
    return [clean(A), clean(Bv)];
  },
  rewriteRate(q) {
    const f = model(P(q)), Y = at(f, 1) / at(f, 0);
    return /What is Y\b/.test(P(q)) ? roundAs(Y, P(q)) : roundAs((Y - 1) * 100, P(q));
  },
  compoundBalance(q) {
    const p = P(q), Pm = num(p.match(/\$([\d.]+)/)[1]), r = pctNum(p), n = perYear(p);
    const t = num(p.match(/after (\d+) years/)[1]);
    return roundAs(Pm * (1 + r / n) ** (n * t), p);
  },
  apy(q) {
    const p = P(q), r = pctNum(p), n = perYear(p);
    return roundAs(((1 + r / n) ** n - 1) * 100, p);
  },
  principalNeeded(q) {
    const p = P(q), r = pctNum(p), n = perYear(p);
    const T = num(p.match(/have \$([\d.]+)/)[1]), t = num(p.match(/in (\d+) years/)[1]);
    return roundAs(T / (1 + r / n) ** (n * t), p);
  },
  ratioProof(q) {
    const p = P(q), d = defs(p), name = Object.keys(d)[0], g = d[name].f;
    const claim = Number(p.match(/is (-?[\d.]+) for every/)[1]);
    const env = t => ({ t, x: t, n: t, call: (nm, v) => at(g, v) });
    return pickIdx(q, c => {
      const chain = c.split(/, | so | and /)[0];
      const segs = chain.split(' = ');
      if (segs.length < 2) return false;
      const fs = segs.map(s => parseAll(s, name));
      if (fs.some(f => !f)) return false;
      if (!/[(^{]t\b|\bt[ )+]/.test(segs[0])) return false; // a general t, not examples
      const ts = [0.3, 1, 2.7, -1.4, 5];
      const ok = ts.every(t => fs.every(f => close(f(env(t)), fs[0](env(t)), 1e-9)));
      return ok && close(fs[fs.length - 1](env(0.5)), claim) && /for every t/.test(c);
    });
  },
  ratioOverH(q) {
    const p = P(q), d = defs(p), name = Object.keys(d)[0], f = d[name].f;
    const h = Number(p.match(new RegExp(`${name}\\(t \\+ (\\d+)\\)`))[1]);
    return clean(at(f, 1 + h) / at(f, 1));
  },
  twoModels(q) {
    const p = P(q), d = defs(p);
    const obs = [...p.matchAll(/\((-?[\d.]+), (-?[\d.]+)\)/g)].map(m => [Number(m[1]), Number(m[2])]);
    const fits = f => obs.every(([x, y]) => close(at(f, x), y));
    const fl = fits(d.L.f), fe = fits(d.E.f);
    return pickIdx(q, c => (fl && fe ? false : fe ? /^Only the exponential/.test(c) : fl ? /^Only the linear/.test(c) : /^Neither/.test(c)));
  },
  modelCheck(q) {
    const p = P(q), f = model(p), T = table(q);
    let fail = null;
    T.ts.forEach((t, k) => { if (fail === null && !close(at(f, t), T.cols[0].vals[k])) fail = t; });
    return pickIdx(q, c => (fail === null ? /^It fits every observation$/.test(c) : c === `It first fails at t = ${fail}`));
  },
  noisyFit(q) {
    const p = P(q), f = model(p), tol = Number(p.match(/within ([\d.]+) of/)[1]), T = table(q);
    const obs = T.cols.find(c => c.name === 'observed').vals;
    const ok = T.ts.every((t, k) => Math.abs(obs[k] - at(f, t)) <= tol + 1e-9);
    return pickIdx(q, c => (ok ? /^Supports the model: every observation is within/.test(c) : /^Does not support it: some observation is more than/.test(c)));
  },
  ratioDrift(q) {
    const y = table(q).cols[0].vals, r = y.slice(1).map((v, k) => v / y[k]);
    const falling = r.every((v, k) => k === 0 || v < r[k - 1]);
    const spread = Math.max(...r) - Math.min(...r);
    if (falling && spread > 0.08) return pickIdx(q, c => /^Not exponential: the ratios keep falling/.test(c));
    if (spread <= 0.05) return pickIdx(q, c => /^Roughly exponential/.test(c));
    return null; // in between: not decidable from a rule a teacher would state
  },
  contextDomain(q) {
    const p = P(q);
    const N = Number((p.match(/year n = (\d+)|first (\d+) (?:hours|days|years|minutes)|end of year (\d+)/) ?? []).slice(1).find(Boolean));
    const v = (p.match(/[A-Z]\(([a-z])\)|\^\{([a-z])\}/) ?? []).slice(1).find(Boolean);
    const discrete = (/\bcounts?\b[^.]*once a/.test(p) || /only at the end of each/.test(p)) && !/all the time|continuously/.test(p);
    const continuous = /all the time|continuously/.test(p);
    if (discrete === continuous) return null;
    return pickIdx(q, c => (discrete ? c === `${v} = 0, 1, 2, ..., ${N}` : c === `0 ≤ ${v} ≤ ${N}` || c === `0 <= ${v} <= ${N}`));
  },
  contextRange(q) {
    const p = P(q), f = model(p), a = at(f, 0), b = at(f, 1) / a;
    const nm = p.match(/([A-Z])\(t\) = /)[1];
    return pickIdx(q, c => (b < 1 ? c === `0 < ${nm} ≤ ${a}` : c === `${nm} ≥ ${a}` || c === `${a} ≤ ${nm}`));
  },
  horizon(q) {
    const p = P(q), f = model(p), cap = num(p.match(/at most ([\d.]+)/)[1]);
    for (let t = 0; t <= 1000; t++) if (at(f, t) > cap) return t;
    return null;
  },
  trustModel(q) {
    const p = P(q);
    let m;
    if ((m = p.match(/sits in a ([\d.]+)°F room/))) {
      const room = m[1], f = model(p);
      if (!(at(f, 1) < at(f, 0))) return null;
      return pickIdx(q, c => c.includes(`can only cool to the room's ${room}°F`) && /^It predicts temperatures near 0°F, but/.test(c));
    }
    if ((m = p.match(/from (\d{4}) \(t = 0\) to (\d{4}).*?in (\d{4})\?/))) {
      const far = Number(m[3]) - Number(m[2]);
      if (far < 30) return null; // a short step past the data is a judgement call
      return pickIdx(q, c => /^Not trustworthy/.test(c));
    }
    return null;
  },
};

export function solve(q) {
  const f = F[q.family];
  if (!f) return undefined;
  const v = f(q);
  return v === null || (typeof v === 'number' && !Number.isFinite(v)) ? -999999 : v;
}

// ---------------------------------------------------------------- sane
const decimals = v => { const s = String(clean(v)); return s.includes('.') ? s.split('.')[1].length : 0; };

export function sane(q) {
  try {
    const p = P(q), f = q.family;
    const v = F[f]?.(q);
    if (v === null || v === -1) return 'the oracle finds no single right answer';
    // rounding: a stated place must not sit on a .x5 tie; an unrounded typed answer must be short
    if (q.input === 'num' && typeof v === 'number') {
      const pl = place(p);
      if (pl === null && decimals(v) > 4) return `an exact answer with ${decimals(v)} decimals (${v})`;
      if (/cells|bacteria|people|fish/.test(q.unit) && !Number.isInteger(v)) return `a fractional count (${v} ${q.unit})`;
      if (/dollars/.test(q.unit) && pl === null && decimals(v) > 2) return `an amount that is not whole cents (${v})`;
      if (v < 0) return `a negative answer (${v})`;
    }
    // realistic rates for the people in the story
    const r = pctNum(p);
    if (r !== null && /(?:town|city|country)[’']?s? population|residents/.test(p) && /\bgrows?\b/.test(p) && r > 0.1) return `a town/city population growing ${r * 100}% a year`;
    if (r !== null && /car|truck|laptop|machine/.test(p) && (r > 0.5)) return `a value dropping ${r * 100}% a year`;
    if (r !== null && /interest|deposit|account|invested|loan/.test(p) && r > 0.2) return `an interest rate of ${r * 100}%`;
    // the table / picture the student sees must agree with what the prompt says
    if (f === 'roundedRatios') {
      const y = table(q).cols[0].vals, R = Number(p.match(/is ([\d.]+)\./)[1]);
      if (!y.slice(1).every((x, k) => round(x / y[k], 2) === R)) return 'a ratio does not round to the stated value';
    }
    if (f === 'ratioDrift') {
      const y = table(q).cols[0].vals, shown = [...B(q).matchAll(/\d+\.\d+/g)].map(m => Number(m[0]));
      if (!y.slice(1).every((x, k) => round(x / y[k], 2) === shown[k])) return 'the shown ratios do not match the counts';
    }
    if (f === 'noisyFit') {
      const T = table(q), fm = model(p), pr = T.cols.find(c => c.name === 'predicted')?.vals;
      if (pr && !T.ts.every((t, k) => Math.abs(pr[k] - at(fm, t)) < 0.006)) return 'the predicted column does not match the model';
    }
    if (f === 'continueTable' || f === 'readATable' || f === 'factorTable' || f === 'stepTwo') {
      const T = table(q);
      if (T && unitFactor(rowsOf(T)) === null) return 'the table does not have one factor';
    }
    if (f === 'twoPlans') {
      const T = table(q);
      if (T.cols[0].vals[1] !== T.cols[1].vals[1]) return 'the two cultures do not gain the same in hour 1';
    }
    if (f === 'overtake') {
      const d = defs(p), t = F.overtake(q);
      if (t !== null && Math.abs(at(d.E.f, t) - at(d.L.f, t)) < 1e-6) return 'E equals L at the answer';
      if (t === 0) return 'E does not start lower';
    }
    if (f === 'horizon') {
      const fm = model(p), cap = num(p.match(/at most ([\d.]+)/)[1]), t = F.horizon(q);
      if (t !== null && close(at(fm, t), cap)) return 'the model hits the cap exactly';
    }
    if (f === 'twoPt' || f === 'stepTwo' || f === 'factorTable' || f === 'twoPtModel') {
      const vv = Array.isArray(v) ? v : [v];
      if (vv.some(x => decimals(x) > 4)) return `a factor that is not a short decimal (${vv})`;
    }
    if (f === 'rewritePair' && Array.isArray(v) && v.some(x => decimals(x) > 4)) return `a long decimal to type (${v})`;
    if (f === 'decaySubtract' && /mg|gallons/.test(q.unit) && decimals(v) > 3) return 'a long decimal amount';
    // stated place: the exact value must not be a .x5 tie at that place
    const pl = place(p);
    if (pl !== null && q.input === 'num') {
      const raw = RAW[f]?.(q);
      if (raw !== undefined && raw !== null && nearTie(raw, pl)) return `the exact value ${raw} is a rounding tie`;
    }
  } catch (e) { return `oracle error: ${e.message}`; }
  return '';
}

/** the unrounded value of the families that round */
const RAW = {
  predict(q) { const p = P(q); return at(model(p), num(p.match(/after (\d+(?:\.\d+)?) (?:years|hours|days|months|weeks|minutes)/)[1])); },
  kFactor(q) { const p = P(q); return storyFactor(p) ** num(p.match(/over (\d+) /)[1]); },
  kPercent(q) { const p = P(q), m = p.match(/over (\d+) \w+\?|over a \w+ \((\d+) \w+\)/); return Math.abs(storyFactor(p) ** num(m[1] ?? m[2]) - 1) * 100; },
  rewriteRate(q) { const f = model(P(q)), Y = at(f, 1) / at(f, 0); return /What is Y\b/.test(P(q)) ? Y : (Y - 1) * 100; },
  compoundBalance(q) { const p = P(q), r = pctNum(p), n = perYear(p); return num(p.match(/\$([\d.]+)/)[1]) * (1 + r / n) ** (n * num(p.match(/after (\d+) years/)[1])); },
  apy(q) { const p = P(q), r = pctNum(p), n = perYear(p); return ((1 + r / n) ** n - 1) * 100; },
  principalNeeded(q) { const p = P(q), r = pctNum(p), n = perYear(p); return num(p.match(/have \$([\d.]+)/)[1]) / (1 + r / n) ** (n * num(p.match(/in (\d+) years/)[1])); },
};

export default { solve, sane };
