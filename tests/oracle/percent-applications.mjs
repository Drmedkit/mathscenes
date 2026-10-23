// Oracle for the lesson "percent-applications" (tax, tips, markups, discounts, commission, interest, percent error,
// successive changes; grade 7). Written from what the student sees only: the prompt and the choices. Every amount is
// exact (Q fractions); money that has to be rounded is rounded to the cent, halves up, where the prompt says so. The
// base of a percent is found from the situation (the cost for a markup, the original price for a discount, the
// pre-tax bill for a tip, the sales for a commission, the principal for simple interest); choices are judged by
// computing what each one claims. See docs/lessons/QUALITY_LAYER.md, "O: the oracle".
import { Q, choiceWhere } from '../../tools/quality/oracle-kit.mjs';

// ---------------------------------------------------------------- reading
const clean = s => String(s ?? '').replace(/[−–]/g, '-').replace(/[’‘]/g, "'");
function dec(s) {
  const t = clean(s).replace(/[$,\s%]/g, '');
  const m = t.match(/^(-?)(\d*)(?:\.(\d+))?$/);
  if (!m || (m[2] === '' && !m[3])) throw new Error(`not a number: ${s}`);
  const n = Number((m[2] || '0') + (m[3] || ''));
  return Q(m[1] ? -n : n, m[3] ? 10 ** m[3].length : 1);
}
const M = '\\$(\\d[\\d,]*(?:\\.\\d+)?)';
const P = '(\\d+(?:\\.\\d+)?)%';
const rx = (s, re) => clean(s).match(new RegExp(re));
const monies = s => [...clean(s).matchAll(new RegExp(M, 'g'))].map(m => dec(m[1]));
const money1 = s => monies(s)[0];
const pct = s => dec(s).div(100);
const cents = x => { const c = x.mul(100); return Q(Math.floor((2 * c.n + c.d) / (2 * c.d)), 100); };
const isCents = x => x.mul(100).d === 1;
const v = x => x.value;
const choiceMoney = (q, x) => choiceWhere(q, c => { const m = monies(c); return m.length >= 1 && m[0].eq(x); });

// ---------------------------------------------------------------- families
const F = {};

/** the base amount of the situation (the 100%) */
function baseOf(p) {
  let m;
  if ((m = rx(p, `pays ${M} for .*? and marks it up ${P}`))) return dec(m[1]);
  if ((m = rx(p, `is ${P} off\\. The sale price is ${M}, and you save ${M}`))) return dec(m[2]).add(dec(m[3]));
  if ((m = rx(p, `You buy an? .*? for ${M} and ${M} of (.+?)\\. In this state, \\3 (?:is|are) not taxed`))) return dec(m[1]);
  if ((m = rx(p, `cost ${M}\\. The site adds an? ${P} service fee on that subtotal`))) return dec(m[1]);
  if ((m = rx(p, `bill is ${M} before tax, and the tax is ${M}\\. You leave an? ${P} tip on the pre-tax bill`))) return dec(m[1]);
  if ((m = rx(p, `commission on sales\\. This week \\w+ sold ${M}`))) return dec(m[1]);
  if ((m = rx(p, `You save ${M} at ${P} simple interest per year`))) return dec(m[1]);   // simple: always the principal
  return null;
}
/** the label of the base in the choices, by situation (a markup is a percent OF the cost, a discount OF the original price …) */
function baseRole(p) {
  if (/marks it up/.test(p)) return /^The store's cost, /;
  if (/% off\. The sale price is/.test(p)) return /^The original price, /;
  if (/not taxed/.test(p)) return /, the taxable /;
  if (/service fee on that subtotal/.test(p)) return /, the ticket subtotal$/;
  if (/tip on the pre-tax bill/.test(p)) return /, the bill before tax$/;
  if (/commission on sales/.test(p)) return /, the sales$/;
  if (/simple interest/.test(p)) return /, the principal$/;
  return null;
}
F.base = q => {
  const p = clean(q.prompt), b = baseOf(p), role = baseRole(p);
  if (!b || !role) return undefined;
  return choiceWhere(q, c => role.test(clean(c)) && !!monies(c)[0]?.eq(b));
};

