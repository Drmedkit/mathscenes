// Oracle for the lesson "normal-distribution" (HS Statistics, S-ID.A.4, S-IC.A.2). Written from what the student sees
// only: the prompt, the board, the choices and the drawn picture (density histograms with their bar heights, normal
// curves with shaded regions and labelled ticks, the z-table excerpt "Area left of z", calculator screens, dot plots of
// simulated sample shares). Every number is worked out here with the method the item states:
//   - 68-95-99.7 items ("Use the 68-95-99.7 rule", "about"): whole-SD cut points, cumulative benchmarks
//     0.15 / 2.5 / 16 / 50 / 84 / 97.5 / 99.85 %, regions by difference;
//   - table items: z = (x − μ)/σ rounded to 2 places, the 4-place cumulative-left area of that z (computed here from Φ,
//     and sane() checks that the row is in the excerpt with that value), right tails by 1 − left, bands by difference,
//     rounded at the end to the place the item names; backwards reads take the row whose area is closest;
//   - calculator items: exact normalcdf (Φ by Simpson integration of the density, |error| < 1e-12).
// Conceptual choices are judged by testing each statement (numbers recomputed, directions checked), never by picking
// the one that sounds like the lesson. See docs/lessons/QUALITY_LAYER.md, "O: the oracle".
import { nums, texPlain, round } from '../../tools/quality/oracle-kit.mjs';

const near = (a, b, tol = 1e-6) => Math.abs(a - b) <= tol;
const num = s => Number(String(s).replace(/−/g, '-').replace(/,/g, ''));

// ---------------------------------------------------------------- the standard normal
function phi0(z) { return Math.exp(-z * z / 2) / Math.sqrt(2 * Math.PI); }
/** Φ(z): Simpson on [0, |z|] with 800 panels (error below 1e-11 for |z| ≤ 9) */
function Phi(z) {
  if (z === Infinity) return 1; if (z === -Infinity) return 0;
  const a = Math.min(Math.abs(z), 9), n = 800, h = a / n;
  let s = phi0(0) + phi0(a);
  for (let i = 1; i < n; i++) s += (i % 2 ? 4 : 2) * phi0(i * h);
  const half = s * h / 3;
  return z >= 0 ? 0.5 + half : 0.5 - half;
}
const cdf = (x, m, s) => Phi((x - m) / s);
/** the table's area for a z already rounded to 2 places */
const TAB = new Map();
const tab = z => { const k = Math.round(round(z, 2) * 100); if (!TAB.has(k)) TAB.set(k, round(Phi(k / 100), 4)); return TAB.get(k); };
const z2 = (x, m, s) => round((x - m) / s, 2);
/** backwards table read: the z (2 places) whose 4-place area is closest to p; tie → both returned */
const ZC = new Map();
function zClosest(p) {
  if (ZC.has(p)) return ZC.get(p);
  let best = [], bd = Infinity;
  for (let k = -349; k <= 349; k++) {
    const z = k / 100, d = Math.abs(tab(z) - p);
    if (d < bd - 1e-12) { bd = d; best = [z]; } else if (Math.abs(d - bd) <= 1e-12) best.push(z);
  }
  ZC.set(p, best);
  return best;
}
/** benchmark cumulative-left percent at a whole-SD point k (±Infinity allowed) */
const BENCH = { '-3': 0.15, '-2': 2.5, '-1': 16, 0: 50, 1: 84, 2: 97.5, 3: 99.85 };
function benchCdf(k) {
  if (k === -Infinity || k < -3.5) return 0;
  if (k === Infinity || k > 3.5) return 100;
  const r = Math.round(k);
  if (Math.abs(r - k) > 1e-6) throw new Error(`not a whole-SD point: k = ${k}`);
  return BENCH[r];
}

