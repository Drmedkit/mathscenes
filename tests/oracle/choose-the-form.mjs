// choose-the-form oracle (role O, docs/lessons/QUALITY_LAYER.md). Works every practice item out from what the student
// sees: the amounts in the prompt (fractions, mixed numbers, decimals, percents, dollars, cents), the board and the
// choices. Every amount is read as an exact fraction (BigInt), so 2/3 vs 0.67 and 33% of $900 are compared without
// float noise. Choices are judged by value AND by what the question asks (the asked form, the context's form, a route
// that really gives the amount); reasons that are not reasons ("bigger digits", "a percent must become a decimal",
// "it was found with fractions", "it has 3 decimal places") are wrong.

// ---------------------------------------------------------------- exact fractions on BigInt
const babs = x => (x < 0n ? -x : x);
const bgcd = (a, b) => { a = babs(a); b = babs(b); while (b) [a, b] = [b, a % b]; return a; };
function R(n, d = 1n) { n = BigInt(n); d = BigInt(d); if (d < 0n) { n = -n; d = -d; } const g = bgcd(n, d) || 1n; return { n: n / g, d: d / g }; }
const add = (a, b) => R(a.n * b.d + b.n * a.d, a.d * b.d);
const sub = (a, b) => R(a.n * b.d - b.n * a.d, a.d * b.d);
const mul = (a, b) => R(a.n * b.n, a.d * b.d);
const div = (a, b) => { if (b.n === 0n) throw new Error('divide by 0'); return R(a.n * b.d, a.d * b.n); };
const eq = (a, b) => !!a && !!b && a.n === b.n && a.d === b.d;
const cmp = (a, b) => { const x = a.n * b.d - b.n * a.d; return x > 0n ? 1 : x < 0n ? -1 : 0; };
const absR = a => R(babs(a.n), a.d);
const toNum = a => Number(a.n) / Number(a.d);
const HUNDRED = R(100);
function dec(t) {
  const s = String(t).replace(/[−–]/g, '-').replace(/[$,\s]/g, '');
  const m = s.match(/^(-?)(\d*)(?:\.(\d+))?$/);
  if (!m || (m[2] === '' && !m[3])) throw new Error(`not a number: ${t}`);
  const frac = m[3] ?? '';
  const v = R(BigInt((m[2] || '0') + frac), 10n ** BigInt(frac.length));
  return m[1] ? R(-v.n, v.d) : v;
}
/** exact value → a short decimal number (when it terminates), else the float */
function numOut(a) {
  let d = a.d, k = 0;
  while (d % 10n === 0n) { d /= 10n; k++; }
  for (; d !== 1n && (d % 2n === 0n || d % 5n === 0n); k++) { /* scale below */ d = d % 2n === 0n ? d / 2n : d / 5n; }
  if (d !== 1n) return toNum(a);
  const scale = 10n ** BigInt(k), n = (a.n * scale) / a.d;
  const s = babs(n).toString().padStart(k + 1, '0');
  return Number(`${n < 0n ? '-' : ''}${k ? s.slice(0, -k) + '.' + s.slice(-k) : s}`);
}
const terminates = a => { let d = a.d; for (const p of [2n, 5n]) while (d % p === 0n) d /= p; return d === 1n; };
/** round half up to `places` decimals, exact */
function roundTo(a, places) {
  const k = 10n ** BigInt(places), x = a.n * k, q = x / a.d, r = x - q * a.d;
  const up = 2n * babs(r) >= a.d ? (x < 0n ? -1n : 1n) : 0n;
  return R(q + up, k);
}

