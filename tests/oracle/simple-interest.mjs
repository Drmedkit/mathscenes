// Oracle for the lesson "simple-interest" (calculate simple interest, grade 7). Written from what the student sees
// only: the prompt, the board, the choices and the year table the picture draws. Money is exact (Q fractions); a
// credited interest is rounded to the cent, halves up, once per year. Simple interest = principal × rate × years;
// compound = each year's rate of the latest balance. Choices are judged by computing what each one claims.
// See docs/lessons/QUALITY_LAYER.md, "O: the oracle".
import { Q, choiceWhere } from '../../tools/quality/oracle-kit.mjs';

// ---------------------------------------------------------------- reading
const clean = s => String(s ?? '').replace(/[−–]/g, '-').replace(/[’‘]/g, "'");
function dec(s) {
  const t = clean(s).replace(/[$,\s%]/g, '').replace(/\{,\}/g, '');
  const m = t.match(/^(-?)(\d*)(?:\.(\d+))?$/);
  if (!m || (m[2] === '' && !m[3])) throw new Error(`not a number: ${s}`);
  const d = m[3] ? 10 ** m[3].length : 1;
  const n = Number((m[2] || '0') + (m[3] || ''));
  return Q(m[1] ? -n : n, d);
}
const M = '\\$(\\d[\\d,]*(?:\\.\\d+)?)';
const R = '(\\d+(?:\\.\\d+)?)%';
const monies = s => [...clean(s).matchAll(new RegExp(M, 'g'))].map(m => dec(m[1]));
const money1 = s => monies(s)[0];
const rx = (s, re) => clean(s).match(new RegExp(re));
const roundCents = x => { const c = x.mul(100); return Q(Math.floor((2 * c.n + c.d) / (2 * c.d)), 100); };
const isCents = x => x.mul(100).d === 1;
const texCell = s => String(s ?? '').replace(/\\\$/g, '$').replace(/\{,\}/g, ',').replace(/[{}\\]/g, '').trim();
const WORD = { one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10 };

/** principal, rate (fraction), from the usual "… $P … at r% …" */
function pr(p) {
  const P = money1(p), m = rx(p, R);
  return { P, r: m ? dec(m[1]).div(100) : null };
}
/** a compound balance after k years, each year's interest rounded to the cent */
function compound(P, r, k) {
  const rows = [{ I: null, B: P }];
  let B = P;
  for (let y = 1; y <= k; y++) { const I = roundCents(B.mul(r)); B = B.add(I); rows.push({ I, B }); }
  return rows;
}

// ---------------------------------------------------------------- families
const F = {};

F.whoIsP = q => {
  const v = q.choices.map((c, i) => [money1(c), i]).sort((a, b) => a[0].cmp(b[0]));
  if (!v[0][0].add(v[1][0]).eq(v[2][0])) return -1;
  return v[1][1];   // principal + interest = balance; the interest is the small part
};

F.findP = q => {
  const m = rx(q.prompt, `Balance on Jan 1: ${M}\\. Interest paid Dec 31: ${M}\\. Balance on Dec 31: ${M}`);
  return dec(m[1]).value;
};

F.per100 = q => { const m = rx(q.prompt, `pays ${R} interest per year on ${M}`); return dec(m[2]).mul(dec(m[1])).div(100).value; };

F.rateVsDollars = q => {
  const m = rx(q.prompt, `pays ${R} per year on .*?${M}`);
  const r = dec(m[1]), P = dec(m[2]), I = P.mul(r).div(100);
  return choiceWhere(q, c => {
    const k = rx(c, `earns ${M}: ${M} for each \\$100\\.`);
    return !!k && dec(k[1]).eq(I) && dec(k[2]).eq(r);   // "the rate is the dollars" is never the reason
  });
};

F.periodTrap = q => {
  const r = dec(rx(q.prompt, `pays ${R} per year`)[1]);
  // a yearly rate already covers the whole year: the 12 × claim is wrong
  return choiceWhere(q, c => { const k = rx(c, `^No: ${R} per year already covers all 12 months`); return !!k && dec(k[1]).eq(r); });
};