// ---------------------------------------------------------------- reading
const board = q => texPlain(q.board ?? '');
const card = q => q.data?.picture?.card ?? {};
const tableRows = q => q.data?.picture?.table?.rows ?? null;
/** the model N(μ, σ) shown (board first, then prompt) */
function model(q) {
  for (const t of [board(q), q.prompt]) {
    const m = String(t).match(/N\(\s*([−-]?[\d.,]+),\s*([−-]?[\d.,]+)\s*\)/);
    if (m) return { m: num(m[1]), s: num(m[2]) };
  }
  return null;
}
const LESS = /^(lighter|shorter|cooler|lower|faster|less|younger|below)$/;   // one comparison word
const MORE = /^(heavier|taller|warmer|higher|slower|more|older|above)$/
/** an event as { lo, hi } (inside) or { lo, hi, out: true } (X < lo or X > hi), read from the board or the words */
function eventOf(q) {
  const b = board(q).replace(/−/g, '-');
  let m;
  if ((m = b.match(/X\s*[<≤]\s*(-?\d*\.?\d+)\s*or\s*X\s*[>≥]\s*(-?\d*\.?\d+)/))) return { lo: +m[1], hi: +m[2], out: true };
  if ((m = b.match(/P\(\s*(-?\d*\.?\d+)\s*[<≤]\s*X\s*[<≤]\s*(-?\d*\.?\d+)\s*\)/))) return { lo: +m[1], hi: +m[2] };
  if ((m = b.match(/P\(\s*X\s*([<≤>≥])\s*(-?\d*\.?\d+)\s*\)/))) return /[<≤]/.test(m[1]) ? { lo: -Infinity, hi: +m[2] } : { lo: +m[2], hi: Infinity };
  return eventWords(q.prompt, model(q));
}
function eventWords(text, M) {
  const t = String(text).replace(/−/g, '-').replace(/(\d),(\d{3})/g, '$1$2');
  let m;
  if ((m = t.match(/more than (\d*\.?\d+)\s*\S*\s*away from the mean/))) return { lo: M.m - +m[1], hi: M.m + +m[1], out: true };
  if ((m = t.match(/within (\d*\.?\d+)\s*\S*\s*of the mean/))) return { lo: M.m - +m[1], hi: M.m + +m[1] };
  if ((m = t.match(/between (\d*\.?\d+)\s*\S*\s*and (\d*\.?\d+)/))) return { lo: +m[1], hi: +m[2] };
  const lessM = t.match(/\b(lighter|shorter|cooler|lower|faster) than (\d*\.?\d+)/), moreM = t.match(/\b(heavier|taller|warmer|higher|slower) than (\d*\.?\d+)/);
  if (lessM && moreM) return { lo: +lessM[2], hi: +moreM[2], out: true };
  if (lessM) return { lo: -Infinity, hi: +lessM[2] };
  if (moreM) return { lo: +moreM[2], hi: Infinity };
  if ((m = t.match(/no more than (\d*\.?\d+)/))) return { lo: -Infinity, hi: +m[1] };
  if ((m = t.match(/at least (\d*\.?\d+)/))) return { lo: +m[1], hi: Infinity };
  return null;
}
/** probability of an event from a left-area function F */
function probOf(ev, F) {
  if (ev.out) return F(ev.lo) + (1 - F(ev.hi));
  return (ev.hi === Infinity ? 1 : F(ev.hi)) - (ev.lo === -Infinity ? 0 : F(ev.lo));
}
/** the group size N in "of 2,000 ..." / "N = 2,000" */
function groupN(q) {
  const t = (q.prompt + ' ' + board(q)).replace(/(\d),(\d{3})/g, '$1$2');
  let m = t.match(/N = (\d+)/) || t.match(/\bOf (\d+) /) || t.match(/group of (\d+)/) || t.match(/how many of (\d+) /) || t.match(/^(\d+) /);
  return m ? +m[1] : null;
}
const asksCount = q => /how many/i.test(q.prompt);
/** "to 4 places" / "1 decimal place" / "whole number" in the prompt */
function places(q, dflt) {
  const t = q.prompt.replace(/Round (each )?z to \d decimal places?/g, '').replace(/z rounded to \d (decimal )?places?/g, '');
  if (/whole number/.test(t)) return 0;
  const m = t.match(/(\d) decimal place/) || t.match(/to (\d) places/) || t.match(/Give (\d) decimal/);
  return m ? +m[1] : dflt;
}
/** index of the choice c (by plain-text match of a predicate); -1 if not exactly one */
function only(q, pred) {
  const hits = (q.choices ?? []).map((c, i) => (pred(c, i) ? i : -1)).filter(i => i >= 0);
  return hits.length === 1 ? hits[0] : -1;
}
/** curve kinds of the drawn curves */
const kindOf = q => (card(q).curves ?? [])[0]?.kind;

// ---------------------------------------------------------------- per family
const F = {};

// density histograms: share = width × height
F.densArea = q => { const b = (card(q).bars ?? []).find(x => x.col === 'pick'); return round((b.hi - b.lo) * b.h, 6); };
F.densTotal = q => {
  const bars = card(q).bars ?? [], X = card(q).x;
  const m = q.prompt.match(/total area of (\d*\.?\d+)/), w = bars[0].hi - bars[0].lo;
  return round((1 - +m[1]) / w, 6);
};
F.densUnequal = q => {
  const ms = [...q.prompt.replace(/−/g, '-').matchAll(/(\d*\.?\d+)–(\d*\.?\d+) \S+ bin has height (\d*\.?\d+)/g)];
  const share = ms.map(m => (+m[2] - +m[1]) * +m[3]);
  const lab = ms.map(m => `${m[1]}–${m[2]}`);
  if (near(share[0], share[1], 1e-9)) return only(q, c => /same share/.test(c));
  const win = share[0] > share[1] ? lab[0] : lab[1];
  return only(q, c => c.includes(win + ' '));
};

// the curve's height is a density, not a share
F.curveHeight = q => {
  // the height is a density; "exactly" a value has area 0; "right ...% of the time" is meaningless. A "... or less"
  // statement whose percent happens to match the left area is a second right answer: sane() reports it.
  return only(q, c => /density/.test(c));
};
F.curveVsBars = q => only(q, c => /is a model: its areas come close/.test(c));

// notation
function fmtEvent(c) {
  const t = c.replace(/−/g, '-');
  let m;
  if ((m = t.match(/^P\(X ([<>]) (-?\d*\.?\d+)\)$/))) return m[1] === '<' ? { lo: -Infinity, hi: +m[2] } : { lo: +m[2], hi: Infinity };
  if ((m = t.match(/^P\((-?\d*\.?\d+) < X < (-?\d*\.?\d+)\)$/))) return { lo: +m[1], hi: +m[2] };
  return null;   // P(X = a), P(X) > a, P(X) between ...: not an event's probability
}
function shadeEvent(q) {
  const C = card(q), M = (C.curves ?? [])[0], sh = C.shades ?? [];
  if (!sh.length) return null;
  const s = sh[0];
  // a shade that runs off the drawn axis stands for an open end
  const lo = s.lo < C.x.min ? -Infinity : s.lo, hi = s.hi > C.x.max ? Infinity : s.hi;
  return { lo, hi };
}
const sameEv = (a, b) => a && b && !a.out && !b.out && a.lo === b.lo && a.hi === b.hi;
F.eventWords = q => {
  const ev = /shaded/.test(q.prompt) ? shadeEvent(q) : eventWords(q.prompt.match(/"([^"]*)"/)[1], model(q));
  return only(q, c => sameEv(fmtEvent(c), ev));
};
F.eventMeaning = q => {
  const b = board(q).replace(/−/g, '-'), m = b.match(/P\(X < (-?\d*\.?\d+)\) = (\d*\.?\d+)/), v = +m[1], p = +m[2];
  return only(q, c => {
    const k = c.match(/About (\d*\.?\d+)% of .* (\w+) than (\d*\.?\d+)/);
    if (!k) return false;
    return near(+k[1], 100 * p, 1e-6) && LESS.test(k[2]) && near(+k[3], v);
  });
};
F.pointEq = q => /compare/.test(q.prompt) ? only(q, c => /^They are equal$/.test(c)) : only(q, c => c.trim() === '0');
F.pointRound = q => {
  const r = nums(board(q))[0], t = q.prompt;
  const unit = /tenth/.test(t) ? 0.1 : /hundredth/.test(t) ? 0.01 : /nearest (ten|10)\b/.test(t) ? 10 : 1;
  return only(q, c => {
    const m = c.replace(/−/g, '-').match(/^(-?\d*\.?\d+) ≤ X < (-?\d*\.?\d+)$/);
    return !!m && near(+m[1], r - unit / 2, 1e-9) && near(+m[2], r + unit / 2, 1e-9);
  });
};

