// fractions-decimals-percents oracle (role O, docs/lessons/QUALITY_LAYER.md). Works every practice item out from what
// the student sees: the prompt HTML (fraction spans and the repeat bar <span class="rep"> are kept), the board TeX and
// the choices. Every number is read into an exact fraction (a bar block becomes block / (99…9 · 10^prefix)); long
// division is redone here with integers; every choice is judged by the maths of its claim (its numbers, its
// relation, its reason). The picture data (ladder p, rems) is never used for an answer.
import { Q } from '../../tools/quality/oracle-kit.mjs';

// ---------------------------------------------------------------- reading
const decode = s => String(s ?? '')
  .replace(/&#8202;|&#8201;|&thinsp;|&nbsp;|&#160;/g, ' ').replace(/&minus;/g, '−').replace(/&times;/g, '×')
  .replace(/&divide;/g, '÷').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&le;/g, '≤').replace(/&ge;/g, '≥')
  .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(Number(d))).replace(/&amp;/g, '&');
/** HTML → text: a fraction span as {a/b}, a repeat bar as [digits], tags dropped */
function mt(h) {
  const s = String(h ?? '')
    .replace(/<span class="fr"><span>([^<]*)<\/span><span>([^<]*)<\/span><\/span>/g, '{$1/$2}')
    .replace(/<span class="rep">([^<]*)<\/span>/g, '[$1]')
    .replace(/<br\s*\/?>/g, ' ').replace(/<[^>]+>/g, '');
  return decode(s).replace(/(\d)\s+\{/g, '$1{').replace(/\s+/g, ' ').trim();
}
/** board TeX → the same text form */
function tm(tex) {
  let s = String(tex ?? '').replace(/\{,\}/g, ',');
  for (let i = 0; i < 4; i++) {
    s = s.replace(/\\text\{([^{}]*)\}/g, '$1').replace(/\\overline\{([^{}]*)\}/g, '[$1]')
      .replace(/\\[td]?frac\{([^{}]*)\}\{([^{}]*)\}/g, '{$1/$2}');
  }
  return s.replace(/\\%/g, '%').replace(/\\\$/g, '$').replace(/\\ldots/g, '…').replace(/\\times/g, '×').replace(/\\div/g, '÷')
    .replace(/\\approx/g, '≈').replace(/\\left|\\right/g, '').replace(/\\quad|\\[,;: ]/g, ' ').replace(/\s+/g, ' ').trim();
}
const NUM = '[-−]?\\$?\\d[\\d,]*(?:\\.\\d*)?(?:\\[\\d+\\])?';
/** one decimal token (with optional bar block) → exact Q */
function decQ(t) {
  const m = String(t).replace(/[−–]/g, '-').replace(/[$,\s]/g, '').match(/^(-?)(\d*)(?:\.(\d*))?(?:\[(\d+)\])?$/);
  if (!m || (m[2] === '' && !m[3] && !m[4])) throw new Error(`not a number: ${t}`);
  const f = m[3] ?? '';
  let v = Q(Number(m[2] || 0));
  if (f) v = v.add(Q(Number(f), 10 ** f.length));
  if (m[4]) v = v.add(Q(Number(m[4]), (10 ** m[4].length - 1) * 10 ** f.length));
  return m[1] ? v.neg() : v;
}
/** a whole quantity text → Q: 0.8[3], {5/6}, 2{3/4}, (37{1/2})%, 83.[3]%, −1{1/8}, $12.71 (a % divides by 100) */
function qty(t) {
  let s = String(t).trim().replace(/[−–]/g, '-').replace(/\$/g, '');
  let pct = false;
  if (/%$/.test(s)) { pct = true; s = s.slice(0, -1).trim(); }
  s = s.replace(/^\((.*)\)$/, '$1');
  let v, m;
  if ((m = s.match(/^(-?)(\d+)?\{(\d+)\/(\d+)\}$/))) {
    v = Q(Number(m[3]), Number(m[4])).add(Number(m[2] ?? 0));
    if (m[1]) v = v.neg();
  } else v = decQ(s);
  return pct ? v.div(100) : v;
}
const fracIn = t => { const m = String(t).match(/(-?)(\d+)?\{(\d+)\/(\d+)\}/); if (!m) return null; let v = Q(Number(m[3]), Number(m[4])).add(Number(m[2] ?? 0)); return m[1] ? v.neg() : v; };

// ---------------------------------------------------------------- long division (integers only)
function longDiv(n, d, maxDigits = 60) {
  n = Math.abs(n); d = Math.abs(d);
  const whole = Math.floor(n / d);
  let r = n % d;
  const rems = [r], digits = [], seen = new Map([[r, 0]]);
  let terminates = r === 0, prefix = 0, block = 0;
  while (r !== 0 && digits.length < maxDigits) {
    const x = 10 * r;
    digits.push(Math.floor(x / d)); r = x % d; rems.push(r);
    if (r === 0) { terminates = true; break; }
    if (seen.has(r)) { prefix = seen.get(r); block = digits.length - prefix; break; }
    seen.set(r, digits.length);
  }
  return { whole, digits, rems, terminates, prefix, block };
}
const ldQ = v => longDiv(v.n, v.d);
/** the first k digits after the point of |v| */
function digitsOf(v, k) {
  let r = Math.abs(v.n) % v.d; const out = [];
  for (let i = 0; i < k; i++) { const x = 10 * r; out.push(Math.floor(x / v.d)); r = x % v.d; }
  return out.join('');
}
const terminatesQ = v => { let d = v.d; for (const p of [2, 5]) while (d % p === 0) d /= p; return d === 1; };
const factors = n => { const out = []; for (let p = 2; p * p <= n; p++) while (n % p === 0) { out.push(p); n /= p; } if (n > 1) out.push(n); return out; };
/** exact rounding, half away from zero, to `p` places; also whether it is an exact tie */
function roundQ(v, p) {
  const k = 10 ** p, s = v.n < 0 ? -1 : 1, a = Math.abs(v.n) * k * 2;
  const r = Math.floor((a + v.d) / (2 * v.d));
  const tie = a % v.d === 0 && (a / v.d) % 2 === 1;
  return { v: Q(s * r, k), tie };
}
const PLACE = { tenths: 1, hundredths: 2, thousandths: 3, 'ten-thousandths': 4 };
const PLACE_OF = { tenth: 1, hundredth: 2, thousandth: 3 };

// ---------------------------------------------------------------- per family
// a choice family returns an array of booleans (is this claim true?); typed families return a Q / [x, y]
const P = q => mt(q.promptHtml);
const B = q => tm(q.board);
const C = q => (q.choicesHtml ?? q.choices).map(mt);
const boardFrac = q => fracIn(B(q));

/** "X is greater" / "They are equal" between the two numbers in "greater: A or B?" */
function compare(q) {
  const m = P(q).match(new RegExp(`greater: (${NUM}) or (${NUM})\\?`));
  const [a, b] = [m[1], m[2]], va = qty(a), vb = qty(b);
  return C(q).map(c => {
    if (/^They are equal/.test(c)) return va.eq(vb);
    const mm = c.match(/^(.+) is greater$/);
    if (!mm) return false;
    if (mm[1] === a) return va.cmp(vb) > 0;
    if (mm[1] === b) return vb.cmp(va) > 0;
    return false;
  });
}

const F = {
  placeValue(q) {
    const p = P(q); let m;
    if ((m = p.match(/Write ([\d,]+) (ten-thousandths|thousandths|hundredths|tenths) as a decimal/))) return Q(Number(m[1].replace(/,/g, '')), 10 ** PLACE[m[2]]);
    if ((m = p.match(/Which digit of (\d*)\.(\d+) is in the ([\w-]+) place/))) {
      if (m[3] === 'ones') return Q(Number(m[1].slice(-1) || 0));
      const i = PLACE[m[3] + (m[3].endsWith('s') ? '' : 's')] ?? PLACE[m[3]];
      return Q(Number(m[2][i - 1] ?? 0));
    }
    return null;
  },
  compareDec: compare,
  signedCompare: compare,
  terminates(q) {
    const p = P(q), cs = C(q); let m;
    if ((m = p.match(new RegExp(`^Is (${NUM}) a terminating or a repeating decimal\\?`)))) {
      const s = m[1], v = qty(s);
      return cs.map(c => {
        let mm;
        if ((mm = c.match(/^Terminating: every digit after the last (\d) is 0$/))) return !/\[/.test(s) && s.slice(-1) === mm[1];
        if ((mm = c.match(new RegExp(`^Terminating, but (${NUM}) would be a bigger number$`)))) return qty(mm[1]).cmp(v) > 0;
        if (/^Repeating/.test(c)) return /\[/.test(s); // a finite decimal (no bar) repeats nothing
        return false;
      });
    }
    if ((m = p.match(/^A decimal is written (\d+\.\d+)…, and the rule is: only zeros come after this/))) {
      const v = decQ(m[1]);
      return cs.map(c => {
        let mm;
        if ((mm = c.match(new RegExp(`^It terminates: it is exactly (${NUM})$`)))) return qty(mm[1]).eq(v);
        if ((mm = c.match(new RegExp(`^It is a tiny bit more than (${NUM})$`)))) return v.cmp(qty(mm[1])) > 0;
        if (/^It repeats, because the zeros go on forever/.test(c)) return false; // only zeros after = terminating (the lesson's definition)
        return false;
      });
    }
    return null;
  },
  barForm(q) {
    const p = P(q), cs = C(q); let m;
    // written out with a named block → bar notation
    if ((m = p.match(/^(\d+)\.(\d+)… \((?:the block|only the block|only the) (\d+) repeats/))) {
      const [, w, D, blk] = m;
      let pre = -1;
      for (let i = 0; i <= D.length - blk.length; i++) {
        const tail = D.slice(i);
        if ([...tail].every((ch, j) => ch === blk[j % blk.length])) { pre = i; break; }
      }
      if (pre < 0) return null;
      const v = decQ(`${w}.${D.slice(0, pre)}[${blk}]`);
      return cs.map(c => /\[/.test(c) && !/…/.test(c) && qty(c).eq(v));
    }
    // bar notation → written out
    if ((m = p.match(new RegExp(`^Which is (${NUM}) written out\\?`)))) {
      const v = qty(m[1]);
      return cs.map(c => {
        if (/…$/.test(c)) {
          const mm = c.match(/^(\d+)\.(\d+)…$/);
          return !!mm && Number(mm[1]) === Math.floor(v.value) && digitsOf(v, mm[2].length) === mm[2];
        }
        return qty(c).eq(v);
      });
    }
    return null;
  },
  approx(q) {
    const p = P(q), cs = C(q); let m;
    const rel = (a, op, b) => (op === '=' ? a.eq(b) : op === '<' ? a.cmp(b) < 0 : op === '>' ? a.cmp(b) > 0 : !a.eq(b));
    const Q_ = `(${NUM}|-?\\d*\\{\\d+\\/\\d+\\}|\\(\\d+\\{\\d+\\/\\d+\\}\\)%)`;
    if (/^Compare .* with .*\. Which is true\?/.test(p) || /^Which sign goes between/.test(p)) {
      return cs.map(c => {
        const mm = c.match(new RegExp(`^${Q_} ([=<>≈]) ${Q_}(?:, so ${Q_} ≈ ${Q_})?$`));
        if (!mm) return false;
        const a = qty(mm[1]), b = qty(mm[3]);
        if (!rel(a, mm[2], b)) return false;
        if (mm[4]) { const x = qty(mm[4]), f = qty(mm[5]); return !x.eq(f) && (f.eq(a) || f.eq(b)) && (x.eq(a) || x.eq(b)); }
        return true;
      });
    }
    if ((m = p.match(/exactly equal to (\{\d+\/\d+\})\?/))) { const t = qty(m[1]); return cs.map(c => qty(c).eq(t)); }
    if ((m = p.match(/only approximately equal to (\{\d+\/\d+\})\?/))) {
      const t = qty(m[1]);
      return cs.map(c => !qty(c).eq(t));
    }
    if ((m = p.match(/^\$([\d,.]+) is shared equally by (\d+) people\. Is \$([\d.]+) each exactly \{(\d+)\/(\d+)\} of \$([\d,.]+)\?/))) {
      const total = decQ(m[1]), k = Number(m[2]), each = decQ(m[3]), share = total.div(k);
      return cs.map(c => {
        let mm;
        if (/^Yes/.test(c)) return each.eq(share);
        if ((mm = c.match(/^No: (\d+) × \$([\d.]+) = \$([\d.,]+), so \$([\d.]+) ≈ \{(\d+)\/(\d+)\} of \$([\d,.]+)$/)))
          return !each.eq(share) && decQ(mm[2]).eq(each) && decQ(mm[2]).mul(Number(mm[1])).eq(decQ(mm[3])) && Number(mm[1]) === k;
        return false; // "No amount written with a decimal point can be exact": $0.25 is exact
      });
    }
    return null;
  },
  divide(q) {
    const v = boardFrac(q);
    if (q.input === 'num') return v;
    return C(q).map(c => !/…/.test(c) && qty(c).eq(v));
  },
  ladderStep(q) {
    const m = P(q).match(/the next line is (\d+) ÷ (\d+)\./);
    const x = Number(m[1]), d = Number(m[2]);
    return [Q(Math.floor(x / d)), Q(x % d)];
  },
  digitTrap(q) {
    const p = P(q), cs = C(q); let m;
    if ((m = p.match(/long division of \{(\d+)\/(\d+)\}, the remainder (\d+) has just come back/))) {
      const v = Q(Number(m[1]), Number(m[2])), ld = ldQ(v);
      return cs.map(c => {
        const mm = c.match(new RegExp(`^(.+?): \\{(\\d+)\\/(\\d+)\\} = (${NUM})$`));
        if (!mm || !Q(Number(mm[2]), Number(mm[3])).eq(v) || !qty(mm[4]).eq(v)) return false;
        if (/^All the digits repeat/.test(mm[1])) return !ld.terminates && ld.prefix === 0;
        if (/^The division is finished/.test(mm[1])) return ld.terminates;
        if (/^From here the same steps come again/.test(mm[1])) return !ld.terminates;
        return false;
      });
    }
    if ((m = p.match(/^Dividing \{(\d+)\/(\d+)\} so far gives 0\.(\d+)…: the digit (\d) has come up again/))) {
      const v = Q(Number(m[1]), Number(m[2])), ld = longDiv(Number(m[1]), Number(m[2])), shown = m[3], dg = m[4];
      const j = shown.length - 1, i = shown.indexOf(dg);
      return cs.map(c => {
        let mm;
        if ((mm = c.match(/^Not yet: the remainders after the two (\d)s are (\d+) and (\d+), so the next steps differ$/))) {
          const ri = ld.rems[i + 1], rj = ld.rems[j + 1];
          return mm[1] === dg && shown[j] === dg && i < j && ri !== rj && Number(mm[2]) === ri && Number(mm[3]) === rj;
        }
        if ((mm = c.match(new RegExp(`^Yes: the (\\d) came back, so \\{(\\d+)\\/(\\d+)\\} = (${NUM})$`)))) return qty(mm[4]).eq(v);
        if (/^It will stop soon: every division ends with remainder 0/.test(c)) return false; // 1/3 never does
        return false;
      });
    }
    return null;
  },
  classify(q) {
    // the division of the fraction as written (2/12: remainders 2, 8, 8), not of its simplest form
    const mm0 = B(q).match(/\{(\d+)\/(\d+)\}/), v = boardFrac(q), ld = longDiv(Number(mm0[1]), Number(mm0[2])), cs = C(q);
    const rep = !ld.terminates;
    return cs.map(c => {
      let mm;
      if ((mm = c.match(/^Repeats: the remainder (\d+) comes back$/))) { const r = Number(mm[1]); return rep && ld.rems.filter(x => x === r).length >= 2; }
      if (/^Repeats: the remainders never reach 0$/.test(c)) return rep;
      if ((mm = c.match(/^Repeats, like \{(\d+)\/(\d+)\} does$/))) return rep && !terminatesQ(Q(Number(mm[1]), Number(mm[2])));
      if (/^Repeats: .* is too long to stop$/.test(c)) return false; // length is no reason
      if (/^Terminates: a remainder reaches 0$/.test(c)) return ld.terminates;
      if ((mm = c.match(/^Terminates: the remainder reaches 0 at step (\d+)$/))) return ld.terminates && ld.digits.length === Number(mm[1]);
      if ((mm = c.match(new RegExp(`^Terminates: it is (${NUM})$`)))) return ld.terminates && qty(mm[1]).eq(v);
      return false;
    });
  },
  decToFrac(q) { return qty(B(q).split('=')[0]); },
  decPct(q) {
    const p = P(q); let m;
    if ((m = p.match(new RegExp(`^Lena says (${NUM})% cannot be a real percent`))) || (m = p.match(new RegExp(`^\\w+ says (${NUM})% cannot be a real percent`)))) {
      const x = decQ(m[1]);
      return C(q).map(c => {
        let mm;
        if ((mm = c.match(new RegExp(`^(${NUM})% is fine: (${NUM}) hundredths, which is (${NUM})$`)))) return decQ(mm[1]).eq(x) && decQ(mm[2]).eq(x) && decQ(mm[3]).eq(x.div(100));
        if ((mm = c.match(new RegExp(`^(${NUM})% is the same as (${NUM})$`)))) return decQ(mm[2]).eq(x.div(100));
        return false; // "a percent must be a whole number": 12.5% is a percent
      });
    }
    const lhs = B(q).split('=')[0].trim();
    const v = qty(lhs);
    return /\?\s*%/.test(B(q)) ? v.mul(100) : v; // "= ? %": type the percent number
  },
  pctToFrac(q) { return qty(B(q).split('=')[0]); },
  beyondOne(q) {
    const b = B(q), v = qty(b.split('=')[0]);
    return /\?\s*%/.test(b) ? v.mul(100) : v;
  },
  repPct(q) {
    const p = P(q); let m;
    if ((m = p.match(new RegExp(`^Write (${NUM})% as an exact decimal`)))) {
      const v = qty(m[1] + '%');
      return C(q).map(c => !/%|…/.test(c) && qty(c).eq(v));
    }
    if ((m = p.match(/^\{(\d+)\/(\d+)\} = (.+?)\. Write it as an exact percent/))) {
      const v = Q(Number(m[1]), Number(m[2]));
      return C(q).map(c => /%$/.test(c) && qty(c).eq(v));
    }
    return null;
  },
  mixedPct(q) {
    const p = P(q); let m;
    if ((m = p.match(/^Write \{(\d+)\/(\d+)\} as an exact percent/))) return Q(Number(m[1]), Number(m[2])).mul(100);
    if ((m = p.match(/^Write (\(\d+\{\d+\/\d+\}\)%) as a fraction/))) return qty(m[1]);
    return null;
  },
  recall(q) {
    const p = P(q), cs = C(q); let m;
    if ((m = p.match(new RegExp(`^Which fraction is (${NUM}) = (${NUM}%)\\?`)))) { const v = qty(m[1]); return cs.map(c => qty(c).eq(v)); }
    if ((m = p.match(/^Which is \{(\d+)\/(\d+)\}\?/))) {
      const v = Q(Number(m[1]), Number(m[2]));
      return cs.map(c => { const mm = c.match(/^(.+) = (.+%)$/); return !!mm && qty(mm[1]).eq(v) && qty(mm[2]).eq(v); });
    }
    return null;
  },
  remainders(q) {
    const p = P(q); let m;
    if ((m = p.match(/^Can the decimal of \{(\d+)\/(\d+)\} go on forever without ever repeating\?/))) {
      const d = Number(m[2]);
      return C(q).map(c => {
        const mm = c.match(/^No: there are only (\d+) nonzero remainders, so within (\d+) steps one comes back \(or one is 0\)$/);
        if (mm) return Number(mm[1]) === d - 1 && Number(mm[2]) === d;
        return false; // "Yes: no pattern" is false; "the block always has exactly d digits" is false (1/3 has 1 digit)
      });
    }
    if ((m = p.match(/^Dividing \{(\d+)\/(\d+)\}, the remainders so far are ([\d, ]+)\. What must the next remainder be\?/))) {
      const d = Number(m[2]), rs = m[3].split(',').map(x => Number(x.trim()));
      return Q((10 * rs[rs.length - 1]) % d);
    }
    if ((m = p.match(/^When you divide by (\d+), the remainders can only be .* at most how many digits can a repeating block/))) return Q(Number(m[1]) - 1);
    return null;
  },
  twoFive(q) {
    const m = P(q).match(/does \{(\d+)\/(\d+)\} terminate or repeat\?/);
    const a = Number(m[1]), b = Number(m[2]), v = Q(a, b), term = terminatesQ(v), fs = factors(v.d);
    return C(q).map(c => {
      let mm;
      if ((mm = c.match(/^(Terminates|Repeats): in simplest form it is \{(\d+)\/(\d+)\}: (\d+) = ([\d × ]+?),? (only 2s and 5s|which has the factor (\d+))$/))) {
        const concl = mm[1] === 'Terminates';
        if (concl !== term) return false;
        if (Number(mm[2]) !== v.n || Number(mm[3]) !== v.d || Number(mm[4]) !== v.d) return false;
        const fl = mm[5].split('×').map(x => Number(x.trim()));
        if (fl.reduce((x, y) => x * y, 1) !== v.d || fl.some(x => factors(x).length !== 1)) return false;
        if (mm[7]) return fl.includes(Number(mm[7])) && ![2, 5].includes(Number(mm[7]));
        return fl.every(x => x === 2 || x === 5) || (v.d === 1);
      }
      if ((mm = c.match(/^Repeats: (\d+) has the factor (\d+)$/))) { const p = Number(mm[2]); return !term && Number(mm[1]) === b && b % p === 0 && ![2, 5].includes(p) && v.d % p === 0; }
      if (/^Repeats: \d+ is odd$/.test(c) || /^Terminates: \d+ is even$/.test(c)) return false; // odd / even is not the test
      if (/^Repeats: the remainder can never be 0$/.test(c)) return !term;
      if (/^Terminates: the remainder reaches 0$/.test(c)) return term;
      if (/^You cannot tell without dividing$/.test(c)) return false;
      return false;
    });
  },
  roundFinal(q) {
    const p = P(q), v = boardFrac(q);
    const pct = /as a percent/.test(p);
    const m = p.match(/nearest (tenth|hundredth|thousandth)/);
    return roundQ(pct ? v.mul(100) : v, PLACE_OF[m[1]]).v;
  },
  calcDisplay(q) {
    const p = P(q), cs = C(q); let m;
    m = p.match(/^A calculator shows (\d+) ÷ (\d+) = (\d+\.\d+)\./);
    const a = Number(m[1]), b = Number(m[2]), shows = m[3], v = Q(a, b), k = shows.split('.')[1].length;
    const trunc = decQ(`${Math.floor(v.value)}.${digitsOf(v, k)}`), rnd = roundQ(v, k).v, disp = decQ(shows);
    return cs.map(c => {
      let mm;
      if ((mm = c.match(new RegExp(`^A finite window: \\{(\\d+)\\/(\\d+)\\} = (${NUM}) goes on, and the display is (.+)$`)))) {
        if (!Q(Number(mm[1]), Number(mm[2])).eq(v) || !qty(mm[3]).eq(v) || terminatesQ(v)) return false;
        if (/^cut off \(truncated\)$/.test(mm[4]) || /^cut off where the display ends$/.test(mm[4])) return disp.eq(trunc);
        if (/^rounded \(the last digit went up\)$/.test(mm[4])) return disp.eq(rnd) && !rnd.eq(trunc);
        return false;
      }
      if ((mm = c.match(/^(\d+) ÷ (\d+) stops after (\d+) digits$/))) { const ld = ldQ(v); return ld.terminates && ld.digits.length === Number(mm[3]); }
      if ((mm = c.match(new RegExp(`^The exact value: \\{(\\d+)\\/(\\d+)\\} = (${NUM})$`)))) return qty(mm[3]).eq(v);
      if ((mm = c.match(new RegExp(`^It is exact: (\\d+) ÷ (\\d+) reaches remainder 0, so \\{(\\d+)\\/(\\d+)\\} = (${NUM})$`)))) return ldQ(v).terminates && qty(mm[5]).eq(v);
      if (/^It is only approximate: a calculator display is never exact$/.test(c)) return false; // 3 ÷ 8 = 0.375 is exact
      if ((mm = c.match(/^It repeats: (\d+)\.(\d+)…$/))) return !terminatesQ(v) && digitsOf(v, mm[2].length) === mm[2];
      return false;
    });
  },
  roundingError(q) {
    const p = P(q); let m;
    if ((m = p.match(/Add the three shares: (\d+) × \$([\d.]+) = \?/))) return decQ(m[2]).mul(Number(m[1]));
    if ((m = p.match(/uses ([\d.]+) instead of \{\d+\/\d+\}: ([\d.]+) × \$?([\d,.]+) = \?/))) return decQ(m[2]).mul(decQ(m[3]));
    if ((m = p.match(/finds \{(\d+)\/(\d+)\} of the \w+ out of \$?([\d,.]+) by using ([\d.]+) for \{\d+\/\d+\}\. How far off/))) {
      const f = Q(Number(m[1]), Number(m[2])), N = decQ(m[3]), x = decQ(m[4]);
      const diff = f.mul(N).sub(x.mul(N));
      return diff.n < 0 ? diff.neg() : diff;
    }
    return null;
  },
  roundEnd(q) {
    const p = P(q), cs = C(q); let m;
    if ((m = p.match(/^A recipe uses exactly \{(\d+)\/(\d+)\} (\w+) per batch\. How much for (\d+) batches\?/))) {
      const exact = Q(Number(m[1]), Number(m[2])).mul(Number(m[4]));
      return cs.map(c => { const mm = c.match(/= ([\d.]+) \w+$/); return !!mm && decQ(mm[1]).eq(exact); });
    }
    if ((m = p.match(/^An? \$([\d,]+) bill is split equally by (\d+) friends\. What should each share be written as\?/))) {
      const cents = roundQ(decQ(m[1]).div(Number(m[2])), 2).v;
      return cs.map(c => { const mm = c.match(/^\$([\d.]+)(?::|$)/); return !!mm && /^\$\d+\.\d{2}(?::|$)/.test(c) && decQ(mm[1]).eq(cents); });
    }
    if ((m = p.match(/^A board is measured as ([\d.]+) cm \(to the nearest ([\d.]+) cm\) and cut into (\d+) equal pieces/))) {
      const places = (m[2].split('.')[1] ?? '').length;
      const rep = roundQ(decQ(m[1]).div(Number(m[3])), places).v;
      return cs.map(c => {
        if (/exactly/.test(c)) return false; // a measured length is not exact: reporting all the digits is not sensible
        const mm = c.match(new RegExp(`^(${NUM}) cm`));
        return !!mm && !/\[/.test(mm[1]) && (mm[1].split('.')[1] ?? '').length === places && qty(mm[1]).eq(rep);
      });
    }
    return null;
  },
  signed(q) {
    const b = B(q), v = qty(b.split('=')[0]);
    return /\?\s*%/.test(b) ? v.mul(100) : v;
  },
};

// ---------------------------------------------------------------- contract
const pick = arr => {
  if (!Array.isArray(arr)) return undefined;
  const hits = arr.map((ok, i) => (ok ? i : -1)).filter(i => i >= 0);
  return hits.length >= 1 ? hits[0] : undefined;
};
const out = v => (v && typeof v === 'object' && 'n' in v ? (Number.isInteger(v.value) ? v.value : v.pair) : v);
const outNum = v => (v && typeof v === 'object' && 'n' in v ? v.value : v);

export default {
  solve(q) {
    const f = F[q.family];
    if (!f) return undefined;
    let r;
    try { r = f(q); } catch { return undefined; }
    if (r == null) return undefined;
    if (q.input === 'choice') return pick(r);
    if (q.input === 'pair') return Array.isArray(r) ? r.map(outNum) : undefined;
    if (q.input === 'frac') return out(r);
    return outNum(r);
  },
  sane(q) {
    const f = F[q.family];
    if (!f) return '';
    let r;
    try { r = f(q); } catch (e) { return `could not read the item (${e.message})`; }
    if (r == null) return 'could not read the item';
    const probs = [];
    const p = P(q);
    if (q.input === 'choice' && Array.isArray(r)) {
      const n = r.filter(Boolean).length;
      if (n === 0) probs.push('no choice is right');
      if (n > 1) probs.push(`${n} choices are right (${r.map((x, i) => (x ? i : -1)).filter(i => i >= 0).join(', ')})`);
    }
    if (q.input === 'num' && r && typeof r === 'object' && 'n' in r && !terminatesQ(r)) probs.push(`the answer ${r} has no exact decimal to type`);
    // a stated equation must be true
    let m;
    if ((m = p.match(new RegExp(`^\\{(\\d+)\\/(\\d+)\\} = (${NUM})\\. Write it as an exact percent`))) && !qty(m[3]).eq(Q(Number(m[1]), Number(m[2])))) probs.push(`${m[1]}/${m[2]} is not ${m[3]}`);
    if ((m = p.match(new RegExp(`Long division gives \\{(\\d+)\\/(\\d+)\\} = (${NUM})\\.`))) && !qty(m[3]).eq(Q(Number(m[1]), Number(m[2])))) probs.push(`${m[1]}/${m[2]} is not ${m[3]}`);
    if ((m = p.match(new RegExp(`^Which fraction is (${NUM}) = (${NUM}%)\\?`))) && !qty(m[1]).eq(qty(m[2]))) probs.push(`${m[1]} is not ${m[2]}`);
    if ((m = p.match(/^\{(\d+)\/(\d+)\} of \$?([\d,]+) is exactly \$?([\d,.]+)\./)) && !Q(Number(m[1]), Number(m[2])).mul(decQ(m[3])).eq(decQ(m[4]))) probs.push(`${m[1]}/${m[2]} of ${m[3]} is not ${m[4]}`);
    if ((m = p.match(/^A calculator shows (\d+) ÷ (\d+) = (\d+\.\d+)\./))) {
      const v = Q(Number(m[1]), Number(m[2])), k = m[3].split('.')[1].length, d = decQ(m[3]);
      const trunc = decQ(`${Math.floor(v.value)}.${digitsOf(v, k)}`), rnd = roundQ(v, k).v;
      if (!d.eq(v) && !d.eq(trunc) && !d.eq(rnd)) probs.push(`no calculator shows ${m[1]} ÷ ${m[2]} as ${m[3]}`);
    }
    // the division the question walks through must exist
    if (q.family === 'ladderStep') {
      const mm = p.match(/Long division of \{(\d+)\/(\d+)\}\. The remainder was (\d+), so the next line is (\d+) ÷ (\d+)\./);
      if (mm) {
        const ld = longDiv(Number(mm[1]), Number(mm[2])), r0 = Number(mm[3]);
        if (!ld.rems.includes(r0) || r0 === 0) probs.push(`${r0} is not a remainder of ${mm[1]} ÷ ${mm[2]}`);
        if (Number(mm[4]) !== 10 * r0 || Number(mm[5]) !== Number(mm[2])) probs.push('the next line does not follow from the remainder');
      }
    }
    if (q.family === 'digitTrap') {
      const mm = p.match(/long division of \{(\d+)\/(\d+)\}, the remainder (\d+) has just come back/);
      if (mm) { const ld = longDiv(Number(mm[1]), Number(mm[2])); if (ld.rems.filter(x => x === Number(mm[3])).length < 2) probs.push(`the remainder ${mm[3]} never comes back`); }
      const m2 = p.match(/^Dividing \{(\d+)\/(\d+)\} so far gives 0\.(\d+)…: the digit (\d) has come up again/);
      if (m2) {
        const v = Q(Number(m2[1]), Number(m2[2]));
        if (digitsOf(v, m2[3].length) !== m2[3]) probs.push(`${m2[1]}/${m2[2]} does not start 0.${m2[3]}`);
        if (m2[3].slice(-1) !== m2[4] || m2[3].indexOf(m2[4]) === m2[3].length - 1) probs.push(`the digit ${m2[4]} has not come up again in 0.${m2[3]}`);
      }
    }
    if (q.family === 'remainders') {
      const mm = p.match(/^Dividing \{(\d+)\/(\d+)\}, the remainders so far are ([\d, ]+)\./);
      if (mm) {
        const ld = longDiv(Number(mm[1]), Number(mm[2])), rs = mm[3].split(',').map(x => Number(x.trim()));
        if (rs.some((x, i) => ld.rems[i] !== x)) probs.push(`the remainders of ${mm[1]}/${mm[2]} are not ${mm[3]}`);
      }
    }
    if (q.family === 'roundFinal' && q.input === 'num') {
      const v = boardFrac(q), mm = p.match(/nearest (tenth|hundredth|thousandth)/);
      if (v && mm && roundQ(/as a percent/.test(p) ? v.mul(100) : v, PLACE_OF[mm[1]]).tie) probs.push('the exact value is a rounding tie');
      const a = p.match(/Ana rounds \{(\d+)\/(\d+)\} to ([\d.]+) first and gets ([\d.]+)%/);
      if (a && !decQ(a[3]).mul(100).eq(decQ(a[4]))) probs.push(`${a[3]} is not ${a[4]}%`);
    }
    if (q.family === 'roundEnd') {
      const mm = p.match(/^An? \$([\d,]+) bill is split equally by (\d+) friends/);
      if (mm && decQ(mm[1]).div(Number(mm[2])).mul(100).d === 1) probs.push('the share is already exact to the cent');
      if (/^A recipe uses exactly \{\d+\/\d+\} (yard|mile|inch|foot|feet)/.test(p)) probs.push('a recipe measured in yards');
    }
    if (q.family === 'roundingError') {
      const mm = p.match(/finds \{(\d+)\/(\d+)\} of the (people|seats) out of ([\d,]+)/) || p.match(/^\{(\d+)\/(\d+)\} of ()([\d,]+) is exactly/);
      if (mm && mm[3] && !Q(Number(mm[1]), Number(mm[2])).mul(decQ(mm[4])).eq(Math.round(Q(Number(mm[1]), Number(mm[2])).mul(decQ(mm[4])).value))) probs.push(`a fractional number of ${mm[3]}`);
    }
    if (q.family === 'signed') {
      const v = qty(B(q).split('=')[0]);
      if (/as a percent/.test(p) && /(temperature changed by .*°F|elevation changed by .* miles)/.test(p)) probs.push('a change measured in °F or miles has no percent (a percent of what?)');
      if (/A stock price changed by/.test(p) && v.cmp(-1) < 0) probs.push(`a stock price cannot fall by ${v.neg()} of its value (it would be below $0)`);
    }
    if (q.family === 'twoFive' && Array.isArray(r) && r.filter(Boolean).length > 1) {
      const why = C(q).filter((_, i) => r[i]).join(' | ');
      probs.push(`true claims: ${why}`);
    }
    return probs.join('; ');
  },
};