F.baseCalc = q => {
  const p = clean(q.prompt);
  let m;
  if ((m = rx(p, `buys an? .*? for ${M} and sells it for ${M}\\. What is the percent markup`))) return v(dec(m[2]).sub(dec(m[1])).div(dec(m[1])).mul(100));
  if ((m = rx(p, `was ${M} and is now ${M}\\. What percent off`))) return v(dec(m[1]).sub(dec(m[2])).div(dec(m[1])).mul(100));
  if ((m = rx(p, `You buy an? .*? for ${M} and ${M} of (.+?)\\. [^.]*? (?:is|are) not taxed here; the sales tax is ${P}\\. How much sales tax`))) return v(cents(dec(m[1]).mul(pct(m[4]))));
  if ((m = rx(p, `plus ${P} commission on sales, and sold ${M}\\. How much is the commission`))) return v(dec(m[2]).mul(pct(m[1])));
  if ((m = rx(p, `Your bill is ${M} before tax, plus ${M} tax\\. You tip ${P} of the pre-tax bill`))) return v(dec(m[1]).mul(pct(m[3])));
  if ((m = rx(p, `You save ${M} at ${P} simple interest per year\\. How much interest do you earn in year \\d+`))) return v(dec(m[1]).mul(pct(m[2])));
  return undefined;
};

/** +1 added, −1 taken off, 0 a separate amount; from the kind of change */
function sideOf(p) {
  if (/sales tax|tip\b|marks up|simple interest|interest/.test(p)) return +1;
  if (/% off|marked down|-off coupon|%-off/.test(p)) return -1;
  if (/commission/.test(p)) return 0;
  return null;
}
F.direction = q => {
  const p = clean(q.prompt);
  let m;
  if ((m = p.match(/Is the (\d+(?:\.\d+)?)% amount added to \$[\d,.]+, taken off it, or neither\?/))) {
    const s = sideOf(p);
    if (s === null) return undefined;
    return choiceWhere(q, c => (s > 0 ? /^Added/ : s < 0 ? /^Taken off/ : /^Neither/).test(c));
  }
  const amt = money1(p), r = pct(rx(p, P)[1]);
  if (/How much commission/.test(p)) return v(amt.mul(r));
  const s = sideOf(p);
  if (s === null || s === 0) return undefined;
  return v(amt.mul(r.mul(s).add(1)));
};

F.pctOf = q => {
  const p = clean(q.prompt);
  const r = dec(rx(p, P)[1]);
  if (/% off\. The sale price is what percent/.test(p)) return v(Q(100).sub(r));
  if (/after an? [\d.]+% markup|with an? [\d.]+% tip|with [\d.]+% sales tax/.test(p)) return v(Q(100).add(r));
  return undefined;
};

F.mult = q => {
  const p = clean(q.prompt);
  let m;
  if ((m = rx(p, `write ${P} as a decimal`))) return v(pct(m[1]));
  if ((m = p.match(/multiplied by (\d+(?:\.\d+)?)\. What percent change/))) {
    const k = dec(m[1]), ch = k.sub(1).mul(100);
    const want = ch.n === 0 ? null : `${ch.n > 0 ? 'increase' : 'decrease'}`;
    const size = ch.n < 0 ? ch.neg() : ch;
    return choiceWhere(q, c => { const x = clean(c).match(/^an? (\d+(?:\.\d+)?)% (increase|decrease)$/); return !!x && x[2] === want && dec(x[1]).eq(size); });
  }
  if ((m = rx(p, `Write ${P} sales tax as one multiplier`) ?? rx(p, `Write an? ${P} increase as one multiplier`))) return v(pct(m[1]).add(1));
  if ((m = rx(p, `Write ${P} off as one multiplier`))) return v(Q(1).sub(pct(m[1])));
  return undefined;
};

