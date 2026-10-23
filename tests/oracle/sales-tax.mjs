// Oracle for the lesson "sales-tax" (calculate sales tax, totals and pre-tax prices, grade 7). Written from what the
// student sees only: the prompt, the board and the choices. Money is worked in exact fractions (Q) and whole cents;
// a rounded tax is rounded once to the cent, halves up, as every rounded prompt says. Choice questions are judged by
// computing what each choice claims (the plan's value, the bracket's amounts, the prices that really give the
// receipt). See docs/lessons/QUALITY_LAYER.md, "O: the oracle".
import { Q, choiceWhere } from '../../tools/quality/oracle-kit.mjs';

// ---------------------------------------------------------------- reading
const clean = s => String(s ?? '').replace(/[−–]/g, '-');
/** "$1,175.00" / "8.875" → exact Q */
function dec(s) {
  const t = clean(s).replace(/[$,\s%]/g, '');
  const m = t.match(/^(-?)(\d*)(?:\.(\d+))?$/);
  if (!m || (m[2] === '' && !m[3])) throw new Error(`not a number: ${s}`);
  const d = m[3] ? 10 ** m[3].length : 1;
  const n = Number((m[2] || '0') + (m[3] || ''));
  return Q(m[1] ? -n : n, d);
}
const MONEY = /\$\s?(\d[\d,]*(?:\.\d+)?)/g;
const monies = s => [...clean(s).matchAll(MONEY)].map(m => dec(m[1]));
const firstMoney = s => monies(s)[0];
const PCT = /(\d+(?:\.\d+)?)%/;
const pctOf = s => { const m = String(s).match(PCT); return m ? dec(m[1]).div(100) : null; };
const cents = q => q.mul(100);
/** exact Q → whole cents, halves up */
function roundCents(x) {
  const c = x.mul(100);                       // c = n/d
  return Math.floor((2 * c.n + c.d) / (2 * c.d));
}
const isCents = x => x.mul(100).d === 1;
const toNum = x => x.value;
const fromCents = c => Q(c, 100);
/** the receipt total of a price (Q) at rate r (Q), tax rounded to the cent */
const totalRounded = (p, r) => fromCents(Math.round(p.mul(100).value) + roundCents(p.mul(r)));

/** a tiny exact evaluator: numbers, $, + − × ÷ and parentheses */
function evalExpr(text) {
  const s = clean(text).replace(/\$/g, '').replace(/,(?=\d{3})/g, '').replace(/×/g, '*').replace(/÷/g, '/');
  const toks = s.match(/\d+\.?\d*|\.\d+|[-+*/()]/g) ?? [];
  let p = 0;
  const expr = () => { let v = term(); while (toks[p] === '+' || toks[p] === '-') { const o = toks[p++]; const w = term(); v = o === '+' ? v.add(w) : v.sub(w); } return v; };
  const term = () => { let v = fac(); while (toks[p] === '*' || toks[p] === '/') { const o = toks[p++]; const w = fac(); v = o === '*' ? v.mul(w) : v.div(w); } return v; };
  const fac = () => { const t = toks[p++]; if (t === '-') return fac().neg(); if (t === '(') { const v = expr(); p++; return v; } return dec(t); };
  const v = expr();
  if (p !== toks.length) throw new Error(`bad expression ${text}`);
  return v;
}

// ---------------------------------------------------------------- families
const F = {};

F.roles = q => {
  const vals = q.choices.map(c => firstMoney(c));
  const sorted = vals.map((v, i) => [v, i]).sort((a, b) => a[0].cmp(b[0]));
  const [lo, mid, hi] = sorted;
  if (!lo[0].add(mid[0]).eq(hi[0])) return undefined;
  // price + tax = total; a tax below 100% is smaller than the price
  const role = /pre-tax price/.test(q.board) ? mid : /sales tax/.test(q.board) ? lo : /total/.test(q.board) ? hi : null;
  return role ? role[1] : undefined;
};