// ---------------------------------------------------------------- reading amounts
/** '40%' '0.4' '.400' '1/2' '2 1/2' '$1.75' '75 cents' '75¢' → exact (null when it is not one amount) */
function amount(t) {
  let s = String(t).trim().replace(/[−–]/g, '-').replace(/,(?=\d{3})/g, '');
  let m;
  if ((m = s.match(/^(\d+(?:\.\d+)?)\s*(?:cents|¢)$/))) return div(dec(m[1]), HUNDRED);
  if ((m = s.match(/^(-?\d+(?:\.\d+)?|\.\d+)%$/))) return div(dec(m[1]), HUNDRED);
  if ((m = s.match(/^(\d+) (\d+)\/(\d+)%$/))) return div(add(R(BigInt(m[1])), R(BigInt(m[2]), BigInt(m[3]))), HUNDRED);
  if ((m = s.match(/^\$?(\d+) (\d+)\/(\d+)$/))) return add(R(BigInt(m[1])), R(BigInt(m[2]), BigInt(m[3])));
  if ((m = s.match(/^\$?(-?\d+)\/(\d+)$/))) return R(BigInt(m[1]), BigInt(m[2]));
  if ((m = s.match(/^\$?(-?\d*\.?\d+)$/))) return dec(m[1]);
  return null;
}
/** a choice "3/4 cup", "1 1/2 cups", "$1.75", "44% of students", "0.25 inch" → { v, form, rest } */
function lead(t) {
  const m = String(t).trim().match(/^(\$?\d+ \d+\/\d+|\$?\d+\/\d+|\$?\d*\.?\d+%?|\.\d+)(?:\s+(.*))?$/);
  if (!m) return null;
  const v = amount(m[1]); if (!v) return null;
  const form = /%$/.test(m[1]) ? 'percent' : /\//.test(m[1]) ? 'fraction' : /^\$/.test(m[1]) ? 'money' : /\./.test(m[1]) ? 'decimal' : 'whole';
  return { v, form, rest: m[2] ?? '', raw: m[1] };
}
/** TeX → plain maths: \dfrac{a}{b} a/b, 1\dfrac{1}{4} → 1 1/4, \% → %, \$ → $ */
function tex(t) {
  let s = String(t ?? '');
  for (let i = 0; i < 3; i++) s = s.replace(/(\d)\\[td]?frac\{(\d+)\}\{(\d+)\}/g, '$1 $2/$3').replace(/\\[td]?frac\{([^{}]*)\}\{([^{}]*)\}/g, '$1/$2');
  return s.replace(/\\text\{([^{}]*)\}/g, '$1').replace(/\\%/g, '%').replace(/\\\$/g, '$').replace(/\{,\}/g, ',').replace(/\\times/g, '×')
    .replace(/\\div/g, '÷').replace(/\\left|\\right/g, '').replace(/\\[,;:! ]|\\quad|\\qquad/g, ' ').replace(/\\[a-z]+/g, ' ').replace(/[{}]/g, '').replace(/\s+/g, ' ').trim();
}
/** a calculation "125 ÷ 5, then × 2", "0.05 × 63", "23% of 1,000 is 230; then ÷ 4" → exact value (null if not one) */
function route(t) {
  let s = String(t).replace(/, worked out on paper$| on the calculator$/, '').replace(/,(?=\d{3})/g, '');
  let m;
  if ((m = s.match(/^(\d+(?:\.\d+)?)% of (\d+(?:\.\d+)?) is (\d+(?:\.\d+)?); then ([×÷]) (\d+(?:\.\d+)?)$/))) {
    const first = mul(div(dec(m[1]), HUNDRED), dec(m[2]));
    if (!eq(first, dec(m[3]))) return null;
    return m[4] === '÷' ? div(first, dec(m[5])) : mul(first, dec(m[5]));
  }
  const parts = s.split(/, then /);
  let v = null;
  for (const p of parts) {
    if ((m = p.match(/^\$?(\d+(?:\.\d+)?) ([×÷]) \$?(\d+(?:\.\d+)?)$/)) && v === null) v = m[2] === '×' ? mul(dec(m[1]), dec(m[3])) : div(dec(m[1]), dec(m[3]));
    else if ((m = p.match(/^([×÷]) (\d+(?:\.\d+)?)$/)) && v !== null) v = m[1] === '×' ? mul(v, dec(m[2])) : div(v, dec(m[2]));
    else return null;
  }
  return v;
}
const NUM = '(\\d+ \\d+\\/\\d+|\\d+\\/\\d+|\\d[\\d,]*(?:\\.\\d+)?%?|\\.\\d+)';
const AMT = '\\$?(\\d[\\d,]*(?:\\.\\d+)?)';

