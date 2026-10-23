// scientific-notation oracle (role O, docs/lessons/QUALITY_LAYER.md). Works every practice item out from what the
// student sees: the numbers in the prompt (and the board), the choices. All arithmetic is exact (BigInt fractions), so
// 7.9 × 10^8 − 1 × 10^6 is 7.89 × 10^8 with no float noise; a value is put into scientific notation a × 10^n with
// 1 ≤ a < 10. Story problems are modelled from their words (per person = divide, in all = add, …), never from the board.

// ---------------------------------------------------------------- exact fractions on BigInt
const babs = x => (x < 0n ? -x : x);
const bgcd = (a, b) => { a = babs(a); b = babs(b); while (b) [a, b] = [b, a % b]; return a; };
function R(n, d = 1n) { n = BigInt(n); d = BigInt(d); if (d < 0n) { n = -n; d = -d; } const g = bgcd(n, d) || 1n; return { n: n / g, d: d / g }; }
const add = (a, b) => R(a.n * b.d + b.n * a.d, a.d * b.d);
const sub = (a, b) => R(a.n * b.d - b.n * a.d, a.d * b.d);
const mul = (a, b) => R(a.n * b.n, a.d * b.d);
const div = (a, b) => { if (b.n === 0n) throw new Error('divide by 0'); return R(a.n * b.d, a.d * b.n); };
const eq = (a, b) => a.n === b.n && a.d === b.d;
const cmp = (a, b) => { const x = a.n * b.d - b.n * a.d; return x > 0n ? 1 : x < 0n ? -1 : 0; };
const pow10 = k => (k >= 0 ? R(10n ** BigInt(k)) : R(1n, 10n ** BigInt(-k)));
const ZERO = R(0), ONE = R(1);
/** '4,500,000' '0.000025' '7.89' '−3' '$2' → exact */
function dec(t) {
  const s = String(t).replace(/[−–]/g, '-').replace(/[$,\s]/g, '');
  const m = s.match(/^(-?)(\d*)(?:\.(\d+))?$/);
  if (!m || (m[2] === '' && !m[3])) throw new Error(`not a number: ${t}`);
  const frac = m[3] ?? '';
  const v = R(BigInt((m[2] || '0') + frac), 10n ** BigInt(frac.length));
  return m[1] ? R(-v.n, v.d) : v;
}
const toNum = a => Number(a.n) / Number(a.d);
/** the exact value as a short decimal number (a terminating fraction), else a float */
function numOut(a) {
  let d = a.d, k = 0; while (d % 10n === 0n) { d /= 10n; k++; }
  if (d === 1n) { const s = (babs(a.n)).toString().padStart(k + 1, '0'); const v = Number(`${a.n < 0n ? '-' : ''}${k ? s.slice(0, -k) + '.' + s.slice(-k) : s}`); return v; }
  return toNum(a);
}
const terminates = a => { let d = a.d; for (const p of [2n, 5n]) while (d % p === 0n) d /= p; return d === 1n; };
/** a > 0 → { a, n } with 1 ≤ a < 10 */
function sci(v) {
  if (v.n === 0n) return { a: ZERO, n: 0 };
  const pos = v.n < 0n ? R(-v.n, v.d) : v;
  let n = Math.floor(Math.log10(toNum(pos)));
  // fix the float guess exactly
  while (cmp(div(pos, pow10(n)), R(10)) >= 0) n++;
  while (cmp(div(pos, pow10(n)), ONE) < 0) n--;
  const a = div(pos, pow10(n));
  return { a: v.n < 0n ? R(-a.n, a.d) : a, n };
}
/** round half away from zero to `sig` significant digits → { a (exact), n } */
function roundSig(v, sig) {
  const s = sci(v);
  const k = pow10(sig - 1);
  const x = mul(s.a, k);
  const fl = x.n / x.d, rem = sub(x, R(fl));
  let r = cmp(rem, R(1n, 2n)) >= 0 ? fl + 1n : fl;
  const tie = eq(rem, R(1n, 2n));
  let a = div(R(r), k), n = s.n;
  if (cmp(a, R(10)) >= 0) { a = div(a, R(10)); n++; }
  return { a, n, tie };
}