F.missingAmt = q => {
  const sides = clean(q.board).split('=');
  const left = sides[0].split('+').map(x => x.trim()), right = sides[1].trim();
  const val = x => (/\?/.test(x) ? null : firstMoney(x));
  const a = val(left[0]), b = val(left[1]), c = val(right);
  if (c === null) return a.add(b).value;
  if (a === null) return c.sub(b).value;
  return c.sub(a).value;
};

F.rateOrAmount = q => {
  const p = q.prompt;
  const price = dec(p.match(/shelf price \$(\d[\d,]*(?:\.\d+)?)/)[1]);
  const m = p.match(/"Tax \((\d+(?:\.\d+)?)%\) \$(\d[\d,]*(?:\.\d+)?)"/);
  const rate = dec(m[1]), tax = dec(m[2]);
  if (/What do you pay in total/.test(p)) return choiceWhere(q, c => /^\$/.test(c) && firstMoney(c).eq(price.add(tax)));
  if (/What is the tax rate/.test(p)) return choiceWhere(q, c => /%$/.test(c) && dec(c).eq(rate));
  if (/dollars of tax/.test(p)) return choiceWhere(q, c => /^\$/.test(c) && firstMoney(c).eq(tax));
  return undefined;
};

F.perHundred = q => {
  const m = q.prompt.match(/costs \$(\d[\d,]*(?:\.\d+)?) before tax/);
  return dec(m[1]).mul(pctOf(q.prompt)).value;
};

F.whichWhole = q => {
  const price = dec(q.prompt.match(/costs \$(\d[\d,]*(?:\.\d+)?) before/)[1]);
  const at = dec(q.prompt.match(/sits at (\d+(?:\.\d+)?)%/)[1]).div(100);
  return choiceWhere(q, c => firstMoney(c).eq(price.mul(at)));
};

F.totalPct = q => {
  const r = dec(q.prompt.match(/An? (\d+(?:\.\d+)?)% tax is added/)[1]);
  return r.add(100).value;
};

F.dollarAt = q => {
  const m = q.prompt.match(/100% with \$(\d[\d,]*(?:\.\d+)?)/), at = q.prompt.match(/lines up with (\d+(?:\.\d+)?)%\?/);
  return dec(m[1]).mul(dec(at[1])).div(100).value;
};

F.taxAmt = q => {
  const price = dec(q.prompt.match(/costs \$(\d[\d,]*(?:\.\d+)?) before tax/)[1]);
  const r = dec(q.prompt.match(/sales tax is (\d+(?:\.\d+)?)%/)[1]).div(100);
  return price.mul(r).value;
};

F.totalPay = q => {
  const price = dec(q.prompt.match(/marked \$(\d[\d,]*(?:\.\d+)?)/)[1]);
  const r = dec(q.prompt.match(/sales tax is (\d+(?:\.\d+)?)%/)[1]).div(100);
  return totalRounded(price, r).value;
};

F.planTotal = q => {
  const price = dec(q.prompt.match(/marked \$(\d[\d,]*(?:\.\d+)?)/)[1]);
  const r = dec(q.prompt.match(/with an? (\d+(?:\.\d+)?)% sales tax/)[1]).div(100);
  const want = price.mul(r.add(1));
  const valueOf = c => {
    let m;
    if ((m = c.match(/^Find (\d+(?:\.\d+)?)% of \$(\d[\d,]*(?:\.\d+)?): that is what you pay/))) return dec(m[2]).mul(dec(m[1])).div(100);
    if ((m = c.match(/^Find (\d+(?:\.\d+)?)% of \$(\d[\d,]*(?:\.\d+)?), then add it to \$(\d[\d,]*(?:\.\d+)?)/))) return dec(m[3]).add(dec(m[2]).mul(dec(m[1])).div(100));
    if ((m = c.match(/^Find (\d+(?:\.\d+)?)% of \$(\d[\d,]*(?:\.\d+)?), then subtract it from \$(\d[\d,]*(?:\.\d+)?)/))) return dec(m[3]).sub(dec(m[2]).mul(dec(m[1])).div(100));
    if ((m = c.match(/^Add \$(\d[\d,]*(?:\.\d+)?) to \$(\d[\d,]*(?:\.\d+)?)/))) return dec(m[1]).add(dec(m[2]));
    return null;
  };
  return choiceWhere(q, c => { const v = valueOf(c); return v !== null && v.eq(want); });
};

