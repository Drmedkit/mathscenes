// Oracle for the lesson "one-variable-data" (summarizing and comparing data, HS Statistics, HSS-ID.A.1-3). Written
// from what the student sees only: the prompt, the board, the choices and the drawn picture (dot plots, histograms with
// their bins, box plots from data or from a given five-number summary, lists, stem-and-leaf plots). Every statistic is
// computed here from the data on screen with the conventions the items state: quartiles = medians of the halves (odd n:
// leave the median out), outliers strictly beyond the 1.5·IQR fences, SD = σ (population, σx) unless Sx is asked,
// histogram bins [lower, upper), rounding only at the end to the place the item names. Shape is judged from the drawn
// histogram (peaks, flatness) and the moment skewness of the data. Conceptual choices are judged by testing each
// statement against the computed values. See docs/lessons/QUALITY_LAYER.md, "O: the oracle".
import { nums, texPlain, round, choiceWhere } from '../../tools/quality/oracle-kit.mjs';

const EPS = 1e-9;
const near = (a, b, tol = 1e-6) => Math.abs(a - b) <= tol;

// ---------------------------------------------------------------- statistics
const sorted = a => [...a].sort((x, y) => x - y);
const sum = a => a.reduce((s, x) => s + x, 0);
const mean = a => sum(a) / a.length;
function median(a) {
  const s = sorted(a), n = s.length;
  return n % 2 ? s[(n - 1) / 2] : (s[n / 2 - 1] + s[n / 2]) / 2;
}
/** Q1, Q3: medians of the halves, the median left out for odd n (TI-84) */
function quart(a) {
  const s = sorted(a), n = s.length, h = Math.floor(n / 2);
  return { q1: median(s.slice(0, h)), q3: median(s.slice(n - h)), med: median(s) };
}
const iqrOf = a => { const q = quart(a); return q.q3 - q.q1; };
const sdOf = a => { const m = mean(a); return Math.sqrt(mean(a.map(x => (x - m) ** 2))); };
const sxOf = a => { const m = mean(a); return Math.sqrt(sum(a.map(x => (x - m) ** 2)) / (a.length - 1)); };
const madOf = a => { const m = mean(a); return mean(a.map(x => Math.abs(x - m))); };
/** moment skewness g1 */
function skew(a) {
  const m = mean(a), m2 = mean(a.map(x => (x - m) ** 2)), m3 = mean(a.map(x => (x - m) ** 3));
  return m2 > 0 ? m3 / m2 ** 1.5 : 0;
}
function fences(q1, q3) { const r = q3 - q1; return { lo: q1 - 1.5 * r, hi: q3 + 1.5 * r }; }
function outliersOf(a, q1, q3) { const f = fences(q1, q3); return sorted(a).filter(x => x < f.lo - EPS || x > f.hi + EPS); }
/** histogram counts, bins [start + k·w, start + (k+1)·w) from the start to the last value */
function binCounts(a, start, w) {
  const top = Math.max(...a);
  const k = Math.floor((top - start) / w + EPS) + 1;
  const c = new Array(k).fill(0);
  for (const x of a) c[Math.floor((x - start) / w + EPS)]++;
  return c;
}
/** peaks of a bar chart: plateaus higher than both sides (outside = 0); keep peaks ≥ 40% of the tallest, merge two
 *  peaks unless the valley between them drops to at most half of the smaller one */
function peaksOf(c) {
  const runs = [];
  for (let i = 0; i < c.length;) { let j = i; while (j + 1 < c.length && c[j + 1] === c[i]) j++; runs.push({ i, j, v: c[i] }); i = j + 1; }
  const top = Math.max(...c);
  let pk = runs.filter((r, k) => (k === 0 ? 0 : runs[k - 1].v) < r.v && (k === runs.length - 1 ? 0 : runs[k + 1].v) < r.v && r.v >= 0.4 * top);
  let changed = true;
  while (changed && pk.length > 1) {
    changed = false;
    for (let k = 0; k + 1 < pk.length; k++) {
      const a = pk[k], b = pk[k + 1];
      const valley = Math.min(...c.slice(a.j + 1, b.i));
      if (!(valley <= 0.5 * Math.min(a.v, b.v))) { pk.splice(a.v >= b.v ? k + 1 : k, 1); changed = true; break; }
    }
  }
  return pk.length;
}
/** shape of a histogram panel (data + bins): 'uniform' | 'bimodal' | 'symmetric' | 'right' | 'left' | 'unclear' */
function shapeOf(a, bins) {
  const c = bins ? binCounts(a, bins.start, bins.width) : null;
  if (c && c.length >= 4 && Math.min(...c) >= 0.6 * Math.max(...c)) return 'uniform';
  if (c && peaksOf(c) >= 2) return 'bimodal';
  // a histogram is judged by its bars (what the student sees), a dot plot by its values
  const g = c ? skew(c.flatMap((k, i) => new Array(k).fill(i))) : skew(a);
  if (Math.abs(g) < 0.25) return 'symmetric';
  if (Math.abs(g) >= 0.35) return g > 0 ? 'right' : 'left';
  return 'unclear';
}

// ---------------------------------------------------------------- reading
const P = q => q.data?.picture ?? {};
const panels = q => P(q).plot?.panels ?? [];
const panel = (q, key) => panels(q).find(p => p.key === key);
/** the numbers of a plain list on the board */
const boardNums = q => nums(texPlain(q.board ?? '').replace(/−/g, '-'));
/** the list in the prompt after the last colon, up to the sentence end ("…: 4, 7, 9, 12, 18. The mean …") */
function promptList(p) {
  const m = p.match(/:\s*((?:[-−]?\d+(?:\.\d+)?,\s*)+[-−]?\d+(?:\.\d+)?)/);
  return m ? nums(m[1]) : null;
}
const num = s => Number(String(s).replace(/−/g, '-').replace(/,/g, ''));
const choiceIdx = (q, re) => choiceWhere(q, c => re.test(c));
const AP = '[’\']';
/** "Class A" → its panel (by label) */
const byLabel = (q, name) => panels(q).find(p => p.label === name);
/** does a shown number (as rounded on screen) stand for v? (to the shown decimals) */
function shows(shown, v) {
  const s = String(shown).replace(/−/g, '-');
  const d = s.includes('.') ? s.split('.')[1].length : 0;
  return Math.abs(num(s) - v) <= 0.5 * 10 ** -d + 1e-9;
}

// ---------------------------------------------------------------- families
const F = {};

F.medianList = q => { const a = boardNums(q); return a.length ? median(a) : undefined; };
F.medianDots = q => { const p = panel(q, 'A'); return p ? median(p.data) : undefined; };

/** center and spread of two panels */
function cs(a) { const q = quart(a); return { mean: mean(a), med: q.med, sd: sdOf(a), iqr: q.q3 - q.q1, q1: q.q1, q3: q.q3, min: Math.min(...a), max: Math.max(...a) }; }
function differIn(q) {
  const [A, B] = panels(q).map(p => cs(p.data));
  const cDiff = !(near(A.mean, B.mean) && near(A.med, B.med)), sDiff = !(near(A.sd, B.sd) && near(A.iqr, B.iqr));
  const cMixed = near(A.mean, B.mean) !== near(A.med, B.med), sMixed = near(A.sd, B.sd) !== near(A.iqr, B.iqr);
  return { A, B, cDiff, sDiff, cMixed, sMixed };
}
F.differIn = q => {
  const d = differIn(q);
  if (d.cMixed || d.sMixed) return -1;
  const want = d.cDiff && d.sDiff ? /^In both center and spread$/ : d.cDiff ? /^Only in center$/ : d.sDiff ? /^Only in spread$/ : /^In neither/;
  return choiceIdx(q, want);
};