// shape, location, scale
const SHAPE = { uniform: /No: it is flat/, skewR: /No: it is skewed right/, skewL: /No: it is skewed left/, bimodal: /No: it is two peaks|No: it has two peaks/, normal: /Yes, as a candidate/ };
F.shapeFit = q => only(q, c => SHAPE[kindOf(q)]?.test(c));
F.shapeFacts = q => only(q, c => /symmetric about its mean|mean and the median are equal|never touch it|exactly one peak, at the mean/.test(c));
function curveByLabel(q, pred) {
  const C = card(q), curve = (C.curves ?? []).find(pred);
  const lab = (C.texts ?? []).find(t => /^[A-Z]$/.test(t.text) && t.col === curve.col);
  return only(q, c => c.trim() === `Curve ${lab.text}`);
}
F.meanMatch = q => { const mu = nums(board(q))[1]; return curveByLabel(q, c => near(c.m, mu)); };
F.sdMatch = q => { const sg = nums(board(q))[1]; return curveByLabel(q, c => near(c.s, sg)); };
F.meanShift = q => {
  const t = q.prompt.replace(/−/g, '-'), ms = [...t.matchAll(/N\((-?\d*\.?\d+), (-?\d*\.?\d+)\)/g)];
  const d = +ms[1][1] - +ms[0][1];
  return only(q, c => {
    const m = c.match(/slides (\d*\.?\d+) \S+ to the (right|left), same width and height/);
    return !!m && near(+m[1], Math.abs(d)) && m[2] === (d > 0 ? 'right' : 'left');
  });
};
const FACT = { half: 0.5, twice: 2, 'two times': 2, 'three times': 3, 'a third': 1 / 3, third: 1 / 3, 'four times': 4, quarter: 0.25, 'a quarter': 0.25 };
F.sdHeight = q => {
  if (/Kai|negative|−/.test(q.prompt) && /Is that a normal model/.test(q.prompt)) return only(q, c => /^No: an SD is a typical distance/.test(c));
  const ms = [...q.prompt.matchAll(/N\((\d*\.?\d+), (\d*\.?\d+)\)/g)], r = +ms[1][2] / +ms[0][2];
  return only(q, c => {
    const m = c.toLowerCase().match(/^(half|twice|two times|three times|four times|a third|a quarter) as wide, and the peak (half|twice|two times|three times|four times|a third|a quarter) as tall$/);
    return !!m && near(FACT[m[1]], r, 1e-9) && near(FACT[m[2]], 1 / r, 1e-9);
  });
};
F.axisTick = q => {
  const M = model(q), b = String(q.board).replace(/−/g, '-'), m = b.match(/\\mu\s*([+-])\s*(\d*)\s*\\sigma/);
  const k = (m[1] === '-' ? -1 : 1) * (m[2] ? +m[2] : 1);
  return round(M.m + k * M.s, 6);
};
F.axisParam = q => {
  const b = String(q.board).replace(/−/g, '-'), mm = b.match(/\\mu\s*=\s*(-?\d*\.?\d+)/), vv = b.match(/\\sigma\^2\s*=\s*(\d*\.?\d+)/);
  const s = Math.sqrt(+vv[1]);
  return only(q, c => { const m = c.match(/^N\((-?\d*\.?\d+), (\d*\.?\d+)\)$/); return !!m && near(+m[1], +mm[1]) && near(+m[2], s, 1e-9); });
};

// a model area as a percent and a count
function statedArea(q) { const m = board(q).match(/\)\s*=\s*(\d*\.?\d+)/); return m ? +m[1] : null; }
F.popCount = q => round(statedArea(q) * groupN(q), 6);
F.popStatement = q => {
  const p = statedArea(q), ev = eventOf(q), N = groupN(q), v = isFinite(ev.hi) ? ev.hi : ev.lo, less = ev.hi !== Infinity;
  return only(q, c => {
    if (/^Exactly/.test(c)) return false;
    const m = c.replace(/(\d),(\d{3})/g, '$1$2').match(/^The model estimates that about (\d*\.?\d+)% of the .* (\w+) than (\d*\.?\d+)\s*\S*, about (\d+) of (\d+)$/);
    if (!m) return false;
    return near(+m[1], 100 * p, 1e-6) && (less ? LESS : MORE).test(m[2]) && near(+m[3], v) && near(+m[4], p * N, 1e-6) && +m[5] === N;
  });
};

