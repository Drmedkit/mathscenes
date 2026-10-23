// two-step-inequalities oracle (role O, docs/lessons/QUALITY_LAYER.md). Works every practice item out from what the
// student sees: the board TeX, the prompt, the choices (the mini number lines of pickSet are read from their drawn
// SVG: the dot fill, the lime ray's direction, the label). Inequalities are parsed into linear forms a·x + b with
// exact fractions and solved here; solution sets are compared as intervals; every choice is judged by the maths of its
// claim (apply the move, test the value, build the story's inequality and compare). The picture data (`set` b/op,
// `chain` I) is the lesson's own solution side and is never used.
import { Q } from '../../tools/quality/oracle-kit.mjs';

// ---------------------------------------------------------------- text → maths
const MINUS = /[−–]/g;
function texMath(tex) {
  let s = String(tex ?? '');
  for (let i = 0; i < 6; i++) {
    const before = s;
    s = s.replace(/\\cssId\{[^{}]*\}\{((?:[^{}]|\{[^{}]*\})*)\}/g, '$1')
      .replace(/\\(?:text|mathrm|textbf|mathbf)\{([^{}]*)\}/g, '$1')
      .replace(/\\[td]?frac\{([^{}]*)\}\{([^{}]*)\}/g, '(($1)/($2))');
    if (s === before) break;
  }
  return s.replace(/\\le(q)?(?![a-z])/g, '≤').replace(/\\ge(q)?(?![a-z])/g, '≥').replace(/\\lt(?![a-z])/g, '<').replace(/\\gt(?![a-z])/g, '>')
    .replace(/\\times/g, '×').replace(/\\div/g, '÷').replace(/\\cdot/g, '·').replace(/\\left|\\right/g, '')
    .replace(/\\[,;:! ]|\\quad|\\qquad|~/g, ' ').replace(/[{}]/g, '').replace(/\s+/g, ' ').trim();
}
function decQ(s) {
  const m = String(s).match(/^(-?)(\d*)(?:\.(\d+))?$/);
  if (!m || (m[2] === '' && !m[3])) throw new Error(`not a number: ${s}`);
  const d = m[3] ? 10 ** m[3].length : 1, n = Number((m[2] || '0') + (m[3] || ''));
  return Q(m[1] ? -n : n, d);
}
/** "−7", "(−7)", "3/4", "(−2/3)", "0.25", "$13.50" → Q */
function numQ(t) {
  let s = String(t).replace(MINUS, '-').replace(/[$,\s]/g, '').replace(/\.$/, '');
  while (/^\(.*\)$/.test(s)) s = s.slice(1, -1);
  const m = s.match(/^(-?)(\d+(?:\.\d+)?)\/(\d+(?:\.\d+)?)$/);
  if (m) return decQ(m[2]).div(decQ(m[3])).mul(m[1] ? -1 : 1);
  return decQ(s);
}
const NUM = '\\(?[-−]?\\d+(?:\\.\\d+)?(?:\\/\\d+)?\\)?';

// ---- linear forms {a, b} = a·x + b (any one letter is x) ----
const toQ = v => (typeof v === 'object' && v && 'n' in v ? v : Q(v));
const lin = (a, b) => ({ a: toQ(a), b: toQ(b) });
const add = (u, v) => lin(u.a.add(v.a), u.b.add(v.b));
const neg = u => lin(u.a.neg(), u.b.neg());
const isConst = u => u.a.n === 0;
const same = (u, v) => u.a.eq(v.a) && u.b.eq(v.b);
function mul(u, v) {
  if (!isConst(u) && !isConst(v)) throw new Error('not linear');
  return isConst(u) ? lin(v.a.mul(u.b), v.b.mul(u.b)) : lin(u.a.mul(v.b), u.b.mul(v.b));
}
function div(u, v) {
  if (!isConst(v) || v.b.n === 0) throw new Error('bad divisor');
  return lin(u.a.div(v.b), u.b.div(v.b));
}
function parseExpr(text) {
  const s = String(text).replace(MINUS, '-').replace(/×|·/g, '*').replace(/÷/g, '/').replace(/\$/g, '').replace(/,(?=\d{3})/g, '');
  const toks = [];
  const re = /\s*(\d+\.?\d*|\.\d+|[A-Za-z]|[-+*/()])/y;
  let i = 0;
  while (i < s.length) {
    if (/\s/.test(s[i])) { i++; continue; }
    re.lastIndex = i; const m = re.exec(s);
    if (!m) throw new Error(`bad char in ${s}`);
    toks.push(m[1]); i = re.lastIndex;
  }
  let p = 0;
  const peek = () => toks[p], next = () => toks[p++];
  function expr() {
    let v = term();
    while (peek() === '+' || peek() === '-') { const op = next(); const w = term(); v = op === '+' ? add(v, w) : add(v, neg(w)); }
    return v;
  }
  function term() {
    let v = factor();
    for (;;) {
      const t = peek();
      if (t === '*') { next(); v = mul(v, factor()); } else if (t === '/') { next(); v = div(v, factor()); } else if (t !== undefined && (t === '(' || /^[\d.A-Za-z]/.test(t))) v = mul(v, factor());
      else break;
    }
    return v;
  }
  function factor() {
    const t = peek();
    if (t === '-') { next(); return neg(factor()); }
    if (t === '+') { next(); return factor(); }
    return primary();
  }
  function primary() {
    const t = next();
    if (t === '(') { const v = expr(); if (next() !== ')') throw new Error('missing )'); return v; }
    if (t === undefined) throw new Error('unexpected end');
    if (/^[A-Za-z]$/.test(t)) return lin(1, 0);
    if (/^[\d.]/.test(t)) return lin(0, decQ(t));
    throw new Error(`unexpected ${t}`);
  }
  const v = expr();
  if (p !== toks.length) throw new Error(`trailing tokens in ${s}`);
  return v;
}
const FLIP = { '<': '>', '>': '<', '≤': '≥', '≥': '≤', '=': '=' };
/** "lhs REL rhs" → { L, R, rel, Ltext, Rtext } */
function parseIneq(text) {
  const t = String(text).replace(/<=/g, '≤').replace(/>=/g, '≥');
  const m = t.match(/^(.*?)\s*(≤|≥|<|>|=)\s*(.*)$/);
  if (!m || /[≤≥<>=]/.test(m[3])) throw new Error(`not one inequality: ${text}`);
  return { L: parseExpr(m[1]), R: parseExpr(m[3]), rel: m[2], Ltext: m[1].trim(), Rtext: m[3].trim() };
}
/** normal form: a·x + c REL 0 with the x side on the left */
function normal(e) { return { f: add(e.L, neg(e.R)), rel: e.rel }; }
const sameIneq = (e, g) => {
  const u = normal(e), v = normal(g);
  return (same(u.f, v.f) && u.rel === v.rel) || (same(u.f, neg(v.f)) && u.rel === FLIP[v.rel]);
};

