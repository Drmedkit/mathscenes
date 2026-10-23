// percent-change oracle (role O, docs/lessons/QUALITY_LAYER.md). Every practice item is worked out from what the
// student reads: the story in the prompt (which amount came first is read from the tense of each verb, "cost / had /
// was / drew" before, "costs / has / is / draws" now), the percents and dollar amounts in it, and the choices. All
// arithmetic is exact (Q); every choice is judged by the maths of its claim, never by how it sounds.
import { Q } from '../../tools/quality/oracle-kit.mjs';

// ---------------------------------------------------------------- reading numbers
/** '$1,450.50' / '−$4' / '7.5' → exact Q */
function qn(t) {
  const s = String(t).replace(/[−–]/g, '-').replace(/[$,\s]/g, '').replace(/\.$/, '');
  const m = s.match(/^(-?)(\d*)(?:\.(\d+))?$/);
  if (!m || (m[2] === '' && !m[3])) throw new Error(`not a number: ${t}`);
  const d = m[3] ? 10 ** m[3].length : 1, n = Number((m[2] || '0') + (m[3] || ''));
  return Q(m[1] ? -n : n, d);
}
const NUM = '[−-]?\\$?\\d[\\d,]*(?:\\.\\d+)?';
const re = (src, f = '') => new RegExp(src.replace(/#/g, `(${NUM})`), f);
/** all numbers of a text as Q (commas as thousands) */
const qs = t => [...String(t).matchAll(new RegExp(NUM, 'g'))].map(m => qn(m[0]));
const v = x => x.value;
const pct = (change, base) => change.div(base).mul(100);
const absQ = x => (x.n < 0 ? x.neg() : x);
const eqv = (a, b) => a.eq(b);
/** the one index whose test passes, -1 otherwise */
function pick(q, pred) {
  const hits = (q.choices ?? []).map((c, i) => { try { return pred(c, i) ? i : -1; } catch { return -1; } }).filter(i => i >= 0);
  return hits.length === 1 ? hits[0] : -1;
}
const money = p => /\$/.test(p);

// ---------------------------------------------------------------- the two-amount stories
const PAST = new Set(['cost', 'had', 'was', 'drew']);
const NOW = new Set(['costs', 'has', 'is', 'draws']);
/** { before, after } from "X cost $70. Now the same pair costs $52.50." in either sentence order; null when unclear */
function beforeAfter(p) {
  let before = null, after = null, nb = 0, na = 0;
  for (const m of String(p).matchAll(re('\\b(costs?|had|has|was|is|drew|draws)\\s+#', 'g'))) {
    if (PAST.has(m[1])) { before = qn(m[2]); nb++; }
    if (NOW.has(m[1])) { after = qn(m[2]); na++; }
  }
  return nb === 1 && na === 1 ? { before, after } : null;
}
/** "went from A to B" / "grew from A in. to B in." pairs in order */
const fromTo = p => [...String(p).matchAll(re('from # (?:[a-z.]+ )?to #', 'g'))].map(m => ({ before: qn(m[1]), after: qn(m[2]) }));

/** parse "an? X% increase|decrease" / "no change" → signed percent Q, with about flag; null if not that shape */
function readChange(c) {
  const s = String(c).trim().replace(/\.$/, '');
  if (/^no change$/i.test(s)) return { p: Q(0), about: false, dec: 0 };
  const m = s.match(/^(about )?an? ([\d.]+)% (increase|decrease)$/i);
  if (!m) return null;
  const x = qn(m[2]);
  return { p: m[3] === 'increase' ? x : x.neg(), about: !!m[1], dec: (m[2].split('.')[1] ?? '').length };
}
/** does the choice text name the signed percent change p (exactly, or "about" to its shown decimals)? */
function namesChange(c, p) {
  const r = readChange(c);
  if (!r) return false;
  if (!r.about) return r.p.eq(p);
  if (Math.sign(r.p.n) !== Math.sign(p.n)) return false;
  return !r.p.eq(p) && Math.abs(r.p.value - p.value) <= 0.5 * 10 ** -r.dec + 1e-9;
}
/** round half up, exactly, to `dp` decimals → number */
function roundQ(x, dp) {
  const k = 10 ** dp, y = x.mul(k), s = y.n < 0 ? -1 : 1, a = absQ(y);
  const fl = Math.floor(a.n / a.d), rem = a.sub(fl);
  return (s * (rem.cmp(Q(1, 2)) >= 0 ? fl + 1 : fl)) / k;
}
const isTie = (x, dp) => { const y = absQ(x.mul(10 ** dp)); return y.sub(Math.floor(y.n / y.d)).eq(Q(1, 2)); };
/** terminates within `dp` decimals */
const exactTo = (x, dp) => x.mul(10 ** dp).d === 1;

/** the signed rate changes named in order: "25% off", "goes down 20%", "10% sales tax", "20% more", "up 15%" */
function rates(p) {
  const out = [];
  for (const m of String(p).matchAll(/(\d+(?:\.\d+)?)%/g)) {
    const r = qn(m[1]).div(100), pre = p.slice(Math.max(0, m.index - 30), m.index), post = p.slice(m.index + m[0].length, m.index + m[0].length + 30);
    let sgn = 0;
    if (/^\s*(off|discount|decrease|less)/.test(post) || /(down|off|drop of|discount of|markdown of|takes another)\s*$/.test(pre)) sgn = -1;
    else if (/^\s*(sales tax|tax|more|markup|raise|tip|increase|service fee)/.test(post) || /(up|marks it up|markup of|raise of|tax of|adds|increased by)\s*$/.test(pre)) sgn = 1;
    out.push({ r, sgn, at: m.index });
  }
  return out;
}
const mult = ch => Q(1).add(ch.sgn > 0 ? ch.r : ch.r.neg());

// ---------------------------------------------------------------- families
const S = {
  base(q) {
    const ba = beforeAfter(q.prompt);
    return pick(q, c => qs(c)[0].eq(ba.before));
  },
  whichFrac(q) {
    const ba = beforeAfter(q.prompt), ch = absQ(ba.after.sub(ba.before));
    return pick(q, c => { const [a, b] = c.split('/').map(qn); return a.eq(ch) && b.eq(ba.before); });
  },
  byTo(q) {
    const p = q.prompt;
    const a = qn(p.match(re('\\bwas #'))[1]);
    let m;
    if ((m = p.match(re('it is # .*By how much did it change\\?')))) return v(absQ(qn(m[1]).sub(a)));
    if ((m = p.match(re('has (increased|decreased) by #')))) return v(m[1] === 'increased' ? a.add(qn(m[2])) : a.sub(qn(m[2])));
    if ((m = p.match(re('has (increased|decreased) to #')))) return v(absQ(qn(m[2]).sub(a)));
    return undefined;
  },
  changeWord(q) {
    const ba = beforeAfter(q.prompt), d = ba.after.sub(ba.before);
    return pick(q, c => {
      if (/^no change$/.test(c)) return d.n === 0;
      const m = c.match(/^(an increase|a decrease) of (.*)$/);
      if (!m || d.n === 0) return false;
      return (m[1] === 'an increase') === d.n > 0 && qs(m[2])[0].eq(absQ(d));
    });
  },
  benchPct(q) { const ba = beforeAfter(q.prompt); return v(pct(absQ(ba.after.sub(ba.before)), ba.before)); },
  compare(q) {
    const p = q.prompt, prs = fromTo(p);
    let names;
    if (/Store A/.test(p)) names = ['Store A', 'Store B'];
    else if (/plant grew/.test(p)) names = [...p.matchAll(/(\w+)’s plant grew/g)].map(m => `${m[1]}’s plant`);
    else names = [...p.matchAll(/The population of (\w+) went/g)].map(m => m[1]);
    const r = prs.map(x => absQ(pct(x.after.sub(x.before), x.before)));
    const want = r[0].eq(r[1]) ? 'the same percent' : r[0].cmp(r[1]) > 0 ? names[0] : names[1];
    return pick(q, c => c === want);
  },
  pctChange(q) { const ba = beforeAfter(q.prompt); return v(pct(absQ(ba.after.sub(ba.before)), ba.before)); },
  pctLabel(q) { const ba = beforeAfter(q.prompt), p = pct(ba.after.sub(ba.before), ba.before); return pick(q, c => namesChange(c, p)); },
  twoStepUp(q) {
    const p = q.prompt, r = rates(p)[0].r;
    const base = qs(p.replace(/\d+(\.\d+)?%/g, ''))[0], inc = base.mul(r);
    return [roundQ(inc, 2), roundQ(base.add(inc), 2)];
  },
  twoStepDown(q) {
    const p = q.prompt, base = qs(p.replace(/\d+(\.\d+)?%/g, ''))[0], r = rates(p)[0].r, off = base.mul(r);
    return [roundQ(off, 2), roundQ(base.sub(off), 2)];
  },
  multPick(q) {
    const p = q.prompt;
    let m;
    if ((m = p.match(re('multiplied by #')))) {
      const k = qn(m[1]);
      return pick(q, c => namesChange(c, k.sub(1).mul(100)));
    }
    m = p.match(/^An? (discount|markdown|markup|raise|sales tax) of ([\d.]+)% on (\$[\d,.]+)\./);
    const r = qn(m[2]).div(100), P = qn(m[3]), k = /discount|markdown/.test(m[1]) ? Q(1).sub(r) : Q(1).add(r);
    return pick(q, c => { const [a, b] = c.split('×').map(x => qn(x.trim())); return a.eq(k) && b.eq(P); });
  },
  multNum(q) {
    const m = q.prompt.match(/for an? ([\d.]+)% (\w+)|for ([\d.]+)% (off)/);
    const r = qn(m[1] ?? m[3]).div(100), word = m[2] ?? m[4];
    if (/off|drop/.test(word)) return v(Q(1).sub(r));
    if (/markup|raise|sales/.test(word)) return v(Q(1).add(r));
    return undefined;
  },
  over100(q) {
    const p = q.prompt;
    let m;
    if ((m = p.match(re('(?:was|had) #')) ) && /% of that/.test(p)) return v(qn(m[1]).mul(qn(p.match(/([\d.]+)% of that/)[1])).div(100));
    if (m && /increased by ([\d.]+)%/.test(p)) return v(qn(m[1]).mul(Q(1).add(qn(p.match(/increased by ([\d.]+)%/)[1]).div(100))));
    if (m && /gone down ([\d.]+)%/.test(p)) return v(qn(m[1]).mul(Q(1).sub(qn(p.match(/gone down ([\d.]+)%/)[1]).div(100))));
    const ba = beforeAfter(p);
    if (ba && /By what percent did/.test(p)) return v(pct(absQ(ba.after.sub(ba.before)), ba.before));
    return undefined;
  },
  over100Why(q) {
    const p = q.prompt;
    let m;
    if ((m = p.match(re('Can the price of an? # game go down ([\\d.]+)%')))) {
      const P = qn(m[1]), R = qn(m[2]), after = P.sub(P.mul(R).div(100));
      // the price would be negative, so it cannot; the true reason is that 100% off already leaves $0
      return pick(q, c => {
        if (/^Yes/.test(c)) return after.n >= 0;
        if (/no percent can be more than 100%/.test(c)) return false;            // percent increases go past 100%
        const k = c.match(/^No: a 100% decrease already takes it to (.*)\.$/);
        return !!k && qs(k[1])[0].eq(0) && R.cmp(100) > 0;
      });
    }
    const [x] = fromTo(p), ch = x.after.sub(x.before), real = pct(ch, x.before);
    return pick(q, c => {
      if (/is right: a percent can’t be more than 100%/.test(c)) return false;
      const k = c.match(/^It is an? ([\d.]+)% increase(?:: the change, (.+?) in\., is ([\d.]+) times the base)?\.$/);
      if (!k) return false;
      if (!qn(k[1]).eq(real)) return false;
      return k[2] === undefined || (qn(k[2]).eq(ch) && qn(k[3]).eq(ch.div(x.before)));
    });
  },
  choose(q) {
    const p = q.prompt;
    let want;
    if (/percent (markup|raise|change)|percent raise/.test(p)) {
      const [x] = fromTo(p).length ? fromTo(p) : [{ before: qs(p)[0], after: qs(p)[1] }];
      const bought = p.match(re('bought a \\w+ for # and sells it for #'));
      const pr = bought ? { before: qn(bought[1]), after: qn(bought[2]) } : x;
      want = absQ(pct(pr.after.sub(pr.before), pr.before));
    } else {
      const P = qs(p.replace(/\d+(\.\d+)?%/g, ''))[0], ch = rates(p)[0];
      want = P.mul(mult(ch));
    }
    return pick(q, c => { const e = evalCalc(c); return e !== null && e.eq(want); });
  },
  estimate(q) {
    const ba = beforeAfter(q.prompt), p = pct(ba.after.sub(ba.before), ba.before);
    return pick(q, c => {
      const up = /increase/.test(c), mag = absQ(p);
      if (up !== p.n > 0 || p.n === 0) return false;
      let m;
      if ((m = c.match(/less than ([\d.]+)%/))) return mag.cmp(qn(m[1])) < 0;
      if ((m = c.match(/between ([\d.]+)% and ([\d.]+)%/))) return mag.cmp(qn(m[1])) >= 0 && mag.cmp(qn(m[2])) <= 0;
      return false;
    });
  },
  sanity(q) {
    const p = q.prompt;
    let m;
    if ((m = p.match(re('total for # with ([\\d.]+)% sales tax')))) {
      const total = qn(m[1]).mul(Q(1).add(qn(m[2]).div(100)));
      return pick(q, c => Math.abs(qs(c)[0].value - total.value) < 0.005 + 1e-9);
    }
    if ((m = p.match(re('went from # people to # people\\. \\w+’s calculator shows #')))) {
      const b = qn(m[1]), a = qn(m[2]), d = a.sub(b), want = pct(d, b);
      return pick(q, c => !readChange(c)?.about && namesChange(c, want));
    }
    if ((m = p.match(re('total for # with ([\\d.]+)% tax\\. \\w+’s estimate: about #\\. The calculator says #')))) {
      const total = qn(m[1]).mul(Q(1).add(qn(m[2]).div(100))), est = qn(m[3]), calc = qn(m[4]);
      const calcOk = Math.abs(calc.value - total.value) < 0.01, estOk = Math.abs(est.value - total.value) <= 0.1 * total.value;
      return pick(q, c => {
        if (/^Redo the calculation/.test(c)) return !calcOk && estOk;
        if (/^Keep/.test(c)) return calcOk && /\bcalculators don’t make mistakes/.test(c) === false;   // that reason is never true
        if (/^Change the estimate to (.*)\.$/.test(c)) { const t = qs(c)[0]; return Math.abs(t.value - total.value) <= 0.1 * total.value && !estOk; }
        return false;
      });
    }
    return undefined;
  },
  round(q) {
    const p = q.prompt;
    let m;
    if ((m = p.match(re('costs #\\. The sales tax is ([\\d.]+)%\\. What is the total, rounded to the nearest cent')))) return roundQ(qn(m[1]).mul(Q(1).add(qn(m[2]).div(100))), 2);
    const ba = beforeAfter(p);
    return roundQ(absQ(pct(ba.after.sub(ba.before), ba.before)), 1);
  },
  exactOrNot(q) {
    const p = q.prompt, [x] = fromTo(p), real = pct(x.after.sub(x.before), x.before);
    const said = qn(p.match(/“an? ([\d.]+)% (?:increase|decrease)\.”/)[1]);
    return pick(q, c => {
      if (/^Yes:/.test(c)) return said.eq(real);
      let m;
      if ((m = c.match(/^No: it is rounded\. Exactly, it is (\d+)(?: (\d+)\/(\d+))?%\.$/))) {
        const ex = Q(Number(m[1])).add(m[2] ? Q(Number(m[2]), Number(m[3])) : Q(0));
        return !said.eq(real) && ex.eq(real) && Math.abs(said.value - real.value) < 0.05 + 1e-9;
      }
      if (/^No: you must round/.test(c)) return false;   // rounding before the last step is never the rule
      return false;
    });
  },
  successive(q) {
    const p = q.prompt, start = qs(p.replace(/\d+(\.\d+)?%/g, ''))[0];
    const chs = rates(p);
    let x = start;
    for (const ch of chs) x = x.mul(mult(ch));
    return money(p) ? roundQ(x, 2) : x.value;
  },
  overall(q) {
    const p = q.prompt;
    let k = Q(1);
    for (const ch of rates(p)) k = k.mul(mult(ch));
    const want = k.sub(1).mul(100);
    return pick(q, c => namesChange(c, want));
  },
  compose(q) {
    let k = Q(1);
    for (const ch of rates(q.prompt)) k = k.mul(mult(ch));
    return pick(q, c => { const m = c.match(/^× ([\d.]+): (.*)$/); return !!m && qn(m[1]).eq(k) && namesChange(m[2], k.sub(1).mul(100)); });
  },
  order(q) {
    const p = q.prompt, P = qn(p.match(re('^An? #'))[1]);
    let m;
    if ((m = p.match(re('You have a # coupon, and the store takes ([\\d.]+)% off')))) {
      const c = qn(m[1]), k = Q(1).sub(qn(m[2]).div(100));
      const cFirst = P.sub(c).mul(k), pFirst = P.mul(k).sub(c), cmp = cFirst.cmp(pFirst);
      return pick(q, t => (cmp === 0 ? /^the same either way$/.test(t) : cmp < 0 ? /^the coupon first/.test(t) : /% off first, then the coupon$/.test(t)));
    }
    // Store A: the first change written for A, then the second; Store B the other way round (read from the text)
    const sa = p.match(/Store A (.*?)\. Store B (.*?)\. Which/);
    const seq = t => rates(t).map(mult).reduce((a, k) => a.mul(k), P);
    const ordered = t => {   // Store B's sentence names the first step first ("adds 8% tax first, then takes 20% off")
      return seq(t);
    };
    const A = ordered(sa[1]), B = ordered(sa[2]), cmp = A.cmp(B);
    return pick(q, t => (cmp === 0 ? t === 'They cost the same.' : cmp < 0 ? t === 'Store A' : t === 'Store B'));
  },
  undo(q) {
    const m = q.prompt.match(re('from # to #\\. By what percent must it go (up|down)'));
    const a = qn(m[1]), b = qn(m[2]);
    return v(absQ(pct(a.sub(b), b)));
  },
  noCancelWhy(q) {
    const p = q.prompt;
    const m = p.match(re('^An? # game goes (up|down) ([\\d.]+)% to #, then (up|down) ([\\d.]+)%\\. It ends at #, not #'));
    const P = qn(m[1]), d1 = m[2], r1 = qn(m[3]).div(100), M = qn(m[4]), d2 = m[5], r2 = qn(m[6]).div(100);
    const k1 = d1 === 'up' ? Q(1).add(r1) : Q(1).sub(r1), k2 = d2 === 'up' ? Q(1).add(r2) : Q(1).sub(r2);
    const F = P.mul(k1).mul(k2);
    return pick(q, c => {
      let k;
      if ((k = c.match(re('^It really ends at #')))) return qn(k[1]).eq(F) && F.eq(P);
      if ((k = c.match(re('^The order is the problem: (up|down) first, then (up|down), would end at #')))) {
        const rev = P.mul(k2).mul(k1);
        return qn(k[3]).eq(rev) && !rev.eq(F);
      }
      if ((k = c.match(re('^The ([\\d.]+)% (increase|decrease) is of a (bigger|smaller) price, #, so it (takes off more than was added|adds back less than was taken)')))) {
        const second = d2 === 'up' ? 'increase' : 'decrease';
        if (k[2] !== second || !qn(k[1]).div(100).eq(r2) || !qn(k[4]).eq(M)) return false;
        const bigger = M.cmp(P) > 0;
        if ((k[3] === 'bigger') !== bigger) return false;
        return second === 'decrease' ? k[5].startsWith('takes off more') && F.cmp(P) < 0 : k[5].startsWith('adds back less') && F.cmp(P) < 0;
      }
      return false;
    });
  },
  sameBase(q) {
    const p = q.prompt, P = qs(p.replace(/\d+(\.\d+)?%/g, ''))[0], ch = rates(p);
    let x;
    if (/of the original price|both figured on the meal price/.test(p)) x = P.mul(ch.reduce((a, c) => a.add(c.sgn > 0 ? c.r : c.r.neg()), Q(1)));
    else x = ch.reduce((a, c) => a.mul(mult(c)), P);
    return pick(q, c => qs(c)[0].eq(x));
  },
  pctError(q) {
    const [est, real] = qs(q.prompt);
    const e = pct(absQ(est.sub(real)), real);
    return /nearest tenth/.test(q.prompt) ? roundQ(e, 1) : v(e);
  },
  closer(q) {
    const m = q.prompt.match(re('^(\\w+) guesses # marbles in a jar of #\\. (\\w+) guesses # jelly beans in a jar of #'));
    const e1 = absQ(qn(m[2]).sub(qn(m[3]))).div(qn(m[3])), e2 = absQ(qn(m[5]).sub(qn(m[6]))).div(qn(m[6]));
    const want = e1.eq(e2) ? 'equally close' : e1.cmp(e2) < 0 ? m[1] : m[4];
    return pick(q, c => c === want);
  },
};

/** a calculation choice "(44 − 40) ÷ 40, then × 100" / "120 × 0.95" / "45 − 20" → exact value, or null */
function evalCalc(c) {
  let s = String(c).replace(/,(?=\d{3})/g, '').replace(/[−–]/g, '-').replace(/×/g, '*').replace(/÷/g, '/');
  const then = s.match(/^(.*), then (.*)$/);
  if (then) s = `(${then[1]}) ${then[2]}`;
  const toks = s.match(/\d+(?:\.\d+)?|[-+*/()]/g);
  if (!toks) return null;
  let i = 0;
  const peek = () => toks[i], next = () => toks[i++];
  const expr = () => { let a = term(); while (peek() === '+' || peek() === '-') { const o = next(), b = term(); a = o === '+' ? a.add(b) : a.sub(b); } return a; };
  const term = () => { let a = fac(); while (peek() === '*' || peek() === '/') { const o = next(), b = fac(); a = o === '*' ? a.mul(b) : a.div(b); } return a; };
  const fac = () => { const t = next(); if (t === '(') { const e = expr(); next(); return e; } if (t === '-') return fac().neg(); return qn(t); };
  try { const e = expr(); return i === toks.length ? e : null; } catch { return null; }
}

// ---------------------------------------------------------------- the world
const STORY = new Set(['base', 'whichFrac', 'changeWord', 'benchPct', 'pctChange', 'pctLabel', 'over100', 'estimate', 'round']);
const COUNT = /people|fans|members|cans|beans|marbles/;
function sane(q) {
  const p = q.prompt, f = q.family;
  const out = [];
  if (/\b(\w+) \1\b/.test(p.replace(/\d/g, ''))) out.push('a word repeated in the prompt');
  if (/\bbeans jelly beans\b/.test(p)) out.push('garbled "N beans jelly beans"');
  const ba = STORY.has(f) && !(f === 'over100' && !/By what percent/.test(p)) && !(f === 'round' && /nearest cent/.test(p)) ? beforeAfter(p) : null;
  if (ba) {
    if (ba.before.n <= 0) out.push('a base of 0');
    if (/people|fans|members/.test(p) && (ba.before.d !== 1 || ba.after.d !== 1)) out.push('a fractional count');
    // the board shows the change in time order
    const bm = String(q.board).match(/^\\?\$?([\d{},.]+) \\to \\?\$?([\d{},.]+)$/);
    if (bm && !(qn(bm[1].replace(/[{}]/g, '')).eq(ba.before) && qn(bm[2].replace(/[{}]/g, '')).eq(ba.after))) out.push('the board does not show before → after');
    const d = ba.after.sub(ba.before);
    const asks = p.match(/did (?:the|it) ?\w* (increase|decrease)\?|Find the percent (increase|decrease)/);
    const w = asks && (asks[1] ?? asks[2]);
    if (w && ((w === 'increase') !== d.n > 0 || d.n === 0)) out.push(`asks for a percent ${w} but the amount went ${d.n > 0 ? 'up' : d.n < 0 ? 'down' : 'nowhere'}`);
    if (['benchPct', 'pctChange', 'over100'].includes(f) && /By what percent/.test(p)) {
      const x = pct(absQ(d), ba.before);
      if (!exactTo(x, 2) && !/nearest/.test(p)) out.push(`the percent change ${x.value} is not exact and no rounding is asked`);
    }
    if (f === 'round' && isTie(pct(absQ(d), ba.before), 1)) out.push('a nearest-tenth tie');
  }
  if (f === 'twoStepUp' || f === 'twoStepDown') {
    const base = qs(p.replace(/\d+(\.\d+)?%/g, ''))[0], r = rates(p)[0].r, ch = base.mul(r);
    if (!exactTo(ch, 2)) out.push(`the change ${ch.value} is not a whole number of cents and no rounding is asked`);
    if (/people/.test(p) && ch.d !== 1) out.push('a fractional number of people');
  }
  if (f === 'successive') {
    const x = qs(p.replace(/\d+(\.\d+)?%/g, ''))[0];
    let y = x; for (const ch of rates(p)) { y = y.mul(mult(ch)); if (/people/.test(p) && y.d !== 1) { out.push('a fractional number of people along the way'); break; } }
    if (money(p) && !exactTo(y, 2)) out.push('the final price is not a whole number of cents and no rounding is asked');
  }
  if (f === 'over100') {
    const r = S.over100(q);
    if (typeof r === 'number' && /people|fans|cans/.test(p) && !Number.isInteger(r) && !/By what percent/.test(p)) out.push('a fractional count');
    if (typeof r === 'number' && r < 0) out.push('a negative amount');
  }
  if (f === 'round' && /nearest cent/.test(p)) {
    const m = p.match(re('costs #\\. The sales tax is ([\\d.]+)%'));
    if (m && isTie(qn(m[1]).mul(Q(1).add(qn(m[2]).div(100))), 2)) out.push('a half-cent tie');
  }
  if (f === 'pctError') {
    const [est, real] = qs(p), e = pct(absQ(est.sub(real)), real);
    if (!/nearest tenth/.test(p) && !exactTo(e, 2)) out.push(`percent error ${e.value} is not exact and no rounding is asked`);
    if (/nearest tenth/.test(p) && isTie(e, 1)) out.push('a nearest-tenth tie');
  }
  if (f === 'undo') {
    const m = p.match(re('went (up|down) ([\\d.]+)%, from # to #'));
    if (m) {
      const r = qn(m[2]).div(100), a = qn(m[3]), b = qn(m[4]);
      if (!a.mul(m[1] === 'up' ? Q(1).add(r) : Q(1).sub(r)).eq(b)) out.push('the stated change does not give the stated price');
      const x = pct(absQ(a.sub(b)), b);
      if (!exactTo(x, 2)) out.push(`the answer ${x.value} is not exact and no rounding is asked`);
    }
  }
  if (f === 'noCancelWhy') {
    const m = p.match(re('^An? # game goes (up|down) ([\\d.]+)% to #, then (up|down) ([\\d.]+)%\\. It ends at #'));
    if (m) {
      const P = qn(m[1]), k1 = m[2] === 'up' ? Q(1).add(qn(m[3]).div(100)) : Q(1).sub(qn(m[3]).div(100));
      const k2 = m[5] === 'up' ? Q(1).add(qn(m[6]).div(100)) : Q(1).sub(qn(m[6]).div(100));
      if (!P.mul(k1).eq(qn(m[4])) || !P.mul(k1).mul(k2).eq(qn(m[7]))) out.push('the prices in the story do not follow from the percents');
    }
  }
  if (f === 'sanity') {
    const m = p.match(re('went from # people to # people\\. \\w+’s calculator shows #'));
    if (m && !absQ(qn(m[2]).sub(qn(m[1]))).div(qn(m[1])).eq(qn(m[3]))) out.push('the calculator display is not change ÷ base');
  }
  if (f === 'estimate' && ba) {
    const x = absQ(pct(ba.after.sub(ba.before), ba.before));
    if ([10, 25, 50].some(b => x.eq(b))) out.push(`the change is exactly ${x.value}%, on the edge of two ranges`);
  }
  if (f === 'twoStepDown' && /people/.test(p)) { /* covered above */ }
  if (f === 'choose') {
    // two calculations that give the right value (e.g. $100 − 20 and 100 × 0.8)
    try {
      const hits = (q.choices ?? []).filter(c => { const e = evalCalc(c); return e && S.choose({ ...q, choices: [c] }) === 0; });
      if (hits.length > 1) out.push(`two calculations give the right value: ${hits.join(' / ')}`);
    } catch { /* solve reports */ }
  }
  if (COUNT.test(p) && /−\d/.test(p)) out.push('a negative count');
  return out.join('; ');
}

export default {
  solve(q) {
    const f = S[q.family];
    return f ? f(q) : undefined;
  },
  sane,
};
