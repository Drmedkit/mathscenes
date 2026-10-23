// map-scale oracle (role O, docs/lessons/QUALITY_LAYER.md). Works every practice item out from what the student
// sees: the scale (verbal "1 in = 10 mi", ratio "1 : 24,000", bar), the lengths in the prompt, the choices, and the
// drawn line on a ruler or a bar (its start and its length as drawn). A ratio scale pairs a unit with the SAME unit;
// 12 in = 1 ft, 5,280 ft = 1 mi (63,360 in), 100 cm = 1 m, 1,000 m = 1 km. All arithmetic is exact (fractions).
// Picture fields the page shows only in the solve (p.ans, lines.ask.v) are never read.
import { Q } from '../../tools/quality/oracle-kit.mjs';

const UNI = { '½': '1/2', '¼': '1/4', '¾': '3/4' };
/** '2 1/2' '3/4' '1.25' '63,360' → Q */
function q(t) {
  const s = String(t).replace(/[½¼¾]/g, c => UNI[c]).replace(/[−–]/g, '-').replace(/,/g, '').trim();
  const m = s.match(/^(\d+) (\d+)\/(\d+)$/);
  if (m) return Q(Number(m[2]), Number(m[3])).add(Number(m[1]));
  return Q(s);
}
const N = '(\\d+ \\d+\\/\\d+|\\d+\\/\\d+|\\d[\\d,]*(?:\\.\\d+)?|\\.\\d+)';
const IN = { in: Q(1), ft: Q(12), mi: Q(63360), cm: Q(100, 254), mm: Q(10, 254), m: Q(10000, 254), km: Q(10000000, 254) };
const UNITW = { inches: 'in', inch: 'in', in: 'in', feet: 'ft', ft: 'ft', miles: 'mi', mile: 'mi', mi: 'mi', centimeters: 'cm', cm: 'cm', millimeters: 'mm', mm: 'mm', meters: 'm', m: 'm', kilometers: 'km', km: 'km' };
/** convert a length between units (exact, metric through inches) */
const conv = (v, from, to) => (from === to ? v : (['cm', 'mm', 'm', 'km'].includes(from) && ['cm', 'mm', 'm', 'km'].includes(to)) ? v.mul(METRIC[from]).div(METRIC[to]) : v.mul(IN[from]).div(IN[to]));
const METRIC = { mm: Q(1), cm: Q(10), m: Q(1000), km: Q(1000000) };
/** "1 : 24,000" anywhere in a text → n */
const ratioN = t => { const m = String(t).match(/1 : ([\d,]+)/); return m ? q(m[1]) : null; };
const picP = qq => qq.data?.picture?.pic?.p;
const roundTo = (v, step) => { const k = v.div(step); const n = Math.floor(k.value + 0.5 + 1e-12); return step.mul(n); };