/** a two-panel statement: true / false */
function twoPanelClaim(q, c) {
  const ps = panels(q);
  const stat = name => { const p = byLabel(q, name); return p ? cs(p.data) : null; };
  const other = name => ps.find(p => p.label !== name)?.label;
  let m;
  if ((m = c.match(new RegExp(`^Every (.+?) value is higher than every (.+?) value\\.$`)))) {
    const X = stat(m[1]), Y = stat(m[2]); return X && Y ? X.min > Y.max : null;
  }
  if ((m = c.match(new RegExp(`^(.+?)${AP}s center is (\\S+) \\w+ higher; the spreads are the same\\.$`)))) {
    const X = stat(m[1]), Y = stat(other(m[1])), d = num(m[2]);
    return X && Y ? near(X.mean - Y.mean, d) && near(X.med - Y.med, d) && near(X.sd, Y.sd) && near(X.iqr, Y.iqr) : null;
  }
  if ((m = c.match(new RegExp(`^Same center \\(mean and median (\\S+)\\), but (.+?)${AP}s values are more spread out\\.$`)))) {
    const X = stat(m[2]), Y = stat(other(m[2])), v = num(m[1]);
    return X && Y ? near(X.mean, v) && near(Y.mean, v) && near(X.med, v) && near(Y.med, v) && X.sd > Y.sd + EPS && X.iqr > Y.iqr + EPS : null;
  }
  if (/^Same center, so the two distributions are the same\.$/.test(c)) return false; // equal centers never make equal distributions
  if (/is more spread out, because its stacks are taller\.$/.test(c)) return false;   // stack height is a count, not spread
  if (/has the higher center, because its largest value is higher\.$/.test(c)) return false; // one value is not the center
  if (/is more spread out, because its values are larger\.$/.test(c)) return false;    // location is not spread
  return null;
}
function claimsChoice(q, judge) {
  const v = (q.choices ?? []).map(c => judge(q, c));
  if (v.some(x => x === null)) return undefined;
  const t = v.map((x, i) => (x ? i : -1)).filter(i => i >= 0);
  return t.length === 1 ? t[0] : -1;
}
F.sameCenter = q => claimsChoice(q, twoPanelClaim);

F.spreadMore = q => {
  const [pa, pb] = panels(q); const A = cs(pa.data), B = cs(pb.data);
  if (A.sd > B.sd + EPS && A.iqr > B.iqr + EPS) return choiceIdx(q, new RegExp(`^${pa.label}$`));
  if (B.sd > A.sd + EPS && B.iqr > A.iqr + EPS) return choiceIdx(q, new RegExp(`^${pb.label}$`));
  return -1; // SD and IQR disagree, or equal: no clear answer
};

const SHAPE_RE = { uniform: /^Uniform/, bimodal: /^Bimodal/, symmetric: /^Symmetric/, right: /^Skewed right/, left: /^Skewed left/ };
F.shapeName = q => {
  const p = panel(q, 'A'); if (!p) return undefined;
  const s = shapeOf(p.data, p.bins);
  return s === 'unclear' ? -1 : choiceIdx(q, SHAPE_RE[s]);
};
F.shapeFeature = q => {
  const p = panel(q, 'A'), g = (P(q).plot?.marks ?? []).find(k => k.kind === 'band');
  const m = q.prompt.match(/in the cluster (above|below) the gap/);
  if (!p || !g || !m) return undefined;
  return m[1] === 'above' ? p.data.filter(x => x >= g.b - EPS).length : p.data.filter(x => x <= g.a + EPS).length;
};

/** which statistic a box-plot word names, and its quarter position (0 min … 4 max) */
const POS = { 'the minimum': 0, Q1: 1, 'the median': 2, Q3: 3, 'the maximum': 4 };
F.boxPercent = q => {
  const m = q.prompt.match(/between (the minimum|Q1|the median|Q3|the maximum) \(([-−]?\d+(?:\.\d+)?)\) and (the minimum|Q1|the median|Q3|the maximum) \(([-−]?\d+(?:\.\d+)?)\)/);
  if (!m) return undefined;
  const pct = 25 * Math.abs(POS[m[3]] - POS[m[1]]);
  return choiceIdx(q, new RegExp(`^About ${pct}%$`));
};
function boxClaim(q, c) {
  const a = panel(q, 'B')?.data; if (!a) return null;
  const S = cs(a), n = a.length;
  let m;
  if ((m = c.match(/^Exactly (\d+)% of the (\d+) values are below Q1\.$/))) return a.filter(x => x < S.q1 - EPS).length * 100 === Number(m[1]) * n;
  if ((m = c.match(/^About half of the values lie between ([-−]?\d+(?:\.\d+)?) and ([-−]?\d+(?:\.\d+)?)\.$/))) return near(num(m[1]), S.q1) && near(num(m[2]), S.q3);
  if ((m = c.match(/^The (lower|upper) whisker holds more values than the (lower|upper) whisker\.$/))) {
    const lo = a.filter(x => x < S.q1 - EPS).length, hi = a.filter(x => x > S.q3 + EPS).length;
    return m[1] === 'lower' ? lo > hi : hi > lo;
  }
  if ((m = c.match(/^The (lower|upper) quarter of the values is more spread out than the (lower|upper) quarter\.$/))) {
    const lo = S.q1 - S.min, hi = S.max - S.q3;
    return m[1] === 'lower' ? lo > hi + EPS : hi > lo + EPS;
  }
  if (/^The line inside the box is the mean\.$/.test(c)) return false;
  if (/^The box plot cannot show whether the data has two peaks\.$/.test(c)) return true;
  if (/^The box plot shows that the data has one peak\.$/.test(c)) return false;
  return null;
}
F.boxTruth = q => claimsChoice(q, boxClaim);

/** unusual = beyond the 1.5·IQR fences of its own set */
const isUnusual = (a, v) => { const S = cs(a), f = fences(S.q1, S.q3); return v < f.lo - EPS || v > f.hi + EPS; };
F.unusualWhere = q => {
  const v = num(q.prompt.match(/both contain the value ([-−]?\d+(?:\.\d+)?)/)?.[1]);
  const [pa, pb] = panels(q);
  const ua = isUnusual(pa.data, v), ub = isUnusual(pb.data, v);
  if (ua && ub) return choiceIdx(q, /^In both/);
  if (!ua && !ub) return choiceIdx(q, /^In neither/);
  return choiceIdx(q, new RegExp(`^Only in ${(ua ? pa : pb).label}$`));
};
F.unusualMax = q => {
  const a = panel(q, 'A').data;
  return isUnusual(a, Math.max(...a)) ? choiceIdx(q, /^Yes: it is far from all the other values$/) : choiceIdx(q, /^No: it sits close/);
};

F.devOne = q => {
  const m = q.prompt.match(/Their mean is ([-−]?\d+(?:\.\d+)?).*?the colored dot, ([-−]?\d+(?:\.\d+)?), from the mean/);
  return m ? Math.abs(num(m[2]) - num(m[1])) : undefined;
};
F.devBalance = q => {
  const m = q.prompt.match(/^(\d+) values have mean ([-−]?\d+(?:\.\d+)?)/), a = panel(q, 'A')?.data;
  return m && a ? Number(m[1]) * num(m[2]) - sum(a) : undefined;
};
F.madCompute = q => { const a = promptList(q.prompt); return a ? Number(madOf(a).toFixed(9)) : undefined; };
function madClaim(q, c) {
  const ps = panels(q); const st = name => { const p = byLabel(q, name); return p ? madOf(p.data) : null; };
  let m;
  if ((m = c.match(new RegExp(`^(.+?)${AP}s values are typically about (\\S+) \\w+ from the mean, (.+?)${AP}s about (\\S+): (.+?) is more spread out\\.$`)))) {
    const x = st(m[1]), y = st(m[3]), win = st(m[5]), lose = st(ps.find(p => p.label !== m[5])?.label);
    return near(x, num(m[2])) && near(y, num(m[4])) && win > lose + EPS;
  }
  if (/is more spread out, because its MAD is smaller\.$/.test(c)) return false;
  if (/^A typical .+ value is \S+ \w+\.$/.test(c)) return false;          // the MAD is a distance, not a value
  if (/range is \S+ \w+, because the MAD is half the range\.$/.test(c)) return false; // no such rule
  return null;
}
F.madMeaning = q => claimsChoice(q, madClaim);

