// Oracle for the lesson "multiply-divide-rational-numbers" (signed products and quotients, grade 7). Written from what
// the student sees only: the prompt (and its HTML, where the plain text loses a stacked fraction or a repeat bar), the
// board TeX and the choices. Arithmetic is exact (Q): the board TeX is parsed into an expression (a □ on the board is
// solved for), word problems are worked from the story (a rise / deposit / "up" is +, a fall / debt / "down" is −;
// "ago" is a negative time), and statements are judged by checking what they claim (the equation they write, the
// sign they name, whether the reasoning covers every case). See docs/lessons/QUALITY_LAYER.md, "O: the oracle".
import { Q, choiceWhere } from '../../tools/quality/oracle-kit.mjs';

// ---------------------------------------------------------------- exact numbers and expressions
const clean = s => String(s ?? '').replace(/[−–]/g, '-').replace(/[’‘]/g, "'").replace(/[“”]/g, '"');
function dec(t) {
  const m = String(t).match(/^(\d*)(?:\.(\d+))?$/);
  if (!m || (m[1] === '' && !m[2])) throw new Error(`not a number: ${t}`);
  return Q(Number((m[1] || '0') + (m[2] || '')), m[2] ? 10 ** m[2].length : 1);
}
/** a value linear in the unknown □: { a, b } = a·□ + b */
const L = (a, b) => ({ a: Q.prototype ? a : a, b });
const K = b => ({ a: Q(0), b });
const isK = x => x.a.n === 0;
const ladd = (x, y, s = 1) => ({ a: s > 0 ? x.a.add(y.a) : x.a.sub(y.a), b: s > 0 ? x.b.add(y.b) : x.b.sub(y.b) });
function lmul(x, y) {
  if (!isK(x) && !isK(y)) throw new Error('not linear');
  return isK(x) ? { a: y.a.mul(x.b), b: y.b.mul(x.b) } : { a: x.a.mul(y.b), b: x.b.mul(y.b) };
}
function ldiv(x, y) {
  if (!isK(y)) throw new Error('divide by □');
  if (y.b.n === 0) throw new Error('div0');
  return { a: x.a.div(y.b), b: x.b.div(y.b) };
}
/** the matching close brace of an open one at i */
function closeOf(s, i) { let d = 0; for (let j = i; j < s.length; j++) { if (s[j] === '{') d++; if (s[j] === '}' && --d === 0) return j; } return -1; }
/** TeX → a plain expression string: fractions as ((a)/(b)), mixed numbers as (w+(a)/(b)), operators as * / */
function texExpr(tex) {
  let s = String(tex ?? '');
  s = s.replace(/\\left|\\right/g, '').replace(/\\[,;: !]|\\quad|\\qquad/g, ' ').replace(/=\s*\\,?\s*\?\s*$/, '').replace(/\\overset\{\?\}\{=\}/g, '=');
  for (let guard = 0; guard < 20; guard++) {
    const m = s.match(/(\d*)\\[dt]?frac\{/);
    if (!m) break;
    const at = m.index + m[1].length, a0 = s.indexOf('{', at), a1 = closeOf(s, a0), b0 = a1 + 1, b1 = closeOf(s, b0);
    const frac = `((${s.slice(a0 + 1, a1)})/(${s.slice(b0 + 1, b1)}))`;
    s = s.slice(0, m.index) + (m[1] ? `(${m[1]}+${frac})` : frac) + s.slice(b1 + 1);
  }
  return s.replace(/\\times|\\cdot/g, '*').replace(/\\div/g, '/').replace(/\\square/g, '□').replace(/\^\{([^{}]*)\}/g, '^($1)')
    .replace(/\\text\{[^{}]*\}/g, ' ').replace(/[{}]/g, '').replace(/\s+/g, ' ').trim();
}
/** parse and evaluate a plain expression (numbers, + - * / ^, parentheses, |abs|, □) into a linear value */
function evalL(text) {
  // a written fraction a/b is one number (division is written ÷): wrap it before ÷ becomes /
  const s = clean(text).replace(/(\d+(?:\.\d+)?)\/(\d+(?:\.\d+)?)/g, '(($1)/($2))').replace(/×|·/g, '*').replace(/÷/g, '/').replace(/▢/g, '□').replace(/\$/g, '').replace(/(\d),(?=\d{3})/g, '$1');
  const toks = s.match(/\d+\.?\d*|\.\d+|[-+*/^()|□]/g) ?? [];
  let p = 0;
  const peek = () => toks[p], next = () => toks[p++];
  let absDepth = 0;
  function expr() { let v = term(); while (peek() === '+' || peek() === '-') { const o = next(); v = ladd(v, term(), o === '+' ? 1 : -1); } return v; }
  function term() {
    let v = unary();
    for (;;) {
      const t = peek();
      if (t === '*') { next(); v = lmul(v, unary()); }
      else if (t === '/') { next(); v = ldiv(v, unary()); }
      else if (t !== undefined && (t === '(' || t === '□' || /^[\d.]/.test(t) || (t === '|' && absDepth === 0))) v = lmul(v, power());
      else break;
    }
    return v;
  }
  function unary() { if (peek() === '-') { next(); return lmul(K(Q(-1)), unary()); } if (peek() === '+') { next(); return unary(); } return power(); }
  function power() {
    let b = primary();
    if (peek() === '^') {
      next();
      const e = primary();
      if (!isK(b) || !isK(e) || e.b.d !== 1) throw new Error('bad power');
      let r = K(Q(1));
      for (let i = 0; i < Math.abs(e.b.n); i++) r = lmul(r, b);
      b = e.b.n < 0 ? ldiv(K(Q(1)), r) : r;
    }
    return b;
  }
  function primary() {
    const t = next();
    if (t === '(') { const v = expr(); if (next() !== ')') throw new Error('missing )'); return v; }
    if (t === '|') { absDepth++; const v = expr(); absDepth--; if (next() !== '|') throw new Error('missing |'); if (!isK(v)) throw new Error('abs of □'); return K(v.b.n < 0 ? v.b.neg() : v.b); }
    if (t === '□') return { a: Q(1), b: Q(0) };
    if (t !== undefined && /^[\d.]/.test(t)) return K(dec(t));
    throw new Error(`unexpected ${t} in "${s}"`);
  }
  const v = expr();
  if (p !== toks.length) throw new Error(`trailing tokens in "${s}"`);
  return v;
}
const val = text => { const v = evalL(text); if (!isK(v)) throw new Error('has □'); return v.b; };
const tryVal = text => { try { return val(text); } catch { return null; } };
/** "A = B" with one □: its value */
function solveBox(text) {
  const [l, r] = text.split('=');
  const d = ladd(evalL(l), evalL(r), -1);
  if (d.a.n === 0) throw new Error('no □');
  return d.b.neg().div(d.a);
}
/** the board expression's value (or the □ it asks for) */
function boardValue(q) {
  const e = texExpr(q.board);
  if (e.includes('□')) return solveBox(e);
  const parts = e.split('=');
  return val(parts[0]);
}
/** a plain signed number: "−3/4", "2 1/2", "−0.5" */
function num(t) {
  const s = clean(t).trim();
  let m = s.match(/^(-?)(\d+)\s+(\d+)\/(\d+)$/);
  if (m) { const f = Q(Number(m[3]), Number(m[4])).add(Number(m[2])); return m[1] ? f.neg() : f; }
  return val(s);
}
const out = x => x.value;   // a num answer
const ans = (q, x) => (q.input === 'frac' ? x.pair : x.value);
const sign = x => Math.sign(x.n);

// ---------------------------------------------------------------- families
const F = {};

F.distribute = q => out(boardValue(q));
F.intMul = q => out(boardValue(q));
F.intDiv = q => {
  if (q.input === 'choice') {
    const e = texExpr(q.board);
    if (/\/\s*0$/.test(e.replace(/\s/g, ''))) return choiceWhere(q, c => /no answer: it is undefined/.test(c));
    return undefined;
  }
  return out(boardValue(q));
};
F.compound = q => out(boardValue(q));
F.powers = q => out(boardValue(q));
F.ratMul = q => ans(q, boardValue(q));
F.ratDiv = q => ans(q, boardValue(q));

/** sign of a rate verb in a story: +1 up / more, −1 down / less */
function rateSign(p) {
  if (/\b(rises|adds|swims up|climbs|gains|earns|deposits|goes up|grows)\b/.test(p)) return +1;
  if (/\b(falls|sinks|drops|spends|swims down|charges|loses|goes down|withdraws|fell|dropped)\b/.test(p)) return -1;
  return 0;
}
F.jumps = q => {
  const p = clean(q.prompt);
  const r = p.match(/(rises|adds|swims up|climbs|falls|sinks|drops|spends|swims down) \$?(\d+(?:\.\d+)?)/);
  const t = p.match(/(\d+) (hours?|weeks?|seconds?|minutes?|days?) (ago|from now)/);
  if (!r || !t) return undefined;
  const rate = dec(r[2]).mul(rateSign(r[1]));
  const time = Q(Number(t[1]) * (t[3] === 'ago' ? -1 : 1));
  return out(rate.mul(time));
};

F.oneNeg = q => {
  const p = clean(q.prompt);
  let m;
  if ((m = p.match(/says: "(.*?) = (.*?), but (.*?) = (.*?), because the first number decides the sign\." Is \w+ right\?/))) {
    const a = val(m[1]), b = val(m[3]);
    return choiceWhere(q, c => { const k = clean(c).match(/^No: both are (-?\d+(?:\.\d+)?(?:\/\d+)?)\./); return !!k && a.eq(b) && a.eq(num(k[1])) && /order of the factors does not change/.test(c); });
  }
  if ((m = p.match(/is (.*?) closer to 0 than (.*?), or farther from 0\?/))) {
    const x = val(m[1]), y = val(m[2]), d = Math.abs(x.value) - Math.abs(y.value);
    return choiceWhere(q, c => (d < 0 ? /^Closer/ : d > 0 ? /^Farther/ : /^The same distance/).test(c));
  }
  return ans(q, boardValue(q));
};

F.missing = q => {
  const p = clean(q.prompt);
  let m;
  if ((m = p.match(/is (.*?) (?:farther from 0 than|closer to 0 than) (.*?), or (?:closer to|farther from) 0\?/))) {
    const x = val(m[1]), y = val(m[2]), d = Math.abs(x.value) - Math.abs(y.value);
    return choiceWhere(q, c => (d < 0 ? /^Closer/ : d > 0 ? /^Farther/ : /^The same distance/).test(c));
  }
  if ((m = p.match(/So (.*?) = \?$/))) return ans(q, val(m[1]));
  return undefined;
};

F.pattern = q => {
  const p = clean(q.prompt);
  let m;
  if ((m = p.match(/^Why is (.*?) positive\?$/))) {
    const prod = val(m[1]);
    return choiceWhere(q, c => {
      const t = clean(c);
      const k = t.match(/^(.*?) = (.*?) = (.*?), so (.*?) is the opposite of (-?\d+(?:\.\d+)?(?:\/\d+)?)\.$/);
      if (!k) return false;   // "a rule", or "like (−5) + (−5)" (a sum, which is negative) are no reasons
      const a = tryVal(k[1]), b = tryVal(k[2]), z = tryVal(k[3]), x = tryVal(k[4]), o = num(k[5]);
      return a && b && z && x && a.eq(b) && b.eq(z) && z.n === 0 && x.eq(prod) && x.eq(o.neg());
    });
  }
  if ((m = p.match(/So what (?:must|is) (\(.*?\)\(.*?\))(?: be)?\?$/))) return ans(q, val(m[1]));
  if ((m = p.match(/What is (\(.*?\) × \(.*?\))\?$/))) return ans(q, val(m[1]));
  return undefined;
};

F.zero = q => {
  const p = clean(q.prompt);
  let m;
  if (/Is 0 a positive number or a negative number\?/.test(p)) return choiceWhere(q, c => /^Neither: 0 is not positive and not negative/.test(c));
  if ((m = p.match(/^What is (.*)\?$/))) {
    const e = m[1];
    const dz = e.match(/^(.*?) ÷ 0$/);
    if (dz) {
      const a = val(dz[1]);
      return choiceWhere(q, c => (a.n === 0 ? /every number works/ : /^Undefined: no number works/).test(c));
    }
    const v = val(e);
    return choiceWhere(q, c => !/^Undefined/.test(c) && tryVal(c)?.eq(v));
  }
  return undefined;
};

F.counters = q => {
  const p = clean(q.prompt);
  let m;
  if ((m = p.match(/had (\d+) zero pairs\. Then (\d+) groups of (\d+) (positive|negative) counters were taken out/))) {
    const n = Number(m[2]) * Number(m[3]);
    return m[4] === 'positive' ? -n : n;   // taking out positives leaves their negative partners
  }
  if ((m = p.match(/put in (\d+) groups of (\d+) (positive|negative) counters\. What is the value/))) return Number(m[1]) * Number(m[2]) * (m[3] === 'positive' ? 1 : -1);
  if ((m = p.match(/How many groups of (-?\d+) make (-?\d+)\?/))) return Number(m[2]) / Number(m[1]);
  if ((m = p.match(/(-?\d+) is shared into (\d+) equal groups/))) return Number(m[1]) / Number(m[2]);
  if ((m = p.match(/you TAKE OUT (\d+) groups of (\d+) (positive|negative) counters\. The mat starts empty/))) {
    const n = Number(m[1]) * Number(m[2]);
    // nothing to take out of an empty mat: first put in enough zero pairs
    return choiceWhere(q, c => new RegExp(`^Put in ${n} zero pairs, then take out the groups`).test(clean(c)));
  }
  return undefined;
};

/** a/b written with the minus anywhere: "−9/5", "9/−5", "−9/−5" */
function signedFrac(t) {
  const m = clean(t).trim().match(/^(-?)(\d+)\/(-?)(\d+)$/);
  if (!m) return null;
  if (Number(m[4]) === 0) return 'undef';
  return Q(Number(m[2]) * (m[1] ? -1 : 1), Number(m[4]) * (m[3] ? -1 : 1));
}
F.signPlace = q => {
  const p = clean(q.prompt);
  let m;
  const texFrac = t => { const k = texExpr(t).replace(/\s/g, '').match(/^(-?)\(\((-?\d+)\)\/\((-?\d+)\)\)$/); return k ? Q(Number(k[2]) * (k[1] ? -1 : 1), Number(k[3])) : null; };
  if ((m = p.match(/^Which one equals (.*)\?$/))) { const x = signedFrac(m[1]); return choiceWhere(q, c => { const y = signedFrac(c); return y && y !== 'undef' && y.eq(x); }); }
  if ((m = p.match(/^What is (.*)\?$/))) {
    const x = signedFrac(m[1]);
    if (x === 'undef') return choiceWhere(q, c => /^Undefined/.test(c));
    return choiceWhere(q, c => !/^Undefined/.test(c) && tryVal(c)?.eq(x));
  }
  if (/Which one is different\?/.test(p)) {
    const vs = q.choices.map(c => signedFrac(c));
    const idx = vs.map((v, i) => i).filter(i => vs.filter(w => w && w.eq(vs[i])).length === 1);
    return idx.length === 1 ? idx[0] : -1;
  }
  if ((m = p.match(/^Is (.*) positive or negative\?$/))) { const x = signedFrac(m[1]); return choiceWhere(q, c => (sign(x) > 0 ? /^Positive/ : sign(x) < 0 ? /^Negative/ : /^Neither/).test(c)); }
  return undefined;
};

/** units → +1 for a "higher / warmer / more" word, −1 for "lower / colder / less" */
const dirWord = w => (/warmer|higher|more/.test(w) ? 1 : -1);
F.meaning = q => {
  const p = clean(q.prompt);
  let m;
  if ((m = p.match(/What does (.*?) = (.*?) tell you\?$/))) {
    const f = m[1].match(/^\((-?[\d.]+)\) × \((-?[\d.]+)\)$|^(-?[\d.]+) × \((-?[\d.]+)\)$|^\((-?[\d.]+)\) × (-?[\d.]+)$/);
    const r = p.match(/(rises|falls|sinks|drops|swims up|swims down|climbs) (\d+(?:\.\d+)?)/);
    if (!f || !r) return undefined;
    const rate = dec(r[2]).mul(rateSign(r[1]));
    return choiceWhere(q, c => {
      const t = clean(c);
      const k = t.match(/^(?:In (\d+) (\w+) it will be|(\d+) (\w+) ago it was) (\d+(?:\.\d+)?) (?:°F|ft|in\.) (warmer|colder|higher|lower) than now\.$/);
      if (!k) return false;
      const time = k[1] ? Number(k[1]) : -Number(k[3]);
      const change = dec(k[5]).mul(dirWord(k[6]));
      // the choice's time × the story's rate must give its change, and match the equation it explains
      return rate.mul(time).eq(change) && val(m[2]).eq(change) && val(m[1]).eq(change);
    });
  }
  // "which expression gives the share / change per …": the signed total over the (positive) count
  let total = null, count = null;
  if ((m = p.match(/A debt of \$(\d+(?:\.\d+)?) is shared equally by (\d+) friends/))) { total = dec(m[1]).neg(); count = Number(m[2]); }
  else if ((m = p.match(/(fell|rose|dropped) (\d+(?:\.\d+)?) °F over (\d+) hours/))) { total = dec(m[2]).mul(m[1] === 'rose' ? 1 : -1); count = Number(m[3]); }
  else if ((m = p.match(/went (\d+(?:\.\d+)?) ft (down|up) in (\d+) (?:minutes|seconds)/))) { total = dec(m[1]).mul(m[2] === 'up' ? 1 : -1); count = Number(m[3]); }
  if (total) {
    return choiceWhere(q, c => {
      const k = clean(c).match(/^\(?(-?[\d.]+)\)? ÷ \(?(-?[\d.]+)\)?$/);
      return !!k && dec(k[1].replace('-', '')).mul(k[1].startsWith('-') ? -1 : 1).eq(total) && Number(k[2]) === count;
    });
  }
  return undefined;
};

/** a choice that writes "x × y = z": [x, y, z] as Q, else null */
function eqOf(t) {
  const k = clean(t).match(/^(.*?) × (.*?) = (.*?)$/);
  if (!k) return null;
  const x = tryVal(k[1]), y = tryVal(k[2]), z = tryVal(k[3]);
  return x && y && z ? [x, y, z] : null;
}
F.checkQ = q => {
  const p = clean(q.prompt);
  let m;
  if ((m = p.match(/^Which multiplication checks (.*?) ÷ (.*?) = (.*?)\?$/))) {
    const a = val(m[1]), b = val(m[2]), c0 = val(m[3]);
    // quotient × divisor = dividend
    return choiceWhere(q, c => { const e = eqOf(c); return !!e && e[0].mul(e[1]).eq(e[2]) && e[2].eq(a) && ((e[0].eq(c0) && e[1].eq(b)) || (e[0].eq(b) && e[1].eq(c0))); });
  }
  if ((m = p.match(/says (.*?) ÷ (.*?) = (.*?)\. Check it by multiplying(?:: .*?)?\. (?:Is \w+ right\?|So:)$/))) {
    const a = val(m[1]), b = val(m[2]), c0 = val(m[3]);
    if (b.n === 0) return choiceWhere(q, c => /^There is no answer: no number times 0 gives/.test(c));
    const right = c0.mul(b).eq(a), truth = a.div(b);
    return choiceWhere(q, c => {
      const t = clean(c);
      let k;
      if ((k = t.match(/^No: (.*?) × (.*?) = (.*?), not (.*?)\. It is (.*?)\.$/))) {
        const x = val(k[1]), y = val(k[2]), z = val(k[3]);
        return !right && x.mul(y).eq(z) && x.eq(c0) && y.eq(b) && val(k[4]).eq(a) && val(k[5]).eq(truth);
      }
      if ((k = t.match(/^Yes: (.*?) × (.*?) = (.*?)\.$/))) { const x = val(k[1]), y = val(k[2]), z = val(k[3]); return right && x.eq(c0) && y.eq(b) && z.eq(a) && x.mul(y).eq(z); }
      return false;   // "gives the right size" checks only the size, never the sign
    });
  }
  return undefined;
};

F.decimal = q => {
  const p = clean(q.prompt);
  let m;
  const x = boardValue(q);
  if (/terminate or repeat\?/.test(p)) {
    let d = x.d; while (d % 2 === 0) d /= 2; while (d % 5 === 0) d /= 5;
    return choiceWhere(q, c => (d === 1 ? /^It terminates/ : /^It repeats/).test(c));
  }
  if (/^Write .* as a decimal/.test(p)) return out(x);
  if ((m = p.match(/^Which is (.*) as a decimal\?$/))) {
    return choiceWhere(q, (c, i) => { const v = repeating(q.choicesHtml?.[i] ?? c); return !!v && v.eq(x); });
  }
  return undefined;
};
/** "−0.1<span class="rep">6</span>" → exact Q (the part in the rep span repeats forever) */
function repeating(html) {
  const s = clean(String(html).replace(/&minus;/g, '-'));
  const m = s.match(/^(-?)(\d+)\.(\d*)(?:<span class="rep">(\d+)<\/span>)?$/);
  if (!m) return null;
  const neg = m[1] === '-', W = Number(m[2]), A = m[3], R = m[4];
  let v = Q(W).add(A ? Q(Number(A), 10 ** A.length) : Q(0));
  if (R) v = v.add(Q(Number(R), (10 ** R.length - 1) * 10 ** A.length));
  return neg ? v.neg() : v;
}

F.sets = q => {
  const m = clean(q.prompt).match(/smallest set that (.*?) belongs to\?/);
  const x = signedFrac(m[1]) ?? val(m[1]);
  const set = x.d !== 1 ? 'Rational numbers' : x.n > 0 ? 'Counting numbers' : x.n === 0 ? 'Whole numbers' : 'Integers';
  return choiceWhere(q, c => c.trim() === set);
};

F.strategy = q => {
  const p = clean(q.prompt);
  let m;
  if ((m = p.match(/^Which property makes this true\? (.*) = (.*)$/))) {
    const A = m[1].replace(/\s/g, ''), B = m[2].replace(/\s/g, '');
    const va = tryVal(A.replace(/\[/g, '(').replace(/\]/g, ')')), vb = tryVal(B.replace(/\[/g, '(').replace(/\]/g, ')'));
    if (!va || !vb || !va.eq(vb)) return undefined;
    // a factor times a sum on one side only: distributive; the same factors in the same order, other grouping:
    // associative; the same factors in another order: commutative
    const sumIn = t => /\((?:[^()]*\d)[+-](?:\d[^()]*)\)/.test(t.replace(/\(-/g, '(~'));
    if (sumIn(A) !== sumIn(B)) return choiceWhere(q, c => /^Distributive/.test(c));
    const factors = t => t.replace(/[[\]]/g, '').match(/\([^()]*\)/g) ?? [];
    const fa = factors(A), fb = factors(B);
    if (fa.join() === fb.join() && A !== B) return choiceWhere(q, c => /^Associative/.test(c));
    if ([...fa].sort().join() === [...fb].sort().join()) return choiceWhere(q, c => /^Commutative/.test(c));
    return undefined;
  }
  if ((m = p.match(/^Do (.*?) and (.*?) have the same value\?$/))) {
    const a = val(m[1]), b = val(m[2]);
    if (a.eq(b)) return undefined;
    return choiceWhere(q, c => { const k = clean(c).match(/^No: (-?\d+(?:\.\d+)?(?:\/\d+)?) and (-?\d+(?:\.\d+)?(?:\/\d+)?)\./); return !!k && num(k[1]).eq(a) && num(k[2]).eq(b); });
  }
  if ((m = p.match(/^Use the distributive property: (.*?) = .* = \?$/))) return ans(q, val(m[1].replace(/(\d+) (\d+)\/(\d+)/g, '($1+$2/$3)')));
  return ans(q, boardValue(q));
};

F.argument = q => {
  const p = clean(q.prompt);
  let m;
  if (/PROVES that \(-a\)\(-b\) = ab for ANY/.test(p)) {
    // only an argument written with the letters, from the distributive property and 0, covers every a and b
    return choiceWhere(q, c => /^0 = \(-a\)\(b \+ \(-b\)\) = -ab \+ \(-a\)\(-b\)/.test(clean(c)) && /opposite of -ab/.test(clean(c)));
  }
  if ((m = p.match(/^0 = (.*?) = (-?\d+(?:\.\d+)?(?:\/\d+)?) \+ (\(.*?\)\(.*?\))\. What does this show about/))) {
    const first = num(m[2]), x = first.neg();
    return choiceWhere(q, c => { const k = clean(c).match(/^It is the opposite of (-?\d+(?:\.\d+)?(?:\/\d+)?), so it is (-?\d+(?:\.\d+)?(?:\/\d+)?)\.?$/); return !!k && num(k[1]).eq(first) && num(k[2]).eq(x) && val(m[3]).eq(x); });
  }
  if ((m = p.match(/0 = \((-?[\d/]+)\)\((-?[\d/]+) \+ \((-?[\d/]+)\)\) = ▢ \+/))) {
    const box = val(`(${m[1]})*(${m[2]})`);
    return choiceWhere(q, c => tryVal(c)?.eq(box));
  }
  return undefined;
};

F.evidence = q => {
  const p = clean(q.prompt);
  let m;
  if (/Which wording is always true\?/.test(p)) {
    // the product of two negatives is positive; their sum is negative
    return choiceWhere(q, c => /^The product of two negative numbers is positive\.?$/.test(clean(c)));
  }
  if ((m = p.match(/^Claim: "(.*?)" Evidence: (.*?)\. What kind of evidence is it\?$/))) {
    const claim = m[1], ev = m[2];
    if (/for any|for every|-ab \+ \(-a\)\(-b\)|0 = /.test(ev) && /[ab]/.test(ev.replace(/\d/g, ''))) return choiceWhere(q, c => /^A general argument/.test(c));
    const eq = ev.match(/^(.*?) = (-?\d+(?:\.\d+)?(?:\/\d+)?)$/);
    if (!eq) return undefined;
    const lhs = eq[1], v = val(lhs);
    if (!v.eq(num(eq[2]))) return undefined;
    // does this one case agree with the claim?
    const negFactors = (lhs.match(/\(-/g) ?? []).length, isSum = /\) \+ \(/.test(lhs);
    let agrees = null;
    if (/^Multiplying by a negative number always gives a negative number/.test(claim)) agrees = !isSum && negFactors >= 1 ? v.n < 0 : null;
    else if (/^Two negatives always make a positive/.test(claim)) agrees = negFactors === 2 ? v.n > 0 : null;
    else if (/^The product of two negative numbers is positive/.test(claim)) agrees = !isSum && negFactors === 2 ? v.n > 0 : null;
    if (agrees === null) return undefined;
    return choiceWhere(q, c => (agrees ? /^An example: it agrees with the claim but does not prove it/ : /^A counterexample/).test(c));
  }
  return undefined;
};

F.estimate = q => {
  const p = clean(q.prompt);
  let m;
  if ((m = p.match(/^Is (.*) positive or negative\?$/))) {
    const v = val(m[1]);
    return choiceWhere(q, c => (v.n > 0 ? /^Positive$/ : v.n < 0 ? /^Negative$/ : /^0/).test(c.trim()));
  }
  if ((m = p.match(/^A calculator shows (.*?) = (-?[\d.,]+)\. Is that reasonable\?$/))) {
    const exact = val(m[1]), claim = val(m[2]);
    const ok = sign(exact) === sign(claim) && Math.abs(claim.value / exact.value - 1) < 0.02;
    return choiceWhere(q, c => {
      const t = clean(c);
      if (/^Yes: it looks about right/.test(t)) return ok;
      let k;
      if ((k = t.match(/^Yes: about \((-?[\d.]+)\)\((-?[\d.]+)\) = (-?[\d.]+)$/))) {
        const e = num(k[1]).mul(num(k[2]));
        return e.eq(num(k[3])) && sign(e) === sign(claim) && Math.abs(claim.value / e.value - 1) < 0.25 && sign(claim) === sign(exact) && Math.abs(claim.value / exact.value - 1) < 0.02;
      }
      if ((k = t.match(/^No: about \((-?[\d.]+)\)\((-?[\d.]+)\) = (-?[\d.]+), so it is (\d+) times too (big|small)$/))) {
        const e = num(k[1]).mul(num(k[2]));
        const ratio = claim.value / e.value, f = Number(k[4]);
        return !ok && e.eq(num(k[3])) && sign(claim) === sign(e) && (k[5] === 'big' ? Math.abs(ratio / f - 1) < 0.25 : Math.abs(ratio * f - 1) < 0.25);
      }
      if ((k = t.match(/^No: about \((-?[\d.]+)\)\((-?[\d.]+)\) = (-?[\d.]+), so the sign is wrong$/))) {
        const e = num(k[1]).mul(num(k[2]));
        return !ok && e.eq(num(k[3])) && sign(claim) !== sign(exact) && Math.abs(Math.abs(claim.value) / Math.abs(exact.value) - 1) < 0.02;
      }
      return false;
    });
  }
  return undefined;
};

/** stories in one step */
F.story1 = q => {
  const p = clean(q.prompt);
  let m;
  if ((m = p.match(/share a debt of \$(\d+(?:\.\d+)?) equally: there are (\d+) of them/))) return out(dec(m[1]).neg().div(Number(m[2])));
  if ((m = p.match(/went (\d+(?:\.\d+)?) ft (down|up) in (\d+) (seconds|minutes)/))) return out(dec(m[1]).mul(m[2] === 'up' ? 1 : -1).div(Number(m[3])));
  if ((m = p.match(/charges a fee of \$(\d+(?:\.\d+)?) every (week|month|day)\. What is the change in the balance after (\d+)/))) return out(dec(m[1]).neg().mul(Number(m[3])));
  if ((m = p.match(/(fell|rose) (\d+(?:\.\d+)?) °F in (\d+) hours/))) return out(dec(m[2]).mul(m[1] === 'rose' ? 1 : -1).div(Number(m[3])));
  if ((m = p.match(/(drops|rises) (\d+(?:\.\d+)?(?: \d+\/\d+)?) in\. every day.*?what was the level (\d+) days ago/))) return out(num(m[2]).mul(m[1] === 'rises' ? 1 : -1).mul(-Number(m[3])));
  if ((m = p.match(/(drops|rises) (\d+(?:\.\d+)?(?: \d+\/\d+)?) in\. every day.*?what will the level be (\d+) days from now/))) return out(num(m[2]).mul(m[1] === 'rises' ? 1 : -1).mul(Number(m[3])));
  return undefined;
};
const clock = t => { const m = t.match(/^(\d+)(?::(\d+))? ?(a\.m\.|p\.m\.|noon)?$/); if (t === 'noon') return 12; if (!m) return null; let h = Number(m[1]) % 12; if (m[3] === 'p.m.') h += 12; return h + (m[2] ? Number(m[2]) / 60 : 0); };
F.storyMulti = q => {
  const p = clean(q.prompt);
  let m;
  if ((m = p.match(/is at (-?\d+(?:\.\d+)?) ft\. She sinks (\d+(?:\.\d+)?) ft per second for (\d+) seconds, then rises (\d+(?:\.\d+)?) ft/))) return out(num(m[1]).sub(dec(m[2]).mul(Number(m[3]))).add(dec(m[4])));
  if ((m = p.match(/At (noon|\d+(?::\d+)? ?[ap]\.m\.) it was (-?\d+(?:\.\d+)?) °F\. By (\d+(?::\d+)? ?[ap]\.m\.) it was (-?\d+(?:\.\d+)?) °F/))) {
    const h = clock(m[3]) - clock(m[1]);
    return out(num(m[4]).sub(num(m[2])).div(Q(h)));
  }
  if ((m = p.match(/starts at (\d+) ft (above|below) sea level, walks down (\d+) ft per minute for (\d+) minutes, then climbs (\d+) ft/))) return out(Q(Number(m[1]) * (m[2] === 'above' ? 1 : -1)).sub(Q(Number(m[3]) * Number(m[4]))).add(Number(m[5])));
  if ((m = p.match(/An account has \$(\d+(?:\.\d+)?)\. Then (\d+) withdrawals of \$(\d+(?:\.\d+)?) are made, and a deposit of \$(\d+(?:\.\d+)?)/))) return out(dec(m[1]).sub(dec(m[3]).mul(Number(m[2]))).add(dec(m[4])));
  return undefined;
};

F.signOnly = q => {
  const m = clean(q.prompt).match(/is (.*) positive, negative or 0\?/);
  const v = val(m[1]);
  return choiceWhere(q, c => (v.n > 0 ? /^Positive$/ : v.n < 0 ? /^Negative$/ : /^0$/).test(c.trim()));
};

export function solve(q) {
  const f = F[q.family];
  return f ? f(q) : undefined;
}

// ---------------------------------------------------------------- the world
export function sane(q) {
  const out = [], p = clean(q.prompt), b = String(q.board ?? '');
  let s; try { s = solve(q); } catch { s = undefined; }
  if (q.input === 'choice' && s === -1) out.push('no single right choice');
  // a bare positive factor glued to a bracket reads like digits: (−3)1(−2), 5(−2)(−1)5
  if (/\)\d|\d\(-/.test(texExpr(b).replace(/\s/g, '')) && /\(-\d+\)\d|\)\d+$|\d\(-\d+\)\(/.test(clean(q.prompt).replace(/\s/g, '').replace(/=\?$/, ''))) {
    if (/\)\d/.test(clean(q.prompt).replace(/\s/g, ''))) out.push('a factor written right after a bracket, like (−3)1(−2): reads as a glued-on digit');
  }
  // the story in a word problem must match the board's computation
  if (/^(jumps|story1|storyMulti)$/.test(q.family) && typeof s === 'number') {
    try { const bv = boardValue(q); if (!bv.eq(Q(s))) out.push(`the board computes ${bv.value}, the story gives ${s}`); } catch { /* no board value */ }
  }
  return [...new Set(out)].join('; ');
}

export default { solve, sane };
