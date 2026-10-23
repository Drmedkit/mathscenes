// Oracle for the lesson "ratio-problems" (ratio problems with fractions and decimals, 7.RP.A.1-3), role O in
// docs/lessons/QUALITY_LAYER.md. Every answer is worked out from the story the student reads (the given pair, the
// question, any rounding instruction) with exact fractions; choice items are judged claim by claim: a choice is right
// only when its verdict is true AND every number and reason in it is true and supports that verdict.
import { Q, round } from '../../tools/quality/oracle-kit.mjs';

// ---------------------------------------------------------------- reading
const NUM = '(\\d+ \\d+\\/\\d+|\\d+\\/\\d+|\\d+(?:\\.\\d+)?|\\.\\d+)';
const qv = s => Q(String(s).replace(/[$,…]/g, '').replace(/−/g, '-').trim());
const SING = { feet: 'foot', foot: 'foot', lb: 'pound', ft: 'foot', mi: 'mile', gal: 'gallon', h: 'hour' };
function kindOf(w) {
  w = String(w ?? '').toLowerCase().trim();
  if (SING[w]) return SING[w];
  if (/(ches|shes|sses|xes)$/.test(w)) return w.slice(0, -2);
  if (/s$/.test(w) && !/ss$/.test(w)) return w.slice(0, -1);
  return w;
}
const STOP = new Set(['and', 'in', 'is', 'for', 'from', 'on', 'to', 'the', 'more', 'times', 'per', 'a', 'of', 'with', 'than', 'at', 'go', 'goes', 'buy', 'cost', 'costs', 'by', 'or', 'pieces', 'less', 'as']);
/** quantities in a text: { v, kind } ("3 cups of flour" → flour, "$20" → dollar, "4 feet of chain" → foot) */
function quants(s) {
  const out = [];
  const re = new RegExp(`(\\$)?${NUM}((?:\\s+[A-Za-z]+){0,3})`, 'g');
  for (const m of String(s).matchAll(re)) {
    const w = m[3].trim().split(/\s+/).filter(Boolean).map(x => x.toLowerCase());
    let kind = '';
    if (m[1]) kind = 'dollar';
    else if (w.length && /^cups?$/.test(w[0]) && w[1] === 'of') kind = kindOf(w[2]);
    else if (w.length && !STOP.has(w[0])) kind = kindOf(w[0]);
    out.push({ v: qv(m[2]), kind });
  }
  return out;
}
/** the given pair of the story (its first sentence): { kindA: vA, kindB: vB, order: [kindA, kindB] } */
function story(p) {
  const s = p.split(/(?<=\.)\s+/)[0];
  let m;
  const f = {};
  const set = (a, va, b, vb) => { f[a] = qv(va); f[b] = qv(vb); f.order = [a, b]; return f; };
  if ((m = s.match(new RegExp(`^${NUM} pounds? of (?:cherries|grapes) costs? \\$${NUM}`)))) return set('pound', m[1], 'dollar', m[2]);
  if ((m = s.match(new RegExp(`^${NUM} (?:feet|foot) of chain weighs? ${NUM} pounds?`)))) return set('foot', m[1], 'pound', m[2]);
  if ((m = s.match(new RegExp(`uses ${NUM} cups? of flour for every ${NUM} cups? of milk`)))) return set('flour', m[1], 'milk', m[2]);
  if ((m = s.match(new RegExp(`A car goes ${NUM} miles on ${NUM} gallons? of gas`)))) return set('gallon', m[2], 'mile', m[1]);
  if ((m = s.match(new RegExp(`hikes ${NUM} miles in ${NUM} hours?`)))) return set('hour', m[2], 'mile', m[1]);
  return null;
}
/** what the question asks for */
function askedKind(q) {
  const p = q.prompt;
  const u = String(q.unit).toLowerCase();
  if (!u) {   // a choice item: read the question itself
    let m;
    if ((m = p.match(/How much (\w+) goes/))) return kindOf(m[1]);
    if (/How much do .* cost/.test(p)) return 'dollar';
    if ((m = p.match(/How many (\w+)/))) return kindOf(m[1]);
    if (/What do .* weigh/.test(p)) return 'pound';
    if (/How far/.test(p)) return 'mile';
    if (/How long/.test(p)) return 'foot';
    return '';
  }
  if (u === 'cups') { const m = p.match(/How much (\w+) goes/); return m ? kindOf(m[1]) : 'cup'; }
  if (u === 'dollars') return 'dollar';
  return kindOf(u);
}
/** the given number of the question: a quantity of the story's other kind after the first sentence */
function given(p, f, want) {
  const rest = p.split(/(?<=\.)\s+/).slice(1).join(' ');
  const other = f.order.find(k => k !== want);
  const qs = quants(rest);
  const g = qs.find(x => x.kind === other) ?? qs.find(x => x.kind === '' ) ;
  if (!g) throw new Error('no given number: ' + p);
  return g.v;
}
/** a rounding instruction → decimal places (null = exact) */
function places(p) {
  if (/nearest cent/.test(p)) return 2;
  if (/nearest hundredth/.test(p)) return 2;
  if (/nearest tenth/.test(p)) return 1;
  if (/nearest whole/.test(p)) return 0;
  return null;
}
const cents = v => round(v.value, 2);
/** exact answer of a missing-value story (a Q) */
function missing(q) {
  const f = story(q.prompt);
  if (!f) throw new Error('unknown story: ' + q.prompt);
  const want = askedKind(q);
  const other = f.order.find(k => k !== want);
  if (!(want in f)) throw new Error(`asked ${want} not in story`);
  return given(q.prompt, f, want).mul(f[want]).div(f[other]);
}
/** as the student types it: rounded as asked; money to the cent; frac input exact */
function typed(q, v) {
  if (q.input === 'frac') return v.pair;
  const pl = places(q.prompt);
  if (pl !== null) return round(v.value, pl);
  if (askedKind(q) === 'dollar' && !v.mul(100).eq(Q(Math.round(v.value * 100)))) return cents(v);
  return v.value;
}
/** index of the one choice that passes; -1 when none or several do */
function pick(q, pred) {
  const hits = (q.choices ?? []).map((c, i) => (pred(c.replace(/’/g, "'").trim(), i) ? i : -1)).filter(i => i >= 0);
  return hits.length === 1 ? hits[0] : -1;
}
/** "2.25 cups of flour and 8.25 cups of milk" / "5 pounds and $20" → { kind: Q } */
function pairOf(text) {
  const o = {};
  for (const x of quants(text)) if (x.kind && !(x.kind in o)) o[x.kind] = x.v;
  return o;
}