F.sdRank = q => {
  const ps = panels(q);
  if (ps.length === 3) {
    const sds = ps.map(p => ({ k: p.key, s: sdOf(p.data) })).sort((a, b) => a.s - b.s);
    if (sds.some((x, i) => i && near(x.s, sds[i - 1].s))) return -1;
    return choiceIdx(q, new RegExp(`^${sds.map(x => x.k).join(', ')}$`));
  }
  if (ps.length === 2) {
    const [a, b] = ps.map(p => sdOf(p.data));
    if (near(a, b)) return choiceIdx(q, /^The SDs are equal/);
    return choiceIdx(q, new RegExp(`^Set ${a > b ? ps[0].key : ps[1].key} has the larger SD$`));
  }
  return undefined;
};
F.sdTransform = q => {
  const p = q.prompt, s = num(p.match(/ is ([-−]?\d+(?:\.\d+)?)(?:°F| \w+)\. /)?.[1]);
  if (!Number.isFinite(s)) return undefined;
  if (/raised by|lowered by|adds \d+ bonus|subtracts/.test(p)) return s;
  let m;
  if ((m = p.match(/\(× (\d+(?:\.\d+)?)\)/))) return Number((s * Number(m[1])).toFixed(9));
  if (/doubles every/.test(p)) return Number((2 * s).toFixed(9));
  if (/triples every/.test(p)) return Number((3 * s).toFixed(9));
  if (/halves every/.test(p)) return s / 2;
  return undefined;
};

/** histogram bar height from the list on the board, bins [a, b) */
F.binCount = q => {
  const m = q.prompt.match(/bar for ([-−]?\d+(?:\.\d+)?) to ([-−]?\d+(?:\.\d+)?)\?/), a = boardNums(q);
  if (!m || !a.length) return undefined;
  const lo = num(m[1]), hi = num(m[2]);
  return a.filter(x => x >= lo - EPS && x < hi - EPS).length;
};
F.dotStack = q => {
  const a = boardNums(q), cnt = new Map();
  for (const x of a) cnt.set(x, (cnt.get(x) ?? 0) + 1);
  const top = Math.max(...cnt.values());
  const at = [...cnt].filter(([, k]) => k === top).map(([v]) => v);
  return at.length === 1 ? [at[0], top] : undefined;
};

F.scaleChoice = q => {
  const a = promptList(q.prompt); if (!a) return undefined;
  const lo = Math.min(...a), hi = Math.max(...a);
  return choiceWhere(q, c => {
    const m = c.replace(/−/g, '-').match(/^(-?\d+(?:\.\d+)?) to (-?\d+(?:\.\d+)?), a tick every (\d+(?:\.\d+)?)$/);
    if (!m) return false; // uneven ticks, or a tick per data value: distances on the line would lie
    const s = Number(m[1]), e = Number(m[2]), st = Number(m[3]);
    return s <= lo + EPS && e >= hi - EPS && Number.isInteger(Math.round((e - s) / st * 1e6) / 1e6);
  });
};
F.scaleRead = q => {
  const h = P(q).plot?.hot; const p = h && panel(q, h.panel);
  return p ? p.data[h.idx[0]] : undefined;
};

F.boundaryBin = q => {
  const v = num(q.prompt.match(/Which bar does the value ([-−]?\d+(?:\.\d+)?) go in/)?.[1]);
  return choiceWhere(q, c => { const m = c.replace(/−/g, '-').match(/^The (-?\d+(?:\.\d+)?) to (-?\d+(?:\.\d+)?) bar$/); return !!m && v >= Number(m[1]) - EPS && v < Number(m[2]) - EPS; });
};

F.binWidth = q => {
  const ps = panels(q);
  if (/Which bin width shows the two groups as two peaks/.test(q.prompt)) {
    const two = ps.filter(p => peaksOf(binCounts(p.data, p.bins.start, p.bins.width)) >= 2);
    if (two.length === 2) return choiceIdx(q, /^Both show two peaks$/);
    if (!two.length) return choiceIdx(q, /^Neither shows two peaks$/);
    return choiceIdx(q, new RegExp(`^${two[0].label}$`));
  }
  if (/Which statement is true/.test(q.prompt)) {
    const same = ps.length === 2 && JSON.stringify(sorted(ps[0].data)) === JSON.stringify(sorted(ps[1].data));
    return claimsChoice(q, (q2, c) => {
      if (/^Both show the same data; only the bins differ\.$/.test(c)) return same;
      if (/^The two histograms must come from different data\.$/.test(c)) return !same;
      if (/histogram has fewer students\.$/.test(c)) return !same;
      if (/histogram has a larger median\.$/.test(c)) return !same;
      return null;
    });
  }
  return undefined;
};

F.quartiles = q => { const a = boardNums(q); if (!a.length) return undefined; const s = quart(a); return [s.q1, s.q3]; };
F.iqr = q => { const p = panel(q, 'A'); return p ? iqrOf(p.data) : undefined; };

/** stated Q1, Q3 in the prompt */
function statedQ(p) {
  const m = p.match(/Q1 = ([-−]?\d+(?:\.\d+)?),? (?:and )?Q3 = ([-−]?\d+(?:\.\d+)?)/);
  return m ? { q1: num(m[1]), q3: num(m[2]) } : null;
}
F.fences = q => { const s = statedQ(q.prompt); if (!s) return undefined; const f = fences(s.q1, s.q3); return [Number(f.lo.toFixed(9)), Number(f.hi.toFixed(9))]; };
const orderedList = p => { const m = p.match(/in order: ((?:[-−]?\d+(?:\.\d+)?, )+[-−]?\d+(?:\.\d+)?)\./); return m ? nums(m[1]) : null; };
F.isOutlier = q => {
  const s = statedQ(q.prompt), a = orderedList(q.prompt); if (!s || !a) return undefined;
  const o = outliersOf(a, s.q1, s.q3);
  return choiceWhere(q, c => {
    if (c === 'None') return o.length === 0;
    let m;
    if ((m = c.match(/^Only ([-−]?\d+(?:\.\d+)?)$/))) return o.length === 1 && near(o[0], num(m[1]));
    if ((m = c.match(/^([-−]?\d+(?:\.\d+)?) and ([-−]?\d+(?:\.\d+)?)$/))) return o.length === 2 && near(o[0], num(m[1])) && near(o[1], num(m[2]));
    return false;
  });
};
F.whiskerEnd = q => {
  const s = statedQ(q.prompt), a = orderedList(q.prompt), m = q.prompt.match(/where does the (upper|lower) whisker end/);
  if (!s || !a || !m) return undefined;
  const f = fences(s.q1, s.q3), inside = a.filter(x => x >= f.lo - EPS && x <= f.hi + EPS);
  return m[1] === 'upper' ? Math.max(...inside) : Math.min(...inside);
};
F.modPlotPick = q => {
  const a = orderedList(q.prompt); if (!a) return undefined;
  const S = quart(a), o = outliersOf(a, S.q1, S.q3), f = fences(S.q1, S.q3);
  const inside = a.filter(x => x >= f.lo - EPS && x <= f.hi + EPS);
  const ok = p => p.five && near(p.five.min, Math.min(...inside)) && near(p.five.max, Math.max(...inside)) && near(p.five.q1, S.q1) && near(p.five.q3, S.q3) && near(p.five.med, S.med)
    && JSON.stringify(sorted(p.outs ?? []).map(x => round(x, 6))) === JSON.stringify(o.map(x => round(x, 6)));
  return choiceWhere(q, c => { const p = panels(q).find(k => k.label === c); return !!p && ok(p); });
};

