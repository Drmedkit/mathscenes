// Oracle for the lesson "sampling-and-inference" (random samples, sampling variability, comparative inference,
// grade 7). Written from what the student sees only: the prompt, the board (the random-number list), the choices and
// the dot plots the picture draws (row values, the population line). Numbers are worked out from the data (means,
// medians, MADs, shares scaled up and rounded once). Statements are judged by the principles of sampling, written out
// below as rules: a random sample's statistic estimates the population value and varies from sample to sample;
// bigger random samples steady the MEANS, not the individuals; a biased method misses the same way whatever its size;
// a claim reaches only the group that was sampled at random. Answer-side picture fields (marks, bands) are not read.
// See docs/lessons/QUALITY_LAYER.md, "O: the oracle".
import { Q, nums, choiceWhere } from '../../tools/quality/oracle-kit.mjs';

// ---------------------------------------------------------------- reading and statistics
const clean = s => String(s ?? '').replace(/[−–]/g, '-').replace(/[’‘]/g, "'");
const num = s => Number(clean(s).replace(/,/g, ''));
const rx = (s, re) => clean(s).match(re);
const mean = v => v.reduce((a, b) => a + b, 0) / v.length;
const median = v => { const s = [...v].sort((a, b) => a - b), n = s.length; return n % 2 ? s[(n - 1) / 2] : (s[n / 2 - 1] + s[n / 2]) / 2; };
const mad = v => { const m = mean(v); return mean(v.map(x => Math.abs(x - m))); };
const rows = q => q.data?.picture?.p?.rows ?? [];
const popLine = q => q.data?.picture?.p?.pop?.at;
const same = (a, b) => Math.abs(a - b) < 1e-9;
/** round half up to a whole number */
const whole = x => Math.floor(x + 0.5 + 1e-9);
/** a choice whose text starts with / contains a pattern, exactly one */
const pick = (q, re) => choiceWhere(q, c => re.test(clean(c)));

// ---------------------------------------------------------------- families
const F = {};

F.popSample = q => {
  const p = clean(q.prompt);
  let m;
  if (/does not say whose opinion/.test(p)) return pick(q, /^You cannot tell/);
  if ((m = p.match(/wants to know .*? the (\d+) (members|students|voters) .*? asks all (\d+) of them/)) && m[1] === m[3]) return pick(q, /^It is a census/);
  if (/What is the sample\?/.test(p)) {
    // the people actually asked or drawn
    const n = (p.match(/(?:asks|asked|draws) (\d[\d,]*)/) ?? [])[1];
    return choiceWhere(q, c => new RegExp(`^The ${n} \\w+ (she asked|whose names were drawn|he asked|they asked)`).test(clean(c)));
  }
  if (/What is the population\?/.test(p)) {
    // the whole group the question is about: the "wants to know" clause names it
    const clause = (p.match(/wants to know (.*?)\. /) ?? [])[1];
    if (!clause) return undefined;
    return choiceWhere(q, c => { const t = clean(c).replace(/^(All|The) /, ''); return !/^Only/.test(c) && /^All /.test(c) && clause.includes(t); });
  }
  return undefined;
};

F.spreadCompare = q => {
  const [A, B] = rows(q);
  if (!A || !B) return undefined;
  const r = mad(B.values) / mad(A.values);
  if (r < 0.75) return pick(q, /less spread out/);
  if (r > 1.3) return pick(q, /more spread out/);
  if (r > 0.85 && r < 1.18) return pick(q, /^About as spread out/);
  return undefined;   // in between: no clear call (sane flags it)
};