// ---------------------------------------------------------------- expressions: a × 10^n, +, −, ×, ÷, (), powers
function parseExpr(text) {
  const s = String(text).replace(/[−–]/g, '-').replace(/\$/g, '').replace(/(\d),(\d{3})/g, '$1$2').replace(/(\d),(\d{3})/g, '$1$2')
    .replace(/×|·/g, '*').replace(/÷/g, '/');
  const toks = [];
  const re = /\s*(\d+\.?\d*|\.\d+|[-+*/()^])/y;
  let i = 0;
  while (i < s.length) {
    if (/\s/.test(s[i])) { i++; continue; }
    re.lastIndex = i; const m = re.exec(s);
    if (!m) throw new Error(`bad char in ${s}`);
    toks.push(m[1]); i = re.lastIndex;
  }
  let p = 0;
  const peek = () => toks[p], next = () => toks[p++];
  function expr() { let v = term(); while (peek() === '+' || peek() === '-') { const op = next(); const w = term(); v = op === '+' ? add(v, w) : sub(v, w); } return v; }
  function term() { let v = unary(); while (peek() === '*' || peek() === '/') { const op = next(); const w = unary(); v = op === '*' ? mul(v, w) : div(v, w); } return v; }
  function unary() { if (peek() === '-') { next(); const v = unary(); return R(-v.n, v.d); } if (peek() === '+') { next(); return unary(); } return power(); }
  function power() {
    const b = primary();
    if (peek() === '^') {
      next(); let neg = false; if (peek() === '-') { next(); neg = true; }
      const e = Number(next()); if (!Number.isInteger(e)) throw new Error('bad exponent');
      let r = ONE; for (let k = 0; k < e; k++) r = mul(r, b);
      return neg ? div(ONE, r) : r;
    }
    return b;
  }
  function primary() {
    const t = next();
    if (t === '(') { const v = expr(); if (next() !== ')') throw new Error('missing )'); return v; }
    if (t !== undefined && /^[\d.]/.test(t)) return dec(t);
    throw new Error(`unexpected ${t}`);
  }
  const v = expr();
  if (p !== toks.length) throw new Error(`trailing in ${s}`);
  return v;
}
const tryExpr = t => { try { return parseExpr(t); } catch { return null; } };
const NUMX = '([−-]?\\$?[\\d,]*\\.?\\d+(?: × 10\\^[−-]?\\d+)?)';
const val = t => parseExpr(t);
const pairOf = v => { const s = sci(v); return [numOut(s.a), s.n]; };

// ---------------------------------------------------------------- units
const LEN = { kilometers: 1e3, km: 1e3, meters: 1, m: 1, centimeters: 1e-2, cm: 1e-2, millimeters: 1e-3, mm: 1e-3, micrometers: 1e-6, 'µm': 1e-6, nanometers: 1e-9, nm: 1e-9 };
const MASS = { 'metric tons': 1e6, t: 1e6, kilograms: 1e3, kg: 1e3, grams: 1, g: 1, milligrams: 1e-3, mg: 1e-3 };
const VOL = { liters: 1, L: 1, milliliters: 1e-3, mL: 1e-3 };
const unitExp = u => { for (const T of [LEN, MASS, VOL]) if (u in T) return { k: Math.round(Math.log10(T[u])), dim: T }; return null; };
/** "3.5 millimeters (per month)" → exact value in the base unit, and the dimension */
function measure(t) {
  const m = String(t).trim().match(/^([\d.,]+(?: × 10\^[−-]?\d+)?) (metric tons|[a-zµA-Z]+)(?: per \w+)?$/);
  if (!m) return null;
  const u = unitExp(m[2]); if (!u) return null;
  return { v: mul(val(m[1]), pow10(u.k)), dim: u.dim };
}

// ---------------------------------------------------------------- story models (from the words)
function storyValue(p) {
  let m;
  const X = NUMX;
  if ((m = p.match(new RegExp(`A cell is ${X} m long\\. A row of these cells is ${X} m long\\.`)))) return div(val(m[2]), val(m[1]));
  if ((m = p.match(new RegExp(`A space probe flies ${X} km, then another ${X} km\\.`)))) return add(val(m[1]), val(m[2]));
  if ((m = p.match(new RegExp(`Each person uses about ${X} liters of water a day\\. A country has ${X} people\\.`)))) return mul(val(m[1]), val(m[2]));
  if ((m = p.match(new RegExp(`A government plans to spend ${X} in a year\\. The country has ${X} people\\.`)))) return div(val(m[1]), val(m[2]));
  if ((m = p.match(new RegExp(`A cup of water holds about ${X} drops\\. Each drop has about ${X} molecules, and one molecule has a mass of about ${X} kg\\.`)))) return mul(mul(val(m[1]), val(m[2])), val(m[3]));
  if ((m = p.match(new RegExp(`travels at the speed of light, about ${X} km per second\\. (?:A planet|The Moon|The Sun|Mars) is ${X} km away\\. A signal goes there and its echo comes back\\.`)))) return div(mul(R(2), val(m[2])), val(m[1]));
  if ((m = p.match(new RegExp(`Light travels about ${X} km every second\\. (?:A planet|The Moon|The Sun|Mars|A star) is ${X} km away\\.`)))) return div(val(m[2]), val(m[1]));
  if ((m = p.match(new RegExp(`One water molecule has a mass of about ${X} kg\\. A drop has about ${X} molecules\\.`)))) return mul(val(m[1]), val(m[2]));
  return null;
}