const UNITS = ['ones', 'tenths', 'hundredths', 'thousandths', 'ten-thousandths', 'hundred-thousandths', 'millionths'];
F.readDecimal = q => {
  const m = q.prompt.match(/Read (0\.(\d+)) as a number of decimal units: \S+ = (\d+) /);
  if (!m) return undefined;
  if (Number(m[2]) !== Number(m[3])) return undefined;   // the count must be the digits after the point
  const unit = UNITS[m[2].length];
  return choiceWhere(q, c => c.trim() === unit);
};

F.compareDec = q => {
  const m = q.prompt.match(/greater: ([\d.]+) or ([\d.]+)\?/);
  const a = dec(m[1]), b = dec(m[2]);
  const k = a.cmp(b);
  if (k === 0) return choiceWhere(q, c => /equal/.test(c));
  const big = k > 0 ? m[1] : m[2];
  return choiceWhere(q, c => !/equal/.test(c) && dec(c).eq(dec(big)));
};

const PLACES = { tenths: 1, hundredths: 2, thousandths: 3, 'ten-thousandths': 4, 'hundred-thousandths': 5, millionths: 6 };
F.placeDigit = q => {
  const m = q.prompt.match(/shows (\d+)\.(\d+)\. Which digit is in the ([a-z-]+) place/);
  const d = m[2][PLACES[m[3]] - 1];
  return choiceWhere(q, c => c.trim() === d);
};

F.pctToDec = q => dec(q.prompt.match(/rate (\d+(?:\.\d+)?)%/)[1]).div(100).value;

F.decBetween = q => {
  const x = dec(q.prompt.match(/^(\d+(?:\.\d+)?)% lies/)[1]).div(100);
  return choiceWhere(q, c => { const [a, b] = c.split(' and ').map(dec); return a.cmp(x) < 0 && x.cmp(b) < 0; });
};

F.decTax = q => {
  const price = dec(q.prompt.match(/costs \$(\d[\d,]*(?:\.\d+)?) before tax/)[1]);
  const r = dec(q.prompt.match(/sales tax is (\d+(?:\.\d+)?)%/)[1]).div(100);
  return price.mul(r).value;
};

F.placePoint = q => {
  const m = q.prompt.match(/find (\d+(?:\.\d+)?)% tax on \$(\d[\d,]*(?:\.\d+)?)/);
  const want = dec(m[2]).mul(dec(m[1])).div(100);
  return choiceWhere(q, c => firstMoney(c).eq(want));
};

F.roundTax = q => {
  const price = dec(q.prompt.match(/costs \$(\d[\d,]*(?:\.\d+)?)\./)[1]);
  const r = dec(q.prompt.match(/sales tax is (\d+(?:\.\d+)?)%/)[1]).div(100);
  return fromCents(roundCents(price.mul(r))).value;
};

F.roundTotal = q => {
  const price = dec(q.prompt.match(/costs \$(\d[\d,]*(?:\.\d+)?), with/)[1]);
  const r = dec(q.prompt.match(/with (\d+(?:\.\d+)?)% sales tax/)[1]).div(100);
  return totalRounded(price, r).value;
};

/** a bracket "$A (a%) and $B (b%)" is right when A = a% and B = b% of the price and a ≤ r ≤ b */
function bracketOK(text, price, r) {
  const m = text.match(/\$(\d[\d,]*(?:\.\d+)?) \((\d+(?:\.\d+)?)%\) and \$(\d[\d,]*(?:\.\d+)?) \((\d+(?:\.\d+)?)%\)/);
  if (!m) return null;
  const a = dec(m[2]).div(100), b = dec(m[4]).div(100);
  const ok = dec(m[1]).eq(price.mul(a)) && dec(m[3]).eq(price.mul(b)) && a.cmp(r) <= 0 && r.cmp(b) <= 0;
  return ok ? { lo: dec(m[1]), hi: dec(m[3]) } : null;
}
F.benchCheck = q => {
  const m = q.prompt.match(/the (\d+(?:\.\d+)?)% tax on \$(\d[\d,]*(?:\.\d+)?) is \$(\d[\d,]*(?:\.\d+)?)\./);
  const r = dec(m[1]).div(100), price = dec(m[2]), claim = dec(m[3]);
  // the right check is the benchmark bracket; its yes / no must match whether the claim lies inside it
  return choiceWhere(q, c => {
    const br = bracketOK(c, price, r);
    if (!br) return false;
    const inside = br.lo.cmp(claim) <= 0 && claim.cmp(br.hi) <= 0;
    return /^Yes/.test(c) ? inside : /^No/.test(c) ? !inside : false;
  });
};