F.displayChoice = q => {
  const p = q.prompt;
  if (/to compare the schools quickly|compare their medians and spreads side by side/.test(p)) return choiceIdx(q, /^Box plots on one scale$/);
  if (/to see the shape of the distribution|to see whether there are two peaks/.test(p)) return choiceIdx(q, /^Histogram$/);
  if (/to see every single value|to spot any gaps or repeated values/.test(p)) return choiceIdx(q, /^Dot plot$/);
  return undefined;
};

// what a study records: numerical (a measured or counted amount) or categorical (a group, a label or a code)
const NUMERICAL = /^(the )?(minutes of homework|hours studied|test score|height|arm span|weight|age|number of \w+|time|distance|price|hours of sleep)/;
const CATEGORICAL = /^(the )?(favorite \w+|grade level|preferred lunch|zip code|phone brand|color|jersey number|eye color|hometown|type of \w+|brand)/;
F.dataType = q => {
  const m = q.prompt.match(/A study records (.+?) (?:of each|each of)/); if (!m) return undefined;
  const vars = m[1].split(/ and /).map(s => s.trim());
  const kinds = vars.map(v => (CATEGORICAL.test(v) ? 'Categorical' : NUMERICAL.test(v) ? 'Numerical' : null));
  if (kinds.some(k => !k) || new Set(kinds).size > 1) return undefined;
  return choiceIdx(q, new RegExp(`^${kinds[0]}, ${vars.length === 1 ? 'one variable' : 'two variables'}$`));
};

/** a stem-and-leaf plot as numbers, read through its key ("7 | 5 = 75 points") */
function stemData(q) {
  const s = P(q).stem; if (!s) return null;
  const k = s.key.match(/(\d+) \| (\d+) = (\d+(?:\.\d+)?)/);
  const unit = k ? (num(k[3]) - Number(k[2])) / Number(k[1]) : 10;
  const leafUnit = k && !Number.isInteger(unit) ? null : 1;
  if (leafUnit === null) return null;
  return s.stems.flatMap((st, i) => s.leaves[i].map(l => st * unit + l));
}
F.stemLeaf = q => {
  const a = stemData(q); if (!a) return undefined;
  const p = q.prompt; let m;
  if (/What is the median\?/.test(p)) return median(a);
  if (/What is the largest value\?/.test(p)) return Math.max(...a);
  if (/What is the smallest value\?/.test(p)) return Math.min(...a);
  if ((m = p.match(/How many values are in the (\d+)s\?/))) { const lo = Number(m[1]); return a.filter(x => x >= lo && x < lo + 10).length; }
  return undefined;
};

F.entryCheck = q => {
  const p = q.prompt; let m;
  if ((m = p.match(/in cell (A\d+) and \d+ .+? in (A\d+) to (A\d+)\. Which formula gives the mean/))) return choiceIdx(q, new RegExp(`^=AVERAGE\\(${m[2]}:${m[3]}\\)$`));
  if ((m = p.match(/You enter (\d+) .+? into list L\d\. 1-Var Stats shows n = (\d+)\./))) return Number(m[1]) !== Number(m[2]) ? choiceIdx(q, /^Check the list against/) : undefined;
  if ((m = p.match(/are all between (\d+(?:\.\d+)?) and (\d+(?:\.\d+)?) inches\. After you enter them, 1-Var Stats shows a mean of (\d+(?:\.\d+)?) inches/))) {
    const v = num(m[3]);
    return v < num(m[1]) || v > num(m[2]) ? choiceIdx(q, /^A value was mistyped/) : undefined;
  }
  return undefined;
};
F.entryFix = q => {
  const m = q.prompt.match(/(\d+) [^\d,]*, but typed (\d+(?:\.\d+)?) instead of (\d+(?:\.\d+)?)\. The calculator showed a mean of (\d+(?:\.\d+)?)\./);
  if (!m) return undefined;
  const n = Number(m[1]);
  return round(num(m[4]) - (num(m[2]) - num(m[3])) / n, 2);
};

/** the 1-Var Stats screen on the board: { mean, sumx, sumx2, Sx, sx (σx), n } */
function varStats(q) {
  const b = String(q.board ?? '').replace(/\\bar\{x\}/g, 'MEAN').replace(/\\Sigma\s*x\^2/g, 'SUMX2').replace(/\\Sigma\s*x/g, 'SUMX')
    .replace(/\\sigma\s*x/g, 'SIGX').replace(/\\[a-z]+/g, ' ');
  const g = k => { const m = b.match(new RegExp(`(?<![A-Za-z])${k} = (-?\\d+(?:\\.\\d+)?)`)); return m ? Number(m[1]) : NaN; };
  return { mean: g('MEAN'), sumx: g('SUMX'), sumx2: g('SUMX2'), Sx: g('Sx'), sx: g('SIGX'), n: g('n') };
}
F.sdOutput = q => {
  const V = varStats(q);
  const want = /SD means σ/.test(q.prompt) ? V.sx : /\bSx\b/.test(q.prompt) ? V.Sx : V.sx;
  const pl = /nearest tenth/.test(q.prompt) ? 1 : /nearest hundredth/.test(q.prompt) ? 2 : null;
  return Number.isFinite(want) && pl !== null ? round(want, pl) : undefined;
};
F.sdPlausible = q => {
  const a = panel(q, 'A')?.data; if (!a) return undefined;
  const range = Math.max(...a) - Math.min(...a);
  // an SD is never negative, and σ can never exceed half the range
  return choiceWhere(q, c => { const v = num(c.match(/^([-−]?\d+(?:\.\d+)?)/)?.[1]); return v > 0 && v <= range / 2 + EPS; });
};

F.weighted = q => {
  const p = q.prompt; let m;
  if ((m = p.match(/counts tests (\d+)%, quizzes (\d+)%, homework (\d+)%\. .*?averages are tests (\d+(?:\.\d+)?), quizzes (\d+(?:\.\d+)?), homework (\d+(?:\.\d+)?)\./))) {
    const w = [m[1], m[2], m[3]].map(Number), s = [m[4], m[5], m[6]].map(Number);
    return round(sum(w.map((x, i) => x * s[i])) / sum(w), 1);
  }
  if ((m = p.match(/buy (\d+(?:\.\d+)?) lb of \w+ at \$(\d+(?:\.\d+)?) per lb and (\d+(?:\.\d+)?) lb at \$(\d+(?:\.\d+)?) per lb/))) {
    const [a, pa, b, pb] = m.slice(1).map(Number);
    return round((a * pa + b * pb) / (a + b), 2);
  }
  if (/GPA/.test(p)) {
    const parts = [...p.matchAll(/(\d+) credits? with grade points (\d+(?:\.\d+)?)/g)].map(x => [Number(x[1]), Number(x[2])]);
    if (!parts.length) return undefined;
    return round(sum(parts.map(([c, g]) => c * g)) / sum(parts.map(([c]) => c)), 2);
  }
  return undefined;
};
F.weightedSense = q => {
  const m = q.prompt.match(/score of (\d+(?:\.\d+)?) counts with weight (\d+), and an? \w+ score of (\d+(?:\.\d+)?) counts with weight (\d+)/);
  if (!m) return undefined;
  const [a, wa, b, wb] = m.slice(1).map(Number), w = (a * wa + b * wb) / (wa + wb);
  return choiceWhere(q, c => {
    let x;
    if ((x = c.match(/^Between (\d+(?:\.\d+)?) and (\d+(?:\.\d+)?)$/))) { const lo = Math.min(+x[1], +x[2]), hi = Math.max(+x[1], +x[2]); return w > lo + EPS && w < hi - EPS; }
    if ((x = c.match(/^Exactly (\d+(?:\.\d+)?)$/))) return near(w, +x[1]);
    if ((x = c.match(/^Above (\d+(?:\.\d+)?)$/))) return w > +x[1] + EPS;
    if ((x = c.match(/^Below (\d+(?:\.\d+)?)$/))) return w < +x[1] - EPS;
    return false;
  });
};

