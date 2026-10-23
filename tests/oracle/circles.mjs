// Oracle for the lesson "circles" (area and circumference of circles, 7.G.B.4). Written from what the student sees
// only: the prompt, the board, the choices and the drawn picture (segment endpoints worked out from the drawing's
// angles / fractions, never from a segment's `kind` name as a claim). See docs/lessons/QUALITY_LAYER.md, "O: the oracle".
import { nums, Q, round, choiceWhere } from '../../tools/quality/oracle-kit.mjs';

const PI = Math.PI;
const EPS = 1e-6;

// ---------------------------------------------------------------- reading values
/** '11/2' → 5.5, '2 1/2' → 2.5, '1.5' → 1.5, '' → NaN */
function val(s) {
  const t = String(s ?? '').trim().replace(/−/g, '-');
  let m = t.match(/^(-?\d+)\s+(\d+)\/(\d+)$/);
  if (m) return Number(m[1]) + Number(m[2]) / Number(m[3]);
  m = t.match(/^(-?\d+)\/(\d+)$/);
  if (m) return Number(m[1]) / Number(m[2]);
  return t === '' ? NaN : Number(t);
}
/** exact Q of a value string ('11/2', '1.5', '3') */
const qv = s => Q(String(s).trim());
const NUM = '(\\d+\\s\\d+\\/\\d+|\\d+\\/\\d+|\\d*\\.?\\d+)';
/** clean a float result (no 59.660000000001) */
const clean = v => Number(Number(v).toFixed(9));
/** a number with up to 9 decimals, as a frac answer when it is a clean fraction (5/2), else the number */
const ans = v => clean(v);

/** the circle a story describes: { r, d, unit, obj } (r and d as numbers, rq the exact radius) */
function story(p) {
  let m;
  if ((m = p.match(new RegExp(NUM + '-inch pizza')))) return mk(qv(m[1]).div(2), 'in', 'pizza');
  if ((m = p.match(new RegExp('(?:^|\\.\\s|\\b)(?:A|a|of a|Think of a) ([a-z ]+?) (?:is |that waters a circle )?' + NUM + ' (in|ft|cm|m) across')))) return mk(qv(m[2]).div(2), m[3], m[1]);
  if ((m = p.match(new RegExp('(?:A|a) ([a-z ]+?) with a radius of ' + NUM + ' (in|ft|cm|m)\\b')))) return mk(qv(m[2]), m[3], m[1]);
  if ((m = p.match(new RegExp('sprinkler that reaches ' + NUM + ' (in|ft|cm|m) in every direction')))) return mk(qv(m[1]), m[2], 'sprinkler');
  if ((m = p.match(new RegExp('circle has a radius of ' + NUM + ' (in|ft|cm|m)\\b')))) return mk(qv(m[1]), m[2], 'circle');
  return null;
}
function mk(rq, unit, obj) { return { rq, r: rq.value, d: 2 * rq.value, unit, obj: obj.replace(/^(round|circular)\s+/, '').trim() }; }

/** the question asked in a story: 'C' (a length around) or 'A' (an area inside) */
function measureOf(question) {
  const s = String(question);
  if (/\bHow (long|many feet)\b/i.test(s)) return 'C';
  if (/\bHow much\b/i.test(s)) return 'A';
  return null;
}

// ---------------------------------------------------------------- plausibility of the objects (diameter ranges)
// A careful teacher's sense of what each object can measure (diameter, in the story's unit).
const SIZES = {
  'pizza|in': [4, 30], 'jar lid|cm': [2, 20], 'lid|cm': [2, 20], 'tabletop|ft': [1.5, 12], 'rug|ft': [2, 20],
  'pool|ft': [3, 50], 'flower bed|ft': [1.5, 40], 'field|m': [5, 400], 'sprinkler|ft': [4, 120],
  'tree trunk|in': [2, 200], 'cake|in': [4, 20], 'drum|in': [4, 40], 'coin|in': [0.5, 2], 'coin|cm': [1, 5],
  'plate|in': [5, 16], 'plate|cm': [10, 40], 'can|in': [1.5, 8], 'can|cm': [4, 20],
};
function sizeProblem(obj, unit, d) {
  const key = `${obj}|${unit}`;
  const rng = SIZES[key];
  if (!rng || !Number.isFinite(d)) return '';
  if (d < rng[0] || d > rng[1]) return `a ${obj} ${clean(d)} ${unit} across is not a real ${obj} (expected about ${rng[0]}–${rng[1]} ${unit})`;
  return '';
}

/** "to the nearest tenth" of an irrational value that is (numerically) a tie */
const isTie = (v, places) => { const x = Math.abs(v) * 10 ** places; return Math.abs(x - Math.floor(x) - 0.5) < 1e-6; };

