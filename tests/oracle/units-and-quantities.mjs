// units-and-quantities oracle (role O, docs/lessons/QUALITY_LAYER.md). Works every practice item out from what the
// student sees: the numbers and units in the prompt and on the board, the choices, and (graph items) the axes the
// picture draws. Unit facts are the real US / metric definitions (12 in = 1 ft, 3 ft = 1 yd, 5,280 ft = 1 mi,
// 16 oz = 1 lb, 2,000 lb = 1 ton, 2 pt = 1 qt, 4 qt = 1 gal, 1 in = 2.54 cm exactly, F = 9/5 C + 32), kept exact (Q).
// Reporting precision follows the rule the lesson teaches (DESIGN.md): keep only the digits the whole possible
// range agrees on, i.e. the finest place at which both ends of the range round to the same value.
import { Q, round } from '../../tools/quality/oracle-kit.mjs';

// ---------------------------------------------------------------- numbers
function qn(t) {
  const s = String(t).replace(/[−–]/g, '-').replace(/[$,\s]/g, '').replace(/\.$/, '');
  const m = s.match(/^(-?)(\d*)(?:\.(\d+))?$/);
  if (!m || (m[2] === '' && !m[3])) throw new Error(`not a number: ${t}`);
  const d = m[3] ? 10 ** m[3].length : 1, n = Number((m[2] || '0') + (m[3] || ''));
  return Q(m[1] ? -n : n, d);
}
/** "5 13/16", "13/16", "6", "12.765", "1,000" → Q */
function qmix(t) {
  const s = String(t).trim().replace(/[−–]/g, '-');
  let m = s.match(/^(-?)(\d+)\s+(\d+)\/(\d+)$/);
  if (m) { const f = Q(Number(m[3]), Number(m[4])).add(Number(m[2])); return m[1] ? f.neg() : f; }
  m = s.match(/^(-?\d+)\/(\d+)$/);
  if (m) return Q(Number(m[1]), Number(m[2]));
  return qn(s);
}
const NUM = '[−-]?\\$?\\d[\\d,]*(?:\\.\\d+)?';
const MIX = '\\d+ \\d+/\\d+|\\d+/\\d+|\\d[\\d,]*(?:\\.\\d+)?';
const re = (src, f = '') => new RegExp(src.replace(/#/g, `(${NUM})`).replace(/@/g, `(${MIX})`), f);
const decimals = s => { const m = String(s).replace(/,/g, '').match(/\.(\d+)/); return m ? m[1].length : 0; };
const v = x => x.value;
function pick(q, pred) {
  const hits = (q.choices ?? []).map((c, i) => { try { return pred(c, i) ? i : -1; } catch { return -1; } }).filter(i => i >= 0);
  return hits.length === 1 ? hits[0] : -1;
}
const choiceRe = (q, r) => pick(q, c => r.test(c));

// ---------------------------------------------------------------- unit facts (exact)
// each unit: [dimension, size in the dimension's base]. Metric mass and volume stay in their own dimension (no
// cross-system mass/volume item exists); length crosses through 1 in = 2.54 cm exactly.
const MM = Q(5, 127); // 1 mm in inches
const UNITS = {
  in: ['L', Q(1)], ft: ['L', Q(12)], yd: ['L', Q(36)], mi: ['L', Q(63360)],
  mm: ['L', MM], cm: ['L', MM.mul(10)], m: ['L', MM.mul(1000)], km: ['L', MM.mul(1000000)],
  s: ['T', Q(1)], min: ['T', Q(60)], h: ['T', Q(3600)],
  oz: ['W', Q(1)], lb: ['W', Q(16)], ton: ['W', Q(32000)],
  g: ['Wm', Q(1)], kg: ['Wm', Q(1000)],
  pt: ['V', Q(1)], qt: ['V', Q(2)], gal: ['V', Q(8)],
  mL: ['Vm', Q(1)], L: ['Vm', Q(1000)],
  '$': ['M', Q(100)], '¢': ['M', Q(1)],
};
const WORD = {
  inch: 'in', inches: 'in', foot: 'ft', feet: 'ft', yard: 'yd', yards: 'yd', mile: 'mi', miles: 'mi',
  millimeters: 'mm', centimeters: 'cm', meters: 'm', kilometers: 'km', seconds: 's', minutes: 'min', hours: 'h',
  ounces: 'oz', pounds: 'lb', tons: 'ton', grams: 'g', kilograms: 'kg', pints: 'pt', quarts: 'qt', gallons: 'gal',
  milliliters: 'mL', liters: 'L', dollars: '$', cents: '¢',
};
const unitOf = u => {
  const k = WORD[u] ?? (u === 'tons' ? 'ton' : u);
  if (!UNITS[k]) throw new Error(`unknown unit ${u}`);
  return k;
};
/** factor: 1 a = factor b */
function factor(a, b) {
  const [da, sa] = UNITS[unitOf(a)], [db, sb] = UNITS[unitOf(b)];
  if (da !== db) throw new Error(`cannot convert ${a} to ${b}`);
  return sa.div(sb);
}
/** "288 in" → { n: Q, u } */
function qty(t) {
  const m = String(t).trim().match(/^(\$?)([−-]?\d[\d,]*(?:\.\d+)?)\s*([A-Za-z¢$]+)?/);
  if (!m) throw new Error(`not a quantity: ${t}`);
  return { n: qn(m[2]), u: m[1] ? '$' : unitOf(m[3]) };
}
const inBase = x => x.n.mul(UNITS[x.u][1]);

// ---------------------------------------------------------------- unit algebra (symbols, no conversion)
const SUP = { '²': 2, '³': 3 };
/** "lb/ft³", "mi·h", "people/mi^2", "dollars", "$" → { sym: exp } */
function uparse(t) {
  const out = {};
  const add = (tok, sgn) => {
    tok = tok.trim();
    if (!tok) return;
    let m = tok.match(/^([A-Za-z$¢]+)(?:\^(\d)|([²³]))?$/);
    if (!m) throw new Error(`unit token ${tok}`);
    let s = m[1] === 'dollars' ? '$' : m[1];
    const e = m[2] ? Number(m[2]) : m[3] ? SUP[m[3]] : 1;
    out[s] = (out[s] ?? 0) + sgn * e;
    if (!out[s]) delete out[s];
  };
  const parts = String(t).split('/');
  parts[0].split(/[·\s]+/).forEach(x => add(x, 1));
  parts.slice(1).forEach(p => p.split(/[·\s]+/).forEach(x => add(x, -1)));
  return out;
}
const umul = (a, b, s = 1) => { const o = { ...a }; for (const [k, e] of Object.entries(b)) { o[k] = (o[k] ?? 0) + s * e; if (!o[k]) delete o[k]; } return o; };
const ueq = (a, b) => { const ka = Object.keys(a), kb = Object.keys(b); return ka.length === kb.length && ka.every(k => a[k] === b[k]); };
/** TeX of the board (left of "=") → its unit */
function boardUnit(tex) {
  let s = String(tex).replace(/\\text\{([^{}]*)\}/g, '$1').replace(/\{,\}/g, '').replace(/\\[,;: ]/g, ' ').replace(/\\\$/g, '$')
    .replace(/\\times/g, '×').replace(/\\div/g, '÷').replace(/\^\{(\d)\}/g, '^$1');
  s = s.split('=')[0];
  s = s.replace(/\\[dt]?frac\{([^{}]*)\}\{([^{}]*)\}/g, '[$1|$2]');
  const qu = t => { t = t.trim(); const dollar = /\$/.test(t); const rest = t.replace(/\$/g, '').replace(/(?<![\^\d.,])[\d.,]+/g, ' ').trim(); let u = rest ? uparse(rest) : {}; if (dollar) u = umul(u, { $: 1 }); return u; };
  const term = t => { t = t.trim(); const m = t.match(/^\[([^|]*)\|([^\]]*)\]$/); return m ? umul(qu(m[1]), qu(m[2]), -1) : qu(t); };
  const toks = s.split(/([×÷])/);
  let u = term(toks[0]);
  for (let i = 1; i < toks.length; i += 2) u = umul(u, term(toks[i + 1]), toks[i] === '÷' ? -1 : 1);
  return u;
}

// ---------------------------------------------------------------- precision: digits the whole range agrees on
/** round x (Q) to k decimals (k may be negative), half up → Q */
function rq(x, k) {
  const sc = k >= 0 ? Q(10 ** k) : Q(1, 10 ** -k);
  const y = x.mul(sc), fl = Math.floor(y.n / y.d), rem = y.sub(fl);
  const r = rem.cmp(Q(1, 2)) >= 0 ? fl + 1 : fl;
  return Q(r).div(sc);
}
/** the finest k at which every value of [lo, hi) rounds the same (hi itself excluded) → { k, value } */
function agree(lo, hi) {
  for (let k = 6; k >= -6; k--) {
    const sc = k >= 0 ? Q(10 ** k) : Q(1, 10 ** -k);
    const a = rq(lo, k);
    // hi is open: the values just below hi round like hi unless hi sits exactly on a rounding boundary
    const y = hi.mul(sc), fr = y.sub(Math.floor(y.n / y.d));
    const b = fr.eq(Q(1, 2)) ? rq(hi, k).sub(Q(1).div(sc)) : rq(hi, k);
    if (a.eq(b)) return { k, value: a };
  }
  return null;
}
/** does choice text "29 cm" / "29.0 cm" / "100 in" state value at k decimals */
function statesAt(c, k, value) {
  const m = String(c).match(/(\d[\d,]*(?:\.\d+)?)/);
  if (!m) return false;
  const x = qn(m[1]);
  if (!x.eq(value)) return false;
  return k >= 0 ? decimals(m[1]) === k : decimals(m[1]) === 0;
}

// ---------------------------------------------------------------- classifiers
function attrClass(p, N) {
  const ask = p.lastIndexOf('What does the number');
  const body = p.slice(0, ask);
  const esc = N.replace(/[.$]/g, '\\$&');
  const hits = [...body.matchAll(new RegExp(`(?<![\\d.,])${esc}(?![\\d,]*\\d)`, 'g'))];
  if (hits.length !== 1) return null;
  const i = hits[0].index, before = body.slice(0, i), after = body.slice(i + N.length);
  if (/scale \d[\d,]* : $/.test(before)) return 'scale';
  if (/\$$/.test(before)) return /^ per foot/.test(after) ? 'pricePerLength' : null;
  if (/^%/.test(after)) return 'steep';
  if (/^ in long on the map/.test(after)) return 'mapLength';
  if (/^ ft\b/.test(after)) return 'lengthFt';
  if (/^ lb\b/.test(after)) return 'weight';
  if (/^ min\b/.test(after)) return 'timeMin';
  if (/^ mi\/h/.test(after)) return 'speed';
  if (/^ gal\/min/.test(after)) return 'rate';
  if (/^ gal\b/.test(after)) return 'volume';
  if (/^ h\b/.test(after)) return 'timeH';
  if (/^ (campers|people|crates)\b/.test(after)) return 'count';
  return null;
}
const ATTR = {
  scale: /scale ratio/, pricePerLength: /price per length/, steep: /steepness/, mapLength: /length on the map/,
  lengthFt: /^a length, in feet/, weight: /weight, in pounds/, timeMin: /time, in minutes/, speed: /speed, in miles per hour/,
  rate: /rate: gallons per minute/, volume: /volume, in gallons/, timeH: /time, in hours/, count: /^a count of/,
};
/** 'def' (exact by definition), 'count' (count or money), 'meas' (measured or rounded); null = a wrong "fact" */
function exactKind(t) {
  t = String(t).replace(/\?$/, '').trim();
  let m;
  if (/≈/.test(t) || /\babout\b/.test(t)) return 'meas';
  if ((m = t.match(/^([\d.,]+) (\w+) in ([\d.,]+) (\w+)$/))) {
    try { return factor(m[4], m[2]).mul(qn(m[3])).eq(qn(m[1])) ? 'def' : null; } catch { return null; }
  }
  if (/^a price of \$/.test(t) || /^\d[\d,]* (students|cars)\b/.test(t)) return 'count';
  if (/^a (room|puppy|board|sprint)\b/.test(t)) return 'meas';
  return undefined;
}
/** dimension of a formula variable */
const DIM = {
  l: { L: 1 }, w: { L: 1 }, h: { L: 1 }, d: { L: 1 }, r: { L: 1 }, P: { L: 1 }, A: { L: 2 }, V: { L: 3 },
  v: { L: 1, T: -1 }, t: { T: 1 }, price: { M: 1, Vol: -1 }, gallons: { Vol: 1 }, cost: { M: 1 },
};
function termDim(t) {
  t = t.replace(/\s+/g, '').replace(/^\d+(?:\.\d+)?/, '');
  let u = {}, sgn = 1;
  for (const tok of t.split(/([·/])/)) {
    if (tok === '·') { sgn = 1; continue; }
    if (tok === '/') { sgn = -1; continue; }
    if (!tok || /^\d+$/.test(tok)) continue;
    const parts = DIM[tok] ? [tok] : tok.split(''); // "lw" = l·w
    for (const p of parts) { if (!DIM[p]) throw new Error(`dim ${p}`); u = umul(u, DIM[p], sgn); }
    sgn = 1;
  }
  return u;
}
function formulaOk(f) {
  const [lhs, rhs] = String(f).split('=');
  const L = termDim(lhs.trim());
  return rhs.split(/[+−-]/).every(t => ueq(termDim(t), L));
}

// ---------------------------------------------------------------- families
const ORD = { first: 1, second: 2, third: 3, fourth: 4, fifth: 5, sixth: 6, seventh: 7, eighth: 8, ninth: 9, tenth: 10 };
const plane = q => q.data?.picture?.planes ?? [];

const S = {
  attribute(q) {
    const N = q.prompt.match(/What does the number ([\d,.]+) measure/)[1];
    const k = attrClass(q.prompt, N);
    return k ? choiceRe(q, ATTR[k]) : -1;
  },
  sameAmount(q) {
    const m = q.prompt.match(re('same \\w+ as # (\\w+)\\?'));
    const want = inBase({ n: qn(m[1]), u: unitOf(m[2]) });
    return pick(q, c => inBase(qty(c)).eq(want));
  },
  pickUnit(q) {
    // the unit whose number is a handy size (closest to the 1-1,000 range)
    const score = c => { const n = qn(c.match(/\(([\d.,]+)/)[1]).value; return Math.abs(Math.log10(n) - 1.5); };
    const sc = q.choices.map(score), best = Math.min(...sc);
    return sc.filter(s => s === best).length === 1 ? sc.indexOf(best) : -1;
  },
  compareMixed(q) {
    const big = /most|longest|heaviest/.test(q.prompt), small = /least|shortest|lightest/.test(q.prompt);
    if (big === small) return -1;
    const vals = q.choices.map(c => { const x = qty(c); return [UNITS[x.u][0], inBase(x)]; });
    if (new Set(vals.map(x => x[0])).size !== 1) return -1;
    const best = vals.reduce((b, x) => ((big ? x[1].cmp(b) > 0 : x[1].cmp(b) < 0) ? x[1] : b), vals[0][1]);
    return pick(q, (c, i) => vals[i][1].eq(best));
  },
  deriveUnit(q) { const u = boardUnit(q.board); return pick(q, c => ueq(uparse(c), u)); },
  productUnit(q) { const u = boardUnit(q.board); return pick(q, c => ueq(uparse(c), u)); },
  unitResult(q) { const u = boardUnit(q.board); return pick(q, c => ueq(uparse(c), u)); },
  readTick(q) {
    const m = q.prompt.match(re('labeled only at # and #,? with equal gridlines between\\. On day \\d+,? the dot sits on the (\\w+) gridline'));
    const lo = qn(m[1]), hi = qn(m[2]), k = ORD[m[3]];
    const y = plane(q)[0].y, N = Math.round((y.max - y.min) / y.step);
    return v(lo.add(hi.sub(lo).mul(k).div(N)));
  },
  steeper(q) {
    const m = q.prompt.match(/from month (\d+) to month (\d+)/), a = +m[1], b = +m[2];
    const g = {};
    for (const p of plane(q)) {
      const at = x => { const pt = p.line.find(z => z[0] === x); if (!pt) throw new Error('no point'); return qn(String(pt[1])); };
      g[p.title] = at(b).sub(at(a));
    }
    const A = g['Store A'], B = g['Store B'];
    const c = A.cmp(B);
    return choiceRe(q, c > 0 ? /^Store A$/ : c < 0 ? /^Store B$/ : /same/);
  },
  cropBar(q) {
    const m = q.prompt.match(re('looks # times as tall as bar A\\. A is #,? B is #\\.'));
    const k = qn(m[1]), A = qn(m[2]), B = qn(m[3]);
    if (B.cmp(A) < 0) return choiceRe(q, /less than A/);
    const r = B.div(A);
    if (Math.abs(r.value - k.value) / k.value < 0.15) return choiceRe(q, /^Yes/);
    const start = plane(q)[0]?.y?.min;
    return pick(q, c => {
      const mm = c.match(re('only about # times A\\. The axis starts at #\\.'));
      return !!mm && Math.abs(qn(mm[1]).value - r.value) < 0.006 && qn(mm[2]).value === start;
    });
  },
  chooseStart(q) {
    const p = q.prompt;
    const at = c => qn(c.match(re('^at #'))[1]);
    if (/bar chart compares/.test(p) || /show the walk from its start/.test(p)) return pick(q, c => at(c).eq(0));
    // a line graph of small changes: start a little below the lowest value (not at 0, not above the data)
    const lo = Math.min(...[...p.matchAll(re('(?:between|from) # (?:°F )?(?:and|to) #', 'g'))].flatMap(m => [qn(m[1]).value, qn(m[2]).value]));
    const cand = q.choices.map(c => at(c).value).filter(x => x > 0 && x <= lo);
    if (!cand.length) return -1;
    const best = Math.max(...cand);
    return pick(q, c => at(c).value === best);
  },
  exactOrMeasured(q) {
    const k = exactKind(q.prompt.replace(/^Exact or measured: /, ''));
    if (!k) return -1;
    return choiceRe(q, k === 'def' ? /definition/ : k === 'count' ? /count or an amount/ : /^Measured/);
  },
  whichExact(q) {
    const ks = q.choices.map(exactKind);
    if (ks.some(k => k == null)) return -1;
    return pick(q, (c, i) => ks[i] !== 'meas');
  },
  intervalRead(q) {
    const { V, R } = recRes(q.prompt);
    const lo = V.sub(R.div(2)), hi = V.add(R.div(2));
    return pick(q, c => {
      const m = c.match(re('^from @ \\w+ up to @ \\w+$'));
      return !!m && qmix(m[1]).eq(lo) && qmix(m[2]).eq(hi);
    });
  },
  couldBe(q) {
    const { V, R } = recRes(q.prompt);
    const lo = V.sub(R.div(2)), hi = V.add(R.div(2));
    return pick(q, c => { const x = qmix(c.replace(/\s*[A-Za-z]+$/, '')); return x.cmp(lo) >= 0 && x.cmp(hi) < 0; });
  },
  boundsFrac(q) {
    const { V, R } = recRes(q.prompt);
    return (/upper bound/.test(q.prompt) ? V.add(R.div(2)) : V.sub(R.div(2))).pair;
  },
  boundsDec(q) {
    const { V, R } = recRes(q.prompt);
    return [v(V.sub(R.div(2))), v(V.add(R.div(2)))];
  },
  twoScales(q) {
    const T = qn(q.prompt.match(re('certified # g'))[1]);
    const A = qn(q.prompt.match(re('Scale A shows # g'))[1]), B = qn(q.prompt.match(re('Scale B shows # g'))[1]);
    const ea = Math.abs(A.sub(T).value), eb = Math.abs(B.sub(T).value);
    return choiceRe(q, ea < eb ? /^Scale A$/ : eb < ea ? /^Scale B$/ : /equally/);
  },
  whatDigitsSay(q) {
    const m = q.prompt.match(re('shows # (\\w+)\\. Its maker says it can be off by up to #'));
    const X = qn(m[1]), E = qn(m[3]);
    return pick(q, c => { const mm = c.match(re('^between # and #')); return !!mm && qn(mm[1]).eq(X.sub(E)) && qn(mm[2]).eq(X.add(E)); });
  },
  convert(q) {
    const m = q.prompt.match(re('^Convert # (\\w+) to (\\w+)\\.'));
    // a factor stated in the prompt (1 mi ≈ 1.609 km rounded, 1 in = 2.54 cm exactly) is the one to use
    const st = q.prompt.match(re('(?:Use )?1 (\\w+) [=≈] # (\\w+)'));
    if (st && unitOf(st[1]) === unitOf(m[2]) && unitOf(st[3]) === unitOf(m[3])) return v(qn(m[1]).mul(qn(st[2])));
    return v(qn(m[1]).mul(factor(m[2], m[3])));
  },
  pickFactor(q) {
    const m = q.prompt.match(re('^Convert # (\\w+) to (\\w+)\\.'));
    const from = unitOf(m[2]), to = unitOf(m[3]);
    return pick(q, c => {
      const mm = c.match(re('^# (\\w+)/# (\\w+)$'));
      if (!mm) return false;
      const top = unitOf(mm[2]), bot = unitOf(mm[4]);
      return top === to && bot === from && inBase({ n: qn(mm[1]), u: top }).eq(inBase({ n: qn(mm[3]), u: bot }));
    });
  },
  addMixed(q) {
    const m = q.prompt.match(re(': # (\\w+) and # (\\w+)\\. How much is that in (\\w+)\\?'));
    const to = unitOf(m[5]);
    return v(qn(m[1]).mul(factor(m[2], to)).add(qn(m[3]).mul(factor(m[4], to))));
  },
  rateTime(q) {
    const p = q.prompt;
    let m;
    if ((m = p.match(re('gets # mi/gal\\. How many gallons does a # mi trip use')))) return v(qn(m[2]).div(qn(m[1])));
    if ((m = p.match(re('at # mi/h for # min\\. How far')))) return v(qn(m[1]).mul(qn(m[2])).div(60));
    if ((m = p.match(re('costs #/gal\\. You buy # gal\\. What do you pay')))) return round(qn(m[1]).mul(qn(m[2])).value, 2);
    return undefined;
  },
  rateConvert(q) {
    const p = q.prompt;
    let m = p.match(re('(?:drives|pours|goes|runs) # ([\\w$]+)/(\\w+)\\. What is that in ([\\w¢]+)/(\\w+)\\?'));
    let N, a, b;
    if (m) [N, a, b] = [qn(m[1]), m[2], m[3]];
    else { m = p.match(re('costs # per (\\w+)\\. What is that in ([\\w¢]+)/(\\w+)\\?')); [N, a, b] = [qn(m[1]), '$', m[2]]; m = [null, null, a, b, m[3], m[4]]; }
    const c = m[4], d = m[5];
    return v(N.mul(factor(a, c)).div(factor(b, d)));
  },
  fracRate(q) {
    const m = q.prompt.match(re('(?:walks|pumps|bikes) @ (\\w+) in @ (\\w+)\\. What is her rate in (\\w+)/(\\w+)\\?'));
    const a = qmix(m[1]).mul(factor(m[2], m[5])), b = qmix(m[3]).mul(factor(m[4], m[6]));
    return a.div(b).pair;
  },
  areaConvert(q) {
    const m = q.prompt.match(re('^Convert # (\\w+)([²³]) to (\\w+)([²³])\\.'));
    const k = factor(m[2], m[4]);
    const p = SUP[m[3]];
    let f = Q(1);
    for (let i = 0; i < p; i++) f = f.mul(k);
    return v(qn(m[1]).mul(f));
  },
  powerFactor(q) {
    const m = q.prompt.match(re('convert # (\\w+)([²³]) to (\\w+)([²³])'));
    const k = factor(m[2], m[4]);
    let f = Q(1);
    for (let i = 0; i < SUP[m[3]]; i++) f = f.mul(k);
    return pick(q, c => qn(c).eq(f));
  },
  tempReading(q) {
    let m = q.prompt.match(re('reads # °C\\. What is that in °F'));
    if (m) return v(qn(m[1]).mul(Q(9, 5)).add(32));
    m = q.prompt.match(re('reads # °F\\. What is that in °C'));
    return v(qn(m[1]).sub(32).mul(Q(5, 9)));
  },
  tempChange(q) {
    let m = q.prompt.match(re('warmed by # °F\\. By how many °C'));
    if (m) return v(qn(m[1]).mul(Q(5, 9)));
    m = q.prompt.match(re('risen by # °C\\. By how many °F'));
    return v(qn(m[1]).mul(Q(9, 5)));
  },
  tripCost(q) {
    const m = q.prompt.match(re('A # mi trip in a car that gets # mi/gal, with gas at #/gal'));
    return round(qn(m[1]).div(qn(m[2])).mul(qn(m[3])).value, 2);
  },
  avgSpeed(q) {
    const p = q.prompt;
    let m = p.match(re('drives # h at # mi/h, then another # h at # mi/h'));
    if (m) { const [t1, v1, t2, v2] = [1, 2, 3, 4].map(i => qn(m[i])); return v(t1.mul(v1).add(t2.mul(v2)).div(t1.add(t2))); }
    m = p.match(re('drives # mi at # mi/h, then the same # mi back at # mi/h'));
    const [d, v1, d2, v2] = [1, 2, 3, 4].map(i => qn(m[i]));
    return v(d.add(d2).div(d.div(v1).add(d2.div(v2))));
  },
  formulaUnits(q) {
    const p = q.prompt;
    let m = p.match(re('Cheese is # per lb; you buy # oz'));
    if (m) return round(qn(m[1]).mul(qn(m[2])).div(16).value, 2);
    m = p.match(re('keeps # mi/h for # min'));
    return v(qn(m[1]).mul(qn(m[2])).div(60));
  },
  scaleRange(q) {
    const r = range(q.prompt);
    return /largest|longest/.test(q.prompt) ? v(r.hi) : v(r.lo);
  },
  rangePair(q) { const r = range(q.prompt); return [v(r.lo), v(r.hi)]; },
  reportPick(q) {
    const m = q.prompt.match(re('somewhere from # up to #'));
    const a = agree(qn(m[1]), qn(m[2]));
    return a ? pick(q, c => statesAt(c, a.k, a.value)) : -1;
  },
  purposeRound(q) {
    const m = q.prompt.match(re('shows # gal at #/gal'));
    return round(qn(m[1]).mul(qn(m[2])).value, 2);
  },
  mapArea(q) {
    const p = q.prompt;
    let m = p.match(re("scale is 1 in : # mi\\. A park covers # in²"));
    if (m) return v(qn(m[1]).mul(qn(m[1])).mul(qn(m[2])));
    m = p.match(re('A 1 : # model'));
    const k = qn(m[1]);
    return /surface area/.test(p) ? v(k.mul(k)) : /volume/.test(p) ? v(k.mul(k).mul(k)) : undefined;
  },
  dimCheck(q) { return pick(q, c => !formulaOk(c)); },
  repair(q) {
    const m = q.prompt.match(re('r = # mi/h and t = # min'));
    const d = qn(m[1]).mul(qn(m[2])).div(60);
    return pick(q, c => { const mm = c.match(re('^Change # min to hours first: d = # mi$')); return !!mm && qn(mm[2]).eq(d); });
  },
  mismatchKind(q) {
    const m = q.prompt.match(re('wrong with # (\\w+) \\+ # (\\w+)\\?'));
    const same = UNITS[unitOf(m[2])][0] === UNITS[unitOf(m[4])][0] && m[2] !== m[4];
    return choiceRe(q, same ? /^Unit mismatch/ : /^Dimension mismatch/);
  },
  consistentWrong(q) {
    const p = q.prompt;
    let claim, truth, m;
    if ((m = p.match(/claims A = (\d*)lw\..*?a (\d+) ft by (\d+) ft rectangle/))) {
      const c = Number(m[1] || 1), l = +m[2], w = +m[3]; claim = c * l * w; truth = l * w;
    } else if ((m = p.match(/claims P = l \+ w\..*?a (\d+) ft by (\d+) ft rectangle/))) {
      const l = +m[1], w = +m[2]; claim = l + w; truth = 2 * l + 2 * w;
    } else if ((m = p.match(/claims d = rt\/(\d+)\..*?Test it on (\d+) mi\/h for (\d+) h/))) {
      const k = +m[1], r = +m[2], t = +m[3]; claim = Q(r * t, k).value; truth = r * t;
    } else return undefined;
    if (claim === truth) return choiceRe(q, /^Yes/);
    return pick(q, c => { const mm = c.match(re('^No: it gives # \\S+, but the truth is #')); return !!mm && qn(mm[1]).value === claim && qn(mm[2]).value === truth; });
  },
  critique(q) {
    const p = q.prompt;
    let m;
    if ((m = p.match(re('"about # miles \\(# km\\)"')))) {
      const exact = qn(m[1]).mul(factor('mi', 'km'));
      // every honest rounding of the exact value; the fair one keeps no more digits than "about N miles" has
      const sig = s => s.replace(/[^\d]/g, '').replace(/^0+/, '').replace(/0+$/, '').length || 1;
      const ok = q.choices.map(c => { const n = c.match(/(\d[\d,]*(?:\.\d+)?)/)[1]; const k = decimals(n); return rq(exact, k).eq(qn(n)) ? sig(n) : Infinity; });
      const best = Math.min(...ok);
      return best === Infinity || ok.filter(x => x === best).length !== 1 ? -1 : ok.indexOf(best);
    }
    if (/no source and no way it was measured/.test(p)) return choiceRe(q, /^Not enough information/);
    if ((m = p.match(re('true length is between # and #')))) {
      const a = agree(qn(m[1]), qn(m[2]));
      return a ? pick(q, c => statesAt(c, a.k, a.value)) : -1;
    }
    return undefined;
  },
  exactMean(q) {
    const m = q.prompt.match(re('^# children live in # households\\. A report gives the mean as @ children'));
    if (!Q(Number(m[1]), Number(m[2])).eq(qmix(m[3]))) return -1;
    return choiceRe(q, /^No: counts are exact/);
  },
  audit(q) {
    const e = auditErrors(q);
    if (e.length > 1) return -1;
    const rx = { unit: /^The unit work/, ticks: /tick labels/, start: /axis starts/, precision: /reported precision/ };
    return choiceRe(q, e.length ? rx[e[0]] : /^Nothing/);
  },
};

/** recorded value and resolution of a measurement prompt */
function recRes(p) {
  let m, V, R;
  if ((m = p.match(re('recorded as @ \\w+'))) || (m = p.match(re('(?:reads|reported as about) @ \\w+'))) || (m = p.match(re('recorded as @')))) V = qmix(m[1]);
  if ((m = p.match(re('to the nearest @')))) R = qmix(m[1]);
  else if (/to the nearest (cm|foot|ft|in|lb|s)\b/.test(p)) R = Q(1);
  if (!V || !R) throw new Error('no recorded value / resolution');
  return { V, R };
}
/** the possible range of a scaled measurement */
function range(p) {
  const m = p.match(re('measured as # (?:\\w+ long )?(?:\\w+ )?\\(to the nearest #'));
  const V = qn(m[1]), R = qn(m[2]);
  let lo = V.sub(R.div(2)), hi = V.add(R.div(2)), k;
  if ((k = p.match(re('1 (\\w+) = # (\\w+) exactly')))) { lo = lo.mul(qn(k[2])); hi = hi.mul(qn(k[2])); }
  else if ((k = p.match(/cut into (\d+) equal pieces/))) { lo = lo.div(+k[1]); hi = hi.div(+k[1]); }
  else throw new Error('no scaling');
  return { lo, hi };
}
/** planted errors of an audit item */
function auditErrors(q) {
  const p = q.prompt, out = [];
  const m = p.match(re('A walk: # mi/h for # min \\(to the nearest # min\\)'));
  const r = qn(m[1]), t = qn(m[2]), res = qn(m[3]);
  const d = r.mul(t).div(60);
  // unit work: the minutes must be turned into hours, and the number must follow
  const uw = p.match(/Unit work: (.*?)\. Report/)[1];
  const uv = qn(uw.match(re('= # mi$'))[1]);
  if (!/1 h\/60 min/.test(uw) || Math.abs(uv.value - d.value) > 0.00005 + 1e-12) out.push('unit');
  // ticks: the time axis labels must count up by its step
  const pl = plane(q)[0];
  const xs = pl.x;
  const n = Math.round((xs.max - xs.min) / xs.step);
  const labs = xs.labels ?? [];
  const ticksOk = labs.length === n + 1 && labs.every((s, i) => s === '' || Number(s) === xs.min + i * xs.step);
  if (!ticksOk) out.push('ticks');
  // start: shown "from the start" → the distance axis starts at 0
  if (pl.y.min !== 0) out.push('start');
  // precision: the report keeps only digits the possible range allows
  const rep = p.match(/Report: about ([\d.]+) mi/)[1];
  const lo = r.mul(t.sub(res.div(2))).div(60), hi = r.mul(t.add(res.div(2))).div(60);
  const k = decimals(rep), step = 10 ** -k;
  const tooFine = step < (hi.value - lo.value) / 2 - 1e-12;
  const off = Math.abs(qn(rep).value - d.value) > step / 2 + 1e-9;
  if (tooFine || off) out.push('precision');
  return out;
}

// ---------------------------------------------------------------- sane
function sane(q) {
  const p = q.prompt, f = q.family, out = [];
  let m;
  try {
    if (f === 'attribute') {
      const N = p.match(/What does the number ([\d,.]+) measure/)[1];
      if (!attrClass(p, N)) out.push(`the number ${N} is not one clear given`);
    }
    if (f === 'compareMixed') {
      const vals = q.choices.map(c => inBase(qty(c)).value).sort((a, b) => a - b);
      if (vals[0] === vals[1] || vals[1] === vals[2]) out.push('two amounts are equal');
    }
    if ((m = p.match(re('rower keeps # mi/h'))) && qn(m[1]).value > 15) out.push(`a rower at ${m[1]} mi/h (racing shells top out near 14 mi/h)`);
    if ((m = p.match(re('runner goes # mi/h'))) && qn(m[1]).value > 25) out.push(`a runner at ${m[1]} mi/h (faster than any human sprint)`);
    if ((m = p.match(re('cyclist rides at # mi/h'))) && qn(m[1]).value > 30) out.push(`a cyclist holding ${m[1]} mi/h`);
    if (f === 'fracRate' && (m = p.match(re('walks @ mi in @ h')))) {
      const s = qmix(m[1]).div(qmix(m[2])).value;
      if (s > 5) out.push(`walking at ${round(s, 1)} mi/h (a fast walk is about 4 mi/h)`);
    }
    if ((m = p.match(re('A pot of water at # °F warmed by # °F')))) {
      const a = qn(m[1]).value, b = a + qn(m[2]).value;
      if (a < 32) out.push(`a pot of water at ${m[1]} °F is ice`);
      if (b > 212) out.push(`water warmed to ${b} °F would boil away`);
    }
    if ((m = p.match(re('At dawn it was # °C\\. By noon the temperature had risen by # °C')))) {
      const b = qn(m[1]).value + qn(m[2]).value;
      if (b > 45) out.push(`a noon temperature of ${b} °C`);
    }
    if (f === 'readTick') {
      const want = S.readTick(q), dot = plane(q)[0]?.dots?.[0];
      if (dot && Math.abs(dot[1] - want) > 1e-9) out.push('the dot is not drawn on the gridline the prompt names');
    }
    if (f === 'audit' && auditErrors(q).length > 1) out.push(`more than one planted error (${auditErrors(q).join(', ')})`);
    if (f === 'exactOrMeasured' && exactKind(p.replace(/^Exact or measured: /, '')) === null) out.push('a "defined" fact with wrong numbers');
    if (f === 'whichExact' && q.choices.some(c => exactKind(c) === null)) out.push('a "defined" fact with wrong numbers');
    if (q.input === 'num' && !/nearest|cent|Estimate/.test(p)) {
      const a = S[f]?.(q);
      if (typeof a === 'number' && decimals(String(a)) > 4) out.push(`the answer ${a} has more than 4 decimals and the prompt names no rounding`);
    }
  } catch (e) { out.push(`could not read: ${e.message}`); }
  return out.join('; ');
}

export default {
  solve(q) {
    const f = S[q.family];
    return f ? f(q) : undefined;
  },
  sane,
};