/** the summary a careful student writes: shape, the measures that fit it, units and n */
F.summaryPick = q => {
  const a = panel(q, 'A')?.data; if (!a) return undefined;
  const S = cs(a), g = skew(a);
  // "roughly symmetric" holds unless the dot plot is highly skewed (|g1| ≥ 1, Bulmer); a mild tail is settled below
  const sc = g >= 1 ? 'Skewed right' : g <= -1 ? 'Skewed left' : 'Roughly symmetric';
  // the full summaries on offer: shape, center, spread, units, n, with the numbers the data give
  const full = (q.choices ?? []).map((c, i) => {
    const m = c.match(/^(Roughly symmetric|Skewed right|Skewed left), with (mean|median) ([-−]?\d+(?:\.\d+)?) (\w+), (SD|IQR) ([-−]?\d+(?:\.\d+)?) \w+ \(n = (\d+) [\w ]+\)\.$/);
    if (!m || Number(m[7]) !== a.length) return null;
    const okNums = (m[2] === 'median' ? shows(m[3], S.med) : shows(m[3], S.mean)) && (m[5] === 'IQR' ? shows(m[6], S.iqr) : shows(m[6], S.sd));
    const fits = (m[1] === 'Roughly symmetric') === (m[2] === 'mean' && m[5] === 'SD');
    return okNums ? { i, shape: m[1], fits } : null;
  }).filter(Boolean);
  const exact = full.filter(f => f.shape === sc && f.fits);
  if (exact.length === 1) return exact[0].i;
  if (exact.length > 1) return -1;
  const shapes = new Set(full.map(f => f.shape));
  // clearly skewed, but only "symmetric" and the opposite skew are offered: symmetric is the nearer description
  if (sc !== 'Roughly symmetric' && shapes.has('Roughly symmetric') && !shapes.has(sc)) {
    const sym = full.filter(f => f.shape === 'Roughly symmetric' && f.fits);
    return sym.length === 1 ? sym[0].i : -1;
  }
  // mildly skewed, and only the two skews are offered: the side of the tail decides (mean vs median)
  if (sc === 'Roughly symmetric' && !shapes.has(sc)) {
    const side = S.mean > S.med + EPS ? 'Skewed right' : S.mean < S.med - EPS ? 'Skewed left' : null;
    const hit = full.filter(f => f.shape === side && f.fits);
    return hit.length === 1 ? hit[0].i : -1;
  }
  return -1; // the right shape is offered only with the wrong measures (or not at all)
};

F.twoSet = q => {
  const [pa, pb] = panels(q); if (!pa || !pb) return undefined;
  if (/Find the median of each/.test(q.prompt)) return [median(pa.data), median(pb.data)];
  if (/Find the IQR of each/.test(q.prompt)) return [iqrOf(pa.data), iqrOf(pb.data)];
  if (/Find the mean of each/.test(q.prompt)) return [mean(pa.data), mean(pb.data)];
  return undefined;
};
F.comparableRow = q => {
  const unitWord = { minutes: 'min' }[q.prompt.match(/\((\w+)\)/)?.[1]] ?? null;
  const part = (txt, name) => {
    const m = txt.match(new RegExp(`^${name}: (mean|median) ([-−\\d.]+) (\\w+), (SD|IQR) ([-−\\d.]+) (\\w+) \\(n = (\\d+)\\)\\.$`));
    const p = byLabel(q, name); if (!m || !p) return false;
    const S = cs(p.data);
    if (m[3] !== unitWord || m[6] !== unitWord || Number(m[7]) !== p.data.length) return false;
    return m[1] === 'median' ? m[4] === 'IQR' && shows(m[2], S.med) && shows(m[5], S.iqr) : m[4] === 'SD' && shows(m[2], S.mean) && shows(m[5], S.sd);
  };
  const [pa, pb] = panels(q);
  return choiceWhere(q, c => {
    const k = c.indexOf(` ${pb.label}: `); if (k < 0) return false;
    const A = c.slice(0, k), B = c.slice(k + 1);
    return part(A, pa.label) && part(B, pb.label) && A.match(/: (\w+)/)[1] === B.match(/: (\w+)/)[1];
  });
};

function effectCenterData(q) {
  const p = q.prompt;
  const before = promptList(p); if (!before) return null;
  let after = null, m;
  if ((m = p.match(/A (?:sixth|seventh|eighth|new) value, ([-−]?\d+(?:\.\d+)?), is added/))) after = [...before, num(m[1])];
  else if ((m = p.match(/The largest value, ([-−]?\d+(?:\.\d+)?), is changed to ([-−]?\d+(?:\.\d+)?)/))) { after = [...before]; after[after.indexOf(num(m[1]))] = num(m[2]); }
  else after = before;
  return { b: { mean: mean(before), med: median(before) }, a: { mean: mean(after), med: median(after) } };
}
function centerClaim(q, c) {
  const d = effectCenterData(q); if (!d) return null;
  const { a, b } = d, dm = a.mean - b.mean, dd = a.med - b.med;
  let m;
  if ((m = c.match(/^Mean ([-−]?\d+(?:\.\d+)?) → ([-−]?\d+(?:\.\d+)?); the median stays ([-−]?\d+(?:\.\d+)?)\.$/))) return shows(m[1], b.mean) && shows(m[2], a.mean) && near(b.med, num(m[3])) && near(a.med, num(m[3]));
  if ((m = c.match(/^Mean ([-−]?\d+(?:\.\d+)?) → ([-−]?\d+(?:\.\d+)?); median ([-−]?\d+(?:\.\d+)?) → ([-−]?\d+(?:\.\d+)?)\.$/))) return shows(m[1], b.mean) && shows(m[2], a.mean) && near(b.med, num(m[3])) && near(a.med, num(m[4])) && !near(a.med, b.med);
  if ((m = c.match(/^Both rise by ([-−]?\d+(?:\.\d+)?)\.$/)) || (m = c.match(/^Both the mean and the median rise by ([-−]?\d+(?:\.\d+)?) \w+\.$/))) return near(dm, num(m[1])) && near(dd, num(m[1]));
  if ((m = c.match(/^The mean rises by ([-−]?\d+(?:\.\d+)?) \w+; the median stays ([-−]?\d+(?:\.\d+)?)\.$/))) return near(dm, num(m[1])) && near(dd, 0) && near(a.med, num(m[2]));
  if (/^Neither changes( much)?: one value cannot move/.test(c)) return near(dm, 0) && near(dd, 0);
  if (/^The mean is above the median, because a right tail always pulls it there\.$/.test(c)) return a.mean > a.med + EPS;
  if ((m = c.match(/^The median is ([-−]?\d+(?:\.\d+)?), halfway between ([-−]?\d+(?:\.\d+)?) and ([-−]?\d+(?:\.\d+)?)\.$/))) return near(a.med, num(m[1]));
  if ((m = c.match(/^The mean \(([-−]?\d+(?:\.\d+)?)\) is below the median \(([-−]?\d+(?:\.\d+)?)\)\.$/))) return shows(m[1], a.mean) && near(a.med, num(m[2])) && a.mean < a.med - EPS;
  if ((m = c.match(/^The mean \(([-−]?\d+(?:\.\d+)?)\) is above the median \(([-−]?\d+(?:\.\d+)?)\)\.$/))) return shows(m[1], a.mean) && near(a.med, num(m[2])) && a.mean > a.med + EPS;
  if ((m = c.match(/^The mean equals the median \(([-−]?\d+(?:\.\d+)?)\)\.$/))) return near(a.mean, a.med) && near(a.med, num(m[1]));
  return null;
}
F.effectCenter = q => claimsChoice(q, centerClaim);
F.meanShift = q => {
  const m = q.prompt.match(/The largest value, ([-−]?\d+(?:\.\d+)?),? (?:was a typo: it is fixed to|is changed to) ([-−]?\d+(?:\.\d+)?)\./), n = panel(q, 'A')?.data.length;
  return m && n ? Number((Math.abs(num(m[1]) - num(m[2])) / n).toFixed(9)) : undefined;
};