F.boundsPick = q => {
  const m = q.prompt.match(/an? (\d+(?:\.\d+)?)% tax on \$(\d[\d,]*(?:\.\d+)?), bracket it/);
  const r = dec(m[1]).div(100), price = dec(m[2]), tax = price.mul(r);
  // every choice whose two amounts really hold the tax; the tightest one is the useful bracket
  const ok = q.choices.map((c, i) => {
    const v = monies(c);
    if (v.length !== 2 || !(v[0].cmp(tax) <= 0 && tax.cmp(v[1]) <= 0)) return null;
    if (/%/.test(c) && !bracketOK(c, price, r)) return null;
    return { i, w: v[1].sub(v[0]) };
  }).filter(Boolean).sort((a, b) => a.w.cmp(b.w));
  if (!ok.length || (ok.length > 1 && ok[0].w.eq(ok[1].w))) return -1;
  return ok[0].i;
};

/** a cart "Milk $2.49 (food: no tax), Cap $21.89" → { all, taxable } */
function cart(p) {
  const list = p.match(/A cart: (.*?)\. The sales tax/)[1];
  let all = Q(0), taxable = Q(0);
  for (const part of list.split(/,\s+(?=[A-Z])/)) {
    const v = firstMoney(part);
    all = all.add(v);
    if (!/no tax/.test(part)) taxable = taxable.add(v);
  }
  return { all, taxable };
}
F.exemptCart = q => {
  const { all, taxable } = cart(q.prompt);
  const r = dec(q.prompt.match(/sales tax is (\d+(?:\.\d+)?)%/)[1]).div(100);
  const tax = fromCents(roundCents(taxable.mul(r)));
  if (/What is the total/.test(q.prompt)) return all.add(tax).value;
  if (/How much is the tax/.test(q.prompt)) return tax.value;
  return undefined;
};
F.taxableBase = q => {
  const { taxable } = cart(q.prompt);
  return choiceWhere(q, c => !/^None/.test(c) && /taxable/.test(c) && firstMoney(c).eq(taxable));
};

F.findRate = q => {
  const p = q.prompt;
  let m;
  if ((m = p.match(/price \$(\d[\d,]*(?:\.\d+)?), total \$(\d[\d,]*(?:\.\d+)?)\./))) return dec(m[2]).sub(dec(m[1])).div(dec(m[1])).mul(100).value;
  if ((m = p.match(/price \$(\d[\d,]*(?:\.\d+)?), tax \$(\d[\d,]*(?:\.\d+)?)\./))) return dec(m[2]).div(dec(m[1])).mul(100).value;
  return undefined;
};

F.priceFromTax = q => {
  const m = q.prompt.match(/shows \$(\d[\d,]*(?:\.\d+)?) of tax at (\d+(?:\.\d+)?)%/);
  return dec(m[1]).div(dec(m[2]).div(100)).value;
};

F.multiplier = q => dec(q.prompt.match(/With an? (\d+(?:\.\d+)?)% tax/)[1]).div(100).add(1).value;

