// Oracle for the lesson "proportional-relationships" (y = kx; tables, graphs, equations, situations; counterexamples
// and evidence). Written from what the student sees only: the prompt, the board, the choices and the drawn picture
// (the table rows, the plotted points, the drawn line with its slope and start, the marked point, the grid steps).
// Every rate is y ÷ x worked out exactly; "proportional" means one multiplier for every allowed input and 0 → 0;
// a few matching measurements are only consistent with it; a stated per-unit rule with no fee proves it. Each choice
// is judged by its verdict AND its reason (a true verdict with a reason that proves nothing is not the right choice).
// See docs/lessons/QUALITY_LAYER.md, "O: the oracle".
import { Q, nums, texPlain, choiceWhere } from '../../tools/quality/oracle-kit.mjs';

// ---------------------------------------------------------------- reading
/** '40/3', '2.25', '$6.50', '1/2' → Q */
const val = s => { const t = String(s).trim().replace(/^\$/, ''); if (!/^-?\d+(?:\.\d+)?$|^-?\d+\/\d+$/.test(t)) return null; try { return Q(t); } catch { return null; } };
const same = (a, b) => { try { return Q(a).eq(Q(b)); } catch { return Math.abs(a - b) < 1e-9; } };
/** a unit word in a normal singular form: "cups of sugar" → "cup of sugar", "dollars" → "dollar" */
const sing = u => String(u).trim().toLowerCase().split(' ').map(w => (/^(of|gas)$/.test(w) ? w : w.replace(/s$/, ''))).join(' ');
/** the amounts of a text: [{ v, u }] ($ amounts are dollars) */
function qty(t) {
  const out = [];
  const re = /\$(\d+(?:\.\d+)?)|(\d+(?:\.\d+)?|\d+\/\d+) (cups? of [a-z]+|minutes?|pages?|gallons?|pounds?|tickets?|hours?|miles?|GB|games?|weights?|cm|weeks?|stamps?)/g;
  let m;
  while ((m = re.exec(t))) out.push(m[1] !== undefined ? { v: Q(m[1]), u: 'dollar', at: m.index } : { v: val(m[2]), u: sing(m[3]), at: m.index });
  return out;
}
const P = q => q.data?.picture ?? {};
const rowsOf = q => (P(q).table?.rows ?? []).map(r => ({ x: Q(String(r.x)), y: Q(String(r.y)) }));
const rate = r => (r.x.n === 0 ? null : r.y.div(r.x));
/** the context of a story → the two quantities (input, output) in singular words */
function ctx(t) {
  t = String(t);
  if (/gas|pump/.test(t)) return ['gallon', 'dollar'];
  if (/ticket/.test(t)) return ['ticket', 'dollar'];
  if (/trail mix|pound/.test(t)) return ['pound', 'dollar'];
  if (/car |car$|steady speed/.test(t)) return ['hour', 'mile'];
  if (/hose|pool/.test(t)) return ['minute', 'gallon'];
  if (/printer/.test(t)) return ['minute', 'page'];
  if (/recipe|flour/.test(t)) return ['cup of flour', 'cup of sugar'];
  return null;
}
/** an equation "c = 3g", "n = m + 8", "c = t + 12", "w = 7.5t" → { lhs, f(vars) } */
function parseEq(s) {
  let m = String(s).trim().match(/^([a-z]) = (\d+(?:\.\d+)?)?([a-z])$/);
  if (m) return { lhs: m[1], rhs: m[3], kind: 'times', k: Q(m[2] ?? '1') };
  m = String(s).trim().match(/^([a-z]) = ([a-z]) \+ (\d+(?:\.\d+)?)$/);
  if (m) return { lhs: m[1], rhs: m[3] === undefined ? null : m[2], kind: 'plus', k: Q(m[3]) };
  return null;
}
const holds = (e, vals) => {
  const L = vals[e.lhs], R = vals[e.rhs];
  if (L === undefined || R === undefined) return false;
  return e.kind === 'times' ? e.k.mul(R).eq(L) : R.add(e.k).eq(L);
};
const VERDICT = { Proportional: 1, 'Proven proportional': 1, 'Not proportional': 0, 'Consistent with proportional': 2, 'Only consistent with proportional': 2 };

