// Oracle for the lesson "expected-value" (HS Statistics: probability distributions and expected value).
// Written from what the student sees only: the story in the prompt, the board, the choices and the drawn picture
// (distribution tables and bar graphs with their TeX labels, coin trees, dice grids as drawn, the simulation's running
// mean, the binomial histogram's n and p). Every distribution is rebuilt from the story (coins, dice, guesses,
// spinners, survey counts) and every probability, mean and expectation is worked out exactly with fractions; the
// binomial, geometric and Poisson probabilities from their formulas; the normal estimates from the 68-95-99.7 rule.
// Choice items are decided by computing what each statement claims. Highlight marks (`hl`) are never used.
// Conventions from DESIGN.md: geometric X = the trial of the first success; Y = failures before, when named.
// See docs/lessons/QUALITY_LAYER.md, "O: the oracle".
import { Q, choiceWhere, nums, fracs, texPlain, round } from '../../tools/quality/oracle-kit.mjs';

// ================================================================ small helpers
const WORDS = { one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10, eleven: 11, twelve: 12 };
const wnum = w => (/^\d+$/.test(w) ? +w : WORDS[String(w).toLowerCase()]);
const P = s => String(s).replace(/−/g, '-').replace(/[’]/g, "'");
const dec = f => Number(f.value.toFixed(12)); // an exact decimal answer without float noise
const fact = n => { let r = 1; for (let i = 2; i <= n; i++) r *= i; return r; };
const C = (n, k) => { let r = 1; for (let i = 1; i <= k; i++) r = (r * (n - k + i)) / i; return Math.round(r); };
const QC = (n, k) => Q(C(n, k));
const qpow = (f, k) => { let r = Q(1); for (let i = 0; i < k; i++) r = r.mul(f); return r; };
/** a cell / label text → exact fraction: "0.25", "\tfrac{1}{4}", "-0.1", "1/3" */
function cell(t) {
  if (t == null) return null;
  const s = P(texPlain(String(t))).replace(/\$/g, '').trim();
  const m = s.match(/^(-?)\(?(\d+)\)?\/\(?(\d+)\)?$/);
  if (m) { const f = Q(+m[2], +m[3]); return m[1] ? f.neg() : f; }
  return Q(s);
}
const pics = q => q.data?.picture?.pics ?? [];
const tablePic = q => pics(q).find(p => p.kind === 'table');
const barsPics = q => pics(q).filter(p => p.kind === 'bars');
/** a table as { xs: [Q|null], ps: [Q|null], heads } (first row values, second row probabilities / counts) */
function table(q) {
  const t = tablePic(q);
  if (!t) return null;
  return { xs: t.rows[0].cells.map(cell), ps: t.rows[1].cells.map(cell), heads: t.rows.map(r => texPlain(r.head)) };
}
/** a bar graph as { xs: [Q], ps: [Q|null] } read from the drawn labels (exact), else the bar heights */
function bars(b) {
  return { xs: b.xs.map(x => Q(x)), ps: b.xs.map((_, i) => (b.labs?.[i] != null ? cell(b.labs[i]) : b.ps[i] == null ? null : Q(b.ps[i]))) };
}
const ev = (xs, ps) => xs.reduce((s, x, i) => s.add(x.mul(ps[i])), Q(0));
const sumQ = a => a.reduce((s, x) => s.add(x), Q(0));
const varOf = (xs, ps) => { const m = ev(xs, ps); return xs.reduce((s, x, i) => s.add(x.sub(m).mul(x.sub(m)).mul(ps[i])), Q(0)); };
const eqv = (a, b) => Math.abs(a - b) < 1e-9;
/** the value of a money / number text in a choice: "$0.60", "−$1.00", "1.35" */
const money = s => { const m = P(s).match(/(-?)\$?(\d+(?:\.\d+)?)/); return m ? (m[1] ? -1 : 1) * +m[2] : NaN; };

// ================================================================ dice and coins
const DICE = []; for (let r = 1; r <= 6; r++) for (let b = 1; b <= 6; b++) DICE.push([r, b]);
function diceRule(p) {
  if (/\bsum\b/.test(p)) return (a, b) => a + b;
  if (/difference/.test(p)) return (a, b) => Math.abs(a - b);
  if (/larger/.test(p)) return (a, b) => Math.max(a, b);
  return null;
}
function coinOutcomes(n) {
  let out = [''];
  for (let i = 0; i < n; i++) out = out.flatMap(s => [s + 'H', s + 'T']);
  return out;
}
const coinCount = p => wnum(p.match(/Toss (\w+) (?:fair )?coins/)[1]);
const coinX = p => { const face = /number of tails/.test(p) ? 'T' : 'H'; return s => [...s].filter(c => c === face).length; };

// ================================================================ binomial-type stories → { n, p }
function binomStory(p) {
  p = P(p).replace(/(\d),(\d{3})(?!\d)/g, '$1$2');
  let m;
  if ((m = p.match(/A (\d+)-choice quiz has (\d+) questions/))) return { n: +m[2], p: Q(1, +m[1]) };
  if ((m = p.match(/defective with probability (\d*\.?\d+), independently; you test (\d+) parts/))) return { n: +m[2], p: Q(m[1]) };
  if ((m = p.match(/makes each free throw with probability (\d*\.?\d+), independently, and shoots (\d+)/))) return { n: +m[2], p: Q(m[1]) };
  if ((m = p.match(/asks (\d+) randomly chosen (?:adults|people) a yes\/no question; in the whole \(large\) population a share of (\d*\.?\d+) would say yes/))) return { n: +m[1], p: Q(m[2]) };
  if ((m = p.match(/asks (\d+) randomly chosen (?:adults|people) a yes\/no question; (?:in the population )?(\d+(?:\.\d+)?)% (?:of the population )?would say yes/))) return { n: +m[1], p: Q(m[2]).div(100) };
  if ((m = p.match(/shipment has ([\d,]+) items, each defective with probability (\d*\.?\d+)/))) return { n: +m[1].replace(/,/g, ''), p: Q(m[2]) };
  if ((m = p.match(/You guess on (\w+) questions with (\w+) choices each/))) return { n: wnum(m[1]), p: Q(1, wnum(m[2])) };
  if ((m = p.match(/makes (\d+(?:\.\d+)?)% of her free throws, independently, and takes (\d+)/))) return { n: +m[2], p: Q(m[1]).div(100) };
  return null;
}
const bpmf = (n, p, k) => QC(n, k).mul(qpow(p, k)).mul(qpow(Q(1).sub(p), n - k));
const bpmfF = (n, p, k) => C(n, k) * p ** k * (1 - p) ** (n - k);
/** "at least k", "more than k", "at most k", "fewer than k", "between a and b, inclusive", "exactly k", "at least one" */
function countEvent(p) {
  p = P(p);
  let m;
  if ((m = p.match(/between (\d+) and (\d+), inclusive/))) return k => k >= +m[1] && k <= +m[2];
  if (/at least one\b/.test(p)) return k => k >= 1;
  if ((m = p.match(/at least (\d+)/))) return k => k >= +m[1];
  if ((m = p.match(/more than (\d+)/))) return k => k > +m[1];
  if ((m = p.match(/at most (\d+)/))) return k => k <= +m[1];
  if ((m = p.match(/fewer than (\d+)/))) return k => k < +m[1];
  if ((m = p.match(/exactly (\d+)/))) return k => k === +m[1];
  return null;
}
/** a board relation P(X > k), P(X \ge k), P(a \le X < b) ... → predicate */
function boardEvent(board) {
  const b = P(board).replace(/\\geq?/g, '≥').replace(/\\leq?/g, '≤');
  let m;
  if ((m = b.match(/P\((-?\d+)\s*(≤|<)\s*X\s*(≤|<)\s*(-?\d+)\)/))) {
    const lo = +m[1], hi = +m[4], li = m[2] === '≤', hiI = m[3] === '≤';
    return k => (li ? k >= lo : k > lo) && (hiI ? k <= hi : k < hi);
  }
  if ((m = b.match(/P\(X\s*(≥|≤|>|<|=)\s*(-?\d+)\)/))) {
    const k0 = +m[2];
    return { '≥': k => k >= k0, '≤': k => k <= k0, '>': k => k > k0, '<': k => k < k0, '=': k => k === k0 }[m[1]];
  }
  return null;
}
/** a geometric story's success probability */
function geoP(p) {
  p = P(p);
  let m;
  if (/fair number cube until the first \d/.test(p)) return Q(1, 6);
  if (/fair coin until the first/.test(p)) return Q(1, 2);
  if ((m = p.match(/with probability (\d*\.?\d+)/))) return Q(m[1]);
  if ((m = p.match(/makes (\d+(?:\.\d+)?)% of her free throws/))) return Q(m[1]).div(100);
  return null;
}

