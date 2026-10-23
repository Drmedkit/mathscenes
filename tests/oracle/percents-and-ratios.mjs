// percents-and-ratios oracle (role O, docs/lessons/QUALITY_LAYER.md). Every practice item is worked out from what the
// student sees: the prompt (plain and its bold parts), the board, the choices, and the chain picture's piece names.
// Amounts are exact fractions (decimal strings read exactly); money answers are given to the cent, as a student types.
// Choice items are judged by the maths of each claim: plans are run step by step (a step that needs an amount nobody
// has found yet makes the plan fail), one-line products are evaluated, claims about shares and percents are tested.
import { Q } from '../../tools/quality/oracle-kit.mjs';

// ---------------------------------------------------------------- reading
// the article before an amount ("An $80 jacket", "an $8 fee") is read as "A"/"a": same item, either spelling
const norm = s => String(s ?? '').replace(/\b([Aa])n (?=\$?\d)/g, '$1 ').replace(/[−–]/g, '-').replace(/’/g, "'").replace(/\s+/g, ' ').trim();
/** a decimal / money string → exact Q ("$1,500" → 1500, "7.25" → 29/4) */
function D(s) {
  const t = String(s).replace(/[$,\s]/g, '').replace(/−/g, '-').replace(/\.$/, '');
  const m = t.match(/^(-?)(\d*)(?:\.(\d+))?$/);
  if (!m || (m[2] === '' && !m[3])) throw new Error(`not a number: ${s}`);
  const d = m[3] ? 10 ** m[3].length : 1, n = Number((m[2] || '0') + (m[3] || ''));
  return Q(m[1] ? -n : n, d);
}
const P = s => D(s).div(100);                      // "25" (percent) → 1/4
const N = '\\$?(\\d[\\d,]*(?:\\.\\d+)?)';             // a number, maybe money, maybe with commas
const R = '(\\d+) : (\\d+)';                        // a two-term ratio
const one = Q(1);
const share = (T, terms, i) => T.mul(terms[i]).div(terms.reduce((a, b) => a + b, 0));
const must = (m, what) => { if (!m) throw new Error(`cannot read ${what}`); return m; };
/** round an exact non-negative Q half up to `places` decimals, exactly */
function roundQ(q, places = 2) {
  const k = 10 ** places;
  const n = Math.floor((2 * q.n * k + q.d) / (2 * q.d));
  return Q(n, k);
}
const isTie = (q, places = 2) => { const k = 10 ** places; const x = q.mul(k * 2); return x.d === 1 && Math.abs(x.n) % 2 === 1; };
/** the bold parts of the prompt HTML, plain */
const bolds = h => [...String(h ?? '').matchAll(/<b(?: [^>]*)?>(.*?)<\/b>/g)].map(m => norm(m[1].replace(/<[^>]+>/g, '').replace(/&#8202;|&thinsp;|&nbsp;/g, ' ')));
/** the sentences of a plain text */
const sentences = t => norm(t).split(/(?<=[.?!])\s+(?=[A-Z0-9$])/);

// ---------------------------------------------------------------- the kind of a step (labelStep, findFixed)
function kindOf(sentence, bold) {
  const s = norm(sentence), b = norm(bold);
  if (/%/.test(b)) return 'percent';
  // a fixed amount does not grow with the whole: a fee, a flat charge, "however many", "big or small", a difference
  if (/however many|big or small|\bflat\b|\bfee\b|years older|years younger|\bmore\b.*\bthan\b|\bfewer\b.*\bthan\b/.test(s)) return 'fixed';
  if (/for every|\d+ : \d+|parts? .* to \d+ parts?|\bper\b|stands for|\beach\b/.test(b)) return 'ratio';
  return null;
}

// ---------------------------------------------------------------- per family
const F = {
  labelStep(q) {
    const b = bolds(q.promptHtml)[0];
    const sent = sentences(q.prompt).find(s => s.includes(b)) ?? q.prompt;
    const k = kindOf(sent, b);
    return q.choices.map(c => (/^A ratio step/.test(c) ? k === 'ratio' : /^A percent step/.test(c) ? k === 'percent' : /^Neither/.test(c) ? k === 'fixed' : false));
  },
  findFixed(q) {
    const ss = sentences(q.prompt);
    return q.choices.map(c => { const s = ss.find(x => x.includes(norm(c))); return !!s && kindOf(s, c) === 'fixed'; });
  },
  doubleTest(q) {
    const p = norm(q.prompt); let m;
    if ((m = p.match(new RegExp(`charges ${N} per family, however many people come`)))) return D(m[1]);
    if ((m = p.match(new RegExp(`Shipping is a flat ${N} per order`)))) return D(m[1]);
    if ((m = p.match(/mixed (\d+) parts? blue to (\d+) parts? white\. (\d+) cups of blue need (\d+) cups of white\. How much white for (\d+) cups of blue/)))
      return D(m[5]).mul(+m[2]).div(+m[1]);
    if ((m = p.match(new RegExp(`tips ([\\d.]+)% of the bill\\. On a ${N} bill, the tip is ${N}\\. What is the tip on a ${N} bill`)))) return D(m[4]).mul(P(m[1]));
    if ((m = p.match(new RegExp(`Sales tax is ([\\d.]+)%\\. On ${N}, the tax is ${N}\\. What is the tax on ${N}\\?`)))) return D(m[4]).mul(P(m[1]));
    if ((m = p.match(/is (\d+) years older than her brother\. When he was (\d+), she was (\d+)\. How old is \w+ when her brother is (\d+)/))) return D(m[4]).add(+m[1]);
    throw new Error('doubleTest story');
  },
  nameWhole(q) {
    const p = norm(q.prompt); let m, want;
    if ((m = p.match(new RegExp(`A ${N} jacket is ([\\d.]+)% off\\. Then ([\\d.]+)% sales tax is added to the sale price`)))) {
      const W = D(m[1]), d = P(m[2]);
      want = { label: 'The sale price', v: W.mul(one.sub(d)), others: { 'The discount': W.mul(d), 'The original price': W } };
    } else if ((m = p.match(new RegExp(`splits its ${N} budget between art and music in the ratio ${R}\\. Art spends`)))) {
      const B = D(m[1]), t = [+m[2], +m[3]];
      want = { label: "Art's share", v: share(B, t, 0), others: { "Music's share": share(B, t, 1), 'The whole budget': B } };
    } else if ((m = p.match(new RegExp(`A store pays ${N} for a \\w+ and marks it up ([\\d.]+)% to ${N}\\. Later it marks that price down`)))) {
      const C = D(m[1]), u = P(m[2]);
      want = { label: 'The marked-up price', v: C.mul(one.add(u)), others: { 'The markup': C.mul(u), "The store's cost": C }, shown: D(m[3]) };
    } else if ((m = p.match(new RegExp(`Dinner is ${N} before tax\\. Tax is ([\\d.]+)%, so the bill with tax is ${N}\\. The family tips ([\\d.]+)% of the bill (with|before) tax`)))) {
      const B = D(m[1]), t = P(m[2]);
      const withTax = B.mul(one.add(t));
      want = m[5] === 'with' ? { label: 'The bill with tax', v: withTax } : { label: 'The bill before tax', v: B };
      want.shown = D(m[3]); want.showWant = withTax;
    } else throw new Error('nameWhole story');
    return q.choices.map(c => {
      const mm = norm(c).match(/^(.+), \$([\d,.]+)$/);
      return !!mm && mm[1] === want.label && D(mm[2]).eq(want.v) && (!want.shown || want.shown.eq(want.showWant ?? want.v));
    });
  },
  wholeValue(q) {
    const p = norm(q.prompt); let m;
    if ((m = p.match(new RegExp(`A ${N} jacket is ([\\d.]+)% off, then ([\\d.]+)% tax is added to the sale price\\. What amount is 100% for the tax step`)))) return D(m[1]).mul(one.sub(P(m[2])));
    if ((m = p.match(new RegExp(`splits its ${N} budget art to music ${R}, and art spends ([\\d.]+)% of its share on paint\\. What amount is 100% for the paint step`)))) return share(D(m[1]), [+m[2], +m[3]], 0);
    if ((m = p.match(new RegExp(`A store pays ${N} for a \\w+, marks it up ([\\d.]+)%, then takes ([\\d.]+)% off in a sale\\. What amount is 100% for the sale step`)))) return D(m[1]).mul(one.add(P(m[2])));
    if ((m = p.match(new RegExp(`Dinner is ${N} before tax\\. Tax is ([\\d.]+)%, and the tip is ([\\d.]+)% of the bill with tax\\. What amount is 100% for the tip`)))) return D(m[1]).mul(one.add(P(m[2])));
    if ((m = p.match(new RegExp(`Dinner is ${N} before tax\\. Tax is ([\\d.]+)%, and the tip is ([\\d.]+)% of the bill before tax\\. What amount is 100% for the tip`)))) return D(m[1]);
    if ((m = p.match(/Of (\d[\d,]*) tickets printed, ([\d.]+)% were sold\. The tickets sold were adult to student (\d+) : (\d+)\. How many tickets are the whole for the ratio step/))) return D(m[1]).mul(P(m[2]));
    throw new Error('wholeValue story');
  },
  orderPlan(q) {
    const p = norm(q.prompt); let m, right, asked, run;
    if ((m = p.match(new RegExp(`Sales tax of ([\\d.]+)% is added to the sale price\\. The ${N} \\w+ is ([\\d.]+)% off\\. What is the total`)))) {
      const t = P(m[1]), W = D(m[2]), d = P(m[3]);
      right = W.mul(one.sub(d)).mul(one.add(t));
    } else if ((m = p.match(new RegExp(`adult to student ${R}\\. Of the (\\d[\\d,]*) tickets printed, ([\\d.]+)% were sold\\. How many student tickets`)))) {
      right = D(m[3]).mul(P(m[4])).mul(+m[2]).div(+m[1] + +m[2]); asked = 1;
    } else if ((m = p.match(new RegExp(`Art spends ([\\d.]+)% of its share on paint\\. The club splits its ${N} budget, art to music ${R}\\. How much goes to paint`)))) {
      right = share(D(m[2]), [+m[3], +m[4]], 0).mul(P(m[1])); asked = 0;
    } else if ((m = p.match(new RegExp(`^(\\w+) and (\\w+) split the prize ${R}\\. The prize is what is left of ${N} after ([\\d.]+)% tax is taken out\\. How much does (\\w+) get`)))) {
      asked = m[7] === m[1] ? 0 : m[7] === m[2] ? 1 : -1;
      right = share(D(m[5]).mul(one.sub(P(m[6]))), [+m[3], +m[4]], asked);
    } else throw new Error('orderPlan story');
    run = c => runPlan(c, asked);
    return q.choices.map(c => { try { const v = run(c); return !!v && v.eq(right); } catch { return false; } });
  },
  firstStep(q) {
    const p = norm(q.prompt); let m;
    if ((m = p.match(/adult to student (\d+) : (\d+)\. Of (\d[\d,]*) tickets printed, ([\d.]+)% were sold\. How many student tickets/)))
      // the ratio is of the tickets SOLD: the sold count needs only the givens, and the split needs it
      return q.choices.map(c => /^The number of tickets sold$/.test(norm(c)));
    if ((m = p.match(/^(\w+) saves ([\d.]+)% of his commission\. He earns ([\d.]+)% commission on his own sales\. (\w+) and (\w+) sold \$([\d,]+) of \w+, \4 to \5 (\d+) : (\d+)\. How much does (\w+) save/)))
      // the commission is a percent of HIS sales: his share of the sales comes first
      return q.choices.map(c => norm(c) === `${m[1]}'s sales`);
    if ((m = p.match(/The tip is ([\d.]+)% of the bill with tax\. Tax is ([\d.]+)% of the meal\. The meal costs \$([\d,.]+)\. What is the total/)))
      // the tip's whole is the bill with tax, so the tax comes first
      return q.choices.map(c => /^The tax on the meal$/.test(norm(c)));
    throw new Error('firstStep story');
  },
  planThree(q) {
    const p = norm(q.prompt); let m, right, ctx;
    if ((m = p.match(new RegExp(`pays a flat ${N} for a bus pass out of her pay\\. She earns ${N} an hour and works (\\d+) hours, and ([\\d.]+)% of her pay is withheld for taxes`)))) {
      right = D(m[2]).mul(+m[3]).mul(one.sub(P(m[4]))).sub(D(m[1]));
    } else if ((m = p.match(new RegExp(`Delivery is a flat ${N}\\. The food store takes ([\\d.]+)% off the food\\. A ${N} party budget is split food to games ${R}, and the food order uses all of food's share before the discount`)))) {
      const S = share(D(m[3]), [+m[4], +m[5]], 0);
      right = S.mul(one.sub(P(m[2]))).add(D(m[1]));
      ctx = { B: D(m[3]), terms: [+m[4], +m[5]] };
    } else throw new Error('planThree story');
    return q.choices.map(c => { try { const v = runArrows(c, ctx); return !!v && v.eq(right); } catch { return false; } });
  },
  share(q) {
    const p = norm(q.prompt); let m;
    m = must(p.match(/^(?:A |Friends share a )?\$?([\d,.]+) (?:ft rope|prize|students)?.*?in the ratio ((?:\d+ : )+\d+)\./), 'share');
    const T = D(m[1]), terms = m[2].split(' : ').map(Number);
    let names;
    if (/rope is cut into/.test(p)) names = p.match(/cut into (.+?) pieces/)[1].replace(/,? and /g, ', ').split(', ').map(s => s.trim());
    else if (/students are split into teams/.test(p)) names = terms.map((_, i) => 'Team ' + 'ABC'[i]);
    else names = (q.data?.picture?.chain?.chain?.rows?.[0]?.pieces ?? []).map(x => x.inside); // the names drawn in the pieces
    const who = must(p.match(/How (?:long is the (\w+) piece|many students are on (Team \w)|much does (\w+) get)\?/), 'who');
    const i = names.indexOf(who[1] ?? who[2] ?? who[3]);
    if (i < 0 || names.length !== terms.length) throw new Error('who');
    return share(T, terms, i);
  },
  shareFromPart(q) {
    const p = norm(q.prompt);
    const m = must(p.match(/^(\w+) and (\w+) share some money in the ratio (\d+) : (\d+)\. (\w+) gets \$([\d,.]+)\. How (much does (\w+) get|much money was shared in all)\?/), 'shareFromPart');
    const names = [m[1], m[2]], t = [+m[3], +m[4]], gi = names.indexOf(m[5]), v = D(m[6]);
    const unit = v.div(t[gi]);
    if (m[8]) return unit.mul(t[names.indexOf(m[8])]);
    return unit.mul(t[0] + t[1]);
  },
  shareFraction(q) {
    const p = norm(q.prompt);
    const m = must(p.match(/^In the ([\w ]+), ([\w ]+?) to ([\w ]+?) is (\d+) : (\d+)\. What fraction of the [\w ]+ is ([\w ]+)\?/), 'shareFraction');
    const t = [+m[4], +m[5]], i = m[6] === m[2] ? 0 : m[6] === m[3] ? 1 : -1;
    if (i < 0) throw new Error('part');
    const f = Q(t[i], t[0] + t[1]);
    return q.choices.map(c => { const mm = norm(c).match(/^(\d+)\/(\d+) of/); return !!mm && Q(+mm[1], +mm[2]).eq(f); });
  },
  ratioPercent(q) { const r = ratioPercentStory(q.prompt); return r.part.mul(r.p); },
  ratioPercentRest(q) { const r = ratioPercentStory(q.prompt); if (!r.rest) throw new Error('not a rest question'); return r.part.mul(one.sub(r.p)); },
  rateThenPercent(q) {
    const p = norm(q.prompt); let m;
    if ((m = p.match(new RegExp(`costs ${N} per yard\\. \\w+ buys (\\d+) yards and uses a ([\\d.]+)% off coupon on the whole order`)))) return D(m[1]).mul(+m[2]).mul(one.sub(P(m[3])));
    if ((m = p.match(new RegExp(`cost ${N} per pound\\. A café buys (\\d+) pounds, and a ([\\d.]+)% delivery charge is added to the price`)))) return D(m[1]).mul(+m[2]).mul(one.add(P(m[3])));
    if ((m = p.match(new RegExp(`earns ${N} an hour and works (\\d+) hours\\. She saves ([\\d.]+)% of her pay`)))) return D(m[1]).mul(+m[2]).mul(P(m[3]));
    throw new Error('rateThenPercent story');
  },
  percentRatio(q) {
    const p = norm(q.prompt); let m;
    if ((m = p.match(new RegExp(`raised ${N}, and ([\\d.]+)% of it paid for costs\\. The rest was split, (\\w+) to (\\w+), ${R}\\. How much did the (\\w+) get`))))
      return share(D(m[1]).mul(one.sub(P(m[2]))), [+m[5], +m[6]], idx(m[7], m[3], m[4]));
    if ((m = p.match(new RegExp(`printed (\\d[\\d,]*) tickets, and ([\\d.]+)% of them were sold\\. The tickets sold were adult to student ${R}\\. How many (adult|student) tickets`))))
      return share(D(m[1]).mul(P(m[2])), [+m[3], +m[4]], m[5] === 'adult' ? 0 : 1);
    if ((m = p.match(new RegExp(`^(\\w+) and (\\w+) win a ${N} prize, and ([\\d.]+)% is taken out for taxes\\. They split the rest, (\\w+) to (\\w+) ${R}\\. How much does (\\w+) get`))))
      return share(D(m[3]).mul(one.sub(P(m[4]))), [+m[7], +m[8]], idx(m[9], m[5], m[6]));
    if ((m = p.match(new RegExp(`There are (\\d[\\d,]*) students in grade \\d+, and ([\\d.]+)% of them joined an after-school club\\. The club members chose (\\w+) or (\\w+) in the ratio ${R}\\. How many chose (\\w+)`))))
      return share(D(m[1]).mul(P(m[2])), [+m[5], +m[6]], idx(m[7], m[3], m[4]));
    throw new Error('percentRatio story');
  },
  percentThenRate(q) {
    const p = norm(q.prompt); let m;
    if ((m = p.match(/drives a (\d[\d,]*)-mile trip\. ([\d.]+)% of it is on dirt roads, where the truck uses 1 gallon every (\d+) miles/))) return D(m[1]).mul(P(m[2])).div(+m[3]);
    if ((m = p.match(new RegExp(`A ${N} gift card loses ([\\d.]+)% to a fee before you can use it\\. Songs cost ${N} each\\. How many songs`)))) {
      const v = D(m[1]).mul(one.sub(P(m[2]))).div(D(m[3]));
      return Q(Math.floor(v.value + 1e-12));   // whole songs only
    }
    throw new Error('percentThenRate story');
  },
  percentRatioGrow(q) {
    const p = norm(q.prompt);
    const m = must(p.match(new RegExp(`had (\\d[\\d,]*) members last year\\. Membership grew by ([\\d.]+)%\\. Now (\\w+) to (\\w+) is ${R}\\. How many (\\w+) are members now`)), 'grow');
    return share(D(m[1]).mul(one.add(P(m[2]))), [+m[5], +m[6]], idx(m[7], m[3], m[4]));
  },
  twoChanges(q) {
    const p = norm(q.prompt); let m;
    if ((m = p.match(new RegExp(`costs ${N}\\. Its price (drops|rises) ([\\d.]+)%, then (drops|rises) ([\\d.]+)% of the new price`))))
      return D(m[1]).mul(mult(m[2], m[3])).mul(mult(m[4], m[5]));
    if ((m = p.match(new RegExp(`A ${N} \\w+ is ([\\d.]+)% off\\. Then ([\\d.]+)% sales tax is added to the sale price\\. What is the total`))))
      return D(m[1]).mul(one.sub(P(m[2]))).mul(one.add(P(m[3])));
    if ((m = p.match(new RegExp(`A store pays ${N} for a \\w+ and marks the price up ([\\d.]+)%\\. In a sale it takes ([\\d.]+)% off that price`))))
      return D(m[1]).mul(one.add(P(m[2]))).mul(one.sub(P(m[3])));
    if ((m = p.match(new RegExp(`costs ${N} before tax\\. Tax is ([\\d.]+)%, and the tip is ([\\d.]+)% of the bill with tax\\. What is the total`))))
      return D(m[1]).mul(one.add(P(m[2]))).mul(one.add(P(m[3])));
    throw new Error('twoChanges story');
  },
  netChange(q) {
    const p = norm(q.prompt);
    const m = must(p.match(/goes (up|down) ([\d.]+)%, then goes (up|down) ([\d.]+)% of the new price/), 'net');
    const k = mult(m[1], m[2]).mul(mult(m[3], m[4]));
    return q.choices.map(c => changeIs(c, k));
  },
  threeStep(q) {
    const p = norm(q.prompt);
    const m = must(p.match(new RegExp(`^(\\w+) and (\\w+) split a ${N} dinner bill by what they ate, (\\w+) to (\\w+) ${R}\\. (\\w+) adds ([\\d.]+)% tax to her share, then a ([\\d.]+)% tip on her share with tax\\. What does (\\w+) pay`)), 'threeStep');
    if (m[8] !== m[11]) throw new Error('who');
    return share(D(m[3]), [+m[6], +m[7]], idx(m[8], m[4], m[5])).mul(one.add(P(m[9]))).mul(one.add(P(m[10])));
  },
  multiplier(q) {
    const p = norm(q.prompt);
    const m = must(p.match(/^Write (?:a |an )?([\d.]+)% (off|sales tax added|decrease|increase|markup|raise|discount) as one multiplier/), 'multiplier');
    const k = /off|decrease|discount/.test(m[2]) ? one.sub(P(m[1])) : one.add(P(m[1]));
    return q.choices.map(c => { const mm = norm(c).match(/^× ([\d.]+)$/); return !!mm && D(mm[1]).eq(k); });
  },
  chainProduct(q) {
    const p = norm(q.prompt); let m, right;
    if ((m = p.match(new RegExp(`A ${N} \\w+ is ([\\d.]+)% off, then ([\\d.]+)% sales tax is added to the sale price`)))) right = D(m[1]).mul(one.sub(P(m[2]))).mul(one.add(P(m[3])));
    else if ((m = p.match(new RegExp(`A ${N} \\w+ goes (up|down) ([\\d.]+)%, then (up|down) ([\\d.]+)% of its new value`)))) right = D(m[1]).mul(mult(m[2], m[3])).mul(mult(m[4], m[5]));
    else if ((m = p.match(new RegExp(`^${N} is shared, (\\w+) to (\\w+) ${R}\\. (\\w+) saves ([\\d.]+)% of his share`)))) right = share(D(m[1]), [+m[4], +m[5]], idx(m[6], m[2], m[3])).mul(P(m[7]));
    else throw new Error('chainProduct story');
    return q.choices.map(c => { try { return product(c).eq(right); } catch { return false; } });
  },
  multiplierToPercent(q) {
    const m = must(norm(q.prompt).match(/multiplied by ([\d.]+)\. What percent change/), 'm2p');
    return q.choices.map(c => changeIs(c, D(m[1])));
  },
  rounding(q) {
    const p = norm(q.prompt);
    const m = must(p.match(new RegExp(`A ${N} \\w+ is ([\\d.]+)% off, and ([\\d.]+)% sales tax is added to the sale price\\. (The store rounds the sale price to the cent first, then rounds the tax to the cent|Keep every digit until the end, then round the total to the cent)`)), 'rounding');
    const W = D(m[1]), d = P(m[2]), t = P(m[3]);
    if (/^The store/.test(m[4])) { const sale = roundQ(W.mul(one.sub(d))); return sale.add(roundQ(sale.mul(t))); }
    return roundQ(W.mul(one.sub(d)).mul(one.add(t)));
  },
  roundingTip(q) {
    const p = norm(q.prompt);
    const m = must(p.match(new RegExp(`Dinner costs ${N}\\. Sales tax is ([\\d.]+)%, and the tip is ([\\d.]+)% of the bill with tax\\. (Round the tax to the cent, then round the tip to the cent, then add|Keep every digit, and round only the final total to the cent)`)), 'roundingTip');
    const B = D(m[1]), t = P(m[2]), tip = P(m[3]);
    if (/^Round/.test(m[4])) { const tax = roundQ(B.mul(t)); const tp = roundQ(B.add(tax).mul(tip)); return B.add(tax).add(tp); }
    return roundQ(B.mul(one.add(t)).mul(one.add(tip)));
  },
  audit(q) {
    const st = auditStory(q.prompt);
    const lines = auditLines(q.promptHtml);
    let wrong = -1;
    for (let i = 0; i < lines.length; i++) if (!lineOk(lines[i], st)) { wrong = i; break; }
    return q.choices.map(c => { const mm = norm(c).match(/^Line (\d+)$/); return mm ? +mm[1] - 1 === wrong : /^Every line is right/.test(c) ? wrong < 0 : false; });
  },
  fixAudit(q) {
    const st = auditStory(q.prompt);
    if (/What should the tip be/.test(q.prompt)) return st.tip;
    if (/What should the total be/.test(q.prompt)) return st.total;
    if (/How much should the paint money be/.test(q.prompt)) return st.paint;
    throw new Error('fixAudit ask');
  },
  checkShares(q) {
    const p = norm(q.prompt);
    const m = must(p.match(new RegExp(`shared ${N} in the ratio ${R} and got ${N} and ${N}\\.`)), 'checkShares');
    const T = D(m[1]), a = +m[2], b = +m[3], x = D(m[4]), y = D(m[5]);
    const adds = x.add(y).eq(T), inRatio = x.mul(b).eq(y.mul(a));
    return q.choices.map(c => {
      const s = norm(c);
      if (/^Right: they add to .* and are in the ratio/.test(s)) return adds && inRatio;
      if (/^Wrong: they add to .*, but are not in the ratio/.test(s)) return adds && !inRatio;
      if (/^Wrong: they are in the ratio .*, but don't add to/.test(s)) return inRatio && !adds;
      return false;
    });
  },
  checkPercent(q) {
    const p = norm(q.prompt);
    const m = must(p.match(new RegExp(`splits ${N} art to music ${R} \\(art gets ${N}\\)\\. Art spends ([\\d.]+)% of its share on paint\\. \\w+ says the paint money is ${N}\\.`)), 'checkPercent');
    const B = D(m[1]), t = [+m[2], +m[3]], art = share(B, t, 0), music = share(B, t, 1), pc = P(m[5]), X = D(m[6]);
    return q.choices.map(c => {
      const s = norm(c); let mm;
      if ((mm = s.match(/^Right: \$([\d,.]+) is ([\d.]+)% of art's \$([\d,.]+)$/))) return D(mm[1]).eq(X) && P(mm[2]).eq(pc) && D(mm[3]).eq(art) && X.eq(art.mul(pc));
      if ((mm = s.match(/^Wrong: \$([\d,.]+) is ([\d.]+)% of the whole budget$/))) return D(mm[1]).eq(X) && P(mm[2]).eq(pc) && X.eq(B.mul(pc)) && !X.eq(art.mul(pc));
      if ((mm = s.match(/^Wrong: \$([\d,.]+) is ([\d.]+)% of music's share$/))) return D(mm[1]).eq(X) && P(mm[2]).eq(pc) && X.eq(music.mul(pc)) && !X.eq(art.mul(pc));
      return false;
    });
  },
  undo(q) {
    const p = norm(q.prompt); let m;
    if ((m = p.match(new RegExp(`After ([\\d.]+)% off, ([\\d.]+)% sales tax was added to the sale price\\. \\w+ paid ${N}\\. What was the price before the discount`))))
      return D(m[3]).div(one.sub(P(m[1]))).div(one.add(P(m[2])));
    if ((m = p.match(new RegExp(`A price (dropped|rose) ([\\d.]+)%, then (dropped|rose) ([\\d.]+)% of the new price\\. It is now ${N}\\. What was it at the start`))))
      return D(m[5]).div(mult(m[1], m[2])).div(mult(m[3], m[4]));
    if ((m = p.match(new RegExp(`Art spent ${N} on paint, which is ([\\d.]+)% of art's share\\. The club's budget was split art to music ${R}\\. What was the whole budget`))))
      return D(m[1]).div(P(m[2])).mul(+m[3] + +m[4]).div(+m[3]);
    throw new Error('undo story');
  },
  undoPercentRatio(q) {
    const p = norm(q.prompt);
    const m = must(p.match(new RegExp(`^(\\w+) and (\\w+) won a prize\\. ([\\d.]+)% was taken out for taxes, and they split the rest, (\\w+) to (\\w+) ${R}\\. (\\w+) got ${N}\\. How big was the prize`)), 'undoPR');
    const t = [+m[6], +m[7]], i = idx(m[8], m[4], m[5]);
    return D(m[9]).mul(t[0] + t[1]).div(t[i]).div(one.sub(P(m[3])));
  },
  estimate(q) {
    const p = norm(q.prompt); let m, v;
    if ((m = p.match(new RegExp(`A ${N} \\w+ is ([\\d.]+)% off, then ([\\d.]+)% sales tax is added\\. Without working it out exactly`)))) v = D(m[1]).mul(one.sub(P(m[2]))).mul(one.add(P(m[3])));
    else if ((m = p.match(new RegExp(`splits ${N} art to music ${R}, and art spends ([\\d.]+)% of its share on paint\\. Which paint amount`)))) v = share(D(m[1]), [+m[2], +m[3]], 0).mul(P(m[4]));
    else throw new Error('estimate story');
    const vals = q.choices.map(c => D(norm(c)).value), x = v.value;
    const dist = vals.map(y => Math.abs(y - x) / x);
    const best = dist.indexOf(Math.min(...dist));
    return q.choices.map((_, i) => i === best && dist[i] <= 0.05);
  },
  direction(q) {
    const p = norm(q.prompt);
    const m = must(p.match(/goes (up|down) ([\d.]+)%, then (up|down) ([\d.]+)% of its new price/), 'direction');
    const k = mult(m[1], m[2]).mul(mult(m[3], m[4])), s = k.cmp(1);
    return q.choices.map(c => (/^Less than/.test(c) ? s < 0 : /^More than/.test(c) ? s > 0 : /^Exactly/.test(c) ? s === 0 : false));
  },
  transfer(q) {
    const p = norm(q.prompt); let m;
    if ((m = p.match(new RegExp(`sold ${N} of \\w+ this month\\. He earns ([\\d.]+)% commission and saves ([\\d.]+)% of his commission`)))) return D(m[1]).mul(P(m[2])).mul(P(m[3]));
    if ((m = p.match(/garden of (\d[\d,]*) square feet is split, (\w+) to (\w+), (\d+) : (\d+)\. Tomatoes fill ([\d.]+)% of the (\w+) part/)))
      return share(D(m[1]), [+m[4], +m[5]], idx(m[7].replace(/vegetable$/, 'vegetables'), m[2], m[3])).mul(P(m[6]));
    if ((m = p.match(/(\d[\d,]*) people signed up for a \d+K, but ([\d.]+)% did not show up\. The people who came were (\w+) to (\w+) (\d+) : (\d+)\. How many (\w+) were there/)))
      return share(D(m[1]).mul(one.sub(P(m[2]))), [+m[5], +m[6]], idx(m[7], m[3], m[4]));
    if ((m = p.match(new RegExp(`puts ${N} in a savings account that pays ([\\d.]+)% simple interest for one year\\. She gives the interest to her cousins (\\w+) and (\\w+) in the ratio ${R}\\. How much does (\\w+) get`))))
      return share(D(m[1]).mul(P(m[2])), [+m[5], +m[6]], idx(m[7], m[3], m[4]));
    throw new Error('transfer story');
  },
  transferThree(q) {
    const p = norm(q.prompt); let m;
    if ((m = p.match(new RegExp(`A ${N} party budget is split food to games ${R}\\. The food order is all of food's share at full price, but the store takes ([\\d.]+)% off, and delivery is a flat ${N}\\.`))))
      return share(D(m[1]), [+m[2], +m[3]], 0).mul(one.sub(P(m[4]))).add(D(m[5]));
    if ((m = p.match(new RegExp(`earns ${N} an hour and works (\\d+) hours\\. ([\\d.]+)% of her pay is withheld for taxes\\. Then she buys a ${N} bus pass`))))
      return D(m[1]).mul(+m[2]).mul(one.sub(P(m[3]))).sub(D(m[4]));
    throw new Error('transferThree story');
  },
};

// ---------------------------------------------------------------- shared pieces
function idx(name, a, b) { const i = name === a ? 0 : name === b ? 1 : -1; if (i < 0) throw new Error(`who is ${name}`); return i; }
const mult = (dir, pc) => (/^(up|rises|rose|increase)/.test(dir) ? one.add(P(pc)) : one.sub(P(pc)));
/** does the choice "no change" / "a 20% increase" / "a 4% decrease" describe multiplier k? */
function changeIs(c, k) {
  const s = norm(c);
  if (/^no change$/.test(s)) return k.eq(1);
  const m = s.match(/^an? ([\d.]+)% (increase|decrease)$/);
  if (!m) return false;
  const ch = k.sub(1);
  return m[2] === 'increase' ? ch.cmp(0) > 0 && ch.eq(P(m[1])) : ch.cmp(0) < 0 && ch.neg().eq(P(m[1]));
}
/** evaluate "80 × 0.6 × 1.05" / "320 × 3/8 × 0.5" exactly */
function product(c) {
  return norm(c).split('×').map(t => t.trim()).reduce((acc, t) => {
    const m = t.match(/^(\d+)\/(\d+)$/);
    return acc.mul(m ? Q(+m[1], +m[2]) : D(t));
  }, one);
}
/** the ratio-then-percent stories: the part the percent is of, the percent, and whether the rest is asked */
function ratioPercentStory(text) {
  const p = norm(text); let m;
  const out = (T, t, i, pc, rest) => ({ part: share(T, t, i), p: P(pc), rest });
  if ((m = p.match(/^(\d[\d,]*) fans came to the game\. (\w+) fans to (\w+) fans was (\d+) : (\d+)\. ([\d.]+)% of the (\w+) fans wore caps\. How many \w+ fans (wore|did not wear) caps/i)))
    return out(D(m[1]), [+m[4], +m[5]], idx(m[7].toLowerCase(), m[2].toLowerCase(), m[3].toLowerCase()), m[6], m[8] !== 'wore');
  if ((m = p.match(/holds (\d[\d,]*) oz of trail mix, (\w+) to (\w+) (\d+) : (\d+)\. ([\d.]+)% of the (\w+) are almonds\. How many ounces of (almonds|the nuts are not almonds)/)))
    return out(D(m[1]), [+m[4], +m[5]], idx(m[7], m[2], m[3]), m[6], m[8] !== 'almonds');
  if ((m = p.match(new RegExp(`splits its ${N} budget between art and music in the ratio ${R}\\. Art spends ([\\d.]+)% of its share on paint\\. How much (does art spend on paint|of art's share is left)`))))
    return out(D(m[1]), [+m[2], +m[3]], 0, m[4], /left/.test(m[5]));
  if ((m = p.match(/grows (\d[\d,]*) acres of corn and soybeans, (\w+) to (\w+) (\d+) : (\d+)\. ([\d.]+)% of the (\w+) gets sprinklers\. How many acres of corn get (sprinklers|no sprinklers)/)))
    return out(D(m[1]), [+m[4], +m[5]], idx(m[7], m[2], m[3]), m[6], m[8] !== 'sprinklers');
  if ((m = p.match(/makes (\d[\d,]*) cups of juice and sparkling water, (\d+) : (\d+)\. ([\d.]+)% of the juice is orange juice\. How many cups (of orange juice|of the juice are not orange juice)/)))
    return out(D(m[1]), [+m[2], +m[3]], 0, m[4], /not/.test(m[5]));
  if ((m = p.match(new RegExp(`^(\\w+) and (\\w+) sold ${N} of [\\w ]+, (\\w+) to (\\w+) ${R}\\. (\\w+) earns ([\\d.]+)% commission on his own sales`))))
    return out(D(m[3]), [+m[6], +m[7]], idx(m[8], m[4], m[5]), m[9], false);
  throw new Error('ratioPercent story');
}

/** run a two-step plan in words; a step that needs an amount not found yet fails. Returns the amount it ends with. */
function runPlan(choice, asked) {
  const known = new Map(); let cur = null;
  const pick = (v, t) => (asked == null ? v : v.mul(t[asked]).div(t[0] + t[1]));
  for (const raw of norm(choice).split(/(?<=\.)\s+/)) {
    const s = raw.replace(/^(First|Then)\s+/i, '').replace(/\.$/, '');
    let m;
    if ((m = s.match(new RegExp(`^Add ([\\d.]+)% of ${N} and take ([\\d.]+)% off ${N}, both from ${N}$`, 'i')))) { const W = D(m[2]); cur = W.add(W.mul(P(m[1]))).sub(W.mul(P(m[3]))); continue; }
    if ((m = s.match(new RegExp(`^take ([\\d.]+)% off ${N}(?: to get the ([\\w ]+))?$`, 'i')))) { cur = D(m[2]).mul(one.sub(P(m[1]))); if (m[3]) known.set(m[3], cur); continue; }
    if ((m = s.match(/^add ([\d.]+)% of the ([\w ]+)$/i))) { if (!known.has(m[2])) return null; cur = known.get(m[2]).mul(one.add(P(m[1]))); continue; }
    if ((m = s.match(new RegExp(`^find ([\\d.]+)% of ${N}(?: to get the ([\\w ]+))?$`, 'i')))) { cur = D(m[2]).mul(P(m[1])); if (m[3]) known.set(m[3], cur); continue; }
    if ((m = s.match(/^find ([\d.]+)% of (art's share)$/i))) { if (!known.has(m[2])) return null; cur = known.get(m[2]).mul(P(m[1])); continue; }
    if ((m = s.match(new RegExp(`^split ${N} ${R}(?: to get (art's share))?$`, 'i')))) { const v = share(D(m[1]), [+m[2], +m[3]], 0); if (m[4]) known.set(m[4], v); cur = v; continue; }
    if ((m = s.match(/^split all (\d[\d,]*) tickets (\d+) : (\d+)$/i))) { cur = pick(D(m[1]), [+m[2], +m[3]]); continue; }
    if ((m = s.match(/^split the ([\w ]+?) (\d+) : (\d+)$/i))) { if (!known.has(m[1])) return null; cur = pick(known.get(m[1]), [+m[2], +m[3]]); continue; }
    if ((m = s.match(/^split (?:them|that [\d.]+%) (\d+) : (\d+)$/i))) { if (!cur) return null; cur = pick(cur, [+m[1], +m[2]]); continue; }
    if (/^That gives the student tickets$/i.test(s) || /^that is the paint money$/i.test(s)) continue;
    throw new Error(`plan step ${s}`);
  }
  return cur;
}
/** run an arrow plan "$12 × 20 → take 10% off → subtract $30" */
function runArrows(choice, ctx) {
  let cur = null;
  for (const s of norm(choice).split('→').map(x => x.trim())) {
    let m;
    if ((m = s.match(new RegExp(`^${N} × (\\d+)$`)))) { if (cur) return null; cur = D(m[1]).mul(+m[2]); continue; }
    if ((m = s.match(/^take ([\d.]+)% off(?: food's share)?$/i))) { if (!cur) return null; cur = cur.mul(one.sub(P(m[1]))); continue; }
    if ((m = s.match(new RegExp(`^subtract ${N}$`, 'i')))) { if (!cur) return null; cur = cur.sub(D(m[1])); continue; }
    if ((m = s.match(new RegExp(`^add ${N}$`, 'i')))) { if (!cur) return null; cur = cur.add(D(m[1])); continue; }
    if ((m = s.match(new RegExp(`^split ${N}$`, 'i')))) { if (cur || !ctx) return null; cur = share(D(m[1]), ctx.terms, 0); continue; }
    throw new Error(`arrow step ${s}`);
  }
  return cur;
}
/** the audit / fix-the-solution stories: every amount the right solution names */
function auditStory(text) {
  const p = norm(text); let m;
  if ((m = p.match(new RegExp(`Dinner is ${N} before tax, plus ([\\d.]+)% tax\\. The tip is ([\\d.]+)% of the bill (before|with) tax`)))) {
    const B = D(m[1]), t = P(m[2]), tp = P(m[3]), tax = B.mul(t);
    return { kind: 'tip', B, tax, withTax: B.add(tax), tipPc: tp, tipWhole: m[4] === 'before' ? B : B.add(tax), tip: (m[4] === 'before' ? B : B.add(tax)).mul(tp), taxPc: t };
  }
  if ((m = p.match(new RegExp(`A ${N} \\w+ is ([\\d.]+)% off, then ([\\d.]+)% tax is added to the sale price`)))) {
    const W = D(m[1]), d = P(m[2]), t = P(m[3]), sale = W.mul(one.sub(d));
    return { kind: 'sale', W, d, t, sale, tax: sale.mul(t), total: sale.mul(one.add(t)), net: one.sub(one.sub(d).mul(one.add(t))) };
  }
  if ((m = p.match(new RegExp(`Budget ${N}, art to music ${R}\\. Art spends ([\\d.]+)% of its share on paint`)))) {
    const B = D(m[1]), t = [+m[2], +m[3]], art = share(B, t, 0), pc = P(m[4]);
    return { kind: 'paint', B, terms: t, art, pc, paint: art.mul(pc) };
  }
  throw new Error('audit story');
}
const auditLines = h => String(h ?? '').split(/<br\s*\/?>/).slice(1).map(l => norm(l.replace(/<[^>]+>/g, '').replace(/&#8202;|&thinsp;|&nbsp;/g, ' ').replace(/&minus;/g, '-').replace(/&times;/g, '×').replace(/&divide;/g, '÷'))).filter(l => /^\d+\./.test(l));
/** does a solution line use the right amounts (its value is the right value of what it names)? */
function lineOk(line, st) {
  const s = line.replace(/^\d+\.\s*/, ''); let m;
  const val = () => D(must(s.match(/= \$?([\d,.]+)$/), 'line value')[1]);
  if (st.kind === 'tip') {
    if ((m = s.match(/^Tax: ([\d.]+)% of \$([\d,.]+) = /))) return P(m[1]).eq(st.taxPc) && D(m[2]).eq(st.B) && val().eq(st.tax);
    if (/^Bill with tax:/.test(s)) return val().eq(st.withTax);
    if ((m = s.match(/^Tip: ([\d.]+)% of \$([\d,.]+) = /))) return P(m[1]).eq(st.tipPc) && D(m[2]).eq(st.tipWhole) && val().eq(st.tip);
  }
  if (st.kind === 'sale') {
    if ((m = s.match(/^Sale price: \$([\d,.]+) - ([\d.]+)% of \$([\d,.]+) = /))) return D(m[1]).eq(st.W) && P(m[2]).eq(st.d) && D(m[3]).eq(st.W) && val().eq(st.sale);
    if ((m = s.match(/^Sale price: \$([\d,.]+) × ([\d.]+) = /))) return D(m[1]).eq(st.W) && D(m[2]).eq(one.sub(st.d)) && val().eq(st.sale);
    if ((m = s.match(/^Tax: ([\d.]+)% of \$([\d,.]+) = /))) return P(m[1]).eq(st.t) && D(m[2]).eq(st.sale) && val().eq(st.tax);
    if (/^Total:/.test(s)) return val().eq(st.total);
    if ((m = s.match(/^([\d.]+)% off and ([\d.]+)% tax make ([\d.]+)% off in all\.?$/))) return P(m[3]).eq(st.net);
  }
  if (st.kind === 'paint') {
    if (/^Art's share:/.test(s)) return val().eq(st.art);
    if ((m = s.match(/^Paint: ([\d.]+)% of \$([\d,.]+) = /))) return P(m[1]).eq(st.pc) && D(m[2]).eq(st.art) && val().eq(st.paint);
  }
  throw new Error(`audit line ${s}`);
}

// ---------------------------------------------------------------- sanity of the item's world
const COUNT_UNITS = /^(students|tickets|fans|adults|joggers|songs|people|members|walkers|players)$/;
function sanity(q, r) {
  const probs = [];
  if (q.input === 'choice') {
    if (Array.isArray(r)) {
      const n = r.filter(Boolean).length;
      if (n === 0) probs.push('no choice is right');
      if (n > 1) probs.push(`${n} choices are right`);
    }
  } else if (r && typeof r === 'object' && 'n' in r) {
    if (r.cmp(0) <= 0) probs.push(`the answer would be ${r}`);
    if (COUNT_UNITS.test(q.unit) && r.d !== 1) probs.push(`${r.value.toFixed(3)} ${q.unit}`);
    if (q.unit === 'dollars' && r.mul(100).d !== 1 && !/rounding/.test(q.family)) probs.push(`the money answer ${r.value} is not a whole number of cents`);
  }
  // money shown with more than two decimals (on the board or in the prompt)
  const shown = `${q.prompt} ${String(q.board).replace(/\\\$/g, '$')}`;
  const odd = shown.match(/\$\d[\d,]*\.\d{3,}/);
  if (odd) probs.push(`money shown as ${odd[0]}`);
  // the board's amounts should be the prompt's amounts
  const bnum = (String(q.board).replace(/\{,\}/g, '').match(/\d+(?:\.\d+)?/g) ?? []).map(Number);
  const pnum = (norm(q.prompt).replace(/(\d),(\d{3})/g, '$1$2').match(/\d+(?:\.\d+)?/g) ?? []).map(Number);
  const missing = bnum.filter(x => !pnum.some(y => Math.abs(x - y) < 1e-9) && ![0, 1, 2, 100].includes(x) && !/xrightarrow\{\\times|\\times \d|\\div/.test(q.board));
  if (missing.length && !/^(netChange|direction|undo)$/.test(q.family)) probs.push(`the board shows ${missing.join(', ')}, not in the story`);
  // count worlds: every middle amount of a count story must be whole
  const p = norm(q.prompt); let m;
  if (q.family === 'percentRatio' && (m = p.match(/printed (\d+) tickets, and ([\d.]+)% of them were sold/)) && D(m[1]).mul(P(m[2])).d !== 1) probs.push('a fractional number of tickets sold');
  if (q.family === 'percentRatio' && (m = p.match(/There are (\d+) students in grade \d+, and ([\d.]+)% of them joined/)) && D(m[1]).mul(P(m[2])).d !== 1) probs.push('a fractional number of club members');
  if (q.family === 'percentRatioGrow' && (m = p.match(/had (\d+) members last year\. Membership grew by ([\d.]+)%/)) && D(m[1]).mul(one.add(P(m[2]))).d !== 1) probs.push('a fractional number of members');
  if (q.family === 'transfer' && (m = p.match(/(\d+) people signed up for a \d+K, but ([\d.]+)% did not show up/)) && D(m[1]).mul(one.sub(P(m[2]))).d !== 1) probs.push('a fractional number of people');
  if (q.family === 'percentThenRate' && /songs/.test(p) && r && 'n' in r) {
    const mm = p.match(new RegExp(`A ${N} gift card loses ([\\d.]+)% to a fee before you can use it\\. Songs cost ${N} each`));
    if (mm && D(mm[1]).mul(one.sub(P(mm[2]))).div(D(mm[3])).d !== 1) probs.push('the songs do not use up the card exactly (answer is rounded down)');
  }
  if ((q.family === 'ratioPercent' || q.family === 'ratioPercentRest') && /fans/.test(p)) {
    try { const st = ratioPercentStory(q.prompt); if (st.part.d !== 1) probs.push('a fractional number of fans'); } catch { /* read above */ }
  }
  if (q.family === 'orderPlan' && (m = p.match(/adult to student (\d+) : (\d+)\. Of the (\d+) tickets printed, ([\d.]+)% were sold/))) {
    const sold = D(m[3]).mul(P(m[4]));
    if (sold.d !== 1 || sold.mul(+m[2]).div(+m[1] + +m[2]).d !== 1) probs.push('a fractional number of tickets');
  }
  if (q.family === 'doubleTest') {
    if ((m = p.match(/mixed (\d+) parts? blue to (\d+) parts? white\. (\d+) cups of blue need (\d+) cups of white/)) && !D(m[3]).mul(+m[2]).eq(D(m[4]).mul(+m[1]))) probs.push('the example does not fit the mix');
    if ((m = p.match(new RegExp(`tips ([\\d.]+)% of the bill\\. On a ${N} bill, the tip is ${N}\\.`))) && !D(m[2]).mul(P(m[1])).eq(D(m[3]))) probs.push('the example tip is wrong');
    if ((m = p.match(new RegExp(`Sales tax is ([\\d.]+)%\\. On ${N}, the tax is ${N}\\.`))) && !D(m[2]).mul(P(m[1])).eq(D(m[3]))) probs.push('the example tax is wrong');
    if ((m = p.match(/(\d+) years older than her brother\. When he was (\d+), she was (\d+)\./)) && +m[2] + +m[1] !== +m[3]) probs.push('the example ages do not fit');
    if ((m = p.match(new RegExp(`charges ${N} per family, however many people come\\. A family of \\d+ paid ${N}\\.`))) && !D(m[1]).eq(D(m[2]))) probs.push('the example fee is wrong');
  }
  if (q.family === 'checkPercent' && (m = p.match(new RegExp(`splits ${N} art to music ${R} \\(art gets ${N}\\)`))) && !share(D(m[1]), [+m[2], +m[3]], 0).eq(D(m[4]))) probs.push("the art share in brackets is wrong");
  if ((q.family === 'rounding' || q.family === 'roundingTip')) {
    try {
      if ((m = p.match(new RegExp(`A ${N} \\w+ is ([\\d.]+)% off, and ([\\d.]+)% sales tax`)))) {
        const W = D(m[1]), d = P(m[2]), t = P(m[3]);
        if (/The store rounds/.test(p)) { const sale = W.mul(one.sub(d)); if (isTie(sale) || isTie(roundQ(sale).mul(t))) probs.push('a cent rounding lands on a .5 tie'); }
        else if (isTie(W.mul(one.sub(d)).mul(one.add(t)))) probs.push('the total lands on a .5 cent tie');
      }
      if ((m = p.match(new RegExp(`Dinner costs ${N}\\. Sales tax is ([\\d.]+)%, and the tip is ([\\d.]+)%`)))) {
        const B = D(m[1]), t = P(m[2]), tp = P(m[3]);
        if (/Round the tax/.test(p)) { const tax = roundQ(B.mul(t)); if (isTie(B.mul(t)) || isTie(B.add(tax).mul(tp))) probs.push('a cent rounding lands on a .5 tie'); }
        else if (isTie(B.mul(one.add(t)).mul(one.add(tp)))) probs.push('the total lands on a .5 cent tie');
      }
    } catch { /* fine */ }
  }
  // estimate: the nearest-but-wrong choice is often the "forgot the tax" amount; with tax the total must be above it, so
  // a careful estimate still tells them apart (not flagged)
  return probs.join('; ');
}

// ---------------------------------------------------------------- contract
const pickRight = arr => {
  if (!Array.isArray(arr)) return undefined;
  const hits = arr.map((ok, i) => (ok ? i : -1)).filter(i => i >= 0);
  return hits.length >= 1 ? hits[0] : -1;   // -1: no choice is right (sane says so)
};
const out = (q, v) => {
  if (!(v && typeof v === 'object' && 'n' in v)) return v;
  if (q.unit === 'dollars' && v.cmp(0) > 0) return roundQ(v).value;   // money to the cent, as a student types it
  return v.value;
};
function run(q) {
  const f = F[q.family];
  if (!f) return { r: undefined };
  return { r: f(q) };
}
export default {
  solve(q) {
    let r;
    try { r = run(q).r; } catch { return undefined; }
    if (r === undefined) return undefined;
    if (q.input === 'choice') return pickRight(r);
    return out(q, r);
  },
  sane(q) {
    let r;
    try { r = run(q).r; } catch (e) { return F[q.family] ? `could not read the item (${e.message})` : ''; }
    return sanity(q, r);
  },
};