// ---- solution sets: { lo, loIn, hi, hiIn } (null = unbounded), { empty }, { ints: [lo, hi] } ----
const ALL = { lo: null, loIn: false, hi: null, hiIn: false };
function setOfRel(rel, b) {
  if (rel === '<') return { lo: null, loIn: false, hi: b, hiIn: false };
  if (rel === '≤') return { lo: null, loIn: false, hi: b, hiIn: true };
  if (rel === '>') return { lo: b, loIn: false, hi: null, hiIn: false };
  if (rel === '≥') return { lo: b, loIn: true, hi: null, hiIn: false };
  return { lo: b, loIn: true, hi: b, hiIn: true };
}
/** the solution set of an inequality in one variable */
function solveSet(e) {
  const a = e.L.a.sub(e.R.a), c = e.R.b.sub(e.L.b);
  if (a.n === 0) throw new Error('no variable');
  const rel = a.n < 0 ? FLIP[e.rel] : e.rel;
  return setOfRel(rel, c.div(a));
}
function meet(s, t) {
  if (s.empty || t.empty) return { empty: true };
  let lo = s.lo, loIn = s.loIn, hi = s.hi, hiIn = s.hiIn;
  if (t.lo) { if (!lo || t.lo.cmp(lo) > 0) { lo = t.lo; loIn = t.loIn; } else if (t.lo.eq(lo)) loIn = loIn && t.loIn; }
  if (t.hi) { if (!hi || t.hi.cmp(hi) < 0) { hi = t.hi; hiIn = t.hiIn; } else if (t.hi.eq(hi)) hiIn = hiIn && t.hiIn; }
  if (lo && hi && (lo.cmp(hi) > 0 || (lo.eq(hi) && !(loIn && hiIn)))) return { empty: true };
  return { lo, loIn, hi, hiIn };
}
const bEq = (x, y) => (x === null || y === null ? x === y : x.eq(y));
function sameSet(s, t) {
  if (!s || !t) return false;
  if (s.empty || t.empty) return !!s.empty && !!t.empty;
  if (s.ints || t.ints) return !!s.ints && !!t.ints && s.ints[0] === t.ints[0] && s.ints[1] === t.ints[1];
  return bEq(s.lo, t.lo) && bEq(s.hi, t.hi) && (!s.lo || s.loIn === t.loIn) && (!s.hi || s.hiIn === t.hiIn);
}
const inSet = (s, v) => !s.empty && (!s.lo || v.cmp(s.lo) > 0 || (s.loIn && v.eq(s.lo))) && (!s.hi || v.cmp(s.hi) < 0 || (s.hiIn && v.eq(s.hi)));
/** a choice written as a set: "x > −7", "x = 3", "0 ≤ h < 6.375", "None: …" */
function parseSetText(t) {
  const s = String(t).replace(MINUS, '-').trim();
  if (/^None\b/.test(s)) return { empty: true };
  let m = s.match(new RegExp(`^(${NUM})\\s*(≤|<)\\s*[A-Za-z]\\s*(≤|<)\\s*(${NUM})$`));
  if (m) return meet(setOfRel(m[2] === '≤' ? '≥' : '>', numQ(m[1])), setOfRel(m[3], numQ(m[4])));
  m = s.match(new RegExp(`^[A-Za-z]\\s*(≤|≥|<|>|=)\\s*(${NUM})$`));
  if (m) return setOfRel(m[1], numQ(m[2]));
  return null;
}