F.oneYearUnit = q => {
  const m = rx(q.prompt, `keeps ${M} in an account at ${R} per year`);
  const I = dec(m[1]).mul(dec(m[2])).div(100);
  return choiceWhere(q, c => !/about/.test(c) && money1(c).eq(I));
};

F.loanRoles = q => {
  const p = clean(q.prompt);
  let m = p.match(new RegExp(`pays back ${M}, which includes ${M} interest`));
  if (m) { const P = dec(m[1]).sub(dec(m[2])); return choiceWhere(q, c => money1(c).eq(P)); }
  m = p.match(/^(\w+) borrows .*? from (a|an|the) ([\w ]+?) for /);
  if (m && /Who pays the interest/.test(p)) return choiceWhere(q, c => c.trim() === `${m[1]} pays it to the ${m[3]}.`);
  return undefined;
};

F.earnOrOwe = q => {
  const m = rx(q.prompt, `puts ${M} in .*? at ${R} per year\\. \\w+ borrows ${M} .*? at ${R} per year`);
  const save = dec(m[1]).mul(dec(m[2]).div(100).add(1)), owe = dec(m[3]).mul(dec(m[4]).div(100).add(1));
  return choiceWhere(q, c => { const k = rx(c, `has ${M}; \\w+ owes ${M}`); return !!k && dec(k[1]).eq(save) && dec(k[2]).eq(owe); });
};

F.oneYear = q => { const m = rx(q.prompt, `${M} at ${R} per year`); return dec(m[1]).mul(dec(m[2])).div(100).value; };
F.fromTen = q => { const P = money1(q.prompt), r = dec(rx(q.prompt, `The rate is ${R} per year`)[1]); return P.mul(r).div(100).value; };
F.decInterest = q => { const m = rx(q.prompt, `keeps ${M} in .*? at ${R} per year`); return dec(m[1]).mul(dec(m[2])).div(100).value; };
F.pctToDec = q => { const r = dec(rx(q.prompt, `rate is ${R}`)[1]).div(100); return choiceWhere(q, c => dec(c).eq(r)); };

F.endBalance = q => {
  const p = q.prompt;
  const P = money1(p);
  const m = rx(p, `The interest (?:for the year )?is ${M}`);
  return P.add(dec(m[1])).value;
};

F.labelBoth = q => {
  const m = rx(q.prompt, `(?:borrows|saves) ${M} for one year at ${R}`);
  const I = dec(m[1]).mul(dec(m[2])).div(100);
  return [I.value, dec(m[1]).add(I).value];
};

/** a tiny exact evaluator: numbers (with thousands commas), + − × ÷, parentheses */
function evalExpr(text) {
  const s = clean(text).replace(/\$/g, '').replace(/(\d),(?=\d{3})/g, '$1').replace(/×/g, '*').replace(/÷/g, '/');
  const toks = s.match(/\d+\.?\d*|\.\d+|[-+*/()]/g) ?? [];
  let i = 0;
  const expr = () => { let v = term(); while (toks[i] === '+' || toks[i] === '-') { const o = toks[i++]; const w = term(); v = o === '+' ? v.add(w) : v.sub(w); } return v; };
  const term = () => { let v = fac(); while (toks[i] === '*' || toks[i] === '/') { const o = toks[i++]; const w = fac(); v = o === '*' ? v.mul(w) : v.div(w); } return v; };
  const fac = () => { const t = toks[i++]; if (t === '-') return fac().neg(); if (t === '(') { const v = expr(); i++; return v; } return dec(t); };
  const v = expr();
  if (i !== toks.length) throw new Error(`bad expression ${text}`);
  return v;
}

F.multExpr = q => {
  const { P, r } = pr(q.prompt);
  const B = P.mul(r.add(1));
  return choiceWhere(q, c => { try { return evalExpr(c).eq(B); } catch { return false; } });
};

F.multValue = q => {
  const p = q.prompt;
  const r = dec(rx(p, R)[1]).div(100);
  if (/What is the multiplier/.test(p)) return r.add(1).value;
  if (/what is the balance after one year/.test(p)) return money1(p).mul(r.add(1)).value;
  return undefined;
};

F.roundI = q => {
  const m = rx(q.prompt, `holds ${M} at ${R} per year`);
  return roundCents(dec(m[1]).mul(dec(m[2])).div(100)).value;
};