F.multExpr = q => {
  const m = q.prompt.match(/The pre-tax price is ([A-Za-z]) dollars and the sales tax is (\d+(?:\.\d+)?)%/);
  const v = m[1], r = dec(m[2]).div(100);
  // the choice as a function of the price, at two prices
  const f = (c, x) => {
    const t = c.replace(/\s/g, '');
    let k;
    if ((k = t.match(new RegExp(`^(\\d*\\.?\\d*)${v}$`)))) return (k[1] ? dec(k[1]) : Q(1)).mul(x);
    if ((k = t.match(new RegExp(`^${v}\\+(\\d+\\.?\\d*)$`)))) return x.add(dec(k[1]));
    return null;
  };
  return choiceWhere(q, c => [Q(1), Q(37)].every(x => { const y = f(c, x); return y !== null && y.eq(x.mul(r.add(1))); }));
};

F.oneStepTotal = q => {
  const m = q.prompt.match(/costs \$(\d[\d,]*(?:\.\d+)?) before an? (\d+(?:\.\d+)?)% tax/);
  return totalRounded(dec(m[1]), dec(m[2]).div(100)).value;
};

F.priceFromTotal = q => {
  const p = q.prompt;
  let m = p.match(/shows the total, \$(\d[\d,]*(?:\.\d+)?), with (\d+(?:\.\d+)?)% tax/) ?? p.match(/You paid \$(\d[\d,]*(?:\.\d+)?) for .*?, including (\d+(?:\.\d+)?)% sales tax/);
  if (!m) return undefined;
  return dec(m[1]).div(dec(m[2]).div(100).add(1)).value;
};

F.whichDivision = q => {
  const m = q.prompt.match(/A total of \$(\d[\d,]*(?:\.\d+)?) includes an? (\d+(?:\.\d+)?)% sales tax/);
  const want = dec(m[1]).div(dec(m[2]).div(100).add(1));
  return choiceWhere(q, c => { try { return evalExpr(c).eq(want); } catch { return false; } });
};

F.subtractFails = q => {
  const m = q.prompt.match(/The total was \$(\d[\d,]*(?:\.\d+)?) with (\d+(?:\.\d+)?)% tax\. (\w+) takes/);
  const T = dec(m[1]), r = dec(m[2]).div(100), price = T.div(r.add(1)), tax = T.sub(price);
  const judge = c => {
    let k;
    if ((k = c.match(/should take \$(\d[\d,]*(?:\.\d+)?) off instead/))) return T.sub(dec(k[1])).eq(price);
    if (/^Nothing: /.test(c)) return T.sub(T.mul(r)).eq(price);
    if ((k = c.match(/^Divide \$(\d[\d,]*(?:\.\d+)?) by ([\d.]+) instead/))) return dec(k[1]).div(dec(k[2])).eq(price);
    if ((k = c.match(/^(\d+(?:\.\d+)?)% of \$(\d[\d,]*(?:\.\d+)?) is more than the tax: the total is a bigger whole/))) return dec(k[2]).mul(dec(k[1])).div(100).cmp(tax) > 0 && T.cmp(price) > 0;
    return false;
  };
  return choiceWhere(q, judge);
};

F.testNumber = q => {
  const m = q.prompt.match(/Now take (\d+(?:\.\d+)?)% of \$(\d[\d,]*(?:\.\d+)?) off/);
  const x = dec(m[2]);
  return x.sub(x.mul(dec(m[1])).div(100)).value;
};

/** every cent price within ±$5 of x whose receipt rounds to the target */
function pricesWhere(x, ok) {
  const c0 = Math.round(cents(x).value), out = [];
  for (let c = Math.max(1, c0 - 500); c <= c0 + 500; c++) if (ok(fromCents(c))) out.push(c);
  return out;
}
const fmt = c => `$${(c / 100).toFixed(2)}`;
F.roundedTotal = q => {
  const m = q.prompt.match(/A receipt total is \$(\d[\d,]*(?:\.\d+)?) with (\d+(?:\.\d+)?)% tax/);
  const T = dec(m[1]), r = dec(m[2]).div(100);
  const set = pricesWhere(T.div(r.add(1)), p => totalRounded(p, r).eq(T));
  return choiceWhere(q, c => {
    let k;
    if ((k = c.match(/^Only \$(\d[\d,]*(?:\.\d+)?): \$(\d[\d,]*(?:\.\d+)?) gives \$(\d[\d,]*(?:\.\d+)?), \$(\d[\d,]*(?:\.\d+)?) gives \$(\d[\d,]*(?:\.\d+)?)$/))) {
      const only = Math.round(cents(dec(k[1])).value);
      const claims = [[k[2], k[3]], [k[4], k[5]]].every(([a, b]) => totalRounded(dec(a), r).eq(dec(b)));
      return set.length === 1 && set[0] === only && claims;
    }
    if ((k = c.match(/^\$(\d[\d,]*(?:\.\d+)?) and \$(\d[\d,]*(?:\.\d+)?)(.*)$/))) {
      const two = [k[1], k[2]].map(x => Math.round(cents(dec(x)).value)).sort((a, b) => a - b);
      return set.length === 2 && set[0] === two[0] && set[1] === two[1];
    }
    return false;   // "exactly the quotient" (a price is whole cents) and "no need to check" (not a full answer)
  });
};

