// Oracle for the lesson "probability-decisions" (HS Statistics 9: using probability to make decisions).
// Written from what the student sees only: the story in the prompt, the board, the choices and the drawn picture
// (decision trees with their probabilities and leaf payoffs, payoff bars, tables). Every net payoff is rebuilt from
// the story (received minus paid, from the named person's side), every distribution is rebuilt from the mechanism
// (die faces, sectors, tickets), and expected values, SDs, fair prices, changeover chances and pooled totals are
// worked out exactly with fractions. Choice items are decided by testing what each statement claims; where a choice
// rests on a preference, the prompt's stated rule is applied. Highlight marks ('hl') are never used.
// Conventions from DESIGN.md: a cost or a loss is negative when a net payoff is typed; expected costs are positive;
// money to the cent; probabilities as decimals or fractions.
// See docs/lessons/QUALITY_LAYER.md, "O: the oracle".
import { Q, choiceWhere, nums, texPlain, round } from '../../tools/quality/oracle-kit.mjs';

// ================================================================ small helpers
const WORDS = { one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10, eleven: 11, twelve: 12 };
const wnum = w => (/^\d+$/.test(w) ? +w : WORDS[String(w).toLowerCase()]);
const P = s => String(s ?? '').replace(/−/g, '-').replace(/[’]/g, "'").replace(/[“”]/g, '"').replace(/(\d),(\d{3})(?!\d)/g, '$1$2').replace(/(\d),(\d{3})(?!\d)/g, '$1$2');
const dec = f => Number(f.value.toFixed(10));
const sumQ = a => a.reduce((s, x) => s.add(x), Q(0));
/** "$1,200" / "−$300" / "-\$1{,}450" → number */
function money(s) {
  const t = P(texPlain(String(s))).replace(/[\s\\]/g, '');
  const m = t.match(/(-?)\$?(-?)(\d+(?:\.\d+)?)/);
  return m ? (m[1] || m[2] ? -1 : 1) * +m[3] : NaN;
}
const M = s => Q(money(s));
const pics = q => q.data?.picture?.pics ?? [];
const cents = v => Math.abs(v * 100 - Math.round(v * 100)) < 1e-7;
/** "−$400 with probability 0.35, $500 with probability 0.2, ..." → [{x, p}] (Q) */
function distText(t) {
  return [...P(t).matchAll(/(-?)\$(\d+(?:\.\d+)?) with probability (\d*\.?\d+)/g)].map(m => ({ x: Q((m[1] ? -1 : 1) * +m[2]), p: Q(m[3]) }));
}
const evD = d => sumQ(d.map(o => o.x.mul(o.p)));
const varD = d => { const m = evD(d); return sumQ(d.map(o => o.x.sub(m).mul(o.x.sub(m)).mul(o.p))); };
const tieAt = (v, places) => { const r = Math.abs(v) * 10 ** places; return Math.abs(r - Math.floor(r) - 0.5) < 1e-7; };