// ---------------------------------------------------------------- families
const F = {};
for (const fam of ['scaleUp', 'scaleDown', 'unitRate', 'blockRow', 'exactFrac', 'roundEnd', 'decTable', 'mixed']) F[fam] = q => typed(q, missing(q));

F.sameRatio = q => {
  const f = story(q.prompt);
  const [a, b] = f.order;
  return pick(q, c => {
    const o = pairOf(c);
    const ka = a in o ? a : null, kb = b in o ? b : null;
    // "5 cups of flour and 20 cups of milk" / "5 pounds and $20" / "3 feet and 9 pounds"
    return ka && kb && o[b].mul(f[a]).eq(o[a].mul(f[b]));
  });
};
F.fracOk = q => {
  const f = story(q.prompt);
  const k = qv(q.prompt.match(/You make (.+?) of the recipe/)[1]);
  return pick(q, c => {
    if (/:/.test(c)) return false;   // "...: amounts in a ratio must be whole" is false
    const m = c.match(new RegExp(`^${NUM} cups? of flour and ${NUM} cups? of milk$`));
    return !!m && qv(m[1]).eq(f.flour.mul(k)) && qv(m[2]).eq(f.milk.mul(k));
  });
};
F.findFactor = q => {
  const m = q.prompt.match(new RegExp(`What do you multiply ${NUM} by to get ${NUM}\\?`));
  return qv(m[2]).div(qv(m[1])).pair;
};
function predictBand(q) {
  const f = story(q.prompt);
  const m = q.prompt.match(new RegExp(`the (\\w+) are multiplied by ${NUM}`));
  const k = qv(m[2]);
  const moved = kindOf(m[1]);
  const other = f.order.find(x => x !== moved);
  return { ans: f[other].mul(k), base: f[other] };
}
F.predict = q => {
  const { ans } = predictBand(q);
  const x = ans.value;
  return pick(q, c => {
    let m;
    const n = s => qv(s.replace(/[^\d./]/g, '')).value;
    if ((m = c.match(/^less than (.+)$/))) return x < n(m[1]);
    if ((m = c.match(/^between (.+?) and (.+)$/))) return x > n(m[1]) && x < n(m[2]);
    if ((m = c.match(/^more than (.+)$/))) return x > n(m[1]);
    return false;
  });
};
F.betweenWithin = q => {
  const p = q.prompt;
  const f = story(p);
  // the second pair: "At the same rate, 6 hours go with 15 miles" / "12 pounds go with $36"
  const s2 = p.match(/At the same rate, (.+?) go with (.+?)\. Which/);
  const o2 = pairOf(s2[1] + ' ' + s2[2]);
  const [a, b] = f.order;
  const mult = o2[a].div(f[a]);
  const askMult = /multiplier from the first pair to the second/.test(p);
  return pick(q, c => {
    let m;
    if ((m = c.match(/^×(\S+) \(no unit\)$/))) return askMult && qv(m[1]).eq(mult) && o2[b].div(f[b]).eq(mult);
    if ((m = c.match(/^\$(\S+) per (\w+)$/))) return !askMult && kindOf(m[2]) in f && f.dollar.div(f[kindOf(m[2])]).eq(qv(m[1]));
    if ((m = c.match(/^(\S+) (\w+) per (\w+)$/))) { const u = kindOf(m[2]), w = kindOf(m[3]); return !askMult && u in f && w in f && u !== w && f[u].div(f[w]).eq(qv(m[1])); }
    return false;   // "+8 miles" / "−$12": a difference is neither
  });
};
F.pickBlock = q => {
  const f = story(q.prompt);
  const a = f[f.order[0]], t = qv(q.prompt.match(new RegExp(`amount for ${NUM}`))[1]);
  const divides = (d, x) => x.div(d).d === 1;
  const vals = (q.choices ?? []).map(c => {
    const v = qv(c.match(/^(\S+)/)[1]);
    const claim = c.match(/both (\S+) and (\S+) are multiples of (\S+)$/);
    const claimOk = !claim || (divides(qv(claim[3]), qv(claim[1])) && divides(qv(claim[3]), qv(claim[2])) && qv(claim[3]).eq(v));
    return divides(v, a) && divides(v, t) && claimOk ? v.value : -1;
  });
  const best = Math.max(...vals);
  return vals.filter(v => v === best).length === 1 && best > 0 ? vals.indexOf(best) : -1;
};
F.longDiv = q => {
  const m = q.prompt.match(new RegExp(`write ${NUM} ÷ ${NUM} to the (tenths|hundredths|thousandths) place, without rounding`));
  const pl = { tenths: 1, hundredths: 2, thousandths: 3 }[m[3]];
  const v = qv(m[1]).div(qv(m[2]));
  const k = 10 ** pl;
  return Math.floor(v.n * k / v.d) / k;   // cut off, not rounded
};
F.complexRate = q => {
  const p = q.prompt;
  const fr = String(p).match(new RegExp(`^${NUM} (?:cup|gallon)s? of \\w+ (?:makes?|covers?) ${NUM} of a`));
  if (fr) return qv(fr[1]).div(qv(fr[2])).pair;
  const w = p.match(new RegExp(`walks ${NUM} miles? in ${NUM} hours?`));
  if (w) return qv(w[1]).div(qv(w[2])).pair;
  throw new Error('unknown complexRate story');
};
F.writeK = q => {
  const f = story(q.prompt);
  const m = q.prompt.match(/Let x be the (\w+)(?: in \w+)? and y be the (\w+)(?: in (\w+))?/);
  const kx = m[1] === 'cost' ? 'dollar' : kindOf(m[1]), ky = m[2] === 'cost' ? 'dollar' : kindOf(m[2]);
  const k = f[ky].div(f[kx]);
  return pick(q, c => { const r = c.match(/^y = (\S+)x$/); return !!r && qv(r[1]).eq(k); });
};
F.useK = q => {
  const m = q.prompt.match(new RegExp(`y = ${NUM}x.*Find (x|y) when (x|y) = ${NUM}\\.`));
  const k = qv(m[1]), v = qv(m[4]);
  return (m[2] === 'y' ? v.mul(k) : v.div(k)).value;
};
F.isProp = q => {
  const p = q.prompt;
  const kind = /nothing else/.test(p) ? 'prop' : /charges \$\S+ to \w+, plus/.test(p) ? 'fixed' : /years older/.test(p) ? 'diff' : /musicians plays? a song/.test(p) ? 'constant' : null;
  if (!kind) throw new Error('unknown isProp story');
  return pick(q, c => {
    if (/^Yes: double one amount, and the other doubles too\.$/.test(c)) return kind === 'prop';
    if (/^No: there is a fixed part, so the second ÷ the first changes\.$/.test(c)) return kind === 'fixed';
    if (/^No: the difference stays the same, not the ratio\.$/.test(c)) return kind === 'diff';
    if (/^No: the answer does not change with that number\.$/.test(c)) return kind === 'constant';
    return false;
  });
};
/** the most efficient route for given → target (first quantity), with the rate second ÷ first */
function bestMethod(g, t, rate) {
  const r = t.div(g);
  if (r.d === 1) return 'whole';                                   // 6 → 18: × 3
  const gi = g.d === 1 && t.d === 1 ? gcd(g.n, t.n) : 1;
  if (gi > 1) return 'block';                                        // 9 → 15: through 3
  if (terminates(rate)) return 'rate';                               // 10 lb : 18 → 1.8 per one
  return 'exact';                                                    // 8 : 9 → 25 with a repeating rate: × 25/8 kept exact
}
const gcd = (a, b) => { a = Math.abs(a); b = Math.abs(b); while (b) [a, b] = [b, a % b]; return a; };
const terminates = v => { let d = v.d; while (d % 2 === 0) d /= 2; while (d % 5 === 0) d /= 5; return d === 1; };
F.chooseMethod = q => {
  const f = story(q.prompt);
  const want = askedKind(q), other = f.order.find(k => k !== want);
  const t = given(q.prompt, f, want);
  const best = bestMethod(f[other], t, f[want].div(f[other]));
  const RE = { whole: /^Multiply both by a whole number$/, rate: /^Go through the rate for one$/, block: /^Go through a building-block row$/, exact: /^Keep an exact fraction multiplier$/ };
  return pick(q, c => RE[best].test(c));
};
F.unitCheck = q => {
  const p = q.prompt;
  const f = story(p);
  const ask = p.match(/asks for (\w+) per (\w+)\./);
  const [U, W] = [kindOf(ask[1]), kindOf(ask[2])];
  const kai = p.match(new RegExp(`Kai writes: ${NUM} ÷ ${NUM} = ${NUM} (\\w+) per (\\w+)\\.`));
  const kindOfNum = v => { const ks = f.order.filter(k => f[k].eq(qv(v))); return ks.length === 1 ? ks[0] : null; };
  const [ka, kb] = [kindOfNum(kai[1]), kindOfNum(kai[2])];
  const kaiRight = ka === U && kb === W && qv(kai[1]).div(qv(kai[2])).eq(qv(kai[3])) && kindOf(kai[4]) === U && kindOf(kai[5]) === W;
  return pick(q, c => {
    let m;
    if ((m = c.match(new RegExp(`^Right: \\$?${NUM} (?:(\\w+) )?÷ \\$?${NUM} (?:(\\w+) )?gives (\\w+) per (\\w+), the unit asked for\\.$`)))) {
      const a = c.match(/^Right: (\$)?/)[1] ? 'dollar' : kindOf(m[2]);
      const bDollar = /÷ \$/.test(c);
      const b = bDollar ? 'dollar' : kindOf(m[4]);
      return kaiRight && a === U && b === W && kindOf(m[5]) === U && kindOf(m[6]) === W;
    }
    if ((m = c.match(new RegExp(`^Wrong: ${NUM} ÷ ${NUM} gives (\\w+) per (\\w+)\\. It should be ${NUM} ÷ ${NUM} = ${NUM} (\\w+) per (\\w+)\\.$`)))) {
      const gives = [kindOfNum(m[1]), kindOfNum(m[2])];
      const fix = [kindOfNum(m[5]), kindOfNum(m[6])];
      return !kaiRight && qv(m[1]).eq(qv(kai[1])) && qv(m[2]).eq(qv(kai[2])) && gives[0] === kindOf(m[3]) && gives[1] === kindOf(m[4])
        && fix[0] === U && fix[1] === W && qv(m[5]).div(qv(m[6])).eq(qv(m[7])) && kindOf(m[8]) === U && kindOf(m[9]) === W;
    }
    return false;   // "the unit can go either way"
  });
};
F.mixedUnits = q => {
  const p = q.prompt;
  let m, v;
  if ((m = p.match(new RegExp(`rides ${NUM} miles per hour\\. How far does she ride in ${NUM} minutes\\? \\(${NUM} minutes = 1 hour\\.\\)`)))) v = qv(m[1]).mul(qv(m[2])).div(qv(m[3]));
  else if ((m = p.match(new RegExp(`costs \\$${NUM} per pound\\. Lee buys ${NUM} ounces\\. \\(${NUM} ounces = 1 pound\\.\\)`)))) v = qv(m[1]).mul(qv(m[2])).div(qv(m[3]));
  else if ((m = p.match(new RegExp(`costs \\$${NUM} per foot\\. What do ${NUM} inch(?:es)? cost\\? \\(${NUM} inches = 1 foot\\.\\)`)))) v = qv(m[1]).mul(qv(m[2])).div(qv(m[3]));
  else throw new Error('unknown mixedUnits story');
  return q.unit === 'dollars' ? cents(v) : v.value;
};
F.ratioCheck = q => {
  const p = q.prompt;
  const f = story(p);
  const s = p.match(/Sam says (.+?) go with (.+?)\. Check/);
  const o = pairOf(s[1] + ' ' + s[2]);
  const [a, b] = f.order;
  const same = o[b].mul(f[a]).eq(o[a].mul(f[b]));
  return pick(q, c => {
    let m;
    if ((m = c.match(new RegExp(`^It checks: ${NUM} ÷ ${NUM} = ${NUM} ÷ ${NUM}\\.$`)))) return same && qv(m[1]).eq(o[b]) && qv(m[2]).eq(o[a]) && qv(m[3]).eq(f[b]) && qv(m[4]).eq(f[a]);
    if ((m = c.match(new RegExp(`^It does not check: ${NUM} ÷ ${NUM} ≠ ${NUM} ÷ ${NUM}\\.$`)))) return !same && qv(m[1]).eq(o[b]) && qv(m[2]).eq(o[a]) && qv(m[3]).eq(f[b]) && qv(m[4]).eq(f[a]);
    return false;   // "about the right size", "both went up by 4"
  });
};
/** E truncated to the decimals of the stated "exact" value: does "$22.909…" fit E = 22.90909? */
const startsAs = (shown, E) => { const d = (String(shown).split('.')[1] ?? '').length; const k = 10 ** d; return Math.floor(E.value * k + 1e-9) / k === Number(shown); };
F.roundCheck = q => {
  const p = q.prompt;
  const f = story(p);
  const m = p.match(new RegExp(`Kim says ${NUM} pounds? cost \\$${NUM}, to the nearest cent`));
  const E = qv(m[1]).mul(f.dollar).div(f.pound), K = Number(m[2]), R = cents(E);
  return pick(q, c => {
    let r;
    if ((r = c.match(/^It checks: the exact cost is \$(\S+)…, which rounds to \$(\S+)\.$/))) return K === R && Number(r[2]) === R && startsAs(r[1], E);
    if ((r = c.match(/^It does not check: the exact cost is \$(\S+)…, which rounds to \$([\d.]+)(?:, not \$(\S+))?\.$/))) return K !== R && Number(r[2]) === R && startsAs(r[1], E) && (!r[3] || Number(r[3]) === K);
    return false;   // "is not exactly" (a rounded answer never is), "close enough"
  });
};
F.sizeCheck = q => {
  const p = q.prompt;
  const f = story(p);
  const m = p.match(new RegExp(`Jo works out the \\w+ for ${NUM} (\\w+) and gets \\$?${NUM}`));
  const gk = kindOf(m[2]), want = f.order.find(k => k !== gk);
  const E = qv(m[1]).mul(f[want]).div(f[gk]).value, J = Number(m[3]);
  const ok = Math.abs(J - E) <= 0.05 * E;
  const near = c => c > 0 && c / E < 1.6 && E / c < 1.6;
  const n = s => Number(String(s).replace(/[$,]/g, ''));
  return pick(q, c => {
    let r;
    if ((r = c.match(/^Not reasonable: about (\S+) × (\S+) ≈ (\S+)\.$/))) return !ok && Math.abs(n(r[1]) * n(r[2]) - n(r[3])) < 1e-9 && near(n(r[3]));
    if ((r = c.match(/^Not reasonable: it should be about (\S+?)(?: \w+)?\.$/))) return !ok && near(n(r[1]));
    if ((r = c.match(/^Reasonable: about (\S+) × (\S+) ≈ (\S+), close to (\S+?)(?: \w+)?\.$/))) return ok && Math.abs(n(r[1]) * n(r[2]) - n(r[3])) < 1e-9 && near(n(r[3])) && n(r[4]) === J;
    return false;   // "in the unit asked for", "step by step", "more ... so less" (more pounds cost more, not less)
  });
};
F.audit = q => {
  const p = q.prompt;
  let E, A, money = true, m;
  if ((m = p.match(new RegExp(`^${NUM} painters paint a fence in ${NUM} hours\\. Ana: “${NUM} painters .*= ${NUM} hours\\.”`)))) {
    E = qv(m[1]).mul(qv(m[2])).div(qv(m[3])); A = qv(m[4]); money = false;
  } else {
    const f = story(p);
    m = p.match(new RegExp(`Ana finds the cost of ${NUM} pounds?: “.*\\$${NUM}\\.”`));
    E = qv(m[1]).mul(f.dollar).div(f.pound); A = qv(m[2]);
  }
  const right = money ? cents(E) === A.value : E.eq(A);
  const val = s => qv(String(s).replace(/[$,]/g, ''));
  const isE = s => (money ? val(s).value === cents(E) : val(s).eq(E));
  return pick(q, c => {
    let r;
    if (/^Correct\. Units match \(dollars per pound\), the ratio checks, and the size is right\.$/.test(c)) return right;
    if (/^Correct:/.test(c)) return false;   // "between the smallest and largest", "same steps again" prove nothing
    if (/^Wrong: the answer should be about twice as much\.$/.test(c)) return !right && E.value / A.value > 1.7 && E.value / A.value < 2.3;
    if ((r = c.match(/^Wrong\. .*(?:It is|so|=) (\$?[\d.,\/]+)\.$/)) && !/About/.test(c)) return !right && isE(r[1]);
    if ((r = c.match(/^Wrong\. Not proportional: .*About (\S+) hours\.$/))) return !right && !money && val(r[1]).eq(E);
    return false;
  });
};

