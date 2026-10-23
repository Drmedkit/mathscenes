// reading-maps oracle (role O, docs/lessons/QUALITY_LAYER.md). Works every practice item out from what the student
// sees: the prompt, the board, the choices and the map as drawn: place points and roads (map coordinates are in the
// map unit, in or cm), the scale bar (n intervals, each `len` map units long, labelled every `step` real units), the
// verbal scale, the key, and the overlays shown before answering (id "a": a ring, a ruler, copies, a leg label).
// Overlays the page only shows in the solve (ids s0, s1, … and a ruler's answer mark) are never used.
// Distances are measured on the drawing (along the road part by part, or straight), then scaled.
import { Q } from '../../tools/quality/oracle-kit.mjs';

const UNI = { '½': '1/2', '¼': '1/4', '¾': '3/4', '⅛': '1/8' };
const uni = s => String(s).replace(/(\d)([½¼¾⅛])/g, (_, d, c) => `${d} ${UNI[c]}`).replace(/[½¼¾⅛]/g, c => UNI[c]);
/** '2 1/2' '3/4' '35' '0.05' → number */
function val(t) {
  const s = uni(String(t)).trim().replace(/[−–]/g, '-').replace(/,/g, '');
  let m = s.match(/^(-?\d+) (\d+)\/(\d+)$/);
  if (m) return Number(m[1]) + Number(m[2]) / Number(m[3]);
  m = s.match(/^(-?\d+)\/(\d+)$/);
  if (m) return Number(m[1]) / Number(m[2]);
  return Number(s);
}
const N = '(\\d+ \\d+\\/\\d+|\\d+\\/\\d+|\\d+(?:\\.\\d+)?)';
const close = (a, b, e = 1e-6) => Math.abs(a - b) < e;
/** a float that is a clean fraction (sixteenths, tenths …) → exact Q */
function snap(v) {
  for (const d of [1, 2, 3, 4, 5, 8, 10, 16, 20, 100]) { const n = Math.round(v * d); if (close(n / d, v, 1e-6)) return Q(n, d); }
  return null;
}
const out = v => { const q = snap(v); return q ? q.value : Number(v.toFixed(6)); };

// ---------------------------------------------------------------- the map
const mapOf = q => q.data?.picture?.map;
const shown = q => (mapOf(q)?.ov ?? []).filter(o => o.id === 'a');
const D = (p, r) => Math.hypot(p[0] - r[0], p[1] - r[1]);
const polyLen = pts => pts.slice(1).reduce((s, p, i) => s + D(pts[i], p), 0);
const place = (q, name) => mapOf(q).places.find(p => p.name === name);
/** the road (polyline) that joins two places, end to end */
function roadBetween(q, a, b) {
  const A = place(q, a)?.at, B = place(q, b)?.at;
  if (!A || !B) return null;
  for (const r of mapOf(q).roads) {
    const s = r.pts[0], e = r.pts[r.pts.length - 1];
    if ((close(D(s, A), 0, 1e-6) && close(D(e, B), 0, 1e-6)) || (close(D(s, B), 0, 1e-6) && close(D(e, A), 0, 1e-6))) return r;
  }
  return null;
}
/** real units per map unit, from the verbal scale or the bar */
function perUnit(q) {
  const m = mapOf(q);
  if (m?.verbal) return m.verbal.per;
  if (m?.bar) return m.bar.step / m.bar.len;
  return null;
}
/** the two places a prompt names: "from X to Y", "X to Y is", "X and Y" */
function twoPlaces(q) {
  const names = (mapOf(q)?.places ?? []).map(p => p.name).sort((x, y) => y.length - x.length);
  const p = q.prompt;
  for (const [pre, mid] of [['from ', ' to '], ['between ', ' and '], ['are ', ' and '], ['', ' to '], ['', ' and ']]) {
    for (const a of names) {
      let i = p.indexOf(pre + a + mid);
      while (i >= 0) {
        const rest = p.slice(i + pre.length + a.length + mid.length);
        const b = names.find(n => n !== a && rest.startsWith(n) && !/^[A-Za-z]/.test(rest.slice(n.length)));
        if (b) return [a, b];
        i = p.indexOf(pre + a + mid, i + 1);
      }
    }
  }
  return null;
}
const KIND_WORD = { town: 'Town', city: 'City', camp: 'Camp', school: 'School', tower: 'Lookout' };
const ROAD_WORD = { highway: 'Highway', road: 'Road', trail: 'Trail' };