F.roundedTaxRange = q => {
  const m = q.prompt.match(/shows \$(\d[\d,]*(?:\.\d+)?) of tax at (\d+(?:\.\d+)?)%/);
  const tax = dec(m[1]), r = dec(m[2]).div(100);
  const set = pricesWhere(tax.div(r), p => fromCents(roundCents(p.mul(r))).eq(tax));
  const lo = set[0], hi = set[set.length - 1];
  const contiguous = set.length === hi - lo + 1;
  return choiceWhere(q, c => {
    let k;
    if ((k = c.match(/^\$(\d[\d,]*(?:\.\d+)?) to \$(\d[\d,]*(?:\.\d+)?)(?:: \$(\d[\d,]*(?:\.\d+)?) and \$(\d[\d,]*(?:\.\d+)?) fail)?$/))) {
      const a = Math.round(cents(dec(k[1])).value), b = Math.round(cents(dec(k[2])).value);
      if (!(contiguous && a === lo && b === hi)) return false;
      if (k[3]) return [k[3], k[4]].every(x => !set.includes(Math.round(cents(dec(x)).value)));
      return true;
    }
    if ((k = c.match(/^Only \$(\d[\d,]*(?:\.\d+)?)$/))) return set.length === 1 && set[0] === Math.round(cents(dec(k[1])).value);
    if ((k = c.match(/^\$(\d[\d,]*(?:\.\d+)?) and \$(\d[\d,]*(?:\.\d+)?), both checked$/))) return set.length === 2 && set.includes(Math.round(cents(dec(k[1])).value)) && set.includes(Math.round(cents(dec(k[2])).value));
    return false;
  });
};