// ================================================================ s1: decision structure
function dsWhich(q) {
  const want = /chance outcome\?/.test(q.prompt) ? 'chance' : 'choice';
  const kind = c => {
    if (/\bcosts?\b|^The prize is/.test(c)) return 'fact';
    if (/^(Buy|Skip|Bring|Hold|Rent|Do not|Don't|Take|Play)\b/.test(c)) return 'choice';
    return 'chance';
  };
  return choiceWhere(q, c => kind(c) === want);
}
function dsBranches(q) {
  const other = P(q.prompt).match(/the other choice, "([^"]+)"/)[1];
  // not taking part at all: chance no longer touches you, one sure $0; skipping cover: the breakage / crash still happens
  if (/^do not\b/i.test(other)) return choiceWhere(q, c => /^None: one sure outcome, a net payoff of \$0$/.test(P(c)));
  return choiceWhere(q, c => /chance still decides the cost$/.test(c) && / or /.test(c));
}

// ================================================================ s1: net payoffs
function netTicketParts(q) {
  const p = P(q.prompt);
  let m;
  if ((m = p.match(/booth charges \$(\d+) a throw\. A ringer \(probability (\d*\.?\d+)\) wins a \$(\d+) prize/))) {
    const c = +m[1], W = +m[3], pr = Q(m[2]);
    const side = /booth's net payoff/.test(p) ? 'booth' : 'player';
    const win = /that is a ringer/.test(p);
    const player = win ? W - c : -c;
    return { v: side === 'player' ? player : -player, probs: [pr, Q(1).sub(pr)] };
  }
  if ((m = p.match(/sells (\d+) raffle tickets at \$(\d+) each\. One ticket is drawn for a \$(\d+) prize/))) {
    const N = +m[1], c = +m[2], W = +m[3];
    return { v: /is not drawn/.test(p) ? -c : W - c, probs: [Q(1, N), Q(N - 1, N)] };
  }
  return null;
}
const netTicket = q => netTicketParts(q)?.v;
function netInsureParts(q) {
  const p = P(q.prompt);
  const m = p.match(/for \$(\d+) a year with a \$(\d+) deductible: after an? ([a-z ]+?) \(probability (\d*\.?\d+) this year\) \w+ pays the first \$(\d+) and the insurer pays the rest of the \$(\d+) loss/);
  if (!m) return null;
  const prem = +m[1], ded = +m[2], pr = Q(m[4]), first = +m[5], loss = +m[6];
  const withP = /with the policy/.test(p), event = !/if nothing happens/.test(p);
  const v = withP ? (event ? -(prem + Math.min(ded, loss)) : -prem) : (event ? -loss : 0);
  return { v, prem, ded, first, loss, pr };
}
const netInsure = q => netInsureParts(q)?.v;

// ================================================================ s1: payoff distributions
/** the prize on each equally likely outcome (die faces or spinner sectors) from the story */
function mechanism(p) {
  p = P(p);
  const cost = +p.match(/costs \$(\d+)/)[1];
  if (/roll one fair die/.test(p)) {
    const pr = [0, 0, 0, 0, 0, 0];
    const seg = p.match(/fair die: (.*?), and any other roll pays nothing/)[1];
    for (const m of seg.matchAll(/an? ([\d, or]+?) pays \$(\d+)/g)) for (const f of m[1].match(/\d+/g)) pr[+f - 1] = +m[2];
    return { cost, prizes: pr };
  }
  const n = +p.match(/spinner with (\d+) equal sectors/)[1];
  const pr = [];
  for (const m of p.matchAll(/(\w+) sectors? pays? \$(\d+)/g)) for (let i = 0; i < wnum(m[1]); i++) pr.push(+m[2]);
  while (pr.length < n) pr.push(0);
  return { cost, prizes: pr };
}
function distDie(q) {
  const { cost, prizes } = mechanism(q.prompt);
  const t = money(P(q.prompt).match(/P\(X = (-?\$\d+)\)/)[1]);
  const k = prizes.filter(x => x - cost === t).length;
  return Q(k, prizes.length).pair;
}
/** a choice "−$149 with probability 0.08; $0 with probability 0.92" → Map value → probability (merged) */
function distChoice(c) {
  const out = new Map();
  for (const m of P(c).matchAll(/(-?)\$(\d+) with probability (\d*\.?\d+)/g)) {
    const x = (m[1] ? -1 : 1) * +m[2];
    out.set(x, (out.get(x) ?? Q(0)).add(Q(m[3])));
  }
  return out;
}
const sameDist = (a, b) => a.size === b.size && [...a].every(([x, p]) => b.has(x) && b.get(x).eq(p));
function distCompleteTarget(q) {
  const p = P(q.prompt);
  const m = p.match(/probability (\d*\.?\d+) of needing a \$(\d+) repair within (\d+) years\. A \d+-year plan for \$(\d+) covers every repair/);
  const pr = Q(m[1]), R = +m[2], plan = +m[4];
  const t = new Map();
  if (/if you buy the plan/.test(p)) t.set(-plan, Q(1));
  else { t.set(-R, pr); t.set(0, Q(1).sub(pr)); }
  return t;
}
const distComplete = q => { const t = distCompleteTarget(q); return choiceWhere(q, c => sameDist(distChoice(c), t)); };

// ================================================================ s1: fair random picks
/** { probs: Map name → Q, intended: Map name → Q | null, kind } from the story */
function pickModel(p) {
  p = P(p);
  let m;
  const probs = new Map(), intended = new Map();
  if (/heads 1-6, tails 7-12|heads 1–6, tails 7–12/.test(p) || /toss a fair coin and roll a fair die/.test(p)) {
    for (let i = 1; i <= 12; i++) { probs.set(`player ${i}`, Q(1, 12)); intended.set(`player ${i}`, Q(1, 12)); }
    return { probs, intended, kind: 'coin' };
  }
  if ((m = p.match(/match tickets bought: (\w+) (\d+), (\w+) (\d+), (\w+) (\d+) \((\d+) tickets\)\. A generator picks 1[–-](\d+): (\w+) (\d+)[–-](\d+), (\w+) (\d+)[–-](\d+), (\w+) (\d+)[–-](\d+)/))) {
    const N = +m[8];
    for (let i = 0; i < 3; i++) intended.set(m[1 + 2 * i], Q(+m[2 + 2 * i], +m[7]));
    for (let i = 0; i < 3; i++) probs.set(m[9 + 3 * i], Q(+m[11 + 3 * i] - +m[10 + 3 * i] + 1, N));
    return { probs, intended, kind: 'raffle', tickets: m, N };
  }
  if (/names go into a hat/.test(p)) return { probs: null, intended: null, kind: 'hat' };
  if ((m = p.match(/picks a whole number from (\d+) to (\d+) to choose who drives: (.*?)\./))) {
    const lo = +m[1], hi = +m[2], N = hi - lo + 1;
    const parts = [...m[3].matchAll(/(\w+) (\d+)[–-](\d+)/g)];
    for (const r of parts) { probs.set(r[1], Q(+r[3] - +r[2] + 1, N)); intended.set(r[1], Q(1, parts.length)); }
    // every number must be used exactly once
    const covered = parts.reduce((s, r) => s + (+r[3] - +r[2] + 1), 0);
    return { probs, intended, kind: 'rng', ok: covered === N, sizes: parts.map(r => [r[1], +r[3] - +r[2] + 1]), N };
  }
  if ((m = p.match(/(\w+) teammates number themselves 1 to (\d+) and roll a fair die to pick the captain; on a (\d+) they roll again/))) {
    const n = +m[2];
    for (let i = 1; i <= n; i++) { probs.set(`teammate ${i}`, Q(1, n)); intended.set(`teammate ${i}`, Q(1, n)); }
    return { probs, intended, kind: 'reroll' };
  }
  if ((m = p.match(/(\w+) friends number themselves 2 to 12, roll two fair dice, and the sum/))) {
    for (let s = 2; s <= 12; s++) { probs.set(`the friend with number ${s}`, Q(6 - Math.abs(s - 7), 36)); intended.set(`the friend with number ${s}`, Q(1, 11)); }
    return { probs, intended, kind: 'sum' };
  }
  if ((m = p.match(/(\w+) roommates number themselves 1 to (\d+) and roll one fair die/))) {
    const n = +m[2];
    for (let i = 1; i <= 6; i++) probs.set(`roommate ${i}`, Q(1, 6));
    for (let i = 1; i <= n; i++) intended.set(`roommate ${i}`, Q(1, n));
    return { probs, intended, kind: 'die', n };
  }
  return null;
}
function fairJudge(q) {
  const md = pickModel(q.prompt);
  if (!md) return undefined;
  const fair = md.kind === 'hat' ? false : [...md.intended].every(([k, v]) => md.probs.get(k)?.eq(v)) && md.probs.size === md.intended.size;
  // reasons that are never a valid argument for the verdict
  const fallacy = /some chance|has a chance to be picked|in the hat once|about the same size|sums for \d+ people|twice in a row|short run|face of the die is wasted/;
  const claimOk = c => {
    const t = P(c);
    let m;
    if ((m = t.match(/(\w+) has (\d+) of the (\d+) numbers; the others have (\d+)/i))) {
      return md.kind === 'rng' && md.sizes.every(([n, s]) => s === (n === m[1] ? +m[2] : +m[4])) && md.N === +m[3];
    }
    if ((m = t.match(/(\w+) bought (\d+) tickets but has only (\d+) numbers; (\w+) has (\d+) for (\d+) tickets/))) {
      if (md.kind !== 'raffle') return false;
      const T = md.tickets, tk = n => +T[2 + 2 * [T[1], T[3], T[5]].indexOf(n)], nn = n => md.probs.get(n).mul(md.N).value;
      return tk(m[1]) === +m[2] && nn(m[1]) === +m[3] && nn(m[4]) === +m[5] && tk(m[4]) === +m[6];
    }
    if ((m = t.match(/sum of (\d+) comes from (\d+) of the 36 rolls; a sum of (\d+) from (\d+)/i))) {
      const w = s => 6 - Math.abs(s - 7);
      return w(+m[1]) === +m[2] && w(+m[3]) === +m[4] && +m[2] !== +m[4];
    }
    return true;
  };
  return choiceWhere(q, c => (fair ? /^Fair\b/.test(c) : /^Not fair\b/.test(c)) && !fallacy.test(c) && claimOk(c));
}
function fairProb(q) {
  const md = pickModel(q.prompt);
  if (!md || !md.probs) return undefined;
  const who = P(q.prompt).match(/probability that (.+?) is chosen\?/)[1];
  const v = md.probs.get(who);
  return v ? v.pair : undefined;
}

// ================================================================ s2: common basis, EV
function basisPeriod(q) {
  const p = P(q.prompt);
  const mo = +p.match(/\$(\d+(?:\.\d+)?) a month/)[1], up = +p.match(/for \$(\d+(?:\.\d+)?)\. The coverage/)[1];
  const yrs = /Over one year/.test(p) ? 1 : wnum(p.match(/Over (\w+) years/)[1]);
  return dec(Q(mo).mul(12 * yrs).sub(up));
}
function basisNet(q) {
  const m = P(q.prompt).match(/sold (\d+) plays at \$(\d+(?:\.\d+)?) each and paid out \$(\d+(?:\.\d+)?) in prizes/);
  return dec(Q(+m[1]).mul(Q(m[2])).sub(Q(m[3])).div(+m[1]));
}
const evNet = q => dec(evD(distText(q.prompt)));
function evRoutesParts(q) {
  const m = P(q.prompt).match(/sells all (\d+) raffle tickets at \$(\d+) each\. One ticket wins \$(\d+) and (\d+) others win \$(\d+) each/);
  return { N: +m[1], c: +m[2], W1: +m[3], k: +m[4], W2: +m[5] };
}
const evRoutes = q => { const r = evRoutesParts(q); return dec(Q(r.W1 + r.k * r.W2, r.N).sub(r.c)); };
function evInsureParts(q) {
  const m = P(q.prompt).match(/costs \$(\d+) a year with a \$(\d+) deductible\. Assume at most one claim a year, with probability (\d*\.?\d+)/);
  return { prem: +m[1], ded: +m[2], pr: Q(m[3]) };
}
const evInsureCost = q => { const r = evInsureParts(q); return dec(r.pr.mul(r.ded).add(r.prem)); };

// ================================================================ s2: fair price and the EV rule
/** "pays $25 with probability 0.02 and $20 with probability 0.25" → expected prize */
function fairPrice(q) {
  const seg = P(q.prompt).match(/It pays (.*?); otherwise nothing/)[1];
  return dec(evD(distText(seg)));
}
function gameEV(c) {
  const t = P(c);
  let m;
  if ((m = t.match(/pay \$(\d+); the prize is \$(\d+) with probability (\d*\.?\d+), otherwise nothing/))) return Q(+m[2]).mul(Q(m[3])).sub(+m[1]);
  if ((m = t.match(/all (\d+) tickets at \$(\d+) are sold, each with the same chance; one ticket wins \$(\d+)/))) return Q(+m[3], +m[1]).sub(+m[2]);
  return null;
}
function fairWhich(q) {
  const evs = q.choices.map(gameEV);
  const fairIdx = evs.map((e, i) => (e && e.eq(0) ? i : -1)).filter(i => i >= 0);
  if (fairIdx.length === 1) return fairIdx[0];
  if (fairIdx.length === 0) return choiceWhere(q, c => /^None of them is fair/.test(c));
  return -1;
}
function ruleGainEVs(q) {
  const p = P(q.prompt);
  const a = p.match(/Game A costs \$(\d+) and pays \$(\d+) with probability (\d*\.?\d+)/), b = p.match(/Game B costs \$(\d+) and pays \$(\d+) with probability (\d*\.?\d+)/);
  return [Q(+a[2]).mul(Q(a[3])).sub(+a[1]), Q(+b[2]).mul(Q(b[3])).sub(+b[1])];
}
function ruleGain(q) {
  const [A, B] = ruleGainEVs(q);
  const opts = [{ re: /^Game A$/, v: A }, { re: /^Game B$/, v: B }];
  if (q.choices.some(c => /^Play neither/.test(c))) opts.push({ re: /^Play neither/, v: Q(0) });
  else if (A.eq(B)) return choiceWhere(q, c => /same expected net payoff/.test(c));
  const best = opts.reduce((x, y) => (y.v.cmp(x.v) > 0 ? y : x));
  if (opts.filter(o => o.v.eq(best.v)).length > 1) return -1;
  return choiceWhere(q, c => best.re.test(c));
}
function ruleCostParts(q) {
  const p = P(q.prompt);
  const m = p.match(/policy A costs \$(\d+) a year with a \$(\d+) deductible; policy B costs \$(\d+) with a \$(\d+) deductible\. Assume at most one claim a year, with probability (\d*\.?\d+)/);
  const pr = Q(m[5]);
  return { A: { prem: +m[1], ded: +m[2] }, B: { prem: +m[3], ded: +m[4] }, pr };
}
function ruleCost(q) {
  const r = ruleCostParts(q);
  const eA = r.pr.mul(r.A.ded).add(r.A.prem), eB = r.pr.mul(r.B.ded).add(r.B.prem);
  const s = eA.cmp(eB);
  if (s === 0) return choiceWhere(q, c => /same expected cost/.test(c));
  return choiceWhere(q, c => c === (s < 0 ? 'Policy A' : 'Policy B'));
}

// ================================================================ s2: assumptions and sensitivity
function auditSource(q) {
  const p = P(q.prompt);
  let k;
  if (/equal sectors|uses a fair \d+-sided die/.test(p)) k = /^Theoretical:/;
  else if (/guesses|no sales data/.test(p)) k = /^Assumed:/;
  else if (/last year/.test(p)) k = /^Empirical:/;
  else return undefined;
  return choiceWhere(q, c => k.test(c));
}
function auditWhich(q) {
  const p = P(q.prompt);
  let m;
  if ((m = p.match(/as \$(\d+) ÷ (\d+) - \$(\d+)/))) return choiceWhere(q, c => new RegExp(`^All ${m[2]} tickets are sold, and every ticket has the same chance`).test(P(c)));
  if ((m = p.match(/as \$(\d+) \+ (\d*\.?\d+) × \$(\d+)/))) return choiceWhere(q, c => /^At most one claim in the year, and every loss is bigger than the deductible$/.test(c));
  if ((m = p.match(/as (\d*\.?\d+) × \$(\d+)/))) return choiceWhere(q, c => new RegExp(`^A repair costs \\$${m[2]} whenever it happens, and the laptop needs at most one repair$`).test(P(c)));
  return undefined;
}
/** "nets $2,400 if it stays dry and −$600 if it rains" (or fair weather / storm, big / small crowd) → { G, L, S? } */
function scen(p) {
  p = P(p);
  const m = p.match(/nets (-?)\$(\d+) (?:if it stays dry|in fair weather|with a big crowd|if dry) and (-?)\$(\d+) (?:if it rains|in a storm|with a small crowd)/);
  const sure = p.match(/nets a sure \$(\d+)|nets \$(\d+) for sure/);
  return { G: Q((m[1] ? -1 : 1) * +m[2]), L: Q((m[3] ? -1 : 1) * +m[4]), S: sure ? Q(+(sure[1] ?? sure[2])) : null };
}
const Eat = (sc, pr) => Q(1).sub(pr).mul(sc.G).add(pr.mul(sc.L));
function sensFill(q) {
  const sc = scen(q.prompt);
  const at = Q(P(q.prompt).match(/What goes in the empty cell, at P\([^)]*\) = (\d*\.?\d+)/)[1]);
  return dec(Eat(sc, at));
}
function sensSwitch(q) {
  const sc = scen(q.prompt);
  const t = pics(q).find(x => x.kind === 'table');
  const ps = t.rows[0].cells.map(c => Q(texPlain(c)));
  const d = ps.map(pr => Eat(sc, pr).cmp(sc.S));
  if (d.some(x => x === 0)) return -1; // a tie at a tabled value
  const sw = [];
  for (let i = 0; i + 1 < d.length; i++) if (d[i] !== d[i + 1]) sw.push([ps[i], ps[i + 1]]);
  if (sw.length === 0) return d[0] > 0 ? choiceWhere(q, c => /^It never switches/.test(c)) : -1;
  if (sw.length > 1) return -1;
  const [a, b] = sw[0];
  return choiceWhere(q, c => { const m = c.match(/^Between (\d*\.?\d+) and (\d*\.?\d+)$/); return !!m && Q(m[1]).eq(a) && Q(m[2]).eq(b); });
}