F.roundRule = q => {
  const m = rx(q.prompt, `^${M} earns ${R} for one year`);
  const P = dec(m[1]), I = roundCents(P.mul(dec(m[2])).div(100)), B = P.add(I);
  return choiceWhere(q, c => { const k = rx(c, `^interest ${M}, balance ${M}$`); return !!k && dec(k[1]).eq(I) && dec(k[2]).eq(B); });
};

F.spotError = q => {
  const p = clean(q.prompt);
  const m = p.match(new RegExp(`interest on ${M} at ${R} per year\\. The ending balance is ${M}\\.`));
  const P = dec(m[1]), r = dec(m[2]).div(100), B = dec(m[3]), I = P.mul(r);
  const w = p.match(/writes: .(.*?).\s*What went wrong/)[1];
  let verdict = null, k;
  if ((k = w.match(new RegExp(`^Interest = ([\\d.]+) × ${M} = ${M}\\.?$`)))) {
    const d = dec(k[1]), base = dec(k[2]), got = dec(k[3]);
    if (base.eq(P) && d.eq(r) && got.eq(I)) verdict = 'Nothing';
    else if (base.eq(P) && [Q(1, 1000), Q(1, 100), Q(1, 10), Q(10), Q(100), Q(1000)].some(f => got.eq(I.mul(f)))) verdict = 'decimal';
  } else if ((k = w.match(new RegExp(`^Interest = ${M} because the rate is ${R}\\.?$`)))) {
    if (dec(k[1]).eq(dec(k[2])) && !dec(k[1]).eq(I)) verdict = 'dollars';
    else if (dec(k[1]).eq(I)) verdict = 'Nothing';
  } else if ((k = w.match(new RegExp(`^Interest = ${R} of ${M} = ${M}\\.?$`)))) {
    const base = dec(k[2]), got = dec(k[3]);
    if (base.eq(B) && !B.eq(P) && roundCents(base.mul(dec(k[1])).div(100)).eq(roundCents(got))) verdict = 'balance';   // her product, to the cent
    else if (base.eq(P) && got.eq(I)) verdict = 'Nothing';
  }
  if (!verdict) return undefined;
  const pat = { Nothing: /^Nothing: the work is right/, decimal: /put the decimal point in the wrong place/, dollars: /used the rate as a number of dollars/, balance: /took the percent of the ending balance, not the principal/ }[verdict];
  return choiceWhere(q, c => pat.test(c));
};

F.estimate = q => {
  const m = rx(q.prompt, `interest on ${M} at ${R} is ${M}\\.`);
  const P = dec(m[1]), C = dec(m[3]), one = P.div(100), ten = P.div(10);
  const sides = c => { const v = monies(c); return v; };
  if (C.cmp(one) < 0) return choiceWhere(q, c => /^No: it is less than 1%/.test(c) && sides(c)[0].eq(one));
  if (C.cmp(ten) > 0) return choiceWhere(q, c => /^No: it is more than 10%/.test(c) && sides(c)[0].eq(ten));
  return choiceWhere(q, c => /^Yes: it is between/.test(c) && sides(c)[0].eq(one) && sides(c)[1].eq(ten));
};

F.tableCell = q => {
  const p = q.prompt;
  const m = rx(p, `saves ${M} at ${R} simple interest per year`), y = Number(rx(p, /in year (\d+)\?/.source)[1]);
  const P = dec(m[1]), I = P.mul(dec(m[2])).div(100);
  if (/what is the balance in year/.test(p)) return P.add(I.mul(y)).value;
  if (/what is the interest in year/.test(p)) return I.value;
  return undefined;
};

F.sameEach = q => {
  const m = rx(q.prompt, `${M} earns ${R} simple interest per year`);
  const I = dec(m[1]).mul(dec(m[2])).div(100);
  return choiceWhere(q, c => money1(c).eq(I));
};

