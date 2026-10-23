// irrational-numbers oracle (role O, docs/lessons/QUALITY_LAYER.md). Works every practice item out from what the
// student sees: the board TeX, the prompt HTML (its plain text drops '<' and the repeat bars), the choices' HTML
// (overlines, roots, fraction bars) and, for "which point", the drawn positions of the lettered marks.
// Every number is held exactly where it can be (fractions; a root as sign·√(a/b)); irrational values are compared
// through 40-digit BigInt approximations (π to 50 digits, roots by integer square root). Choices are judged by their
// claim: the verdict must be true AND every number or equation in the reason must be true; reasons that are the
// catalogue's misconceptions ("it has a root sign", "the digits go on forever", "round the inputs first") are false.
import { Q } from '../../tools/quality/oracle-kit.mjs';

// ---------------------------------------------------------------- exact helpers
const gcd = (a, b) => { a = Math.abs(a); b = Math.abs(b); while (b) [a, b] = [b, a % b]; return a; };
function decQ(s) {
  const t = String(s).trim().replace(/[−–]/g, '-').replace(/,/g, '');
  const m = t.match(/^([-+]?)(\d*)(?:\.(\d*))?$/);
  if (!m || (m[2] === '' && !m[3])) throw new Error(`not a number: ${s}`);
  const d = m[3] ? 10 ** m[3].length : 1, n = Number((m[2] || '0') + (m[3] || ''));
  return Q(m[1] === '-' ? -n : n, d);
}
const isqrtN = n => { const r = Math.round(Math.sqrt(n)); return r * r === n ? r : null; };
/** √q exactly when q is the square of a fraction, else null */
function sqrtQ(q) { if (q.n < 0) return null; const a = isqrtN(q.n), b = isqrtN(q.d); return a != null && b != null ? Q(a, b) : null; }

// ---- 40-digit reals ----
const P = 40, S = 10n ** BigInt(P);
const PI_S = BigInt('3' + '1415926535897932384626433832795028841971');   // π · 10^40, truncated
function isqrtB(n) {   // Newton from above: floor(√n)
  if (n < 2n) return n;
  let x = 1n << BigInt(Math.ceil(n.toString(2).length / 2) + 1);
  for (;;) { const y = (x + n / x) >> 1n; if (y >= x) return x; x = y; }
}
const qBig = q => (BigInt(q.n) * S) / BigInt(q.d);
/** a value: { q } rational (exact), or { big, irr: true } irrational (big = value · 10^40) */
const rat = q => ({ q });
const irr = big => ({ big, irr: true });
const big = v => (v.q ? qBig(v.q) : v.big);
function cmpV(a, b) {
  if (a.q && b.q) return a.q.cmp(b.q);
  const d = big(a) - big(b);
  return d > 1000n ? 1 : d < -1000n ? -1 : 0;   // only rational pairs can be equal; 1000 units = 1e-37
}
const eqV = (a, b) => a.q && b.q ? a.q.eq(b.q) : false;
function sqrtV(q, sign = 1) {
  const r = sqrtQ(q);
  if (r) return rat(sign < 0 ? r.neg() : r);
  const b = isqrtB((BigInt(q.n) * S * S) / BigInt(q.d));
  return irr(sign < 0 ? -b : b);
}
const piV = (k = Q(1)) => irr((PI_S * BigInt(k.n)) / BigInt(k.d));
const addV = (a, b) => (a.q && b.q ? rat(a.q.add(b.q)) : irr(big(a) + big(b)));
const mulQ = (a, k) => (a.q ? rat(a.q.mul(k)) : irr((a.big * BigInt(k.n)) / BigInt(k.d)));
/** round a value to `places` decimals (half away from zero); returns { v: Number, tie } */
function roundV(v, places) {
  if (v.q) {
    const k = 10 ** places, x = v.q.mul(k), sgn = x.n < 0 ? -1 : 1, ax = Q(Math.abs(x.n), x.d);
    const fl = Math.floor(ax.n / ax.d), fr = ax.sub(fl);
    const up = fr.cmp(Q(1, 2)) >= 0, tie = fr.eq(Q(1, 2));
    return { v: Number((sgn * (fl + (up ? 1 : 0)) / k).toFixed(places)), tie };
  }
  const unit = 10n ** BigInt(P - places), b = v.big, ab = b < 0n ? -b : b;
  const r = (ab * 2n + unit) / (2n * unit);
  return { v: Number(((b < 0n ? -1 : 1) * Number(r) / 10 ** places).toFixed(places)), tie: false };
}
const floorPlaces = (v, places) => { const unit = 10n ** BigInt(P - places), b = big(v); let f = b / unit; if (b < 0n && f * unit !== b) f -= 1n; return Number(f); };

// ---------------------------------------------------------------- reading numbers
const decode = s => String(s ?? '')
  .replace(/&#8202;|&#8201;|&thinsp;|&nbsp;|&#160;/g, ' ').replace(/&minus;/g, '−').replace(/&times;/g, '×')
  .replace(/&divide;/g, '÷').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&le;/g, '≤').replace(/&ge;/g, '≥')
  .replace(/&pi;/g, 'π').replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(Number(d))).replace(/&amp;/g, '&');
/** HTML → TeX-ish text: bars → \overline{}, roots → \sqrt{}, fraction spans → \tfrac{}{}, tags dropped */
function htmlTex(h) {
  let s = String(h ?? '');
  for (let i = 0; i < 4; i++) {
    s = s.replace(/<span class="fr"><span>([^<]*)<\/span><span>([^<]*)<\/span><\/span>/g, '\\tfrac{$1}{$2}')
      .replace(/<span class="ov">([^<]*)<\/span>/g, '\\overline{$1}')
      .replace(/<span class="rad">√<span>((?:(?!<span|<\/span>).|\\tfrac\{[^}]*\}\{[^}]*\})*)<\/span><\/span>/g, '\\sqrt{$1}');
  }
  return decode(s.replace(/<br\s*\/?>/g, ' ').replace(/<[^>]+>/g, '')).replace(/\s+/g, ' ').trim();
}
/** HTML → readable maths text: √x, √(a/b), a/b */
function htmlText(h) {
  return htmlTex(h).replace(/\\sqrt\{\\tfrac\{([^}]*)\}\{([^}]*)\}\}/g, '√($1/$2)').replace(/\\sqrt\{([^}]*)\}/g, '√$1')
    .replace(/\\tfrac\{([^}]*)\}\{([^}]*)\}/g, '$1/$2').replace(/\\overline\{([^}]*)\}/g, '[$1]');
}
/**
 * one number in TeX-ish text → { val, form } where form says how it is written:
 *  'int' | 'dec' (ends) | 'rep' (bar) | 'pattern' (… with no repeat) | 'frac' | 'mixed' | 'pct' | 'sqrt' | 'pi' | 'zeroDen'
 */
