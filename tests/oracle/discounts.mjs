// discounts oracle (role O, docs/lessons/QUALITY_LAYER.md). Works every practice item out from what the student
// reads: the prices and percents in the prompt, the choices, and (readSplit only) the length of the teal part the
// bar draws (picture.bar.pct, read against its equal cells). Money is exact (Q); only a final price is rounded, to the
// nearest cent with halves up, as every prompt that asks for rounding states. Every choice is judged by its maths.
import { Q } from '../../tools/quality/oracle-kit.mjs';

// ---------------------------------------------------------------- reading numbers
function qn(t) {
  const s = String(t).replace(/[−–]/g, '-').replace(/[$,\s]/g, '').replace(/\.$/, '');
  const m = s.match(/^(-?)(\d*)(?:\.(\d+))?$/);
  if (!m || (m[2] === '' && !m[3])) throw new Error(`not a number: ${t}`);
  const d = m[3] ? 10 ** m[3].length : 1, n = Number((m[2] || '0') + (m[3] || ''));
  return Q(m[1] ? -n : n, d);
}
const NUM = '[−-]?\\$?\\d[\\d,]*(?:\\.\\d+)?';
const re = (src, f = '') => new RegExp(src.replace(/#/g, `(${NUM})`), f);
/** the dollar amounts of a text, in order */
const dollars = t => [...String(t).matchAll(/\$(\d[\d,]*(?:\.\d+)?)/g)].map(m => qn(m[1]));
/** the percents of a text, in order (as Q of the percent number) */
const pcts = t => [...String(t).matchAll(/(\d+(?:\.\d+)?)%/g)].map(m => qn(m[1]));
const v = x => x.value;
const absQ = x => (x.n < 0 ? x.neg() : x);
/** round half up to cents → number */
function cents(x) {
  const y = x.mul(100), fl = Math.floor(y.n / y.d), rem = y.sub(fl);
  return (rem.cmp(Q(1, 2)) >= 0 ? fl + 1 : fl) / 100;
}
const exactCents = x => x.mul(100).d === 1;
function pick(q, pred) {
  const hits = (q.choices ?? []).map((c, i) => { try { return pred(c, i) ? i : -1; } catch { return -1; } }).filter(i => i >= 0);
  return hits.length === 1 ? hits[0] : -1;
}
/** price and percent of "$P ... p% off" */
const pp = p => ({ P: dollars(p)[0], r: pcts(p)[0].div(100) });
const sale = (P, r) => P.sub(P.mul(r));
const FRAC = { half: Q(1, 2), 'one half': Q(1, 2), 'one quarter': Q(1, 4), 'one fourth': Q(1, 4), 'one fifth': Q(1, 5), 'one tenth': Q(1, 10), 'three quarters': Q(3, 4), 'two fifths': Q(2, 5), 'three fifths': Q(3, 5), 'four fifths': Q(4, 5), 'one twentieth': Q(1, 20) };
/** a calculation "0.75 × $134 − $33.50" → exact value */
function evalCalc(c) {
  const s = String(c).replace(/[$,]/g, '').replace(/[−–]/g, '-').replace(/×/g, '*');
  const toks = s.match(/\d+(?:\.\d+)?|[-+*/()]/g) ?? [];
  let i = 0;
  const peek = () => toks[i], next = () => toks[i++];
  const expr = () => { let a = term(); while (peek() === '+' || peek() === '-') { const o = next(), b = term(); a = o === '+' ? a.add(b) : a.sub(b); } return a; };
  const term = () => { let a = fac(); while (peek() === '*' || peek() === '/') { const o = next(), b = fac(); a = o === '*' ? a.mul(b) : a.div(b); } return a; };
  const fac = () => { const t = next(); if (t === '(') { const e = expr(); next(); return e; } return qn(t); };
  const e = expr();
  return i === toks.length ? e : null;
}

// ---------------------------------------------------------------- families
const S = {
  roles(q) {
    const p = q.prompt;
    let orig, disc, paid, m;
    if ((m = p.match(re('costs? # at full price\\. This week (?:it is|they are) # off, so \\w+ pays #')))) [orig, disc, paid] = [m[1], m[2], m[3]].map(qn);
    else if ((m = p.match(re('pays # for .*?\\. The store took # off the regular price of #')))) [paid, disc, orig] = [m[1], m[2], m[3]].map(qn);
    else if ((m = p.match(re('regular price #, you save #, you pay #')))) [orig, disc, paid] = [m[1], m[2], m[3]].map(qn);
    else return undefined;
    const want = /is the discount\?/.test(p) ? disc : /is the sale price\?/.test(p) ? paid : /is the original price\?/.test(p) ? orig : null;
    return pick(q, c => dollars(c)[0].eq(want));
  },
  partWhole(q) {
    const m = q.prompt.match(re('costs? #\\. It is # off, so you pay #'));
    const [P, d, s] = [m[1], m[2], m[3]].map(qn);
    return pick(q, c => {
      let k = c.match(re('^# \\+ # = #$')), a, b, t;
      if (k) [a, b, t] = [k[1], k[2], k[3]].map(qn);
      else if ((k = c.match(re('^# = # \\+ #$')))) [t, a, b] = [k[1], k[2], k[3]].map(qn);
      else return false;
      return t.eq(P) && ((a.eq(d) && b.eq(s)) || (a.eq(s) && b.eq(d)));
    });
  },
  missing(q) {
    const p = q.prompt;
    let m;
    if ((m = p.match(re('(?:was|were) #, now #\\. How much do you save')))) return v(qn(m[1]).sub(qn(m[2])));
    if ((m = p.match(re('(?:is|are) # off, and the sale price is #\\. What was the original price')))) return v(qn(m[1]).add(qn(m[2])));
    if ((m = p.match(re('costs? #\\. (?:It is|They are) # off\\. What is the sale price')))) return v(qn(m[1]).sub(qn(m[2])));
    return undefined;
  },
  whichWhole(q) {
    const { P } = pp(q.prompt);
    return pick(q, c => { const m = c.match(/^The original price, (.*)$/); return !!m && dollars(m[1])[0].eq(P); });
  },
  pctOrDollars(q) {
    const m = q.prompt.match(re('for #\\. Store A: ([\\d.]+)% off\\. Store B: # off'));
    const P = qn(m[1]), a = P.mul(qn(m[2])).div(100), b = qn(m[3]), cmp = a.cmp(b);
    return pick(q, c => (cmp === 0 ? c === 'They save the same' : cmp > 0 ? /^Store A:/.test(c) : /^Store B:/.test(c)));
  },
  readSplit(q) {
    // the teal part is drawn pct% of the bar long; the student counts it in the equal cells
    const bar = q.data?.picture?.bar;
    if (!bar || typeof bar.pct !== 'number') return undefined;
    const want = qn(String(bar.pct));
    return pick(q, c => { const k = c.match(/^(\d+(?:\.\d+)?)% off$/); return !!k && qn(k[1]).eq(want); });
  },
  judgeSplit(q) {
    const p = q.prompt;
    let m;
    const P = dollars(p)[0], r = pcts(p)[0].div(100);
    if ((m = p.match(re('by shading # of the # bar')))) {
      const shaded = qn(m[1]).div(qn(m[2]));
      const right = shaded.eq(r);
      return pick(q, c => {
        if (/^Yes: the discount is the smaller part/.test(c)) return false;     // being smaller says nothing about the size
        if ((m = c.match(/^Yes: ([\d.]+)% off means (\$[\d.,]+) off$/))) return right && false;   // the claim is false for every price but $100
        const k = c.match(/^No: ([\d.]+)% off is (.+) of the bar$/);
        return !!k && !right && FRAC[k[2]]?.eq(qn(k[1]).div(100)) && qn(k[1]).div(100).eq(r);
      });
    }
    if ((m = p.match(/by shading (.+?) of the bar\./))) {
      const shaded = FRAC[m[1]];
      const right = shaded && shaded.eq(r);
      return pick(q, c => {
        const k = c.match(/^Yes: ([\d.]+)% off is (.+) of the bar$/);
        if (k) return right && FRAC[k[2]]?.eq(qn(k[1]).div(100));
        if (/always the bigger part/.test(c)) return false;
        if (/should shade \$/.test(c)) return false;                           // $p of the bar is p% only at $100
        return false;
      });
    }
    return undefined;
  },
  discAmt(q) { const { P, r } = pp(q.prompt); return v(P.mul(r)); },
  salePrice(q) { const { P, r } = pp(q.prompt); return cents(sale(P, r)); },
  saveAndPay(q) { const { P, r } = pp(q.prompt); return [v(P.mul(r)), v(sale(P, r))]; },
  exactDisc(q) { const { P, r } = pp(q.prompt); return v(P.mul(r)); },
  keepExact(q) {
    const m = q.prompt.match(re('shows # for ([\\d.]+)% of #'));
    const exact = qn(m[3]).mul(qn(m[2])).div(100);
    return pick(q, c => { const k = c.match(/^(\$[\d.,]+): an exact discount can have parts of a cent$/); return !!k && qn(k[1]).eq(exact); });
  },
  roundFinal(q) { const { P, r } = pp(q.prompt); return cents(sale(P, r)); },
  policy(q) {
    const p = q.prompt;
    const m = p.match(re('^([\\d.]+)% off #\\. (\\w+) rounds the discount first: # off, so #\\. (\\w+) keeps the exact # and rounds at the end: #, so #\\.'));
    const r = qn(m[1]).div(100), P = qn(m[2]), right = cents(sale(P, r));
    const exactD = P.mul(r);
    // the rule-follower keeps the exact discount and rounds only the final price; check that their numbers are right
    const ok = qn(m[7]).eq(exactD) && qn(m[8]).eq(sale(P, r)) && qn(m[9]).value === right;
    return pick(q, c => ok && c.startsWith(`${m[6]}: round only the final price`));
  },
  pctPaid(q) { return 100 - pcts(q.prompt)[0].value; },
  paidOfWhat(q) {
    const P = dollars(q.prompt)[0];
    return pick(q, c => { const m = c.match(/^The original price, (.*)$/); return !!m && dollars(m[1])[0].eq(P); });
  },
  oneStep(q) { const { P, r } = pp(q.prompt); return cents(Q(1).sub(r).mul(P)); },
  whichProduct(q) {
    const { P, r } = pp(q.prompt), want = sale(P, r);
    return pick(q, c => /^[\d.]+ × \$[\d.,]+$/.test(c) && evalCalc(c).eq(want));
  },
  whyAgree(q) {
    const p = q.prompt;
    let m;
    if ((m = p.match(/P − ([\d.]+)P is the same as ([\d.]+)P/))) {
      const a = qn(m[1]), b = qn(m[2]);
      return pick(q, c => { const k = c.match(/^P − ([\d.]+)P = \(1 − ([\d.]+)\)P = ([\d.]+)P$/); return !!k && qn(k[1]).eq(a) && qn(k[2]).eq(a) && Q(1).sub(a).eq(qn(k[3])) && qn(k[3]).eq(b); });
    }
    if (/Why do the two ways ALWAYS agree/.test(p)) {
      const [off, pay] = pcts(p);
      return pick(q, c => { const k = c.match(/^The (\d+)% you don't pay and the (\d+)% you pay are two parts of the same bar$/); return !!k && qn(k[1]).eq(off) && qn(k[2]).eq(pay) && off.add(pay).eq(100); });
    }
    return undefined;
  },
  checkClaim(q) {
    const p = q.prompt, { P, r } = pp(p), right = cents(sale(P, r));
    const said = qn(p.match(re('says the sale price is #'))[1]);
    return pick(q, c => {
      if (/ is right$/.test(c)) return said.value === right;
      const k = c.match(/^Wrong: it should be (\$[\d.,]+)$/);
      return !!k && said.value !== right && qn(k[1]).value === right;
    });
  },
  estimate(q) {
    const p = q.prompt, { P, r } = pp(p), exact = sale(P, r);
    let m;
    if ((m = p.match(re('you pay #\\. Is that reasonable')))) {
      const paid = qn(m[1]), near = Math.abs(paid.value - exact.value) <= 0.05 * P.value;
      return pick(q, c => {
        let k;
        if ((k = c.match(re('^Yes: about ([\\d.]+)% of # is #, close to #$')))) return near && qn(k[1]).eq(Q(100).sub(r.mul(100))) && Math.abs(qn(k[2]).value - P.value) <= 1 && qn(k[3]).eq(qn(k[1]).mul(qn(k[2])).div(100)) && qn(k[4]).eq(paid);
        if ((k = c.match(re('^No: you pay about ([\\d.]+)% of #, about #$')))) return !near && qn(k[1]).eq(Q(100).sub(r.mul(100))) && Math.abs(qn(k[2]).value - P.value) <= 1 && qn(k[3]).eq(qn(k[1]).mul(qn(k[2])).div(100));
        return false;   // "always the smaller amount", "less than $P", "must be less than half", "exactly $30": not reasons that hold
      });
    }
    // the best estimate: the choice nearest the exact sale price
    const ds = (q.choices ?? []).map(c => Math.abs(dollars(c)[0].value - exact.value));
    const best = Math.min(...ds);
    return pick(q, (c, i) => ds[i] === best);
  },
  bounds(q) {
    const p = q.prompt;
    let m;
    if ((m = p.match(re('(?:sign says|coupon gives) ([\\d.]+)% off the .+? at #')))) {
      const r = qn(m[1]).div(100), P = qn(m[2]), s = sale(P, r);
      return pick(q, c => {
        const d = dollars(c)[0];
        if (!d.eq(s)) return false;
        if (/a coupon cannot take everything/.test(c)) return false;
        if (/A little less than/.test(c)) return false;
        return true;
      });
    }
    if ((m = p.match(re('([\\d.]+)% off\\. Is the exact sale price more than half')))) {
      const paid = Q(100).sub(qn(m[1]));
      const cmp = paid.cmp(50);
      return pick(q, c => c === (cmp > 0 ? 'More than half' : cmp < 0 ? 'Less than half' : 'Exactly half'));
    }
    if ((m = p.match(re('costs? #, ([\\d.]+)% off\\. The receipt says #\\. Is the receipt right')))) {
      const P = qn(m[1]), r = qn(m[2]).div(100), said = qn(m[3]), s = sale(P, r), right = cents(s);
      const ok = said.value === right;
      return pick(q, c => {
        let k;
        if ((k = c.match(re('^(Right|Wrong): half is #, which rounds up to #$')))) return (k[1] === 'Right') === ok && qn(k[2]).eq(s) && qn(k[3]).value === right && r.eq(Q(1, 2));
        if ((k = c.match(re('^Wrong: it should be #$')))) return !ok && qn(k[1]).value === right;
        return false;   // "it is less than $P", "$x is half of $P", "$x + $x = ..., not $P": not the rule
      });
    }
    return undefined;
  },
};

// ---------------------------------------------------------------- the world
function sane(q) {
  const p = q.prompt, f = q.family, out = [];
  const P0 = dollars(p)[0];
  if (P0 && P0.n === 0 && !/\$0\b/.test(p.replace(/\$0\.\d/, ''))) out.push('a price of $0');
  if (f === 'roles' || f === 'partWhole') {
    const ds = dollars(p);
    let o, d, s, m;
    if ((m = p.match(re('costs? # at full price\\. This week (?:it is|they are) # off, so \\w+ pays #'))) || (m = p.match(re('costs? #\\. It is # off, so you pay #')))) [o, d, s] = [m[1], m[2], m[3]].map(qn);
    else if ((m = p.match(re('pays # for .*?\\. The store took # off the regular price of #')))) [s, d, o] = [m[1], m[2], m[3]].map(qn);
    else if ((m = p.match(re('regular price #, you save #, you pay #')))) [o, d, s] = [m[1], m[2], m[3]].map(qn);
    if (o && !d.add(s).eq(o)) out.push('discount + sale price is not the original price');
    if (ds.some(x => x.n <= 0)) out.push('a $0 amount');
  }
  if (f === 'missing') {
    const r = S.missing(q);
    if (typeof r === 'number' && r <= 0) out.push('a missing amount of $0 or less');
  }
  if (f === 'readSplit') {
    const bar = q.data?.picture?.bar, cells = Number(p.match(/cut into (\d+) equal parts/)?.[1]);
    if (bar && cells && !Number.isInteger(bar.pct * cells / 100)) out.push(`the teal part (${bar.pct}%) does not fill whole cells of ${cells}`);
  }
  if (f === 'judgeSplit' && /by shading \$/.test(p) && dollars(p)[0].eq(100)) out.push('at $100, shading $p IS p% of the bar');
  if (f === 'pctOrDollars') { /* $100 → the same: intended */ }
  if (f === 'roundFinal') {
    const { P, r } = pp(p), d = P.mul(r);
    const m = p.match(re('The exact discount is #'));
    if (m && !qn(m[1]).eq(d)) out.push('the stated exact discount is wrong');
    const m2 = p.match(re('exact difference is # − # = #'));
    if (m2 && !qn(m2[3]).eq(sale(P, r))) out.push('the stated exact difference is wrong');
  }
  if (f === 'exactDisc' || f === 'keepExact') { /* parts of a cent are the point */ }
  if (['salePrice', 'oneStep', 'checkClaim'].includes(f) && !/nearest cent|Rule:/.test(p)) {
    const { P, r } = pp(p);
    if (!exactCents(sale(P, r))) out.push('the sale price has parts of a cent and no rounding rule is given');
  }
  if (f === 'saveAndPay') {
    const { P, r } = pp(p);
    if (!exactCents(P.mul(r))) out.push('the amount saved has parts of a cent; the boxes ask for dollars and no rounding rule is given');
  }
  if (f === 'paidOfWhat') {
    const { P, r } = pp(p), m = p.match(re('a discount of #'));
    if (m && !qn(m[1]).eq(P.mul(r))) out.push('the stated discount is wrong');
  }
  if (f === 'whichProduct') {
    const { P, r } = pp(p), m = p.match(re('that is # off'));
    if (m && !qn(m[1]).eq(P.mul(r))) out.push('the stated discount is wrong');
  }
  if (f === 'whyAgree' && /ALWAYS agree/.test(p)) {
    const m = p.match(re('^\\w+: # − ([\\d.]+)% of # = #\\. \\w+: ([\\d.]+)% of # = #\\.'));
    if (m) {
      const P = qn(m[1]), a = qn(m[2]).div(100), b = qn(m[5]).div(100);
      if (!sale(P, a).eq(qn(m[4])) || !P.mul(b).eq(qn(m[7]))) out.push('a worked line in the story is wrong');
    }
  }
  if (f === 'estimate' && !/Is that reasonable/.test(p)) {
    const { P, r } = pp(p), exact = sale(P, r).value;
    const ds = (q.choices ?? []).map(c => Math.abs(dollars(c)[0].value - exact)).sort((a, b) => a - b);
    if (ds.length > 1 && ds[1] - ds[0] < 0.25) out.push(`two estimates are about as close (${ds[0].toFixed(2)} vs ${ds[1].toFixed(2)} away)`);
  }
  if (f === 'policy') {
    const m = p.match(re('^([\\d.]+)% off #\\. \\w+ rounds the discount first: # off, so #\\.'));
    if (m) {
      const r = qn(m[1]).div(100), P = qn(m[2]), dr = cents(P.mul(r));
      if (qn(m[3]).value !== dr || !P.sub(qn(m[3])).eq(qn(m[4]))) out.push('the round-first line is not what rounding the discount first gives');
    }
  }
  return out.join('; ');
}

export default {
  solve(q) {
    const f = S[q.family];
    return f ? f(q) : undefined;
  },
  sane,
};