function spreadData(q) {
  const p = q.prompt, before = promptList(p); if (!before) return null;
  let after, m;
  if ((m = p.match(/salary, (\d+(?:\.\d+)?), is raised to (\d+(?:\.\d+)?)\./))) { after = [...before]; after[after.indexOf(num(m[1]))] = num(m[2]); }
  else if ((m = p.match(/hires a new employee at (\d+(?:\.\d+)?)\./))) after = [...before, num(m[1])];
  else return null;
  return { sb: sdOf(before), sa: sdOf(after), ib: iqrOf(before), ia: iqrOf(after) };
}
function spreadClaim(q, c) {
  const d = spreadData(q); if (!d) return null;
  const dS = d.sa - d.sb, dI = d.ia - d.ib, much = x => x > 2 * Math.max(d.sb, 1);
  let m;
  if (/^The SD gets much larger; the IQR stays the same\.$/.test(c)) return much(dS) && near(dI, 0);
  if (/^The IQR gets much larger; the SD stays the same\.$/.test(c)) return near(dS, 0) && dI > 2 * d.ib;
  if (/^The SD and the IQR grow by the same amount\.$/.test(c) || /^Both change by about the same amount\.$/.test(c)) return !near(dS, 0) && Math.abs(dS - dI) <= 0.1 * Math.max(Math.abs(dS), Math.abs(dI));
  if (/^Neither changes/.test(c)) return near(dS, 0) && near(dI, 0);
  if ((m = c.match(/^Both change: the SD a lot, the IQR a little \(([-−]?\d+(?:\.\d+)?) to ([-−]?\d+(?:\.\d+)?)\)\.$/))) return much(dS) && !near(dI, 0) && near(d.ib, num(m[1])) && near(d.ia, num(m[2])) && Math.abs(dI) < dS;
  if (/^The SD changes; the IQR cannot change\.$/.test(c)) return !near(dS, 0) && near(dI, 0);
  return null;
}
F.effectSpread = q => claimsChoice(q, spreadClaim);
F.iqrAfter = q => {
  const a = promptList(q.prompt), m = q.prompt.match(/You remove the outlier ([-−]?\d+(?:\.\d+)?)\./);
  if (!a || !m) return undefined;
  const v = num(m[1]), i = a.indexOf(v); if (i < 0) return undefined;
  return iqrOf(a.filter((_, k) => k !== i));
};

F.choosePair = q => {
  const p = panel(q, 'A'); if (!p) return undefined;
  if (/total payroll|the total/.test(q.prompt)) return choiceIdx(q, /^Mean and SD$/); // a total is n × mean
  const s = shapeOf(p.data, p.bins), S = cs(p.data);
  // an outlier the student can see: on a dot plot by the fence rule, on a histogram a bar cut off by empty bins at an end
  let out;
  if (p.bins) { const c = binCounts(p.data, p.bins.start, p.bins.width), nz = c.map((k, i) => (k ? i : -1)).filter(i => i >= 0); out = nz.length > 1 && (nz[1] - nz[0] > 1 || nz.at(-1) - nz.at(-2) > 1); }
  else out = outliersOf(p.data, S.q1, S.q3).length > 0;
  if (s === 'bimodal') return choiceIdx(q, /^No single pair: describe each cluster$/);
  if (out || s === 'right' || s === 'left') return choiceIdx(q, /^Median and IQR$/);
  if (s === 'symmetric') return choiceIdx(q, /^Mean and SD$/);
  return -1;
};

function compareClaimJudge(q, c) {
  const ps = panels(q), st = name => { const p = byLabel(q, name); return p ? cs(p.data) : null; };
  let m;
  if ((m = c.match(/^Every (.+?) value is higher than every (.+?) value\.$/))) { const X = st(m[1]), Y = st(m[2]); return X && Y ? X.min > Y.max : null; }
  if (/lowest value is .+ above .+lowest, so .+ is typically/.test(c)) return false; // one value per group is not a typical difference
  if (new RegExp(`^.+?${AP}s mean is \\S+ and .+?${AP}s median is \\S+, so`).test(c)) return false; // mixes two different measures
  if ((m = c.match(new RegExp(`^(.+?)${AP}s median is (\\S+) \\w+ higher, and (.+?) has the larger IQR \\((\\S+) vs\\. (\\S+) \\w+ for (.+?) vs\\. (.+?)\\)\\.$`)))) {
    const X = st(m[1]), O = st(ps.find(p => p.label !== m[1])?.label), A = st(m[6]), B = st(m[7]), W = st(m[3]), L = st(ps.find(p => p.label !== m[3])?.label);
    if (!X || !O || !A || !B || !W || !L) return null;
    return near(X.med - O.med, num(m[2])) && near(A.iqr, num(m[4])) && near(B.iqr, num(m[5])) && W.iqr > L.iqr + EPS;
  }
  return null;
}
F.compareClaim = q => claimsChoice(q, compareClaimJudge);

F.handleOutlier = q => {
  const p = q.prompt;
  if (/confirms/.test(p)) return choiceIdx(q, /^Keep it: it is a real/);
  if (/to look for fraud/.test(p)) return choiceIdx(q, /^Keep it and flag it/);
  if (/Nobody knows whether/.test(p)) return choiceIdx(q, /^Investigate the source/);
  if (/One entry reads (\d+); all the others are between/.test(p)) return choiceIdx(q, /^Check the record/);
  return undefined;
};
F.typoFix = q => {
  const a = boardNums(q), m = q.prompt.match(/The value (\d+(?:\.\d+)?) is a typo for (\d+(?:\.\d+)?)\./);
  if (!a.length || !m) return undefined;
  const i = a.indexOf(num(m[1])); if (i < 0) return undefined;
  const fixed = a.map((x, k) => (k === i ? num(m[2]) : x));
  return /nearest tenth/.test(q.prompt) ? round(mean(fixed), 1) : mean(fixed);
};

function solve(q) {
  const f = F[q.family];
  return f ? f(q) : undefined;
}