// ---- moves "add 8 to both sides", "multiply both sides by (−2/3)", "Divide both sides by 5" ----
function parseMove(t) {
  const s = String(t).replace(MINUS, '-').trim();
  let m;
  if ((m = s.match(new RegExp(`^subtract (${NUM}) from both sides`, 'i')))) return { op: '-', k: numQ(m[1]) };
  if ((m = s.match(new RegExp(`^add (${NUM}) to both sides`, 'i')))) return { op: '+', k: numQ(m[1]) };
  if ((m = s.match(new RegExp(`^multiply both sides by (${NUM})`, 'i')))) return { op: '*', k: numQ(m[1]) };
  if ((m = s.match(new RegExp(`^divide both sides by (${NUM})`, 'i')))) return { op: '/', k: numQ(m[1]) };
  return null;
}
function applyQ(v, mv) {
  if (mv.op === '+') return v.add(mv.k);
  if (mv.op === '-') return v.sub(mv.k);
  if (mv.op === '*') return v.mul(mv.k);
  return v.div(mv.k);
}
function applyLin(u, mv) {
  const c = lin(0, mv.k);
  if (mv.op === '+') return add(u, c);
  if (mv.op === '-') return add(u, neg(c));
  if (mv.op === '*') return mul(u, c);
  return div(u, c);
}
const turns = mv => (mv.op === '*' || mv.op === '/') && mv.k.n < 0;
const relOf = (x, y) => (x.cmp(y) < 0 ? '<' : x.cmp(y) > 0 ? '>' : '=');