// ---------------------------------------------------------------- the families
const F = {
  rowRate(q) {
    const m = q.prompt.match(/How many (.+?) per (.+?) is that\?/);
    if (!m) return undefined;
    const A = qty(q.prompt.slice(0, m.index)), num = sing(m[1]), den = sing(m[2]);
    const a = A.find(x => x.u === num), b = A.find(x => x.u === den);
    return a && b ? a.v.div(b.v).value : undefined;
  },
  tableTest(q) {
    const R = rowsOf(q);
    if (!R.length) return undefined;
    const rates = R.map(rate);
    const allSame = rates.every(r => r && r.eq(rates[0]));
    const sampled = /wrote down a few/.test(q.prompt);
    return choiceWhere(q, c => {
      let m;
      if ((m = c.match(/^(Proportional|Proven proportional): every row gives (\S+) /))) return allSame && val(m[2])?.eq(rates[0]) && (m[1] === 'Proven proportional' ? !sampled : !sampled);
      if ((m = c.match(/^Consistent with proportional: every row gives (\S+) .*, but only these rows were checked$/))) return allSame && val(m[1])?.eq(rates[0]) && sampled;
      if ((m = c.match(/^Not proportional: row (\d+) gives (\S+) (?:.+ )?, row (\d+) gives (\S+)$/)) || (m = c.match(/^Not proportional: row (\d+) gives (\S+?)(?: [a-z].*?)?, row (\d+) gives (\S+)$/))) {
        const i = +m[1] - 1, j = +m[3] - 1;
        return !!rates[i] && !!rates[j] && val(m[2])?.eq(rates[i]) && val(m[4])?.eq(rates[j]) && !rates[i].eq(rates[j]);
      }
      if ((m = c.match(/^Not proportional: row (\d+) gives (\S+) and the other rows give (\S+)$/))) {
        const i = +m[1] - 1, a = val(m[2]), b = val(m[3]);
        return !!rates[i] && a?.eq(rates[i]) && rates.every((r, k) => k === i || r?.eq(b)) && !a.eq(b);
      }
      // "go up together", "row 1 gives ...", "the first rows all give ...", "double the one before", "not the same
      // multiple of the one above" are not the test (y ÷ x in every row)
      return false;
    });
  },
  zeroRow(q) {
    const p = q.prompt;
    let m = p.match(/If the relationship is proportional, what goes with 0 ([a-z ]+?)\?/);
    if (m) {
      const A = qty(p.split('If the relationship')[0]);
      const ins = A.filter(x => x.u === sing(m[1])), outs = A.filter(x => x.u !== sing(m[1]));
      if (!ins.length || !outs.length) return undefined;
      const k = outs[0].v.div(ins[0].v);
      return choiceWhere(q, c => { const x = c.match(/^\$?(\d+(?:\.\d+)?)(?: [a-z ]+)?: (\S+) × 0 = 0$/); return !!x && +x[1] === 0 && val(x[2])?.eq(k); });
    }
    m = p.match(/the rows without 0 give (\S+) .*?Look at the row with 0 [a-z ]+?\./) ?? p.match(/has a row with 0 [a-z ]+?\. The other rows give (\S+) /);
    if (m) {
      const k = val(m[1]);
      const z = texPlain(q.board ?? '').replace(/\\/g, '').match(/^0 → \$?(\d+(?:\.\d+)?)$/);
      if (!z) return undefined;
      const y0 = Q(z[1]);
      return choiceWhere(q, c => {
        let x = c.match(/^Not proportional: (\S+) × 0 = 0, but the 0 row says \$?(\S+)/);
        if (x) return val(x[1])?.eq(k) && val(x[2])?.eq(y0) && y0.n !== 0;
        x = c.match(/^Multiply: (\S+) × 0 = 0, so the row fits$/);
        if (x) return val(x[1])?.eq(k) && y0.n === 0;
        return false;   // dividing by 0, skipping the 0 row, "0 ÷ 0 has no value" do not check it
      });
    }
    return undefined;
  },
  situation(q) {
    const p = q.prompt;
    let prop = null, why = null;
    let m;
    if ((m = p.match(/costs? \$(\S+) per ([a-z]+), for any amount, with no other fees/))) { prop = true; why = { kind: 'unit', k: Q(m[1]), u: sing(m[2]) }; }
    else if (/recipe uses \d+ [a-z]+ for every \d+ cups? of [a-z]+, for any size batch/.test(p)) { prop = true; why = { kind: 'recipe' }; }
    else if ((m = p.match(/runs at a steady (\d+) miles per hour/))) { prop = true; why = { kind: 'speed', k: +m[1] }; }
    else if (/With more [a-z]+ working together, the job takes fewer hours/.test(p)) { prop = false; why = { kind: 'inverse' }; }
    else if ((m = p.match(/is (\d+) years older than/))) { prop = false; why = { kind: 'age', d: +m[1] }; }
    else if ((m = p.match(/charges \$(\d+(?:\.\d+)?) (?:to get in|to start|for shoes|[a-z ]+?) plus \$(\S+) per ([a-z]+)/))) { prop = false; why = { kind: 'fee', fee: Q(m[1]) }; }
    else if ((m = p.match(/\(0 hours: \$0, 1 hour: \$(\d+), 2 hours: \$(\d+), (\d+) hours: \$(\d+)\.\)/))) {
      const r = [Q(+m[1]), Q(+m[2], 2), Q(+m[4], +m[3])];
      prop = r.every(x => x.eq(r[0])); why = { kind: 'tier' };
    }
    if (prop === null) return undefined;
    return choiceWhere(q, c => {
      const v = c.match(/^(Proportional|Not proportional): (.*)$/);
      if (!v || (v[1] === 'Proportional') !== prop) return false;
      const r = v[2];
      switch (why.kind) {
        case 'unit': { const x = r.match(/^every ([a-z]+) costs the same \$(\S+)$/); return !!x && sing(x[1]) === why.u && val(x[2])?.eq(why.k); }
        case 'recipe': return /^the same number of [a-z]+ per cup, for any batch$/.test(r);
        case 'speed': { const x = r.match(/^every hour adds the same (\d+) miles, from 0$/); return !!x && +x[1] === why.k; }
        case 'inverse': return /^more [a-z]+ means fewer hours$/.test(r);
        case 'age': { const x = r.match(/^the difference stays (\d+), but the ratio changes$/); return !!x && +x[1] === why.d; }
        case 'fee': { const x = r.match(/^there is a \$(\S+) starting amount$/); return !!x && val(x[1])?.eq(why.fee); }
        case 'tier': return /^the rate per hour changes after \d+ hours$/.test(r);
        default: return false;
      }
    });
  },
  nameK(q) {
    const p = q.prompt;
    let m;
    if ((m = p.match(/ is ([a-z]) = (\d+(?:\.\d+)?)([a-z]), with/))) return Number(m[2]);
    if ((m = p.match(/A relationship is ([a-z]) = ([a-z])\/(\d+)\./))) return Q(1, +m[3]).value;
    if ((m = p.match(/walks (\d+\/\d+|\d+) miles? in every (\d+\/\d+|\d+) hours?/))) return Q(m[1]).div(Q(m[2])).value;
    if ((m = p.match(/matches ([\d., ]+) ([a-z ]+?) with ([\d., ]+) ([a-z ]+?)\. What is k/))) {
      const xs = m[1].split(',').map(s => Q(s.trim())), ys = m[3].split(',').map(s => Q(s.trim()));
      const i = xs.findIndex(x => x.n !== 0);
      return i >= 0 ? ys[i].div(xs[i]).value : undefined;
    }
    if ((m = p.match(/uses (\d+) cups? of ([a-z]+) for every (\d+) cups? of ([a-z]+)\. How many cups of ([a-z]+) per cup of ([a-z]+)\?/))) {
      const amt = { [m[2]]: Q(+m[1]), [m[4]]: Q(+m[3]) };
      return amt[m[5]] && amt[m[6]] ? amt[m[5]].div(amt[m[6]]).value : undefined;
    }
    if (/The table shows .+? What is the constant of proportionality k/.test(p)) {
      const R = rowsOf(q).filter(r => r.x.n !== 0);
      return R.length ? rate(R[0]).value : undefined;
    }
    return undefined;
  },
  writeEq(q) {
    const p = q.prompt;
    let m = p.match(/Use ([a-z]) for (.+?) and ([a-z]) for (.+?)\. Which equation/);
    if (!m) return undefined;
    const vx = m[1], ux = sing(m[2]), vy = m[3], uy = sing(m[4]);
    const sets = [];
    const t = p.match(/^There are (\d+) times as many ([a-z]+) as ([a-z]+)\./);
    if (t) {
      // "8 times as many chairs as tables": chairs = 8 × tables
      const many = sing(t[2]), base = sing(t[3]);
      const k = Q(+t[1]);
      const pairs = [[0, 0], [1, k], [3, k.mul(3)]];
      for (const [b, a] of pairs) { const o = {}; o[many === ux ? vx : vy] = Q(a); o[base === ux ? vx : vy] = Q(b); sets.push(o); }
    } else if (P(q).table?.rows && /The table shows/.test(p)) {
      for (const r of rowsOf(q)) sets.push({ [vx]: r.x, [vy]: r.y });
      if (/0 [a-z ]+ go with 0/.test(p) && !sets.some(s => s[vx].n === 0)) sets.push({ [vx]: Q(0), [vy]: Q(0) });
    } else {
      const A = qty(p.split(', at the same rate')[0]);
      const a = A.find(x => x.u === ux), b = A.find(x => x.u === uy);
      if (!a || !b) return undefined;
      sets.push({ [vx]: a.v, [vy]: b.v }, { [vx]: Q(0), [vy]: Q(0) });   // "the same rate for any amount": 0 → 0
      sets.push({ [vx]: a.v.mul(2), [vy]: b.v.mul(2) });
    }
    const fits = (q.choices ?? []).map(c => { const e = parseEq(c); return !!e && sets.every(s => holds(e, s)); });
    const any = fits.some(Boolean);
    return choiceWhere(q, (c, i) => (/^None:/.test(c) ? !any : fits[i]));
  },
  plotPoint(q) {
    const p = q.prompt;
    let m = p.match(/^([a-z]) = (\d+(?:\.\d+)?)([a-z]) for .+? Which point of the graph goes with ([a-z]) = (\d+(?:\.\d+)?)\?/);
    if (m && m[3] === m[4]) return [Number(m[5]), Q(m[2]).mul(Q(m[5])).value];
    m = p.match(/^([a-z]) = (\d+(?:\.\d+)?)([a-z]) for any amount ([a-z]) ≥ 0 .+? At which point does the graph start\?/);
    if (m) return [0, 0];   // any amount from 0: the ray starts at (0, 0), not at the first table row
    return undefined;
  },
  readScale(q) {
    const p = q.prompt;
    let m = p.match(/Read the marked point: how many [a-z]+ go with (\d+(?:\.\d+)?) [a-z]+\?/);
    if (m) {
      const mk = P(q).graph?.mark;
      return mk && same(mk.x, +m[1]) ? mk.y : undefined;
    }
    if (/Which labels make a correct .+? axis, with grid lines the same distance apart\?/.test(p)) {
      return choiceWhere(q, c => {
        const L = nums(c);
        if (L.length < 3 || L[0] !== 0) return false;
        const d = L[1] - L[0];
        return d > 0 && L.every((x, i) => Math.abs(x - i * d) < 1e-9);
      });
    }
    return undefined;
  },
  domain(q) {
    const p = q.prompt;
    let m;
    if ((m = p.match(/Can the graph have a point at (\d+\.\d+) tickets\?/))) return choiceWhere(q, c => /^No: you can't buy \S+ tickets$/.test(c));
    if ((m = p.match(/any amount from 0 to (\d+) ([a-z]+)\. Which graph/))) return choiceWhere(q, c => c === `A segment from (0, 0) to ${m[1]} ${m[2]}`);
    if ((m = p.match(/come in any weight from (\d+) to (\d+) ([a-z]+),/))) return choiceWhere(q, c => c === `The part of the line through (0, 0) from ${m[1]} to ${m[2]} ${m[3]}`);
    if ((m = p.match(/tickets cost \$\S+ each\. Which graph shows the cost of 0 to (\d+) tickets\?/i))) return choiceWhere(q, c => /^Separate points at 0, 1, 2, \.\.\./.test(c));
    if (/you can pump any amount\. Which graph/.test(p) || /any amount\. Which graph/.test(p)) return choiceWhere(q, c => /^A ray from \(0, 0\): any amount is allowed$/.test(c));
    return undefined;
  },
  graphTest(q) {
    const G = P(q).graph;
    if (!G) return undefined;
    let verdict;   // 'prop' | 'curve' | 'miss' | 'few' | 'notline'
    const L = G.lines?.[0];
    if (L) {
      if (L.kind && L.kind !== 'line') verdict = (L.b ?? 0) === 0 ? 'curve' : 'curve+miss';
      else if ((L.b ?? 0) !== 0) verdict = 'miss';
      else if (L.ends === 'points' && /cost \$\S+ each, no fees/.test(q.prompt)) verdict = 'prop';
      else if (L.ends === 'points') verdict = 'few';
      else verdict = 'prop';
    } else if (G.points?.length) {
      const R = G.points.map(pt => ({ x: Q(String(pt.x)), y: Q(String(pt.y)) }));
      const rs = R.filter(r => r.x.n !== 0).map(rate);
      const one = rs.every(r => r.eq(rs[0])) && R.every(r => r.x.n !== 0 || r.y.n === 0);
      // collinear but not through 0 → misses (0, 0); not collinear → not straight
      const col = R.length < 3 || R.every((r, i) => i < 2 || r.y.sub(R[0].y).mul(R[1].x.sub(R[0].x)).eq(R[1].y.sub(R[0].y).mul(r.x.sub(R[0].x))));
      verdict = one ? (/measured .+? times and plotted/.test(q.prompt) ? 'few' : 'prop') : col ? 'miss' : 'notline';
    } else return undefined;
    return choiceWhere(q, c => {
      if (/^Proportional: straight and through \(0, 0\)$/.test(c)) return verdict === 'prop';
      if (/^Not proportional: it is not straight$/.test(c)) return verdict === 'curve' || verdict === 'notline' || verdict === 'curve+miss';
      if (/^Not proportional: it misses \(0, 0\)$/.test(c)) return verdict === 'miss' || verdict === 'curve+miss';
      if (/^Only consistent with proportional: a few points, no rule$/.test(c)) return verdict === 'few';
      return false;
    });
  },
  interpret(q) {
    const m = q.prompt.match(/marked point \((\S+), (\S+)\) say\?/);
    const ax = texPlain(q.board ?? '').match(/^\((\S+), (\S+)\)$/);
    if (!m || !ax) return undefined;
    const x = Q(m[1]), y = Q(m[2]);
    const nameRe = n => (sing(n) === 'dollar' ? /\$(\d+(?:\.\d+)?)/ : new RegExp(`(\\d+(?:\\.\\d+)?) ${sing(n)}s?\\b`));
    return choiceWhere(q, c => {
      let r = c.match(/^The rate is (\S+) /);
      if (r) return x.n !== 0 && val(r[1])?.eq(y.div(x));
      if (/^Go |^Start here/.test(c)) return false;
      const a = c.match(nameRe(ax[1])), b = c.match(nameRe(ax[2]));
      return !!a && !!b && Q(a[1]).eq(x) && Q(b[1]).eq(y);
    });
  },
  kGraph(q) {
    const p = q.prompt, G = P(q).graph;
    let m = p.match(/Line A goes through \((\S+), (\S+)\), line B through \((\S+), (\S+)\)\. Which has the bigger k\?/);
    if (m) {
      const a = Q(m[2]).div(Q(m[1])), b = Q(m[4]).div(Q(m[3])), c = a.cmp(b);
      return choiceWhere(q, s => (s === 'Line A' ? c > 0 : s === 'Line B' ? c < 0 : /^Neither/.test(s) ? c === 0 : false));
    }
    if (/climbs exactly one grid square for every grid square across/.test(p)) return G ? Q(String(G.yStep)).div(Q(String(G.xStep))).value : undefined;
    if (/What is k, in/.test(p) && G) {
      if (G.mark && G.mark.x) return Q(String(G.mark.y)).div(Q(String(G.mark.x))).value;
      if (G.lines?.[0] && !(G.lines[0].b)) return G.lines[0].k;
    }
    return undefined;
  },
  translate(q) {
    const p = q.prompt;
    let m = p.match(/^Which sentence says the same as ([a-z]) = (\d+(?:\.\d+)?)([a-z]) for (.+?)\?$/);
    if (m) {
      const cx = ctx(m[4]);
      if (!cx) return undefined;
      const k = Q(m[2]);
      return choiceWhere(q, c => {
        const x = c.match(/^Every ([a-z]+) adds \$?(\S+?)(?: ([a-z]+))?: /);
        if (!x) return false;
        const outU = x[3] ? sing(x[3]) : 'dollar';
        return sing(x[1]) === cx[0] && outU === cx[1] && val(x[2])?.eq(k);
      });
    }
    m = p.match(/a table has the row (\S+) ([a-z]+) → \$?(\S+?)(?: [a-z]+)?, and someone wrote the equation ([a-z]) = (\d+(?:\.\d+)?)([a-z])\. Do they show the same relationship\?/);
    if (m) {
      const kt = Q(m[3]).div(Q(m[1])), ke = Q(m[5]);
      return choiceWhere(q, c => {
        let x = c.match(/^No: the table gives k = (\S+), the equation k = (\S+)$/);
        if (x) return !kt.eq(ke) && val(x[1])?.eq(kt) && val(x[2])?.eq(ke);
        x = c.match(/^Yes: both give k = (\S+)$/);
        if (x) return kt.eq(ke) && val(x[1])?.eq(ke);
        return false;   // "both go up", "both are proportional", "different things" do not compare k
      });
    }
    m = p.match(/^([a-z]) = (\d+(?:\.\d+)?)([a-z]) for .+?\. Fill in the table: ([a-z]) = (\S+) → ([a-z]) = \?/);
    if (m && m[3] === m[4] && m[1] === m[6]) return Q(m[2]).mul(Q(m[5])).value;
    return undefined;
  },
  counterRatio(q) {
    const R = rowsOf(q), rates = R.map(rate);
    const m = q.prompt.match(/([A-Z][a-z]+) says: “Three of the four rows give \$(\S+) per/);
    if (!m || !R.length) return undefined;
    const k = val(m[2]);
    const breaking = rates.map((r, i) => (r && !r.eq(k) ? i : -1)).filter(i => i >= 0);
    return choiceWhere(q, c => {
      const x = c.match(/^([A-Z][a-z]+) is wrong: row (\d+) gives (\S+), and one row is enough to break it$/);
      if (x) return x[1] === m[1] && breaking.includes(+x[2] - 1) && val(x[3])?.eq(rates[+x[2] - 1]);
      return /is right:/.test(c) ? breaking.length === 0 && false : false;
    });
  },
  fixedFee(q) {
    const p = q.prompt;
    let m = p.match(/\$(\S+?) (?:a month|to get in|to start|[a-z ]+?) plus \$(\S+?) per ([a-zA-Z]+)\. .*?What do (\S+) [a-zA-Z]+ cost\?/);
    if (m) return Q(m[1]).add(Q(m[2]).mul(Q(m[4]))).value;
    m = p.match(/same amount for every [a-z]+, with no monthly fee\. .*What does it cost for 0 [A-Za-z]+\?/);
    if (m) return 0;
    return undefined;
  },
  changingRate(q) {
    const p = q.prompt;
    let m = p.match(/priced by area: \$(\S+) per square foot\. .*? has an area of (\d+) sq ft\. What does it cost\?/);
    if (m) return Q(m[1]).mul(+m[2]).value;
    if ((m = p.match(/^1 worker builds a shed in (\d+) hours; 2 workers take (\d+) hours; 3 workers take (\d+) hours\./))) {
      // time goes DOWN as workers go up: not proportional (one multiplier would make both grow together)
      return choiceWhere(q, c => /^No: the hours go down as the workers go up$/.test(c));
    }
    if ((m = p.match(/figure 1 has (\d+) squares, figure 2 has (\d+), figure 3 has (\d+)\./))) {
      const r1 = Q(+m[1]), r2 = Q(+m[2], 2);
      return choiceWhere(q, c => { const x = c.match(/^No: (\d+) ÷ 1 and (\d+) ÷ 2 are different$/); return !!x && +x[1] === +m[1] && +x[2] === +m[2] && !r1.eq(r2); });
    }
    if ((m = p.match(/cost \$(\S+) each, or (\d+) for \$(\S+)\./))) {
      const one = Q(m[1]), per = Q(m[3]).div(+m[2]);
      return choiceWhere(q, c => {
        const x = c.match(/^No: 1 costs \$(\S+) each, but (\d+) cost (less|more) than \$(\S+) each$/);
        return !!x && val(x[1])?.eq(one) && +x[2] === +m[2] && val(x[4])?.eq(one) && (x[3] === 'less' ? per.cmp(one) < 0 : per.cmp(one) > 0);
      });
    }
    return undefined;
  },
  buildCounter(q) {
    const p = q.prompt;
    const claim = /doubling x from 1 to 2 doubles y/.test(p) ? 'double' : /through \(0, 0\)/.test(p) ? 'origin' : /goes up whenever x goes up/.test(p) ? 'increase' : /straight-line graph/.test(p) ? 'straight' : null;
    if (!claim) return undefined;
    return choiceWhere(q, c => {
      // an example: a table "1 → 4, 2 → 8, 3 → 13" or a rule "y = ..."
      let f = null, pts = null;
      const t = c.match(/^((?:\d+ → \d+(?:, )?)+):/);
      if (t) pts = t[1].split(', ').map(s => s.split(' → ').map(Number));
      const e = c.match(/^y = ([^:]+):/);
      if (e) {
        const ex = e[1].replace(/−/g, '-').replace(/(\d)x/g, '$1*x').replace(/x²/g, 'x*x').replace(/²/g, '**2');
        if (!/^[\d x*+\-.()]+$/.test(ex)) return false;
        f = new Function('x', `return ${ex};`);
      }
      if (!f && !pts) return false;   // a sentence is not a counterexample
      const xs = pts ? pts.map(r => r[0]) : [0, 1, 2, 3, 4, 5];
      const y = x => (pts ? pts.find(r => r[0] === x)?.[1] : f(x));
      // not proportional: no single y ÷ x, or not 0 at 0
      const nz = xs.filter(x => x !== 0).map(x => y(x) / x);
      const proportional = nz.every(r => Math.abs(r - nz[0]) < 1e-9) && (!xs.includes(0) || y(0) === 0) && (pts || f(0) === 0);
      let meets;
      if (claim === 'double') meets = y(1) !== undefined && y(2) !== undefined && y(2) === 2 * y(1);
      else if (claim === 'origin') meets = f ? f(0) === 0 : false;
      else if (claim === 'increase') meets = xs.every((x, i) => i === 0 || y(x) > y(xs[i - 1]));
      else if (claim === 'straight') meets = f ? [0, 1, 2, 3, 4].every(x => Math.abs(f(x + 1) - 2 * f(x) + (x > 0 ? f(x - 1) : 2 * f(x) - f(x + 1))) < 1e-9) && Math.abs(f(2) - 2 * f(1) + f(0)) < 1e-9 && Math.abs(f(3) - 2 * f(2) + f(1)) < 1e-9 : false;
      return meets && !proportional;
    });
  },
  applyModel(q) {
    const p = q.prompt;
    let m = p.match(/is \$(\S+) plus \$(\S+) per ([a-z]+)\. .*?What do (\S+) [a-z]+ cost\?/);
    if (m) return Q(m[1]).add(Q(m[2]).mul(Q(m[4]))).value;
    m = p.match(/costs \$(\S+) per ([a-z]+), for any amount\. What do (\S+) [a-z]+ cost\?/);
    if (m) return Q(m[1]).mul(Q(m[3])).value;
    m = p.match(/goes (\S+) miles in (\S+) hours at a steady speed\. How far does it go in (\S+) hours/);
    if (m) return Q(m[1]).div(Q(m[2])).mul(Q(m[3])).value;
    return undefined;
  },
  evidence(q) {
    const p = q.prompt;
    let kind = null;
    if (/plus \$\S+ per /.test(p) || /each, or \d+ for \$/.test(p)) kind = 'Refuted';
    else if (/costs? \$\S+ each, with no other fees/.test(p) || /for any amount, with no other fees/.test(p)) kind = 'Proven proportional';
    else {
      // measured data only: fitting data are only consistent, a mismatch refutes
      let pairs = [];
      let m;
      if ((m = p.match(/stretched (\S+) cm with 1 weight, (\S+) cm with 2 weights and (\S+) cm with 3 weights/))) pairs = [[1, m[1]], [2, m[2]], [3, m[3]]];
      else if ((m = p.match(/after 1 hour it had burned (\S+) cm, after 2 hours (\S+) cm, after 4 hours (\S+) cm/))) pairs = [[1, m[1]], [2, m[2]], [4, m[3]]];
      else if ((m = p.match(/\((\d+) weeks, (\S+) cm\) and \((\d+) weeks, (\S+) cm\)/))) pairs = [[+m[1], m[2]], [+m[3], m[4]]];
      if (!pairs.length) return undefined;
      const rs = pairs.map(([x, y]) => Q(y).div(x));
      kind = rs.every(r => r.eq(rs[0])) ? 'Only consistent' : 'Refuted';
    }
    return choiceWhere(q, c => c.startsWith(kind + ':'));
  },
};

// ---------------------------------------------------------------- sane
function sane(q) {
  const out = [], p = q.prompt, G = P(q).graph;
  switch (q.family) {
    case 'tableTest': case 'counterRatio': case 'nameK': case 'writeEq': {
      const R = rowsOf(q);
      if (R.some(r => r.x.cmp(0) < 0 || r.y.cmp(0) < 0)) out.push('a negative amount in the table');
      if (q.family === 'nameK' || q.family === 'writeEq') {
        const rs = R.filter(r => r.x.n !== 0).map(rate);
        if (rs.length && !rs.every(r => r.eq(rs[0]))) out.push('the table is not proportional, but k is asked');
      }
      break;
    }
    case 'readScale': {
      const mk = G?.mark, L = G?.lines?.[0];
      if (mk && L && !L.b && Math.abs(L.k * mk.x - mk.y) > 1e-9) out.push('the marked point is not on the line');
      if (mk && G && (mk.y > G.yMax || mk.x > G.xMax)) out.push('the marked point is off the graph');
      break;
    }
    case 'kGraph': {
      const mk = G?.mark, L = G?.lines?.[0];
      if (mk && L && Math.abs(L.k * mk.x - mk.y) > 1e-9) out.push('the marked point is not on the line');
      break;
    }
    case 'interpret': {
      const m = p.match(/marked point \((\S+), (\S+)\)/), mk = G?.mark;
      if (m && mk && !(same(+m[1], mk.x) && same(+m[2], mk.y))) out.push('the drawn mark is not the named point');
      break;
    }
    case 'nameK': {
      const m = p.match(/matches ([\d., ]+) ([a-z ]+?) with ([\d., ]+) ([a-z ]+?)\./);
      if (m) {
        const xs = m[1].split(',').map(s => Q(s.trim())), ys = m[3].split(',').map(s => Q(s.trim()));
        const rs = xs.map((x, i) => (x.n ? ys[i].div(x) : null)).filter(Boolean);
        if (!rs.every(r => r.eq(rs[0]))) out.push('the double number line is not proportional');
      }
      break;
    }
    case 'fixedFee': {
      const m = p.match(/\$(\S+?) (?:a month|to get in|to start|[a-z ]+?) plus \$(\S+?) per [a-zA-Z]+\. (\S+) [a-zA-Z]+ cost \$(\S+?)\./);
      if (m && !Q(m[1]).add(Q(m[2]).mul(Q(m[3]))).eq(Q(m[4]))) out.push('the stated cost does not fit the fee and rate');
      const d = p.match(/(\d+) GB cost \$(\d+(?:\.\d+)?) and (\d+) GB cost \$(\d+(?:\.\d+)?)\./);
      if (d && !Q(d[2]).div(+d[1]).eq(Q(d[4]).div(+d[3]))) out.push('the two costs give different rates');
      break;
    }
    case 'applyModel': {
      const m = p.match(/is \$(\S+) plus \$(\S+) per ([a-z]+)\. (\S+) [a-z]+ cost \$(\S+?)\./);
      if (m && !Q(m[1]).add(Q(m[2]).mul(Q(m[4]))).eq(Q(m[5]))) out.push('the stated cost does not fit the fee and rate');
      const c = p.match(/\(check: between \$(\S+) and \$(\S+)\)/), v = F.applyModel(q);
      if (c && v !== undefined && !(v >= +c[1] && v <= +c[2])) out.push('the answer is outside the stated check');
      break;
    }
    case 'situation': {
      const m = p.match(/\(0 hours: \$0, 1 hour: \$(\d+), 2 hours: \$(\d+), (\d+) hours: \$(\d+)\.\)/);
      const t = p.match(/costs \$(\d+) an hour for the first (\d+) hours, then \$(\d+) an hour after that/);
      if (m && t && (+m[1] !== +t[1] || +m[2] !== 2 * +t[1] || +m[4] !== +t[1] * +t[2] + +t[3] * (+m[3] - +t[2]))) out.push('the listed parking costs do not follow the stated prices');
      break;
    }
    default: break;
  }
  if (q.input === 'choice') {
    let r; try { r = F[q.family]?.(q); } catch { r = undefined; }
    if (r === -1) out.push('no single right choice');
  }
  return [...new Set(out)].join('; ');
}

export default {
  solve(q) {
    const f = F[q.family];
    if (!f) return undefined;
    try { return f(q); } catch { return undefined; }
  },
  sane,
};