function parseNum(t0) {
  let t = String(t0).replace(/\\,|\\;|\\ |~/g, ' ').replace(/\\left|\\right/g, '').replace(/[−–]/g, '-').replace(/π/g, '\\pi ').replace(/√\(([^)]*)\)/g, (_, x) => `\\sqrt{${x.replace(/(.+)\/(.+)/, '\\tfrac{$1}{$2}')}}`)
    .replace(/√(\d+(?:\.\d+)?)/g, '\\sqrt{$1}').replace(/\{\\ldots\}|\\ldots|…/g, '…').trim();
  let sign = 1;
  if (/^-/.test(t)) { sign = -1; t = t.slice(1).trim(); }
  if (/^\(.*\)$/.test(t)) t = t.slice(1, -1).trim();
  let m;
  const sq = (v) => (sign < 0 ? (v.q ? rat(v.q.neg()) : irr(-v.big)) : v);
  if ((m = t.match(/^(\d+(?:\.\d+)?)?\s*\\pi$/))) return { val: sq(piV(m[1] ? decQ(m[1]) : Q(1))), form: 'pi', k: m[1] ? decQ(m[1]) : Q(1) };
  if ((m = t.match(/^\\sqrt\{\\[td]?frac\{(\d+)\}\{(\d+)\}\}$/))) { const r = Q(+m[1], +m[2]); return { val: sqrtV(r, sign), form: 'sqrt', rad: r, radN: +m[1], radD: +m[2], sign }; }
  if ((m = t.match(/^(\d+)?\s*\\sqrt\{(\d+(?:\.\d+)?)\}$/))) {
    const r = decQ(m[2]), k = m[1] ? Q(+m[1]) : Q(1), v = sqrtV(r, sign);
    return { val: v.q ? rat(v.q.mul(k)) : irr(v.big * BigInt(k.n)), form: 'sqrt', rad: r, radText: m[2], sign, k };
  }
  if ((m = t.match(/^\\[td]?frac\{\s*(-?\d+)\s*\}\{\s*(-?\d+)\s*\}$/)) || (m = t.match(/^(-?\d+)\s*\/\s*(-?\d+)$/))) {
    if (+m[2] === 0) return { val: null, form: 'zeroDen' };
    return { val: rat(Q(+m[1], +m[2]).mul(sign)), form: 'frac', fn: +m[1], fd: +m[2] };
  }
  if ((m = t.match(/^(\d+)\s*\\[td]?frac\{(\d+)\}\{(\d+)\}$/)) || (m = t.match(/^(\d+)\s+(\d+)\/(\d+)$/))) return { val: rat(Q(+m[2], +m[3]).add(+m[1]).mul(sign)), form: 'mixed' };
  if ((m = t.match(/^(\d+(?:\.\d+)?)\s*\\?%$/))) return { val: rat(decQ(m[1]).div(100).mul(sign)), form: 'pct' };
  if ((m = t.match(/^(\d+)\.(\d*)\\overline\{(\d+)\}$/))) return { val: rat(repQ(+m[1], m[2], m[3]).mul(sign)), form: 'rep', int: +m[1], pre: m[2], rep: m[3] };
  if ((m = t.match(/^(\d+)\.(\d+)…$/))) {
    // a board "…" decimal is one of the lesson's never-repeating patterns (0.1010010001…, 5.1211211121111…);
    // a repeat is drawn with a bar. A digit run like "1111" at the end is part of the growing pattern, not a repeat.
    const d = m[2], per = null;
    if (per) return { val: rat(repQ(+m[1], d.slice(0, per.s), d.slice(per.s, per.s + per.L)).mul(sign)), form: 'rep', int: +m[1], pre: d.slice(0, per.s), rep: d.slice(per.s, per.s + per.L), dots: true };
    return { val: irr(qBig(decQ(`${m[1]}.${d}`)) * BigInt(sign)), form: 'pattern', digits: d };
  }
  if ((m = t.match(/^\d+(?:\.\d+)?$/))) return { val: rat(decQ(t).mul(sign)), form: /\./.test(t) ? 'dec' : 'int', text: t };
  throw new Error(`cannot read number: ${t0}`);
}
/** int.pre(rep)(rep)… as a fraction */
function repQ(int, pre, rep) {
  const a = Number(pre + rep), b = Number(pre || '0');
  return Q(a - b, (10 ** rep.length - 1) * 10 ** pre.length).add(int);
}
/** a digit string that visibly repeats (period L ≤ 6, at least 3 periods shown, or one digit 4+ times) → { s, L } */
function periodic(d) {
  for (let L = 1; L <= 6; L++) for (let s = 0; s + 3 * L <= d.length || (L === 1 && s + 4 <= d.length); s++) {
    const tail = d.slice(s);
    if (tail.length < Math.max(3 * L, L === 1 ? 4 : 0)) continue;
    let ok = true; for (let i = L; i < tail.length; i++) if (tail[i] !== tail[i - L]) { ok = false; break; }
    if (ok) return { s, L };
  }
  return null;
}
const isRat = x => !!x.val?.q;

// texts
const ptext = q => htmlText(q.promptHtml ?? q.prompt);
const ctexts = q => (q.choicesHtml ?? q.choices ?? []).map(htmlText);
const ctexes = q => (q.choicesHtml ?? q.choices ?? []).map(htmlTex);
const num = s => decQ(String(s).replace(/[−–]/g, '-'));
const NUM = '-?−?\\d+(?:\\.\\d+)?';
const eqNum = (a, b) => num(a).eq(typeof b === 'object' ? b : num(b));
/** "a < X < b" bounds in a text; X a word/expression */
function boundsOf(text) {
  return [...String(text).replace(/[−–]/g, '-').matchAll(/(-?\d+(?:\.\d+)?)\s*<\s*([^<]+?)\s*<\s*(-?\d+(?:\.\d+)?)/g)].map(m => ({ lo: num(m[1]), x: m[2].trim(), hi: num(m[3]) }));
}
const placesOf = t => (/nearest tenth/.test(t) ? 1 : /nearest hundredth/.test(t) ? 2 : /nearest thousandth/.test(t) ? 3 : /nearest whole/.test(t) ? 0 : null);
const unitOf = p => Q(1, 10 ** p);