// ---------------------------------------------------------------- families
const F = {
  threeNames(q) {
    const m = q.prompt.match(new RegExp(`^Which is the same amount as ${NUM}, written as an? (decimal|percent|fraction)\\?`));
    const v = amount(m[1]), want = m[2];
    return q.choices.map(c => { const l = lead(c); if (!l || !eq(l.v, v)) return false; return want === 'percent' ? l.form === 'percent' : want === 'fraction' ? l.form === 'fraction' : l.form === 'decimal' || l.form === 'whole'; });
  },
  sameAmount(q) {
    const m = q.prompt.match(new RegExp(`^Is ${NUM} of (.+?) the same amount as ${NUM} of (.+?)\\?$`));
    const same = eq(amount(m[1]), amount(m[3])) && m[2] === m[4];
    return q.choices.map(c => (/^Yes, the same amount$/.test(c) ? same : /^No, different amounts$/.test(c) ? !same : false));
  },
  decPct(q) {
    let m;
    if ((m = q.prompt.match(new RegExp(`^Write ${NUM} as a percent\\.`)))) return mul(amount(m[1]), HUNDRED);
    if ((m = q.prompt.match(new RegExp(`^Write ${NUM} as a decimal\\.`)))) return amount(m[1]);
    return null;
  },
  centsDollars(q) {
    let m;
    if ((m = q.prompt.match(new RegExp(`costs ${AMT}\\. How many cents is that\\?`)))) return mul(dec(m[1]), HUNDRED);
    if ((m = q.prompt.match(new RegExp(`^What percent of a dollar is ${AMT}\\?`)))) return mul(dec(m[1]), HUNDRED);
    if ((m = q.prompt.match(/costs (\d+) cents?\. Write the price in dollars\./))) return div(dec(m[1]), HUNDRED);
    return null;
  },
  over100(q) {
    let m;
    if ((m = q.prompt.match(new RegExp(`^Write ${NUM} as a percent\\.`)))) return mul(amount(m[1]), HUNDRED);
    if ((m = q.prompt.match(new RegExp(`^Write ${NUM} as a (?:decimal|fraction or a mixed number)\\.`)))) return amount(m[1]);
    return null;
  },
  overChoice(q) {
    const v = amount(q.prompt.match(/(\d+(?:\.\d+)?%)/)[1]);
    return q.choices.map(c => { const m = c.match(new RegExp(`^${NUM} times as `)); return !!m && eq(amount(m[1]), v); });
  },
  sameWhole(q) {
    const g = groups(q.prompt); if (!g) return null;
    const [A, B] = g;
    const sameShare = eq(A.share, B.share), sameWholeN = eq(A.whole, B.whole), sameCount = eq(A.count, B.count);
    return q.choices.map(c => {
      if (/^Yes: same whole, and .+ = .+$/.test(c)) return sameWholeN && sameShare && sameCount;
      if (/^Yes: .+ = .+, so it’s the same number$/.test(c)) return sameCount && !sameWholeN; // only when the counts really match
      if (/^No: the wholes are different sizes$/.test(c)) return !sameWholeN && !sameCount;
      if (/^No: .+ and .+ are different amounts$/.test(c)) return !sameShare && !sameCount;
      return false; // "bigger digits"
    });
  },
  moreHow(q) {
    const g = groups(q.prompt); if (!g) return null;
    const m = q.prompt.match(/How many more \w+(?: \w+)? in (.+?)\?$/);
    const asked = m[1].toLowerCase().replace(/^the /, '');
    const i = g.findIndex(x => x.name.toLowerCase().replace(/^the /, '') === asked);
    if (i < 0) return null;
    return sub(g[i].count, g[1 - i].count);
  },
  contextMatch(q) {
    const left = tex(q.board).split('=')[0].trim().replace(/ cups?$| off$/, '').replace(/¢$/, ' cents').trim();
    let v;
    let m;
    if ((m = left.match(/^(\d+) in (\d+)$/))) v = R(BigInt(m[1]), BigInt(m[2]));
    else v = amount(left);
    if (!v) return null;
    return q.choices.map(c => { const l = lead(c.replace(/ of a dollar$/, '')); return !!l && eq(l.v, v); });
  },
  fractionRoute: q => pctOf(q),
  routeCompute: q => pctOf(q),
  whichFraction(q) {
    const want = pctOf(q);
    return q.choices.map(c => eq(route(c), want));
  },
  routePick(q) {
    const want = pctOf(q);
    return q.choices.map(c => eq(route(c), want));
  },
  routeEqual(q) {
    const want = pctOf(q);
    const m = q.prompt.match(/finds (?:an? )?(\d+(?:\.\d+)?)% (?:tip )?(?:of|on) \$?([\d,.]+) as (.+?)\. \w+ works out ([\d.]+) × ([\d,.]+)\./);
    if (!m) return null;
    const W = dec(m[2]);
    let r1 = null, mm;
    if ((mm = m[3].match(/^(\d+)\/(\d+) of ([\d,.]+)$/))) r1 = mul(R(BigInt(mm[1]), BigInt(mm[2])), dec(mm[3]));
    else if ((mm = m[3].match(/^(?:(\d+) × )?(\d+)% \+ (\d+)%$/))) r1 = mul(add(mul(dec(mm[1] ?? '1'), dec(mm[2])), dec(mm[3])), div(W, HUNDRED));
    const r2 = mul(dec(m[4]), dec(m[5]));
    const both = eq(r1, want) && eq(r2, want);
    return q.choices.map(c => (/^Both routes give the same/.test(c) ? both : false));
  },
  orderForms(q) {
    const m = q.prompt.match(/^Which is the (greatest|least): (.+)\?$/);
    const vals = m[2].split(/,\s*(?=\d|\.)/).map(s => amount(s.trim()));
    if (vals.some(v => !v)) return null;
    const best = vals.reduce((b, v) => (m[1] === 'greatest' ? (cmp(v, b) > 0 ? v : b) : (cmp(v, b) < 0 ? v : b)));
    return q.choices.map(c => eq(amount(c), best));
  },
  compareTwo(q) {
    const m = q.prompt.match(new RegExp(`^Which is more: ${NUM} or ${NUM}\\?$`));
    const a = amount(m[1]), b = amount(m[2]), c0 = cmp(a, b);
    return q.choices.map(c => (/^They are equal$/.test(c) ? c0 === 0 : c0 > 0 ? eq(amount(c), a) && c.trim() === m[1] : c0 < 0 ? eq(amount(c), b) && c.trim() === m[2] : false));
  },
  reportForm(q) {
    const p = q.prompt;
    const vals = tex(q.board).split(/=|\?/).map(s => amount(s.trim().replace(/ off$/, ''))).filter(Boolean);
    const v = vals[0];
    if (/^Nobody said which form to use\./.test(p)) {
      const same = vals.length >= 2 && vals.every(x => eq(x, v));
      return q.choices.map(c => (/^Both: same amount, and no form was asked for$/.test(c) ? same : false));
    }
    let want;
    if (/survey|headline/.test(p)) want = (l, c) => l.form === 'percent';
    else if (/ruler marked in (eighths|sixteenths|quarters)/.test(p)) want = (l, c) => l.form === 'fraction' && !/%/.test(c);
    else if (/recipe/.test(p)) want = (l, c) => l.form === 'fraction' || (l.form === 'whole' && /cups?$/.test(l.rest));
    else if (/price|tag/.test(p)) want = (l, c) => l.form === 'money';
    else if (/science lab|lab sheet|meters/.test(p)) want = (l, c) => l.form === 'decimal';
    else return null;
    return q.choices.map(c => { const l = lead(c); return !!l && eq(l.v, v) && !/% of an? /.test(c) && want(l, c); });
  },
  eitherForm(q) {
    const p = q.prompt;
    const m = p.match(/, (\w+) writes (.+?)\. (\w+) writes (.+?)\. Who is right\?$/);
    const A = lead(m[2]), B = lead(m[4]);
    const same = !!A && !!B && eq(A.v, B.v);
    const ask = (p.match(/^The worksheet asks for an? (decimal|percent|fraction)\./) ?? [])[1];
    if (!ask) return q.choices.map(c => (/^Both: same amount, and no form was asked for$/.test(c) ? same : false));
    const fits = l => (ask === 'decimal' ? l.form === 'decimal' : l.form === ask);
    return q.choices.map(c => {
      const mm = c.match(/^(\w+): the worksheet asked for an? (\w+)$/);
      if (!mm || mm[2] !== ask) return false;
      const who = mm[1] === m[1] ? A : mm[1] === m[3] ? B : null;
      const other = who === A ? B : A;
      return same && !!who && fits(who) && !fits(other);
    });
  },
  reportAs(q) {
    const p = q.prompt;
    let m;
    if ((m = p.match(/You worked it out as ([\d.]+)\. The school paper reports shares as percents\./))) return mul(dec(m[1]), HUNDRED);
    if ((m = p.match(/practice took ([\d.]+) of an hour\. Your coach wants it in minutes\./))) return mul(dec(m[1]), R(60));
    if ((m = p.match(/= ([\d.]+) dollars\. The receipt shows the tax in cents\./))) return mul(dec(m[1]), HUNDRED);
    if ((m = p.match(/([\d.]+) of an? (hour|day)\b.*How many (minutes|hours)\?/))) return mul(dec(m[1]), R(m[2] === 'hour' ? 60 : 24));
    return null;
  },
  reportPick(q) {
    const p = q.prompt;
    const v = amount(tex(q.board).split('=')[0].trim().replace(/ (dollars|lb)$/, '').trim());
    let want;
    if (/payment app/.test(p)) want = l => l.form === 'money';
    else if (/scale shows decimals/.test(p)) want = l => l.form === 'decimal';
    else if (/chart shows percents/.test(p)) want = l => l.form === 'percent';
    else return null;
    return q.choices.map(c => { if (/it was found with fractions/.test(c)) return false; const l = lead(c); return !!l && eq(l.v, v) && want(l); });
  },
  eqOrApprox(q) {
    const m = q.prompt.match(/^Is (\S+) exactly equal to (.+?), or only close\?$/);
    const bt = tex(q.board).match(/(\d+ \d+\/\d+%)$/);
    if (bt && /^\d+\/\d+%$/.test(m[2])) m[2] = bt[1]; // the plain text drops the space of 66 2/3%
    const a = amount(m[1]);
    const b = /^0\.333… \(the 3s go on forever\)$/.test(m[2]) ? R(1n, 3n) : /^0\.666… \(the 6s go on forever\)$/.test(m[2]) ? R(2n, 3n) : amount(m[2]);
    if (!b) return null;
    const same = eq(a, b);
    return q.choices.map(c => (/^= exactly equal$/.test(c) ? same : /^≈ only close$/.test(c) ? !same : false));
  },
  calcDisplay(q) {
    const m = q.prompt.match(/^A calculator shows ([\d.]+) for (\d+) ÷ (\d+)\. Is that exactly (\d+)\/(\d+)\?$/);
    const shown = dec(m[1]), v = R(BigInt(m[2]), BigInt(m[3]));
    const exact = eq(shown, v);
    return q.choices.map(c => (/^Yes: the division stops, so the decimal is exact$/.test(c) ? exact && terminates(v) : /^No: the digits go on forever; the screen cut them off$/.test(c) ? !exact && !terminates(v) : false));
  },
  roundingGap(q) {
    const p = q.prompt;
    let m;
    if ((m = p.match(/^(\d+)\/(\d+) of a \$([\d,]+) .+ uses (\d+(?:\.\d+)?)% instead\./))) {
      const W = dec(m[3]);
      return absR(sub(mul(R(BigInt(m[1]), BigInt(m[2])), W), mul(div(dec(m[4]), HUNDRED), W)));
    }
    if ((m = p.match(/needs (\d+)\/(\d+) cup of \w+ per batch\. You make (\d+) batches but use ([\d.]+) cup per batch\./))) {
      const k = R(BigInt(m[3]));
      return absR(sub(mul(R(BigInt(m[1]), BigInt(m[2])), k), mul(dec(m[4]), k)));
    }
    if ((m = p.match(/^(\w+) friends split \$([\d,]+)\. Each pays \$([\d.]+)\./))) {
      const n = { Two: 2, Three: 3, Four: 4, Five: 5, Six: 6, Seven: 7 }[m[1]] ?? Number(m[1]);
      return sub(dec(m[2]), mul(R(n), dec(m[3])));
    }
    return null;
  },
  keepExact(q) {
    const m = q.prompt.match(/finds (\d+)\/(\d+) of \$([\d,]+) as ([\d.]+) × ([\d,]+) = \$([\d,.]+)/);
    const exact = mul(R(BigInt(m[1]), BigInt(m[2])), dec(m[3]));
    const got = mul(dec(m[4]), dec(m[5]));
    const off = absR(sub(got, exact));
    return q.choices.map(c => { const mm = c.match(/^No: ([\d.]+) is rounded, so it is \$([\d,.]+) off$/); return !!mm && !eq(off, R(0)) && eq(dec(mm[2]), off) && eq(dec(mm[1]), dec(m[4])); });
  },
  tolerance(q) {
    const m = q.prompt.match(/is (\d+ \d+\/\d+|\d+\/\d+|[\d.]+) (\w+)\. A plan writes ([\d.]+) \w+\. It must be within (\d+\/\d+|[\d.]+) (\w+)\./);
    const exact = amount(m[1]), wrote = dec(m[3]), tol = amount(m[4]);
    const off = absR(sub(exact, wrote)), ok = cmp(off, tol) < 0;
    return q.choices.map(c => (/^Yes: it is off by less than /.test(c) ? ok : /^No: it is off by more than /.test(c) ? !ok && cmp(off, tol) > 0 : false));
  },
  nearestCent(q) {
    const m = q.prompt.match(/^(\d+) friends split \$([\d,.]+) equally\./);
    return roundTo(div(dec(m[2]), R(BigInt(m[1]))), 2);
  },
  fasterRoute(q) {
    const want = pctOf(q);
    const calc = /^Calculator allowed/.test(q.prompt);
    const ok = q.choices.map(c => eq(route(c), want));
    // with no calculator a fraction / benchmark route beats long multiplication on paper; with one, the calculator
    const pref = q.choices.map((c, i) => ok[i] && (calc ? /on the calculator$/.test(c) : !/worked out on paper$/.test(c)));
    return pref.some(Boolean) ? pref : ok;
  },
  checkResult(q) {
    const m = q.prompt.match(/^A calculator says ([\d.]+)% of \$([\d,.]+) is \$([\d,.]+)\. Check it with (\d+)\/(\d+) of \$([\d,.]+)\./);
    const claim = dec(m[3]), est = mul(R(BigInt(m[4]), BigInt(m[5])), dec(m[6]));
    const near = cmp(absR(sub(claim, est)), mul(est, R(1n, 4n))) <= 0;
    return q.choices.map(c => {
      let mm;
      if ((mm = c.match(/^Reasonable: it is close to \$([\d,.]+)$/))) return near && eq(dec(mm[1]), est);
      if ((mm = c.match(/^Not reasonable: it should be about \$([\d,.]+)$/))) return !near && eq(dec(mm[1]), est);
      return false;
    });
  },
  estimateFirst(q) {
    const m = q.prompt.match(/use (\d+)\/(\d+) of \$([\d,.]+)\./);
    return mul(R(BigInt(m[1]), BigInt(m[2])), dec(m[3]));
  },
  multiStep(q) {
    const p = q.prompt;
    let m;
    if ((m = p.match(/^An? \$([\d,.]+) .+? is (\d+(?:\.\d+)?)% off\. Then (\d+(?:\.\d+)?)% sales tax is added to the sale price\./))) {
      const sale = mul(dec(m[1]), sub(R(1), div(dec(m[2]), HUNDRED)));
      return mul(sale, add(R(1), div(dec(m[3]), HUNDRED)));
    }
    if ((m = p.match(/uses (\d+\/\d+|[\d.]+) cups? of \w+ per batch\. You make (\d+) batches with a scoop that holds (\d+\/\d+|[\d.]+) cups?\./))) {
      return div(mul(amount(m[1]), R(BigInt(m[2]))), amount(m[3]));
    }
    return null;
  },
};
/** "p% of $N" from the board (or the prompt) */
function pctOf(q) {
  const b = tex(q.board);
  const m = b.match(/^(\d+(?:\.\d+)?)% of \$?([\d,.]+)$/) ?? q.prompt.match(/(\d+(?:\.\d+)?)% of \$?([\d,]+(?:\.\d+)?)/);
  return mul(div(dec(m[1]), HUNDRED), dec(m[2]));
}
/** the two groups of a "same whole" story: { name, share, whole, count } */
function groups(p) {
  const re = new RegExp(`In (.+?), ${NUM} of the ([\\d,]+) [a-z ]+? (?:are|were|bike|walk)[^.]*\\.`, 'g');
  const g = [...p.matchAll(re)].map(m => { const share = amount(m[2]), whole = dec(m[3]); return { name: m[1], share, whole, count: mul(share, whole) }; });
  return g.length === 2 ? g : null;
}