// ---------------------------------------------------------------- sane
function sane(q) {
  const out = [], p = q.prompt;
  const solved = (() => { try { return solve(q); } catch { return undefined; } })();
  if (q.input === 'choice' && solved === -1) out.push('no single right choice');

  switch (q.family) {
    case 'medianList': case 'quartiles': case 'binCount': case 'typoFix': {
      const L = P(q).list?.data, b = boardNums(q);
      if (L && JSON.stringify(sorted(L)) !== JSON.stringify(sorted(b))) out.push('the board list and the drawn list differ');
      const n = Number(p.match(/of (\d+) /)?.[1]);
      if (n && b.length !== n) out.push(`the list has ${b.length} values, not ${n}`);
      if (q.family === 'binCount') {
        const m = p.match(/bins of (\d+(?:\.\d+)?), starting at ([-−]?\d+(?:\.\d+)?)/);
        if (m && !/includes its lower end/.test(p)) {
          const w = num(m[1]), s = num(m[2]);
          if (b.some(x => Number.isInteger(Math.round(((x - s) / w) * 1e6) / 1e6) && near((x - s) / w, Math.round((x - s) / w)))) out.push('a value sits on a bin edge but the item does not say which bin gets it');
        }
      }
      break;
    }
    case 'differIn': {
      const d = differIn(q);
      if (d.cMixed) out.push('mean and median disagree on whether the centers differ');
      if (d.sMixed) out.push('SD and IQR disagree on whether the spreads differ');
      for (const pn of panels(q)) { const m = p.match(new RegExp(`${pn.label} \\(n = (\\d+)\\)`)); if (m && Number(m[1]) !== pn.data.length) out.push(`${pn.label} has ${pn.data.length} dots, not n = ${m[1]}`); }
      break;
    }
    case 'spreadMore': {
      const [pa, pb] = panels(q);
      for (const pn of [pa, pb]) { const m = p.match(new RegExp(`${pn.label} \\(n = (\\d+)\\)`)); if (m && Number(m[1]) !== pn.data.length) out.push(`${pn.label} n mismatch`); }
      const m = p.match(/lowest score \((\d+)\) and highest score \((\d+)\)/);
      if (m) for (const pn of [pa, pb]) if (Math.min(...pn.data) !== +m[1] || Math.max(...pn.data) !== +m[2]) out.push(`${pn.label} does not have min ${m[1]} and max ${m[2]}`);
      break;
    }
    case 'shapeName': case 'choosePair': {
      const pn = panel(q, 'A');
      if (pn) { const s = shapeOf(pn.data, pn.bins); if (s === 'unclear') out.push(`the shape is borderline`); }
      const m = p.match(/of (\d+) /); if (m && pn && +m[1] !== pn.data.length) out.push('n does not match the picture');
      break;
    }
    case 'shapeFeature': {
      const pn = panel(q, 'A'), g = (P(q).plot?.marks ?? []).find(k => k.kind === 'band');
      if (pn && g && pn.data.some(x => x > g.a + EPS && x < g.b - EPS)) out.push('a value sits inside the marked gap');
      if (pn && g && (!pn.data.includes(g.a) || !pn.data.includes(g.b))) out.push('the gap band does not run from value to value');
      break;
    }
    case 'boxPercent': {
      const a = panel(q, 'B')?.data, m = p.match(/between (the minimum|Q1|the median|Q3|the maximum) \(([-−]?\d+(?:\.\d+)?)\) and (the minimum|Q1|the median|Q3|the maximum) \(([-−]?\d+(?:\.\d+)?)\)/);
      if (a && m) {
        const S = cs(a), val = { 'the minimum': S.min, Q1: S.q1, 'the median': S.med, Q3: S.q3, 'the maximum': S.max };
        if (!near(val[m[1]], num(m[2])) || !near(val[m[3]], num(m[4]))) out.push('a labeled statistic is not what the data give');
      }
      break;
    }
    case 'boxTruth': {
      for (const c of q.choices ?? []) {
        const m = c.match(/^About half of the values lie between ([-−]?\d+(?:\.\d+)?) and ([-−]?\d+(?:\.\d+)?)\.$/);
        if (m && boxClaim(q, c) === false) out.push('the "about half" choice names the wrong quartiles');
      }
      break;
    }
    case 'unusualMax': {
      const a = sorted(panel(q, 'A').data), mx = a[a.length - 1], gap = mx - a[a.length - 2], S = cs(a.slice(0, -1));
      const fence = isUnusual(a, mx), far = gap > Math.max(S.iqr, 1);
      if (fence !== far) out.push(`the fence rule and the gap disagree on ${mx} (gap ${gap}, IQR of the rest ${S.iqr})`);
      break;
    }
    case 'unusualWhere': {
      const v = num(p.match(/both contain the value ([-−]?\d+(?:\.\d+)?)/)?.[1]);
      for (const pn of panels(q)) if (!pn.data.includes(v)) out.push(`${pn.label} does not contain ${v}`);
      break;
    }
    case 'devOne': case 'devBalance': case 'madCompute': {
      const a = q.family === 'madCompute' ? promptList(p) : panel(q, 'A')?.data;
      const mm = num((p.match(/[Mm]ean is ([-−]?\d+(?:\.\d+)?)/) ?? p.match(/have mean ([-−]?\d+(?:\.\d+)?)/))?.[1]);
      const fm = (P(q).plot?.marks ?? []).find(k => k.kind === 'fulcrum');
      if (q.family === 'devBalance') {
        const miss = solved, n = Number(p.match(/^(\d+) values/)?.[1]);
        if (a && n !== a.length + 1) out.push('the plot does not hold all but one value');
        const axis = P(q).plot?.axis, unit = q.unit;
        if (miss < 0 || (/points/.test(unit) && /20-point quiz/.test(p) && miss > 20)) out.push(`the missing value ${miss} is impossible`);
        if (axis && (miss < axis.min || miss > axis.max)) out.push(`the missing value ${miss} is off the axis`);
      } else if (a && !near(mean(a), mm)) out.push(`the stated mean ${mm} is not the data mean ${mean(a)}`);
      if (fm && !near(fm.x, mm)) out.push('the triangle is not at the stated mean');
      if (q.family === 'madCompute' && a) { const pd = panel(q, 'A')?.data; if (pd && JSON.stringify(sorted(pd)) !== JSON.stringify(sorted(a))) out.push('the plot and the list differ'); }
      break;
    }
    case 'madMeaning': {
      for (const pn of panels(q)) {
        const m = p.match(new RegExp(`${pn.label} has MAD ([\\d.]+)`)), mm = num(p.match(/have mean (\d+(?:\.\d+)?)/)?.[1]);
        if (m && !near(madOf(pn.data), num(m[1]))) out.push(`${pn.label}: MAD is ${madOf(pn.data)}, not ${m[1]}`);
        if (!near(mean(pn.data), mm)) out.push(`${pn.label}: mean is ${mean(pn.data)}, not ${mm}`);
        const r = Math.max(...pn.data) - Math.min(...pn.data);
        for (const c of q.choices ?? []) { const x = c.match(new RegExp(`^${pn.label}${AP}s range is (\\S+) `)); if (x && near(num(x[1]), r)) out.push(`the "half the range" choice is numerically right for ${pn.label}`); }
      }
      break;
    }
    case 'sdRank': {
      const m = p.match(/Both have mean (\d+(?:\.\d+)?) and MAD (\d+(?:\.\d+)?)/), m3 = p.match(/All three data sets have mean (\d+(?:\.\d+)?)/);
      for (const pn of panels(q)) {
        if (m && (!near(mean(pn.data), num(m[1])) || !near(madOf(pn.data), num(m[2])))) out.push(`${pn.label}: mean/MAD not as stated`);
        if (m3 && !near(mean(pn.data), num(m3[1]))) out.push(`${pn.label}: mean ${mean(pn.data).toFixed(3)}, not ${m3[1]}`);
      }
      break;
    }
    case 'sdTransform': {
      const a = panel(q, 'A')?.data, s = num(p.match(/ is ([-−]?\d+(?:\.\d+)?)(?:°F| \w+)\. /)?.[1]);
      if (a && !shows(String(s), sdOf(a))) out.push(`the drawn data have σ = ${sdOf(a).toFixed(3)}, not ${s}`);
      const b = panel(q, 'B')?.data, k = p.match(/raised by (\d+)/);
      if (a && b && k && JSON.stringify(sorted(a).map(x => x + +k[1])) !== JSON.stringify(sorted(b))) out.push('the after plot is not the before plot shifted');
      break;
    }
    case 'dotStack': {
      if (solved === undefined) out.push('two values tie for the tallest stack');
      const L = P(q).list?.data; if (L && JSON.stringify(sorted(L)) !== JSON.stringify(sorted(boardNums(q)))) out.push('the board and the list differ');
      break;
    }
    case 'boundaryBin': {
      const m = p.match(/bins of (\d+(?:\.\d+)?) starting at ([-−]?\d+(?:\.\d+)?)\. .*?value ([-−]?\d+(?:\.\d+)?)/), v = num(m?.[3]);
      if (m && !near(((v - num(m[2])) / num(m[1])) % 1, 0) && !near(((v - num(m[2])) / num(m[1])) % 1, 1)) out.push('the value is not on a bin edge');
      const a = panel(q, 'A')?.data; if (a && !a.includes(v)) out.push(`the histogram data do not contain ${v}`);
      break;
    }
    case 'fences': case 'isOutlier': case 'whiskerEnd': {
      const s = statedQ(p), a = orderedList(p) ?? panel(q, 'B')?.data;
      if (s && a) { const S = quart(a); if (!near(S.q1, s.q1) || !near(S.q3, s.q3)) out.push(`the stated quartiles are not the data's (${S.q1}, ${S.q3})`); }
      if (q.family !== 'fences' && a && JSON.stringify(sorted(a)) !== JSON.stringify(a)) out.push('"in order" list is not sorted');
      break;
    }
    case 'modPlotPick': {
      const a = orderedList(p), m = texPlain(q.board ?? '').match(/fences: ([-−]?\d+(?:\.\d+)?),? ([-−]?\d+(?:\.\d+)?)/);
      if (a && m) { const S = quart(a), f = fences(S.q1, S.q3); if (!near(f.lo, num(m[1])) || !near(f.hi, num(m[2]))) out.push('the board fences are wrong'); }
      const s = statedQ(p); if (a && s) { const S = quart(a); if (!near(S.q1, s.q1) || !near(S.q3, s.q3)) out.push('the stated quartiles are wrong'); }
      break;
    }
    case 'stemLeaf': {
      const s = P(q).stem; if (s && s.leaves.some(l => l.some((x, i) => i && x < l[i - 1]))) out.push('leaves are not in order');
      const a = stemData(q), n = Number(p.match(/of (\d+) |in (\d+) games/)?.slice(1).find(Boolean));
      if (a && n && a.length !== n) out.push(`the plot holds ${a.length} values, not ${n}`);
      if (a && /100-point test/.test(p) && Math.max(...a) > 100) out.push('a test score over 100');
      break;
    }
    case 'entryFix': {
      const m = p.match(/(\d+) [^\d,]*, but typed (\d+(?:\.\d+)?) instead of (\d+(?:\.\d+)?)\. The calculator showed a mean of (\d+(?:\.\d+)?)\./);
      if (m) { const v = solved; if (/hours of sleep/.test(p) && (v < 3 || v > 12)) out.push(`a mean sleep of ${v} h`); if (v <= 0) out.push('a mean of 0 or less'); }
      break;
    }
    case 'sdOutput': {
      const a = panel(q, 'A')?.data, V = varStats(q);
      if (a) {
        if (!near(V.sx, sdOf(a), 6e-5)) out.push(`σx on the board is not the data's σ (${sdOf(a).toFixed(4)})`);
        if (!near(V.Sx, sxOf(a), 6e-5)) out.push(`Sx on the board is not the data's Sx (${sxOf(a).toFixed(4)})`);
        if (!near(V.mean, mean(a), 6e-5)) out.push('x̄ is wrong');
        if (!near(V.sumx, sum(a))) out.push('Σx is wrong');
        if (!near(V.sumx2, sum(a.map(x => x * x)))) out.push('Σx² is wrong');
        if (!near(V.n, a.length)) out.push('n is wrong');
      }
      // the screen shows σx = 5.85 while the true σ is 5.84996…: the student rounds the shown value, a .x5 tie
      const pl = /nearest tenth/.test(p) ? 1 : /nearest hundredth/.test(p) ? 2 : null, shown = /\bSx\b/.test(p) && !/SD means σ/.test(p) ? V.Sx : V.sx;
      if (pl !== null && Number.isFinite(shown) && Math.abs(Math.abs(shown * 10 ** pl) % 1 - 0.5) < 1e-9) out.push(`the screen value ${shown} is a tie at the asked place (rounds either way, the exact SD decides)`);
      break;
    }
    case 'sdPlausible': {
      const a = panel(q, 'A')?.data;
      if (a && solved >= 0) { const v = num(q.choices[solved].match(/^(\d+(?:\.\d+)?)/)[1]), s = sdOf(a); if (Math.abs(v - s) > Math.max(1, 0.35 * s)) out.push(`the plausible choice ${v} is far from the real σ ${s.toFixed(2)}`); }
      const m = texPlain(q.board ?? '').match(/min = ([-−]?\d+(?:\.\d+)?).*max = ([-−]?\d+(?:\.\d+)?)/);
      if (a && m && (num(m[1]) !== Math.min(...a) || num(m[2]) !== Math.max(...a))) out.push('board min/max differ from the plot');
      break;
    }
    case 'weighted': {
      const m = p.match(/counts tests (\d+)%, quizzes (\d+)%, homework (\d+)%/);
      if (m && +m[1] + +m[2] + +m[3] !== 100) out.push('the weights do not total 100%');
      if (/GPA/.test(p) && (solved < 0 || solved > 4.0001)) out.push('a GPA outside 0–4');
      break;
    }
    case 'summaryPick': {
      const a = panel(q, 'A')?.data; if (a) { const S = cs(a), o = outliersOf(a, S.q1, S.q3); if (o.length && (q.choices ?? []).some(c => /^Roughly symmetric/.test(c))) out.push(`${o.join(', ')} is an outlier by the 1.5·IQR rule, yet the summary on offer is mean and SD`); }
      break;
    }
    case 'meanShift': {
      const a = panel(q, 'A')?.data, m = p.match(/The largest value, ([-−]?\d+(?:\.\d+)?)/), n = Number(p.match(/of (\d+) /)?.[1]);
      if (a && m && Math.max(...a) !== num(m[1])) out.push('the named largest value is not the largest');
      if (a && n && a.length !== n) out.push('n does not match the plot');
      if (/100-point test/.test(p) && /changed to (\d+)/.test(p) && +p.match(/changed to (\d+)/)[1] > 100) out.push('a test score over 100');
      break;
    }
    case 'iqrAfter': {
      const a = promptList(p), m = p.match(/Its IQR is ([-−]?\d+(?:\.\d+)?)\. You remove the outlier ([-−]?\d+(?:\.\d+)?)\./);
      if (a && m) {
        const S = quart(a); if (!near(S.q3 - S.q1, num(m[1]))) out.push(`the stated IQR is not the data's (${S.q3 - S.q1})`);
        if (!outliersOf(a, S.q1, S.q3).includes(num(m[2]))) out.push(`${m[2]} is not an outlier by the 1.5·IQR rule`);
      }
      break;
    }
    case 'effectSpread': {
      const d = spreadData(q);
      if (d && !(d.sa > d.sb)) out.push('the SD does not grow');
      break;
    }
    case 'twoSet': case 'compareClaim': case 'sameCenter': case 'comparableRow': {
      for (const pn of panels(q)) { const m = p.match(new RegExp(`${pn.label} \\(n = (\\d+)\\)`)) ?? p.match(new RegExp(`(\\d+) students at ${pn.label}`)); if (m && Number(m[1]) !== pn.data.length) out.push(`${pn.label} has ${pn.data.length} dots, not ${m[1]}`); }
      break;
    }
    default: break;
  }
  return [...new Set(out)].join('; ');
}

export default { solve, sane };