/** years from "for 7 years" / "a 3-year loan" */
function years(p) {
  let m = clean(p).match(/for (\d+|one|two|three|four|five|six|seven|eight|nine|ten) years?/) ?? clean(p).match(/(\d+)-year/);
  return m ? (WORD[m[1]] ?? Number(m[1])) : null;
}
F.formulaI = q => {
  const { P, r } = pr(q.prompt);
  return P.mul(r).mul(years(q.prompt)).value;
};
F.formulaTotal = q => {
  const { P, r } = pr(q.prompt);
  return P.add(P.mul(r).mul(years(q.prompt))).value;
};
F.costOfCredit = q => {
  const p = clean(q.prompt);
  const A = p.match(new RegExp(`Loan A: ${R} per year for (\\d+) years?`)), B = p.match(new RegExp(`Loan B: ${R} per year for (\\d+) years?`));
  const P = money1(p);
  const ia = P.mul(dec(A[1])).div(100).mul(Number(A[2])), ib = P.mul(dec(B[1])).div(100).mul(Number(B[2]));
  const k = ia.cmp(ib);
  if (k === 0) return choiceWhere(q, c => /the same/.test(c));
  const more = /costs more/.test(p), less = /costs less/.test(p);
  if (!more && !less) return undefined;
  const pick = (more ? k > 0 : k < 0) ? 'Loan A' : 'Loan B';
  return choiceWhere(q, c => c.trim() === pick);
};

F.monthsT = q => {
  const mo = Number(rx(q.prompt, /for (\d+) months/.source)[1]);
  const t = Q(mo, 12);
  return choiceWhere(q, c => { const k = c.match(/t = ([\d.]+)/); return !!k && dec(k[1]).eq(t); });
};
F.monthsI = q => {
  const { P, r } = pr(q.prompt);
  const mo = Number(rx(q.prompt, /for (\d+) months/.source)[1]);
  return P.mul(r).mul(Q(mo, 12)).value;
};

F.compoundCell = q => {
  const p = q.prompt;
  const { P, r } = pr(p);
  const y = Number(rx(p, /in year (\d+)\?/.source)[1]);
  const rows = compound(P, r, y);
  if (/What is the balance in year/.test(p)) return rows[y].B.value;
  if (/What is the interest in year/.test(p)) return rows[y].I.value;
  return undefined;
};
F.compoundBase = q => {
  const p = q.prompt;
  const { P, r } = pr(p);
  const y = Number(rx(p, /In year (\d+),/.source)[1]);
  const base = compound(P, r, y - 1)[y - 1].B;
  return choiceWhere(q, c => money1(c).eq(base));
};

F.ruleFromTable = q => {
  const { P, r } = pr(q.prompt);
  const T = q.data?.picture?.table;
  if (!T) return undefined;
  const rows = T.rows.map(rw => rw.map(texCell));
  const iCol = T.head.indexOf('interest'), bCol = T.head.indexOf('balance');
  const B0 = money1(rows[0][bCol]);
  let simple = B0.eq(P), comp = B0.eq(P), prev = B0;
  for (const rw of rows.slice(1)) {
    const I = money1(rw[iCol]), B = money1(rw[bCol]);
    if (!I.eq(P.mul(r)) || !B.eq(prev.add(I))) simple = false;
    if (!I.eq(roundCents(prev.mul(r))) || !B.eq(prev.add(I))) comp = false;
    prev = B;
  }
  if (simple && comp) return choiceWhere(q, c => /can.t tell/.test(c));
  if (simple) return choiceWhere(q, c => /^Simple interest$/.test(c.trim()));
  if (comp) return choiceWhere(q, c => /^Compound interest$/.test(c.trim()));
  return -1;
};

F.gapGrows = q => {
  const p = q.prompt;
  const m = rx(p, `for ${M} at ${R} per year`);
  const P = dec(m[1]), r = dec(m[2]).div(100);
  const y = Number(rx(p, /What is the gap after (\d+) years/.source)[1]);
  return compound(P, r, y)[y].B.sub(P.add(P.mul(r).mul(y))).value;
};

F.saverBorrower = q => {
  const p = clean(q.prompt);
  const m = p.match(new RegExp(`^(\\w+) (saves|borrows) ${M} for (\\d+) years at ${R} per year`));
  const P = dec(m[3]), t = Number(m[4]), r = dec(m[5]).div(100);
  const simple = P.add(P.mul(r).mul(t)), comp = compound(P, r, t)[t].B;
  const k = simple.cmp(comp);
  if (k === 0) return choiceWhere(q, c => /No difference/.test(c));
  // a saver wants the bigger balance, a borrower the smaller debt
  const simpleBetter = m[2] === 'saves' ? k > 0 : k < 0;
  return choiceWhere(q, c => c.trim() === (simpleBetter ? 'Simple interest' : 'Compound interest'));
};