F.roundedRate = q => {
  const m = q.prompt.match(/price \$(\d[\d,]*(?:\.\d+)?), tax \$(\d[\d,]*(?:\.\d+)?) \(rounded/);
  const price = dec(m[1]), tax = dec(m[2]);
  const listed = (q.prompt.match(/one of ([^?]*)\. Which one/)?.[1] ?? '').match(/\d+(?:\.\d+)?(?=%)/g) ?? [];
  const fits = listed.filter(x => fromCents(roundCents(price.mul(dec(x).div(100)))).eq(tax));
  if (fits.length !== 1) return -1;
  return choiceWhere(q, c => /^\d/.test(c) && dec(c).eq(dec(fits[0])));
};

F.budgetMax = q => {
  const m = q.prompt.match(/You have \$(\d[\d,]*(?:\.\d+)?) to spend, and the sales tax is (\d+(?:\.\d+)?)%/);
  const B = dec(m[1]), r = dec(m[2]).div(100);
  let best = null;
  for (const c of pricesWhere(B.div(r.add(1)), p => totalRounded(p, r).cmp(B) <= 0)) best = c;
  return fromCents(best).value;
};

/** the two stores: [{ name, total }] */
function stores(p) {
  let m = p.match(/: (.+?) sells it for \$(\d[\d,]*(?:\.\d+)?) with (\d+(?:\.\d+)?)% sales tax\. (.+?) sells it for \$(\d[\d,]*(?:\.\d+)?) with (\d+(?:\.\d+)?)% tax/);
  if (!m) m = p.match(/: (.+?) charges \$(\d[\d,]*(?:\.\d+)?) plus (\d+(?:\.\d+)?)% tax; (.+?) charges \$(\d[\d,]*(?:\.\d+)?) plus (\d+(?:\.\d+)?)% tax/);
  if (!m) return null;
  return [[m[1], m[2], m[3]], [m[4], m[5], m[6]]].map(([name, pr, r]) => ({ name, total: totalRounded(dec(pr), dec(r).div(100)) }));
}
F.compareStores = q => {
  const S = stores(q.prompt);
  const k = S[0].total.cmp(S[1].total);
  if (k === 0) return choiceWhere(q, c => /same/.test(c));
  return choiceWhere(q, c => c.trim() === (k < 0 ? S[0].name : S[1].name));
};
F.saveGap = q => {
  const S = stores(q.prompt);
  const d = S[0].total.sub(S[1].total);
  return (d.n < 0 ? d.neg() : d).value;
};

export function solve(q) {
  const f = F[q.family];
  return f ? f(q) : undefined;
}

// ---------------------------------------------------------------- the world
export function sane(q) {
  const out = [], p = q.prompt;
  for (const x of monies(p)) {
    if (x.n <= 0 && !/\$0 /.test(p) && !/0% lines up with \$0/.test(p)) out.push('a price of $0');
    if (x.value > 5000) out.push(`an amount of $${x.value}`);
  }
  const rates = [...p.matchAll(/(\d+(?:\.\d+)?)% (?:sales )?tax/g)].map(m => Number(m[1]));
  if (rates.some(r => r > 15)) out.push('a sales tax rate above 15%');
  let m;
  switch (q.family) {
    case 'roles': {
      const vals = q.choices.map(c => firstMoney(c)).sort((a, b) => a.cmp(b));
      if (!vals[0].add(vals[1]).eq(vals[2])) out.push('the three amounts do not make price + tax = total');
      break;
    }
    case 'decTax': case 'taxAmt': case 'perHundred': {
      const v = solve(q);
      if (!isCents(Q(v))) out.push(`the exact tax $${v} is not whole cents and no rounding is asked`);
      break;
    }
    case 'priceFromTax': case 'priceFromTotal': {
      const v = solve(q);
      if (!isCents(Q(v))) out.push(`the pre-tax price ${v} is not whole cents ("the tax was exact")`);
      break;
    }
    case 'findRate': {
      const v = solve(q);
      if (Q(v).mul(1000).d !== 1) out.push(`the rate ${v}% is not a clean rate ("the tax was exact")`);
      break;
    }
    case 'oneStepTotal': case 'totalPay': {
      m = p.match(/(?:costs|marked) \$(\d[\d,]*(?:\.\d+)?).*?(\d+(?:\.\d+)?)% (?:sales )?tax/);
      if (m && !isCents(dec(m[1]).mul(dec(m[2]).div(100))) && !/rounds/.test(p)) out.push('the exact total is not whole cents and no rounding rule is given');
      break;
    }
    case 'planTotal': case 'whichDivision': case 'subtractFails': case 'benchCheck': case 'boundsPick':
    case 'roundedTotal': case 'roundedTaxRange': case 'roundedRate': case 'multExpr': case 'whichWhole':
    case 'compareStores': case 'taxableBase': case 'rateOrAmount': case 'roles': case 'placePoint': case 'decBetween': {
      let s; try { s = solve(q); } catch { s = undefined; }
      if (s === -1) out.push('no single right choice');
      break;
    }
    default: break;
  }
  if (q.family === 'benchCheck' && (m = p.match(/the (\d+(?:\.\d+)?)% tax on \$(\d[\d,]*(?:\.\d+)?) is \$(\d[\d,]*(?:\.\d+)?)\./))) {
    const tax = dec(m[2]).mul(dec(m[1])).div(100), claim = dec(m[3]);
    if (roundCents(tax) === Math.round(cents(claim).value) && q.choices.some(c => /^No/.test(c))) out.push('the claimed tax is right but the bracket choice says No');
  }
  return [...new Set(out)].join('; ');
}

export default { solve, sane };