// ================================================================ insurance / warranty spreadsheet
function planTotal(q) {
  const p = P(q.prompt);
  const m = p.match(/costs \$(\d+) a month, with a \$(\d+) deductible, (\d+)% coinsurance after the deductible, and a \$(\d+) out-of-pocket maximum/);
  const prem = +m[1], D = +m[2], r = Q(+m[3], 100), max = +m[4];
  const B = +p.match(/covered medical bills are \$(\d+)/)[1];
  let oop = B <= D ? Q(B) : r.mul(B - D).add(D);
  if (oop.cmp(max) > 0) oop = Q(max);
  return dec(oop.add(12 * prem));
}
function warrantyParts(q) {
  const p = P(q.prompt);
  const m = p.match(/plan for \$(\d+)\. The plan covers mechanical failures \(a \$(\d+) repair\) but not accidental damage \(a \$(\d+) repair\)/);
  const plan = +m[1], mech = +m[2], acc = +m[3];
  const withP = /with the plan/.test(p);
  const when = p.split(/ the plan if /).pop();
  const sc = /nothing breaks/.test(when) ? 0 : /mechanical failure/.test(when) ? 1 : /accidental/.test(when) ? 2 : NaN;
  const cost = (w, s) => (w ? plan + (s === 2 ? acc : 0) : [0, mech, acc][s]);
  return { plan, mech, acc, withP, sc, cost };
}
const warrantyScen = q => { const r = warrantyParts(q); return r.cost(r.withP, r.sc); };