// ---------------------------------------------------------------- the families
const F = {
  asQuotient(q) {
    const x = parseNum(q.board.split('=')[0]);
    return x.val.q.pair;
  },
  notRational(q) {
    const p = ptext(q), cs = ctexts(q);
    if (/NOT a rational/.test(p)) return cs.map(c => { try { return parseNum(c).form === 'zeroDen'; } catch { return false; } });
    let m;
    if ((m = p.match(/[“"](−?\d+) is an integer, so it is not a rational number/))) {
      const n = num(m[1]);
      return cs.map(c => { const mm = c.replace(/[−–]/g, '-').match(/^No: (-?\d+) = (-?\d+)\/(-?\d+), a quotient of integers/); return !!mm && num(mm[1]).eq(n) && Q(+mm[2], +mm[3]).eq(n); });
    }
    if (/^Where is/.test(p)) {
      const x = parseNum(q.board.split('=')[0]).val.q;
      return cs.map(c => {
        const mm = c.replace(/[−–]/g, '-').match(/^At (-?\d+(?:\.\d+)?): (.*)$/);
        if (!mm || !num(mm[1]).eq(x)) return false;
        const r = mm[2];
        let k;
        if ((k = r.match(/^(\d+)\/(\d+) to the (left|right) of 0$/))) return Q(+k[1], +k[2]).mul(k[3] === 'left' ? -1 : 1).eq(x);
        return false;
      });
    }
    return null;
  },
  remainders(q) {
    const p = ptext(q), cs = ctexts(q);
    let m;
    if ((m = p.match(/long division by (\d+), every remainder/i))) return +m[1] - 1;
    if (/^Why does the decimal/.test(p)) {
      const f = parseNum(q.board.split('=')[0]);
      const D = f.fd;
      return cs.map(c => { const mm = c.match(/^There are only (\d+) nonzero remainders when you divide by (\d+), so one comes back/); return !!mm && +mm[2] === D && +mm[1] === D - 1; });
    }
    if ((m = p.match(/Long division of (\d+) ÷ (\d+): the remainders are ([\d, ]+(?:and then \d+)?) again\. What happens/))) {
      const a = +m[1], b = +m[2];
      const listed = m[3].replace(/and then/g, ',').split(',').map(s => s.trim()).filter(Boolean).map(Number);
      const real = []; let r = a % b; const seen = new Set();
      while (!seen.has(r) && r !== 0) { seen.add(r); real.push(r); r = (r * 10) % b; }
      real.push(r);
      const repeats = r !== 0;
      return cs.map(c => (/^They repeat:/.test(c) ? repeats : /^The division stops/.test(c) ? !repeats : false));
    }
    return null;
  },
  barNotation(q) {
    const v = parseNum(q.board.split('=')[0]).val;
    return ctexes(q).map(c => { try { const x = parseNum(c); return x.form === 'rep' && eqV(x.val, v); } catch { return false; } });
  },
  addressOf(q) {
    const p = ptext(q), v = parseNum(q.board.replace(/\\square\s*<|<\s*\\square/g, '')).val;
    const pl = /tenths/.test(p) ? 1 : /hundredths/.test(p) ? 2 : null;
    const lo = Q(floorPlaces(v, pl), 10 ** pl);
    return [lo.value, lo.add(unitOf(pl)).value];
  },
  prefixWhere(q) {
    const p = ptext(q), cs = ctexts(q);
    let m;
    if ((m = p.match(/decimal starts (\d+(?:\.\d+)?)…/))) {
      const a = num(m[1]), k = m[1].split('.')[1].length;
      return cs.map(c => { const mm = c.match(/^Between (\d+(?:\.\d+)?) and (\d+(?:\.\d+)?)$/); return !!mm && num(mm[1]).eq(a) && num(mm[2]).eq(a.add(unitOf(k))); });
    }
    if ((m = p.match(/How many numbers are there between (\d+(?:\.\d+)?) and (\d+(?:\.\d+)?)\?/))) {
      const a = num(m[1]), b = num(m[2]);
      return cs.map(c => {
        if (!/^Infinitely many:/.test(c)) return false;
        return [...c.matchAll(/\d+\.\d+/g)].every(x => num(x[0]).cmp(a) > 0 && num(x[0]).cmp(b) < 0);
      });
    }
    if (/never ends\. Does it have an exact place/.test(p)) {
      const v = parseNum(q.board.split('=')[0]).val;
      return cs.map(c => { const mm = c.match(/^Yes: it is (\d+)\/(\d+), one exact point/); return !!mm && Q(+mm[1], +mm[2]).eq(v.q); });
    }
    return null;
  },
  rOrI(q) {
    const x = parseNum(q.board);
    return ctexts(q).map(c => claimRI(c, x));
  },
  displayRead(q) {
    const p = ptext(q), cs = ctexts(q);
    let m;
    if (/screen shows (\d+(?:\.\d+)?) and nothing else/.test(p)) return cs.map(c => /^No: many numbers, rational and irrational, start with these digits/.test(c));
    if ((m = p.match(/calculator shows (\d+) ÷ (\d+) = (\d+(?:\.\d+)?), with no repeat in sight\. Is (\d+)\/(\d+) rational/))) {
      const v = Q(+m[1], +m[2]), shown = num(m[3]);
      const exact = v.eq(shown);
      return cs.map(c => {
        let mm;
        if ((mm = c.match(/^Rational: it is (\d+) ÷ (\d+)\. Its repeat is just longer than the screen/))) return Q(+mm[1], +mm[2]).eq(v) && !exact;
        if ((mm = c.match(/^Rational, because it is exactly (\d+(?:\.\d+)?)/))) return exact && num(mm[1]).eq(v);
        return false;
      });
    }
    if ((m = p.match(/calculator shows √(\d+) = (\d+(?:\.\d+)?)\. Does the screen prove that √(\d+) is irrational/))) {
      const n = +m[1];
      return cs.map(c => { const mm = c.match(/^No: a screen shows only the first digits\. √(\d+) is irrational because (\d+) is not a perfect square/); return !!mm && +mm[1] === n && +mm[2] === n && isqrtN(n) == null; });
    }
    return null;
  },
  innermost(q) {
    const x = parseNum(q.board);
    const v = x.val;
    const inSet = name => {
      if (/^Irrational/.test(name)) return !v.q;
      if (!v.q) return /^Real/.test(name);
      const int = v.q.d === 1;
      if (/^Natural/.test(name)) return int && v.q.n > 0;
      if (/^Whole/.test(name)) return int && v.q.n >= 0;
      if (/^Integers/.test(name)) return int;
      if (/^Rational/.test(name)) return true;
      if (/^Real/.test(name)) return true;
      return false;
    };
    const rank = name => ['Natural', 'Whole', 'Integers', 'Rational', 'Irrational', 'Real'].findIndex(k => name.startsWith(k));
    const cs = ctexts(q);
    const hold = cs.map((c, i) => ({ c, i, ok: inSet(c), r: rank(c) })).filter(o => o.ok);
    if (!hold.length) return cs.map(() => false);
    // the smallest: a set that sits inside every other listed set holding the value
    const best = hold.reduce((a, b) => (a.r <= b.r ? a : b));
    return cs.map((_, i) => i === best.i);
  },
  setStatement(q) {
    const p = ptext(q), cs = ctexts(q);
    let m, truth = null, good = null;
    if ((m = p.match(/[“"](−?\d+) is a natural number, a whole number, an integer and a rational number/))) {
      const n = num(m[1]); truth = n.d === 1 && n.n > 0;
      good = c => (truth ? /^True: the sets are nested, so (−?\d+) is in all four/.test(c) && eqNum(c.match(/so (−?\d+)/)[1], n) : false);
    } else if (/Every whole number is a natural number/.test(p)) { truth = false; good = c => /^False: 0 is a whole number but not a counting number/.test(c); }
    else if (/Some irrational numbers are also rational/.test(p)) { truth = false; good = c => /^False: irrational means NOT rational/.test(c); }
    else if ((m = p.match(/[“"](−?√\d+) is an integer/))) {
      const v = parseNum(m[1]).val; truth = !!v.q && v.q.d === 1;
      good = c => { const mm = c.match(/^True: (−?√\d+) = (−?\d+)\.$/); return truth && !!mm && parseNum(mm[1]).val.q?.eq(num(mm[2])); };
    } else if (/Every real number is either rational or irrational/.test(p)) { truth = true; good = c => /^True: a real number that is not rational is, by definition, irrational/.test(c); }
    else if (/Every integer is a rational number/.test(p)) { truth = true; good = c => /^True: any integer n can be written as n\/1/.test(c); }
    if (good == null) return null;
    return cs.map(c => (truth ? /^True/.test(c) : /^False/.test(c)) && good(c));
  },
  whichRational(q) {
    return ctexes(q).map(c => isRat(parseNum(c)));
  },
  rootFraction(q) {
    const x = parseNum(q.board.split('=')[0]);
    if (!x.val.q) return null;
    return x.val.q.pair;
  },
  toFraction(q) {
    const x = parseNum(q.board.split('=')[1]);
    return x.val.q.pair;
  },
  whichShift(q) {
    const v = parseNum(q.board.split('=')[1]).val.q;
    const fr = z => z.sub(Math.floor(z.n / z.d));
    return ctexts(q).map(c => {
      const mm = c.replace(/[−–]/g, '-').match(/^(\d*)x - (\d*)x$/);
      if (!mm) return false;
      const A = Q(+(mm[1] || 1)), B = Q(+(mm[2] || 1));
      return fr(v.mul(A)).eq(fr(v.mul(B))) && !A.eq(B);
    });
  },
  generalMethod(q) {
    return ctexts(q).map(c => /^Yes: any repeating tail can be lined up with a shifted copy/.test(c));
  },
  bracket(q) {
    const x = parseNum(q.board.replace(/\\square\s*<|<\s*\\square/g, '')).val;
    const lo = floorPlaces(x, 0);
    return [lo, lo + 1];
  },
  refine(q) {
    const p = ptext(q), x = parseNum(q.board.replace(/\\square\s*<|<\s*\\square/g, '')).val;
    const pl = /two tenths/.test(p) ? 1 : /two hundredths/.test(p) ? 2 : null;
    const lo = Q(floorPlaces(x, pl), 10 ** pl);
    return [lo.value, lo.add(unitOf(pl)).value];
  },
  interpolate(q) {
    const p = ptext(q), cs = ctexts(q);
    const b = boundsOf(p).pop();                         // the claimed tenths
    const x = parseNum(b.x).val;
    const claimTrue = cmpV(rat(b.lo), x) < 0 && cmpV(x, rat(b.hi)) < 0;
    return cs.map(c => {
      if (/^Yes:/.test(c)) return false;                 // "close enough" / "the same fraction of the way": no proof
      const mm = boundsOf(c)[0];
      if (!/^No: squaring shows/.test(c) || !mm) return false;
      return !claimTrue && cmpV(rat(mm.lo), x) < 0 && cmpV(x, rat(mm.hi)) < 0 && mm.hi.sub(mm.lo).eq(Q(1, 10));
    });
  },
  roundRoot(q) {
    const p = ptext(q), pl = placesOf(p);
    const x = parseNum(q.board.split('\\approx')[0]).val;
    return roundV(x, pl).v;
  },
  settles(q) {
    const p = ptext(q), cs = ctexts(q), pl = placesOf(p);
    const b = boundsOf(q.board.replace(/\\sqrt\{(\d+)\}/g, '√$1').replace(/\\pi/g, 'π'))[0];
    const mids = midsInside(b.lo, b.hi, pl);
    const settled = mids.length === 0;
    const r = settled ? roundV(rat(b.lo.add(b.hi).div(2)), pl).v : null;
    return cs.map(c => {
      let mm;
      if ((mm = c.match(/^Yes: (\d+(?:\.\d+)?)\. The whole interval is on one side of (\d+(?:\.\d+)?)\.$/))) {
        const m = num(mm[2]);
        return settled && num(mm[1]).eq(decQ(String(r))) && isMid(m, pl) && (b.hi.cmp(m) <= 0 || b.lo.cmp(m) >= 0);
      }
      if ((mm = c.match(/^No: the interval crosses (\d+(?:\.\d+)?), so it could round either way/))) return !settled && mids.some(m => m.eq(num(mm[1])));
      return false;
    });
  },
  locate(q) {
    const x = parseNum(q.board).val;
    const marks = q.data?.pic?.p?.marks ?? [];
    const cs = ctexts(q);
    const vals = marks.map(mk => ({ t: mk.t, v: markVal(mk.x) }));
    const d = vals.map(o => abs(big(o.v) - big(x)));
    let bi = -1; d.forEach((e, i) => { if (bi < 0 || e < d[bi]) bi = i; });
    const tol = S / 100000n;   // the right point sits on x (to 1e-5)
    const hit = bi >= 0 && d[bi] <= tol ? vals[bi].t : null;
    return cs.map(c => { const mm = c.match(/^Point ([A-Z])$/); return !!mm && mm[1] === hit; });
  },
  compare(q) {
    const [a, b] = q.board.split('\\square').map(s => parseNum(s));
    const c = cmpV(a.val, b.val);
    const sym = c < 0 ? '<' : c > 0 ? '>' : '=';
    return ctexts(q).map(t => t.trim() === sym);
  },
  order(q) {
    const items = q.board.split(/,\s*\\ \\ |,\\ \\ /).map(s => s.trim()).filter(Boolean).map(parseNum);
    return ctexes(q).map(c => {
      const parts = c.split(',').map(s => s.trim()).map(parseNum);
      if (parts.length !== items.length) return false;
      // the same numbers as the board
      const used = new Set();
      for (const pt of parts) { const i = items.findIndex((it, k) => !used.has(k) && cmpV(it.val, pt.val) === 0); if (i < 0) return false; used.add(i); }
      for (let i = 1; i < parts.length; i++) if (cmpV(parts[i - 1].val, parts[i].val) > 0) return false;
      return true;
    });
  },
  estimate(q) {
    const p = ptext(q), pl = placesOf(p);
    const ap = {};
    for (const m of p.replace(/[−–]/g, '-').matchAll(/(π|√\d+) ≈ (\d+(?:\.\d+)?)/g)) ap[m[1]] = num(m[2]);
    const e = exprVal(texExpr(q.board.split('\\approx')[0]), ap);
    return roundV(rat(e), pl).v;
  },
  exactOrNot(q) {
    const [a, b] = q.board.split('\\square').map(s => parseNum(s));
    const eq = cmpV(a.val, b.val) === 0;
    return ctexts(q).map(c => {
      if (/^Neither/.test(c)) return false;
      if (/^=: they are exactly the same number/.test(c)) return eq;
      let mm;
      if ((mm = c.match(/^=: (\d+(?:\.\d+)?) is how you write (\d+)\/(\d+) as a decimal/))) return eq && num(mm[1]).eq(Q(+mm[2], +mm[3]));
      if (/^=: they round to the same value/.test(c)) return false;
      if (/^≈: a decimal can never equal a fraction exactly/.test(c)) return false;
      if (/^≈: .* is only (rounded|close to)/.test(c)) return !eq;
      return false;
    });
  },
  maxError(q) {
    const p = ptext(q);
    const b = boundsOf(p)[0];
    const m = p.match(/and uses (\d+(?:\.\d+)?) for/);
    const v = num(m[1]);
    const e = v.sub(b.lo).cmp(b.hi.sub(v)) >= 0 ? v.sub(b.lo) : b.hi.sub(v);
    return e.value;
  },
  howClose(q) {
    const p = ptext(q), cs = ctexts(q);
    let m;
    if ((m = p.match(/writes (π|√\d+) ≈ (\d+(?:\.\d+)?)\. How close is (\d+(?:\.\d+)?) guaranteed/))) {
      const b = boundsOf(p)[0], v = num(m[2]);
      const g = v.sub(b.lo).cmp(b.hi.sub(v)) >= 0 ? v.sub(b.lo) : b.hi.sub(v);   // the guaranteed distance
      const inside = v.cmp(b.lo) >= 0 && v.cmp(b.hi) <= 0;
      return cs.map(c => {
        const mm = c.match(/^Within (\d+(?:\.\d+)?): that is all the interval guarantees/);
        return !!mm && inside && num(mm[1]).cmp(g) >= 0 && num(mm[1]).eq(b.hi.sub(b.lo));
      });
    }
    if ((m = p.match(/types (\d+) × (\d+(?:\.\d+)?) for (\d+)π, and the calculator shows (\d+(?:\.\d+)?)\. Is that within (\d+(?:\.\d+)?) of (\d+)π/))) {
      const k = Q(+m[1]), shown = num(m[4]), tol = num(m[5]);
      const real = piV(k);
      const diff = abs(big(real) - qBig(shown));
      const within = diff < qBig(tol);
      return cs.map(c => {
        let mm;
        if ((mm = c.match(/^Not for sure: (\d+(?:\.\d+)?) < π < (\d+(?:\.\d+)?) only puts (\d+)π between (\d+(?:\.\d+)?) and (\d+(?:\.\d+)?)/))) {
          const lo = num(mm[1]), hi = num(mm[2]);
          const okNums = Q(+mm[3]).eq(k) && lo.mul(k).eq(num(mm[4])) && hi.mul(k).eq(num(mm[5])) && cmpV(rat(lo), piV()) < 0 && cmpV(piV(), rat(hi)) < 0;
          return okNums && !(hi.mul(k).sub(shown).cmp(tol) < 0 && shown.sub(lo.mul(k)).cmp(tol) < 0);   // the bounds do not settle "within"
        }
        if (/^Yes:/.test(c)) return false;   // decimal places shown / "the calculator worked it out" prove nothing
        if (/^No\b/.test(c)) return !within;
        return false;
      });
    }
    return null;
  },
  boundExpr(q) {
    const p = ptext(q);
    const bs = boundsOf(p);
    const lo = {}, hi = {};
    for (const b of bs) { lo[b.x] = b.lo; hi[b.x] = b.hi; }
    const e = texExpr(q.board.replace(/\\square\s*<|<\s*\\square/g, ''));
    return [exprVal(e, lo).value, exprVal(e, hi).value];   // every expression here grows with each root / π
  },
  boundRound(q) {
    const p = ptext(q), cs = ctexts(q), pl = placesOf(p);
    const bs = boundsOf(p), b = bs[bs.length - 1];
    const mids = midsInside(b.lo, b.hi, pl);
    const settled = mids.length === 0;
    const r = settled ? roundV(rat(b.lo.add(b.hi).div(2)), pl).v : null;
    return cs.map(c => {
      let mm;
      if ((mm = c.match(/^(-?\d+(?:\.\d+)?): every number from (\d+(?:\.\d+)?) to (\d+(?:\.\d+)?) rounds to (\d+(?:\.\d+)?)\.$/))) return settled && num(mm[1]).eq(decQ(String(r))) && num(mm[4]).eq(decQ(String(r))) && num(mm[2]).eq(b.lo) && num(mm[3]).eq(b.hi) && sameDigits(mm[1], pl);
      if (/^Can't tell yet: the interval crosses a rounding midpoint/.test(c)) return !settled;
      return false;   // "the bounds are not exact", "round up to be safe", "round the inputs first", "the lower bound rounds to it"
    });
  },
  notEqual(q) {
    const p = ptext(q), cs = ctexts(q);
    let m;
    if ((m = p.match(/knows (\S+) < A < (\S+) and (\S+) < B < (\S+)\. The middles are/))) {
      const [a1, a2, b1, b2] = [m[1], m[2], m[3], m[4]].map(num);
      const lo = a1.cmp(b1) >= 0 ? a1 : b1, hi = a2.cmp(b2) <= 0 ? a2 : b2;
      const overlap = lo.cmp(hi) < 0;
      return cs.map(c => {
        const mm = c.match(/^No: the intervals overlap \(from (\d+(?:\.\d+)?) to (\d+(?:\.\d+)?)\), so A and B could be equal/);
        if (mm) return overlap && num(mm[1]).eq(lo) && num(mm[2]).eq(hi);
        if (/^Yes: A and B are different: the intervals do not overlap/.test(c)) return !overlap;
        return false;   // different estimates / "B's interval starts higher" prove nothing
      });
    }
    if ((m = p.match(/Is (√\d+) \+ (√\d+) equal to (√\d+)\?/))) {
      const bs = boundsOf(p); const lo = {}, hi = {};
      for (const b of bs) { lo[b.x] = b.lo; hi[b.x] = b.hi; }
      const sumLo = lo[m[1]].add(lo[m[2]]), sumHi = hi[m[1]].add(hi[m[2]]);
      const cLo = lo[m[3]], cHi = hi[m[3]];
      const apart = sumLo.cmp(cHi) >= 0 || sumHi.cmp(cLo) <= 0;
      return cs.map(c => {
        const mm = c.match(/^No: (√\d+) \+ (√\d+) is above (\d+(?:\.\d+)?), and (√\d+) is below (\d+(?:\.\d+)?)\.$/);
        if (mm) return apart && mm[1] === m[1] && mm[2] === m[2] && mm[4] === m[3] && num(mm[3]).eq(sumLo) && num(mm[5]).eq(cHi) && sumLo.cmp(cHi) >= 0;
        return false;
      });
    }
    return null;
  },
  decide(q) {
    const p = ptext(q), cs = ctexts(q);
    let m;
    if ((m = p.match(/its area is exactly (\d+)π sq in.*Is the area more than (\d+(?:\.\d+)?) sq in\?/))) {
      const k = Q(+m[1]), v = num(m[2]);
      const more = cmpV(piV(k), rat(v)) > 0;
      return cs.map(c => {
        const mm = c.match(/^Yes: π > (\d+(?:\.\d+)?), so (\d+)π > (\d+(?:\.\d+)?)\.$/);
        if (mm) return more && cmpV(piV(), rat(num(mm[1]))) > 0 && Q(+mm[2]).eq(k) && num(mm[3]).eq(v) && num(mm[1]).mul(k).cmp(v) >= 0;
        const nn = c.match(/^No: π < (\d+(?:\.\d+)?), so (\d+)π < (\d+(?:\.\d+)?)\.$/);
        if (nn) return !more && cmpV(piV(), rat(num(nn[1]))) < 0 && Q(+nn[2]).eq(k) && num(nn[3]).eq(v) && num(nn[1]).mul(k).cmp(v) <= 0;
        return false;
      });
    }
    if ((m = p.match(/area of exactly (\d+(?:\.\d+)?) sq ft, so its side is √(\d+) ft\. Will it slide through a gap (\d+(?:\.\d+)?) ft wide/))) {
      const s = sqrtV(Q(+m[2])), g = num(m[3]);
      const fits = cmpV(s, rat(g)) < 0;
      return cs.map(c => {
        let mm;
        if ((mm = c.match(/^Yes: √(\d+) < (\d+(?:\.\d+)?) ≤ (\d+(?:\.\d+)?)\.$/))) return fits && +mm[1] === +m[2] && cmpV(s, rat(num(mm[2]))) < 0 && num(mm[2]).cmp(num(mm[3])) <= 0 && num(mm[3]).eq(g);
        if ((mm = c.match(/^No: √(\d+) > (\d+(?:\.\d+)?) ≥ (\d+(?:\.\d+)?)\.$/))) return !fits && +mm[1] === +m[2] && cmpV(s, rat(num(mm[2]))) > 0 && num(mm[2]).cmp(num(mm[3])) >= 0 && num(mm[3]).eq(g);
        return false;   // "√a ≈ r, and r < g" decides with a rounded value; "can't know" is false
      });
    }
    if ((m = p.match(/side of a square tile with a tape: (\d+(?:\.\d+)?) ft, to the nearest tenth\. \w+ writes: “The area is exactly (\d+(?:\.\d+)?) sq ft\.” Is that right\?/))) {
      const s = num(m[1]), a = num(m[2]);
      return cs.map(c => {
        const mm = c.match(/^No: (\d+(?:\.\d+)?) ft is a rounded measurement, so the area is only about (\d+(?:\.\d+)?) sq ft/);
        return !!mm && num(mm[1]).eq(s) && num(mm[2]).eq(a) && s.mul(s).eq(a);
      });
    }
    return null;
  },
};

// ---- rational or irrational, with the reason ----
function claimRI(c0, x) {
  const c = c0.replace(/[−–]/g, '-').trim();
  const isR = isRat(x);
  let m;
  if (/^(Neither|Two numbers|Not a real number)/.test(c)) return false;
  if ((m = c.match(/^Irrational: (.*)$/))) {
    if (isR) return false;
    const r = m[1];
    if (/^its decimal never ends and never repeats\.?$/.test(r)) return true;
    if (/^it never settles into one block that repeats\.?$/.test(r)) return x.form === 'pattern';
    let k;
    if ((k = r.match(/^(\d+) is not a perfect square, so its root never ends or repeats\.?$/))) return x.form === 'sqrt' && x.rad.d === 1 && x.rad.n === +k[1] && isqrtN(+k[1]) == null;
    if ((k = r.match(/^in lowest terms it is (\d+)\/(\d+), and (\d+) is not a perfect square\.?$/))) {
      const f = Q(+k[1], +k[2]);
      return x.form === 'sqrt' && f.n === +k[1] && f.d === +k[2] && x.rad.eq(f) && (+k[3] === f.n || +k[3] === f.d) && isqrtN(+k[3]) == null;
    }
    if ((k = r.match(/^(\d+) and (\d+) are not both perfect squares\.?$/))) return x.form === 'sqrt' && x.radN === +k[1] && x.radD === +k[2] && !(isqrtN(x.rad.n) != null && isqrtN(x.rad.d) != null);
    return false;   // "digits go on forever", "every root", "root sign", "it is π", "no fraction bar", ...
  }
  if ((m = c.match(/^Rational: (.*)$/))) {
    if (!isR) return false;
    const r = m[1].replace(/\.$/, '');
    let k;
    if ((k = r.match(/^it repeats, so it equals a fraction \((\d+)\/(\d+)\)$/))) return x.form === 'rep' && Q(+k[1], +k[2]).eq(x.val.q);
    if ((k = r.match(/^it ends, so (\d+(?:\.\d+)?) = (\d+)\/(\d+)$/))) return x.form === 'dec' && num(k[1]).eq(x.val.q) && Q(+k[2], +k[3]).eq(x.val.q);
    if ((k = r.match(/^it is a quotient of integers \(it is only close to π\)$/))) return x.form === 'frac' && cmpV(x.val, piV()) !== 0;
    if (/a decimal that ends|digits follow a pattern|it starts|written with a fraction|^π =/.test(r)) return false;
    // an equation chain "√36 = 6 = 6/1", "√(16/49) = 4/7": every part must equal the number
    if (/=/.test(r)) {
      const parts = r.split('=').map(s => s.trim());
      try { return parts.every(pt => { const v = parseNum(pt).val; return !!v?.q && v.q.eq(x.val.q); }); } catch { return false; }
    }
    return false;
  }
  return false;
}

// ---- rounding midpoints ----
const isMid = (m, pl) => { const z = m.mul(10 ** pl).sub(Q(1, 2)); return z.d === 1; };
/** the rounding midpoints strictly inside (lo, hi) for `pl` places */
function midsInside(lo, hi, pl) {
  const k = 10 ** pl, out = [];
  const start = Math.floor(lo.mul(k).value) - 1, end = Math.ceil(hi.mul(k).value) + 1;
  for (let i = start; i <= end; i++) { const m = Q(2 * i + 1, 2 * k); if (lo.cmp(m) < 0 && m.cmp(hi) < 0) out.push(m); }
  return out;
}
/** "15.9" has the right number of decimals for pl (a whole-number answer has none) */
const sameDigits = (s, pl) => ((String(s).split('.')[1] ?? '').length === pl);

// ---- points on the line ----
function markVal(x) {
  if (!x) return rat(Q(0));
  if (x.kind === 'frac') return rat(Q(x.p, x.q));
  if (x.kind === 'sqrt') return sqrtV(Q(x.a, x.b ?? 1), x.sign ?? 1);
  if (x.kind === 'pi') return piV();
  throw new Error('unknown mark');
}
const abs = b => (b < 0n ? -b : b);

// ---- expressions with π and roots: "k π", "π^2", "π × r^2", "m √a + c", "√a + √b" ----
function texExpr(tex) {
  return String(tex).replace(/\\sqrt\{(\d+)\}/g, '√$1').replace(/\\pi/g, 'π').replace(/\\times/g, '×').replace(/[{}]/g, '').replace(/\\[,;: ]/g, ' ').replace(/[−–]/g, '-').replace(/\s+/g, ' ').trim();
}
/** evaluate with the given values for π / √a (exact fractions) */
function exprVal(e, vals) {
  const terms = e.split(/\s*\+\s*/);
  return terms.reduce((acc, t) => acc.add(termVal(t.trim(), vals)), Q(0));
}
function termVal(t, vals) {
  let m;
  if ((m = t.match(/^π\^2$/))) return vals['π'].mul(vals['π']);
  if ((m = t.match(/^π × (\d+)\^2$/))) return vals['π'].mul(+m[1] * +m[1]);
  if ((m = t.match(/^(\d*)\s*(π|√\d+)$/))) { const v = vals[m[2]]; if (!v) throw new Error(`no value for ${m[2]}`); return v.mul(m[1] ? +m[1] : 1); }
  if ((m = t.match(/^\d+(?:\.\d+)?$/))) return decQ(t);
  throw new Error(`cannot read term ${t}`);
}

// ---------------------------------------------------------------- sane: what is impossible or unfair
function saneOf(q, r) {
  const probs = [];
  const p = ptext(q);
  if (q.input === 'choice') {
    if (Array.isArray(r)) {
      const n = r.filter(Boolean).length;
      if (n === 0) probs.push('no choice is right');
      if (n > 1) probs.push(`${n} choices are right`);
    }
  }
  try {
    // every "a² = b" the prompt states must be true
    for (const m of p.matchAll(/(\d+(?:\.\d+)?)² = (\d+(?:\.\d+)?)/g)) if (!num(m[1]).mul(num(m[1])).eq(num(m[2]))) probs.push(`the prompt says ${m[1]}² = ${m[2]}`);
    // every "lo < X < hi" the prompt or board states about a single root / π must be true
    // (interpolate: the bounds are the claim being judged, not a given)
    const bt = q.family === 'interpolate' ? [] : [...boundsOf(p), ...boundsOf(texExpr(q.board).replace(/\\overset\?/g, ''))];
    for (const b of bt) {
      let v = null;
      if (/^(√\d+|π)$/.test(b.x)) v = parseNum(b.x).val;
      if (v && !(cmpV(rat(b.lo), v) < 0 && cmpV(v, rat(b.hi)) < 0)) probs.push(`${b.lo} < ${b.x} < ${b.hi} is false`);
    }
    // the digits a prompt shows for a number ("√8 = 2.8284…", "7/9 = 0.777…") must be its digits
    let m;
    if (q.family === 'roundRoot' && (m = p.match(/^(π|√\d+|\d+\/\d+) = (\d+(?:\.\d+)?)…/))) {
      const v = parseNum(m[1]).val, k = m[2].split('.')[1].length;
      if (Q(floorPlaces(v, k), 10 ** k).cmp(num(m[2])) !== 0) probs.push(`${m[1]} does not start ${m[2]}`);
    }
    if (q.family === 'roundRoot') {
      const x = parseNum(q.board.split('\\approx')[0]).val, pl = placesOf(p);
      if (roundV(x, pl).tie) probs.push('the exact value is a rounding tie');
      const bb = boundsOf(p)[0];
      if (bb && /nearest whole/.test(p) && !(bb.hi.sub(bb.lo).eq(1))) probs.push('the whole-number bounds are not consecutive');
    }
    if (q.family === 'addressOf' || q.family === 'refine') {
      const x = parseNum(q.board.replace(/\\square\s*<|<\s*\\square/g, '')).val, pl = /tenths/.test(p) ? 1 : 2;
      if (x.q && x.q.mul(10 ** pl).d === 1) probs.push('the number sits exactly on a mark, so no strict pair exists');
      if (q.family === 'refine') {
        // the trial squares given must bracket the root
        const sq = [...p.matchAll(/(\d+(?:\.\d+)?)² = (\d+(?:\.\d+)?)/g)];
        const n = parseNum(q.board.replace(/\\square\s*<|<\s*\\square/g, '')).rad;
        if (sq.length && n && !(sq.some(s => num(s[2]).cmp(n) < 0) && sq.some(s => num(s[2]).cmp(n) > 0))) probs.push('the trial squares do not bracket the number');
      }
    }
    if (q.family === 'bracket') {
      const x = parseNum(q.board.replace(/\\square\s*<|<\s*\\square/g, '')).val;
      if (x.q && x.q.d === 1) probs.push('the root is a whole number, so no strict pair exists');
    }
    if (q.family === 'remainders' && (m = p.match(/Long division of (\d+) ÷ (\d+): the remainders are ([\d, ]+(?:and then \d+)?) again\./))) {
      const a = +m[1], b = +m[2];
      const listed = m[3].replace(/and then/g, ',').split(',').map(s => s.trim()).filter(Boolean).map(Number);
      const real = []; let rr = a % b; const seen = new Set();
      while (!seen.has(rr) && rr !== 0) { seen.add(rr); real.push(rr); rr = (rr * 10) % b; }
      real.push(rr);
      if (listed.join() !== real.join()) probs.push(`the remainders of ${a} ÷ ${b} are ${real.join(', ')}, not ${listed.join(', ')}`);
    }
    if (q.family === 'locate') {
      const x = parseNum(q.board).val;
      const ds = (q.data?.pic?.p?.marks ?? []).map(mk => abs(big(markVal(mk.x)) - big(x))).sort((a, b) => (a < b ? -1 : 1));
      if (ds.length > 1 && ds[1] < S / 50n) probs.push('two marks are within 0.02 of the number');
    }
    if (q.family === 'order') {
      const items = q.board.split(/,\s*\\ \\ |,\\ \\ /).map(s => s.trim()).filter(Boolean).map(parseNum);
      for (let i = 0; i < items.length; i++) for (let j = i + 1; j < items.length; j++) if (cmpV(items[i].val, items[j].val) === 0) probs.push('two numbers in the list are equal');
    }
    if (q.family === 'barNotation') {
      // the board's digits must belong to the fraction
      const [f, d] = q.board.split('=');
      const v = parseNum(f).val, ds = d.replace(/\{\\ldots\}/, '').trim();
      const k = ds.split('.')[1].length;
      if (Q(floorPlaces(v, k), 10 ** k).cmp(num(ds)) !== 0) probs.push(`${texExpr(f)} does not start ${ds}`);
    }
    if (q.family === 'boundRound' || q.family === 'notEqual' || q.family === 'boundExpr') {
      // carried bounds the prompt states must be the carried values
      const bs = boundsOf(p);
      const lo = {}, hi = {};
      for (const b of bs) if (/^(√\d+|π)$/.test(b.x)) { lo[b.x] = b.lo; hi[b.x] = b.hi; }
      for (const b of bs) if (!/^(√\d+|π)$/.test(b.x) && !/^[AB]$/.test(b.x)) {
        try { const e = b.x.replace(/²/g, '^2'); if (!exprVal(e, lo).eq(b.lo) || !exprVal(e, hi).eq(b.hi)) probs.push(`the carried bounds of ${b.x} are not ${b.lo} and ${b.hi}`); } catch { /* not an expression we carry */ }
      }
    }
  } catch (e) { probs.push(`could not read the item (${e.message})`); }
  return probs.join('; ');
}

// ---------------------------------------------------------------- contract
const pick = arr => {
  if (!Array.isArray(arr)) return undefined;
  const hits = arr.map((ok, i) => (ok ? i : -1)).filter(i => i >= 0);
  return hits.length >= 1 ? hits[0] : -1;   // -1: no choice is right (sane() names it)
};
export default {
  solve(q) {
    const f = F[q.family];
    if (!f) return undefined;
    let r;
    try { r = f(q); } catch { return undefined; }
    if (r == null) return undefined;
    if (q.input === 'choice') return pick(r);
    return r;
  },
  sane(q) {
    const f = F[q.family];
    if (!f) return '';
    let r;
    try { r = f(q); } catch (e) { return `could not read the item (${e.message})`; }
    return saneOf(q, r);
  },
};