export function solve(q) {
  const f = F[q.family];
  return f ? f(q) : undefined;
}

// ---------------------------------------------------------------- the world
const BIKE = /bike|scooter|skateboard|motorcycle/i;
export function sane(q) {
  const out = [], p = clean(q.prompt);
  const rates = [...p.matchAll(new RegExp(R, 'g'))].map(m => Number(m[1]));
  if (rates.some(x => x > 25) && !/12 × /.test(p)) out.push('an interest rate above 25% per year');
  if (/A helmet for it costs/.test(p) && !BIKE.test(p)) out.push(`"A helmet for it" with an item that takes no helmet (${p.match(/for (a |an )?([\w ]+?) at /)?.[2] ?? '?'})`);
  let s; try { s = solve(q); } catch { s = undefined; }
  if (q.input === 'choice' && s === -1) out.push('no single right choice');
  if (q.input === 'num' && typeof s === 'number' && q.unit === 'dollars' && !isCents(Q(s)) && !/round/.test(p)) out.push(`the exact answer $${s} is not whole cents and no rounding rule is given`);
  if (q.input === 'pair' && Array.isArray(s) && s.some(v => !isCents(Q(v)))) out.push('the exact interest is not whole cents and no rounding rule is given');
  let m;
  switch (q.family) {
    case 'whoIsP': case 'findP': {
      const v = monies(p).slice(0, 3).sort((a, b) => a.cmp(b));
      if (v.length >= 3 && !v[0].add(v[1]).eq(v[2])) out.push('principal + interest ≠ balance');
      break;
    }
    case 'endBalance': {
      const { P, r } = pr(p);
      m = rx(p, `The interest (?:for the year )?is ${M}`);
      if (m && r && !dec(m[1]).eq(roundCents(P.mul(r)))) out.push('the stated interest is not the rate of the principal');
      break;
    }
    case 'roundI': {
      m = rx(p, `holds ${M} at ${R} per year.*?= ${M}\\.`);
      if (m && !dec(m[3]).eq(dec(m[1]).mul(dec(m[2])).div(100))) out.push('the stated exact interest is not P × r');
      break;
    }
    case 'rateVsDollars': {
      m = rx(p, `pays ${R} per year on .*?${M}`);
      if (m && dec(m[2]).eq(Q(100))) out.push('on $100 the "rate is the dollars" choice gives the right amount');
      break;
    }
    case 'spotError': {
      m = p.match(new RegExp(`interest on ${M} at ${R} per year\\. The ending balance is ${M}\\.`));
      if (m && !dec(m[3]).eq(dec(m[1]).add(dec(m[1]).mul(dec(m[2])).div(100)))) out.push('the stated ending balance is not principal + interest');
      if (s === undefined) out.push('the written work fits no single mistake');
      break;
    }
    case 'compoundBase': case 'gapGrows': case 'saverBorrower': {
      // the stated balances must be the real ones
      const { P, r } = pr(p);
      if ((m = rx(p, `The balance after year (\\d+) is ${M}`)) && !compound(P, r, Number(m[1]))[Number(m[1])].B.eq(dec(m[2]))) out.push('the stated balance is not the compound balance');
      if ((m = rx(p, `simple gives ${M} after (\\d+) years, compound gives ${M}`))) {
        const t = Number(m[2]);
        if (!P.add(P.mul(r).mul(t)).eq(dec(m[1])) || !compound(P, r, t)[t].B.eq(dec(m[3]))) out.push('a stated balance is wrong');
      }
      if ((m = rx(p, `Simple: (?:owes )?${M}\\. Compound: (?:owes )?${M}\\.`))) {
        const t = years(p);
        if (!P.add(P.mul(r).mul(t)).eq(dec(m[1])) || !compound(P, r, t)[t].B.eq(dec(m[2]))) out.push('a stated amount is wrong');
      }
      break;
    }
    default: break;
  }
  return [...new Set(out)].join('; ');
}

export default { solve, sane };