// ---------------------------------------------------------------- families
const F = {
  verbalTimes(qq) {
    const m = qq.prompt.match(new RegExp(`1 (in|cm) = ${N} (mi|km)\\. .+ is ${N} \\1 on the map\\.`));
    return q(m[2]).mul(q(m[4]));
  },
  verbalMeaning(qq) {
    const p = qq.prompt;
    let m;
    if ((m = p.match(new RegExp(`says 1 (in|cm) = ${N} (mi|km)\\. What does that mean\\?`)))) {
      return qq.choices.map(c => { const mm = c.match(new RegExp(`^Every (in|cm) on the map stands for ${N} (mi|km) on the ground\\.$`)); return !!mm && mm[1] === m[1] && q(mm[2]).eq(q(m[2])) && mm[3] === m[3]; });
    }
    if (/Is the 1-inch line on the paper as long as a mile\?/.test(p)) return qq.choices.map(c => /^No: the 1-inch line stands for a mile of ground\.$/.test(c));
    if ((m = p.match(new RegExp(`A line is ${N} (in|cm) long on a map with 1 \\2 = ${N} (mi|km)\\. Which calculation`)))) {
      return qq.choices.map(c => { const mm = c.match(new RegExp(`^${N} × ${N}$`)); return !!mm && q(mm[1]).mul(q(mm[2])).eq(q(m[1]).mul(q(m[3]))); });
    }
    return null;
  },
  ratioTable(qq) {
    const m = qq.prompt.match(new RegExp(`${N} (in|cm) stand for ${N} (mi|km), and 0 \\2 for 0 \\4\\. What do ${N} \\2 stand for\\?`));
    return q(m[3]).div(q(m[1])).mul(q(m[5]));
  },
  zeroPair(qq) {
    return qq.choices.map(c => {
      const pairs = c.split(/,\s*/).map(s => s.split('→').map(q));
      if (pairs.some(x => x.length !== 2)) return false;
      const z = pairs.find(([a]) => a.n === 0);
      if (z && z[1].n !== 0) return false;
      const k = pairs.find(([a]) => a.n !== 0);
      const r = k[1].div(k[0]);
      return pairs.every(([a, b]) => b.eq(a.mul(r)));
    });
  },
  barCount(qq) {
    const m = qq.prompt.match(new RegExp(`runs from 0 to ${N} (mi|km) in (\\d+) equal blocks\\. .+ covers ${N} blocks?, starting at 0\\.`));
    return q(m[1]).div(Number(m[3])).mul(q(m[4]));
  },
  barExt(qq) {
    const p = picP(qq);
    if (!p || p.a == null || p.b == null) return null;
    return Q(p.b).sub(Q(p.a)).mul(p.step);
  },
  rfUnit(qq) {
    const p = qq.prompt;
    let m;
    if ((m = p.match(/1 (cm|mm|in) on the map stands for [\d,]+ ___ on the ground/))) return qq.choices.map(c => UNITW[c] === m[1]);
    if ((m = p.match(new RegExp(`A line is ${N} (in|cm|mm) on a 1 : [\\d,]+ map\\.`)))) return qq.choices.map(c => UNITW[c] === m[2]);
    return null;
  },
  rfJudge(qq) {
    const n = ratioN(qq.prompt);
    return qq.choices.map(c => {
      let mm;
      if ((mm = c.match(/^No: 1 in on the map is ([\d,]+) in on the ground\.$/))) return q(mm[1]).eq(n) && /can't be measured with an inch ruler|can’t be measured with an inch ruler/.test(qq.prompt);
      if ((mm = c.match(/^No: 1 : ([\d,]+) pairs inches with inches, so 1 in is ([\d,]+) in\.$/))) return q(mm[1]).eq(n) && q(mm[2]).eq(n) && /means 1 in on the map is [\d,]+ (feet|miles|yards)/.test(qq.prompt);
      return false;
    });
  },
  whyMile(qq) {
    const p = qq.prompt;
    let m;
    if ((m = p.match(new RegExp(`at 1 : ([\\d,]+), a lake is ${N} in across\\. What does that stand for\\?`)))) {
      const ground = q(m[2]).mul(q(m[1])); // inches
      return qq.choices.map(c => { const mm = c.match(new RegExp(`^${N} (mi|ft|in)$`)); return !!mm && q(mm[1]).eq(conv(ground, 'in', mm[2])); });
    }
    if (/the same as 1 in = 1 mi\?/.test(p)) return qq.choices.map(c => /^A mile is 5,280 ft × 12 = 63,360 inches\.$/.test(c));
    if (/says 1 in = 1 mi\. Which ratio scale says the same thing\?/.test(p)) return qq.choices.map(c => ratioN(c)?.eq(63360) ?? false);
    if ((m = p.match(/is at 1 : ([\d,]+)\. What does 1 in on it stand for, in feet\?/))) {
      const ft = q(m[1]).div(12);
      return qq.choices.map(c => { const mm = c.match(/^([\d,]+) ft$/); return !!mm && q(mm[1]).eq(ft); });
    }
    return null;
  },
  verbalCalc(qq) {
    const m = qq.prompt.match(new RegExp(`On a map with 1 (in|cm) = ${N} (mi|km), .+ are ${N} \\1 apart\\.`));
    return q(m[2]).mul(q(m[4]));
  },
  verbalMixed(qq) {
    const m = qq.prompt.match(new RegExp(`On a 1 in = ${N} mi map, .+ measures ${N} in in a straight line\\.`));
    return q(m[1]).mul(q(m[2]));
  },
  decompose(qq) {
    const m = qq.prompt.match(new RegExp(`A line is ${N} (in|cm) on a 1 : ([\\d,]+) map\\.`));
    return q(m[1]).mul(q(m[3]));
  },
  splitPick(qq) {
    const m = qq.prompt.match(new RegExp(`A ${N} (in|cm) line on a 1 : ([\\d,]+) map`));
    const want = q(m[1]).mul(q(m[3]));
    return qq.choices.map(c => {
      let mm;
      if ((mm = c.match(/^([\d.]+) × ([\d,]+) = ([\d.,]+), then × ([\d,]+) = ([\d.,]+)$/))) return q(mm[1]).mul(q(mm[2])).eq(q(mm[3])) && q(mm[2]).mul(q(mm[4])).eq(q(m[3])) && q(mm[3]).mul(q(mm[4])).eq(q(mm[5])) && q(mm[5]).eq(want);
      if ((mm = c.match(/^(\d+) × ([\d,]+) \+ half of ([\d,]+) = ([\d,]+) \+ ([\d,]+) = ([\d,]+)$/))) return q(mm[2]).eq(q(m[3])) && q(mm[3]).eq(q(m[3])) && q(mm[4]).eq(q(mm[1]).mul(q(m[3]))) && q(mm[5]).eq(q(m[3]).div(2)) && q(mm[6]).eq(want) && q(m[1]).eq(q(mm[1]).add(Q(1, 2)));
      return false;
    });
  },
  rfCalc(qq) {
    const m = qq.prompt.match(new RegExp(`A line is ${N} (in|cm|mm) on a 1 : ([\\d,]+) map\\. How long is it on the ground, in (\\w+)\\?`));
    return conv(q(m[1]).mul(q(m[3])), m[2], UNITW[m[4]]);
  },
  metricRoute(qq) {
    const m = qq.prompt.match(new RegExp(`is ${N} (cm|mm) on a 1 : ([\\d,]+) map\\. How long is it on the ground, in (\\w+)\\?`));
    return conv(q(m[1]).mul(q(m[3])), m[2], UNITW[m[4]]);
  },
  measureKm(qq) {
    const p = picP(qq);
    const n = ratioN(qq.prompt);
    if (!p || p.len == null || !n) return null;
    const len = roundTo(Q(p.len), Q(1, 10)); // nearest millimeter, in cm
    const m = qq.prompt.match(/How many (\w+) is it on the ground\?/);
    return conv(len.mul(n), 'cm', UNITW[m[1]]);
  },
  customaryFt(qq) {
    const m = qq.prompt.match(new RegExp(`On a 1 : ([\\d,]+) .*map, .+ are ${N} in apart\\.`));
    return conv(q(m[2]).mul(q(m[1])), 'in', 'ft');
  },
  customaryMi(qq) {
    const m = qq.prompt.match(new RegExp(`On a 1 : ([\\d,]+) map.*?, .+? is ${N} in from`));
    const v = conv(q(m[2]).mul(q(m[1])), 'in', 'mi');
    return /Round to the nearest hundredth/.test(qq.prompt) ? roundTo(v, Q(1, 100)) : v;
  },
  rulerInch(qq) { const p = picP(qq); return p?.len == null ? null : roundTo(Q(p.len), Q(1, 4)); },
  rulerMm(qq) {
    const p = picP(qq);
    if (p?.len == null) return null;
    const cm = roundTo(Q(p.len), Q(1, 10));
    return qq.unit === 'mm' ? cm.mul(10) : cm;
  },
  measureCalc(qq) {
    const p = picP(qq);
    if (p?.len == null) return null;
    const len = roundTo(Q(p.len), Q(1, 4));
    let m;
    if ((m = qq.prompt.match(new RegExp(`scale is 1 in = ${N} (mi|km)\\.`)))) return len.mul(q(m[1]));
    const n = ratioN(qq.prompt);
    return n ? conv(len.mul(n), 'in', UNITW[qq.unit] ?? 'mi') : null;
  },
  mapFromVerbal(qq) {
    const m = qq.prompt.match(new RegExp(`is ${N} (mi|km) from .+\\. How long a line do you draw on a 1 (in|cm) = ${N} \\2 map\\?`));
    return q(m[1]).div(q(m[4]));
  },
  mapFromRf(qq) {
    const m = qq.prompt.match(new RegExp(`is ${N} (km|m|mi|ft) long, straight\\. How long is it on a 1 : ([\\d,]+) map, in (\\w+)\\?`));
    const to = UNITW[m[4]];
    return conv(q(m[1]), m[2], to).div(q(m[3]));
  },
  whichWay(qq) {
    const n = ratioN(qq.prompt);
    const toMap = /To draw it on/.test(qq.prompt), toGround = /To find its real length/.test(qq.prompt);
    return qq.choices.map(c => { const mm = c.match(/^(multiply|divide) by ([\d,]+)$/); return !!mm && q(mm[2]).eq(n) && ((toMap && mm[1] === 'divide') || (toGround && mm[1] === 'multiply')); });
  },
  largerScale(qq) {
    const p = qq.prompt;
    let m;
    if (/Which has the largest scale\?/.test(p)) {
      const ns = [...p.matchAll(/1 : ([\d,]+)/g)].map(x => q(x[1]));
      const best = ns.reduce((a, b) => (b.cmp(a) < 0 ? b : a));
      return qq.choices.map(c => ratioN(c)?.eq(best) ?? false);
    }
    if ((m = p.match(/Map P is 1 : ([\d,]+), map Q is 1 : ([\d,]+), on the same size sheet\./))) {
      const P = q(m[1]), Qn = q(m[2]);
      const larger = P.cmp(Qn) < 0 ? 'P' : 'Q', more = larger === 'P' ? 'Q' : 'P';
      return qq.choices.map(c => { const mm = c.match(/^(P|Q) is the larger scale; (P|Q) covers more ground\.$/); return !!mm && mm[1] === larger && mm[2] === more; });
    }
    return null;
  },
  sameRoad(qq) {
    const m = qq.prompt.match(new RegExp(`is ${N} (in|cm) long on a 1 : ([\\d,]+) map\\. How long is the same road on a 1 : ([\\d,]+) map\\?`));
    return q(m[1]).mul(q(m[3])).div(q(m[4]));
  },
  enlarge(qq) {
    const p = qq.prompt;
    let m;
    if ((m = p.match(/a 1 : ([\d,]+) map copied at (\d+)%, or a map made at 1 : ([\d,]+)\?/))) {
      // a copy keeps the detail of its own map; a map made at a larger scale has more
      const made = q(m[3]), orig = q(m[1]);
      return qq.choices.map(c => (/^The map made at 1 : [\d,]+$/.test(c) ? ratioN(c).eq(made) && made.cmp(orig) < 0 : false));
    }
    if (/Does the copy show trails the original did not\?/.test(p)) return qq.choices.map(c => /^No: the same trails, just drawn bigger\.$/.test(c));
    return null;
  },
  enlargeScale(qq) {
    const m = qq.prompt.match(new RegExp(`A 1 : ([\\d,]+) map is enlarged so every length is ${N} times as long\\.`));
    return q(m[1]).div(q(m[2]));
  },
  rangePossible(qq) {
    const { r, half, u } = reading(qq.prompt);
    return qq.choices.map(c => {
      if (/^Only exactly/.test(c)) return false;
      const mm = c.match(new RegExp(`^${N} (mm|cm|in)$`));
      if (!mm || mm[2] !== u) return false;
      const v = q(mm[1]);
      return v.cmp(r.sub(half)) >= 0 && v.cmp(r.add(half)) < 0;
    });
  },
  rangeEdge(qq) {
    const { r, half } = reading(qq.prompt);
    return /shortest/.test(qq.prompt) ? r.sub(half) : /longest/.test(qq.prompt) ? r.add(half) : null;
  },
  errorScale(qq) {
    const m = qq.prompt.match(new RegExp(`by ${N} (in|cm|mm)\\. On a 1 : ([\\d,]+) map, how big is that slip on the ground, in (\\w+)\\?`));
    return conv(q(m[1]).mul(q(m[3])), m[2], UNITW[m[4]]);
  },
  errorCompare(qq) {
    const m = qq.prompt.match(new RegExp(`misread by ${N} (mm|cm|in) on a 1 : ([\\d,]+) map and on a 1 : ([\\d,]+) map\\.`));
    const s = q(m[1]), a = q(m[3]), b = q(m[4]);
    const ga = conv(s.mul(a), m[2], 'm'), gb = conv(s.mul(b), m[2], 'm');
    return qq.choices.map(c => {
      const mm = c.match(new RegExp(`^On the 1 : ([\\d,]+) map: ${N} m against ${N} m$`));
      if (!mm) return false;
      const n = q(mm[1]), big = n.eq(a) ? ga : n.eq(b) ? gb : null, small = n.eq(a) ? gb : ga;
      return !!big && big.cmp(small) > 0 && q(mm[2]).eq(big) && q(mm[3]).eq(small);
    });
  },
  reportRound(qq) {
    const m = qq.prompt.match(/about ([\d.]+) mi, of ground\)\. The calculator says ([\d.]+) mi\./);
    const err = q(m[1]), calc = q(m[2]);
    // keep only the digits the slip leaves trustworthy: a slip of a few hundredths → tenths
    const step = err.cmp(Q(1, 100)) >= 0 && err.cmp(Q(1, 10)) < 0 ? Q(1, 10) : err.cmp(Q(1, 10)) >= 0 ? Q(1) : Q(1, 100);
    const want = roundTo(calc, step);
    return qq.choices.map(c => { const mm = c.match(/^About ([\d.]+) mi$/); return !!mm && q(mm[1]).eq(want); });
  },
  reportClaim(qq) { return qq.choices.map(c => /^No: the reading slip says nothing about how accurate the map is\.$/.test(c)); },
  chooseScale(qq) {
    const p = qq.prompt;
    const m = p.match(new RegExp(`${N}(?:-mile| miles)`));
    const ground = conv(q(m[1]), 'mi', 'in');
    const side = Q(10);
    const fits = c => { const n = ratioN(c); return !!n && ground.div(n).cmp(side) <= 0; };
    if (/want to see every bend/.test(p)) {
      const ok = qq.choices.filter(fits).map(ratioN);
      const best = ok.reduce((a, b) => (b.cmp(a) < 0 ? b : a), ok[0]);
      return qq.choices.map(c => fits(c) && ratioN(c).eq(best));
    }
    if (/must fit on/.test(p)) return qq.choices.map(c => fits(c) && !/,\s*(it shows the most detail|more detail than)/.test(c) ? true : fits(c) && reasonHolds(c));
    return null;
  },
  fitLength(qq) {
    const m = qq.prompt.match(new RegExp(`a straight ${N}-mile trail on a 1 : ([\\d,]+) map\\?`));
    const v = conv(q(m[1]), 'mi', 'in').div(q(m[2]));
    return /Round to the nearest hundredth/.test(qq.prompt) ? roundTo(v, Q(1, 100)) : v;
  },
};
/** a reading "49 mm, to the nearest millimeter" → { r, half, u } */
function reading(p) {
  const m = p.match(new RegExp(`measures ${N} (mm|cm|in)(?: on the map)?, to the nearest (millimeter|tenth of a centimeter|quarter inch|half inch|centimeter|eighth inch)`));
  const step = { millimeter: Q(1), 'tenth of a centimeter': Q(1, 10), 'quarter inch': Q(1, 4), 'half inch': Q(1, 2), centimeter: Q(1), 'eighth inch': Q(1, 8) }[m[3]];
  const unitStep = m[3] === 'millimeter' && m[2] === 'cm' ? Q(1, 10) : step;
  return { r: q(m[1]), half: unitStep.div(2), u: m[2] };
}
/** "1 : 250,000, more detail than 1 : 1,000,000" → the comparison is true */
function reasonHolds(c) {
  const ns = [...c.matchAll(/1 : ([\d,]+)/g)].map(x => q(x[1]));
  if (/more detail than/.test(c) && ns.length === 2) return ns[0].cmp(ns[1]) < 0;
  return false;
}