// ---------------------------------------------------------------- picture geometry (unit circle, center 0)
const dir = a => [Math.cos((a * PI) / 180), Math.sin((a * PI) / 180)];
const sc = (k, p) => [k * p[0], k * p[1]];
/** the two drawn endpoints of a segment, as the drawing places them */
function ends(s) {
  switch (s.kind) {
    case 'radius': return [[0, 0], dir(s.a)];
    case 'diameter': return [dir(s.a + 180), dir(s.a)];
    case 'chord': return [dir(s.a), dir(s.b)];
    case 'stub': return [[0, 0], sc(s.f, dir(s.a))];
    case 'off': return [dir(s.a), sc(s.f, dir(s.b))];
    default: return null;
  }
}
const len = p => Math.hypot(p[0], p[1]);
const onRim = p => Math.abs(len(p) - 1) < 1e-6;
const atCenter = p => len(p) < 1e-6;
/** distance from the center to the segment */
function centerDist([p, q]) {
  const dx = q[0] - p[0], dy = q[1] - p[1], L2 = dx * dx + dy * dy;
  let t = L2 ? -(p[0] * dx + p[1] * dy) / L2 : 0;
  t = Math.max(0, Math.min(1, t));
  return Math.hypot(p[0] + t * dx, p[1] + t * dy);
}
function geo(s) {
  const e = ends(s);
  if (!e) return null;
  const [p, q] = e;
  const radius = (atCenter(p) && onRim(q)) || (atCenter(q) && onRim(p));
  const bothRim = onRim(p) && onRim(q);
  const through = centerDist(e) < 1e-6;
  return { radius, diameter: bothRim && through, bothRim, through, cd: centerDist(e), e };
}
const tagLetter = s => (String(s.tag ?? '').match(/\\text\{([A-Z])\}/) ?? [])[1];

// ---------------------------------------------------------------- small expression evaluator (½ × 2πr × r ...)
function evalExpr(str, R) {
  let s = String(str).replace(/½/g, '(1/2)').replace(/π/g, '(P)').replace(/\br\b|r/g, '(R)').replace(/×/g, '*').replace(/·/g, '*').replace(/\s+/g, '');
  s = s.replace(/\)\(/g, ')*(').replace(/(\d)\(/g, '$1*(').replace(/\)(\d)/g, ')*$1');
  if (!/^[0-9.()+*\/PR-]+$/.test(s)) return NaN;
  try { return Function('P', 'R', `return (${s});`)(PI, R); } catch { return NaN; }
}

// ---------------------------------------------------------------- table in the prompt (propCheck)
function tableOf(q) {
  const h = String(q.promptHtml ?? '');
  const rows = {};
  for (const m of h.matchAll(/<tr><th[^>]*>([^<]*)<\/th>(.*?)<\/tr>/g)) {
    rows[m[1].trim()] = [...m[2].matchAll(/<td>([^<]*)<\/td>/g)].map(c => {
      const t = c[1].trim();
      if (/π$/.test(t)) { const k = t.replace(/π$/, ''); return k === '' ? 1 : val(k); }
      return val(t);
    });
  }
  return rows;
}
const constRatio = (ys, xs) => ys.length > 1 && ys.every((y, i) => Math.abs(y / xs[i] - ys[0] / xs[0]) < 1e-9);