F.single = q => {
  const p = clean(q.prompt);
  const amt = money1(p), r = pct(rx(p, P)[1]);
  const up = amt.mul(r.add(1)), down = amt.mul(Q(1).sub(r)), part = amt.mul(r);
  if (/What is the total with tax|What is the bill plus the tip|What is the selling price/.test(p)) return v(up);
  if (/What is the sale price/.test(p)) return v(down);
  if (/How much is the tax|How much do you save|How much is the tip|How much commission|How much is the markup/.test(p)) return v(part);
  return undefined;
};

F.commission = q => {
  const m = rx(q.prompt, `earns an? ${M} salary each month, plus ${P} commission on sales\\. This month \\w+ sold ${M}`);
  return m ? v(dec(m[1]).add(dec(m[3]).mul(pct(m[2])))) : undefined;
};

F.round = q => {
  const p = clean(q.prompt);
  let m;
  if ((m = p.match(/You buy (?:three|two|four) items: (.*?)\. Sales tax is (\d+(?:\.\d+)?)%\. The store's policy: (round the tax on each item to the cent, then add|add the prices, then round the tax once at the end)/))) {
    const r = pct(m[2]), items = monies(m[1]);
    if (/^round the tax on each/.test(m[3])) return v(items.reduce((s, x) => s.add(cents(x.mul(r))), Q(0)));
    return v(cents(items.reduce((s, x) => s.add(x), Q(0)).mul(r)));
  }
  if ((m = rx(p, `The sales tax on an? ${M} purchase is ${P}\\. .*rounds the tax to the nearest cent`))) return v(cents(dec(m[1]).mul(pct(m[2]))));
  if ((m = rx(p, `An? ${M} item with ${P} sales tax: .*Round the total to the nearest cent`))) return v(cents(dec(m[1]).mul(pct(m[2]).add(1))));
  return undefined;
};

F.wages = q => {
  const p = clean(q.prompt);
  let m;
  if ((m = rx(p, `works (\\d+(?:\\.\\d+)?) hours at ${M} an hour\\. A flat ${P} income tax is withheld from the gross pay`))) {
    const gross = dec(m[1]).mul(dec(m[2])), tax = cents(gross.mul(pct(m[3])));
    if (/take-home \(net\) pay/.test(p)) return v(gross.sub(tax));
    if (/How much income tax/.test(p)) return v(tax);
  }
  if ((m = rx(p, `${P} on the first ${M}, and ${P} on the amount above ${M}\\. You earn ${M} this week`))) {
    const cut = dec(m[2]), pay = dec(m[5]);
    const low = (pay.cmp(cut) < 0 ? pay : cut).mul(pct(m[1]));
    const high = pay.cmp(cut) > 0 ? pay.sub(cut).mul(pct(m[3])) : Q(0);
    return v(cents(low.add(high)));
  }
  return undefined;
};

F.estimate = q => {
  const p = clean(q.prompt);
  let m;
  if ((m = rx(p, `says (?:an? )?${P} .*? on (?:an? )?${M}(?: bill)? is ${M}\\. Check it`))) {
    const r = pct(m[1]), X = dec(m[2]), C = dec(m[3]);
    return choiceWhere(q, c => {
      const k = clean(c).match(new RegExp(`^No: ${P} of ${M} is only ${M}$`));
      if (k) { const R = pct(k[1]), Y = dec(k[2]); return R.cmp(r) >= 0 && Y.eq(Q(Math.round(X.value))) && dec(k[3]).eq(Y.mul(R)) && C.cmp(dec(k[3])) > 0; }
      return false;   // "the calculator did the work" / "often that big" are not checks
    });
  }
  if ((m = rx(p, `You work out (?:an? )?${P} .*? on (?:an? )?${M}(?: bill)? exactly and get ${M}\\. Your quick estimate was ${P} of ${M} = ${M}\\. Is`))) {
    const r = pct(m[1]), E = dec(m[3]), Y = dec(m[5]);
    return choiceWhere(q, c => {
      const k = clean(c).match(new RegExp(`^Yes: it is between ${P} \\(${M}\\) and ${P} \\(${M}\\) of ${M}$`));
      if (k) {
        const a = pct(k[1]), b = pct(k[3]);
        return a.cmp(r) <= 0 && r.cmp(b) <= 0 && dec(k[2]).eq(Y.mul(a)) && dec(k[4]).eq(Y.mul(b)) && dec(k[5]).eq(Y) && dec(k[2]).cmp(E) <= 0 && E.cmp(dec(k[4])) <= 0;
      }
      return false;   // an estimate is not the exact value, and r below the benchmark makes the answer smaller
    });
  }
  return undefined;
};

/** apply a list of changes "20% off", "another 20% off at the register", "6% sales tax", "up 25%", "a $15 coupon" */
function applyStep(x, step) {
  const s = clean(step).trim();
  let m;
  if ((m = s.match(/(\d+(?:\.\d+)?)% off/))) return x.mul(Q(1).sub(pct(m[1])));
  if ((m = s.match(/(\d+(?:\.\d+)?)% (?:sales )?tax/))) return x.mul(pct(m[1]).add(1));
  if ((m = s.match(/(\d+(?:\.\d+)?)% tip/))) return x.mul(pct(m[1]).add(1));
  if ((m = s.match(/(\d+(?:\.\d+)?)% (?:price )?(?:increase|markup|raise)/))) return x.mul(pct(m[1]).add(1));
  if ((m = s.match(/(\d+(?:\.\d+)?)% (?:price )?(?:cut|decrease|markdown)/))) return x.mul(Q(1).sub(pct(m[1])));
  if ((m = s.match(/up (\d+(?:\.\d+)?)%/))) return x.mul(pct(m[1]).add(1));
  if ((m = s.match(/down (\d+(?:\.\d+)?)%/))) return x.mul(Q(1).sub(pct(m[1])));
  if ((m = s.match(/\$(\d[\d,]*(?:\.\d+)?) (?:coupon|rebate)/))) return x.sub(dec(m[1]));
  return null;
}
F.successive = q => {
  const p = clean(q.prompt);
  const m = p.match(/costs \$([\d,.]+)\. In this order: (.*?)\. Each change/);
  if (!m) return undefined;
  let x = dec(m[1]);
  for (const st of m[2].split(/, then /)) { x = applyStep(x, st); if (!x) return undefined; }
  return v(x);
};

F.reverse = q => {
  const p = clean(q.prompt);
  let m;
  if ((m = rx(p, `total is ${M}, including ${P} sales tax`))) return v(dec(m[1]).div(pct(m[2]).add(1)));
  if ((m = rx(p, `After ${P} off, an? .*? costs ${M}`))) return v(dec(m[2]).div(Q(1).sub(pct(m[1]))));
  if ((m = rx(p, `for ${M} after an? ${P} markup on its cost`))) return v(dec(m[1]).div(pct(m[2]).add(1)));
  return undefined;
};

F.pctError = q => {
  const p = clean(q.prompt);
  let m;
  if (/Why can't you give a percent error here/.test(p)) return choiceWhere(q, c => /reference value is 0.*divide by 0/.test(clean(c)));
  // sentence 1 holds the estimate (guessed, counted, estimated), sentence 2 the true value (actually, measures, should be)
  const sents = p.split(/(?<=\.)\s+(?=[A-Z])/);
  const last = t => { const n = [...String(t).matchAll(/\$?(\d[\d,]*(?:\.\d+)?)/g)].map(x => x[1]); return n.length ? n[n.length - 1] : null; };
  if (sents.length >= 3 && /What is the percent error/.test(p) && last(sents[0]) && last(sents[1]) && /actual|measures|should be|register total|really/.test(sents[1])) {
    const est = dec(last(sents[0])), act = dec(last(sents[1]));
    const e = est.sub(act).div(act).mul(100);
    return v(e.n < 0 ? e.neg() : e);
  }
  return undefined;
};

/** simple-interest years: "after 3 years", "for 3 years", "in 1 year" */
const yrs = p => Number((clean(p).match(/(\d+) years?/) ?? [])[1]);
F.interest = q => {
  const p = clean(q.prompt);
  const P0 = money1(p), r = pct(rx(p, P)[1]), t = yrs(p), I = P0.mul(r).mul(t);
  if (/What is the balance after|How much do you owe in all/.test(p)) return v(P0.add(I));
  if (/How much interest do you (earn|pay)/.test(p)) return v(I);
  return undefined;
};
F.months = q => {
  const p = clean(q.prompt);
  const mo = Number(p.match(/for (\d+) months/)[1]);
  return v(money1(p).mul(pct(rx(p, P)[1])).mul(Q(mo, 12)));
};

/** an expression in x as a function: "x − 0.4x = 0.6x", "x + 6", "0.06x" (every side must agree) */
function exprOK(text, want) {
  return clean(text).split('=').every(side => {
    const s = side.replace(/\s/g, '');
    const at = x => {
      let t = 0;
      for (const m of s.matchAll(/([+-]?)(\d*\.?\d*)(x?)/g)) {
        if (!m[0]) continue;
        const k = m[2] === '' ? 1 : Number(m[2]);
        if (m[2] === '' && !m[3]) continue;
        t += (m[1] === '-' ? -1 : 1) * k * (m[3] ? x : 1);
      }
      return t;
    };
    return [1, 37].every(x => Math.abs(at(x) - want * x) < 1e-9);
  });
}
F.factor = q => {
  const p = clean(q.prompt);
  let m;
  if ((m = p.match(/what does (\d+(?:\.\d+)?) × (\d+(?:\.\d+)?) give\?/))) return v(dec(m[1]).mul(dec(m[2])));
  if ((m = p.match(/What does (\d+(?:\.\d+)?)x stand for\?/))) {
    const k = dec(m[1]), pc = k.mul(100);
    if (k.cmp(1) > 0) return choiceWhere(q, c => new RegExp(`^The total with tax: ${pc.value}% of the price$`).test(clean(c)) && /tax/.test(p));
    return choiceWhere(q, c => new RegExp(`^The sale price: ${pc.value}% of the price$`).test(clean(c)) && /off/.test(p));
  }
  if ((m = rx(p, `Which expression is the price after ${P} off`))) return choiceWhere(q, c => exprOK(c, 1 - pct(m[1]).value));
  if ((m = rx(p, `Which expression is the price with ${P} sales tax`))) return choiceWhere(q, c => exprOK(c, 1 + pct(m[1]).value));
  return undefined;
};

/** "20% off", "up 25%", "10% off" from a list */
const factorOf = s => { const x = applyStep(Q(1), s); return x; };
F.product = q => {
  const p = clean(q.prompt);
  let m;
  if ((m = p.match(/Work out \$(\d[\d,]*(?:\.\d+)?) × (.*)\.$/))) return v(m[2].split('×').reduce((s, x) => s.mul(dec(x.trim())), dec(m[1])));
  if ((m = p.match(/^(.*?), each on the new amount\. What ONE multiplier/))) {
    let k = Q(1);
    for (const st of m[1].split(/, then /)) { const f = factorOf(st); if (!f) return undefined; k = k.mul(f); }
    return v(k);
  }
  return undefined;
};

F.net = q => {
  const p = clean(q.prompt);
  const m = p.match(/goes (up|down) (\d+(?:\.\d+)?)%, then (up|down) (\d+(?:\.\d+)?)%/);
  if (!m) return undefined;
  const k = applyStep(applyStep(Q(1), `${m[1]} ${m[2]}%`), `${m[3]} ${m[4]}%`).sub(1).mul(100);
  if (k.n === 0) return choiceWhere(q, c => /^no change$/.test(c.trim()));
  const size = k.n < 0 ? k.neg() : k;
  return choiceWhere(q, c => { const x = clean(c).match(/^an? (increase|decrease) of (\d+(?:\.\d+)?)%$/); return !!x && (x[1] === 'increase') === (k.n > 0) && dec(x[2]).eq(size); });
};

F.undo = q => {
  const p = clean(q.prompt);
  const m = p.match(/goes (up|down) (\d+(?:\.\d+)?)%\. What percent (increase|decrease) brings it back/);
  if (!m) return undefined;
  const r = pct(m[2]);
  const back = m[1] === 'down' ? r.div(Q(1).sub(r)) : r.div(r.add(1));
  return v(back.mul(100));
};

F.order = q => {
  const p = clean(q.prompt);
  const m = p.match(/^An? \$(\d[\d,]*) item\. Store A applies (.+?) first, then (.+?)\. Store B does the same two things in the other order/);
  if (!m) return undefined;
  const x = dec(m[1]);
  const A = applyStep(applyStep(x, m[2]), m[3]), B = applyStep(applyStep(x, m[3]), m[2]);
  if (!A || !B) return undefined;
  const k = A.cmp(B);
  if (k === 0) return choiceWhere(q, c => /^Yes: the same total/.test(c));
  const cheapFirst = k < 0 ? m[2] : m[3];
  return choiceWhere(q, c => clean(c) === `No: ${cheapFirst} first is cheaper`);
};

F.shared = q => {
  const p = clean(q.prompt);
  let m;
  if ((m = rx(p, `order is ${M}\\. There is an? ${P} service fee and an? ${P} delivery fee, each on the \\$[\\d,.]+ subtotal`))) return v(dec(m[1]).mul(pct(m[2]).add(pct(m[3])).add(1)));
  if ((m = rx(p, `order is ${M}\\. An? ${P} service fee is added\\. Then an? ${P} delivery fee is charged on the subtotal plus the service fee`))) return v(dec(m[1]).mul(pct(m[2]).add(1)).mul(pct(m[3]).add(1)));
  if ((m = rx(p, `^${M} earns ${P} interest each year on the balance at the start of that year.*balance after (\\d+) years`))) {
    let x = dec(m[1]);
    for (let i = 0; i < Number(m[3]); i++) x = cents(x.mul(pct(m[2]).add(1)));
    return v(x);
  }
  return undefined;
};

F.offers = q => {
  const p = clean(q.prompt);
  let m;
  if ((m = rx(p, `An? ${M} \\w+ has an? ${M} mail-in rebate\\. Sales tax is ${P}, charged on the price at the register`))) {
    const pay = cents(dec(m[1]).mul(pct(m[3]).add(1)));
    if (/How much do you pay at checkout/.test(p)) return v(pay);
    if (/net cost after the rebate/.test(p)) return v(pay.sub(dec(m[2])));
  }
  if ((m = rx(p, `On an? ${M} \\w+: Offer A is ${P} off\\. Offer B is ${P} off, then ${P} off the sale price`))) {
    const x = dec(m[1]), A = x.mul(Q(1).sub(pct(m[2]))), B = x.mul(Q(1).sub(pct(m[3]))).mul(Q(1).sub(pct(m[4])));
    const k = A.cmp(B);
    return choiceWhere(q, c => {
      const t = clean(c);
      if (/^The same/.test(t)) return k === 0;
      if (/^Offer A: \$/.test(t)) return k < 0 && money1(t).eq(A);
      if (/^Offer B: \$/.test(t)) return k > 0 && money1(t).eq(B);
      if (/^Offer B:/.test(t)) return k > 0 && !/\$/.test(t) && false;   // "two discounts beat one" is not a reason
      return false;
    });
  }
  if ((m = rx(p, `Store A lists them at ${M} with ${P} off\\. Store B lists them at ${M} with ${P} off`))) {
    const A = dec(m[1]).mul(Q(1).sub(pct(m[2]))), B = dec(m[3]).mul(Q(1).sub(pct(m[4])));
    const k = A.cmp(B);
    return choiceWhere(q, c => {
      const t = clean(c);
      if (/^The same/.test(t)) return k === 0;
      let x;
      if ((x = t.match(new RegExp(`^Store (A|B): ${M} is less than ${M}$`)))) {
        const mine = x[1] === 'A' ? A : B, other = x[1] === 'A' ? B : A;
        return mine.cmp(other) < 0 && dec(x[2]).eq(mine) && dec(x[3]).eq(other);
      }
      return false;   // "the bigger discount" compares percents, not prices
    });
  }
  return undefined;
};

export function solve(q) {
  const f = F[q.family];
  return f ? f(q) : undefined;
}

// ---------------------------------------------------------------- the world
/** plausible US shelf prices (dollars) for the items the lesson uses */
const PRICE = [
  [/bike helmet/, 15, 300], [/desk lamp|\blamp\b/, 10, 300], [/hoodie/, 15, 150], [/guitar(?! strings)/, 60, 3000], [/phone case/, 5, 80],
  [/backpack/, 10, 250], [/tablet/, 60, 1500], [/jacket/, 20, 500], [/skateboard/, 20, 350], [/speaker/, 10, 1000],
  [/video game|\bgame\b/, 5, 90], [/pair of sneakers|sneakers/, 20, 300], [/tent/, 25, 900], [/water bottle/, 3, 60],
  [/soccer ball/, 8, 80], [/desk chair/, 30, 800], [/headphones/, 10, 600], [/\bbike\b/, 60, 3000], [/\bphone\b(?! case)/, 50, 1500],
];
export function sane(q) {
  const out = [], p = clean(q.prompt);
  let s; try { s = solve(q); } catch { s = undefined; }
  if (q.input === 'choice' && s === -1) out.push('no single right choice');
  if (q.family === 'base' && typeof s === 'number' && s >= 0) {
    const b = monies(q.choices[s])[0];
    if (b && q.choices.some((c, i) => i !== s && monies(c)[0]?.eq(b))) out.push(`two choices name the same amount, $${b.value}: "which amount" has two right answers by value`);
  }
  // a sales tax above 12% does not exist in the US
  for (const m of p.matchAll(/(\d+(?:\.\d+)?)% sales tax|sales tax is (\d+(?:\.\d+)?)%|sales tax on .*? is (\d+(?:\.\d+)?)%/g)) {
    const r = Number(m[1] ?? m[2] ?? m[3]);
    if (r > 12) out.push(`a ${r}% sales tax`);
  }
  // one item with one price: is the price plausible?
  const one = p.match(/^(?:A|An) \$(\d[\d,]*(?:\.\d+)?) ([a-z ]+?) (?:is|has|sits)/) ?? p.match(/(?:pays|costs?|on an?|for an?) \$(\d[\d,]*(?:\.\d+)?)(?: for)? (?:an? )?([a-z ]+?)(?:[.,]| and)/);
  const named = p.match(/^(?:A|An) ([a-z ]+?) (?:is \d+% off\. The sale price is \$([\d,]+(?:\.\d+)?), and you save \$([\d,]+(?:\.\d+)?)|costs \$([\d,]+(?:\.\d+)?))/);
  let item = null, price = null;
  if (named) { item = named[1]; price = named[4] ? dec(named[4]).value : dec(named[2]).add(dec(named[3])).value; }
  else if (one) { item = one[2]; price = dec(one[1]).value; }
  if (item) {
    const hit = PRICE.find(([re]) => re.test(item));
    if (hit && (price < hit[1] || price > hit[2])) out.push(`a ${item} for $${price}`);
  }
  if (q.input === 'num' && typeof s === 'number' && q.unit !== '%' && /\$/.test(p) && !isCents(Q(s)) && !/round/i.test(p)) out.push(`the exact answer ${s} is not whole cents and no rounding is asked`);
  if (q.input === 'num' && typeof s === 'number' && q.unit === '%' && Q(s).mul(100).d !== 1) out.push(`the percent ${s} does not end and no rounding is asked`);
  if (/simple interest/.test(p) && /save|savings/.test(p)) {
    const r = Number((p.match(/(\d+(?:\.\d+)?)% simple interest/) ?? [])[1]);
    if (r > 12) out.push(`a ${r}% savings rate`);
  }
  return [...new Set(out)].join('; ');
}

export default { solve, sane };