// ================================================================ the families
const F = {
  // ---------------------------------------------------------------- rv-assign
  rvValue(q) {
    const p = P(q.prompt);
    let m;
    if ((m = p.match(/answer key is ([A-E](?:, [A-E])*)\. \w+ answered ([A-E](?:, [A-E])*)\./))) {
      const key = m[1].split(', '), ans = m[2].split(', ');
      return key.filter((k, i) => k === ans[i]).length;
    }
    if ((m = p.match(/costs \$(\d+(?:\.\d+)?) to play.*?red wins a \$(\d+(?:\.\d+)?) prize.*You spin (\w+)\./))) return dec(Q(m[3] === 'red' ? m[2] : 0).sub(Q(m[1])));
    if ((m = p.match(/coins land ([HT]+)/))) return coinX(p)(m[1]);
    const rule = diceRule(p);
    if ((m = p.match(/red cube shows (\d) and the blue cube shows (\d)/)) || (m = p.match(/cubes show (\d) and (\d)/))) return rule(+m[1], +m[2]);
    return undefined;
  },
  rvWhich(q) {
    return choiceWhere(q, c => {
      const m = P(c).match(/^(.*) both give X = (\d+): different outcomes can share one value/);
      if (!m) return false;
      const k = +m[2], p = P(q.prompt);
      const outs = m[1].match(/\(\d, \d\)|[HTRW]{2,}|right, wrong|wrong, right/g) ?? [];
      if (outs.length !== 2 || outs[0] === outs[1]) return false;
      return outs.every(o => {
        if (/^\(/.test(o)) { const [a, b] = nums(o); return diceRule(p)(a, b) === k; }
        if (/right|wrong/.test(o)) return o.split(', ').filter(w => w === 'right').length === k;
        if (/[RW]/.test(o)) return [...o].filter(x => x === 'R').length === k;
        return coinX(p)(o) === k;
      });
    });
  },
  // ---------------------------------------------------------------- event-x-equals-k
  eventCount(q) {
    const p = P(q.prompt);
    if (/coins/.test(p)) {
      const n = coinCount(p), X = coinX(p), k = +p.match(/\{X = (\d+)\}/)[1];
      return coinOutcomes(n).filter(s => X(s) === k).length;
    }
    const rule = diceRule(p);
    if (/How many different values/.test(p)) return new Set(DICE.map(([a, b]) => rule(a, b))).size;
    const k = +p.match(/\{X = (\d+)\}/)[1];
    return DICE.filter(([a, b]) => rule(a, b) === k).length;
  },
  eventList(q) {
    const p = P(q.prompt), k = +p.match(/\{X = (\d+)\}/)[1];
    let truth;
    if (/coins/.test(p)) { const X = coinX(p); truth = coinOutcomes(coinCount(p)).filter(s => X(s) === k); }
    else { const rule = diceRule(p); truth = DICE.filter(([a, b]) => rule(a, b) === k).map(([a, b]) => `(${a}, ${b})`); }
    const key = a => [...a].sort().join(';');
    return choiceWhere(q, c => {
      const items = c.replace(/^\{|\}$/g, '').match(/\(\d, \d\)|[HT]{2,}|\d+/g) ?? [];
      return items.length === truth.length && new Set(items).size === items.length && key(items) === key(truth);
    });
  },
  // ---------------------------------------------------------------- distribution-concept
  distParts(q) {
    const p = P(q.prompt);
    let m;
    if ((m = p.match(/What does P\(X = (\d+)\) = (\d*\.?\d+) say/))) return choiceWhere(q, c => c === `X takes the value ${m[1]} with probability ${m[2]}.`);
    if (/Which of these is the random variable/.test(p)) return choiceWhere(q, c => /a number that varies by chance$/.test(c));
    if (/value of X, not a probability/.test(p)) {
      const t = table(q);
      return choiceWhere(q, c => t.xs.some(x => x.eq(Q(c))) && !t.ps.some(x => x.eq(Q(c))));
    }
    return undefined;
  },
  distRead(q) {
    const p = P(q.prompt), t = table(q);
    let m;
    if ((m = p.match(/Which value of X has probability (\d*\.?\d+)/))) {
      const hits = t.xs.filter((x, i) => t.ps[i].eq(Q(m[1])));
      return hits.length === 1 ? dec(hits[0]) : NaN;
    }
    if ((m = p.match(/What is P\(X = (\d+)\)/))) { const i = t.xs.findIndex(x => x.eq(+m[1])); return dec(t.ps[i]); }
    return undefined;
  },
  // ---------------------------------------------------------------- validity-check
  validJudge(q) {
    const t = table(q), s = sumQ(t.ps), neg = t.ps.some(x => x.cmp(0) < 0);
    if (neg) return choiceWhere(q, c => /a probability is negative/.test(c));
    if (t.ps.some(x => x.cmp(1) > 0)) return -1;
    if (s.cmp(1) > 0) return choiceWhere(q, c => /add to more than 1/.test(c));
    if (s.cmp(1) < 0) return choiceWhere(q, c => /add to less than 1/.test(c));
    return choiceWhere(q, c => /^Valid/.test(c));
  },
  validMissing(q) {
    const t = table(q), miss = Q(1).sub(sumQ(t.ps.filter(x => x != null)));
    return q.input === 'num' ? dec(miss) : miss.pair;
  },
  // ---------------------------------------------------------------- build-equally-likely
  buildCoins(q) {
    const p = P(q.prompt), n = coinCount(p), X = coinX(p), k = +p.match(/P\(X = (\d+)\)/)[1];
    const outs = coinOutcomes(n);
    return Q(outs.filter(s => X(s) === k).length, outs.length).pair;
  },
  buildDice(q) {
    const p = P(q.prompt), rule = diceRule(p), k = +p.match(/P\(X = (\d+)\)/)[1];
    return Q(DICE.filter(([a, b]) => rule(a, b) === k).length, 36).pair;
  },
  // ---------------------------------------------------------------- graph-distribution
  graphHeight(q) {
    const p = P(q.prompt), N = +p.match(/Out of (\d+) equally likely outcomes/)[1], k = +p.match(/bar for X = (\d+) is missing/)[1];
    const counts = [...p.matchAll(/(\d+) give X = (\d+)/g)].map(m => [+m[1], +m[2]]);
    const hit = counts.find(([, v]) => v === k);
    return hit ? Q(hit[0], N).pair : undefined;
  },
  graphAxis(q) {
    const p = P(q.prompt);
    if (/horizontal axis/.test(p)) return choiceWhere(q, c => c === 'The possible values of X');
    if (/height of each bar/.test(p)) return choiceWhere(q, c => /^Its probability/.test(c));
    let m;
    if ((m = p.match(/takes the values ([\d., ]+?) with probabilities ([\d., ]+?)\. .*bar for X = (\d+) go/))) {
      const xs = m[1].split(', ').map(Number), ps = m[2].split(', '), k = +m[3], pk = ps[xs.indexOf(k)];
      return choiceWhere(q, c => c === `Above ${k} on the scale, ${pk} tall`);
    }
    return undefined;
  },
  // ---------------------------------------------------------------- event-probabilities
  eventSymbols(q) { return tableEvent(q); },
  eventWords(q) { return tableEvent(q); },
  // ---------------------------------------------------------------- path-probability
  pathGuess(q) {
    const p = P(q.prompt), c = wnum(p.match(/with (\w+) choices each/)[1]), r = Q(1, c);
    const seq = p.match(/probability of ((?:right|wrong)(?:, then (?:right|wrong))*)/)[1].split(', then ');
    return seq.reduce((s, w) => s.mul(w === 'right' ? r : Q(1).sub(r)), Q(1)).pair;
  },
  pathSpinner(q) {
    const p = P(q.prompt), red = Q(p.match(/red with probability (\d*\.?\d+)/)[1]), blue = Q(p.match(/blue with probability (\d*\.?\d+)/)[1]);
    const seq = p.match(/probability of ((?:red|blue)(?:, then (?:red|blue))*)/)[1].split(', then ');
    return dec(seq.reduce((s, w) => s.mul(w === 'red' ? red : blue), Q(1)));
  },
  // ---------------------------------------------------------------- multi-path-distribution
  multiGuess(q) {
    const p = P(q.prompt), n = wnum(p.match(/Guess on (\w+) questions/)[1]), c = wnum(p.match(/with (\w+) choices each/)[1]), k = +p.match(/P\(X = (\d+)\)/)[1];
    return bpmf(n, Q(1, c), k).pair;
  },
  multiShots(q) {
    const p = P(q.prompt), pr = Q(p.match(/with probability (\d*\.?\d+)/)[1]), n = wnum(p.match(/There are (\w+) /)[1]), k = +p.match(/P\(X = (\d+)\)/)[1];
    return dec(bpmf(n, pr, k));
  },
  // ---------------------------------------------------------------- empirical-distribution
  empRel(q) {
    const p = P(q.prompt), t = table(q), k = +p.match(/P\(X = (\d+)\)/)[1], N = sumQ(t.ps);
    const f = t.ps[t.xs.findIndex(x => x.eq(k))].div(N);
    return /three decimal places/.test(p) ? round(f.value, 3) : dec(f);
  },
  empEstimate(q) {
    const p = P(q.prompt), k = p.match(/found X = (\d+)/)[1];
    return choiceWhere(q, c => new RegExp(`^An estimate of P\\(X = ${k}\\) for a randomly chosen`).test(c));
  },
  // ---------------------------------------------------------------- frequency-table-mean
  freqMean(q) {
    const t = table(q), N = sumQ(t.ps), m = ev(t.xs, t.ps).div(N), p = P(q.prompt);
    const r = p.match(/(?:nearest|to) (tenth|hundredth|one decimal|two decimal)/);
    if (r) return round(m.value, /tenth|one/.test(r[1]) ? 1 : 2);
    return dec(m);
  },
  freqWhich(q) {
    const list = nums(texPlain(q.board)), mean = list.reduce((a, b) => a + b, 0) / list.length;
    const vals = c => { const m = c.match(/^\((.*)\) ÷ (\d+)$/); if (!m) return NaN; return m[1].split(' + ').reduce((s, t) => s + t.split('·').reduce((a, b) => a * +b, 1), 0) / +m[2]; };
    const hits = (q.choices ?? []).map((c, i) => (eqv(vals(c), mean) ? i : -1)).filter(i => i >= 0);
    if (hits.length === 1) return hits[0];
    return structuredFreq(q, list);
  },
  // ---------------------------------------------------------------- ev-weighted-mean
  evHundred(q) {
    const p = P(q.prompt), t = table(q), E = ev(t.xs, t.ps), N = +p.match(/Picture ([\d,]+) /)[1].replace(/,/g, '');
    if (/What is the total/.test(p)) return dec(E.mul(N));
    return dec(E);
  },
  evNotMode(q) { const t = table(q), E = ev(t.xs, t.ps).value; return choiceWhere(q, c => eqv(+c, E)); },
  // ---------------------------------------------------------------- compute-ev
  evTable(q) { const t = table(q); return dec(ev(t.xs, t.ps)); },
  evFrac(q) {
    const p = P(q.prompt);
    let m;
    if ((m = p.match(/fair (\d+)-sided die \(faces (\d+) to (\d+)\)/))) {
      const a = +m[2], b = +m[3];
      return Q(a + b, 2).pair;
    }
    const total = +p.match(/has (\d+) equal sectors/)[1];
    const parts = [...p.matchAll(/(\d+) sectors? shows? (\d+)/g)].map(m => [+m[1], +m[2]]);
    if (parts.reduce((s, [c]) => s + c, 0) !== total) return NaN;
    return parts.reduce((s, [c, v]) => s.add(Q(c * v, total)), Q(0)).pair;
  },
  // ---------------------------------------------------------------- net-payoff-ev
  netRaffle(q) {
    const r = raffle(q.prompt);
    return round(r.prizes.div(r.N).sub(r.cost).value, 2);
  },
  netCarnival(q) {
    const t = table(q), E = ev(t.xs, t.ps), cost = Q(P(q.prompt).match(/costs \$(\d+(?:\.\d+)?)/)[1]);
    return /net gain/.test(t.heads[0]) ? dec(E) : dec(E.sub(cost));
  },
  fairGame(q) {
    const p = P(q.prompt), cost = Q(p.match(/charges \$(\d+(?:\.\d+)?)/)[1]), prize = Q(p.match(/win an? \$(\d+(?:\.\d+)?) prize/)[1]), pr = fracs(p)[0];
    const E = prize.mul(pr).sub(cost);
    if (E.cmp(0) === 0) return choiceWhere(q, c => /^Fair: the expected net gain is \$0/.test(c));
    return choiceWhere(q, c => (E.cmp(0) > 0 ? /^Favors the player/ : /^Favors the booth/).test(c));
  },
  // ---------------------------------------------------------------- ev-single-outcome
  evPossible(q) {
    const d = singleDist(q);
    if (!d) return undefined;
    const E = ev(d.xs, d.ps), pos = d.xs.filter((x, i) => d.ps[i].cmp(0) > 0);
    const said = Q(P(q.prompt).match(/so E\(X\) = (-?\d*\.?\d+)/)[1]);
    if (!said.eq(E)) return -1;
    if (pos.length === 1 && pos[0].eq(E)) return choiceWhere(q, c => /^Certain/.test(c));
    if (pos.some(x => x.eq(E))) return choiceWhere(q, c => /^Possible/.test(c));
    return choiceWhere(q, c => /^Impossible/.test(c));
  },
  evOnePlay(q) {
    const p = P(q.prompt), cost = +p.match(/costs \$(\d+(?:\.\d+)?)/)[1], prize = +p.match(/pays an? \$(\d+(?:\.\d+)?) prize/)[1], pr = +p.match(/probability (\d*\.?\d+)/)[1];
    const E = round(prize * pr - cost, 2), said = money(p.match(/expected net gain is (-?\$\d+(?:\.\d+)?)/)[1]);
    if (!eqv(E, said)) return -1;
    return choiceWhere(q, c => {
      const m = P(c).match(/ends up \+\$(\d+(?:\.\d+)?) or -\$(\d+(?:\.\d+)?); (-?\$\d+(?:\.\d+)?) is the average over many plays/);
      return !!m && eqv(+m[1], prize - cost) && eqv(+m[2], cost) && eqv(money(m[3]), E);
    });
  },
  // ---------------------------------------------------------------- long-run-average
  runRead(q) {
    const p = P(q.prompt), cost = +p.match(/costs \$(\d+(?:\.\d+)?)/)[1], prize = +p.match(/pays an? \$(\d+(?:\.\d+)?) prize/)[1], pr = +p.match(/probability (\d*\.?\d+)/)[1];
    const E = round(prize * pr, 2);
    return choiceWhere(q, c => {
      const m = P(c).match(/settles near \$(\d+(?:\.\d+)?), (below|above) the \$(\d+(?:\.\d+)?) cost/);
      return !!m && eqv(+m[1], E) && eqv(+m[3], cost) && (m[2] === 'below') === (E < cost);
    });
  },
  runCheck(q) {
    const E = money(P(q.prompt).match(/expected net gain of (-?\$\d+(?:\.\d+)?)/)[1]);
    return choiceWhere(q, c => { const m = P(c).match(/^A short run can end ahead; over many plays the average per play tends toward (-?\$\d+(?:\.\d+)?)$/); return !!m && eqv(money(m[1]), E); });
  },
  // ---------------------------------------------------------------- no-compensation
  streakNext(q) {
    const p = P(q.prompt);
    let pr;
    if (/fair coin/.test(p)) pr = Q(1, 2);
    else if (/fair number cube/.test(p)) pr = Q(1, 6);
    else { const m = p.match(/makes (\d+)% of her shots/); pr = Q(+m[1], 100); }
    return choiceWhere(q, c => { const m = c.match(/^([\d./]+), the same as always$/); return !!m && cell(m[1]).eq(pr); });
  },
  streakCount(q) {
    const p = P(q.prompt), n = +p.match(/(?:tossed|rolled) ([\d,]+) more times/)[1].replace(/,/g, '');
    return dec(Q(n).mul(/coin/.test(p) ? Q(1, 2) : Q(1, 6)));
  },
  // ---------------------------------------------------------------- expected-total
  totalN(q) {
    const p = P(q.prompt);
    let m;
    if ((m = p.match(/In a sample of ([\d,]+) /))) { const t = table(q); return dec(ev(t.xs, t.ps).mul(+m[1].replace(/,/g, ''))); }
    if ((m = p.match(/costs \$(\d+(?:\.\d+)?) and pays \$(\d+(?:\.\d+)?) with probability (\d*\.?\d+)\. What is his expected net gain over (\d+) weeks/))) return dec(Q(m[2]).mul(Q(m[3])).sub(Q(m[1])).mul(+m[4]));
    if ((m = p.match(/sells all ([\d,]+) raffle tickets at \$(\d+(?:\.\d+)?)\. Prizes: one \$([\d,]+) and (\w+) of \$([\d,]+)/))) {
      const N = +m[1].replace(/,/g, ''), price = Q(m[2]), prizes = Q(+m[3].replace(/,/g, '') + wnum(m[4]) * +m[5].replace(/,/g, ''));
      return dec(price.mul(N).sub(prizes));
    }
    return undefined;
  },
  totalPossible(q) {
    const p = P(q.prompt), vals = p.match(/where X is ([\d, or]+?) \(/)[1].split(/,? or |, /).map(Number);
    const plays = wnum(p.match(/Play it (\w+) times/)[1]), total = +p.match(/total of \$(\d+) possible/)[1];
    let sums = new Set([0]);
    for (let i = 0; i < plays; i++) sums = new Set([...sums].flatMap(s => vals.map(v => s + v)));
    if (sums.has(total)) {
      return choiceWhere(q, c => {
        const m = c.match(/^Yes: for example ([\d +]+) = (\d+)$/);
        if (!m) return false;
        const terms = m[1].split(' + ').map(Number);
        return terms.length === plays && terms.every(v => vals.includes(v)) && terms.reduce((a, b) => a + b, 0) === total && +m[2] === total;
      });
    }
    return choiceWhere(q, c => /^No: no \w+ of the values/.test(c));
  },
  totalSpread(q) {
    const E = money(P(q.prompt).match(/E\(net\) = (-?\$\d+(?:\.\d+)?)/)[1]);
    return choiceWhere(q, c => { const m = P(c).match(/^The average per play tends to settle near (-?\$\d+(?:\.\d+)?), but the total can stray further/); return !!m && eqv(money(m[1]), E); });
  },
  // ---------------------------------------------------------------- same-mean-different-distributions
  sameMean(q) {
    const bp = barsPics(q), g = {};
    for (const b of bp) { const d = bars(b), name = b.title.match(/Game (\w)/)[1]; g[name] = { E: ev(d.xs, d.ps), V: varOf(d.xs, d.ps) }; }
    const { A, B } = g;
    if (!A.E.eq(B.E)) { const big = A.E.cmp(B.E) > 0 ? 'A' : 'B'; return choiceWhere(q, c => c === `Game ${big} has the larger E(X)`); }
    if (A.V.eq(B.V)) return -1;
    const wide = A.V.cmp(B.V) > 0 ? 'A' : 'B';
    return choiceWhere(q, c => { const m = c.match(/^Same E\(X\) = (-?\d*\.?\d+), but game (\w) is more spread out$/); return !!m && Q(m[1]).eq(A.E) && m[2] === wide; });
  },
  sameMeanPick(q) {
    const target = Q(P(q.prompt).match(/pays \$(\d+(?:\.\d+)?) on every play/)[1]);
    return choiceWhere(q, c => { const e = gameEV(c); return e != null && e.eq(target); });
  },
  // ---------------------------------------------------------------- binomial-distribution
  binomSetting(q) { return choiceWhere(q, c => isBinomial(c) === true); },
  binomExact(q) {
    const s = binomStory(q.prompt), k = +P(q.prompt).match(/P\(X = (\d+)\)/)[1];
    return round(bpmf(s.n, s.p, k).value, 3);
  },
  binomCumul(q) {
    const s = binomStory(q.prompt), ok = countEvent(q.prompt.split('Find the probability that')[1]);
    let t = Q(0);
    for (let k = 0; k <= s.n; k++) if (ok(k)) t = t.add(bpmf(s.n, s.p, k));
    return round(t.value, 3);
  },
  // ---------------------------------------------------------------- binomial-expected-value
  binomMean(q) { const s = binomStory(q.prompt); return dec(s.p.mul(s.n)); },
  binomMeaning(q) {
    const p = P(q.prompt), n = wnum(p.match(/guess on (\w+) questions/)[1]), c = wnum(p.match(/with (\w+) choices each/)[1]);
    const E = Q(n, c), said = Q(p.match(/= (\d*\.?\d+)\. What does/)[1]);
    if (!E.eq(said)) return -1;
    return choiceWhere(q, ch => { const m = ch.match(/^Over many such quizzes, the average number right per quiz tends toward (\d*\.?\d+)$/); return !!m && Q(m[1]).eq(E); });
  },
  // ---------------------------------------------------------------- geometric-distribution
  geoExact(q) {
    const p = P(q.prompt), pr = geoP(p), qq = Q(1).sub(pr);
    let r, m;
    if ((m = p.match(/What is P\(Y = (\d+)\)/))) r = qpow(qq, +m[1]).mul(pr);
    else if ((m = p.match(/What is P\(X = (\d+)\)/))) r = qpow(qq, +m[1] - 1).mul(pr);
    else return undefined;
    return q.input === 'frac' ? r.pair : dec(r);
  },
  geoTail(q) {
    const p = P(q.prompt), pr = geoP(p), qq = Q(1).sub(pr), m = p.match(/What is P\(X (>|≤|≥|<) (\d+)\)/), k = +m[2];
    const gt = j => qpow(qq, j); // P(X > j)
    const r = { '>': gt(k), '≤': Q(1).sub(gt(k)), '≥': gt(k - 1), '<': Q(1).sub(gt(k - 1)) }[m[1]];
    return dec(r);
  },
  geoMean(q) {
    const p = P(q.prompt), pr = geoP(p), E = Q(1).div(pr);
    return choiceWhere(q, c => {
      const m = c.match(/^On average the first success comes on \w+ (\d*\.?\d+), but it can take longer$/);
      return !!m && Math.abs(+m[1] - E.value) <= 0.005 + 1e-9;
    });
  },
  // ---------------------------------------------------------------- poisson-distribution
  poisRescale(q) {
    const p = P(q.prompt), rate = Q(p.match(/average of (\d*\.?\d+) per/)[1]);
    let m, len;
    if ((m = p.match(/in an? half hour/))) len = Q(1, 2);
    else if ((m = p.match(/in an? (\d+) minutes/))) len = Q(+m[1], 60);
    else if ((m = p.match(/in an? (\w+) hours/))) len = Q(wnum(m[1]));
    else if ((m = p.match(/in an? (\d+(?:\.\d+)?) square meters/))) len = Q(m[1]);
    else if ((m = p.match(/in an? (\w+) square meters/))) len = Q(wnum(m[1]));
    else return undefined;
    return dec(rate.mul(len));
  },
  poisProb(q) {
    const p = P(q.prompt), lam = +p.match(/λ = (\d*\.?\d+)/)[1], ok = countEvent(p.split('What is the probability of')[1]);
    let t = 0;
    for (let k = 0; k <= 200; k++) if (ok(k)) t += Math.exp(-lam) * lam ** k / fact(k);
    return round(t, 3);
  },
  poisMeaning(q) {
    const p = P(q.prompt);
    if (/good fit for a Poisson/.test(p)) return choiceWhere(q, c => /on a steady weekday/.test(c));
    const lam = +p.match(/λ = (\d*\.?\d+)/)[1];
    return choiceWhere(q, c => { const m = c.match(/^(\d*\.?\d+) is the average per hour; an hour with (\d+) calls can happen$/); return !!m && +m[1] === lam; });
  },
  // ---------------------------------------------------------------- binomial-normal-connection
  bnCheck(q) {
    const p = P(q.prompt), n = +p.match(/n = (\d+)/)[1], pr = Q(p.match(/p = (\d*\.?\d+)/)[1]);
    const a = pr.mul(n), b = Q(1).sub(pr).mul(n);
    if (a.cmp(10) >= 0 && b.cmp(10) >= 0) {
      return choiceWhere(q, c => { const m = P(c).match(/^Yes: np = (\d*\.?\d+) and n\(1 - p\) = (\d*\.?\d+) are both at least 10$/); return !!m && Q(m[1]).eq(a) && Q(m[2]).eq(b); });
    }
    return choiceWhere(q, c => {
      const m = P(c).match(/^No: (np|n\(1 - p\)) = (\d*\.?\d+) is less than 10/);
      if (!m) return false;
      const v = m[1] === 'np' ? a : b;
      return Q(m[2]).eq(v) && v.cmp(10) < 0;
    });
  },
  bnParams(q) {
    const s = binomStory(q.prompt), mu = s.p.mul(s.n), sd = Math.sqrt(mu.mul(Q(1).sub(s.p)).value);
    return [dec(mu), round(sd, 2)];
  },
  bnEstimate(q) {
    const s = binomStory(q.prompt), mu = s.p.mul(s.n).value, sd = Math.sqrt(s.p.mul(s.n).mul(Q(1).sub(s.p)).value), p = P(q.prompt);
    const z = x => (x - mu) / sd;
    let m, r;
    if ((m = p.match(/between (\d+) and (\d+) yes answers/))) r = PHI(z(+m[2])) - PHI(z(+m[1]));
    else if ((m = p.match(/fewer than (\d+) yes answers/))) r = PHI(z(+m[1]));
    else if ((m = p.match(/more than (\d+) yes answers/))) r = 100 - PHI(z(+m[1]));
    else return undefined;
    return Number.isNaN(r) ? NaN : round(r, 2);
  },
};

// ---------------------------------------------------------------- helpers used by the families
/** percent of a normal model below μ + zσ by the 68-95-99.7 rule (integer z from −3 to 3 only) */
function PHI(z) {
  const k = Math.round(z);
  if (Math.abs(z - k) > 1e-9 || Math.abs(k) > 3) return NaN;
  return { '-3': 0.15, '-2': 2.5, '-1': 16, 0: 50, 1: 84, 2: 97.5, 3: 99.85 }[k];
}
function tableEvent(q) {
  const t = table(q);
  const ok = boardEvent(q.board) ?? countEvent(P(q.prompt).split('probability that X is')[1] ?? '');
  if (!ok) return undefined;
  return dec(sumQ(t.ps.filter((_, i) => ok(t.xs[i].value))));
}
/** a raffle story: tickets N, cost, total prize money */
function raffle(text) {
  const p = P(text), N = +p.match(/sells all ([\d,]+) tickets/)[1].replace(/,/g, ''), cost = Q(p.match(/tickets at \$(\d+(?:\.\d+)?) each/)[1]);
  const big = +p.match(/one prize of \$([\d,]+)/)[1].replace(/,/g, '');
  const more = p.match(/and (\w+) prizes of \$([\d,]+)/);
  const prizes = Q(big + (more ? wnum(more[1]) * +more[2].replace(/,/g, '') : 0));
  return { N, cost, big, more: more ? { n: wnum(more[1]), v: +more[2].replace(/,/g, '') } : null, prizes };
}
/** the distribution behind an evPossible item: from the drawn graph / table, else from the story */
function singleDist(q) {
  const b = barsPics(q)[0];
  if (b) return bars(b);
  const t = table(q);
  if (t) return t;
  const p = P(q.prompt);
  let m;
  if ((m = p.match(/fair (\d+)-sided die \((\d+) to (\d+)\)/))) { const xs = []; for (let i = +m[2]; i <= +m[3]; i++) xs.push(Q(i)); return { xs, ps: xs.map(() => Q(1, xs.length)) }; }
  if ((m = p.match(/X is (\d+) with probability (\d*\.?\d+) and (\d+) otherwise/))) return { xs: [Q(+m[1]), Q(+m[3])], ps: [Q(m[2]), Q(1).sub(Q(m[2]))] };
  if ((m = p.match(/gives every one of its \d+ visitors an? \$(\d+(?:\.\d+)?) coupon/))) return { xs: [Q(m[1])], ps: [Q(1)] };
  return null;
}
/** the expected value of a game written in a choice */
function gameEV(c) {
  const s = P(c);
  let m;
  if ((m = s.match(/^((?:\$\d+(?:\.\d+)?(?:, | or )?)+): probabilities ([\d., ]+)$/))) {
    const xs = m[1].match(/\$(\d+(?:\.\d+)?)/g).map(v => Q(v.slice(1))), ps = m[2].split(', ').map(v => Q(v));
    return xs.length === ps.length ? ev(xs, ps) : null;
  }
  if ((m = s.match(/^((?:\$\d+(?:\.\d+)?(?:, | or )?)+), each with probability ([\d./]+)$/))) {
    const xs = m[1].match(/\$(\d+(?:\.\d+)?)/g).map(v => Q(v.slice(1)));
    return ev(xs, xs.map(() => cell(m[2])));
  }
  const parts = [...s.matchAll(/\$(\d+(?:\.\d+)?) with probability (\d*\.?\d+)/g)];
  if (parts.length >= 2) return ev(parts.map(x => Q(x[1])), parts.map(x => Q(x[2])));
  return null;
}
/** is the situation in a choice a binomial setting? true / false / null (unknown) */
function isBinomial(c) {
  if (/until/.test(c)) return false; // waiting time: no fixed n
  if (/tires|less likely/.test(c)) return false; // p changes
  if (/total of all the dice/.test(c)) return false; // not a count of successes
  if (/without replacement/.test(c)) {
    const m = c.match(/Draw (\d+) cards without replacement from (\d+) red and (\d+) black/);
    return false; // a small deck: p changes from draw to draw
  }
  if (/makes \d+% of her free throws, independently, shoots \d+ of them; X = the number made/.test(c)) return true;
  if (/Guess on all \d+ questions of a \d+-choice quiz; X = the number right/.test(c)) return true;
  if (/Toss a fair coin \d+ times; X = the number of (heads|tails)/.test(c)) return true;
  if (/Roll a fair number cube \d+ times; X = the number of \d+s/.test(c)) return true;
  if (/Ask \d+ randomly chosen adults from a large city whether .*; X = the number who say yes/.test(c)) return true;
  return null;
}
/** freqWhich fallback when several calculations happen to give the mean: the one built from the table */
function structuredFreq(q, list) {
  const counts = new Map(); for (const v of list) counts.set(v, (counts.get(v) ?? 0) + 1);
  return choiceWhere(q, c => {
    const m = c.match(/^\((.*)\) ÷ (\d+)$/);
    if (!m || +m[2] !== list.length || !/·/.test(m[1])) return false;
    const terms = m[1].split(' + ').map(t => t.split('·').map(Number));
    return terms.length === counts.size && terms.every(([v, k]) => counts.get(v) === k);
  });
}

// ================================================================ sane: what is impossible or unfair for the student
function sane(q) {
  const f = q.family, p = P(q.prompt), issues = [];
  const all = [q.prompt, ...(q.choices ?? [])].join(' | ');
  if (/\bfamilie\b/.test(all)) issues.push('"familie" (typo for "family")');
  if (/\bin an? (?:\d+|two|three|four|five|six) (?:hours|minutes|square meters)\b/.test(p)) issues.push(`"${p.match(/in an? \S+ (?:hours|minutes|square meters)/)[0]}": stray article`);
  if (/undefined|NaN/.test(all)) issues.push('undefined/NaN in the text');

  const t = tablePic(q) ? table(q) : null;
  // a "distribution" table outside the validity family must be a valid distribution
  if (t && /P\(X = x\)|^P$/.test(t.heads[1]) && !['validJudge', 'validMissing'].includes(f)) {
    const ps = t.ps.filter(x => x != null);
    if (ps.some(x => x.cmp(0) < 0 || x.cmp(1) > 0)) issues.push('a drawn probability is outside 0..1');
    if (!ps.some(x => x == null) && t.ps.every(x => x != null) && !sumQ(ps).eq(1)) issues.push(`the drawn probabilities add to ${sumQ(ps)}, not 1`);
  }
  for (const b of barsPics(q)) {
    const d = bars(b), ps = d.ps.filter(x => x != null);
    if (d.ps.every(x => x != null) && !sumQ(ps).eq(1)) issues.push(`a drawn bar graph sums to ${sumQ(ps)}`);
    if (b.ps) b.ps.forEach((h, i) => { if (h != null && d.ps[i] && !eqv(h, d.ps[i].value)) issues.push(`bar at ${b.xs[i]} is drawn ${h} tall but labelled ${d.ps[i]}`); });
  }
  if (f === 'validJudge') {
    const s = sumQ(t.ps), neg = t.ps.some(x => x.cmp(0) < 0);
    if (neg && !s.eq(1)) issues.push(`a negative probability and a sum of ${s}: two "not valid" reasons are true`);
  }
  if (f === 'validMissing') {
    const miss = Q(1).sub(sumQ(t.ps.filter(x => x != null)));
    if (miss.cmp(0) <= 0 || miss.cmp(1) > 0) issues.push(`the missing probability would be ${miss}`);
  }
  if (f === 'graphHeight') {
    const N = +p.match(/Out of (\d+)/)[1], counts = [...p.matchAll(/(\d+) give X = (\d+)/g)];
    if (counts.reduce((s, m) => s + +m[1], 0) !== N) issues.push('the counts do not add to the number of outcomes');
    const truth = /larger number/.test(p) ? DICE.map(([a, b]) => Math.max(a, b)) : /difference/.test(p) ? DICE.map(([a, b]) => Math.abs(a - b)) : null;
    if (truth) for (const m of counts) if (truth.filter(v => v === +m[2]).length !== +m[1]) issues.push(`${m[1]} outcomes give X = ${m[2]}? the dice say ${truth.filter(v => v === +m[2]).length}`);
    const b = bars(barsPics(q)[0]);
    b.xs.forEach((x, i) => { const m = counts.find(c => +c[2] === x.value); if (b.ps[i] && m && !b.ps[i].eq(Q(+m[1], N))) issues.push(`bar at ${x} is labelled ${b.ps[i]}, the counts give ${Q(+m[1], N)}`); });
  }
  if (['buildDice', 'eventCount', 'eventList', 'rvValue'].includes(f)) {
    const g = pics(q).find(x => x.kind === 'cond' && x.pic.kind === 'grid');
    if (g) {
      const rule = diceRule(p);
      g.pic.text.forEach((row, r) => row.forEach((v, c) => { if (rule && +v !== rule(r + 1, c + 1)) issues.push(`grid cell (${r + 1}, ${c + 1}) shows ${v}`); }));
    }
  }
  if (f === 'empRel' || f === 'empEstimate') {
    const N = +p.match(/survey of ([\d,]+)/)[1].replace(/,/g, '');
    if (!sumQ(t.ps).eq(N)) issues.push(`the counts add to ${sumQ(t.ps)}, the survey had ${N}`);
    if (f === 'empEstimate') {
      const m = p.match(/found X = (\d+) for (\d+) of them\. What does the relative frequency (\d*\.?\d+)/);
      if (!Q(+m[2], N).eq(Q(m[3]))) issues.push(`${m[2]}/${N} is not ${m[3]}`);
      const i = t.xs.findIndex(x => x.eq(+m[1]));
      if (!t.ps[i].eq(+m[2])) issues.push(`the table shows ${t.ps[i]} for X = ${m[1]}, the prompt says ${m[2]}`);
    }
    if (f === 'empRel' && /three decimal places/.test(p)) {
      const k = +p.match(/P\(X = (\d+)\)/)[1], v = t.ps[t.xs.findIndex(x => x.eq(k))].div(N).value * 1000;
      if (Math.abs(v - Math.floor(v) - 0.5) < 1e-7) issues.push('the three-decimal rounding is a tie');
    }
  }
  if (f === 'freqMean') {
    const N = +p.match(/for ([\d,]+) /)[1].replace(/,/g, '');
    if (!sumQ(t.ps).eq(N)) issues.push(`the counts add to ${sumQ(t.ps)}, not ${N}`);
    const m = ev(t.xs, t.ps).div(N);
    let d = m.d; for (const k of [2, 5]) while (d % k === 0) d /= k;
    if (d !== 1 && !/nearest|decimal place/.test(p)) issues.push(`the mean ${m} is not a terminating decimal and no rounding is stated`);
  }
  if (f === 'freqWhich') {
    const list = nums(texPlain(q.board)), mean = list.reduce((a, b) => a + b, 0) / list.length;
    const vals = c => { const m = c.match(/^\((.*)\) ÷ (\d+)$/); return m ? m[1].split(' + ').reduce((s, x) => s + x.split('·').reduce((a, b) => a * +b, 1), 0) / +m[2] : NaN; };
    const hits = (q.choices ?? []).filter(c => eqv(vals(c), mean));
    if (hits.length > 1) issues.push(`${hits.length} calculations give the mean ${round(mean, 4)}: ${hits.join(' and ')}`);
    const tb = table(q);
    if (tb) { const counts = new Map(); for (const v of list) counts.set(v, (counts.get(v) ?? 0) + 1); tb.xs.forEach((x, i) => { if (counts.get(x.value) !== tb.ps[i].value) issues.push(`the table count for ${x} does not match the list`); }); }
  }
  if (f === 'evNotMode') {
    const E = ev(t.xs, t.ps).value, hits = (q.choices ?? []).filter(c => eqv(+c, E));
    if (hits.length !== 1) issues.push(`${hits.length} choices equal E(X) = ${E}`);
  }
  if (f === 'evHundred') {
    const N = +p.match(/Picture ([\d,]+) /)[1].replace(/,/g, '');
    if (t.ps.some(x => x.mul(N).d !== 1)) issues.push('the proportions do not give whole numbers of trials');
  }
  if (f === 'netRaffle') {
    const r = raffle(q.prompt), tb = table(q), winners = 1 + (r.more?.n ?? 0);
    const expect = [[r.big - r.cost.value, Q(1, r.N)]];
    if (r.more) expect.push([r.more.v - r.cost.value, Q(r.more.n, r.N)]);
    expect.push([-r.cost.value, Q(r.N - winners, r.N)]);
    if (tb.xs.length !== expect.length || expect.some(([x, pr], i) => !tb.xs[i].eq(Q(x)) || !tb.ps[i].eq(pr))) issues.push('the drawn net-gain table does not match the raffle in the story');
    const v = r.prizes.div(r.N).sub(r.cost).value * 100;
    if (Math.abs(Math.abs(v - Math.trunc(v)) - 0.5) < 1e-7) issues.push('the cent rounding is a tie');
  }
  if (f === 'netCarnival') {
    const cost = +p.match(/costs \$(\d+(?:\.\d+)?)/)[1];
    if (/net gain/.test(t.heads[0]) && t.xs.some(x => x.value < -cost - 1e-9)) issues.push('a net loss larger than the cost');
    if (/net gain/.test(t.heads[0]) && !t.xs.some(x => eqv(x.value, -cost))) issues.push('no outcome loses exactly the cost');
  }
  if (f === 'fairGame') {
    const cost = Q(p.match(/charges \$(\d+(?:\.\d+)?)/)[1]), prize = Q(p.match(/win an? \$(\d+(?:\.\d+)?) prize/)[1]), pr = fracs(p)[0];
    const E = prize.mul(pr).sub(cost);
    if (pr.cmp(Q(1, 2)) < 0 && E.cmp(0) < 0 && (q.choices ?? []).some(c => /Not fair: you win less than half the time/.test(c))) issues.push('"Not fair: you win less than half the time" is also a true statement here');
    if (pr.eq(Q(1, 2)) && E.cmp(0) === 0 && (q.choices ?? []).some(c => /Fair: you win exactly half the time/.test(c))) issues.push('"Fair: you win exactly half the time" is also true here');
    if (/^A booth charges \$\d+ per play\. You win a \$(8|11|18)\b/.test(q.prompt)) issues.push(`"a $${p.match(/win a \$(\d+)/)[1]} prize": should be "an"`);
  }
  if (f === 'evOnePlay' || f === 'runRead') {
    if (/pays a \$(8|11|18)\b/.test(q.prompt)) issues.push(`"a $${p.match(/pays a \$(\d+)/)[1]} prize": should be "an"`);
  }
  if (f === 'rvValue' && /wins a \$(8|11|18)\b/.test(q.prompt)) issues.push(`"a $${p.match(/wins a \$(\d+)/)[1]} prize": should be "an"`);
  if (f === 'evOnePlay') {
    const cost = +p.match(/costs \$(\d+(?:\.\d+)?)/)[1], prize = +p.match(/pays an? \$(\d+(?:\.\d+)?) prize/)[1], pr = +p.match(/probability (\d*\.?\d+)/)[1];
    if (!eqv(round(prize * pr - cost, 2), money(p.match(/expected net gain is (-?\$\d+(?:\.\d+)?)/)[1]))) issues.push('the stated expected net gain is wrong');
    if (prize <= cost) issues.push(`the prize equals/does not beat the $${cost} cost: the player can never come out ahead, so "can’t win" is also true (two right choices)`);
  }
  if (f === 'runRead') {
    const run = pics(q).find(x => x.kind === 'run');
    const cost = +p.match(/costs \$(\d+(?:\.\d+)?)/)[1], prize = +p.match(/pays an? \$(\d+(?:\.\d+)?) prize/)[1], pr = +p.match(/probability (\d*\.?\d+)/)[1];
    const E = prize * pr;
    if (!eqv(money(p.match(/expected prize is (\$\d+(?:\.\d+)?)/)[1]), round(E, 2))) issues.push('the stated expected prize is wrong');
    if (run) {
      for (const m of p.matchAll(/([\d,]+) plays: \$(\d+(?:\.\d+)?)/g)) {
        const n = +m[1].replace(/,/g, ''), pt = run.pts.find(([x]) => x === n);
        if (pt && Math.abs(pt[1] - +m[2]) > 0.005 + 1e-9) issues.push(`at ${n} plays the graph shows ${pt[1]}, the prompt says $${m[2]}`);
        if (pt && Math.abs(Math.round(pt[1] * n / prize) - pt[1] * n / prize) > 1e-6) issues.push(`an average of ${pt[1]} after ${n} plays is not a whole number of $${prize} prizes`);
      }
      const ds = run.pts.map(([, y]) => Math.abs(y - E));
      if (ds.every((d, i) => i === 0 || d <= ds[i - 1] + 1e-12)) issues.push('the running mean really does move closer every step: the "every extra play" decoy is true');
      const last = run.pts[run.pts.length - 1][1];
      if (eqv(last, E)) issues.push('the average after the last play is exactly E: the "exactly" decoy is true');
      const five = run.pts.find(([x]) => x === 5);
      if (five && five[1] <= cost && (q.choices ?? []).some(c => /ahead after 5 plays/.test(c))) issues.push(`after 5 plays the average prize ${five[1]} is not above the $${cost} cost: the "ahead" decoy contradicts the data`);
    }
  }
  if (f === 'runCheck') {
    const n = wnum(p.match(/plays it (\w+) times/)[1]), E = money(p.match(/expected net gain of (-?\$\d+(?:\.\d+)?)/)[1]);
    const m = (q.choices ?? []).map(c => P(c).match(/should have lost exactly \$(\d+(?:\.\d+)?)/)).find(Boolean);
    if (m && !eqv(+m[1], -E * n)) issues.push(`"should have lost exactly $${m[1]}" is not n × E = ${-E * n}`);
  }
  if (f === 'streakNext') {
    const said = p.match(/(?:missed|landed heads) (\w+) (?:in a row|times in a row)/);
    const bd = texPlain(q.board);
    if (said && /miss/.test(bd)) { const k = (bd.match(/miss/g) ?? []).length; if (k !== wnum(said[1]) && !/…|\.\.\./.test(bd)) issues.push(`the board shows ${k} misses, the prompt says ${said[1]}`); }
  }
  if (f === 'totalN' && /club sells/.test(p)) {
    const m = p.match(/sells all ([\d,]+) raffle tickets at \$(\d+(?:\.\d+)?)\. Prizes: one \$([\d,]+) and (\w+) of \$([\d,]+)\. Each ticket.s expected prize is \$(\d+(?:\.\d+)?)/);
    if (m) { const N = +m[1].replace(/,/g, ''), e = (+m[3].replace(/,/g, '') + wnum(m[4]) * +m[5]) / N; if (!eqv(round(e, 2), +m[6])) issues.push(`each ticket's expected prize is ${e}, not $${m[6]}`); }
  }
  if (f === 'sameMean') {
    const bp = barsPics(q).map(b => bars(b));
    const Es = bp.map(d => ev(d.xs, d.ps));
    for (const c of q.choices ?? []) { const m = c.match(/^Same E\(X\) = (-?\d*\.?\d+)/); if (m && Es.every(e => e.eq(Es[0])) && !Q(m[1]).eq(Es[0])) issues.push(`the choices say E = ${m[1]}, the graphs give ${Es[0]}`); }
  }
  if (f === 'sameMeanPick') {
    const target = Q(p.match(/pays \$(\d+(?:\.\d+)?) on every play/)[1]);
    for (const c of q.choices ?? []) {
      const s = P(c), m = s.match(/probabilities ([\d., ]+)$/) ?? s.match(/each with probability ([\d./]+)$/);
      const parts = [...s.matchAll(/with probability (\d*\.?\d+)/g)];
      if (parts.length >= 2 && !sumQ(parts.map(x => Q(x[1]))).eq(1)) issues.push(`"${c}": probabilities do not add to 1`);
      if (m && /probabilities/.test(s) && !sumQ(m[1].split(', ').map(v => Q(v))).eq(1)) issues.push(`"${c}": probabilities do not add to 1`);
      if (gameEV(c) == null) issues.push(`cannot read the game "${c}"`);
    }
    if ((q.choices ?? []).filter(c => gameEV(c)?.eq(target)).length !== 1) issues.push('not exactly one game has the same mean');
  }
  if (f === 'binomSetting') {
    const flags = (q.choices ?? []).map(isBinomial);
    if (flags.some(x => x === null)) issues.push('a situation the oracle cannot classify');
    if (flags.filter(x => x === true).length !== 1) issues.push(`${flags.filter(x => x === true).length} binomial situations among the choices`);
  }
  if (['binomExact', 'binomCumul', 'bnParams', 'bnEstimate', 'binomMean'].includes(f)) {
    const s = binomStory(q.prompt);
    if (!s) issues.push('cannot read n and p');
    else if (f === 'binomExact' || f === 'binomCumul') {
      let v;
      if (f === 'binomExact') v = bpmf(s.n, s.p, +p.match(/P\(X = (\d+)\)/)[1]).value;
      else { const ok = countEvent(q.prompt.split('Find the probability that')[1]); v = 0; for (let k = 0; k <= s.n; k++) if (ok(k)) v += bpmf(s.n, s.p, k).value; }
      const r = v * 1000; if (Math.abs(r - Math.floor(r) - 0.5) < 1e-6) issues.push('the three-decimal rounding is (nearly) a tie');
      if (v < 0.0005) issues.push(`the probability ${v.toExponential(2)} rounds to 0.000`);
      const bm = texPlain(q.board).match(/n = (\d+), p = (\d*\.?\d+)/);
      if (bm && (+bm[1] !== s.n || !Q(bm[2]).eq(s.p))) issues.push('the board n, p do not match the story');
    } else if (f === 'bnEstimate') {
      const mu = s.p.mul(s.n), v = mu.mul(Q(1).sub(s.p)).value, sd = Math.sqrt(v);
      const bm = texPlain(q.board).match(/μ = (\d*\.?\d+).*= (\d*\.?\d+)$/);
      if (mu.value < 10 || s.n * (1 - s.p.value) < 10) issues.push('np or n(1 − p) is below 10: the normal model is not justified');
      if (Math.abs(sd - Math.round(sd)) > 1e-9) issues.push(`σ = ${sd.toFixed(3)} is not whole`);
      if (bm && (!eqv(+bm[1], mu.value) || !eqv(+bm[2], sd))) issues.push('the board μ / σ do not match n and p');
    }
  }
  if (f === 'bnParams') {
    const s = binomStory(q.prompt), v = s.p.mul(s.n).mul(Q(1).sub(s.p)).value, r = Math.sqrt(v) * 100;
    if (Math.abs(r - Math.floor(r) - 0.5) < 1e-6) issues.push('σ rounding is a tie');
    if (s.n * s.p.value < 10 || s.n * (1 - s.p.value) < 10) issues.push('np or n(1 − p) is below 10: "the normal model" is not justified');
  }
  if (f === 'bnCheck') {
    const b = pics(q).find(x => x.kind === 'binorm'), n = +p.match(/n = (\d+)/)[1], pr = +p.match(/p = (\d*\.?\d+)/)[1];
    if (b && (b.n !== n || !eqv(b.p, pr))) issues.push('the drawn histogram has another n or p');
  }
  if (f === 'poisProb') {
    const lam = +p.match(/λ = (\d*\.?\d+)/)[1], ok = countEvent(p.split('What is the probability of')[1]);
    let v = 0; for (let k = 0; k <= 200; k++) if (ok(k)) v += Math.exp(-lam) * lam ** k / fact(k);
    const r = v * 1000; if (Math.abs(r - Math.floor(r) - 0.5) < 1e-6) issues.push('the three-decimal rounding is (nearly) a tie');
  }
  if (f === 'poisRescale') {
    const r = F.poisRescale(q);
    if (r !== undefined && Math.abs(r * 1000 - Math.round(r * 1000)) > 1e-6) issues.push(`λ = ${r} is not a clean decimal and no rounding is stated`);
  }
  if (f === 'geoMean') {
    const pr = geoP(p), E = Q(1).div(pr), m = p.match(/E\(X\) = 1\/p (=|≈) (\d*\.?\d+)/);
    if (m && (m[1] === '=' ? !Q(m[2]).eq(E) : Math.abs(+m[2] - E.value) > 0.005)) issues.push(`E(X) = 1/p is ${E}, the prompt says ${m[2]}`);
  }
  if (f === 'binomMeaning') {
    const n = wnum(p.match(/guess on (\w+) questions/)[1]), c = wnum(p.match(/with (\w+) choices each/)[1]), E = Q(n, c);
    if (E.d === 1 && (q.choices ?? []).some(x => /is the most likely number right/.test(x))) {
      // for a whole-number np the mode of the binomial is np itself: the decoy would be true
      issues.push(`E(X) = ${E} is whole, so "${E} is the most likely number right" is true`);
    }
    const r = (q.choices ?? []).map(x => x.match(/You will get (\d+) right: (\d*\.?\d+) rounded/)).find(Boolean);
    if (r && Math.round(E.value) !== +r[1]) issues.push(`${E} rounded is not ${r[1]}`);
  }
  if (f === 'evPossible') {
    const d = singleDist(q);
    if (d) { const E = ev(d.xs, d.ps), said = Q(p.match(/so E\(X\) = (-?\d*\.?\d+)/)[1]); if (!said.eq(E)) issues.push(`E(X) is ${E}, the prompt says ${said}`); }
  }
  return [...new Set(issues)].join('; ');
}

function solve(q) {
  const f = F[q.family];
  if (!f) return undefined;
  return f(q);
}

export default { solve, sane };