// ---------------------------------------------------------------- the world
function worldProblems(qq, r) {
  const probs = [];
  const p = qq.prompt, pic = picP(qq);
  let m;
  if (pic && pic.len != null) {
    if (pic.start != null && pic.total != null && pic.start + pic.len > pic.total + 1e-9) probs.push('the line runs off the end of the ruler');
    if ((m = p.match(/it starts at the (\d+)(?: cm)? mark/)) && pic.start !== Number(m[1])) probs.push(`the prompt says the line starts at ${m[1]}, the drawing at ${pic.start}`);
    if (!/starts at/.test(p) && pic.start !== 0 && pic.start != null) probs.push(`the line starts at ${pic.start} but the prompt does not say so`);
    // a reading "to the nearest quarter inch / millimeter" that sits halfway between two marks
    const step = /quarter inch/.test(p) ? 0.25 : /millimeter/.test(p) ? 0.1 : null;
    if (step) { const k = pic.len / step; if (Math.abs(k - Math.floor(k) - 0.5) < 1e-6) probs.push('the line ends exactly halfway between two marks'); }
  }
  if (qq.family === 'barExt' && pic) {
    if ((m = p.match(/right end sits on the (\d+) mark/)) && Number(m[1]) !== pic.b) probs.push(`the right end is drawn at ${pic.b}, the prompt says ${m[1]}`);
    if ((m = p.match(/split into (\d+) equal pieces/)) && Number(m[1]) !== pic.ext) probs.push('the left part is split differently in the drawing');
  }
  if (qq.family === 'barCount' && pic) {
    const mm = p.match(new RegExp(`runs from 0 to ${N} (mi|km) in (\\d+) equal blocks\\. .+ covers ${N} blocks?`));
    if (mm && (pic.n !== Number(mm[3]) || !Q(pic.step).mul(pic.n).eq(q(mm[1])) || pic.b !== q(mm[4]).mul(pic.step).value)) probs.push('the drawn bar or line does not match the prompt');
  }
  if (qq.family === 'reportRound' && (m = p.match(/measures (.+?) in on a 1 : ([\d,]+) map, give or take ([\d.]+) in \(that is ([\d,]+) ft, about ([\d.]+) mi, of ground\)\. The calculator says ([\d.]+) mi\./))) {
    const ft = conv(q(m[3]).mul(q(m[2])), 'in', 'ft');
    if (!ft.eq(q(m[4]))) probs.push(`${m[3]} in at 1 : ${m[2]} is ${ft.value} ft, not ${m[4]}`);
    const mi = conv(q(m[1]).mul(q(m[2])), 'in', 'mi');
    if (Math.abs(mi.value - Number(m[6])) > 1e-6) probs.push(`the calculator value ${m[6]} is not ${m[1]} in at the scale`);
  }
  return probs;
}