// ---------------------------------------------------------------- families
const F = {
  isSci(q) {
    const isSciText = t => { const m = String(t).match(/^([\d.]+) × 10\^[−-]?\d+$/); return !!m && cmp(dec(m[1]), ONE) >= 0 && cmp(dec(m[1]), R(10)) < 0; };
    let m;
    if (/^Which one is written in scientific notation\?/.test(q.prompt)) return q.choices.map(isSciText);
    if ((m = q.prompt.match(/^Is (.+?) written in scientific notation\?/))) {
      const ok = isSciText(m[1]), a = dec(m[1].match(/^([\d.]+)/)[1]);
      return q.choices.map(c => {
        if (/^Yes: the number in front is from 1 up to 10, and the exponent is a whole number\.$/.test(c)) return ok;
        if (/^No: the number in front must be less than 10, and 10 is not\.$/.test(c)) return !ok && eq(a, R(10));
        if (/^No: the number in front is 10 or more\.$/.test(c)) return !ok && cmp(a, R(10)) >= 0;
        if (/^No: the number in front is less than 1\.$/.test(c)) return !ok && cmp(a, ONE) < 0;
        return false; // "a number times a power of 10" (not enough), negative exponents, whole numbers, "bigger than 10"
      });
    }
    return null;
  },
  negMeaning(q) {
    let m;
    const v = val(texNum(q.board));
    return q.choices.map(c => {
      if ((m = c.match(/^A small positive number: (\S+) divided by 10, (\w+) times?, is ([\d.,]+)\.$/))) return v.n > 0n && cmp(v, ONE) < 0 && eq(dec(m[3]), v) && eq(div(dec(m[1]), pow10(words(m[2]))), v);
      if ((m = c.match(/^Multiply (\S+) by 10, (\w+) times?: ([\d.,]+)\.$/))) return eq(dec(m[3]), v) && eq(mul(dec(m[1]), pow10(words(m[2]))), v);
      return false; // a negative number, a big number, "write five zeros", "multiply by 5"
    });
  },
  toDecimal: q => val(texNum(q.board)),
  toSci: q => pairOf(val(texNum(q.board))),
  renorm: q => pairOf(val(texNum(q.board))),
  multiply: q => pairOf(val(q.prompt.match(/^Multiply: (.+)\. Give/)[1])),
  divide: q => pairOf(val(q.prompt.match(/^Divide: (.+)\. Give/)[1])),
  addSame: q => pairOf(val(q.prompt.match(/^Work out (.+)\. Give/)[1])),
  align: q => pairOf(val(q.prompt.match(/^Work out (.+)\. Give/)[1])),
  mixed: q => pairOf(val(q.prompt.match(/^Work out (.+)\. Give/)[1])),
  distribute(q) {
    const v = val(texNum(q.board));
    return q.choices.map(c => { const w = tryExpr(c.replace(/\+ −/g, '+ -')); return !!w && eq(w, v); });
  },
  sameNumber(q) {
    let m;
    if ((m = q.prompt.match(/^Is (.+?) the same number as (.+?)\?$/))) {
      const same = eq(val(m[1]), val(m[2]));
      return q.choices.map(c => (/^Yes: it is one number, written two ways\.$/.test(c) ? same : false));
    }
    if (/says you can’t add .+ because one is a decimal and the other is in scientific notation/.test(q.prompt)) {
      return q.choices.map(c => /^No: both are numbers\. Write them the same way, then add\.$/.test(c));
    }
    return null;
  },
  eNote(q) {
    const v = eValue(q.board);
    return q.choices.map(c => {
      if (/^An error/.test(c)) return false;
      const parts = c.split('=').map(s => s.trim());
      const vals = parts.map(tryExpr);
      return vals.every(w => !!w && eq(w, v));
    });
  },
  eDecimal: q => eValue(q.board),
  estimate(q) {
    const v = val(texNum(q.board.split('\\approx')[0]));
    const r = roundSig(v, 1);
    return [numOut(r.a), r.n];
  },
  times(q) {
    const p = q.prompt;
    let m;
    if ((m = p.match(new RegExp(`^How many times as large as ${NUMX} is ${NUMX}\\?$`)))) return div(val(m[2]), val(m[1]));
    const items = [...p.matchAll(new RegExp(`(?:^|\\. )([A-Z][^:.]*): about ${NUMX} (?:meters|km|people)`, 'g'))].map(x => ({ name: x[1].toLowerCase(), v: val(x[2]) }));
    const find = n => items.find(it => it.name === n.toLowerCase().trim())?.v;
    if ((m = p.match(/About how many times as long \(or wide\) as (.+?) is (.+?)\?$/))) return div(find(m[2]), find(m[1]));
    if ((m = p.match(/About how many times as far is (.+?) as (.+?)\?$/))) return div(find(m[1]), find(m[2]));
    if ((m = p.match(/About how many times as many people does (.+?) have as (.+?)\?$/))) return div(find(m[1]), find(m[2]));
    return null;
  },
  band(q) {
    const v = val(q.prompt.match(/Which band is (.+?) in\?$/)[1]);
    const n = sci(v).n;
    return q.choices.map(c => { const m = c.match(/^between 10\^([−-]?\d+) and 10\^([−-]?\d+)$/); return !!m && Number(m[1].replace('−', '-')) === n && Number(m[2].replace('−', '-')) === n + 1; });
  },
  bandVsRatio(q) {
    const p = q.prompt;
    let m;
    if ((m = p.match(/^How do (10\^[−-]?\d+) and (10\^[−-]?\d+) compare\?$/))) {
      const A = val(m[1]), B = val(m[2]);
      return q.choices.map(c => {
        const mm = c.match(/^(10\^[−-]?\d+) is ([\d,]+) times (10\^[−-]?\d+)\.$/);
        return !!mm && eq(val(mm[1]), A) && eq(val(mm[3]), B) && eq(div(A, B), dec(mm[2]));
      });
    }
    if ((m = p.match(new RegExp(`^A = ${NUMX} and B = ${NUMX}\\. Which is true\\?$`)))) {
      const A = val(m[1]), B = val(m[2]), ratio = div(B, A);
      const up = sci(B).n === sci(A).n + 1;
      return q.choices.map(c => {
        let mm;
        if ((mm = c.match(/^B is one band up, but only (about )?([\d.]+) times as big as A\.$/))) {
          if (!up) return false;
          return mm[1] ? !eq(ratio, dec(mm[2])) && Math.abs(toNum(ratio) - Number(mm[2])) <= 0.05 + 1e-12 : eq(ratio, dec(mm[2]));
        }
        if (/^B is exactly 10 times as big as A/.test(c)) return eq(ratio, R(10));
        return false; // "A is bigger, because 5 is more than 2.4", "B is just 1 more than A"
      });
    }
    return null;
  },
  convertUnit(q) {
    const p = q.prompt;
    const m = p.match(new RegExp(`is about ${NUMX} (\\S+)(?: per \\w+)?\\.|(?:is|holds|has a mass of|spreads about|grows about) ${NUMX} (\\S+)(?: per \\w+)?\\.`));
    const amount = val(m[1] ?? m[3]), from = m[2] ?? m[4];
    const u = p.match(/Use 1 (\S+) = 10\^([−-]?\d+) (\S+)\./);
    const to = p.match(/How much is that in (\w+(?: \w+)?)\?/)[1];
    const k = Number(u[2].replace('−', '-'));
    // 1 big = 10^k small
    const big = u[1], small = u[3];
    const want = from === big ? mul(amount, pow10(k)) : from === small ? div(amount, pow10(k)) : null;
    if (!want) return null;
    void to;
    return q.choices.map(c => { const mm = c.match(new RegExp(`^${NUMX} `)); return !!mm && eq(val(mm[1]), want); });
  },
  pickUnit(q) {
    const p = q.prompt;
    let m;
    if (/as a number from 1 to 1,000, with a unit/.test(p)) {
      return q.choices.map(c => { const mm = c.match(/^([\d.,]+) /); if (!mm) return false; const v = dec(mm[1]); return cmp(v, ONE) >= 0 && cmp(v, R(1000)) <= 0; });
    }
    if ((m = p.match(/can be written as (.+?) or as (.+?)\. Which is true\?$/))) {
      const A = measure(m[1]), B = measure(m[2]);
      if (!A || !B) return null;
      const c0 = cmp(A.v, B.v);
      return q.choices.map(c => {
        if (/^They are the same \w+, written with different units\.$/.test(c)) return c0 === 0;
        const mm = c.match(/^(.+?) is more: /);
        if (mm) { const X = measure(mm[1]); return !!X && c0 !== 0 && /its (unit|number) is bigger/.test(c) && false; }
        return false;
      });
    }
    return null;
  },
  story(q) { const v = storyValue(q.prompt); return v ? pairOf(v) : null; },
  storyOp(q) {
    const v = storyValue(q.prompt); if (!v) return null;
    return q.choices.map(c => { const w = tryExpr(c); return !!w && eq(w, v); });
  },
  report(q) {
    const v = storyValue(q.prompt); if (!v) return null;
    const sig = { two: 2, three: 3, one: 1 }[(q.prompt.match(/The measurements have (\w+) significant digits?/) ?? [])[1]] ?? 2;
    const r = roundSig(v, sig);
    return q.choices.map(c => {
      const mm = c.match(/^(\d\.\d+|\d) × 10\^([−-]?\d+) (\S.*)$/);
      if (!mm) return false; // no unit, not scientific notation, or false precision
      const digits = mm[1].replace('.', '').length;
      return digits === sig && eq(dec(mm[1]), r.a) && Number(mm[2].replace('−', '-')) === r.n;
    });
  },
};
const words = w => ({ one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10 })[w] ?? Number(w);
/** the number on the board: '9.85 \times 10^{-7} = \,?' → '9.85 × 10^−7' */
function texNum(tex) {
  return String(tex).split(/=|\\overset/)[0].replace(/\\times/g, '×').replace(/\\div/g, '÷').replace(/\{,\}/g, ',').replace(/\\[,;: ]/g, ' ')
    .replace(/\^\{([^{}]*)\}/g, '^$1').replace(/\\dfrac\{([^{}]*)\}\{([^{}]*)\}/g, '($1) ÷ ($2)').replace(/[{}]/g, '').replace(/\\approx.*/, '').trim();
}
/** E-notation on the board: \texttt{4.2E-2} */
function eValue(tex) {
  const m = String(tex).match(/([\d.]+)E([+-]?)(\d+)/);
  return mul(dec(m[1]), pow10((m[2] === '-' ? -1 : 1) * Number(m[3])));
}