// ---------------------------------------------------------------- the world
function worldProblems(q, r) {
  const probs = [];
  const p = q.prompt;
  const money = ['routeCompute', 'fractionRoute', 'nearestCent', 'estimateFirst'].includes(q.family) || (q.family === 'multiStep' && /\$/.test(p));
  if (money && r && 'n' in r && !eq(roundTo(r, 2), r)) probs.push(`the money answer ${toNum(r)} is not a whole number of cents`);
  if (['moreHow', 'sameWhole'].includes(q.family)) {
    const g = groups(p);
    if (g) for (const x of g) if (x.count.d !== 1n) probs.push(`${toNum(x.count)} ${x.name} items is not a whole count`);
  }
  if (q.family === 'moreHow' && r && 'n' in r) {
    if (r.n <= 0n) probs.push(`the group asked about has ${toNum(r)} more`);
    // the board's expression must be the asked difference
    const b = tex(q.board).match(/^(\d+)% of (\d+) - (\d+)\/(\d+) of (\d+)$/);
    if (b) { const v = sub(mul(div(dec(b[1]), HUNDRED), dec(b[2])), mul(R(BigInt(b[3]), BigInt(b[4])), dec(b[5]))); if (!eq(v, r)) probs.push(`the board works out ${toNum(v)}, not the asked ${toNum(r)}`); }
  }
  if (/(^|[^\d.])1\\text\{ cents\}/.test(q.board)) probs.push('the board says "1 cents"');
  if (q.family === 'tolerance' && /The exact length of a (bag|jug|water jug|bottle|box of)/.test(p) && /(pounds?|liters?|ounces?)\./.test(p)) probs.push('a weight or volume is called a "length"');
  if (q.family === 'eitherForm' && /how far they ran/.test(p) && /\d+% mile/.test(p)) probs.push('a distance written as "N% mile"');
  if (q.family === 'eitherForm' && /discount/.test(p) && /writes 0\.\d+ off/.test(p)) probs.push('a discount written as "0.25 off"');
  if (q.family === 'reportAs') {
    const m = p.match(/You found a ([\d.]+)% tax on \$([\d.]+) as ([\d.]+) × ([\d.]+) = ([\d.]+) dollars/);
    if (m && !eq(mul(dec(m[3]), dec(m[4])), dec(m[5]))) probs.push(`${m[3]} × ${m[4]} is not ${m[5]}`);
  }
  if (q.family === 'checkResult') {
    const m = p.match(/^A calculator says ([\d.]+)% of \$([\d,.]+) is \$([\d,.]+)\./);
    const truth = roundTo(mul(div(dec(m[1]), HUNDRED), dec(m[2])), 2), claim = dec(m[3]);
    const near = Array.isArray(r) && r.some((x, i) => x && /^Reasonable/.test(q.choices[i]));
    if (near !== eq(truth, claim)) probs.push(`the benchmark says ${near ? 'reasonable' : 'not reasonable'}, but the true value is $${numOut(truth)}`);
  }
  if (q.family === 'keepExact') {
    const m = p.match(/as ([\d.]+) × ([\d,]+) = \$([\d,.]+)/);
    if (m && !eq(mul(dec(m[1]), dec(m[2])), dec(m[3]))) probs.push(`${m[1]} × ${m[2]} is not $${m[3]}`);
  }
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
    if (q.input === 'frac') return [Number(r.n), Number(r.d)];
    return numOut(r);
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
    try { probs.push(...worldProblems(q, r)); } catch (e) { probs.push(`could not check the world (${e.message})`); }
    return probs.join('; ');
  },
};
