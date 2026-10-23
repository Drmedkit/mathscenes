// Oracle for the lesson "ratio-tables-and-proportions" (ratio tables, 6.RP.A.1-3, 7.RP.A.2.a-b), role O in
// docs/lessons/QUALITY_LAYER.md. Every answer is worked out from what the student sees: the story in the prompt, the
// visible cells of the drawn table (hidden "?" cells are never read), the drawn graph points, and the choices. Choice
// items are judged claim by claim: a choice is right only when its verdict is true AND its reason is a true fact that
// actually supports that verdict ("more of it costs more" is true for a fee, but proves nothing).
import { Q } from '../../tools/quality/oracle-kit.mjs';

// ---------------------------------------------------------------- reading
const NUM = '(\\d+ \\d+\\/\\d+|\\d+\\/\\d+|\\d+(?:\\.\\d+)?|\\.\\d+)';
/** '1 1/2' / '3/4' / '2.40' / '$7' → exact Q */
const qv = s => Q(String(s).replace(/[$,]/g, '').replace(/−/g, '-').trim());
const eq = (a, b) => qv(a).eq(qv(b));
/** a money / rounded value claim: v equals the exact x, or x rounded to cents */
const centsEq = (v, x) => Math.abs(qv(v).value - x.value) < 0.005 + 1e-9 && (qv(v).eq(x) || Math.abs(Math.round(x.value * 100) / 100 - qv(v).value) < 1e-9);