// ---------------------------------------------------------------- what the story world allows
function worldProblems(q, r) {
  const probs = [];
  if (q.family === 'estimate') {
    const v = val(texNum(q.board.split('\\approx')[0]));
    const rs = roundSig(v, 1);
    if (rs.tie) probs.push(`${numOut(v)} is exactly halfway: one digit could be ${numOut(rs.a)} or one less`);
  }
  if (q.family === 'pickUnit' && /All three are correct measurements/.test(q.prompt)) {
    const ms = q.choices.map(measure);
    if (ms.some(x => !x)) probs.push('a choice has a unit this oracle cannot read');
    else if (!ms.every(x => eq(x.v, ms[0].v))) probs.push('the three measurements are not the same amount');
  }
  if (['story', 'storyOp', 'report'].includes(q.family)) {
    const v = storyValue(q.prompt);
    if (v && !terminates(v)) probs.push(`the answer ${toNum(v)} does not end`);
    if (v && /How many cells/.test(q.prompt) && v.d !== 1n) probs.push(`${toNum(v)} cells`);
  }
  if (['multiply', 'divide', 'mixed', 'times'].includes(q.family) && r && typeof r === 'object' && !Array.isArray(r) && 'n' in r && !terminates(r)) probs.push('the answer does not end');
  return probs;
}

// ---------------------------------------------------------------- contract
const pick = arr => { const hits = arr.map((ok, i) => (ok ? i : -1)).filter(i => i >= 0); return hits.length ? hits[0] : -1; };
function runF(q) { const f = F[q.family]; return f ? f(q) : undefined; }
export default {
  solve(q) {
    let r;
    try { r = runF(q); } catch { return undefined; }
    if (r == null) return undefined;
    if (q.input === 'choice') return Array.isArray(r) ? pick(r) : undefined;
    if (q.input === 'pair') return r;
    return typeof r === 'object' && 'n' in r ? numOut(r) : r;
  },
  sane(q) {
    let r;
    try { r = runF(q); } catch (e) { return `could not read the item (${e.message})`; }
    const probs = [];
    if (q.input === 'choice' && Array.isArray(r)) {
      const n = r.filter(Boolean).length;
      if (n === 0) probs.push('no choice is right');
      if (n > 1) probs.push(`${n} choices are right: ${q.choices.filter((_, i) => r[i]).join(' | ')}`);
    }
    try { probs.push(...worldProblems(q, r)); } catch (e) { probs.push(`could not check the story (${e.message})`); }
    return probs.join('; ');
  },
};