// =====================================================================================================
const solvers = {
  // ------------------------------------------------------------ radius / diameter in a picture
  whichSeg(q) {
    const segs = q.data?.pict?.pic?.segs ?? [];
    const p = q.prompt;
    if (q.input === 'num') {
      // "Segment A is a radius of this circle, 15 in long. Segment B is also a radius. How long is B?"
      const m = p.match(new RegExp('is a radius of this circle, ' + NUM + ' '));
      return m ? val(m[1]) : undefined;
    }
    const G = segs.map(s => ({ s, g: geo(s), L: tagLetter(s) }));
    if (/How many of these segments are radii/.test(p)) {
      const n = G.filter(x => x.g?.radius).length;
      return choiceWhere(q, c => val(c) === n);
    }
    if (/Which segment is a (radius|diameter)/.test(p)) {
      const want = /radius/.test(p.match(/Which segment is a (radius|diameter)/)[1]) ? 'radius' : 'diameter';
      return choiceWhere(q, c => { const L = (c.match(/Segment ([A-Z])/) ?? [])[1]; const x = G.find(y => y.L === L); return !!x?.g?.[want]; });
    }
    let m;
    if ((m = p.match(/Is segment ([A-Z]) a diameter/))) {
      const x = G.find(y => y.L === m[1]);
      if (!x?.g) return undefined;
      const g = x.g;
      return choiceWhere(q, c => {
        if (/^Yes/.test(c)) {
          if (!g.diameter) return false;
          if (/both of its ends are on the circle/.test(c) && !/center/.test(c)) return g.bothRim; // true but thin reason
          return true;
        }
        if (g.diameter) return false;
        if (/does not pass through the center/.test(c)) return !g.through;
        if (/ends are not on the circle/.test(c)) return !g.bothRim;
        if (/must go straight across/.test(c)) return false; // a tilted diameter is still a diameter: no such rule
        return false;
      });
    }
    return undefined;
  },

  // ------------------------------------------------------------ r ↔ d
  convertRD(q) {
    const s = story(q.prompt);
    if (!s) return undefined;
    if (/What is its radius\?/.test(q.prompt)) return ans(s.r);
    if (/What is its diameter\?/.test(q.prompt)) return ans(s.d);
    return undefined;
  },

  // ------------------------------------------------------------ what the circumference is
  aroundAcross(q) {
    const p = q.prompt;
    if (/What does the lit part show\?/.test(p)) {
      const rest = q.data?.pict?.rest ?? [];
      const segs = q.data?.pict?.pic?.segs ?? [];
      const extra = rest.slice(1).filter((k, i, a) => !(k === 'segs' && i === 0 && a.length > 1 && segs.length === 0) && k !== 'in');
      let lit = null;
      if (rest.includes('C')) lit = 'circumference';
      else if (rest.includes('A')) lit = 'area';
      else if (segs.length === 1 && extra.includes('segs')) { const g = geo(segs[0]); lit = g?.diameter ? 'diameter' : g?.radius ? 'radius' : null; }
      if (!lit) return undefined;
      return choiceWhere(q, c => c.replace(/^its\s+/, '').trim() === lit);
    }
    if (/wrap a string once around the edge/.test(p)) return choiceWhere(q, c => /circumference/.test(c));
    let m;
    if ((m = p.match(new RegExp('is ' + NUM + ' (in|ft|cm|m) across\\. About how long is a string')))) {
      const C = PI * val(m[1]);
      return choiceWhere(q, c => {
        if (/\bsq\b/.test(c)) return false;
        const v = nums(c)[0];
        if (/a bit more than/.test(c)) return v < C && C <= 1.1 * v;
        return Math.abs(v - C) < 0.005 * C;
      });
    }
    return undefined;
  },

  // ------------------------------------------------------------ length or area, and its unit
  lengthOrArea(q) {
    const p = q.prompt;
    const quoted = (p.match(/“([^”]*)”/) ?? [])[1];
    const meas = measureOf(quoted);
    const s = story(p);
    if (!meas || !s) return undefined;
    const u = s.unit;
    if (/Which unit goes with/.test(p)) return choiceWhere(q, c => c.trim() === (meas === 'C' ? u : `sq ${u}`));
    if (/Which measure answers it\?/.test(p)) {
      const want = meas === 'C' ? `the circumference, in ${u}` : `the area, in sq ${u}`;
      return choiceWhere(q, c => c.trim() === want);
    }
    return undefined;
  },

  // ------------------------------------------------------------ between 2r² and 4r²
  gridBound(q) {
    const p = q.prompt;
    const r = val((p.match(/r = (\d+(?:\.\d+)?)/) ?? p.match(/radius (\d+(?:\.\d+)?)/) ?? [])[1]);
    if (!Number.isFinite(r)) return undefined;
    if (/dashed square around it/.test(p)) return (2 * r) ** 2;
    if (/blue square inside the circle/.test(p)) return 2 * r * r;
    if (/About how big is its area\?/.test(p)) {
      const A = PI * r * r;
      const vs = (q.choices ?? []).map(c => nums(c)[0]);
      const ok = vs.map(v => v > 2 * r * r && v < 4 * r * r);
      const best = Math.min(...vs.map((v, i) => (ok[i] ? Math.abs(v - A) : Infinity)));
      return choiceWhere(q, (c, i) => ok[i] && Math.abs(vs[i] - A) === best);
    }
    return undefined;
  },

  // ------------------------------------------------------------ π = C ÷ d
  piRatio(q) {
    const p = q.prompt;
    let m;
    if ((m = p.match(new RegExp('diameter ' + NUM + ' (?:in|cm|ft|m), circumference ' + NUM)))) {
      return round(val(m[2]) / val(m[1]), 2);
    }
    if (/Which sentence about π is true\?/.test(p)) {
      return choiceWhere(q, c => {
        if (/exactly 3\.14/.test(c)) return false;
        if (/bigger for a bigger circle/.test(c)) return false;
        if (/is a length/.test(c)) return false;
        if (/a bit more than 3\.14/.test(c) && /never end/.test(c)) return true;
        return false;
      });
    }
    if (/between which two numbers is π/.test(p)) {
      return choiceWhere(q, c => { const [a, b] = nums(c); return a < PI && PI < b && !/at most/.test(c); });
    }
    if (/For the plate, C ÷ d is/.test(p)) {
      return choiceWhere(q, c => {
        const v = nums(c)[0];
        if (/\d\s*(in|cm|ft|m)\b/.test(c)) return false; // π has no unit
        if (/exactly/.test(c)) return false; // a measurement is never exact; π is not 3.14
        if (/bigger π/.test(c)) return false;
        return Math.abs(v - PI) < 0.01;
      });
    }
    return undefined;
  },

  // ------------------------------------------------------------ C = πd
  cFromD(q) {
    const s = story(q.prompt);
    if (!s) return undefined;
    if (/exact answer in terms of π/.test(q.prompt)) return q.input === 'frac' ? s.rq.mul(2).pair : ans(s.d);
    if (/π key/.test(q.prompt)) return round(PI * s.d, 1);
    return undefined;
  },
  // ------------------------------------------------------------ C = 2πr
  cFromR(q) {
    const s = story(q.prompt);
    if (!s) return undefined;
    if (/in terms of π/.test(q.prompt)) return q.input === 'frac' ? s.rq.mul(2).pair : ans(2 * s.r);
    if (/π key/.test(q.prompt)) return round(2 * PI * s.r, 1);
    return undefined;
  },
  // ------------------------------------------------------------ A = πr²
  aFromR(q) {
    const s = story(q.prompt);
    if (!s) return undefined;
    if (/in terms of π/.test(q.prompt)) return q.input === 'frac' ? s.rq.mul(s.rq).pair : ans(s.r * s.r);
    if (/π key/.test(q.prompt)) return round(PI * s.r * s.r, 1);
    return undefined;
  },
  aFromD(q) {
    const s = story(q.prompt);
    if (!s) return undefined;
    if (/in terms of π/.test(q.prompt)) return q.input === 'frac' ? s.rq.mul(s.rq).pair : ans(s.r * s.r);
    if (/π key/.test(q.prompt)) return round(PI * s.r * s.r, 1);
    return undefined;
  },

  // ------------------------------------------------------------ exact or about
  approx(q) {
    const p = q.prompt;
    let m;
    if ((m = p.match(new RegExp('exact (?:circumference|area) is ' + NUM + 'π .*Use π ≈ 3\\.14')))) return clean((val(m[1]) * 314) / 100);
    if ((m = p.match(new RegExp('exact (?:circumference|area) is ' + NUM + 'π .*π key and round to the nearest tenth')))) return round(val(m[1]) * PI, 1);
    if ((m = p.match(new RegExp('circle is ' + NUM + ' (?:in|ft|cm|m) across\\. Use π ≈ 22/7')))) return ans((val(m[1]) * 22) / 7);
    if ((m = p.match(new RegExp('area of a circle with r = ' + NUM + ' (?:in|ft|cm|m) and must round to the nearest whole number')))) {
      const A = round(PI * val(m[1]) ** 2, 0);
      return choiceWhere(q, c => !/first/.test(c) && /round at the end/.test(c) && nums(c).at(-1) === A);
    }
    if ((m = p.match(new RegExp('writes: “' + NUM + 'π = ' + NUM + '”')))) {
      const n = val(m[1]);
      return choiceWhere(q, c => {
        if (/already right/.test(c)) return false; // nπ is never exactly a terminating decimal
        const mm = c.match(new RegExp('^' + NUM + 'π\\s*(=|≈)\\s*' + NUM + '$'));
        if (!mm) return false;
        const v = val(mm[3]);
        if (mm[2] === '=') return false;
        return Math.abs(v - n * PI) <= 0.01 * n * PI;
      });
    }
    return undefined;
  },

  // ------------------------------------------------------------ around or inside, then compute
  chooseMeasure(q) {
    const p = q.prompt;
    const s = story(p);
    const meas = measureOf((p.match(/How [^?]*\?/) ?? [])[0]);
    if (!s || !meas) return undefined;
    const coef = meas === 'C' ? s.rq.mul(2) : s.rq.mul(s.rq);
    if (/in terms of π/.test(p)) return q.input === 'frac' ? coef.pair : ans(coef.value);
    if (/Use π ≈ 3\.14/.test(p)) return clean((coef.value * 314) / 100);
    if (/π key/.test(p)) return round(coef.value * PI, 1);
    return undefined;
  },

  // ------------------------------------------------------------ wedges in a row
  wedgeRead(q) {
    const p = q.prompt;
    let m;
    if ((m = p.match(new RegExp('circle with r = ' + NUM + ' (?:in|ft|cm|m) is cut into')))) return ans(val(m[1])); // top = πr → coefficient r
    if (/arcs along the top together are how long/.test(p) || /All the arcs along the top/.test(p)) {
      const R = 1.37;
      return choiceWhere(q, c => Math.abs(evalExpr(c.split(':').at(-1), R) - PI * R) < 1e-9);
    }
    if (/exactly a rectangle\?/.test(p)) return choiceWhere(q, c => /^No\b/.test(c) && /bumpy/.test(c));
    if (/Compare the area of the new shape with the area of the circle/.test(p)) return choiceWhere(q, c => /^exactly the same/.test(c));
    return undefined;
  },

  // ------------------------------------------------------------ why A = πr²
  deriveArea(q) {
    const p = q.prompt;
    let m;
    if ((m = p.match(new RegExp('circle with r = ' + NUM + ' (?:in|ft|cm|m) make a shape about ' + NUM + 'π long and ' + NUM + ' tall')))) {
      return ans(val(m[2]) * val(m[3]));
    }
    if (/Is that a proof\?/.test(p)) return choiceWhere(q, c => /^No\b/.test(c) && /examples/.test(c));
    if (/Fill the gap: A = ½C × r = ▢ = πr²/.test(p)) {
      // the step that writes ½C × r with C = 2πr (the literal substitution) and is worth πr²
      const R = 1.37;
      return choiceWhere(q, c => Math.abs(evalExpr(c, R) - PI * R * R) < 1e-9 && /½/.test(c) && /2πr/.test(c));
    }
    return undefined;
  },

  // ------------------------------------------------------------ scaling
  scaleC(q) {
    const p = q.prompt;
    let m;
    if ((m = p.match(new RegExp('radius goes from ' + NUM + ' (?:in|ft|cm|m) to ' + NUM + ' ')))) return ans(2 * val(m[2]));
    if ((m = p.match(new RegExp('Every radius of a circle is multiplied by ' + NUM + '\\. Its circumference')))) return ans(val(m[1]));
    return undefined;
  },
  scaleA(q) {
    const p = q.prompt;
    let m;
    if ((m = p.match(new RegExp('radius goes from ' + NUM + ' (?:in|ft|cm|m) to ' + NUM + ' ')))) return ans(val(m[2]) ** 2);
    if ((m = p.match(new RegExp('Every radius of a circle is multiplied by ' + NUM + '\\. Its area')))) return ans(val(m[1]) ** 2);
    return undefined;
  },
  scaleFrac(q) {
    const p = q.prompt;
    const m = p.match(new RegExp('radius is multiplied by ' + NUM));
    if (!m) return undefined;
    const k = qv(m[1]);
    if (/Its area is multiplied by what number/.test(p)) return k.mul(k).pair;
    if (/What happens to its circumference C and its area A/.test(p)) {
      return choiceWhere(q, c => {
        const mm = c.match(new RegExp('C × ' + NUM + ', A × ' + NUM));
        return !!mm && qv(mm[1]).eq(k) && qv(mm[2]).eq(k.mul(k));
      });
    }
    return undefined;
  },

  // ------------------------------------------------------------ C ∝ r, A is not
  propCheck(q) {
    const p = q.prompt;
    if (/Which of these pairs is proportional\?/.test(p)) {
      // a length that goes around (perimeter, circumference) or across is proportional to a length; an area is not
      const kind = w => (/area/.test(w) ? 'area' : /perimeter|circumference|side|radius|diameter/.test(w) ? 'length' : null);
      return choiceWhere(q, c => { const mm = c.match(/^the (.+?) of a (?:square|circle) and its (\w+)$/); return !!mm && kind(mm[1]) === 'length' && kind(mm[2]) === 'length'; });
    }
    const T = tableOf(q);
    const r = T.r, C = T.C, A = T.A;
    if (!r || !C || !A) return undefined;
    const cProp = constRatio(C, r), aProp = constRatio(A, r);
    if (/C ÷ r is the same in every row\. What is it/.test(p)) return cProp ? ans(C[0] / r[0]) : undefined;
    if (/Which one is proportional to the radius r\?/.test(p)) {
      const want = cProp && aProp ? 'both' : cProp ? 'C only' : aProp ? 'A only' : 'neither';
      return choiceWhere(q, c => (want === 'both' ? /^C and A/.test(c) : c.trim() === want));
    }
    if (/So the area A is…/.test(p)) {
      return choiceWhere(q, c => (aProp ? /^proportional to r/.test(c) && /constant|same/.test(c) : /^not proportional to r/.test(c) && /changing/.test(c)));
    }
    return undefined;
  },

  // ------------------------------------------------------------ judge a claim
  claimJudge(q) {
    const p = q.prompt;
    let m;
    if ((m = p.match(new RegExp('How many ' + NUM + '-inch pizzas have as much pizza \\(area\\) as one ' + NUM + '-inch pizza')))) {
      return ans((val(m[2]) / val(m[1])) ** 2);
    }
    const rad = p.match(new RegExp('radius ' + NUM + ' (?:in|ft|cm|m) and ' + NUM + ' (?:in|ft|cm|m)'));
    const claim = (p.match(/“([^”]*)”/) ?? [])[1];
    if (!rad || !claim) return undefined;
    const r1 = qv(rad[1]), r2 = qv(rad[2]);
    const big = r1.cmp(r2) >= 0 ? r1 : r2, small = r1.cmp(r2) >= 0 ? r2 : r1;
    const k = /The big one/.test(claim) ? big.div(small) : /The small one/.test(claim) ? small.div(big) : null;
    if (!k) return undefined;
    const fs = [...claim.matchAll(new RegExp(NUM + ' times the (\\w+)', 'g'))].map(x => ({ f: qv(x[1]), w: x[2] }));
    if (fs.length !== 3) return undefined;
    const LEN = /^(trim|edging|rope|binding|crust|fence|fencing|seal|border|ribbon|lace)$/;
    const AREA = /^(cloth|mulch|cover|fabric|cheese|paint|turf|sod|grass|tarp)$/;
    const kindOf = (w, i) => (LEN.test(w) ? 'L' : AREA.test(w) ? 'A' : i === 1 ? 'L' : 'A');
    const claimed = {};
    fs.slice(1).forEach((x, i) => { claimed[kindOf(x.w, i + 1)] = x.f; });
    const truth = { L: k, A: k.mul(k) };
    const wordKind = w => kindOf(w, fs.slice(1).findIndex(x => x.w === w) + 1);
    return choiceWhere(q, c => {
      let L, A, mm;
      if (/^Right about both/.test(c)) { L = claimed.L; A = claimed.A; }
      else if ((mm = c.match(new RegExp('^Right about the (\\w+); the (\\w+) is × ' + NUM)))) {
        const v = qv(mm[3]); const got = { ...claimed }; got[wordKind(mm[2])] = v; L = got.L; A = got.A;
        if (wordKind(mm[1]) === wordKind(mm[2])) return false;
      } else if ((mm = c.match(new RegExp('^Both are × ' + NUM)))) { L = A = qv(mm[1]); }
      else if ((mm = c.match(new RegExp('^The (\\w+) is × ' + NUM + ', the (\\w+) × ' + NUM)))) {
        const got = {}; got[wordKind(mm[1])] = qv(mm[2]); got[wordKind(mm[3])] = qv(mm[4]); L = got.L; A = got.A;
      } else return false;
      return !!L && !!A && L.eq(truth.L) && A.eq(truth.A);
    });
  },

  // ------------------------------------------------------------ area factor back to the radius factor
  areaBack(q) {
    const m = q.prompt.match(new RegExp('has ' + NUM + ' times the area of a (?:smaller|bigger) one'));
    if (!m) return undefined;
    const f = qv(m[1]);
    const rn = Math.round(Math.sqrt(f.n)), rd = Math.round(Math.sqrt(f.d));
    if (rn * rn !== f.n || rd * rd !== f.d) return Math.sqrt(f.value);
    return q.input === 'frac' ? Q(rn, rd).pair : rn / rd;
  },

  // ------------------------------------------------------------ from C back to d or r
  reverseC(q) {
    const p = q.prompt;
    const want = (p.match(/(?:find its|What is its) (diameter|radius)/) ?? [])[1];
    if (!want) return undefined;
    const div = want === 'radius' ? 2 : 1;
    let m;
    if ((m = p.match(new RegExp('circumference is ' + NUM + 'π ')))) return ans(val(m[1]) / div);
    if ((m = p.match(new RegExp('circumference is ' + NUM + ' (?:in|ft|cm|m)\\. Use π ≈ 3\\.14')))) return clean((val(m[1]) * 100) / 314 / div);
    if ((m = p.match(new RegExp('circumference is ' + NUM + ' (?:in|ft|cm|m)\\. Use the π key')))) return round(val(m[1]) / PI / div, 1);
    return undefined;
  },
  // ------------------------------------------------------------ from A back to r
  reverseA(q) {
    const p = q.prompt;
    let m;
    if ((m = p.match(new RegExp("area is " + NUM + 'π ')))) return clean(Math.sqrt(val(m[1])));
    if ((m = p.match(new RegExp("area is " + NUM + ' sq (?:in|ft|cm|m) \\(use π ≈ 3\\.14\\)')))) return clean(Math.sqrt((val(m[1]) * 100) / 314));
    return undefined;
  },
};