// ---------------------------------------------------------------- contract
const pick = arr => { const hits = arr.map((ok, i) => (ok ? i : -1)).filter(i => i >= 0); return hits.length ? hits[0] : -1; };
function runF(qq) { const f = F[qq.family]; return f ? f(qq) : undefined; }
export default {
  solve(qq) {
    let r;
    try { r = runF(qq); } catch { return undefined; }
    if (r == null) return undefined;
    if (qq.input === 'choice') return Array.isArray(r) ? pick(r) : undefined;
    if (qq.input === 'frac') return r.pair;
    return r.value;
  },
  sane(qq) {
    let r;
    try { r = runF(qq); } catch (e) { return `could not read the item (${e.message})`; }
    const probs = [];
    if (qq.input === 'choice' && Array.isArray(r)) {
      const n = r.filter(Boolean).length;
      if (n === 0) probs.push('no choice is right');
      if (n > 1) probs.push(`${n} choices are right: ${qq.choices.filter((_, i) => r[i]).join(' | ')}`);
    }
    if (qq.input === 'num' && r && typeof r === 'object' && 'd' in r) {
      let d = r.d; for (const f of [2, 5]) while (d % f === 0) d /= f;
      if (d !== 1) probs.push(`the answer ${r} has no exact decimal and no rounding is asked`);
    }
    try { probs.push(...worldProblems(qq, r)); } catch (e) { probs.push(`could not check the picture (${e.message})`); }
    return probs.join('; ');
  },
};