// 68-95-99.7
function benchPct(q, ev, M) {
  const B = x => benchCdf((x - M.m) / M.s) / 100;
  return 100 * probOf(ev, B);
}
function benchAnswer(q) {
  const M = model(q), ev = eventOf(q), pct = benchPct(q, ev, M);
  if (asksCount(q)) return round(pct / 100 * groupN(q), 6);
  return round(pct, 6);
}
for (const f of ['erCentral', 'erCount', 'halfPct', 'halfSide', 'tailPct', 'tailOutside', 'bandPct', 'bandSum']) F[f] = benchAnswer;
F.specEstimate = q => {
  const M = model(q), ev = eventWords(q.prompt.split('percent of')[1] ?? q.prompt, M);
  return round(benchPct(q, ev, M), 6);
};
F.erBeyond = q => {
  const M = model(q), x = nums(board(q)).at(-1), k = +q.prompt.match(/more than (\d) SD/)[1];
  const tail = 100 - (benchCdf(k) - benchCdf(-k));
  return only(q, c => {
    const m = c.match(/^Possible but very rare: the model leaves about (\d*\.?\d+)% beyond (\d) SD/);
    return !!m && +m[2] === k && near(+m[1], round(tail, 4));
  });
};

// z-scores
F.zRead = q => {
  const M = model(q), z = num(board(q).match(/z = ([−-]?\d*\.?\d+)/)[1]);
  const dir = z < 0 ? 'below' : 'above', a = Math.abs(z);
  return only(q, c => {
    let m;
    if ((m = c.match(/^(\d*\.?\d+) SDs? (below|above) the mean: (\d*\.?\d+)\s*\S* (below|above) (\d*\.?\d+)/)))
      return near(+m[1], a) && m[2] === dir && near(+m[3], a * M.s, 1e-9) && m[4] === dir && near(+m[5], M.m);
    if ((m = c.match(/^(\d*\.?\d+) SDs? (below|above) the mean$/))) return near(+m[1], a) && m[2] === dir;
    if ((m = c.match(/^(\d*\.?\d+)\s*\S* (below|above) the mean$/))) return near(+m[1], a * M.s, 1e-9) && m[2] === dir;   // "0.5 lb below the mean" is true when σ = 1
    if ((m = c.match(/^In the top (\d*\.?\d+)%/))) return near(+m[1], 100 * (1 - Phi(z)), 0.05);
    return false;
  });
};
F.zLocate = q => { const M = model(q), z = num(q.prompt.match(/z = ([−-]?\d*\.?\d+)/)[1]); return round(M.m + z * M.s, 6); };
F.zCalc = q => {
  const M = model(q), x = num(q.prompt.match(/z-score of ([−-]?[\d.,]+)/)[1]), z = (x - M.m) / M.s;
  return /Round to 2/.test(q.prompt) ? round(z, 2) : round(z, 6);
};
F.zCalcDec = q => {
  const M = model(q), m = q.prompt.match(/is (\d*\.?\d+) \S+ (\w+) than the mean/);
  const sign = LESS.test(m[2]) ? -1 : 1;
  return round(sign * +m[1] / M.s, 2);
};
function scores(q) {
  return [...q.prompt.replace(/−/g, '-').matchAll(/(\w+) scored (\d*\.?\d+) on an? [\w ]+? test \((?:scores modeled by )?N\((\d*\.?\d+), (\d*\.?\d+)\)\)/g)]
    .map(m => ({ who: m[1], z: (+m[2] - +m[3]) / +m[4], x: +m[2], m: +m[3], s: +m[4] }));
}
F.zCompare = q => {
  const S = scores(q), better = /time/.test(q.prompt) ? -1 : 1;
  if (near(S[0].z, S[1].z, 1e-9)) return only(q, c => /equally/.test(c));
  const w = (S[0].z - S[1].z) * better > 0 ? S[0].who : S[1].who;
  return only(q, c => c.trim() === w);
};
F.zMatch = q => {
  const t = q.prompt.replace(/−/g, '-');
  const a = t.match(/scored (\d*\.?\d+) on an? [\w ]+? test \(N\((\d*\.?\d+), (\d*\.?\d+)\)\)/), b = t.match(/score on an? [\w ]+? test \(N\((\d*\.?\d+), (\d*\.?\d+)\)\)/);
  const z = (+a[1] - +a[2]) / +a[3];
  return round(+b[1] + z * +b[2], 1);
};
F.stdEvent = q => {
  const M = model(q), b = board(q).replace(/−/g, '-'), m = b.match(/P\(X ([<>]) (-?\d*\.?\d+)\)/), z = z2(+m[2], M.m, M.s);
  return only(q, c => { const k = c.replace(/−/g, '-').match(/^P\(Z ([<>]) (-?\d*\.?\d+)\)$/); return !!k && k[1] === m[1] && near(+k[2], z, 1e-9); });
};
F.stdBetween = q => { const M = model(q), ev = eventOf(q); return [z2(ev.lo, M.m, M.s), z2(ev.hi, M.m, M.s)]; };