// ================================================================ s3: downside, SD
function riskRead(q) {
  const p = P(q.prompt), d = distText(p);
  if (/worst case/.test(p)) return d.reduce((a, o) => (o.x.cmp(a) < 0 ? o.x : a), d[0].x).value;
  let m;
  if ((m = p.match(/chance of losing at least \$(\d+)/))) return dec(sumQ(d.filter(o => o.x.cmp(-+m[1]) <= 0).map(o => o.p)));
  if (/chance of a loss/.test(p)) return dec(sumQ(d.filter(o => o.x.cmp(0) < 0).map(o => o.p)));
  return undefined;
}
function riskCompare(q) {
  const p = P(q.prompt);
  let m;
  if ((m = p.match(/Option 1: a sure \$(\d+)\. Option 2, a gamble: (-?)\$(\d+) with probability (\d*\.?\d+), otherwise (-?)\$(\d+)/))) {
    const S = Q(+m[1]), pr = Q(m[4]), W = Q((m[2] ? -1 : 1) * +m[3]), L = Q((m[5] ? -1 : 1) * +m[6]);
    const E = W.mul(pr).add(L.mul(Q(1).sub(pr)));
    const lo = W.cmp(L) < 0 ? W : L, hi = W.cmp(L) < 0 ? L : W;
    const truth = c => {
      const t = P(c);
      let k;
      if (/^Same expected value, so the same risk/.test(t)) return false; // the gamble spreads, the sure amount does not
      if ((k = t.match(/^The sure \$(\d+) has the higher expected value/))) return S.cmp(E) > 0;
      if (/^The gamble is less risky/.test(t)) return false;
      if ((k = t.match(/^Same expected value, but the gamble's result ranges from (-?)\$(\d+) to (-?)\$(\d+)(, including a loss)?: more risk$/))) {
        const a = Q((k[1] ? -1 : 1) * +k[2]), b = Q((k[3] ? -1 : 1) * +k[4]);
        return E.eq(S) && a.eq(lo) && b.eq(hi) && (!k[5] || lo.cmp(0) < 0);
      }
      return null;
    };
    const r = q.choices.map(truth);
    if (r.some(x => x === null)) return undefined;
    return choiceWhere(q, (_, i) => r[i]);
  }
  if ((m = p.match(/Option A: (.*?)\. Option B: a sure \$(\d+)\./))) {
    const d = distText(m[1]), S = Q(+m[2]), E = evD(d);
    const loss = d.filter(o => o.x.cmp(0) < 0);
    const truth = c => {
      const t = P(c);
      let k;
      if (/^B is riskier/.test(t)) return false;
      if (/^They have the same risk/.test(t)) return false;
      if (/^A is better in every way/.test(t)) return E.cmp(S) > 0 && d.every(o => o.x.cmp(S) >= 0);
      if ((k = t.match(/^A has the higher expected value, but a (\d*\.?\d+) chance of losing \$(\d+); B never loses$/))) {
        return E.cmp(S) > 0 && loss.length === 1 && loss[0].p.eq(Q(k[1])) && loss[0].x.eq(-+k[2]) && S.cmp(0) >= 0;
      }
      return null;
    };
    const r = q.choices.map(truth);
    if (r.some(x => x === null)) return undefined;
    return choiceWhere(q, (_, i) => r[i]);
  }
  return undefined;
}
const sdCompute = q => round(Math.sqrt(varD(distText(q.prompt)).value), 2);
function sdPickParts(q) {
  const p = P(q.prompt);
  const o = [...p.matchAll(/([ABC]): E = \$(\d+), SD = \$(\d+)/g)].map(m => ({ k: m[1], E: +m[2], SD: +m[3] }));
  let m, rule;
  if ((m = p.match(/the highest expected value among options with an SD of at most \$(\d+)/))) rule = { by: 'E', lim: +m[1] };
  else if ((m = p.match(/the lowest SD among options with an expected value of at least \$(\d+)/))) rule = { by: 'SD', lim: +m[1] };
  return { o, rule };
}
function sdPick(q) {
  const { o, rule } = sdPickParts(q);
  if (!rule) return undefined;
  const ok = o.filter(x => (rule.by === 'E' ? x.SD <= rule.lim : x.E >= rule.lim));
  if (!ok.length) return -1;
  const key = x => (rule.by === 'E' ? x.E : -x.SD);
  const best = Math.max(...ok.map(key));
  const top = ok.filter(x => key(x) === best);
  if (top.length !== 1) return -1;
  return choiceWhere(q, c => c === `Option ${top[0].k}`);
}
function sdDiversify(q) {
  const p = P(q.prompt);
  const linked = /one storm hits both|same outdoor festival/.test(p);
  const indep = /tells nothing about the other|different states/.test(p);
  if (linked === indep) return undefined;
  // split in halves: E unchanged (half of each EV, twice); SD unchanged when the halves move together, times 1/√2 when independent
  return choiceWhere(q, c => (linked ? /^The same expected payoff and the same SD\b/.test(c) : /^The same expected payoff and a smaller SD$/.test(c)));
}

// ================================================================ s3: pooling
function poolTotal(q) {
  const p = P(q.prompt);
  let m;
  if ((m = p.match(/sells (\d+) independent policies at \$(\d+) a year\. The expected claims are \$(\d+) per policy/))) return dec(Q(+m[2] - +m[3]).mul(+m[1]));
  if ((m = p.match(/A \$(\d+) scratch ticket pays back \$(\d+(?:\.\d+)?) per ticket on average.*?Over (\d+) tickets/))) return dec(Q(m[2]).sub(+m[1]).mul(+m[3]));
  if ((m = p.match(/expected net gain is \$(\d+(?:\.\d+)?) per play\. What is its expected total net gain over (\d+) plays/))) return dec(Q(m[1]).mul(+m[2]));
  return undefined;
}
function poolWho(q) {
  const p = P(q.prompt);
  let k;
  if (/lost a game \d+ times in a row/.test(p)) { const pr = p.match(/chance of winning is (\d*\.?\d+)/)[1]; k = c => P(c) === `Still ${pr}: the plays are independent`; }
  else if (/insurer covers .* One family/.test(p)) k = c => /^The insurer's: averages over many independent policies/.test(P(c));
  else if (/hailstorm damages/.test(p)) k = c => /^The claims are linked/.test(c);
  else if (/one-time choice/.test(p)) k = c => /^It is still a sensible guide, but one result can land far from it/.test(c);
  else return undefined;
  return choiceWhere(q, k);
}

// ================================================================ s3: model uncertainty, preference, recommendation
function muKind(q) {
  const p = P(q.prompt);
  let model;
  if (/comes from only \d+|guessed|no sales data|might cost anywhere|nobody has a quote/.test(p)) model = true;
  else if (/may or may not|could be any of its numbers/.test(p)) model = false;
  else return undefined;
  return choiceWhere(q, c => (model ? /^Uncertainty about the model/ : /^Randomness within the model/).test(c));
}
function muRange(q) {
  const p = P(q.prompt);
  let m;
  if ((m = p.match(/a repair costs \$(\d+)\. The repair chance is only known to be between (\d*\.?\d+) and (\d*\.?\d+)/))) {
    const R = +m[1], a = Q(m[2]), b = Q(m[3]);
    const e = [a, b].map(x => x.mul(-R));
    return [dec(e[0].cmp(e[1]) < 0 ? e[0] : e[1]), dec(e[0].cmp(e[1]) < 0 ? e[1] : e[0])];
  }
  if ((m = p.match(/chance of rain is somewhere from (\d*\.?\d+) to (\d*\.?\d+)/))) {
    const sc = scen(p), e = [Q(m[1]), Q(m[2])].map(x => Eat(sc, x)); // linear in p: the extremes sit at the ends
    return [dec(e[0].cmp(e[1]) < 0 ? e[0] : e[1]), dec(e[0].cmp(e[1]) < 0 ? e[1] : e[0])];
  }
  return undefined;
}
function plans(p) {
  p = P(p);
  const out = {};
  for (const m of p.matchAll(/\b([ABC]): (a sure \$\d+|-?\$\d+ with probability \d*\.?\d+, -?\$\d+ with probability \d*\.?\d+)/g)) {
    const s = m[2].match(/^a sure \$(\d+)$/);
    out[m[1]] = s ? [{ x: Q(+s[1]), p: Q(1) }] : distText(m[2]);
  }
  return out;
}
function prefConstraint(q) {
  const p = P(q.prompt), pl = plans(p), lim = +p.match(/never risk losing more than \$(\d+)/)[1];
  const ok = Object.entries(pl).filter(([, d]) => d.every(o => o.x.cmp(-lim) >= 0)).map(([k, d]) => ({ k, E: evD(d) }));
  if (!ok.length) return -1;
  const best = ok.reduce((a, b) => (b.E.cmp(a.E) > 0 ? b : a));
  if (ok.filter(x => x.E.eq(best.E)).length > 1) return -1;
  return choiceWhere(q, c => c === `Plan ${best.k}`);
}
function prefWhy(q) {
  const p = P(q.prompt);
  let m;
  if ((m = p.match(/extended warranty covers an? \$(\d+) repair/))) return choiceWhere(q, c => new RegExp(`^When an? \\$${m[1]} bill would be hard to pay: the buyer trades a small expected loss for no large loss$`).test(P(c)));
  if (/lottery ticket/.test(p)) return choiceWhere(q, c => /^When it is a small, affordable cost of entertainment/.test(c));
  if (/pulls its goalie/.test(p)) return choiceWhere(q, c => /^Losing by one or by two counts the same/.test(c));
  return undefined;
}
function recParts(q) {
  const p = P(q.prompt);
  const sc = scen(p);
  const r = p.match(/chance of rain is somewhere from (\d*\.?\d+) to (\d*\.?\d+), so E\(outdoors\) is between \$(\d+) and \$(\d+)/);
  return { sc, a: Q(r[1]), b: Q(r[2]), said: [+r[3], +r[4]] };
}
function recPick(q) {
  const { sc, a, b } = recParts(q);
  const ea = Eat(sc, a), eb = Eat(sc, b), loss = -sc.L.value;
  const art = n => { const lead = String(n).replace(/\B(?=(\d{3})+$)/g, ',').split(',')[0]; return /^8/.test(lead) || lead === '11' || lead === '18' ? 'an' : 'a'; };
  const sa = ea.cmp(sc.S), sb = eb.cmp(sc.S);
  if (sa === 0 || sb === 0) return -1;
  if (sa > 0 && sb > 0) return choiceWhere(q, c => P(c) === `Outdoors if the club can absorb ${art(loss)} $${loss} loss: its EV is higher across the whole rain range. If it cannot, rent the gym`);
  if (sa > 0 && sb < 0) return choiceWhere(q, c => P(c) === `It depends on the rain chance: at ${a.value} outdoors has the higher EV, at ${b.value} the gym does. Pin down the forecast, and outdoors only if the club can absorb ${art(loss)} $${loss} loss`);
  return -1; // the gym wins over the whole range: no listed recommendation says so on the model
}
function recCondition(q) {
  const sc = scen(q.prompt);
  const p = sc.G.sub(sc.S).div(sc.G.sub(sc.L));
  return dec(p);
}

// ================================================================ dispatch
const F = {
  dsWhich, dsBranches, netTicket, netInsure, distDie, distComplete, fairJudge, fairProb, basisPeriod, basisNet,
  evNet, evRoutes, evInsureCost, fairPrice, fairWhich, ruleGain, ruleCost, auditSource, auditWhich, sensFill, sensSwitch,
  planTotal, warrantyScen, riskRead, riskCompare, sdCompute, sdPick, sdDiversify, poolTotal, poolWho, muKind, muRange,
  prefConstraint, prefWhy, recPick, recCondition,
};
function solve(q) {
  const f = F[q.family];
  if (!f) return undefined;
  return f(q);
}

// ================================================================ sane: the world of the item
/** the article before every "$N" in a text: "an $800", "a $1,300", "an $18" */
function articleSlips(text) {
  const out = [];
  for (const m of String(text).matchAll(/\b(a|an|A|An) \$(\d{1,3})((?:,\d{3})*)(?:\.\d+)?\b/g)) {
    const lead = m[2], an = /^8/.test(lead) || lead === '11' || lead === '18';
    if ((m[1].toLowerCase() === 'an') !== an) out.push(`"${m[0]}"`);
  }
  return out;
}
/** probabilities drawn on a tree option / given in a table add to 1 */
function treeIssues(q) {
  const out = [];
  for (const pic of pics(q)) {
    if (pic.kind === 'dtree') for (const o of pic.opts) {
      const ps = o.outs.map(u => u.p);
      if (ps.every(x => x != null && x !== '')) {
        const s = sumQ(ps.map(x => Q(P(texPlain(x)).replace(/\s/g, ''))));
        if (!s.eq(1)) out.push(`the branch probabilities after "${o.label}" add to ${s}`);
      }
    }
    if (pic.kind === 'bars' && pic.ps) {
      const s = pic.ps.reduce((a, b) => a + b, 0);
      if (Math.abs(s - 1) > 1e-9) out.push(`the bars add to ${s}`);
    }
  }
  return out;
}
/** the drawn {xs, ps} of a bars picture, or a table with X / P rows, as a distribution */
function drawnDist(q) {
  const b = pics(q).find(x => x.kind === 'bars');
  if (b) return b.xs.map((x, i) => ({ x: Q(x), p: Q(b.labs?.[i] != null ? P(b.labs[i]) : b.ps[i]) }));
  const t = pics(q).find(x => x.kind === 'table' && x.rows.length === 2 && /^X$/.test(texPlain(x.rows[0].head)) && /^P$/.test(texPlain(x.rows[1].head)));
  if (t) return t.rows[0].cells.map((c, i) => ({ x: M(c), p: Q(P(texPlain(t.rows[1].cells[i]))) }));
  return null;
}
const sameD = (a, b) => a.length === b.length && a.every(o => b.some(u => u.x.eq(o.x) && u.p.eq(o.p)));

function sane(q) {
  const f = q.family, p = P(q.prompt), issues = [];
  const texts = [q.prompt, ...(q.choices ?? [])];
  for (const t of texts) for (const s of articleSlips(t)) issues.push(`article: ${s}`);
  issues.push(...treeIssues(q));
  // every distribution given in the prompt adds to 1 and matches the drawn one
  // the families whose prompt lists one complete payoff distribution
  const dPrompt = ['evNet', 'riskRead', 'sdCompute'].includes(f) ? distText(p) : null;
  if (dPrompt) {
    const s = sumQ(dPrompt.map(o => o.p));
    if (!s.eq(1)) issues.push(`the probabilities in the story add to ${s}`);
    const dd = drawnDist(q);
    if (dd && !sameD(dd, dPrompt)) issues.push('the drawn distribution differs from the story');
  }
  try {
    if (f === 'netTicket') {
      const r = netTicketParts(q), t = pics(q).find(x => x.kind === 'dtree');
      if (t) { const ps = t.opts[0].outs.map(u => Q(P(texPlain(u.p)))); if (!ps[0].eq(r.probs[0]) || !ps[1].eq(r.probs[1])) issues.push('the tree probabilities differ from the story'); }
      const m = p.match(/charges \$(\d+) a throw.*?wins a \$(\d+) prize|tickets at \$(\d+) each.*?a \$(\d+) prize/);
      if (m) { const c = +(m[1] ?? m[3]), W = +(m[2] ?? m[4]); if (W <= c) issues.push(`the prize $${W} is not more than the price $${c}`); }
    }
    if (f === 'netInsure') {
      const r = netInsureParts(q);
      if (r.first !== r.ded) issues.push('"pays the first $X" differs from the deductible');
      if (r.ded >= r.loss) issues.push('the deductible is not below the loss');
      if (r.prem >= r.loss) issues.push(`a $${r.prem} premium for a $${r.loss} loss`);
      const t = pics(q).find(x => x.kind === 'dtree');
      if (t) for (const o of t.opts) if (!Q(P(texPlain(o.outs[0].p))).eq(r.pr)) issues.push('the tree probability differs from the story');
    }
    if (f === 'distDie') {
      const { cost, prizes } = mechanism(q.prompt), t = pics(q).find(x => x.kind === 'table');
      const drawn = t?.rows.find(r => /prize/.test(texPlain(r.head)))?.cells.map(c => money(c));
      if (drawn && drawn.join() !== prizes.join()) issues.push(`the table prizes ${drawn.join(',')} differ from the story ${prizes.join(',')}`);
      const tv = money(p.match(/P\(X = (-?\$\d+)\)/)[1]);
      if (!prizes.some(x => x - cost === tv)) issues.push(`X = ${tv} is impossible`);
    }
    if (f === 'distComplete') {
      const m = p.match(/probability (\d*\.?\d+) of needing a \$(\d+) repair.*?plan for \$(\d+)/);
      if (+m[3] >= +m[2]) issues.push(`the $${m[3]} plan costs at least the $${m[2]} repair`);
      const t = pics(q).find(x => x.kind === 'dtree');
      if (t && !Q(P(texPlain(t.opts[0].outs[0].p))).eq(Q(m[1]))) issues.push('the tree probability differs from the story');
    }
    if (f === 'fairProb' || f === 'fairJudge') {
      const md = pickModel(q.prompt);
      if (md?.kind === 'rng' && !md.ok) issues.push('the ranges do not cover the numbers exactly once');
      if (md?.kind === 'raffle') { const T = md.tickets; if (+T[2] + +T[4] + +T[6] !== +T[7]) issues.push('the tickets do not add to the total'); }
    }
    if (f === 'basisPeriod') {
      const v = basisPeriod(q);
      if (v <= 0) issues.push(`the monthly option is not more expensive (${v})`);
    }
    if (f === 'basisNet') { const v = basisNet(q); if (!cents(v)) issues.push(`the net gain per play ${v} is not whole cents`); if (v <= 0) issues.push('the booth makes no gain'); }
    if (f === 'evNet') {
      const c = +p.match(/costs \$(\d+)/)[1], xs = dPrompt.map(o => o.x.value);
      if (Math.min(...xs) !== -c) issues.push(`the lowest net payoff is not −$${c} (nothing won)`);
      if (!cents(evNet(q))) issues.push('E(X) is not whole cents');
    }
    if (f === 'evRoutes') {
      const r = evRoutesParts(q), t = pics(q).find(x => x.kind === 'table');
      if (!cents(evRoutes(q))) issues.push('the expected net payoff is not whole cents');
      if (t) {
        const tk = t.rows[1].cells.map(c => +P(texPlain(c)).replace(/\s/g, ''));
        if (tk[0] !== 1 || tk[1] !== r.k || tk[2] !== r.N - 1 - r.k) issues.push('the ticket counts in the table differ from the story');
      }
    }
    if (f === 'evInsureCost') {
      const r = evInsureParts(q);
      if (!cents(evInsureCost(q))) issues.push('the expected cost is not whole cents');
      const t = pics(q).find(x => x.kind === 'dtree');
      if (t && !Q(P(texPlain(t.opts[0].outs[0].p))).eq(r.pr)) issues.push('the tree probability differs from the story');
    }
    if (f === 'fairPrice') {
      const seg = p.match(/It pays (.*?); otherwise nothing/)[1], d = distText(seg), s = sumQ(d.map(o => o.p));
      if (s.cmp(1) >= 0) issues.push('the prize probabilities leave nothing for "otherwise nothing"');
      const v = fairPrice(q), price = +p.match(/charges \$(\d+) a play/)[1];
      if (!cents(v)) issues.push('the fair price is not whole cents');
      if (v === price) issues.push('the game is already fair at its price');
      const b = pics(q).find(x => x.kind === 'bars');
      if (b) { const full = [{ x: Q(0), p: Q(1).sub(s) }, ...d]; if (!sameD(drawnDist(q), full)) issues.push('the drawn prize bars differ from the story'); }
    }
    if (f === 'ruleGain') {
      const [A, B] = ruleGainEVs(q), neither = q.choices.some(c => /^Play neither/.test(c));
      if (neither && (A.eq(B) && A.cmp(0) > 0)) issues.push('A and B tie with a positive EV: no choice says so');
      if (neither && (A.eq(0) || B.eq(0)) && A.cmp(0) <= 0 && B.cmp(0) <= 0) issues.push('a game ties with playing neither');
    }
    if (f === 'ruleCost') {
      const r = ruleCostParts(q), t = pics(q).find(x => x.kind === 'dtree');
      if (t) {
        const want = [[-(r.A.prem + r.A.ded), -r.A.prem], [-(r.B.prem + r.B.ded), -r.B.prem]];
        t.opts.forEach((o, i) => o.outs.forEach((u, j) => { if (u.v != null && money(u.v) !== want[i][j]) issues.push(`leaf ${o.label}/${u.label} shows ${texPlain(u.v)}, the story gives ${want[i][j]}`); }));
        t.opts.forEach(o => { if (!Q(P(texPlain(o.outs[0].p))).eq(r.pr)) issues.push('the tree probability differs from the story'); });
      }
      if (!((r.A.prem > r.B.prem) === (r.A.ded < r.B.ded))) issues.push('the cheaper premium does not come with the higher deductible');
    }
    if (f === 'auditSource') {
      let m;
      if ((m = p.match(/says (\d+) of the (\d+) laptops.*?P\(repair\) = (\d*\.?\d+)/)) && !Q(+m[1], +m[2]).eq(Q(m[3])) && round(+m[1] / +m[2], 3) !== +m[3]) issues.push(`${m[1]}/${m[2]} is not ${m[3]}`);
      if ((m = p.match(/claims from (\d+)% of .*?P\(claim\) = (\d*\.?\d+)/)) && !Q(+m[1], 100).eq(Q(m[2]))) issues.push(`${m[1]}% is not ${m[2]}`);
      if ((m = p.match(/has (\d+) equal sectors, (\d+) of them red, so P\(red\) = (\d*\.?\d+)/)) && !Q(+m[2], +m[1]).eq(Q(m[3]))) issues.push('P(red) is wrong');
      if ((m = p.match(/fair (\d+)-sided die and says P\(rolling an? (\d+)\) = (\d+)\/(\d+)/)) && (!Q(+m[3], +m[4]).eq(Q(1, +m[1])) || +m[2] > +m[1])) issues.push('the die probability is wrong');
    }
    if (f === 'auditWhich') {
      let m;
      if ((m = (q.choices ?? []).map(c => P(c).match(/^The laptop will cost \$(\d+\.\d\d) in repairs$/)).find(Boolean))) {
        const e = p.match(/as (\d*\.?\d+) × \$(\d+)/); if (e && Math.abs(+m[1] - +e[1] * +e[2]) > 1e-9) issues.push('the "will cost" decoy is not the computed EV');
      }
    }
    if (f === 'sensFill' || f === 'sensSwitch') {
      const sc = scen(q.prompt), t = pics(q).find(x => x.kind === 'table');
      const ps = t.rows[0].cells.map(c => Q(texPlain(c)));
      t.rows.slice(1).forEach(r => {
        const h = texPlain(r.head);
        r.cells.forEach((c, i) => {
          if (c == null) return;
          const want = f === 'sensFill' || r === t.rows[1] ? Eat(sc, ps[i]) : sc.S;
          if (!M(c).eq(want)) issues.push(`table ${h} at ${ps[i]}: ${texPlain(c)}, the story gives ${want}`);
        });
      });
      if (f === 'sensFill') {
        const at = Q(p.match(/at P\([^)]*\) = (\d*\.?\d+)\?/)[1]), i = ps.findIndex(x => x.eq(at));
        if (i < 0 || t.rows[1].cells[i] != null) issues.push('the asked cell is not the empty one');
        if (t.rows[1].cells.filter(c => c == null).length !== 1) issues.push('not exactly one empty cell');
      }
      if (f === 'sensSwitch' && sensSwitch(q) === -1) issues.push('no single switch between tabled values (or a tie at a tabled value)');
    }
    if (f === 'planTotal') {
      const m = p.match(/a \$(\d+) deductible, (\d+)% coinsurance.*?a \$(\d+) out-of-pocket maximum/);
      if (+m[1] >= +m[3]) issues.push('the deductible is not below the out-of-pocket maximum');
      if (!cents(planTotal(q))) issues.push('the total is not whole cents');
      const t = pics(q).find(x => x.kind === 'table');
      if (t) {
        const cell = h => texPlain(t.rows.find(r => texPlain(r.head).includes(h))?.cells[0] ?? '');
        const pm = p.match(/costs \$(\d+) a month/)[1];
        if (money(cell('premium')) !== +pm || money(cell('deductible')) !== +m[1] || money(cell('out-of-pocket')) !== +m[3] || nums(cell('coinsurance'))[0] !== +m[2]) issues.push('the plan table differs from the story');
      }
    }
    if (f === 'warrantyScen') {
      const r = warrantyParts(q), t = pics(q).find(x => x.kind === 'table');
      const price = money(p.match(/^An? (\$\d+)/)[1]);
      if (r.plan >= price / 2) issues.push(`a $${r.plan} plan on a $${price} item`);
      if (r.mech >= price || r.acc >= price) issues.push('a repair costs as much as the item');
      if (t) {
        const cells = t.rows[1].cells;
        cells.forEach((c, i) => { if (c != null && money(c) !== r.cost(r.withP, i)) issues.push(`table cell ${i}: ${texPlain(c)} should be ${r.cost(r.withP, i)}`); });
        if (cells[r.sc] != null) issues.push('the asked cell is already filled in');
        if (/With the \$(\d+) plan/.test(texPlain(t.title ?? '')) !== r.withP) issues.push('the table title does not match with / without the plan');
      }
    }
    if (f === 'riskRead') { let m; if ((m = p.match(/losing at least \$(\d+)/)) && !dPrompt.some(o => o.x.value === -+m[1])) {/* threshold between values is fine */} }
    if (f === 'riskCompare') {
      let m;
      if ((m = p.match(/Option 2, a gamble: \$(\d+) with probability (\d*\.?\d+), otherwise (-?)\$(\d+)/))) {
        const dd = drawnDist(q), want = [{ x: Q(+m[1]), p: Q(m[2]) }, { x: Q((m[3] ? -1 : 1) * +m[4]), p: Q(1).sub(Q(m[2])) }];
        if (dd && !sameD(dd, want)) issues.push('the drawn gamble differs from the story');
      }
      if ((m = p.match(/Option A: (.*?)\. Option B/))) {
        const d = distText(m[1]), s = sumQ(d.map(o => o.p));
        if (!s.eq(1)) issues.push(`option A's probabilities add to ${s}`);
        const dd = drawnDist(q); if (dd && !sameD(dd, d)) issues.push('the drawn option A differs from the story');
      }
      if (riskCompare(q) === -1) issues.push('not exactly one statement is true');
    }
    if (f === 'sdCompute') {
      const d = distText(p), E = evD(d), said = p.match(/Its expected value is (-?)\$(\d+(?:\.\d+)?)/);
      if (said && !E.eq(Q((said[1] ? -1 : 1) * +said[2]))) issues.push(`E is ${E}, the prompt says ${said[0]}`);
      if (tieAt(Math.sqrt(varD(d).value), 2)) issues.push('the SD to the cent is a rounding tie');
    }
    if (f === 'sdPick' && sdPick(q) === -1) issues.push('the rule picks no option or ties');
    if (f === 'poolTotal') {
      let m;
      if ((m = p.match(/A \$(\d+) scratch ticket pays back \$(\d+(?:\.\d+)?) per ticket on average, so its expected net payoff is (-?)\$(\d+(?:\.\d+)?)/))) {
        if (!Q(m[2]).sub(+m[1]).eq(Q((m[3] ? -1 : 1) * +m[4]))) issues.push('the stated expected net payoff is not payback − price');
      }
      if ((m = p.match(/charges \$(\d+) a play; its expected net gain is \$(\d+(?:\.\d+)?)/)) && +m[2] >= +m[1]) issues.push('the expected gain is not below the price');
      if ((m = p.match(/at \$(\d+) a year\. The expected claims are \$(\d+)/)) && +m[2] >= +m[1]) issues.push('the expected claims exceed the premium');
    }
    if (f === 'poolWho') {
      let m;
      if ((m = (q.choices ?? []).map(c => P(c).match(/You will lose \$(\d+(?:\.\d+)?), the expected loss/)).find(Boolean))) {
        const s = p.match(/a (\d*\.?\d+) chance of an? \$(\d+) loss/); if (s && Math.abs(+m[1] - +s[1] * +s[2]) > 1e-9) issues.push('the "expected loss" decoy is not p × loss');
      }
    }
    if (f === 'muRange') {
      const r = muRange(q), b = texPlain(q.board);
      let m;
      if ((m = b.match(/E = \(1 - p\)\((-?\d+)\) \+ p\((-?\d+)\)/))) { const sc = scen(p); if (!sc.G.eq(+m[1]) || !sc.L.eq(+m[2])) issues.push('the board formula differs from the story'); }
      if ((m = b.match(/E = -(\d+) ?p/)) && +m[1] !== +p.match(/repair costs \$(\d+)/)[1]) issues.push('the board formula differs from the story');
      if (r && r.some(v => !cents(v))) issues.push('an end of the range is not whole cents');
    }
    if (f === 'prefConstraint') {
      const pl = plans(p);
      for (const [k, d] of Object.entries(pl)) if (!sumQ(d.map(o => o.p)).eq(1)) issues.push(`plan ${k}'s probabilities do not add to 1`);
      if (Object.keys(pl).length !== 3) issues.push('could not read three plans');
      if (prefConstraint(q) === -1) issues.push('the rule picks no plan or ties');
    }
    if (f === 'prefWhy') {
      let m;
      if ((m = p.match(/A \$(\d+) extended warranty covers an? \$(\d+) repair/)) && +m[1] >= +m[2]) issues.push('the warranty costs as much as the repair');
      if ((m = p.match(/A \$(\d+) lottery ticket pays back about \$(\d+(?:\.\d+)?) on average, an expected net payoff of (-?)\$(\d+(?:\.\d+)?)/)) && !Q(m[2]).sub(+m[1]).eq(Q((m[3] ? -1 : 1) * +m[4]))) issues.push('the stated expected net payoff is not payback − price');
    }
    if (f === 'recPick') {
      const { sc, a, b, said } = recParts(q), ea = Eat(sc, a).value, eb = Eat(sc, b).value;
      if (Math.min(ea, eb) !== said[0] || Math.max(ea, eb) !== said[1]) issues.push(`E(outdoors) runs from ${Math.min(ea, eb)} to ${Math.max(ea, eb)}, the prompt says ${said[0]} to ${said[1]}`);
      if (recPick(q) === -1) issues.push('the gym wins on the whole range or ties at an end: no listed recommendation fits');
    }
    if (f === 'recCondition') {
      const v = recCondition(q), sc = scen(q.prompt);
      if (!(v > 0 && v < 1)) issues.push(`the changeover p = ${v} is not between 0 and 1`);
      if (Math.abs(v * 10000 - Math.round(v * 10000)) > 1e-7) issues.push(`p = ${v} is not a clean decimal`);
      const b = texPlain(q.board).match(/\(1 - p\)\((-?\d+)\) \+ p\((-?\d+)\) = (\d+)/);
      if (b && (!sc.G.eq(+b[1]) || !sc.L.eq(+b[2]) || !sc.S.eq(+b[3]))) issues.push('the board equation differs from the story');
    }
  } catch (e) {
    issues.push(`oracle could not read the item: ${e.message}`);
  }
  return [...new Set(issues)].join('; ');
}

export default { solve, sane };