const SING = { feet: 'foot', foot: 'foot', loaves: 'loaf', cost: 'dollar', area: 'sqft', people: 'person', score: 'point' };
/** a noun → its kind: singular, lower case ('batches' → 'batch', 'cost' → 'dollar', 'area' → 'sqft') */
function kindOf(w) {
  w = String(w ?? '').toLowerCase().trim();
  if (!w) return '';
  if (SING[w]) return SING[w];
  if (/(ches|shes|sses|xes)$/.test(w)) return w.slice(0, -2);
  if (/s$/.test(w) && !/ss$/.test(w)) return w.slice(0, -1);
  return w;
}
const STOP = new Set(['and', 'in', 'is', 'for', 'from', 'on', 'to', 'the', 'more', 'times', 'per', 'a', 'of', 'with', 'than', 'at', 'be', 'must', 'not']);
/** every quantity in a sentence: { v: Q, kind, per? } ("$9 per pound" → kind dollar, per pound) */
function quants(s) {
  const out = [];
  const re = new RegExp(`(\\$)?${NUM}(?:-([a-z]+))?((?:\\s+[A-Za-z]+){0,5})`, 'g');
  for (const m of String(s).matchAll(re)) {
    const words = m[4].trim().split(/\s+/).filter(Boolean).map(x => x.toLowerCase());
    let kind = '';
    if (m[1]) kind = 'dollar';
    else if (m[3]) kind = kindOf(m[3]);
    else if (words.length && !STOP.has(words[0])) {
      if (words[0] === 'bus') kind = kindOf(words[1]);
      else if (words[0] === 'square') kind = 'sqft';
      else kind = kindOf(words[0]);
    }
    let per = null;
    const pi = words.indexOf('per');
    if (pi >= 0 && pi <= 3 && words[pi + 1]) per = kindOf(words[pi + 1]);
    out.push({ v: qv(m[2]), kind, per, at: m.index });
  }
  return out;
}
/** "One pound of apples costs" / "A pizza uses" → "1 pound of apples costs" */
const ones = s => s.replace(/(^|\.\s+)(?:One|A|An) (pound|notebook|bottle|lap|pizza|loaf|batch|bag|can|ticket)\b/g, '$11 $2');
const sentences = p => ones(p).split(/(?<=[.?!])\s+(?=[A-Z0-9“"])/);
/** the facts of a story: sentences (not questions) with two quantities of different kinds, or "x U per W" */
function facts(p) {
  const out = [];
  for (const s of sentences(p)) {
    if (/\?/.test(s)) continue;
    const qs = quants(s).filter(x => x.kind);
    const f = {};
    for (const x of qs) {
      if (x.per && !f[x.per]) { f[x.kind] = x.v; f[x.per] = Q(1); continue; }
      if (!(x.kind in f)) f[x.kind] = x.v;
    }
    if (Object.keys(f).length >= 2) out.push(f);
  }
  return out;
}
/** the question sentence(s) */
const question = p => sentences(p).filter(s => /\?/.test(s)).join(' ');
/** what the answer box asks for: { kind } or { rate: [num, den] } */
function asked(unit) {
  const u = String(unit).toLowerCase().trim();
  let m = u.match(/^(.+?) per (.+)$/);
  if (m) return { rate: [kindOf(m[1] === 'square feet' ? 'sqft' : m[1]), kindOf(m[2])] };
  if (u === 'square feet') return { kind: 'sqft' };
  if (u === 'dollars') return { kind: 'dollar' };
  return { kind: kindOf(u) };
}
const tableOf = (q, i = 0) => q.data?.pic?.p?.tables?.[i] ?? null;
const heads = t => (t?.heads ?? []).map(h => kindOf(h[0]));
/** the cells the student sees: rows with hidden cells left out */
function visibleRows(t) {
  if (!t) return [];
  const hid = new Set((t.hide ?? []).map(([r, c]) => `${r},${c}`));
  return t.rows.map((r, i) => r.map((v, j) => (hid.has(`${i},${j}`) ? null : Q(v)))).filter(r => r.every(v => v !== null));
}

// ---------------------------------------------------------------- proportional answers from a story
/** answer for a missing-value question: the fact's ratio applied to the given number */
function propAnswer(q, f) {
  const a = asked(q.unit);
  if (a.rate) {
    const [n, d] = a.rate;
    if (!(n in f) || !(d in f)) throw new Error(`rate ${n}/${d} not in ${JSON.stringify(Object.keys(f))}`);
    return f[n].div(f[d]);
  }
  const want = a.kind;
  if (!(want in f)) throw new Error(`asked ${want} not in the fact ${JSON.stringify(Object.keys(f))}`);
  const qs = quants(ones(question(q.prompt)));
  const other = Object.keys(f).find(k => k !== want);
  // the given number: the question's quantity of a fact kind other than the asked one, or a bare number
  let g = qs.find(x => x.kind && x.kind !== want && x.kind in f) ?? qs.find(x => !x.kind || !(x.kind in f));
  if (!g) throw new Error('no given number in the question');
  const gk = g.kind && g.kind in f && g.kind !== want ? g.kind : other;
  return g.v.mul(f[want]).div(f[gk]);
}
const out = (q, v) => (q.input === 'frac' ? v.pair : v.value);

// ---------------------------------------------------------------- tables: proportional?
/** quotients second ÷ first of rows with first ≠ 0; prop = all equal and every 0 row is 0 : 0 */
function tableTest(rows) {
  const qs = rows.filter(r => r[0].n !== 0).map(r => ({ x: r[0], y: r[1], k: r[1].div(r[0]) }));
  const zeroOk = rows.filter(r => r[0].n === 0).every(r => r[1].n === 0);
  const prop = zeroOk && qs.length > 0 && qs.every(r => r.k.eq(qs[0].k));
  return { qs, prop, zeroOk };
}
/** the quotient most rows share (the "rule" an off row breaks) */
function modeK(qs) {
  const c = new Map();
  for (const r of qs) { const k = String(r.k); c.set(k, (c.get(k) ?? 0) + 1); }
  let best = null, n = 0;
  for (const [k, v] of c) if (v > n) { best = k; n = v; }
  return best === null ? null : Q(best);
}
/** judge one claim about a table; true = this choice is right (true verdict + a reason that supports it) */
function judgeTable(c, rows) {
  const T = tableTest(rows), { qs, prop } = T;
  const k0 = modeK(qs);
  let m;
  const t = c.replace(/’/g, "'");
  if ((m = t.match(/^Proportional: (?:\w+) ÷ (?:\w+) = (\S+) in every row/))) return prop && qs[0].k.eq(qv(m[1]));
  if ((m = t.match(/^Proportional: \$(\S+) per pound in every row/))) return prop && qs.every(r => centsEq(m[1], r.k));
  if ((m = t.match(/^Not proportional: the (\S+) row gives (\S+), not (\S+)$/))) {
    const r = qs.find(r => r.x.eq(qv(m[1])));
    return !prop && !!r && r.k.eq(qv(m[2])) && qs.filter(o => o !== r).every(o => o.k.eq(qv(m[3]))) && !r.k.eq(qv(m[3]));
  }
  if ((m = t.match(/^Not proportional: (\S+) pounds gives \$(\S+) per pound, not \$(\S+)$/))) {
    const r = qs.find(r => r.x.eq(qv(m[1])));
    return !prop && !!r && centsEq(m[2], r.k) && qs.filter(o => o !== r).every(o => centsEq(m[3], o.k)) && !centsEq(m[3], r.k);
  }
  if ((m = t.match(/^Not proportional: the \w+ stay (\S+), so/))) return !prop && rows.every(r => r[1].eq(qv(m[1])));
  if ((m = t.match(/^Not proportional: (?:\w+ ÷ \w+ is |\$)(\S+?)(?: per pound)?(?: in one row but |, then \$)(\S+?)(?: in the next)?$/))) {
    for (let i = 0; i + 1 < qs.length; i++) {
      const ok = (v, x) => (/\$/.test(t) ? centsEq(v, x) : x.eq(qv(v)));
      if (ok(m[1], qs[i].k) && ok(m[2], qs[i + 1].k) && !qs[i].k.eq(qs[i + 1].k)) return !prop;
    }
    return false;
  }
  // zero-row claims
  if ((m = t.match(/^Yes: 0 : 0 fits, and the other rows all give (\S+)$/))) return prop && rows.some(r => r[0].n === 0 && r[1].n === 0) && qs.every(r => r.k.eq(qv(m[1])));
  if ((m = t.match(/^No: (\S+) ÷ (\S+) is not (\S+)$/))) {
    const r = qs.find(r => r.y.eq(qv(m[1])) && r.x.eq(qv(m[2])));
    return !prop && !!r && !r.k.eq(qv(m[3])) && qs.filter(o => o !== r).every(o => o.k.eq(qv(m[3])));
  }
  if ((m = t.match(/^No: the 0 row already has (\S+), a start amount$/))) return !prop && rows.some(r => r[0].n === 0 && r[1].eq(qv(m[1])) && r[1].n !== 0);
  if ((m = t.match(/^Yes: ((?:\S+ ÷ \S+ = )+)(\S+)$/))) return prop && qs.every(r => r.k.eq(qv(m[2])));
  // reasons that never prove the verdict they give
  void k0;
  return false;
}

// ---------------------------------------------------------------- families
const F = {};

F.pairUp = q => {
  const f = facts(q.prompt)[0];
  const m = q.prompt.match(/the columns (\w+) and (\w+)/);
  const [a, b] = [kindOf(m[1]), kindOf(m[2])];
  const A = f[a], B = f[b];
  return pick(q, c => { const v = c.split('|').map(s => qv(s.trim())); return v.length === 2 && v[0].eq(A) && v[1].eq(B); });
};
F.timesAsMany = q => out(q, propAnswer(q, facts(q.prompt)[0]));
F.whatStays = q => {
  const t = tableOf(q), H = heads(t), rows = visibleRows(t);
  const col = w => H.indexOf(kindOf(w));
  return pick(q, c => {
    let m;
    if ((m = c.match(/^The (\w+(?: \w+)?) is always (\S+) times the (\w+)\.$/))) { const [i, j] = [col(m[1]), col(m[3])]; return i >= 0 && j >= 0 && rows.every(r => r[i].eq(r[j].mul(qv(m[2])))); }
    if ((m = c.match(/^The (\w+(?: \w+)?) is always (\S+) more than the (\w+)\.$/))) { const [i, j] = [col(m[1]), col(m[3])]; return i >= 0 && j >= 0 && rows.every(r => r[i].eq(r[j].add(qv(m[2])))); }
    if (/stay the same\.$/.test(c)) return rows.every(r => r[0].eq(rows[0][0]) && r[1].eq(rows[0][1]));
    return false;
  });
};
F.ratioOrDiff = q => {
  const pairs = [...q.prompt.matchAll(/\((\d+), (\d+)\)/g)].map(m => [Q(+m[1]), Q(+m[2])]);
  const times = k => pairs.every(([x, y]) => y.eq(x.mul(k)));
  const more = d => pairs.every(([x, y]) => y.eq(x.add(d)));
  const anyTimes = times(pairs[0][1].div(pairs[0][0])), anyMore = more(pairs[0][1].sub(pairs[0][0]));
  return pick(q, c => {
    let m;
    if ((m = c.match(/^y is always (\S+) times as much as x$/))) return times(qv(m[1]));
    if ((m = c.match(/^y is always (\S+) more than x$/))) return more(qv(m[1]));
    if (/^Neither/.test(c)) return !anyTimes && !anyMore;
    return false;
  });
};

/** the situation a words-only story describes */
function situation(p) {
  if (/no other charges|for any amount/.test(p)) return 'prop';
  if (/fee/.test(p)) return 'fee';
  if (/trip is driven|painters|shared equally/.test(p)) return 'inverse';
  if (/years older/.test(p)) return 'diff';
  if (/movie|musicians/.test(p)) return 'constant';
  throw new Error('unknown situation: ' + p);
}
F.situation = q => {
  const s = situation(q.prompt);
  const prop = s === 'prop';
  return pick(q, c => {
    const yes = /^Yes/.test(c);
    if (yes !== prop) return false;
    const r = c.replace(/^(Yes|No): /, '');
    // reasons that are true AND settle the question
    if (/^double the amount, double the cost, and 0 costs \$0$/.test(r)) return s === 'prop';
    if (/^the fee is paid even for 0$/.test(r)) return s === 'fee';
    if (/^more of one means less of the other$/.test(r)) return s === 'inverse';
    if (/^the second amount stays the same$/.test(r)) return s === 'constant';
    if (/^the difference stays the same, not the ratio$/.test(r)) return s === 'diff';
    return false;   // "more of it costs more", "the cost changes", "everything at a steady rate", "one is older", ...
  });
};
F.doubleIt = q => {
  const p = q.prompt;
  let m;
  if ((m = p.match(new RegExp(`\\$${NUM} per bag plus a \\$${NUM} delivery fee.*What do ${NUM} bags cost\\?`)))) return qv(m[1]).mul(qv(m[3])).add(qv(m[2])).value;
  if ((m = p.match(new RegExp(`^${NUM} painters.* in ${NUM} hours\\. How long do ${NUM} painters take\\?`)))) return qv(m[1]).mul(qv(m[2])).div(qv(m[3])).value;
  if ((m = p.match(new RegExp(`musicians play a ${NUM}-minute song`)))) return qv(m[1]).value;   // the song is as long, however many play
  throw new Error('unknown doubleIt story');
};
F.pairTable = q => {
  const recs = [...q.prompt.matchAll(/[A-Z][a-z]+ (?:ran|swam|studied) (\d+) \w+ (?:in|and scored) (\d+)/g)].map(m => [Q(+m[1]), Q(+m[2])]);
  const n = qv(q.prompt.match(/What goes with (\d+)\?/)[1]);
  const hits = recs.filter(r => r[0].eq(n));
  return hits.length === 1 ? hits[0][1].value : undefined;
};
F.labelTable = q => {
  const t = tableOf(q);
  const noHeads = (t?.heads ?? []).every(h => h[0] === '?');
  return pick(q, c => /^The name and unit of each column$/.test(c) && noHeads);
};
F.buildUp = q => {
  const m = q.prompt.match(new RegExp(`uses ${NUM} \\w+ of (\\w+) and ${NUM} \\w+ of (\\w+)\\..*What goes with ${NUM}\\?`));
  const t = tableOf(q), H = heads(t);
  // the number asked about is in the first column of the table
  const first = H[0] === kindOf(m[2]) ? qv(m[1]) : qv(m[3]);
  const second = H[0] === kindOf(m[2]) ? qv(m[3]) : qv(m[1]);
  return qv(m[5]).mul(second).div(first).value;
};
F.unitRow = q => out(q, propAnswer(q, facts(q.prompt)[0]));
F.midRow = q => out(q, propAnswer(q, facts(q.prompt)[0]));
F.rateUnit = q => {
  const f = facts(q.prompt)[0];
  return pick(q, c => {
    const m = c.match(new RegExp(`^${NUM} (.+?) per (.+)$`));
    if (!m) return false;
    const n = kindOf(m[2] === 'square feet' ? 'sqft' : m[2]), d = kindOf(m[3] === 'square foot' ? 'sqft' : m[3]);
    return n in f && d in f && n !== d && f[n].div(f[d]).eq(qv(m[1]));
  });
};
F.canWeFind = q => {
  const f = facts(q.prompt)[0];
  const m = q.prompt.match(/find the (\w+) for (\d+)\?/);
  const want = kindOf(m[1]), N = qv(m[2]);
  const given = Object.keys(f).find(k => k !== want);
  return pick(q, c => {
    const d = c.match(/^Yes: divide both by (\S+), then multiply both by (\S+)$/);
    if (d) return f[given].div(qv(d[1])).mul(qv(d[2])).eq(N);
    return false;   // "No: not a multiple" (a table can always get there), "add / subtract k to both columns" (breaks the ratio)
  });
};
/** two facts, the second-row operation the prompt asks (add / subtract) */
function twoRows(q) {
  const fs = facts(q.prompt);
  return fs;
}
F.addRows = q => out(q, propAnswer(q, twoRows(q)[0]));
F.subRows = q => out(q, propAnswer(q, twoRows(q)[0]));
F.feeRows = q => {
  const p = q.prompt;
  const m = p.match(new RegExp(`\\$${NUM} per (pound|hour)(?: plus a \\$${NUM} fee|, no other charges)`));
  const rate = qv(m[1]), fee = m[3] ? qv(m[3]) : Q(0), unit = m[2];
  const lee = p.match(new RegExp(`“${NUM} \\w+ must cost \\$${NUM}\\.”`));
  const leeRight = rate.mul(qv(lee[1])).add(fee).eq(qv(lee[2]));
  return pick(q, c => {
    let r;
    if ((r = c.match(/^No: the \$(\S+) fee would be paid twice$/))) return !leeRight && fee.n !== 0 && fee.eq(qv(r[1]));
    if (/^No: a fee would be paid twice$/.test(c)) return !leeRight && fee.n !== 0;
    if ((r = c.match(new RegExp(`^Yes: every row is \\$${NUM} per (\\w+), so rows add$`)))) return leeRight && fee.n === 0 && rate.eq(qv(r[1])) && r[2] === unit;
    return false;   // "adding two rows always gives a row", "6 is 1 + 5", "only multiply a row"
  });
};
F.route = q => {
  const fs = facts(q.prompt);
  const qq = quants(question(q.prompt));
  const N = (qq.find(x => x.kind && fs[0] && x.kind in fs[0] && x.kind !== asked(q.unit).kind) ?? qq[0])?.v;
  // the first column of each known row (the kind of N)
  const nk = qq.find(x => x.kind && x.kind in fs[0])?.kind ?? Object.keys(fs[0])[0];
  const xs = fs.map(f => f[nk]);
  const cands = (q.choices ?? []).map(c => {
    let m;
    if (/^Add the two rows you know$/.test(c)) return { ok: xs.length === 2 && xs[0].add(xs[1]).eq(N), steps: 1 };
    if ((m = c.match(/^Multiply both columns by (\S+): one step$/))) return { ok: xs[0].mul(qv(m[1])).eq(N), steps: 1 };
    if ((m = c.match(/^Find the row for 1, then multiply by (\S+)$/))) return { ok: qv(m[1]).eq(N), steps: 2 };
    if ((m = c.match(/^Divide both by (\S+), then multiply both by (\S+)$/))) return { ok: xs[0].div(qv(m[1])).mul(qv(m[2])).eq(N), steps: 2 };
    return { ok: false, steps: 9 };   // add k to both columns, "None", rounding a rate
  });
  const best = Math.min(...cands.filter(c => c.ok).map(c => c.steps));
  const hits = cands.map((c, i) => (c.ok && c.steps === best ? i : -1)).filter(i => i >= 0);
  return hits.length === 1 ? hits[0] : -1;
};
F.compare = q => {
  const p = q.prompt;
  let m, A, B, better;
  if ((m = p.match(new RegExp(`Store A sells ${NUM} [\\w ]+? for \\$${NUM}\\. Store B sells ${NUM} [\\w ]+? for \\$${NUM}\\.`)))) {
    A = qv(m[2]).div(qv(m[1])); B = qv(m[4]).div(qv(m[3]));   // price per item: lower is better
    better = A.cmp(B) < 0 ? 'Store A' : A.cmp(B) > 0 ? 'Store B' : 'same';
  } else if ((m = p.match(new RegExp(`(\\w+) covers ${NUM} miles in ${NUM} hours? and (\\w+) covers ${NUM} miles in ${NUM} hours?`)))) {
    A = qv(m[2]).div(qv(m[3])); B = qv(m[5]).div(qv(m[6]));
    better = A.cmp(B) > 0 ? m[1] : A.cmp(B) < 0 ? m[4] : 'same';
  } else if ((m = p.match(new RegExp(`Mix A uses ${NUM} cups? of juice for every ${NUM} cups? of water\\. Mix B uses ${NUM} cups? of juice for every ${NUM} cups? of water`)))) {
    A = qv(m[1]).div(qv(m[2])); B = qv(m[3]).div(qv(m[4]));
    better = A.cmp(B) > 0 ? 'Mix A' : A.cmp(B) < 0 ? 'Mix B' : 'same';
  } else throw new Error('unknown compare story');
  return pick(q, c => (better === 'same' ? /^(Both|They)/.test(c) : c === better));
};
F.testTable = q => { const rows = visibleRows(tableOf(q)); return pick(q, c => judgeTable(c, rows)); };
F.moneyTest = F.testTable;
F.zeroRow = q => {
  const rows = visibleRows(tableOf(q));
  if (/What does that row tell you/.test(q.prompt)) return pick(q, c => /^Only that it fits: 0 ÷ 0 gives no rate, so check the other rows$/.test(c));
  return pick(q, c => judgeTable(c, rows));
};
F.predict = q => {
  const p = q.prompt;
  let m;
  if ((m = p.match(new RegExp(`from ${NUM} shirts on, each shirt is \\$${NUM}\\. Can the table predict the price of ${NUM} shirts\\?`)))) {
    const T = qv(m[1]), N = qv(m[3]);
    const rows = visibleRows(tableOf(q)), tt = tableTest(rows);
    return pick(q, c => {
      let r;
      if ((r = c.match(/^No: from (\S+) shirts on, a different price applies$/))) return N.cmp(T) >= 0 && qv(r[1]).eq(T);
      if ((r = c.match(/^Yes: every row gives \$(\S+) a shirt, so \$(\S+)$/))) return N.cmp(T) < 0 && tt.prop && qv(r[2]).eq(N.mul(qv(r[1])));
      return false;
    });
  }
  if (/no story/.test(p)) return pick(q, c => /^Not for sure: the rows fit, but only a rule from the situation can promise it$/.test(c));
  if ((m = p.match(new RegExp(`a \\$${NUM} flat fee plus \\$${NUM} per pound\\. .*Is ${NUM} pounds \\$${NUM}\\?`)))) {
    const cost = qv(m[1]).add(qv(m[2]).mul(qv(m[3])));
    return pick(q, c => {
      let r;
      if ((r = c.match(/^No: (\S+) pounds cost \$(\S+); the fee is paid once$/))) return !cost.eq(qv(m[4])) && qv(r[1]).eq(qv(m[3])) && qv(r[2]).eq(cost);
      if (/^Yes/.test(c)) return false;   // doubling or "same amount each pound" both ignore the fee
      return false;
    });
  }
  if ((m = p.match(new RegExp(`at \\$${NUM} per pound, for any amount\\..*predict the price of ${NUM} pounds\\?`)))) {
    const cost = qv(m[1]).mul(qv(m[2]));
    return pick(q, c => { const r = c.match(/^Yes: the store promises \$(\S+) per pound, so \$(\S+)$/); return !!r && qv(r[1]).eq(qv(m[1])) && qv(r[2]).eq(cost); });
  }
  throw new Error('unknown predict story');
};
F.moneyRow = q => out(q, propAnswer(q, facts(q.prompt)[0]));
F.fracRate = q => out(q, propAnswer(q, facts(q.prompt)[0]));
F.graphLine = q => {
  const pts = (q.data?.pic?.p?.graph?.pts ?? []).map(([x, y]) => [Q(x), Q(y)]);
  const [x0, y0] = pts[0], [x1, y1] = pts[1];
  const slope = y1.sub(y0).div(x1.sub(x0)), icpt = y0.sub(slope.mul(x0));
  const line = pts.every(([x, y]) => y.eq(icpt.add(slope.mul(x))));
  const through0 = line && icpt.n === 0;
  const flat = line && slope.n === 0;
  return pick(q, c => {
    if (/^Yes: the points are on a straight line through \(0, 0\)$/.test(c)) return through0;
    if (/^No: the line is flat, so y ÷ x changes$/.test(c)) return flat && icpt.n !== 0;
    if (/^No: the line is straight but misses \(0, 0\)$/.test(c)) return line && icpt.n !== 0;
    return false;   // "on a straight line" (not enough), "same height", "two of the points", "too steep", "no point at (0, 0)"
  });
};
F.tolerance = q => {
  const p = q.prompt;
  const m = p.match(new RegExp(`stretches ${NUM} cm for every ${NUM} kg\\..*off by up to ${NUM} cm`));
  const k = qv(m[1]).div(qv(m[2])), tol = qv(m[3]);
  const rows = visibleRows(tableOf(q));
  const gaps = rows.map(r => { const g = r[1].sub(r[0].mul(k)); return g.n < 0 ? g.neg() : g; });
  const allIn = gaps.every(g => g.cmp(tol) <= 0);
  return pick(q, c => {
    let r;
    if ((r = c.match(/^Yes: every gap is at most (\S+) cm$/))) return allIn && qv(r[1]).eq(tol);
    if ((r = c.match(/^No: one gap, (\S+) cm, is more than (\S+) cm$/))) return !allIn && qv(r[2]).eq(tol) && gaps.some(g => g.eq(qv(r[1])) && g.cmp(tol) > 0);
    return false;   // "most gaps are small", "just measurement error", "not exactly k, 2k", "a gap of tol is too big"
  });
};

/** index of the one choice that passes; -1 when none or several do (the sweep then reports it) */
function pick(q, pred) {
  const hits = (q.choices ?? []).map((c, i) => (pred(c.replace(/’/g, "'").trim(), i) ? i : -1)).filter(i => i >= 0);
  return hits.length === 1 ? hits[0] : -1;
}

// ---------------------------------------------------------------- the world
const FIXED = { 'quart/pint': 2, 'gallon/quart': 4, 'yard/foot': 3 };
const H0 = t => (t?.heads ?? []).every(h => h[0] === '?');
function sane(q) {
  const probs = [];
  // fixed unit conversions in a drawn table or a story (1 quart = 2 pints, 1 gallon = 4 quarts, 1 yard = 3 feet)
  for (const t of q.data?.pic?.p?.tables ?? []) {
    const named = q.prompt.match(/writes down the (\w+) and the (\w+)/);   // a table without headers: the story names the columns
    const H = named && H0(t) ? [kindOf(named[1]), kindOf(named[2])] : heads(t), k = FIXED[`${H[0]}/${H[1]}`];
    if (k) for (const r of visibleRows(t)) if (!r[1].eq(r[0].mul(k))) { { const nm = named && H0(t) ? [named[1], named[2]] : t.heads.map(h => h[0]); probs.push(`${r[0]} ${nm[0]} shown as ${r[1]} ${nm[1]} (1 ${H[0]} = ${k} ${nm[1]})`); }; break; }
    // a hiker faster than 5 mph is running
    if (H[0] === 'hour' && H[1] === 'mile' && /hiker/.test(q.prompt)) {
      for (const r of visibleRows(t)) if (r[0].n && r[1].div(r[0]).value > 5) { probs.push(`a hiker at ${+r[1].div(r[0]).value.toFixed(2)} mph`); break; }
    }
  }
  for (const f of facts(q.prompt)) for (const [pair, k] of Object.entries(FIXED)) {
    const [a, b] = pair.split('/');
    if (f[a] && f[b] && !f[b].eq(f[a].mul(k))) probs.push(`${f[a]} ${a}s = ${f[b]} ${b}s in the story`);
  }
  for (const x of quants(q.prompt)) if (x.kind === 'dollar' && x.v.n === 0 && !/costs \$0/.test(q.prompt)) probs.push('a price of $0');
  return [...new Set(probs)].join('; ');
}

function solve(q) {
  const f = F[q.family];
  if (!f) return undefined;
  return f(q);
}

export default { solve, sane };