// ---------------------------------------------------------------- the world
function sane(q) {
  const probs = [];
  const p = q.prompt;
  const f = story(p);
  if (f) {
    if (f.order[0] === 'gallon') { const mpg = f.mile.div(f.gallon).value; if (mpg < 10 || mpg > 60) probs.push(`a car at ${+mpg.toFixed(1)} miles per gallon`); }
    if (f.order[0] === 'hour') { const mph = f.mile.div(f.hour).value; if (mph > 5) probs.push(`a hiker at ${+mph.toFixed(2)} mph`); }
    if (f.order[0] === 'pound' && f.dollar) { const pp = f.dollar.div(f.pound).value; if (pp < 1 || pp > 15) probs.push(`${/grapes/.test(p) ? 'grapes' : 'cherries'} at $${pp.toFixed(2)} a pound`); }
    if (f.order[0] === 'flour') { const r = f.flour.div(f.milk).value; if (r > 3 || r < 1 / 3) probs.push(`a pancake recipe with flour : milk = ${f.flour} : ${f.milk}`); }
  }
  let m;
  if ((m = p.match(new RegExp(`cyclist rides ${NUM} miles per hour`))) && qv(m[1]).value > 30) probs.push(`a cyclist at ${m[1]} mph`);
  // a rounding asked of an exact .x5 tie
  const pl = places(p);
  if (pl !== null && ['roundEnd', 'decTable', 'mixed'].includes(q.family)) {
    try { const v = missing(q).value * 10 ** pl; if (Math.abs(v - Math.floor(v) - 0.5) < 1e-9) probs.push('the exact value is a tie (…5) for the rounding asked'); } catch { /* not a story */ }
  }
  if (q.family === 'roundCheck') {
    const r = p.match(new RegExp(`Kim says ${NUM} pounds? cost`));
    if (f && r) { const v = qv(r[1]).mul(f.dollar).div(f.pound).value * 100; if (Math.abs(v - Math.floor(v) - 0.5) < 1e-9) probs.push(`the exact cost $${(v / 100).toFixed(3)} is a tie for rounding to the cent, shown with "…"`); }
  }
  // a money answer with fractions of a cent and no rounding asked
  if (['scaleUp', 'unitRate', 'blockRow', 'decTable', 'mixed'].includes(q.family) && q.unit === 'dollars' && pl === null) {
    try { const v = missing(q); if (!v.mul(100).eq(Q(Math.round(v.value * 100)))) probs.push(`a cost of $${v.value.toFixed(4)}… with no rounding asked`); } catch { /* */ }
  }
  // decimals that cannot be typed exactly, with no rounding asked
  if (['scaleUp', 'unitRate', 'blockRow', 'decTable', 'mixed', 'roundEnd'].includes(q.family) && q.input === 'num' && pl === null && q.unit !== 'dollars') {
    try { if (!terminates(missing(q))) probs.push('a repeating decimal answer with no rounding asked'); } catch { /* */ }
  }
  if (q.family === 'predict') {
    try {
      const { ans } = predictBand(q);
      const edges = (q.choices ?? []).flatMap(c => [...c.matchAll(/\$?([\d.]+)/g)].map(x => Number(x[1])));
      if (edges.some(e => Math.abs(e - ans.value) < 1e-9)) probs.push(`the answer ${ans.value} sits on a band edge`);
    } catch { /* */ }
  }
  return [...new Set(probs)].join('; ');
}

function solve(q) {
  const f = F[q.family];
  return f ? f(q) : undefined;
}
export default { solve, sane };