// =====================================================================================================
function solve(q) {
  const f = solvers[q.family];
  return f ? f(q) : undefined;
}

/** what is impossible or unfair in this item's world ('' when nothing) */
function sane(q) {
  const p = q.prompt;
  const out = [];
  const s = story(p);
  if (s) {
    if (!(s.r > 0)) out.push('a radius of 0 or less');
    const sp = sizeProblem(s.obj, s.unit, s.d);
    if (sp) out.push(sp);
  }
  let m;
  // two objects with radii (claim stories)
  if ((m = p.match(new RegExp('has two ([a-z ]+?): radius ' + NUM + ' (in|ft|cm|m) and ' + NUM)))) {
    const obj = m[1].replace(/^(round|circular)\s+/, '').replace(/s$/, '').replace(/tabletop$/, 'tabletop');
    for (const r of [val(m[2]), val(m[4])]) { const sp = sizeProblem(obj === 'pizza' ? 'pizza' : obj, m[3], 2 * r); if (sp) out.push(sp); }
  }
  if ((m = p.match(new RegExp('coin is ' + NUM + ' (in|cm) across and a plate is ' + NUM + ' (in|cm) across')))) {
    const a = sizeProblem('coin', m[2], val(m[1])), b = sizeProblem('plate', m[4], val(m[3]));
    if (a) out.push(a); if (b) out.push(b);
    if ((m = p.match(/For the coin, C ÷ d is about (\d+(?:\.\d+)?)/)) && Math.abs(val(m[1]) - PI) > 0.01) out.push('the coin\'s C ÷ d is not about π');
  }
  if ((m = p.match(new RegExp('measures a can: diameter ' + NUM + ' (in|cm), circumference ' + NUM)))) {
    const d = val(m[1]), C = val(m[3]);
    const sp = sizeProblem('can', m[2], d); if (sp) out.push(sp);
    if (Math.abs(C / d - PI) > 0.15) out.push(`a measured C ÷ d of ${clean(C / d)} is far from π`);
    if (isTie(C / d, 2)) out.push('C ÷ d is a tie at the hundredths');
  }
  if ((m = p.match(new RegExp('How many ' + NUM + '-inch pizzas have as much pizza \\(area\\) as one ' + NUM + '-inch pizza')))) {
    for (const d of [val(m[1]), val(m[2])]) { const sp = sizeProblem('pizza', 'in', d); if (sp) out.push(sp); }
    const n = (val(m[2]) / val(m[1])) ** 2;
    if (Math.abs(n - Math.round(n)) > 1e-9) out.push('the number of small pizzas is not a whole number');
  }

  // rounding with the π key: no ties
  const sol = solve(q);
  if (/nearest tenth/.test(p) && typeof sol === 'number') {
    // recompute the unrounded value for a tie check
    let raw = null;
    const fam = q.family;
    if (s && /π key/.test(p)) {
      const meas = fam === 'cFromR' || fam === 'cFromD' ? 'C' : fam === 'aFromR' || fam === 'aFromD' ? 'A' : measureOf((p.match(/How [^?]*\?/) ?? [])[0]);
      raw = meas === 'C' ? 2 * PI * s.r : PI * s.r * s.r;
    } else if ((m = p.match(new RegExp('exact (?:circumference|area) is ' + NUM + 'π')))) raw = val(m[1]) * PI;
    else if ((m = p.match(new RegExp('circumference is ' + NUM + ' (?:in|ft|cm|m)\\. Use the π key to find its (diameter|radius)')))) raw = val(m[1]) / PI / (m[2] === 'radius' ? 2 : 1);
    if (raw !== null && isTie(raw, 1)) out.push(`the exact value ${raw} is a tie at the tenths`);
  }

  // answers that should be clean for a no-calculator item
  if (/no calculator/.test(p) && q.input === 'num' && typeof sol === 'number' && Math.abs(sol * 1e4 - Math.round(sol * 1e4)) > 1e-6) {
    out.push(`a no-calculator answer that does not terminate (${sol})`);
  }
  if (q.family === 'approx' && /Use π ≈ 22\/7/.test(p) && typeof sol === 'number' && !Number.isInteger(clean(sol))) out.push('22/7 × d is not a whole number');
  if (q.family === 'reverseA' && typeof sol === 'number' && Math.abs(sol * 100 - Math.round(sol * 100)) > 1e-6) out.push('the radius is not a clean number');
  if (q.family === 'areaBack' && Array.isArray(sol) === false && typeof sol === 'number' && !Number.isInteger(sol)) out.push('the area factor is not a perfect square');

  // story numbers that must agree with each other
  if (q.family === 'lengthOrArea' && /The answer to/.test(p) && s) {
    const quoted = (p.match(/“([^”]*)”/) ?? [])[1];
    const given = (p.match(/” is (\d+(?:\.\d+)?)/) ?? [])[1];
    const meas = measureOf(quoted);
    if (given && meas) {
      const v = meas === 'C' ? 2 * PI * s.r : PI * s.r * s.r;
      if (Math.abs(val(given) - v) > 0.06 * Math.max(1, v) && Math.abs(val(given) - (meas === 'C' ? 6.28 * s.r : 3.14 * s.r * s.r)) > 0.06) out.push(`the answer ${given} does not fit the ${meas === 'C' ? 'circumference' : 'area'}`);
    }
  }
  if (q.family === 'deriveArea' && (m = p.match(new RegExp('circle with r = ' + NUM + ' (?:in|ft|cm|m) make a shape about ' + NUM + 'π long and ' + NUM + ' tall')))) {
    if (val(m[2]) !== val(m[1]) || val(m[3]) !== val(m[1])) out.push('the shape is not πr long and r tall');
  }
  if (q.family === 'deriveArea' && (m = p.match(/measured (\d+) round lids/)) && (q.choices ?? []).some(c => /three checks/.test(c)) && val(m[1]) !== 3) out.push('the choices say three checks, the story another number');
  if ((q.family === 'scaleC' || q.family === 'scaleA') && (m = p.match(new RegExp('radius goes from ' + NUM + ' (?:in|ft|cm|m) to ' + NUM + ' (?:in|ft|cm|m)\\. Its (circumference|area) was ' + '(' + NUM + ')?π')))) {
    const r1 = val(m[1]), was = m[4] === undefined ? 1 : val(m[4]);
    const want = m[3] === 'circumference' ? 2 * r1 : r1 * r1;
    if (Math.abs(was - want) > 1e-9) out.push(`the old ${m[3]} ${was}π does not fit r = ${r1}`);
  }
  if (q.family === 'claimJudge' && (m = p.match(new RegExp('radius ' + NUM + ' (?:in|ft|cm|m) and ' + NUM)))) {
    const claim = (p.match(/“([^”]*)”/) ?? [])[1] ?? '';
    const c0 = claim.match(new RegExp(NUM + ' times the radius'));
    if (c0) {
      const a = val(m[1]), b = val(m[2]);
      const k = /The big one/.test(claim) ? Math.max(a, b) / Math.min(a, b) : Math.min(a, b) / Math.max(a, b);
      if (Math.abs(val(c0[1]) - k) > 1e-9) out.push('the claimed radius factor does not fit the radii');
    }
  }
  if (q.family === 'areaBack' && (m = p.match(new RegExp('has ' + NUM + ' times the area of a (smaller|bigger) one')))) {
    const f = val(m[1]);
    if ((m[2] === 'smaller' && !(f > 1)) || (m[2] === 'bigger' && !(f < 1))) out.push(`"has ${m[1]} times the area of a ${m[2]} one": the factor says the other one is not ${m[2]}`);
    if (/\(it is the smaller one\)/.test(p) && m[2] === 'smaller') out.push('"(it is the smaller one)" contradicts "of a smaller one"');
  }
  if (q.family === 'whichSeg') {
    const segs = q.data?.pict?.pic?.segs ?? [];
    for (const sg of segs) {
      const g = geo(sg);
      if (g && g.bothRim && !g.through && g.cd < 0.08) out.push(`segment ${tagLetter(sg) ?? '?'} passes within ${g.cd.toFixed(3)} r of the center: it looks like a diameter`);
      if (g && !g.radius && !g.bothRim && g.through && sg.kind === 'stub' && sg.f > 0.9) out.push('a stub that nearly reaches the rim looks like a radius');
    }
    if ((m = p.match(/Segment ([A-Z]) is a radius of this circle.*Segment ([A-Z]) is also a radius/))) {
      for (const L of [m[1], m[2]]) { const x = segs.find(sg => tagLetter(sg) === L || String(sg.tag ?? '').startsWith(`\\text{${L}}`)); if (x && !geo(x)?.radius) out.push(`segment ${L} is not drawn as a radius`); }
    }
  }
  if (sol === -1) out.push('no single right choice');
  return [...new Set(out)].join('; ');
}

export default { solve, sane };