// table and calculator areas
function tableArea(q) { const M = model(q), ev = eventOf(q); return probOf(ev, x => tab((x - M.m) / M.s)); }
function tableAnswer(q) {
  const a = tableArea(q);
  if (asksCount(q)) return round(a * groupN(q), 0);
  return round(a, places(q, 4));
}
for (const f of ['leftTable', 'leftCount', 'rightTable', 'betweenTable', 'outsideTable', 'outsideSym', 'mixedFull', 'mixedData']) F[f] = tableAnswer;
F.leftBounds = q => {
  const z = num(board(q).match(/z = ([−-]?\d*\.?\d+)/)[1]), p = Phi(z);
  return only(q, c => { const m = c.match(/between (\d*\.?\d+) and (\d*\.?\d+)/); return !!m && +m[1] < p && p < +m[2]; });
};
F.rightSupplied = q => {
  const lines = q.data.picture.calc.lines, area = num(lines.find(l => /^area/.test(l)).split(':')[1]);
  return round(1 - area, 4);
};
F.betweenCommand = q => {
  const M = model(q), ev = eventOf(q);
  return only(q, c => { const k = nums(c); return k.length === 4 && near(k[0], ev.lo) && near(k[1], ev.hi) && near(k[2], M.m) && near(k[3], M.s); });
};
F.mixedRegion = q => {
  const M = model(q), ev = eventWords(q.prompt.split('that are')[1], M), want = probOf(ev, x => cdf(x, M.m, M.s));
  const P = x => cdf(x, M.m, M.s);
  return only(q, c => {
    const t = c.replace(/−/g, '-');
    if (/P\(X = /.test(t)) return near(want, 0, 1e-9);
    // evaluate a sum of ± P(X < v) and ± constants
    const expr = t.replace(/P\(X < (-?\d*\.?\d+)\)/g, (_, v) => `(${P(+v)})`);
    if (!/^[\d\s.()+\-e]+$/.test(expr)) return false;
    // eslint-disable-next-line no-new-func
    const val = Function(`return ${expr}`)();
    return near(val, want, 1e-9);
  });
};

// specify a model
F.specModel = q => {
  const b = String(q.board).replace(/−/g, '-'), xb = +b.match(/\\bar\{x\}\s*=\s*(-?\d*\.?\d+)/)[1], s = +b.match(/\bs\s*=\s*(\d*\.?\d+)/)[1];
  return only(q, c => { const m = c.match(/^About N\((\d*\.?\d+), (\d*\.?\d+)\): the sample mean and SD estimate/); return !!m && near(+m[1], xb) && near(+m[2], s); });
};

// inverse normal (backwards table read)
F.invZ = q => { const p = +board(q).match(/= (\d*\.?\d+)/)[1], z = zClosest(p); return z[0]; };
F.invCut = q => {
  const M = model(q), p = +board(q).match(/P\(X < x\) = (\d*\.?\d+)/)[1], z = zClosest(p)[0];
  return round(M.m + z * M.s, places(q, 1));
};
F.invMiddle = q => {
  const M = model(q), tail = +board(q).match(/each tail (\d*\.?\d+)/)[1], z = zClosest(tail)[0];
  const d = places(q, 1);
  return [round(M.m + z * M.s, d), round(M.m - z * M.s, d)];
};

// is a normal model fair?
const NOT_NORMAL = /family night|mansions|siblings|waited at a clinic|household incomes/;
F.fitContext = q => /least/.test(q.prompt) ? only(q, c => NOT_NORMAL.test(c)) : only(q, c => !NOT_NORMAL.test(c));
F.fitBound = q => {
  const M = model(q), a = 100 * tab(-M.m / M.s);
  return only(q, c => { const m = c.match(/^No: the model puts about (\d*\.?\d+)% of .* below 0/); return !!m && near(+m[1], a, 1e-6); });
};
function fitShares(q) { const k = nums(board(q)); return { p1: 100 * k[0] / k[1], p2: 100 * k[3] / k[4], n: k[1] }; }
F.fitCheck = q => {
  const { p1, p2 } = fitShares(q), close = Math.abs(p1 - 68) <= 5 && Math.abs(p2 - 95) <= 3;
  return close ? only(q, c => /^Close to 68% and 95%: a normal model looks reasonable/.test(c)) : only(q, c => /^Far from 68% and 95%: a normal model does not look reasonable/.test(c));
};
const STILL = { skewR: /^Still skewed right, now with mean 0 and SD 1/, skewL: /^Still skewed left, now with mean 0 and SD 1/, bimodal: /^Still two-peaked, now with mean 0 and SD 1/ };
F.stdShape = q => only(q, c => STILL[kindOf(q)]?.test(c));
F.stdTable = q => only(q, c => /^The z-score is right, but the table percent assumes a normal shape/.test(c));

// data facts vs model estimates
F.factModel = q => {
  const t = q.prompt.replace(/(\d),(\d{3})/g, '$1$2');
  const n = +t.match(/^(\d+) students/)[1], k = +t.match(/; (\d+) of them scored above (\d*\.?\d+)/)[1], v = +t.match(/scored above (\d*\.?\d+)/)[1];
  const mean = +t.match(/mean (\d*\.?\d+) points/)[1], p = +t.match(/gives P\(X > [\d.]+\) = (\d*\.?\d+)/)[1];
  if (/model estimate/.test(q.prompt)) return only(q, c => { const m = c.match(/^About (\d*\.?\d+)% of students score above (\d*\.?\d+)$/); return !!m && near(+m[1], 100 * p) && near(+m[2], v); });
  return only(q, c => {
    let m;
    if ((m = c.match(/^(\d+) of the (\d+) students scored above (\d*\.?\d+)$/))) return +m[1] === k && +m[2] === n && near(+m[3], v);
    if ((m = c.match(/^(\d+) students took the test$/))) return +m[1] === n;
    if ((m = c.match(/^The class mean was (\d*\.?\d+) points$/))) return near(+m[1], mean);
    return false;
  });
};
F.factDiscrete = q => {
  const M = model(q), x = nums(board(q))[0];
  return only(q, c => {
    const m = c.match(/area from (\d*\.?\d+) to (\d*\.?\d+), about (\d*\.?\d+)/);
    return !!m && near(+m[1], x - 0.5) && near(+m[2], x + 0.5) && near(+m[3], round(cdf(x + 0.5, M.m, M.s) - cdf(x - 0.5, M.m, M.s), 4));
  });
};

// repeated samples
const panelsOf = q => q.data.picture.samples.panels;
const sd = a => { const m = a.reduce((s, x) => s + x, 0) / a.length; return Math.sqrt(a.reduce((s, x) => s + (x - m) ** 2, 0) / a.length); };
const meanOf = a => a.reduce((s, x) => s + x, 0) / a.length;
F.sampSpread = q => {
  const S = q.data.picture.samples, small = S.panels.find(p => /n = 20\b/.test(p.label)), large = S.panels.find(p => /n = 200\b/.test(p.label));
  // the other statements are false whatever the dots show (more values scatter less; samples vary; one sample cannot
  // refute a model); whether the drawn dots visibly support it is a sane() question
  return only(q, c => {
    const m = c.match(/^Both scatter around (\d*\.?\d+)%; the n = (\d+) shares scatter much more widely$/);
    return !!m && near(+m[1], S.mark) && +m[2] === 20;
  });
};
F.sampRead = q => {
  const S = panelsOf(q).find(p => /n = 20\b/.test(p.label)), b = board(q), m = b.match(/share ([≥≤]) (\d*\.?\d+)/);
  return S.data.filter(x => (m[1] === '≥' ? x >= +m[2] - 1e-9 : x <= +m[2] + 1e-9)).length;
};
F.discExplain = q => {
  const t = q.prompt.replace(/(\d),(\d{3})/g, '$1$2');
  if (/not chosen at random|basketball|team|club|volunteers/.test(t) && !/A random sample/.test(t)) return only(q, c => /^Selection bias/.test(c));
  const n = +t.match(/random sample of (\d+)/)[1], p = +t.match(/: (\d*\.?\d+)%/)[1] / 100, se = Math.sqrt(0.68 * 0.32 / n), zz = Math.abs(p - 0.68) / se;
  if (/close to the model/.test(t)) return only(q, c => /^The data are consistent with the model/.test(c));
  if (zz < 2.5) return only(q, c => /^Ordinary sample-to-sample variation/.test(c));
  return only(q, c => /^A real mismatch in shape/.test(c));
};
F.discCoin = q => {
  const calc = q.data.picture.calc.lines, runs = num(calc.find(l => /^runs/.test(l)).split(':')[1]), hits = num(calc.find(l => /^all tails/.test(l)).split(':')[1]);
  const share = 100 * hits / runs;
  return only(q, c => { const m = c.match(/^No: \d+ in a row happened in about (\d*\.?\d+)% of the simulated runs/); return !!m && near(+m[1], share, 0.05); });
};

// precision
F.precReport = q => {
  const b = board(q), m = b.match(/P\(X ([<>]) (\d*\.?\d+)\)\s*=\s*(\d*\.?\d+)/), less = m[1] === '<', v = +m[2], p = +m[3];
  const hits = (q.choices ?? []).map((c, i) => {
    if (/^Exactly/.test(c)) return -1;   // a model estimate is never exact; 5.4495 newborns is not a count
    const k = c.match(/^About (\d*\.?\d+)% of .* (\w+) than (\d*\.?\d+)/);
    if (!k || !near(+k[1], Math.round(100 * p)) || !(less ? LESS : MORE).test(k[2]) || !near(+k[3], v)) return -1;
    return i;
  }).filter(i => i >= 0);
  return hits.length === 1 ? hits[0] : -1;
};
F.precTableCalc = q => only(q, c => /^Both are fine: the gap is far smaller than the uncertainty in the model/.test(c));

// ---------------------------------------------------------------- sane
function sane(q) {
  const f = q.family, M = model(q);
  const issues = [];
  // the table excerpt: true 4-place areas, and the row the method needs is shown
  const rows = tableRows(q);
  if (rows) for (const [z, a] of rows) if (!near(a, tab(z), 1e-9)) issues.push(`table row z = ${z} shows ${a}, Φ gives ${tab(z)}`);
  const needRow = z => { if (rows && !rows.some(r => near(r[0], z, 1e-9))) issues.push(`the table excerpt has no row for z = ${z}`); };
  const tieZ = x => { const r = (x - M.m) / M.s * 100; if (Math.abs(Math.abs(r - Math.trunc(r)) - 0.5) < 1e-7) issues.push(`z = ${(x - M.m) / M.s} is a .xx5 tie`); };
  if (['leftTable', 'leftCount', 'rightTable', 'betweenTable', 'outsideTable', 'outsideSym', 'mixedFull', 'mixedData'].includes(f)) {
    const ev = eventOf(q);
    for (const x of [ev.lo, ev.hi]) if (isFinite(x)) { tieZ(x); needRow(z2(x, M.m, M.s)); }
    const a = tableArea(q);
    if (asksCount(q)) { const c = a * groupN(q); if (Math.abs(c - Math.floor(c) - 0.5) < 1e-7) issues.push(`count ${c} is a .5 tie`); }
    if (a <= 0 || a >= 1) issues.push(`area ${a}`);
  }
  if (['invZ', 'invCut', 'invMiddle'].includes(f)) {
    const p = f === 'invMiddle' ? +board(q).match(/each tail (\d*\.?\d+)/)[1] : +board(q).match(/= (\d*\.?\d+)/)[1];
    const z = zClosest(p);
    if (z.length > 1) issues.push(`two table rows are equally close to ${p}: ${z.join(', ')}`);
    needRow(z[0]);
    if (f !== 'invZ') { const d = places(q, 1), x = M.m + z[0] * M.s; for (const y of f === 'invMiddle' ? [x, M.m - z[0] * M.s] : [x]) { const r = y * 10 ** d; if (Math.abs(Math.abs(r - Math.trunc(r)) - 0.5) < 1e-7) issues.push(`cutoff ${y} is a rounding tie`); } }
  }
  // benchmark items need whole-SD cut points
  if (['erCentral', 'erCount', 'halfPct', 'halfSide', 'tailPct', 'tailOutside', 'bandPct', 'bandSum', 'specEstimate'].includes(f)) {
    try { const v = f === 'specEstimate' ? F.specEstimate(q) : benchAnswer(q); if (asksCount(q) && !Number.isInteger(round(v, 6))) issues.push(`the 68-95-99.7 count ${v} is not a whole number`); }
    catch (e) { issues.push(e.message); }
  }
  // stated model areas must be the model's areas
  if (['popCount', 'popStatement'].includes(f)) {
    const p = statedArea(q), ev = eventOf(q), tru = probOf(ev, x => cdf(x, M.m, M.s));
    if (!near(p, tru, 0.006)) issues.push(`the stated area ${p} is not the model's ${tru.toFixed(4)}`);
  }
  if (f === 'eventMeaning' || f === 'precReport') {
    const b = board(q).replace(/−/g, '-'), m = b.match(/P\(X ([<>]) (-?\d*\.?\d+)\)\s*=\s*(\d*\.?\d+)/);
    const left = cdf(+m[2], M.m, M.s), tru = m[1] === '<' ? left : 1 - left, dp = (m[3].split('.')[1] ?? '').length;
    if (!near(+m[3], tru, 0.6 * 10 ** -dp + 1e-9)) issues.push(`the stated area ${m[3]} is not the model's ${tru.toFixed(6)}`);
  }
  if (f === 'factModel') {
    const t = q.prompt, m = t.match(/N\((\d*\.?\d+), (\d*\.?\d+)\) gives P\(X > (\d*\.?\d+)\) = (\d*\.?\d+)/), tru = 1 - cdf(+m[3], +m[1], +m[2]);
    if (!near(+m[4], tru, 0.006)) issues.push(`the stated area ${m[4]} is not the model's ${tru.toFixed(4)}`);
  }
  if (f === 'rightSupplied') {
    const L = q.data.picture.calc.lines, up = num(L.find(l => /^upper/.test(l)).split(':')[1]), a = num(L.find(l => /^area/.test(l)).split(':')[1]);
    if (!near(a, round(cdf(up, M.m, M.s), 4), 1e-9)) issues.push(`normalcdf screen says ${a}, the model gives ${cdf(up, M.m, M.s).toFixed(5)}`);
  }
  if (f === 'precTableCalc') {
    const t = q.prompt.replace(/−/g, '-'), m = t.match(/P\(X < (\d*\.?\d+)\), \w+ used the table with z rounded to (-?\d*\.?\d+) and got (\d*\.?\d+); normalcdf gives (\d*\.?\d+)/);
    const x = +m[1];
    if (!near(+m[2], z2(x, M.m, M.s), 1e-9)) issues.push(`z rounds to ${z2(x, M.m, M.s)}, not ${m[2]}`);
    if (!near(+m[3], tab(+m[2]), 1e-9)) issues.push(`table area for ${m[2]} is ${tab(+m[2])}, not ${m[3]}`);
    if (!near(+m[4], round(cdf(x, M.m, M.s), 4), 1e-9)) issues.push(`normalcdf gives ${cdf(x, M.m, M.s).toFixed(5)}, not ${m[4]}`);
  }
  if (f === 'stdTable') {
    const t = q.prompt.replace(/−/g, '-').replace(/(\d),(\d{3})/g, '$1$2'), mean = +t.match(/mean (\d*\.?\d+)/)[1], s = +t.match(/SD (\d*\.?\d+)/)[1];
    const m = t.match(/A value of (\d*\.?\d+) .* has z = (-?\d*\.?\d+)/), z = (+m[1] - mean) / s, pc = +t.match(/table gives (\d*\.?\d+)%/)[1];
    if (!near(+m[2], round(z, 2), 1e-9)) issues.push(`z = ${z}, the item says ${m[2]}`);
    if (!near(pc, 100 * tab(+m[2]), 1e-6)) issues.push(`the table gives ${100 * tab(+m[2])}% for z = ${m[2]}, not ${pc}%`);
  }
  if (f === 'curveHeight') {
    const x = num(board(q).match(/f\((-?\d*\.?\d+)\)/)[1]), h = phi0((x - M.m) / M.s) / M.s;
    for (const c of q.choices ?? []) {
      const k = c.match(/About (\d*\.?\d+)% .* are (\d*\.?\d+) \S+ or less/);
      if (k && Math.abs(+k[1] - 100 * cdf(+k[2], M.m, M.s)) <= 0.5) issues.push(`distractor "${c}" is true: the model puts ${(100 * cdf(+k[2], M.m, M.s)).toFixed(2)}% at or below ${k[2]}`);
    }
    const said = +q.prompt.match(/height is about (\d*\.?\d+)/)[1];
    if (!near(said, h, 0.0006)) issues.push(`the curve's height at ${x} is ${h.toFixed(4)}, not ${said}`);
  }
  if (f === 'curveVsBars') {
    const m = q.prompt.match(/From (\d*\.?\d+)\s*\S* to (\d*\.?\d+)\s*\S* the bars hold (\d*\.?\d+) of the data; the curve's area there is (\d*\.?\d+)/);
    const bars = card(q).bars.filter(b => b.lo >= +m[1] - 1e-9 && b.hi <= +m[2] + 1e-9).reduce((s, b) => s + (b.hi - b.lo) * b.h, 0);
    const ca = cdf(+m[2], M.m, M.s) - cdf(+m[1], M.m, M.s);
    if (!near(bars, +m[3], 1e-6)) issues.push(`the drawn bars hold ${bars.toFixed(3)}, the prompt says ${m[3]}`);
    if (!near(ca, +m[4], 0.006)) issues.push(`the curve's area is ${ca.toFixed(4)}, the prompt says ${m[4]}`);
  }
  if (f === 'densTotal') {
    const m = +q.prompt.match(/total area of (\d*\.?\d+)/)[1], tot = card(q).bars.reduce((s, b) => s + (b.hi - b.lo) * b.h, 0);
    if (!near(m, tot, 1e-6)) issues.push(`the drawn bars total ${tot.toFixed(4)}, the prompt says ${m}`);
  }
  if (f === 'densArea') { const tot = card(q).bars.reduce((s, b) => s + (b.hi - b.lo) * b.h, 0); if (!near(tot, 1, 1e-6)) issues.push(`the bar areas add to ${tot.toFixed(4)}, not 1`); }
  if (f === 'fitBound') { const z = num(board(q).match(/≈ ([−-]?\d*\.?\d+)/)[1]); if (!near(z, z2(0, M.m, M.s), 1e-9)) issues.push(`z for 0 is ${z2(0, M.m, M.s)}, the board says ${z}`); }
  if (f === 'fitCheck') {
    const { p1, p2, n } = fitShares(q), d1 = Math.abs(p1 - 68), d2 = Math.abs(p2 - 95);
    if ((d1 > 5 && d1 < 8 && d2 <= 4) || (d2 > 3 && d2 < 4.5 && d1 <= 6)) issues.push(`${p1.toFixed(1)}% / ${p2.toFixed(1)}% is neither clearly close to nor clearly far from 68/95`);
    const se1 = 100 * Math.sqrt(0.68 * 0.32 / n), se2 = 100 * Math.sqrt(0.95 * 0.05 / n);
    if ((d1 > 5 || d2 > 3) && d1 < 2 * se1 && d2 < 2 * se2) issues.push(`called "far", but with n = ${n} both shares are within 2 SE of 68/95 (SE ${se1.toFixed(1)} and ${se2.toFixed(1)} points): ordinary sample variation`);
  }
  if (f === 'factDiscrete') {
    const m = (q.choices ?? []).join(' ').match(/area from (\d*\.?\d+) to (\d*\.?\d+), about (\d*\.?\d+)/);
    if (m) { const x = (+m[1] + +m[2]) / 2, a = cdf(+m[2], M.m, M.s) - cdf(+m[1], M.m, M.s); if (!near(+m[3], round(a, 4), 1e-9)) issues.push(`the area from ${m[1]} to ${m[2]} is ${a.toFixed(5)}, the choice says ${m[3]}`); }
  }
  if (f === 'leftBounds') {
    const z = num(board(q).match(/z = ([−-]?\d*\.?\d+)/)[1]), x = nums(q.prompt).find((v, i, a) => true);
    if ([-3, -2, -1, 0, 1, 2, 3].some(k => near(z, k, 1e-9))) issues.push(`z = ${z} sits on a benchmark: two brackets touch it`);
  }
  if (f === 'zCalc' && /Round to 2/.test(q.prompt)) { const x = num(q.prompt.match(/z-score of ([−-]?[\d.,]+)/)[1]); tieZ(x); }
  if (f === 'zMatch') {
    const t = q.prompt.replace(/−/g, '-'), a = t.match(/scored (\d*\.?\d+) on an? [\w ]+? test \(N\((\d*\.?\d+), (\d*\.?\d+)\)\)/), b = t.match(/score on an? [\w ]+? test \(N\((\d*\.?\d+), (\d*\.?\d+)\)\)/);
    const x = +b[1] + (+a[1] - +a[2]) / +a[3] * +b[2], r = x * 10; if (Math.abs(Math.abs(r - Math.trunc(r)) - 0.5) < 1e-7) issues.push(`score ${x} is a rounding tie`);
  }
  if (f === 'zCalcDec') { const m = q.prompt.match(/is (\d*\.?\d+) \S+ (\w+) than the mean/), r = +m[1] / M.s * 100; if (Math.abs(Math.abs(r - Math.trunc(r)) - 0.5) < 1e-7) issues.push('z is a rounding tie'); }
  if (f === 'stdBetween') { const ev = eventOf(q); tieZ(ev.lo); tieZ(ev.hi); }
  if (f === 'stdEvent') { const m = board(q).replace(/−/g, '-').match(/P\(X [<>] (-?\d*\.?\d+)\)/); tieZ(+m[1]); }
  if (f === 'sampSpread') {
    const S = q.data.picture.samples, small = S.panels.find(p => /n = 20\b/.test(p.label)), large = S.panels.find(p => /n = 200\b/.test(p.label));
    const r = sd(small.data) / sd(large.data), ms = meanOf(small.data), ml = meanOf(large.data);
    if (r < 1.5) issues.push(`the drawn n = 20 shares (SD ${sd(small.data).toFixed(1)}) scatter hardly more than the n = 200 shares (SD ${sd(large.data).toFixed(1)}): "much more widely" is not what the picture shows`);
    if (Math.abs(ms - S.mark) > 5 || Math.abs(ml - S.mark) > 3) issues.push(`the drawn shares centre on ${ms.toFixed(1)}% / ${ml.toFixed(1)}%, not around the model's ${S.mark}%`);
  }
  if (M && M.s <= 0 && f !== 'sdHeight') issues.push(`σ = ${M.s}`);
  return issues.join('; ');
}

function solve(q) {
  const f = F[q.family];
  if (!f) return undefined;
  const r = f(q);
  return r;
}

export default { solve, sane };