// ---- the structure of the x side: its LAST operation ----
function splitTop(s) {
  const out = []; let depth = 0, cur = '', sign = 1;
  for (let i = 0; i < s.length; i++) {
    const ch = s[i];
    if (ch === '(') depth++;
    if (ch === ')') depth--;
    if (depth === 0 && (ch === '+' || ch === '-') && cur.trim() !== '' && !/[*/(]\s*$/.test(cur)) { out.push({ text: cur.trim(), sign }); sign = ch === '-' ? -1 : 1; cur = ''; continue; }
    cur += ch;
  }
  if (cur.trim()) out.push({ text: cur.trim(), sign });
  return out;
}
/** x side text → { inner (linear form after undoing the last step), op: '+' | '*', k } */
function lastStep(sideText) {
  const s = sideText.replace(MINUS, '-').replace(/\s+/g, ' ').trim();
  const top = splitTop(s);
  if (top.length === 2) {
    const xs = top.filter(t => /[A-Za-z]/.test(t.text)), cs = top.filter(t => !/[A-Za-z]/.test(t.text));
    if (xs.length === 1 && cs.length === 1) {
      const inner = parseExpr(xs[0].text);
      return { inner: xs[0].sign < 0 ? neg(inner) : inner, op: '+', k: parseExpr(cs[0].text).b.mul(cs[0].sign) };
    }
  }
  const m = s.match(/^(-?\d+(?:\.\d+)?|\(\((-?[\d.]+)\)\/\(([\d.]+)\)\)|-\(\(([\d.]+)\)\/\(([\d.]+)\)\))\s*\((.*)\)$/);
  if (m) {
    const k = m[2] ? decQ(m[2]).div(decQ(m[3])) : m[4] ? decQ(m[4]).div(decQ(m[5])).neg() : decQ(m[1]);
    return { inner: parseExpr(m[6]), op: '*', k };
  }
  // k·x alone (a coefficient times the letter, possibly a fraction)
  const f = parseExpr(s);
  if (f.b.n === 0 && !f.a.eq(1)) return { inner: lin(1, 0), op: '*', k: f.a };
  return null;
}
const boardIneq = q => parseIneq(texMath(String(q.board).split(/\\qquad/)[0]));
/** the side of the board that holds the letter */
function xSide(q) {
  const e = boardIneq(q);
  return isConst(e.L) ? { text: e.Rtext, other: e.L, e } : { text: e.Ltext, other: e.R, e };
}

// ---------------------------------------------------------------- stories
const REL_WORDS = [
  [/\b(?:no less than|at least)\b/, '≥'], [/\b(?:no more than|at most|up to)\b/, '≤'],
  [/\b(?:more than|above|over)\b/, '>'], [/\b(?:less than|below|under)\b/, '<'], [/\bexactly\b/, '='],
];
const relWord = t => { for (const [re, r] of REL_WORDS) if (re.test(t)) return r; return null; };
/** a story → { L (linear form in the unknown), rel, R (number), domain } (domain: 'hours' | 'whole' | 'real') */
function storyModel(text) {
  const s = String(text).replace(MINUS, '-').replace(/’/g, "'");
  let m;
  const N = '(-?\\d+(?:\\.\\d+)?)';
  if ((m = s.match(new RegExp(`elevator can carry (.+?) ${N} lb\\. The operator weighs ${N} lb, and each box weighs ${N} lb`))))
    return { L: lin(numQ(m[4]), numQ(m[3])), rel: relWord(m[1]), R: numQ(m[2]), domain: 'whole' };
  if ((m = s.match(new RegExp(`earns \\$${N} a week plus \\$${N} for every sale\\. \\w+ wants to earn (.+?) \\$${N} this week`))))
    return { L: lin(numQ(m[2]), numQ(m[1])), rel: relWord(m[3]), R: numQ(m[4]), domain: 'whole' };
  if ((m = s.match(new RegExp(`bike rental costs \\$${N} plus \\$${N} per hour \\(charged by the minute\\)\\. You have (.+?) \\$${N} to spend`))))
    return { L: lin(numQ(m[2]), numQ(m[1])), rel: relWord(m[3]), R: numQ(m[4]), domain: 'hours' };
  if ((m = s.match(new RegExp(`Fahrenheit is ${N} times the Celsius temperature, plus ${N}\\. A freezer must stay (.+?) ${N} °F`))))
    return { L: lin(numQ(m[1]), numQ(m[2])), rel: relWord(m[3]), R: numQ(m[4]), domain: 'real' };
  if ((m = s.match(new RegExp(`At midnight it is ${N} °F, and the temperature rises ${N} °F every hour\\. The ice road closes once it is (.+?) ${N} °F`))))
    return { L: lin(numQ(m[2]), numQ(m[1])), rel: relWord(m[3]), R: numQ(m[4]), domain: 'hours' };
  if ((m = s.match(new RegExp(`plumber charges an? \\$${N} visit fee plus \\$${N} per hour \\(billed by the minute\\)\\. You can spend (.+?) \\$${N}`))))
    return { L: lin(numQ(m[2]), numQ(m[1])), rel: relWord(m[3]), R: numQ(m[4]), domain: 'hours' };
  if ((m = s.match(new RegExp(`has \\$${N} saved and adds \\$${N} every week\\. \\w+ wants (.+?) \\$${N} for a new bike`))))
    return { L: lin(numQ(m[2]), numQ(m[1])), rel: relWord(m[3]), R: numQ(m[4]), domain: 'whole' };
  // chooseModel
  if ((m = s.match(new RegExp(`At a free fair, rides cost \\$${N} each\\..*?\\b\\w+ (?:can spend (.+?) \\$${N}|paid \\$${N})\\.`))))
    return { L: lin(numQ(m[1]), 0), rel: m[4] ? '=' : relWord(m[2]), R: numQ(m[4] ?? m[3]), domain: 'whole' };
  if ((m = s.match(new RegExp(`A fair charges \\$${N} to get in plus \\$${N} per ride\\..*?\\b\\w+ (?:can spend (.+?) \\$${N}|paid \\$${N})\\.`))))
    return { L: lin(numQ(m[2]), numQ(m[1])), rel: m[5] ? '=' : relWord(m[3]), R: numQ(m[5] ?? m[4]), domain: 'whole' };
  if ((m = s.match(new RegExp(`${N} bags each hold ${N} apples and [a-z] pears\\. Together they hold (.+?) ${N} pieces of fruit`))))
    return { L: mul(lin(0, numQ(m[1])), lin(1, numQ(m[2]))), rel: relWord(m[3]), R: numQ(m[4]), domain: 'whole' };
  // storyFor
  if ((m = s.match(new RegExp(`^${N} friends each buy one ${N}-dollar ticket and [a-z] dollars of snacks\\. Together they spend (.+?) \\$${N}\\.$`))))
    return { L: mul(lin(0, numQ(m[1])), lin(1, numQ(m[2]))), rel: relWord(m[3]), R: numQ(m[4]), domain: 'real' };
  if ((m = s.match(new RegExp(`^A gym charges an? \\$${N} sign-up fee plus \\$${N} per class\\. \\w+ takes [a-z] classes and spends (.+?) \\$${N}\\.$`))))
    return { L: lin(numQ(m[2]), numQ(m[1])), rel: relWord(m[3]), R: numQ(m[4]), domain: 'whole' };
  if ((m = s.match(new RegExp(`^A club sells [a-z] shirts for \\$${N} each and pays an? \\$${N} printing fee\\. The profit is (.+?) \\$${N}\\.$`))))
    return { L: lin(numQ(m[1]), numQ(m[2]).neg()), rel: relWord(m[3]), R: numQ(m[4]), domain: 'whole' };
  return null;
}
const storyIneq = st => ({ L: st.L, R: lin(0, st.R), rel: st.rel });

/** fewest / most whole count in a set */
function wholeEnd(S, most) {
  if (S.empty) return null;
  if (most) {
    if (!S.hi) return null;
    let k = Math.floor(S.hi.value + 1e-12);
    if (!inSet(S, Q(k))) k -= 1;
    return k >= 0 && inSet(S, Q(k)) ? k : null;
  }
  let k = S.lo ? Math.ceil(S.lo.value - 1e-12) : 0;
  if (k < 0) k = 0;
  if (!inSet(S, Q(k))) k += 1;
  return inSet(S, Q(k)) ? k : null;
}

// ---------------------------------------------------------------- per family
const orderMovePrompt = p => {
  const s = p.replace(MINUS, '-');
  const m = s.match(new RegExp(`Now (add|subtract|multiply both sides by|divide both sides by) (${NUM})`, 'i'));
  if (!m) throw new Error('no move');
  const w = m[1].toLowerCase();
  return { op: w === 'add' ? '+' : w === 'subtract' ? '-' : w.startsWith('multiply') ? '*' : '/', k: numQ(m[2]) };
};
/** shift / scale / mirror / negScale / divNeg: the true statement after the move */
function orderFamily(q) {
  const p = q.prompt.replace(MINUS, '-');
  const mv = orderMovePrompt(p);
  let m;
  if ((m = p.match(/^For two numbers ([a-z]) and ([a-z]) \(either could be negative\), \1 (<|>) \2 is true\./))) {
    const [, u, v, rel] = m;
    const want = turns(mv) ? FLIP[rel] : rel;
    const fu = applyLin(lin(1, 0), mv);
    return q.choices.map(c => {
      try {
        if (/depends/i.test(c)) return false;
        const e = parseIneq(c.replace(MINUS, '-'));
        const lu = (e.Ltext.match(/[a-z]/g) ?? []), ru = (e.Rtext.match(/[a-z]/g) ?? []);
        if (lu.join() !== u || ru.join() !== v) return false;
        return e.rel === want && same(e.L, fu) && same(e.R, fu);
      } catch { return false; }
    });
  }
  m = p.match(new RegExp(`^(${NUM}) (<|>) (${NUM}) is true\\.`));
  const A = numQ(m[1]), B = numQ(m[3]);
  if (relOf(A, B) !== m[2]) throw new Error('the given statement is false');
  const A2 = applyQ(A, mv), B2 = applyQ(B, mv), want = relOf(A2, B2);
  return q.choices.map(c => {
    const mm = c.replace(MINUS, '-').match(new RegExp(`^(${NUM}) (<|>|=) (${NUM})$`));
    return !!mm && numQ(mm[1]).eq(A2) && numQ(mm[3]).eq(B2) && mm[2] === want;
  });
}

function svgSet(h) {
  const svg = String(h);
  const label = (svg.match(/<text[^>]*>([^<]*)<\/text>/) ?? [])[1];
  if (label == null) return null;
  const b = numQ(label.replace(/&minus;/g, '−'));
  const circ = svg.match(/<circle[^>]*>/)?.[0] ?? '';
  const open = /fill="#161A36"/i.test(circ);
  const rays = [...svg.matchAll(/<path d="M(\d+(?:\.\d+)?) 20H(\d+(?:\.\d+)?)" stroke="#B4EA6A"/gi)].map(r => Math.sign(Number(r[2]) - Number(r[1])));
  if (!circ) return null;
  if (!rays.length) return open ? { empty: true } : setOfRel('=', b);
  if (rays.length > 1 || rays[0] === 0) return null;
  return rays[0] < 0 ? setOfRel(open ? '<' : '≤', b) : setOfRel(open ? '>' : '≥', b);
}

function auditModel(q) {
  const p = q.prompt.replace(MINUS, '-').replace(/’/g, "'");
  const m = p.match(new RegExp(`^(\\w+) solved (.+?) and wrote ([a-z]) (≤|≥|<|>) (${NUM})\\. \\1 tested \\3 = (${NUM}): (.+?) = (${NUM}) there, so the inequality is (true|false), just as \\1's set says\\.`));
  if (!m) throw new Error('audit prompt');
  const e = parseIneq(m[2]);
  return { who: m[1], e, S: solveSet(e), P: setOfRel(m[4], numQ(m[5])), v: m[3], t: numQ(m[6]), expr: m[7], val: numQ(m[8]), truth: m[9] === 'true' };
}
const dirOf = S => (S.lo && !S.hi ? 1 : S.hi && !S.lo ? -1 : 0);
const bOf = S => S.lo ?? S.hi;
const inclOf = S => (S.lo && !S.hi ? S.loIn : S.hiIn);

const F = {
  pickSet(q) {
    const S = solveSet(boardIneq(q));
    return (q.choicesHtml ?? []).map(h => sameSet(svgSet(h), S));
  },
  testPoint(q) {
    const [ineq, val] = String(q.board).split(/\\qquad/).map(texMath);
    const e = parseIneq(ineq), x = numQ(val.split('=')[1]);
    const l = e.L.a.mul(x).add(e.L.b), r = e.R.a.mul(x).add(e.R.b), rel = relOf(l, r);
    const ok = e.rel === rel || (e.rel === '≤' && rel !== '>') || (e.rel === '≥' && rel !== '<');
    return q.choices.map(c => (/^Yes/.test(c) ? ok : /^No/.test(c) ? !ok : false));
  },
  shift: orderFamily, scale: orderFamily, mirror: orderFamily, negScale: orderFamily, divNeg: orderFamily,
  keepOrFlip(q) {
    const e = parseIneq(texMath(q.board));
    const A = e.L.b, B = e.R.b, rel = relOf(A, B);
    return q.choices.map(c => {
      const mv = parseMove(c); if (!mv) return false;
      if ((mv.op === '/' || mv.op === '*') && mv.k.n === 0) return false;
      return relOf(applyQ(A, mv), applyQ(B, mv)) === FLIP[rel];
    });
  },
  solveShift(q) { return F.solve(q); },
  solve(q) {
    const S = solveSet(boardIneq(q));
    return q.choices.map(c => sameSet(parseSetText(c), S));
  },
  firstMove(q) {
    const xs = xSide(q);
    const st = lastStep(xs.text);
    if (!st) throw new Error('no last step');
    const lhs = parseExpr(xs.text);
    return q.choices.map(c => judgeFirst(c, lhs, st).right);
  },
  revWhen(q) {
    const p = q.prompt.replace(MINUS, '-');
    const m = p.match(/: first you (.+?), then you (.+?)\. When does the symbol turn around\?/);
    const m1 = parseMove(m[1]), m2 = parseMove(m[2]);
    const t1 = turns(m1), t2 = turns(m2);
    return q.choices.map(c => {
      if (/^At no step/.test(c)) return !t1 && !t2;
      if (/^At both steps/.test(c)) return t1 && t2;
      if (/^At the first move/.test(c)) return t1 && !t2 && sameMoveText(c, m1);
      if (/^At the second move/.test(c)) return t2 && !t1 && sameMoveText(c, m2);
      return false;
    });
  },
  audit(q) {
    const A = auditModel(q);
    const S = A.S, P = A.P;
    return q.choices.map(c => {
      const cc = c.replace(MINUS, '-').replace(/’/g, "'");
      if (/set is right$/.test(cc)) return sameSet(S, P);
      if (/^Only [a-z] = /.test(cc)) return false; // an inequality has a whole set of solutions
      if (/^The dot should be (closed|open)$/.test(cc)) {
        const closed = /closed/.test(cc);
        return bOf(S).eq(bOf(P)) && dirOf(S) === dirOf(P) && inclOf(S) !== inclOf(P) && inclOf(S) === closed;
      }
      if (/^The ray points the wrong way$/.test(cc)) return bOf(S).eq(bOf(P)) && dirOf(S) === -dirOf(P) && inclOf(S) === inclOf(P);
      return false;
    });
  },
  proofStep(q) {
    const p = q.prompt.replace(MINUS, '-');
    if (q.input === 'num') {
      const m = p.match(/what is (.+)\?$/);
      return parseExpr(m[1]).b;
    }
    let pm;
    if ((pm = p.match(/^Proof step: add \(-a - b\) to both sides of a < b\. What is ([ab] \+ \(-a - b\))\?/))) {
      // worked out as a form in a and b: a + (−a − b) = −b, b + (−a − b) = −a
      const w = abForm(pm[1]);
      return q.choices.map(c => ab(c).eq2(w));
    }
    if (/^Add \(-a - b\) to both sides of a < b\. The order stays/.test(p)) {
      return q.choices.map(c => {
        const m = c.replace(MINUS, '-').match(/^(.+?) (<|>) (.+)$/);
        return !!m && m[2] === '<' && ab(m[1]).eq2([0, -1]) && ab(m[3]).eq2([-1, 0]);
      });
    }
    return null;
  },
  proofWhy(q) {
    const p = q.prompt.replace(MINUS, '-');
    let m;
    if ((m = p.match(/multiplying both sides by (-\d+) turns the symbol, for every pair of numbers/))) {
      const k = Number(m[1]);
      return q.choices.map(c => {
        const cc = c.replace(MINUS, '-');
        const mm = cc.match(/^(-\d+) = -1 × (\d+)\. × \2 keeps the order \(positive\), and × \(-1\) reverses it \(add -a - b to both sides\)\. So × \((-\d+)\) reverses it\.$/);
        return !!mm && Number(mm[1]) === k && -Number(mm[2]) === k && Number(mm[3]) === k; // a general argument: k = −1 × |k|
        // the others: one example (not every pair), "that is the rule" (assumes what is proved), "the order stays" (false)
      });
    }
    if (/a < b always gives -b < -a/.test(p)) {
      return q.choices.map(c => {
        const cc = c.replace(MINUS, '-');
        // a + (−a − b) = −b and b + (−a − b) = −a, and adding keeps the order: a general proof
        return /^Add \(-a - b\) to both sides\. Adding keeps the order, and the sides become -b and -a\.$/.test(cc);
        // examples are not every pair; "the rule" assumes it; "−a and −b are negative" is false (a, b can be negative)
      });
    }
    return null;
  },
  writeIneq(q) {
    const st = storyModel(q.prompt);
    if (!st || !st.rel) throw new Error('story');
    const want = storyIneq(st);
    return q.choices.map(c => { try { return sameIneq(parseIneq(c), want); } catch { return false; } });
  },
  chooseModel(q) { return F.writeIneq(q); },
  contextSolve(q) {
    const st = storyModel(q.prompt);
    if (!st || !st.rel) throw new Error('story');
    const b = boardIneq(q);
    let S = solveSet(b);
    if (st.domain === 'hours') S = meet(S, setOfRel('≥', Q(0)));
    return q.choices.map(c => sameSet(parseSetText(c), S));
  },
  wholeCount(q) {
    const S = solveSet(boardIneq(q));
    const most = /\bmost\b/.test(q.prompt), fewest = /\bfewest\b/.test(q.prompt);
    if (most === fewest) throw new Error('which end?');
    return wholeEnd(S, most);
  },
  domainFor(q) {
    const p = q.prompt;
    const e = boardIneq(q);
    const S = meet(solveSet(e), setOfRel('≥', Q(0)));
    const whole = /= tickets\b/.test(p);
    const cont = /per hour \(by the minute\)/.test(p) && /= hours\b/.test(p);
    if (whole === cont) throw new Error('domain');
    const right = whole ? { ints: [0, wholeEnd(S, true)] } : S;
    return q.choices.map(c => sameSet(domainChoice(c), right));
  },
  storyFor(q) {
    const e = boardIneq(q);
    return q.choices.map(c => { const st = storyModel(c); return !!st && !!st.rel && sameIneq(storyIneq(st), e); });
  },
};

/** "0, 1, 2, …, 9" / "Only 0, 1, 2, …, 6" / "Only 8" / "Every number < 9" / "Every h with 0 ≤ h < 6" / "Every h < 6, including negatives" */
function domainChoice(c) {
  const s = c.replace(MINUS, '-');
  let m;
  if ((m = s.match(/^(?:Only )?0, 1, 2, …, (\d+)$/))) return { ints: [0, Number(m[1])] };
  if ((m = s.match(/^Only (\d+)$/))) return { ints: [Number(m[1]), Number(m[1])] };
  if ((m = s.match(new RegExp(`^Every number (≤|<) (${NUM})$`)))) return setOfRel(m[1], numQ(m[2]));
  if ((m = s.match(/^Every [a-z] with (.+)$/))) return parseSetText(m[1]);
  if ((m = s.match(new RegExp(`^Every [a-z] (≤|<) (${NUM}), including negatives$`)))) return setOfRel(m[1], numQ(m[2]));
  return null;
}
function sameMoveText(c, mv) {
  const m = parseMove(c.replace(/^At the (first|second) move: /, ''));
  return !!m && m.op === mv.op && m.k.eq(mv.k);
}
/** coefficients [a, b] of a form in a and b with no constant */
function abForm(t) {
  const s = String(t).replace(MINUS, '-');
  const fa = parseExpr(s.replace(/b/g, '0').replace(/a/g, 'x')), fb = parseExpr(s.replace(/a/g, '0').replace(/b/g, 'x'));
  return [fa.a.value, fb.a.value];
}
/** a form in a and b: [coef a, coef b] */
function ab(t) {
  const s = String(t).replace(MINUS, '-');
  const fa = parseExpr(s.replace(/b/g, '0').replace(/a/g, 'x')), fb = parseExpr(s.replace(/a/g, '0').replace(/b/g, 'x'));
  if (fa.b.n !== 0 || fb.b.n !== 0) return { eq2: () => false };
  return { eq2: ([x, y]) => fa.a.eq(x) && fb.a.eq(y) };
}
/** a first-move choice: does its move undo the last step, and is its claim about the symbol right? */
function judgeFirst(c, lhs, st) {
  const cc = c.replace(MINUS, '-');
  const mv = parseMove(cc);
  if (!mv) return { right: false, legal: false };
  const claim = /turns around|turn the symbol/.test(cc) ? 'turn' : /stays/.test(cc) ? 'stay' : null;
  const t = turns(mv);
  const claimOk = claim === null ? !t : (claim === 'turn') === t;
  let res = null;
  try { res = applyLin(lhs, mv); } catch { res = null; }
  const undoes = !!res && same(res, st.inner);
  // a legal move done to every term of both sides (not just a part), with a right word about the symbol
  const legal = !!res && !((mv.op === '*' || mv.op === '/') && mv.k.n === 0) && claimOk;
  return { right: undoes && claimOk, legal, undoes, res };
}

// ---------------------------------------------------------------- contract
const pick = arr => {
  if (!Array.isArray(arr)) return undefined;
  const hits = arr.map((ok, i) => (ok ? i : -1)).filter(i => i >= 0);
  return hits.length >= 1 ? hits[0] : undefined;
};
const out = v => (v && typeof v === 'object' && 'n' in v ? v.value : v);

export default {
  solve(q) {
    const f = F[q.family];
    if (!f) return undefined;
    let r;
    try { r = f(q); } catch { return undefined; }
    if (q.input === 'choice') return pick(r);
    return r == null ? undefined : out(r);
  },
  sane(q) {
    const f = F[q.family];
    if (!f) return '';
    let r;
    try { r = f(q); } catch (e) { return `could not read the item (${e.message})`; }
    const probs = [];
    if (q.input === 'choice' && Array.isArray(r)) {
      const n = r.filter(Boolean).length;
      if (n === 0) probs.push('no choice is right');
      if (n > 1) probs.push(`${n} choices are right`);
    }
    try {
      if (q.family === 'firstMove') {
        // "What is the first move": dividing every term by the coefficient first (x's coefficient becomes 1, symbol word right) is also a sound first move
        const xs = xSide(q), st = lastStep(xs.text), lhs = parseExpr(xs.text);
        const alt = q.choices.filter(c => { const j = judgeFirst(c, lhs, st); return j.legal && !j.right && j.res && j.res.a.eq(1); });
        if (alt.length) probs.push(`"${alt[0]}" is also a legal first move (the prompt does not ask to undo the last step)`);
      }
      if (q.family === 'revWhen') {
        const p = q.prompt.replace(MINUS, '-');
        const m = p.match(/: first you (.+?), then you (.+?)\. When/);
        const e = boardIneq(q), xs = isConst(e.L) ? e.R : e.L;
        const after = applyLin(applyLin(xs, parseMove(m[1])), parseMove(m[2]));
        if (!same(after, lin(1, 0))) probs.push('the two moves in the prompt do not leave the letter alone');
      }
      if (q.family === 'audit') {
        const A = auditModel(q);
        const x = A.t, e = parseExpr(A.expr);
        if (!e.a.mul(x).add(e.b).eq(A.val)) probs.push(`the test says ${A.expr} = ${A.val.toString()} at ${A.v} = ${x.toString()}, but it is ${e.a.mul(x).add(e.b).toString()}`);
        if (inSet(A.S, x) !== A.truth) probs.push('the test says true/false wrongly');
        if (inSet(A.P, x) !== A.truth) probs.push('the test does not agree with the proposed set, though the prompt says "just as the set says"');
        if (!bOf(A.S).eq(bOf(A.P))) probs.push('the proposed set has a wrong boundary (no choice names that)');
        else if (dirOf(A.S) !== dirOf(A.P) && inclOf(A.S) !== inclOf(A.P)) probs.push('the proposed set has the ray AND the dot wrong (each choice fixes only one)');
      }
      if (q.family === 'wholeCount' && (r == null || r < 0)) probs.push('no whole count works');
      if (q.family === 'wholeCount' && r === 0) probs.push('the answer is 0 (nothing needed)');
      if (q.family === 'domainFor') {
        const S = meet(solveSet(boardIneq(q)), setOfRel('≥', Q(0)));
        if (S.empty) probs.push('no value makes sense');
      }
      if (q.family === 'contextSolve') {
        const st = storyModel(q.prompt);
        const e = boardIneq(q);
        if (!sameIneq(storyIneq(st), e)) probs.push('the stated inequality does not fit the story');
        const S = solveSet(e);
        if (st.domain === 'hours' && meet(S, setOfRel('≥', Q(0))).empty) probs.push('no number of hours works');
      }
      if (q.family === 'wholeCount' || q.family === 'domainFor') {
        const st = storyModel(q.prompt);
        if (st && st.rel && !sameIneq(storyIneq(st), boardIneq(q))) probs.push('the stated inequality does not fit the story');
      }
      if (q.family === 'proofStep' && q.input === 'num') {
        const m = q.prompt.replace(MINUS, '-').match(/Try it with a = (-?\d+) and b = (-?\d+): what is (.+)\?$/);
        if (m) {
          const a = Number(m[1]), b = Number(m[2]);
          const v = parseExpr(m[3]).b; // the left side a + (−a − b) or the right side b + (−a − b)
          if (!v.eq(a + (-a - b)) && !v.eq(b + (-a - b))) probs.push(`the shown sum is not a side of a < b plus (−a − b) with a = ${a}, b = ${b}`);
          if (!(a < b)) probs.push(`a = ${a} and b = ${b} do not satisfy a < b`);
        }
      }
      if (q.family === 'proofWhy') {
        // the example choices must at least be true arithmetic (else the item is unfair)
        for (const c of q.choices) {
          const cc = c.replace(MINUS, '-');
          const m = cc.match(/^(-?\d+) < (-?\d+) gives (-?\d+) > (-?\d+)\. One example shows it\.$/);
          const k = Number((q.prompt.replace(MINUS, '-').match(/by (-\d+)/) ?? [])[1]);
          if (m && !(Number(m[1]) < Number(m[2]) && Number(m[3]) === k * Number(m[1]) && Number(m[4]) === k * Number(m[2]))) probs.push(`the example "${c}" is wrong arithmetic`);
        }
      }
    } catch (e) { probs.push(`could not check the item (${e.message})`); }
    return probs.join('; ');
  },
};