F.statParam = q => {
  const p = clean(q.prompt);
  let m;
  if ((m = p.match(/of all (\d[\d,]*) \w+(?: \w+)?: the (mean|median) is (\d+(?:\.\d+)?)\. .*?the sample's (mean|median) is (\d+(?:\.\d+)?)\./))) {
    const P = m[3], S = m[5], k = m[2];
    return choiceWhere(q, c => clean(c) === `${P} is the population ${k}, and ${S} is the sample ${k}`);
  }
  if ((m = p.match(/The sample (mean|median) is (\d+(?:\.\d+)?)\. What do we know about the (mean|median) of all/))) {
    return choiceWhere(q, c => clean(c) === `It is unknown; ${m[2]} is an estimate of it`);
  }
  return undefined;
};

F.isRandom = q => {
  const N = (clean(q.prompt).match(/of the (\d[\d,]*) /) ?? [])[1];
  // equal chance for everyone: a random number generator on the roster, or identical slips of ALL the names
  return choiceWhere(q, c => /different roster numbers with a random number generator/.test(c) || new RegExp(`^Draw \\d+ of the ${N} names from a box of identical slips`).test(clean(c)));
};

F.randomDiffers = q => (/random number generator|from a hat|names from a box/.test(q.prompt) ? pick(q, /^Nothing went wrong: random samples land near/) : undefined);

F.whatDot = q => {
  const R = rows(q);
  const bottom = R[R.length - 1];
  const m = bottom && clean(bottom.label).match(/^means of \d+ samples of (\d+)/);
  if (m) return choiceWhere(q, c => new RegExp(`^The mean of one random sample of ${m[1]} `).test(clean(c)));
  return undefined;
};

F.twoSamples = q => (/each drew a random sample/.test(q.prompt) ? pick(q, /^Both are fair estimates/) : undefined);

F.whichSize = q => {
  const p = clean(q.prompt);
  const m = p.match(/random samples of (\d+) and \d+ random samples of (\d+).*Which plot shows the samples of (\d+)\?/);
  const R = rows(q);
  if (!m || R.length < 2) return undefined;
  const spread = R.map(r => mad(r.values));
  const names = R.map(r => (clean(r.label).match(/^(Plot \w)/) ?? [])[1]);
  const big = Math.max(Number(m[1]), Number(m[2])), asked = Number(m[3]);
  const tight = spread[0] < spread[1] ? 0 : 1;
  const want = asked === big ? tight : 1 - tight;   // bigger samples: means bunch closer together
  return choiceWhere(q, c => c.trim() === names[want]);
};

F.biggerSample = q => pick(q, /^No: the .* vary as much as ever; it is the sample means that vary less/);

F.drawNumbers = q => {
  const p = clean(q.prompt);
  const m = p.match(/numbered the (\d+) \w+ on the roster 01 to (\d+) and needs a random sample of (\d+), nobody twice/);
  if (!m) return undefined;
  const N = Number(m[2]), n = Number(m[3]);
  const list = String(q.board).split(/,/).map(x => x.replace(/\\[ ,;]|\s/g, '')).filter(Boolean);
  const got = [];
  for (const t of list) { const v = Number(t); if (v >= 1 && v <= N && !got.includes(v) && got.length < n) got.push(v); }
  if (got.length < n) return -1;
  return choiceWhere(q, c => { const v = c.split(',').map(x => Number(x.trim())); return v.length === n && v.every((x, i) => x === got[i]); });
};

F.absent = q => pick(q, /when they are back, or go on to the next random number/);

F.estimate = q => {
  const p = clean(q.prompt);
  const m = p.match(/: ([\d, .]+)\. Use the sample to estimate the (mean|median)/);
  if (!m) return undefined;
  const v = m[1].split(',').map(x => Number(x.trim()));
  return m[2] === 'mean' ? Q(v.reduce((a, b) => a + b, 0), v.length).value : median(v);
};

F.report = q => {
  const m = clean(q.prompt).match(/has a mean of (\d+(?:\.\d+)?) (\S+)/);
  if (!m) return undefined;
  return choiceWhere(q, c => clean(c) === `About ${m[1]} ${m[2]}: another random sample would give a slightly different number`);
};

F.typical = q => {
  const R = rows(q);
  const P = popLine(q) ?? Number((clean(q.prompt).match(/the mean is (\d+(?:\.\d+)?)/) ?? [])[1]);
  const means = R.find(r => /^means of/.test(clean(r.label)));
  if (!means || !Number.isFinite(P)) return undefined;
  const share = d => means.values.filter(x => Math.abs(x - P) <= d + 1e-9).length / means.values.length;
  // "most" = at least 3 of 4; the tightest band that holds most of the means
  const opts = (q.choices ?? []).map((c, i) => ({ i, d: Number((clean(c).match(/^Within about (\d+(?:\.\d+)?)/) ?? [])[1]) })).filter(o => Number.isFinite(o.d)).sort((a, b) => a.d - b.d);
  const ok = opts.find(o => share(o.d) >= 0.75);
  if (means.values.every(x => same(x, P))) return pick(q, /They all land exactly/);
  return ok ? ok.i : -1;
};

F.plan = q => pick(q, /^Draw \d+ different random samples of \d+ and plot each sample's mean/);

/** "asked a random sample of n of the N …: k …" → { n, N, k } */
function sampleCount(p) {
  const m = clean(p).match(/random sample of (\d[\d,]*) of the (\d[\d,]*) [^:,]*?(?::|,) (\d[\d,]*) /);
  return m ? { n: num(m[1]), N: num(m[2]), k: num(m[3]) } : null;
}
F.scaleCount = q => { const s = sampleCount(q.prompt); return s ? whole((s.k * s.N) / s.n) : undefined; };
F.scaleNonWhole = F.scaleCount;
F.reportCount = q => {
  const s = sampleCount(q.prompt);
  if (!s) return undefined;
  const est = whole((s.k * s.N) / s.n);
  return choiceWhere(q, c => { const m = clean(c).match(/^About (\d[\d,]*) of the (\d[\d,]*) /); return !!m && num(m[1]) === est && num(m[2]) === s.N; });
};

/** the sample share (0..1) of a complement item */
function share(p) {
  const t = clean(p);
  let m;
  if ((m = t.match(/(\d+) of (\d+) (?!students|voters)\w/)) && !/random sample of \d+ of \d/.test(m[0])) return Number(m[1]) / Number(m[2]);
  if ((m = t.match(/, (\d+(?:\.\d+)?)% /))) return Number(m[1]) / 100;
  if ((m = t.match(/a share of (0?\.\d+)/))) return Number(m[1]);
  const s = sampleCount(t);
  return s ? s.k / s.n : null;
}
F.complementPct = q => {
  const t = clean(q.prompt);
  const m = t.match(/random sample of (\d+) of the [\d,]+ \w+ at [^,]+, (\d+) of (\d+) /);
  const sh = m ? Number(m[2]) / Number(m[3]) : share(t);
  return sh === null ? undefined : Number((100 - 100 * sh).toFixed(9));
};
F.complementCount = q => {
  const t = clean(q.prompt);
  let m;
  const N = num((t.match(/of all (\d[\d,]*)/) ?? [])[1]);
  if ((m = t.match(/: (\d+(?:\.\d+)?)% chose [^,]+, (\d+(?:\.\d+)?)% chose [^,]+, the rest chose/))) return whole((N * (100 - Number(m[1]) - Number(m[2]))) / 100);
  const s = sampleCount(t);
  if (s) return whole((N * (s.n - s.k)) / s.n);
  return undefined;
};

/** "<group>: mean 34, MAD 5, median 34, IQR 4" twice */
function groups(p) {
  return [...clean(p).matchAll(/([a-z][\w ]*?): mean (\d+(?:\.\d+)?), MAD (\d+(?:\.\d+)?), median (\d+(?:\.\d+)?), IQR (\d+(?:\.\d+)?)/g)]
    .map(m => ({ name: m[1].trim(), mean: Number(m[2]), mad: Number(m[3]), median: Number(m[4]), iqr: Number(m[5]) }));
}
F.madUnits = q => {
  const g = groups(q.prompt);
  if (g.length !== 2 || g[0].mad !== g[1].mad) return undefined;
  return Math.abs(g[0].mean - g[1].mean) / g[0].mad;
};

/** an outlier by the 1.5 × IQR rule (quartiles = medians of the halves) */
function hasOutlier(v) {
  const s = [...v].sort((a, b) => a - b), n = s.length, h = Math.floor(n / 2);
  const q1 = median(s.slice(0, h)), q3 = median(s.slice(n % 2 ? h + 1 : h)), iqr = q3 - q1;
  return s.some(x => x < q1 - 1.5 * iqr - 1e-9 || x > q3 + 1.5 * iqr + 1e-9);
}
F.pickMeasure = q => {
  const p = clean(q.prompt);
  const R = rows(q);
  const out = R.length ? R.some(r => hasOutlier(r.values)) : null;
  const saysOut = /far from the rest|outlier(?!s)|skewed/.test(p) && !/no outliers/.test(p);
  const saysSym = /roughly symmetric, with no outliers/.test(p);
  // the prompt's own description of the shape decides (what the student is told); the plotted data are checked in sane
  if (saysOut) return pick(q, /^Medians and IQRs$/);
  if (saysSym) return pick(q, /^Means and MADs$/);
  if (out !== null) return pick(q, out ? /^Medians and IQRs$/ : /^Means and MADs$/);
  return undefined;
};

F.compare = q => {
  const p = clean(q.prompt);
  const m = p.match(/^Random samples of (\d+) (.+?) and (\d+) (.+?), .*?: the means are (\d+(?:\.\d+)?) and (\d+(?:\.\d+)?), both MADs are (\d+(?:\.\d+)?), so the means are/);
  if (!m) return undefined;
  const n = Math.min(Number(m[1]), Number(m[3]));
  const a = Number(m[5]), b = Number(m[6]), d = Math.abs(a - b) / Number(m[7]);
  const hi = (a >= b ? m[2] : m[4]).toLowerCase();
  // a gap under 1 MAD is lost in the spread; 2+ MADs is a clear gap, but small samples (≤ 10) stay a maybe
  if (d < 1) return pick(q, /^No clear difference/);
  if (d >= 2 && n >= 15) return choiceWhere(q, c => clean(c).toLowerCase().startsWith(hi) && /likely .* in general: the gap is large next to the spread/.test(c));
  if (d >= 2 && n <= 10) return choiceWhere(q, c => clean(c).toLowerCase().startsWith(hi) && new RegExp(`may .*, but samples of only ${n} can vary a lot, so be cautious`).test(clean(c)));
  return undefined;
};

/** what the biased method's group has more or less of, relative to the thing estimated: +1 too high, −1 too low */
const BIAS = [
  [/minutes .* exercise/, /in the gym/, +1],            // gym-goers exercise more
  [/hours teens play video games/, /gaming website/, +1], // gamers play more
  [/want a new skate park/, /poll on the city website/, +1], // those who care most answer
  [/read for fun/, /in the library/, +1],              // library lunch readers read more
  [/bring lunch from home/, /lunch line/, -1],         // the line is buying lunch
  [/too much homework/, /email their opinion/, +1],    // strong feelers write in
  [/ride the bus/, /across from the school/, -1],       // they walk
  [/own a car/, /next to the train station/, -1],      // they need cars less
];
F.biasWay = q => {
  const p = clean(q.prompt);
  const hit = BIAS.find(([est, how]) => est.test(p) && how.test(p));
  if (!hit) return undefined;
  return pick(q, hit[2] > 0 ? /^Too high:/ : /^Too low:/);
};

F.biasOrChance = q => {
  const p = clean(q.prompt);
  if (/What best explains the difference\?/.test(p) && /random sample/.test(p)) return pick(q, /^Chance: random samples vary around the true share/);
  let m;
  if ((m = p.match(/a random sample of (\d[\d,]*), and a website poll that [\d,]+ people chose to answer\. Which is more trustworthy/))) return choiceWhere(q, c => clean(c) === `The random sample of ${m[1]}`);
  return undefined;
};

F.whichBiased = q => {
  const P = popLine(q) ?? Number((clean(q.prompt).match(/the mean is (\d+(?:\.\d+)?)/) ?? [])[1]);
  const R = rows(q);
  if (R.length < 2 || !Number.isFinite(P)) return undefined;
  const off = R.map(r => Math.abs(mean(r.values) - P));
  const names = R.map(r => (clean(r.label).match(/^(Plot \w)/) ?? [])[1]);
  // a volunteer method misses the same way every time: its results sit off the population mean
  const far = off[0] > off[1] ? 0 : 1;
  if (Math.min(...off) * 2 > Math.max(...off)) return -1;
  return choiceWhere(q, c => c.trim() === names[far]);
};

F.scope = q => {
  const p = clean(q.prompt);
  let m;
  if ((m = p.match(/^A random sample of \d+ (.+?) from (.+?) has a mean of (\d+(?:\.\d+)?) (\S+)/))) {
    const place = m[2].replace(/^the /, ''), M = m[3];
    // the sampled school (or club, garden) only, about its average, not every individual and not the country
    return choiceWhere(q, c => { const t = clean(c); return t.includes(place) && new RegExp(`about ${M} .*on average$`).test(t) && !/across the country|Every/.test(t); });
  }
  if ((m = p.match(/posted an online survey; (\d+) .+? chose to answer\. Their mean: (\d+(?:\.\d+)?) (\S+)/))) {
    return choiceWhere(q, c => clean(c) === `The ${m[1]} who answered averaged ${m[2]} ${m[3]}; we can't say much about the rest`);
  }
  if ((m = p.match(/^Random samples of \d+ students from (.+?) and from (.+?) \(.*\): (.+?)'s mean is [\d.]+ MADs above (.+?)'s\./))) {
    const top = m[3], low = m[4];
    return choiceWhere(q, c => new RegExp(`^${top} students typically .* than ${low} students$`).test(clean(c)));
  }
  return undefined;
};

export function solve(q) {
  const f = F[q.family];
  return f ? f(q) : undefined;
}

// ---------------------------------------------------------------- the world
export function sane(q) {
  const out = [], p = clean(q.prompt);
  let s; try { s = solve(q); } catch { s = undefined; }
  if (q.input === 'choice' && s === -1) out.push('no single right choice');
  if (/(tomato plants|plants) chose to answer|online survey; \d+ tomato plants/.test(p)) out.push('tomato plants "chose to answer" an online survey');
  if (q.family === 'spreadCompare' && s === undefined) {
    const [A, B] = rows(q);
    if (A && B) out.push(`the sample's MAD is ${(mad(B.values) / mad(A.values)).toFixed(2)} × the population's: neither clearly less, more nor about the same`);
  }
  if (q.family === 'typical') {
    const R = rows(q), P = popLine(q);
    const means = R.find(r => /^means of/.test(clean(r.label)));
    if (means && Number.isFinite(P)) {
      const ds = (q.choices ?? []).map(c => Number((clean(c).match(/^Within about (\d+(?:\.\d+)?)/) ?? [])[1])).filter(Number.isFinite).sort((a, b) => a - b);
      const sh = d => means.values.filter(x => Math.abs(x - P) <= d + 1e-9).length / means.values.length;
      if (ds.length && sh(ds[0]) >= 0.5 && sh(ds[0]) < 0.75) out.push(`only ${Math.round(100 * sh(ds[0]))}% of the means are within ${ds[0]}: "most" is borderline`);
    }
  }
  if (q.family === 'compare') {
    const m = p.match(/the means are (\d+(?:\.\d+)?) and (\d+(?:\.\d+)?), both MADs are (\d+(?:\.\d+)?), so the means are (\d+(?:\.\d+)?) MADs apart/);
    if (m && !same(Math.abs(Number(m[1]) - Number(m[2])) / Number(m[3]), Number(m[4]))) out.push('the stated MAD gap is wrong');
  }
  if (q.family === 'pickMeasure') {
    const R = rows(q);
    if (R.length && /roughly symmetric, with no outliers/.test(p) && R.some(r => hasOutlier(r.values))) out.push('"no outliers" but a plotted value is an outlier');
    if (R.length && /far from the rest/.test(p) && !R.some(r => hasOutlier(r.values))) out.push('"one value far from the rest" but no plotted value is an outlier');
  }
  if (q.family === 'madUnits') {
    const g = groups(p);
    if (g.length === 2 && g[0].mad !== g[1].mad) out.push('the two MADs differ: "how many MADs" is unclear');
  }
  if (q.input === 'num' && typeof s === 'number' && /^(scaleCount|complementCount|scaleNonWhole)$/.test(q.family)) {
    const sc = sampleCount(p);
    if (sc && q.family === 'scaleCount' && !Number.isInteger((sc.k * sc.N) / sc.n)) {
      const x = (sc.k * sc.N) / sc.n;
      if (Math.abs(x - Math.floor(x) - 0.5) < 1e-9) out.push('the scaled count is exactly x.5');
    }
  }
  return [...new Set(out)].join('; ');
}

export default { solve, sane };
