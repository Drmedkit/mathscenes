// original-amount oracle (role O, docs/lessons/QUALITY_LAYER.md). Works every practice item out from what the student
// sees: the story in the prompt (rate, direction, the amount after the change), the board, the choices. The picture's
// tape values are never read (the hidden row's cents are the answer). Money is exact (fractions of a dollar); rounding
// to the cent is half up, ties flagged. Every choice is judged by testing its claim with the story's own numbers.
import { Q } from '../../tools/quality/oracle-kit.mjs';

// ---------------------------------------------------------------- numbers
const clean = s => String(s ?? '').replace(/[−–]/g, '-').replace(/’/g, "'").replace(/\s+/g, ' ').trim();
/** a decimal string → exact fraction ("1,250.50" → 125050/100) */
function D(t) {
  const s = String(t).replace(/[,$\s]/g, '').replace(/\.$/, '');
  const m = s.match(/^(-?)(\d*)(?:\.(\d+))?$/);
  if (!m || (m[2] === '' && !m[3])) throw new Error(`not a number: ${t}`);
  const d = m[3] ? 10 ** m[3].length : 1, n = Number((m[2] || '0') + (m[3] || ''));
  return Q(m[1] ? -n : n, d);
}
const pct = t => D(t).div(100);
/** every $ amount in a text, exact, in order */
const dollars = t => [...clean(t).matchAll(/\$\s?(\d[\d,]*(?:\.\d+)?)/g)].map(m => D(m[1]));
/** whole cents, half up; tie = exactly half a cent */
function cents(x) {
  const f = x.mul(100);
  const fl = Math.floor(f.n / f.d), frac = f.sub(fl);
  return { c: frac.cmp(Q(1, 2)) >= 0 ? fl + 1 : fl, tie: frac.eq(Q(1, 2)), exact: frac.n === 0 };
}
const toCents = x => Q(cents(x).c, 100);
const isCents = x => cents(x).exact;
const terminates = x => { let d = x.d; for (const p of [2, 5]) while (d % p === 0) d /= p; return d === 1; };

// ---------------------------------------------------------------- the story
const UP = /tip|sales tax|markup|raised|went up|goes up|go up|tax/;
const DOWN = /% off|%-off|rebate|discount/;
/**
 * the story of a one-change item:
 *   { kind: 'change', up, r, m, after, orig }   the amount after the change and the original (= after ÷ m)
 *   { kind: 'part', r, part, orig }             "saved $S, that was r% of the original" / "the tax was $T, r% of the price"
 */
function story(prompt) {
  const s = clean(prompt);
  let m;
  if ((m = s.match(/saved \$([\d.,]+) on [^.]*\. (?:That|The \$[\d.,]+ discount) was ([\d.]+)% of the original price/)))
    return { kind: 'part', part: D(m[1]), r: pct(m[2]), orig: D(m[1]).div(pct(m[2])) };
  if ((m = s.match(/The sales tax on [^.]*? was \$([\d.,]+), which is ([\d.]+)% of the price before tax/)))
    return { kind: 'part', part: D(m[1]), r: pct(m[2]), orig: D(m[1]).div(pct(m[2])) };
  const head = s.split('“')[0];
  const rm = head.match(/(\d+(?:\.\d+)?)%/);
  if (!rm) throw new Error('no rate');
  const r = pct(rm[1]);
  const down = DOWN.test(head), up = UP.test(head);
  if (down === up) throw new Error('no clear direction');
  const amts = dollars(head);
  if (!amts.length) throw new Error('no amount');
  const after = amts[0], mult = up ? Q(1).add(r) : Q(1).sub(r);
  return { kind: 'change', up, r, m: mult, after, orig: after.div(mult) };
}
const wantsCent = p => /nearest cent/.test(p);