// ---------------------------------------------------------------- families
const F = {
  keyLookup(q) {
    const p = q.prompt, m0 = mapOf(q);
    let m;
    if ((m = p.match(/^Which place on this map is an? (\w+)\?/))) {
      const kinds = Object.entries(KIND_WORD).filter(([, w]) => w.toLowerCase() === m[1]).map(([k]) => k);
      return q.choices.map(c => kinds.includes(place(q, c)?.kind));
    }
    const ring = shown(q).find(o => o.k === 'ring');
    if (/ringed line/.test(p) && ring?.t?.pt) {
      const pt = ring.t.pt;
      const on = m0.roads.find(r => r.pts.slice(1).some((b, i) => { const a = r.pts[i]; return close(D(a, pt) + D(pt, b), D(a, b), 1e-6); }));
      return on ? q.choices.map(c => c === ROAD_WORD[on.kind]) : null;
    }
    if (/ringed symbol/.test(p) && ring?.t?.place) {
      const pl = m0.places.find(x => x.id === ring.t.place);
      return pl ? q.choices.map(c => c === KIND_WORD[pl.kind]) : null;
    }
    return null;
  },
  symbolSize(q) {
    if (/Which of these is drawn to scale/.test(q.prompt)) return q.choices.map(c => /^The outline of the (lake|forest|park)$/.test(c));
    return q.choices.map(c => /^The map does not say: the dot only marks where .+ is$/.test(c));
  },
  measurePoint(q) {
    const m = q.prompt.match(/edge of the (.+?) dot and reads about .+ at the edge of the (.+?) dot\./);
    const d = D(place(q, m[1]).at, place(q, m[2]).at);
    return q.choices.map(c => { const mm = c.match(new RegExp(`^About ${N} in: from the center of one dot to the center of the other$`)); return !!mm && close(val(mm[1]), d, 1e-3); });
  },
  sameEverywhere(q) {
    const m = q.prompt.match(new RegExp(`is ${N} inch(?:es)? long, and it is ${N} (miles|kilometers)\\. The road from .+? is ${N} inch(?:es)?\\.`));
    return (val(m[2]) / val(m[1])) * val(m[4]);
  },
  biggerMap(q) {
    const m = q.prompt.match(new RegExp(`On the small map, .+? is ${N} in, which is ${N} mi\\.`));
    const real = val(m[2]);
    return q.choices.map(c => { const mm = c.match(new RegExp(`^${N} miles: the real places did not move$`)); return !!mm && close(val(mm[1]), real); });
  },
  barInterval(q) {
    const m = q.prompt.match(new RegExp(`has (\\d+) equal intervals, from 0 to ${N} (mi|km)\\.`));
    if (m) return val(m[2]) / Number(m[1]);
    return mapOf(q)?.bar?.step ?? null;
  },
  barPoint(q) {
    const ring = shown(q).find(o => o.k === 'ring' && o.t?.mark != null);
    const bar = mapOf(q).bar;
    return ring ? ring.t.mark * bar.step : null;
  },
  whichDistance(q) {
    const p = q.prompt;
    if (/flies straight|as the crow flies|straight line/.test(p)) return q.choices.map(c => c === 'The straight dashed line');
    const m = p.match(/(?:drives|bikes|hikes|walks|rides|runs) from .+ on the (road|trail|highway)\./);
    if (m) return q.choices.map(c => c === `Along the ${m[1]}, part by part`);
    return null;
  },
  compareDist(q) {
    const [a, b] = twoPlaces(q) ?? [];
    const r = roadBetween(q, a, b);
    if (!r) return null;
    const road = polyLen(r.pts), line = D(place(q, a).at, place(q, b).at);
    const want = close(road, line, 1e-6) ? 'They are the same' : road > line ? 'The road is longer' : 'The straight line is longer';
    return q.choices.map(c => c === want);
  },
  layBar: q => alongRoad(q),
  countIntervals: q => alongRoad(q),
  halfBar: q => alongRoad(q),
  routeBar: q => alongRoad(q),
  leftSub(q) {
    const strip = shown(q).find(o => o.k === 'strip');
    const bar = mapOf(q).bar;
    return strip ? (strip.to - strip.from) * bar.step : null;
  },
  rulerRead: q => mapDist(q),
  shiftedRuler: q => mapDist(q),
  roundRuler(q) { const d = mapDist(q); return d == null ? null : Math.round(d * 4 + 1e-9) / 4; },
  roundCm(q) { const d = mapDist(q); return d == null ? null : Math.round(d * 2 + 1e-9) / 2; },
  unitScale(q) {
    const m = q.prompt.match(new RegExp(`1 (inch|centimeter) represents ${N} (miles|kilometers)\\.`));
    const d = mapDist(q);
    return d == null ? null : d * val(m[2]);
  },
  unitPick(q) {
    const m = q.prompt.match(new RegExp(`1 (inch|centimeter) represents ${N} (miles|kilometers)\\. .+ is ${N} (in|cm) on the map\\.`));
    const v = val(m[2]) * val(m[4]);
    return q.choices.map(c => { const mm = c.match(new RegExp(`^${N} (\\w+)$`)); return !!mm && close(val(mm[1]), v) && mm[2] === m[3]; });
  },
  barToUnit(q) {
    const bar = mapOf(q).bar;
    // the ruler under the bar shows its length: n intervals of `len` map units, labelled n × step real units
    return bar.step / bar.len;
  },
  halfSections(q) {
    const m = q.prompt.match(new RegExp(`Each section is ${N} (inch|centimeter) long .+ and represents ${N} (miles?|kilometers?)\\.`));
    return val(m[3]) / val(m[1]);
  },
  fracScale(q) {
    const m = q.prompt.match(new RegExp(`1 (inch|centimeter) represents ${N} (miles|kilometers)\\. .+ is ${N} (in|cm)\\.`));
    return val(m[2]) * val(m[4]);
  },
  roundFirst(q) {
    const m = q.prompt.match(new RegExp(`The road is ${N} in on a map where 1 inch represents ${N} miles\\. .+ gets ${N} miles\\. Max gets ${N} miles\\.`));
    const exact = val(m[1]) * val(m[2]);
    return q.choices.map(c => /^Max: keep the exact .+ until the end$/.test(c) && close(val(m[4]), exact));
  },
  estimateRange(q) {
    const [a, b] = twoPlaces(q) ?? [];
    const r = roadBetween(q, a, b);
    if (!r) return null;
    const v = polyLen(r.pts) * perUnit(q);
    return q.choices.map(c => { const mm = c.match(new RegExp(`^Between ${N} and ${N} (miles|kilometers)$`)); return !!mm && val(mm[1]) <= v + 1e-9 && v <= val(mm[2]) + 1e-9; });
  },
  benchmarkName(q) {
    const [a, b] = twoPlaces(q) ?? [];
    const r = roadBetween(q, a, b);
    if (!r) return null;
    const bar = mapOf(q).bar, k = polyLen(r.pts) / bar.len, real = k * bar.step;
    return q.choices.map(c => { const mm = c.match(new RegExp(`^About ${N} intervals of ${N} (mi|km), so about ${N} (mi|km)$`)); return !!mm && Math.abs(val(mm[1]) - k) <= 0.5 && close(val(mm[2]), bar.step) && close(val(mm[4]), val(mm[1]) * bar.step) && Math.abs(val(mm[4]) - real) <= bar.step / 2 + 1e-9; });
  },
  routeSum(q) { const v = alongRoad(q); return v; },
  pickEvidence(q) {
    if (/straight-line distance/.test(q.prompt)) return q.choices.map(c => /(“|")as the crow flies(”|") distance from|flight app’?'?s straight-line distance from/.test(c));
    if (/distance by road/.test(q.prompt)) return q.choices.map(c => /^The trip meter on a drive from .+ along this road$/.test(c));
    return null;
  },
  plausible(q) {
    const m = q.prompt.match(new RegExp(`works out the distance on this map and gets ${N} miles?\\.`));
    const said = val(m[1]);
    const route = shown(q).find(o => o.k === 'route');
    if (!route) return null;
    const truth = polyLen(route.pts) * perUnit(q);
    const ok = Math.abs(said - truth) <= 0.05 * truth;
    return q.choices.map(c => {
      if (/^Yes: \S+ miles? fits /.test(c)) return ok && close(val(c.match(/^Yes: (\S+)/)[1]), said);
      if (/^No: \S+ miles is far too far for .+\. Check the scale\.$/.test(c)) return !ok && said > truth;
      return false; // "a map can show any distance", "the multiplication was done right", "you can't check", "it should be …"
    });
  },
  whichReasonable(q) {
    const m = q.prompt.match(new RegExp(`A city block is about ${N} mile\\. The walk .+ is about ${N} blocks\\.`));
    const v = val(m[1]) * val(m[2]);
    return q.choices.map(c => { const mm = c.match(new RegExp(`^${N} miles?$`)); return !!mm && close(val(mm[1]), v); });
  },
  errorSize(q) {
    const m = q.prompt.match(new RegExp(`could be off by ${N} inch\\. On this map 1 inch represents ${N} miles\\.`));
    return val(m[1]) * val(m[2]);
  },
  whichMapWorse(q) {
    const m = q.prompt.match(new RegExp(`slip by ${N} inch\\. On Map A 1 inch represents ${N} miles?; on Map B it represents ${N} miles?\\.`));
    const s = val(m[1]), a = s * val(m[2]), b = s * val(m[3]);
    return q.choices.map(c => {
      const mm = c.match(new RegExp(`^Map (A|B): there ${N} inch stands for ${N} miles?, on Map (A|B) only ${N} miles?$`));
      if (!mm) return false;
      const [big, small] = mm[1] === 'A' ? [a, b] : [b, a];
      return big > small && close(val(mm[3]), big) && close(val(mm[5]), small) && close(val(mm[2]), s);
    });
  },
  agree(q) {
    const m = q.prompt.match(new RegExp(`The map gives ${N} miles; the (?:road sign|trip meter|GPS) says ${N} miles?\\. Do they agree within ${N} miles?\\?`));
    const gap = Math.abs(val(m[1]) - val(m[2])), tol = val(m[3]);
    const within = gap <= tol + 1e-9;
    return q.choices.map(c => (/^Yes: they are within .+ of each other$/.test(c) ? within : /^No: the gap is more than /.test(c) ? !within : false));
  },
  gapRead(q) {
    const m = q.prompt.match(new RegExp(`The map gives ${N} miles; the (?:road sign|trip meter|GPS) says ${N} miles?\\.`));
    return Math.abs(val(m[1]) - val(m[2]));
  },
  findError(q) { return diagnose(q).map(Boolean); },
  fixIt(q) {
    const m = q.prompt.match(/distance from (.+?) to (.+?) is on the board/);
    const r = roadBetween(q, m[1], m[2]);
    return r ? polyLen(r.pts) * perUnit(q) : null;
  },
};
/** map distance between the two named places (straight, as a ruler measures it) */
function mapDist(q) {
  const pl = twoPlaces(q);
  if (!pl) return null;
  return D(place(q, pl[0]).at, place(q, pl[1]).at);
}
/** real length along the road between the two named places */
function alongRoad(q) {
  const pl = twoPlaces(q);
  if (!pl) return null;
  const r = roadBetween(q, pl[0], pl[1]);
  return r ? polyLen(r.pts) * perUnit(q) : null;
}

/** Sam's work on the board, checked against the map: which cause explains the difference (per choice) */
function diagnose(q) {
  const m = q.prompt.match(/distance from (.+?) to (.+?) \(his work/);
  const [a, b] = [m[1], m[2]];
  const r = roadBetween(q, a, b);
  const per = perUnit(q), bar = mapOf(q).bar;
  const truth = r ? polyLen(r.pts) * per : NaN;
  const board = uni(String(q.board).replace(/\\tfrac\{(\d+)\}\{(\d+)\}/g, ' $1/$2').replace(/\\times/g, '×').replace(/\\text\{\s*([^{}]*)\}/g, ' $1').replace(/[{}]/g, '')).replace(/\s+/g, ' ').trim();
  const n = t => val(t.trim());
  let w;
  const facts = {};
  if ((w = board.match(/^to (.+?): (.+) in$/))) facts.wrongPlace = w[1] !== b && w[1] !== a;
  else if ((w = board.match(/^ruler: (.+) in$/))) { const ru = shown(q).find(o => o.k === 'ruler'); facts.ruler = !!ru && ru.start !== 0 && close(n(w[1]) - ru.start, polyLen(r.pts), 1e-3); }
  else if ((w = board.match(/^\((.+)\) × (\S+) = (\S+) (mi|in)$/))) {
    const parts = w[1].split('+').map(n), sum = parts.reduce((s, x) => s + x, 0);
    facts.leftOut = r && r.pts.length - 1 > parts.length && sum < polyLen(r.pts) - 1e-6 && close(n(w[2]), per);
    facts.ok = r && close(sum * n(w[2]), truth) && w[4] === 'mi';
  } else if ((w = board.match(/^(\S+(?: \S+\/\S+)?) × (\S+) = (\S+) (mi|in)$/))) {
    const L = n(w[1]), k = n(w[2]);
    const Lok = r && close(L, polyLen(r.pts), 1e-3);
    facts.unit = Lok && close(k, per) && w[4] === 'in';
    facts.bar10 = Lok && !!bar && close(k, bar.step * 10);
    facts.ok = Lok && close(k, per) && w[4] === 'mi';
  } else if ((w = board.match(/^(\S+) \+ (\S+) = (\S+) mi$/))) {
    facts.added = r && close(n(w[1]), polyLen(r.pts), 1e-3) && close(n(w[2]), per);
  }
  const sign = (q.prompt.match(new RegExp(`The road sign says ${N} mi\\.`)) ?? [])[1];
  const signClose = sign != null && Math.abs(val(sign) - truth) <= 0.5 + 1e-9;
  return q.choices.map(c => {
    if (/^Sam wrote inches, the map unit, instead of miles$/.test(c)) return !!facts.unit;
    if (/^Sam left out one part of the road$/.test(c)) return !!facts.leftOut;
    if (/^Sam added the scale instead of multiplying$/.test(c)) return !!facts.added;
    if (/^Sam read the bar wrong: each interval is (\d+) miles, not (\d+)$/.test(c)) { const mm = c.match(/is (\d+) miles, not (\d+)$/); return !!facts.bar10 && !!bar && close(+mm[1], bar.step); }
    if (/^Sam measured to the wrong place$/.test(c)) return !!facts.wrongPlace;
    if (/^Sam used the end reading, but the ruler did not start at 0$/.test(c)) return !!facts.ruler;
    if (/^No mistake shows: the work checks out\./.test(c)) return !!facts.ok && signClose;
    return false; // "Change the answer to the sign's number"
  });
}

// ---------------------------------------------------------------- the world
function worldProblems(q, r) {
  const probs = [];
  const m0 = mapOf(q), p = q.prompt;
  let m;
  // labelled legs must be the drawn lengths
  for (const o of shown(q)) {
    if (o.k === 'leg' && o.text) {
      const t = uni(o.text).match(/^(.+?) (in|cm)$/);
      if (t && !close(val(t[1]), D(o.a, o.b), 1e-3)) probs.push(`the leg labelled ${o.text} is drawn ${D(o.a, o.b).toFixed(2)} long`);
    }
  }
  if ((m = p.match(new RegExp(`(?:is|are) ${N} (in|cm) on the map`))) || (m = p.match(new RegExp(`The road is ${N} in on a map`)))) {
    const pl = twoPlaces(q), route = pl && roadBetween(q, pl[0], pl[1]);
    if (route && !close(val(m[1]), polyLen(route.pts), 1e-3) && !close(val(m[1]), D(place(q, pl[0]).at, place(q, pl[1]).at), 1e-3)) probs.push(`the prompt says ${m[1]} ${m[2] ?? 'in'}, the map shows ${polyLen(route.pts).toFixed(2)}`);
  }
  if (q.family === 'roundRuler' || q.family === 'roundCm') {
    const d = mapDist(q), k = q.family === 'roundRuler' ? 4 : 2;
    if (d != null && close(d * k - Math.floor(d * k), 0.5, 1e-6)) probs.push('the place sits exactly halfway between two marks');
  }
  if (q.family === 'estimateRange' && Array.isArray(r)) {
    const pl = twoPlaces(q), route = pl && roadBetween(q, pl[0], pl[1]);
    if (route) { const v = polyLen(route.pts) * perUnit(q); if (q.choices.some(c => { const mm = c.match(new RegExp(`^Between ${N} and ${N}`)); return mm && (close(v, val(mm[1])) || close(v, val(mm[2]))); })) probs.push(`the distance ${out(v)} is the edge of a range`); }
  }
  if (q.family === 'plausible') {
    const said = val((p.match(new RegExp(`gets ${N} miles?\\.`)) ?? [])[1]);
    if (/drives to the next town/.test(p) && said < 1) probs.push('a drive to the next town under a mile');
    if (/walks from home to the park/.test(p) && Array.isArray(r) && r.some((x, i) => x && /^Yes/.test(q.choices[i])) && said > 3) probs.push(`a ${said} mile walk to the park called fitting`);
    if (/bikes to school/.test(p) && Array.isArray(r) && r.some((x, i) => x && /^Yes/.test(q.choices[i])) && said > 8) probs.push(`a ${said} mile bike ride to school called fitting`);
    if (/hikes to the lookout/.test(p) && Array.isArray(r) && r.some((x, i) => x && /^Yes/.test(q.choices[i])) && said > 15) probs.push(`a ${said} mile hike called fitting`);
  }
  if (q.family === 'findError') {
    const sign = (p.match(new RegExp(`The road sign says ${N} mi\\.`)) ?? [])[1];
    const mm = p.match(/distance from (.+?) to (.+?) \(his work/);
    const route = mm && roadBetween(q, mm[1], mm[2]);
    if (route && sign != null) { const truth = polyLen(route.pts) * perUnit(q); if (Math.abs(val(sign) - truth) > 0.5 + 1e-9) probs.push(`the sign says ${sign} mi but the map gives ${out(truth)} mi`); }
  }
  if (m0?.places) {
    const names = m0.places.map(x => x.name);
    if (new Set(names).size !== names.length) probs.push('two places share a name');
  }
  return probs;
}

// ---------------------------------------------------------------- contract
const pick = arr => { const hits = arr.map((ok, i) => (ok ? i : -1)).filter(i => i >= 0); return hits.length ? hits[0] : -1; };
function runF(q) { const f = F[q.family]; return f ? f(q) : undefined; }
export default {
  solve(q) {
    let r;
    try { r = runF(q); } catch { return undefined; }
    if (r == null || (typeof r === 'number' && !Number.isFinite(r))) return undefined;
    if (q.input === 'choice') return Array.isArray(r) ? pick(r) : undefined;
    if (q.input === 'frac') { const s = snap(r); return s ? s.pair : r; }
    return out(r);
  },
  sane(q) {
    let r;
    try { r = runF(q); } catch (e) { return `could not read the item (${e.message})`; }
    const probs = [];
    if (q.input === 'choice' && Array.isArray(r)) {
      const n = r.filter(Boolean).length;
      if (n === 0) probs.push('no choice is right');
      if (n > 1) probs.push(`${n} choices are right: ${q.choices.filter((_, i) => r[i]).join(' | ')}`);
    }
    if (q.input !== 'choice' && typeof r === 'number' && !snap(r)) probs.push(`the answer ${r} is not a clean number`);
    try { probs.push(...worldProblems(q, r)); } catch (e) { probs.push(`could not check the map (${e.message})`); }
    return probs.join('; ');
  },
};