// ---------------------------------------------------------------- choices
/** a linear form a·x + b from "1 + 0.175x", "1.175x", "x - 0.05x" */
function linForm(t) {
  const s = clean(t).replace(/\s/g, '');
  const terms = s.match(/[+-]?[^+-]+/g) ?? [];
  let a = Q(0), b = Q(0);
  for (const term of terms) {
    const sg = term.startsWith('-') ? -1 : 1, body = term.replace(/^[+-]/, '');
    if (/x$/.test(body)) a = a.add((body === 'x' ? Q(1) : D(body.slice(0, -1))).mul(sg));
    else b = b.add(D(body).mul(sg));
  }
  return { a, b };
}

const F = {
  resultPct(q) { const st = story(q.prompt); return st.m.mul(100); },

  tapeRead(q) {
    const st = story(q.prompt);
    const role = ph => (/before|original|old/.test(ph) ? Q(1) : st.m);
    return q.choices.map(c => {
      const m = clean(c).match(/^The (.+?) is ([\d.]+)% of the (.+?)\.?$/);
      if (!m) return false;
      return role(m[1]).div(role(m[3])).eq(pct(m[2]));
    });
  },

  multNum(q) { const f = linForm(q.board.replace(/=.*$/, '')); return f.b.n === 0 ? f.a : null; },

  multExpr(q) {
    const f = linForm(q.board);
    return q.choices.map(c => { try { const g = linForm(c); return g.a.eq(f.a) && g.b.eq(f.b); } catch { return false; } });
  },

  tapeUnit(q) {
    const st = story(q.prompt);
    const m = clean(q.prompt).match(/is (\d+) sections? of (\d+(?:\.\d+)?)%/);
    const sec = st.orig.mul(pct(m[2]));
    return [sec, st.orig];
  },

  reverse(q) { return story(q.prompt).orig; },

  whichCalc(q) {
    const st = story(q.prompt);
    return q.choices.map(c => {
      const m = clean(c).match(/^\$([\d.,]+) ([×÷]) ([\d.]+)$/);
      if (!m) return false;
      const v = m[2] === '×' ? D(m[1]).mul(D(m[3])) : D(m[1]).div(D(m[3]));
      return D(m[1]).eq(st.after) && v.eq(st.orig);
    });
  },

  roundOrig(q) { const st = story(q.prompt); return wantsCent(q.prompt) ? toCents(st.orig) : st.orig; },

  roundPick(q) {
    const want = toCents(story(q.prompt).orig);
    return q.choices.map(c => { const d = dollars(c); return d.length === 1 && /^\$[\d,]+\.\d\d$/.test(clean(c)) && d[0].eq(want); });
  },

  forwardCheck(q) {
    const st = story(q.prompt);
    const claim = D(clean(q.prompt).match(/says the [^$]*?was \$([\d.,]+)/)[1]);
    const prod = st.m.mul(claim), miss = prod.sub(st.after), diff = miss.n < 0 ? miss.neg() : miss;
    const allow = st.m.mul(Q(5, 1000));
    const accept = diff.cmp(allow) <= 0;
    return q.choices.map(c => {
      const s = clean(c);
      let m;
      if ((m = s.match(/^Reject: ([\d.]+) × \$([\d.,]+) = \$([\d.,]+) misses by \$([\d.,]+), more than rounding allows$/)))
        return !accept && D(m[1]).eq(st.m) && D(m[2]).eq(claim) && D(m[3]).eq(prod) && D(m[4]).eq(diff);
      if ((m = s.match(/^Accept: ([\d.]+) × \$([\d.,]+) = \$([\d.,]+), only \$([\d.,]+) off, within the rounding allowance$/)))
        return accept && D(m[1]).eq(st.m) && D(m[2]).eq(claim) && D(m[3]).eq(prod) && D(m[4]).eq(diff);
      // "just rounding" without the allowance, "not exactly", "gives it again", "stop at the cents": not a check
      return false;
    });
  },

  receiptCheck(q) {
    const st = story(q.prompt);
    return q.choices.map(c => {
      const p = dollars(c)[0];
      const ch = toCents(p.mul(st.r));
      const total = st.up ? p.add(ch) : p.sub(ch);
      return total.eq(st.after);
    });
  },

  checkHow(q) {
    const st = story(q.prompt);
    const found = D(clean(q.prompt).match(/found the [^:]*: \$([\d.,]+)/)[1]);
    const r100 = st.r.mul(100);
    return q.choices.map(c => {
      const s = clean(c);
      let m, base, op, rate, target;
      if ((m = s.match(/^Take ([\d.]+)% off \$([\d.,]+) and compare with \$([\d.,]+)$/))) { rate = D(m[1]); base = D(m[2]); op = 'down'; target = D(m[3]); return !st.up && rate.eq(r100) && base.eq(found) && target.eq(st.after); }
      if ((m = s.match(/^Add (?:an? )?([\d.]+)% (?:tip|markup|sales tax) to \$([\d.,]+) and compare with \$([\d.,]+)$/))) { rate = D(m[1]); base = D(m[2]); target = D(m[3]); return st.up && rate.eq(r100) && base.eq(found) && target.eq(st.after); }
      if ((m = s.match(/^Add ([\d.]+)% of \$([\d.,]+) to \$([\d.,]+) and compare with \$([\d.,]+)$/))) { const a = D(m[2]), b = D(m[3]); return st.up && D(m[1]).eq(r100) && a.eq(found) && b.eq(found) && D(m[4]).eq(st.after); }
      if ((m = s.match(/^Take ([\d.]+)% of \$([\d.,]+) off \$([\d.,]+) and compare with \$([\d.,]+)$/))) { const a = D(m[2]), b = D(m[3]); return !st.up && D(m[1]).eq(r100) && a.eq(found) && b.eq(found) && D(m[4]).eq(st.after); }
      return false; // dividing again repeats the same step; "more / less than" is only a one-sided bound
    });
  },

  addBack(q) {
    const s = clean(q.prompt);
    const start = dollars(s)[0];
    const steps = [...s.matchAll(/(goes up|go up|up) (\d+(?:\.\d+)?)%|(\d+(?:\.\d+)?)% off/g)].map(m => (m[2] ? Q(1).add(pct(m[2])) : Q(1).sub(pct(m[3]))));
    if (steps.length !== 2) throw new Error('two changes expected');
    return start.mul(steps[0]).mul(steps[1]);
  },

  undoPct(q) {
    const s = clean(q.prompt);
    const m = s.match(/goes from \$([\d.,]+) (?:up [\d.]+% )?to \$([\d.,]+)/);
    const a = D(m[1]), b = D(m[2]);
    const back = s.match(/get back to \$([\d.,]+)/);
    const target = back ? D(back[1]) : a;
    const ch = target.sub(b).div(b).mul(100);
    return ch.n < 0 ? ch.neg() : ch;
  },

  whyBase(q) {
    const s = clean(q.prompt);
    const m = s.match(/at \$([\d.,]+) goes (up (\d+(?:\.\d+)?)%|(\d+(?:\.\d+)?)% off), then the [a-z ]+ goes (up (\d+(?:\.\d+)?)%|(\d+(?:\.\d+)?)% off)\. It ends at \$([\d.,]+), not \$([\d.,]+)/);
    const start = D(m[1]), firstUp = !!m[3], r1 = pct(m[3] ?? m[4]), r2 = pct(m[6] ?? m[7]);
    const end = start.mul(firstUp ? Q(1).add(r1) : Q(1).sub(r1)).mul(firstUp ? Q(1).sub(r2) : Q(1).add(r2));
    const exact = end.eq(D(m[8]));
    return q.choices.map(c => {
      const t = clean(c);
      let mm;
      if ((mm = t.match(/^The second ([\d.]+)% is of the (bigger|smaller) [a-z ]+, so it (takes off more than was added|adds back less than came off)\.?$/)))
        return pct(mm[1]).eq(r2) && (mm[2] === 'bigger') === firstUp && (mm[3].startsWith('takes off')) === firstUp;
      if (/^Rounding/.test(t)) return !exact;
      return false; // "they make 0%, the store made a mistake"
    });
  },

  diagnose(q) {
    const s = clean(q.prompt);
    const st = story(s);
    const quote = s.match(/“([^”]*)”/)[1];
    const qd = dollars(quote);
    const W = qd[qd.length - 1];               // what the worker got
    const O = st.orig, workerRight = W.eq(O);
    const A = st.kind === 'part' ? st.part : st.after;
    return q.choices.map(c => {
      const t = clean(c);
      let m;
      if ((m = t.match(/^Right: \$([\d.,]+) is ([\d.]+)% of the [a-z ]+, so divide by ([\d.]+)\.?$/)))
        return workerRight && D(m[1]).eq(A) && pct(m[2]).eq(st.m) && D(m[3]).eq(st.m);
      if (/^Right: (adding|taking) the same/.test(t)) return false; // the same percent of the new amount does not undo it
      if ((m = t.match(/^Wrong base: .*It is \$([\d.,]+) ÷ ([\d.]+) = \$([\d.,]+)\.?$/)))
        return !workerRight && D(m[1]).eq(A) && D(m[1]).div(D(m[2])).eq(D(m[3])) && D(m[3]).eq(O);
      if ((m = t.match(/^Wrong: divide by the rate, \$([\d.,]+) ÷ ([\d.]+)\.?$/)))
        return !workerRight && D(m[1]).div(D(m[2])).eq(O);
      if ((m = t.match(/^Wrong: (add|take) ([\d.]+)% of \$([\d.,]+) (?:back on|off) instead\.?$/))) {
        const v = D(m[3]).mul(m[1] === 'add' ? Q(1).add(pct(m[2])) : Q(1).sub(pct(m[2])));
        return !workerRight && v.eq(O);
      }
      if ((m = t.match(/^\$([\d.,]+) is the ([\d.]+)% part, so the original is \$([\d.,]+) ÷ ([\d.]+) = \$([\d.,]+)\.?$/)))
        return D(m[1]).eq(A) && pct(m[2]).eq(st.r) && D(m[3]).div(D(m[4])).eq(D(m[5])) && D(m[5]).eq(O);
      if ((m = t.match(/^Add ([\d.]+)% back: \$([\d.,]+) \+ [\d.]+% of \$[\d.,]+\.?$/))) return D(m[2]).mul(Q(1).add(pct(m[1]))).eq(O);
      if (/is right: always divide by 1 - the rate/.test(t)) return false; // not a rule: the $ saved is the r% part
      return false;
    });
  },

  contextOrig(q) { const st = story(q.prompt); return wantsCent(q.prompt) ? toCents(st.orig) : st.orig; },

  boundFirst(q) {
    const O = story(q.prompt).orig;
    return q.choices.map(c => {
      const t = clean(c), d = dollars(t);
      if (/^Between/.test(t)) { const [lo, hi] = d[0].cmp(d[1]) < 0 ? d : [d[1], d[0]]; return O.cmp(lo) > 0 && O.cmp(hi) < 0; }
      if (/^Less than/.test(t)) return O.cmp(d[0]) < 0;
      if (/^More than/.test(t)) return O.cmp(d[0]) > 0;
      return false;
    });
  },
};

// ---------------------------------------------------------------- world
// a rough price band per thing bought (the price before the change)
const BANDS = [
  [/bike helmet/, 10, 400], [/soccer ball|\bball\b/, 5, 170], [/sneakers/, 10, 500], [/hoodie/, 8, 250], [/jacket/, 15, 800],
  [/backpack/, 8, 300], [/desk lamp|\blamp\b/, 8, 400], [/keyboard/, 8, 400], [/headphones/, 8, 700], [/smartwatch|\bwatch\b/, 15, 1000],
  [/tent/, 20, 1000], [/board game/, 5, 150], [/video game|\bgame\b/, 5, 150], [/skateboard/, 15, 400], [/haircut/, 8, 250],
  [/taxi/, 5, 300], [/pizza/, 8, 200], [/lunch/, 5, 250], [/dinner/, 10, 800],
];
function priceBand(prompt, v) {
  const s = clean(prompt);
  for (const [re, lo, hi] of BANDS) if (re.test(s)) return v.value < lo || v.value > hi ? `a ${s.match(re)[0]} at $${v.value.toFixed(2)}` : '';
  return '';
}
const pick = arr => {
  if (!Array.isArray(arr)) return undefined;
  const i = arr.findIndex(Boolean);
  return i >= 0 ? i : -1;   // -1: no choice is right (sane says so)
};
const out = v => (v && typeof v === 'object' && 'n' in v ? v.value : v);

export default {
  solve(q) {
    const f = F[q.family];
    if (!f) return undefined;
    let r;
    try { r = f(q); } catch { return undefined; }
    if (r == null) return undefined;
    if (q.input === 'choice') return pick(r);
    if (q.input === 'pair') return Array.isArray(r) ? r.map(out) : undefined;
    return out(r);
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
    let st = null;
    try { st = story(q.prompt); } catch { st = null; }
    // money that is typed must be whole cents, or the question must ask for the nearest cent (and not sit on a tie)
    if (st && ['reverse', 'contextOrig', 'roundOrig', 'roundPick', 'tapeUnit'].includes(q.family)) {
      const c = cents(st.orig);
      if (!c.exact && !wantsCent(q.prompt)) probs.push(`the original is $${st.orig.value} (not whole cents) and the question does not ask to round`);
      if (c.tie) probs.push(`the original $${st.orig.value} is a half-cent tie`);
      if (wantsCent(q.prompt) && c.exact && q.family !== 'contextOrig') probs.push('"to the nearest cent" but the original is already exact');
    }
    if (st && st.after && !isCents(st.after)) probs.push(`the amount $${st.after.value} is not whole cents`);
    if (st && st.orig.n <= 0) probs.push(`the original would be $${st.orig.value}`);
    if (st && q.family !== 'resultPct' && q.family !== 'multNum' && q.family !== 'multExpr') { const pb = priceBand(q.prompt, st.orig); if (pb) probs.push(pb); }
    // the board must show the prompt's numbers
    if (st && st.kind === 'change' && /\\to/.test(q.board) && /\?/.test(q.board) && ['tapeRead', 'reverse', 'whichCalc', 'roundOrig', 'diagnose', 'contextOrig', 'boundFirst'].includes(q.family)) {
      const bd = dollars(q.board.replace(/\\\$/g, '$').replace(/\\,/g, ''));
      if (bd.length && !bd[bd.length - 1].eq(st.after)) probs.push('the board amount is not the prompt amount');
    }
    if (q.family === 'tapeUnit' && st) {
      const m = clean(q.prompt).match(/is (\d+) sections? of (\d+(?:\.\d+)?)%/);
      if (!m || !Q(Number(m[1])).mul(pct(m[2])).eq(st.m)) probs.push('the sections do not make the new amount\'s percent');
      const sec = st.orig.mul(pct(m[2]));
      if (!isCents(sec)) probs.push(`one section is $${sec.value}`);
    }
    if (q.family === 'roundPick' && st) {
      const bm = clean(q.board.replace(/\\\$/g, '$')).match(/\$([\d.,]+) \\div ([\d.]+)/);
      if (bm && !(D(bm[1]).eq(st.after) && D(bm[2]).eq(st.m))) probs.push('the board division is not the story');
    }
    if (q.family === 'forwardCheck' && st) {
      const s = clean(q.prompt);
      const claim = D(s.match(/says the [^$]*?was \$([\d.,]+)/)[1]);
      const prod = st.m.mul(claim), miss = prod.sub(st.after), diff = miss.n < 0 ? miss.neg() : miss, allow = st.m.mul(Q(5, 1000));
      if (diff.eq(allow)) probs.push('the miss equals the allowance exactly');
      const rule = s.match(/may miss \$([\d.,]+) by at most ([\d.]+) × \$0\.005 = \$([\d.]+)/);
      if (rule && !(D(rule[1]).eq(st.after) && D(rule[2]).eq(st.m) && D(rule[3]).eq(allow))) probs.push('the rule\'s numbers are wrong');
      // the near-miss choice "only $d away, that is just rounding" is then also a fair accept
      if (diff.cmp(allow) <= 0 && q.choices.some(c => /just rounding/.test(c))) probs.push('"just rounding" is also true here');
    }
    if (q.family === 'diagnose' && st) {
      const quote = clean(q.prompt).match(/“([^”]*)”/)[1];
      const qd = dollars(quote), W = qd[qd.length - 1];
      // the worker's own arithmetic, as written, must be right (the slip is the method, not the sum)
      const mm = clean(quote).match(/\$([\d.,]+) ÷ ([\d.]+) = \$([\d.,]+)/);
      if (mm) { const v = D(mm[1]).div(D(mm[2])); if (!(isCents(v) ? v.eq(D(mm[3])) : toCents(v).eq(D(mm[3])))) probs.push('the worker\'s division is miscalculated'); }
      if (st.kind === 'part' && W.eq(st.orig)) probs.push(`the worker's number is right (rate ${st.r.mul(100)}%), so "${clean(q.prompt).match(/(\w+) writes/)?.[1]} is right" is also defensible`);
    }
    if (q.family === 'addBack') {
      const s = clean(q.prompt);
      const bd = dollars(q.board.replace(/\\\$/g, '$'));
      try {
        const start = dollars(s)[0];
        const steps = [...s.matchAll(/(goes up|go up|up) (\d+(?:\.\d+)?)%|(\d+(?:\.\d+)?)% off/g)].map(m => (m[2] ? Q(1).add(pct(m[2])) : Q(1).sub(pct(m[3]))));
        if (bd.length >= 2 && !bd[1].eq(start.mul(steps[0]))) probs.push('the board\'s middle amount is wrong');
        if (!isCents(r)) probs.push(`the end amount $${r.value} is not whole cents`);
        const pb = priceBand(s, start); if (pb) probs.push(pb);
      } catch { /* fine */ }
    }
    if (q.family === 'undoPct') {
      if (r && !terminates(r)) probs.push(`the percent ${r.value} has no exact value to type`);
      const s = clean(q.prompt);
      const m = s.match(/goes from \$([\d.,]+) (up ([\d.]+)% )?to \$([\d.,]+)(?:: ([\d.]+)% off)?/);
      if (m) {
        const a = D(m[1]), b = D(m[4]), rr = pct(m[3] ?? m[5]);
        if (!b.eq(a.mul(m[3] ? Q(1).add(rr) : Q(1).sub(rr)))) probs.push('the stated change does not take the first price to the second');
        const pb = priceBand(s, a); if (pb) probs.push(pb);
      }
    }
    if (q.family === 'whyBase') {
      const s = clean(q.prompt);
      const m = s.match(/at \$([\d.,]+) goes (up (\d+(?:\.\d+)?)%|(\d+(?:\.\d+)?)% off), then the [a-z ]+ goes (up (\d+(?:\.\d+)?)%|(\d+(?:\.\d+)?)% off)\. It ends at \$([\d.,]+), not \$([\d.,]+)/);
      if (m) {
        const start = D(m[1]), firstUp = !!m[3], r1 = pct(m[3] ?? m[4]), r2 = pct(m[6] ?? m[7]);
        const end = start.mul(firstUp ? Q(1).add(r1) : Q(1).sub(r1)).mul(firstUp ? Q(1).sub(r2) : Q(1).add(r2));
        if (!end.eq(D(m[8]))) probs.push(`the end amount should be $${end.value}`);
        if (!D(m[9]).eq(start)) probs.push('"not $X" is not the start');
        if (!r1.eq(r2)) probs.push('the two percents differ');
        const pb = priceBand(s, start); if (pb) probs.push(pb);
      }
    }
    if (q.family === 'resultPct' || q.family === 'tapeRead') {
      if (st && !isCents(st.orig)) probs.push(`the original would be $${st.orig.value}`);
    }
    return probs.join('; ');
  },
};
