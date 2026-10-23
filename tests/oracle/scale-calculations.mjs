// scale-calculations oracle (role O, docs/lessons/QUALITY_LAYER.md). Works every practice item out from what the
// student sees: the scale and the lengths in the prompt (and the board), the choices, and for the ruler items the
// object drawn on the half-inch ruler (picture.lines.p.obj.len, the drawn length). The '?' value the picture holds
// (ask.v) is the answer side and is never read. Lengths are exact fractions in a base unit per system (inches for
// in/ft/yd, millimeters for mm/cm/m), so "800 cm" and "8 m" are the same length. Every choice is judged by the maths
// of its own claim (its numbers, its comparison, its verdict).
import { Q, texPlain } from '../../tools/quality/oracle-kit.mjs';

// ---------------------------------------------------------------- units and numbers
const BASE = { in: 1, ft: 12, yd: 36, mm: 1, cm: 10, m: 1000 };
const SYS = { in: 'us', ft: 'us', yd: 'us', mm: 'si', cm: 'si', m: 'si' };
function unitOf(w) {
  const s = String(w).toLowerCase();
  if (/^(mm|millimeters?)$/.test(s)) return 'mm';
  if (/^(cm|centimeters?)$/.test(s)) return 'cm';
  if (/^(m|meters?)$/.test(s)) return 'm';
  if (/^(in|inch|inches)$/.test(s)) return 'in';
  if (/^(ft|foot|feet)$/.test(s)) return 'ft';
  if (/^(yd|yards?)$/.test(s)) return 'yd';
  return null;
}
const NUM = '(\\d+(?:,\\d{3})*(?:\\.\\d+)?(?:\\s+\\d+\\/\\d+)?|\\d+\\/\\d+|\\.\\d+)';
const UW = '(mm|cm|m|in|ft|yd|millimeters?|centimeters?|meters?|inch(?:es)?|feet|foot|yards?)';
/** "1,800" / "3 1/4" / "1/4" / "6.1" → Q */
function num(t) {
  const s = String(t).replace(/,/g, '').replace(/[−–]/g, '-').trim();
  let m = s.match(/^(-?)(\d+)\s+(\d+)\/(\d+)$/);
  if (m) { const f = Q(Number(m[3]), Number(m[4])).add(Number(m[2])); return m[1] ? f.neg() : f; }
  m = s.match(/^(-?\d+)\/(\d+)$/);
  if (m) return Q(Number(m[1]), Number(m[2]));
  m = s.match(/^(-?)(\d*)(?:\.(\d+))?$/);
  if (!m || (m[2] === '' && !m[3])) throw new Error(`not a number: ${t}`);
  const d = m[3] ? 10 ** m[3].length : 1, n = Number((m[2] || '0') + (m[3] || ''));
  return Q(m[1] ? -n : n, d);
}
const clean = s => String(s ?? '').replace(/[−–]/g, '-').replace(/[’‘]/g, "'").replace(/[“”]/g, '"').replace(/\s+/g, ' ').trim();
/** every length "number unit" in a text, in order (a hyphen as in "3-ft counter" allowed) */
function lengthsIn(text) {
  const re = new RegExp(`(?<![\\w.\\/])${NUM}\\s*-?\\s*${UW}(?![\\w])`, 'g');
  return [...String(text).matchAll(re)].map(m => ({ v: num(m[1]), u: unitOf(m[2]), at: m.index, raw: m[0] }));
}
const baseOf = L => L.v.mul(BASE[L.u]);
/** two lengths (in base units of one system) are the same length */
const sameLen = (a, b) => a.sys === b.sys && a.b.eq(b.b);
const L = (v, u) => ({ b: Q(0).add(v).mul(BASE[u]), sys: SYS[u] });

// ---------------------------------------------------------------- the scale
/** the scale drawing : actual in a text → { d, du, a, au, raw } (du = au = null for a scale with no units) */
function parseScale(text) {
  const t = clean(text);
  let m;
  if ((m = t.match(new RegExp(`${NUM}\\s*${UW}\\s*(?::|=|stands for)\\s*${NUM}\\s*${UW}(?![\\w])`))))
    return { d: num(m[1]), du: unitOf(m[2]), a: num(m[3]), au: unitOf(m[4]), raw: m[0] };
  if ((m = t.match(new RegExp(`${NUM} ${UW} (?:are|is) shown as ${NUM} ${UW}`))))
    return { d: num(m[3]), du: unitOf(m[4]), a: num(m[1]), au: unitOf(m[2]), raw: m[0] };
  if ((m = t.match(new RegExp(`${NUM} ${UW} of real [\\w ]+? takes? up ${NUM} ${UW} on the plan`))))
    return { d: num(m[3]), du: unitOf(m[4]), a: num(m[1]), au: unitOf(m[2]), raw: m[0] };
  if ((m = t.match(new RegExp(`Each ${NUM} ${UW} on my plan is ${NUM} ${UW}`))))
    return { d: num(m[1]), du: unitOf(m[2]), a: num(m[3]), au: unitOf(m[4]), raw: m[0] };
  if ((m = t.match(/(?<![\w.\/])(\d+(?:\.\d+)?)\s*:\s*(\d+(?:,\d{3})*(?:\.\d+)?)(?![\d.,]*\s*(?:mm|cm|m|in|ft|yd)\b)/)))
    return { d: num(m[1]), du: null, a: num(m[2]), au: null, raw: m[0] };
  return null;
}
/** the real length (base units) of a drawing length; a unitless scale keeps the unit */
function toReal(Lg, sc) {
  if (sc.du) { if (SYS[Lg.u] !== SYS[sc.du]) throw new Error('unit system'); return { b: baseOf(Lg).div(sc.d.mul(BASE[sc.du])).mul(sc.a.mul(BASE[sc.au])), sys: SYS[sc.au] }; }
  return { b: baseOf(Lg).mul(sc.a).div(sc.d), sys: SYS[Lg.u] };
}
function toDrawing(Lg, sc) {
  if (sc.du) { if (SYS[Lg.u] !== SYS[sc.au]) throw new Error('unit system'); return { b: baseOf(Lg).div(sc.a.mul(BASE[sc.au])).mul(sc.d.mul(BASE[sc.du])), sys: SYS[sc.du] }; }
  return { b: baseOf(Lg).mul(sc.d).div(sc.a), sys: SYS[Lg.u] };
}
const inUnit = (x, u) => { if (x.sys !== SYS[u]) throw new Error('unit system'); return x.b.div(BASE[u]); };
const asMeters = x => (x.sys === 'si' ? x.b.value / 1000 : x.b.value * 0.0254);

// ---------------------------------------------------------------- real sizes (meters) for sane()
const SIZES = {
  flea: [0.001, 0.005], ant: [0.001, 0.03], mosquito: [0.002, 0.02], bee: [0.003, 0.04], ladybug: [0.002, 0.012],
  beetle: [0.001, 0.12], 'tree frog': [0.01, 0.15],
  bedroom: [2.4, 8], 'bedroom wall': [2, 9], kitchen: [2, 12], 'living room': [3, 15], classroom: [4, 20], basement: [3, 25],
  garage: [3, 15], shed: [1.5, 10], deck: [1.5, 25], porch: [1.2, 25], patio: [1.5, 15], hallway: [1, 25], wall: [1, 40],
  'side wall': [2, 40], 'front wall': [3, 40], driveway: [3, 60], fence: [1, 400], hedge: [0.5, 150], garden: [1, 150],
  'garden bed': [0.5, 15], path: [1, 300], dock: [2, 150], backyard: [5, 150], playground: [8, 250], pool: [2, 60],
  'skate park': [8, 250], 'parking lot': [10, 400], 'soccer field': [40, 130], 'running track': [50, 500],
  'basketball court': [12, 32], 'garage door': [2, 6], 'kitchen counter': [0.5, 7], counter: [0.5, 7], sofa: [1, 4],
  couch: [1, 4], bathtub: [1.2, 2.2], bed: [1.4, 2.6], bookcase: [0.4, 4], bookshelf: [0.4, 4], desk: [0.6, 2.6],
  table: [0.5, 4], 'kitchen table': [0.8, 3.6], rug: [0.5, 7], piano: [1, 3.2],
  'fire truck': [5, 16], 'school bus': [6, 15], bus: [6, 19], tractor: [1.8, 9], 'pickup truck': [4.3, 7.5], 'race car': [3.5, 6.5],
  jet: [8, 80], locomotive: [8, 35], sailboat: [3, 50], boat: [2, 100], ship: [20, 450], car: [3, 6.5], 'train car': [10, 30],
  bridge: [2, 3000], tower: [5, 900], barn: [6, 70], stage: [3, 40], 'tree house': [1.5, 8], door: [1.8, 2.7],
};
const OBJ_NAMES = Object.keys(SIZES).sort((a, b) => b.length - a.length);
/** the object names in a text (longest first wins, no double count of "wall" inside "bedroom wall") */
function objectsIn(text) {
  let t = ` ${clean(text).toLowerCase()} `;
  const found = [];
  for (const n of OBJ_NAMES) {
    const re = new RegExp(`(?<![\\w-])${n}(?![\\w-])`, 'g');
    let m;
    while ((m = re.exec(t))) { found.push({ n, at: m.index }); t = t.slice(0, m.index) + '#'.repeat(n.length) + t.slice(m.index + n.length); }
  }
  return found.sort((a, b) => a.at - b.at);
}
function sizeProblem(name, x) {
  if (!name || !SIZES[name] || !x) return '';
  const [lo, hi] = SIZES[name], v = asMeters(x);
  if (v < lo / 1.0001 || v > hi * 1.0001) {
    const show = x.sys === 'si' ? (v >= 1 ? `${+v.toFixed(3)} m` : `${+(v * 1000).toFixed(2)} mm`) : `${+(x.b.value / 12).toFixed(3)} ft`;
    return `a real ${name} ${show} long`;
  }
  return '';
}
/** the one object a prompt is about: the one named in the question, else the only one named */
function subjectOf(text) {
  const t = clean(text);
  const qs = t.match(/[^.?!]*\?/g) ?? [];
  for (const s of qs.reverse()) { const o = objectsIn(s); if (o.length) return o[o.length - 1].n; }
  const all = [...new Set(objectsIn(t).map(o => o.n))];
  return all.length === 1 ? all[0] : null;
}

// ---------------------------------------------------------------- arithmetic in choices / boards
/** evaluate "6 × 8 + 1/2 × 8", "6 1/2 ÷ 8", "24 ÷ 12" exactly */
function evalExpr(text) {
  const s = clean(text).replace(/,(?=\d{3})/g, '');
  const toks = [];
  const re = /\s*(\d+\s+\d+\/\d+|\d+\/\d+|\d+(?:\.\d+)?|[-+×÷*/()])/y;
  let i = 0;
  while (i < s.length) {
    if (/\s/.test(s[i])) { i++; continue; }
    re.lastIndex = i; const m = re.exec(s);
    if (!m) throw new Error(`bad expression ${s}`);
    toks.push(m[1].trim()); i = re.lastIndex;
  }
  let p = 0;
  const expr = () => { let v = term(); while (toks[p] === '+' || toks[p] === '-') { const o = toks[p++]; const w = term(); v = o === '+' ? v.add(w) : v.sub(w); } return v; };
  const term = () => { let v = fac(); while (['×', '÷', '*'].includes(toks[p])) { const o = toks[p++]; const w = fac(); if (o === '÷' && w.n === 0) throw new Error('÷0'); v = o === '÷' ? v.div(w) : v.mul(w); } return v; };
  const fac = () => { const t = toks[p++]; if (t === '(') { const v = expr(); p++; return v; } if (t === '-') return fac().neg(); return num(t); };
  const v = expr();
  if (p !== toks.length) throw new Error(`trailing in ${s}`);
  return v;
}
/** "a op b = c" statements in a text → [{ lhs, rhs }] (numbers only) */
function checksIn(text) {
  const out = [];
  for (const m of clean(text).matchAll(/(\d[\d,]*(?:\.\d+)?(?:\s+\d+\/\d+)?|\d+\/\d+)\s*([×÷])\s*(\d[\d,]*(?:\.\d+)?)\s*(=|≈)\s*(\d[\d,]*(?:\.\d+)?)/g))
    out.push({ v: evalExpr(`${m[1]} ${m[2]} ${m[3]}`), c: num(m[5]), approx: m[4] === '≈' });
  return out;
}
const near = (a, b, rel) => Math.abs(a - b) <= rel * Math.max(Math.abs(a), Math.abs(b));
const arithOk = text => checksIn(text).every(k => (k.approx ? near(k.v.value, k.c.value, 0.06) || Math.abs(k.v.value - k.c.value) < 0.0006 : k.v.eq(k.c)));

// ---------------------------------------------------------------- the generic length question
const TO_PLAN = /How long is (?:it|the (?:wall|drawing|model)) on the plan|How long is the (?:drawing|model)\b|how long is its drawing|how long is an? [^?]*? on the plan\?/i;
/** a "how long" question: { sc, given (length), givenSide, want (base length), unit } */
function lengthQuestion(q) {
  const t = clean(q.prompt);
  const sc = parseScale(t) ?? parseScale(texPlain(q.board));
  if (!sc) throw new Error('no scale');
  let rest = t.replace(sc.raw, ' ');
  rest = rest.replace(/she wrote .*?(?=Fix it)/, ' ').replace(/plan → actual is × \d+\.?/, ' ').replace(/\(\d+ \w+ = \d+ \w+\)/g, ' ');
  const toPlan = TO_PLAN.test(t);
  let given;
  const pic = q.data?.picture?.lines?.p;
  if (q.family === 'rulerRead') {
    if (!pic?.obj || pic.rows?.[0]?.unit !== 'in') throw new Error('no ruler object');
    given = { v: Q(pic.obj.len), u: 'in' };
  } else {
    const ls = lengthsIn(rest);
    if (ls.length !== 1) throw new Error(`lengths: ${ls.map(l => l.raw).join(' | ')}`);
    given = ls[0];
  }
  const want = toPlan ? toDrawing(given, sc) : toReal(given, sc);
  const real = toPlan ? L(given.v, given.u) : want;
  return { sc, given, toPlan, want, real, unit: unitOf(q.unit) };
}

// ---------------------------------------------------------------- choice helpers
/** the last length named in a choice, as a base length */
function lastLen(text) { const ls = lengthsIn(clean(text)); return ls.length ? L(ls[ls.length - 1].v, ls[ls.length - 1].u) : null; }
/** "about k times too big/small" / "k times too big" claim → { k, dir } */
function timesClaim(text) {
  const m = clean(text).match(/(\d+(?:\.\d+)?) times too (big|small)/);
  return m ? { k: Number(m[1]), dir: m[2] } : null;
}
/** a claimed value x against the right value r: is "k times too dir" true (within `tol`)? */
function timesTrue(c, x, r, tol = 0) {
  if (!c) return false;
  const ratio = c.dir === 'big' ? x.b.value / r.b.value : r.b.value / x.b.value;
  return (c.dir === 'big' ? x.b.cmp(r.b) > 0 : x.b.cmp(r.b) < 0) && (tol ? near(ratio, c.k, tol) : Math.abs(ratio - c.k) < 1e-9);
}

// ---------------------------------------------------------------- per family
const F = {
  // ---- numeric, one length question ----
  table(q) {
    const t = clean(q.prompt);
    const m = t.match(new RegExp(`An? [\\w ]+? is ${NUM} ${UW} on the plan\\. How long is it actually\\?`));
    const sc = parseScale(t);
    const given = { v: num(m[1]), u: unitOf(m[2]) };
    const want = toReal(given, sc);
    return { sc, given, want, real: want, unit: unitOf(q.unit) };
  },
  toActual: q => lengthQuestion(q),
  unitlessCalc: q => lengthQuestion(q),
  reverse: q => lengthQuestion(q),
  toDrawing: q => lengthQuestion(q),
  normalize(q) {
    const t = clean(q.prompt);
    let m;
    if ((m = t.match(/How many (\w+) does (\S+(?: \d+\/\d+)?) (\w+) on the plan stand for\?/))) {
      const sc = parseScale(t);
      return { sc, want: toReal({ v: num(m[2]), u: unitOf(m[3]) }, sc), unit: unitOf(q.unit), real: null };
    }
    return lengthQuestion(q);
  },
  convertIn: q => lengthQuestion(q),
  convertOut: q => lengthQuestion(q),
  rulerRead: q => lengthQuestion(q),
  fixRev: q => lengthQuestion(q),
  roomCalc(q) {
    const t = clean(q.prompt);
    const m = t.match(new RegExp(`drawn ${NUM} ${UW} by ${NUM} ${UW}`));
    const sc = parseScale(t.replace(m[0], ' '));
    const a = toReal({ v: num(m[1]), u: unitOf(m[2]) }, sc), b = toReal({ v: num(m[3]), u: unitOf(m[4]) }, sc);
    const big = a.b.cmp(b.b) >= 0 ? a : b, small = big === a ? b : a;
    let want;
    if (/all the way around/.test(t)) want = { b: a.b.add(b.b).mul(2), sys: a.sys };
    else if (/How much longer is the real .* than it is wide/.test(t)) want = { b: big.b.sub(small.b), sys: a.sys };
    else throw new Error('roomCalc question');
    return { want, unit: unitOf(q.unit), room: [big, small], sc };
  },
  toUnitless(q) {
    const sc = parseScale(q.prompt);
    if (!sc.du || !sc.d.eq(1)) throw new Error('toUnitless scale');
    const k = sc.a.mul(BASE[sc.au]).div(BASE[sc.du]);
    const m = clean(q.prompt).match(/\((\d+) (\w+) = (\d+) (\w+)\)/);   // the conversion hint must be true
    return { value: k, hintOk: !m || L(num(m[1]), unitOf(m[2])).b.eq(L(num(m[3]), unitOf(m[4])).b) };
  },
  unitsBack(q) {
    const t = clean(q.prompt);
    const sc = parseScale(t);
    const m = t.match(/Write it with units: (\d+) (\w+) stands for how many (\w+)\?/);
    const x = toReal({ v: num(m[1]), u: unitOf(m[2]) }, sc);
    return { want: x, unit: unitOf(m[3]) };
  },
  findScale(q) {
    const t = clean(q.prompt);
    let m;
    if ((m = t.match(new RegExp(`A ${NUM}-(ft|m|in|cm) ([\\w ]+?) is drawn ${NUM} ${UW} long\\. Complete the scale: 1 (\\w+) : \\? (\\w+)\\.`)))) {
      const real = L(num(m[1]), unitOf(m[2])), draw = { v: num(m[4]), u: unitOf(m[5]) };
      return { value: real.b.mul(BASE[unitOf(m[6])]).div(baseOf(draw)).div(BASE[unitOf(m[7])]), obj: m[3].trim(), real };
    }
    if ((m = t.match(new RegExp(`On a house plan, the ([\\w ]+?) is ${NUM} ${UW} long and the ([\\w ]+?) is ${NUM} ${UW}\\. The real ([\\w ]+?) is ${NUM} ${UW}\\. Complete the scale: 1 (\\w+) : \\? (\\w+)\\.`)))) {
      const objs = { [m[1]]: { v: num(m[2]), u: unitOf(m[3]) }, [m[4]]: { v: num(m[5]), u: unitOf(m[6]) } };
      const draw = objs[m[7]];
      if (!draw) throw new Error('no matching plan length');
      const real = L(num(m[8]), unitOf(m[9]));
      const value = real.b.mul(BASE[unitOf(m[10])]).div(baseOf(draw)).div(BASE[unitOf(m[11])]);
      const other = m[4] === m[7] ? m[1] : m[4], od = objs[other];
      return { value, obj: m[7], real, other, otherReal: { b: baseOf(od).mul(real.b).div(baseOf(draw)), sys: real.sys } };
    }
    if ((m = t.match(new RegExp(`An? ([\\w ]+?) is ${NUM} ${UW} long\\. On the plan it is ${NUM} ${UW}\\. Write the scale with no units: 1 : \\?`)))) {
      const real = L(num(m[2]), unitOf(m[3])), draw = L(num(m[4]), unitOf(m[5]));
      if (real.sys !== draw.sys) throw new Error('systems');
      return { value: real.b.div(draw.b), obj: m[1].toLowerCase(), real };
    }
    throw new Error('findScale prompt');
  },
  sizeError(q) {
    const t = clean(q.prompt);
    let m;
    if ((m = t.match(new RegExp(`A model at ([\\d.]+) : ([\\d,]+) is ${NUM} ${UW}(?: long)?\\. Ben wrote the real length as ${NUM} ${UW}, but it is ${NUM} ${UW}\\. How many times too (big|small)`)))) {
      const sc = { d: num(m[1]), a: num(m[2]), du: null, au: null };
      const right = toReal({ v: num(m[3]), u: unitOf(m[4]) }, sc), ben = L(num(m[5]), unitOf(m[6])), stated = L(num(m[7]), unitOf(m[8]));
      return { right, ben, stated, dir: m[9] };
    }
    if ((m = t.match(new RegExp(`At ([\\d.]+) : ([\\d,]+), Ben turned an? ${NUM} ${UW} plan line into ${NUM} ${UW}\\. The real length is ${NUM} ${UW}\\. How many times too (big|small)`)))) {
      const sc = { d: num(m[1]), a: num(m[2]), du: null, au: null };
      const right = toReal({ v: num(m[3]), u: unitOf(m[4]) }, sc), ben = L(num(m[5]), unitOf(m[6])), stated = L(num(m[7]), unitOf(m[8]));
      return { right, ben, stated, dir: m[9] };
    }
    if ((m = t.match(new RegExp(`At (${NUM} ${UW} : ${NUM} ${UW}), Ben drew an? ${NUM} ${UW} (\\w+) ${NUM} ${UW} long, without changing \\w+ to \\w+\\. It should be ${NUM} ${UW}\\. How many times too (big|small)`)))) {
      const sc = parseScale(m[1]);
      const right = toDrawing({ v: num(m[6]), u: unitOf(m[7]) }, sc), ben = L(num(m[9]), unitOf(m[10])), stated = L(num(m[11]), unitOf(m[12]));
      return { right, ben, stated, dir: m[13], obj: m[8], real: L(num(m[6]), unitOf(m[7])) };
    }
    throw new Error('sizeError prompt');
  },
  auditFix(q) { return audit(q); },

  // ---- choices ----
  order(q) {
    const sc = parseScale(q.prompt);
    const r = sc.a.mul(BASE[sc.au] ?? 1).div(sc.d.mul(BASE[sc.du] ?? 1));
    return q.choices.map(c => {
      const s = parseScale(c);
      if (!s) return false;
      if (!s.du) return s.a.div(s.d).eq(r);   // 1 : 5 means the same unit both sides
      return SYS[s.du] === SYS[sc.du] && s.a.mul(BASE[s.au]).div(s.d.mul(BASE[s.du])).eq(r);
    });
  },
  whichPair(q) {
    const sc = parseScale(q.prompt);
    return q.choices.map(c => {
      const m = clean(c).match(new RegExp(`^${NUM} ${UW} on the plan, ${NUM} ${UW} real$`));
      if (!m) return false;
      return sameLen(toReal({ v: num(m[1]), u: unitOf(m[2]) }, sc), L(num(m[3]), unitOf(m[4])));
    });
  },
  unitless(q) {
    const sc = parseScale(q.prompt);
    const r = sc.a.div(sc.d);   // real ÷ drawing
    return q.choices.map(c => {
      const t = clean(c);
      let m;
      if ((m = t.match(/^The real [\w ]+? is (\d+(?:\.\d+)?) times as long as the (?:drawing|plan|model)\.$/))) return r.eq(num(m[1])) && r.value > 1;
      if ((m = t.match(/^The (?:drawing|plan|model) is (\d+(?:\.\d+)?) times as long as the real [\w ]+?\.$/))) return Q(1).div(r).eq(num(m[1])) && r.value < 1;
      if ((m = t.match(new RegExp(`^${NUM} ${UW} on the (?:drawing|plan|model) stands for ${NUM} ${UW} of the (?:real )?[\\w ]+?\\.$`)))) {
        const a = { v: num(m[1]), u: unitOf(m[2]) }, b = L(num(m[3]), unitOf(m[4]));
        return SYS[a.u] === b.sys && sameLen(toReal(a, sc), b);
      }
      return false;
    });
  },
  sameUnitPick(q) {
    const x = lengthQuestion({ ...q, prompt: clean(q.prompt).replace(/Which is the length of the real ([\w ]+)\?/, 'How long is the real $1?') }).want;
    return q.choices.map(c => { const y = lastLen(c); return !!y && sameLen(x, y); });
  },
  predict(q) {
    const t = clean(q.prompt);
    let m;
    if ((m = t.match(/uses the scale (\d+(?:\.\d+)?) : (\d+(?:\.\d+)?) \(drawing : actual/))) {
      const c = num(m[1]).cmp(num(m[2]));
      return q.choices.map(ch => (c > 0 ? /^Larger than/.test(ch) : c < 0 ? /^Smaller than/.test(ch) : /^The same size/.test(ch)));
    }
    if ((m = t.match(/a ([\w ]+?) is (\d+(?:\.\d+)?) (\w+) long\. On the plan, is the number of (\w+) greater or less than (\d+(?:\.\d+)?)\?/))) {
      const sc = parseScale(t);
      const plan = inUnit(toDrawing({ v: num(m[2]), u: unitOf(m[3]) }, sc), unitOf(m[4]));
      const c = plan.cmp(num(m[5]));
      return q.choices.map(ch => {
        const s = clean(ch);
        const ok = c > 0 ? /^Greater/.test(s) : c < 0 ? /^Less/.test(s) : /^The same/.test(s);
        if (!ok) return false;
        // any calculation the reason names must give the plan length
        const e = s.match(/(\d+(?:\.\d+)?\s*[×÷]\s*\d+(?:\.\d+)?)/);
        return !e || evalExpr(e[1]).eq(plan);
      });
    }
    throw new Error('predict prompt');
  },
  arrowBack(q) {
    const m = clean(q.prompt).match(/says ([×÷+-]) (\d+(?:\.\d+)?)\./);
    const back = { '×': '÷', '÷': '×', '+': '-', '-': '+' }[m[1]];
    return q.choices.map(c => { const mm = clean(c).match(/^([×÷+-]) (\d+(?:\.\d+)?)$/); return !!mm && mm[1] === back && num(mm[2]).eq(num(m[2])); });
  },
  mixedPick(q) {
    const x = lengthQuestion({ ...q, prompt: clean(q.prompt).replace(/Which calculation gives its real length\?/, 'How long is it actually?') });
    const v = inUnit(x.want, unitOf(texPlain(q.board).match(/\? ?(\w+)\s*$/)[1]));
    return q.choices.map(c => { try { return evalExpr(c).eq(v); } catch { return false; } });
  },
  fitPaper(q) {
    const t = clean(q.prompt);
    const m = t.match(new RegExp(`is ${NUM} ${UW} long\\. Can it be drawn at (.+?) across a sheet of paper ${NUM} ${UW} wide\\?`));
    const sc = parseScale(m[3]);
    const plan = toDrawing({ v: num(m[1]), u: unitOf(m[2]) }, sc), paper = L(num(m[4]), unitOf(m[5]));
    const fits = plan.b.cmp(paper.b) <= 0;
    return q.choices.map(c => {
      const s = clean(c);
      const mm = s.match(new RegExp(`^(Yes|No): it is ${NUM} ${UW} on the plan(?:, (less|more) than ${NUM} ${UW})?\\.$`));
      if (!mm) return false;
      if ((mm[1] === 'Yes') !== fits) return false;
      if (!sameLen(L(num(mm[2]), unitOf(mm[3])), plan)) return false;
      if (mm[4]) { const w = L(num(mm[5]), unitOf(mm[6])), cmp = plan.b.cmp(w.b); if (mm[4] === 'less' ? cmp >= 0 : cmp <= 0) return false; }
      return true;
    });
  },
  fracForm(q) {
    const t = clean(q.prompt);
    const m = t.match(new RegExp(`At (.+?), an? ${NUM} ${UW} [\\w ]+? is ${NUM} ${UW} on the plan\\.`));
    const sc = parseScale(m[1]);
    const plan = toDrawing({ v: num(m[2]), u: unitOf(m[3]) }, sc);
    return q.choices.map(c => { if (/can't be drawn/.test(c)) return false; const y = lastLen(c); return !!y && sameLen(y, plan); });
  },
  normTable(q) {
    const sc = parseScale(q.prompt) ?? parseScale(texPlain(q.board));
    return q.choices.map(c => {
      const m = clean(c).match(new RegExp(`^${NUM} ${UW} → ${NUM} ${UW}$`));
      return !!m && sameLen(toReal({ v: num(m[1]), u: unitOf(m[2]) }, sc), L(num(m[3]), unitOf(m[4])));
    });
  },
  convertFirst(q) {
    const t = clean(q.prompt);
    const sc = parseScale(t);
    const target = sc.du ? sc.au : unitOf((t.match(/measured in (\w+)/) ?? [])[1] ?? '');
    return q.choices.map(c => {
      const m = clean(c).match(new RegExp(`^${NUM} ${UW} = ${NUM} ${UW}$`));
      return !!m && unitOf(m[4]) === target && sameLen(L(num(m[1]), unitOf(m[2])), L(num(m[3]), unitOf(m[4])));
    });
  },
  sensibleUnit(q) {
    const m = clean(q.prompt).match(new RegExp(`real length of ${NUM} ${UW}\\. Which is the same length in (\\w+)\\?`));
    const x = L(num(m[1]), unitOf(m[2])), u = unitOf(m[3]);
    return q.choices.map(c => { const y = lastLen(c); const lu = lengthsIn(clean(c)).pop(); return !!y && lu.u === u && sameLen(x, y); });
  },
  pairPick(q) {
    const t = clean(q.prompt);
    const m = t.match(new RegExp(`On a house plan, the ([\\w ]+?) is ${NUM} ${UW} and the ([\\w ]+?) is ${NUM} ${UW}\\. The real ([\\w ]+?) is ${NUM} ${UW}\\.`));
    const plan = { [m[1]]: L(num(m[2]), unitOf(m[3])), [m[4]]: L(num(m[5]), unitOf(m[6])) };
    const realObj = m[7], real = L(num(m[8]), unitOf(m[9]));
    return q.choices.map(c => {
      const mm = clean(c).match(new RegExp(`^The plan's ([\\w ]+?), ${NUM} ${UW}, and the real ([\\w ]+?), ${NUM} ${UW}$`));
      if (!mm) return false;   // the real length first is actual : drawing, the wrong order
      return mm[1] === mm[4] && mm[4] === realObj && !!plan[mm[1]] && sameLen(plan[mm[1]], L(num(mm[2]), unitOf(mm[3]))) && sameLen(real, L(num(mm[5]), unitOf(mm[6])));
    });
  },
  reasonable(q) {
    const t = clean(q.prompt);
    const m = t.match(new RegExp(`A plan uses (.+?)\\. The ([\\w ]+?) is ${NUM} ${UW} on the plan\\. Kai says the real \\2 is ${NUM} ${UW} long\\.`));
    const sc = parseScale(m[1]);
    const right = toReal({ v: num(m[3]), u: unitOf(m[4]) }, sc), kai = L(num(m[5]), unitOf(m[6]));
    return q.choices.map(c => {
      const s = clean(c);
      if (/^Reasonable/.test(s)) return sameLen(kai, right);
      if (/^Not reasonable/.test(s)) return !sameLen(kai, right) && timesTrue(timesClaim(s), kai, right, 0.15);
      return false;
    });
  },
  plausible(q) {
    const t = clean(q.prompt);
    const x = lengthQuestion({ ...q, prompt: t.replace(/Which model length makes sense\?/, 'How long is the model?') }).want;
    return q.choices.map(c => { const y = lastLen(c); return !!y && sameLen(x, y); });
  },
  diagnoseRev(q) {
    const t = clean(q.prompt);
    const sc = parseScale(t);
    let given, toPlan;
    let m;
    if ((m = t.match(new RegExp(`To draw an? ${NUM} ${UW} [\\w ]+?, she wrote this`)))) { given = { v: num(m[1]), u: unitOf(m[2]) }; toPlan = true; }
    else if ((m = t.match(new RegExp(`An? [\\w ]+? is ${NUM} ${UW} on the plan\\. She wrote this`)))) { given = { v: num(m[1]), u: unitOf(m[2]) }; toPlan = false; }
    else if ((m = t.match(new RegExp(`The model is ${NUM} ${UW} long\\. Ana read`)))) { given = { v: num(m[1]), u: unitOf(m[2]) }; toPlan = false; }
    else if ((m = t.match(new RegExp(`drawn at [\\d.]+ : [\\d.]+, ${NUM} ${UW} long\\. Ana found the real`)))) { given = { v: num(m[1]), u: unitOf(m[2]) }; toPlan = false; }
    else throw new Error('diagnoseRev prompt');
    const right = toPlan ? toDrawing(given, sc) : toReal(given, sc);
    const ana = lastLen(texPlain(q.board));
    const anaRight = sameLen(ana, right) && arithOk(texPlain(q.board));
    return q.choices.map(c => {
      const s = clean(c);
      if (/^Nothing/.test(s)) return anaRight;
      const y = lastLen(s);
      return !anaRight && !!y && sameLen(y, right) && arithOk(s.replace(/^[^:]*:/, ''));
    });
  },
  diagnoseConv(q) {
    const t = clean(q.prompt);
    const sc = parseScale(t);
    const rest = t.replace(sc.raw, ' ');
    const ls = lengthsIn(rest);
    if (ls.length !== 1) throw new Error('diagnoseConv lengths');
    const isReal = /(?:real|The real [\w ]+?) (?:is|[\w ]+? is) $/.test(rest.slice(0, ls[0].at)) || /The real [\w ]+? is $/.test(rest.slice(0, ls[0].at)) || /A real [\w ]+? is $/.test(rest.slice(0, ls[0].at));
    const right = isReal ? toDrawing(ls[0], sc) : toReal(ls[0], sc);
    const board = texPlain(q.board);
    const ben = lastLen(board);
    const benRight = sameLen(ben, right) && arithOk(board);
    return q.choices.map(c => {
      const s = clean(c);
      if (/^Right/.test(s)) return benRight;
      if (benRight) return false;
      const tc = timesClaim(s);
      const after = s.split(':').slice(1).join(':');
      const y = lastLen(after);
      if (!tc && !y) return false;   // a rule, not a fix ("you must convert before you scale")
      if (tc && !timesTrue(tc, ben, right)) return false;
      if (y && !sameLen(y, right)) return false;
      return arithOk(after);
    });
  },
  audit(q) {
    const t = clean(q.prompt);
    let m;
    if ((m = t.match(new RegExp(`A wall is drawn ${NUM} ${UW} long on a plan at (.+?)\\. Does an? ${NUM}-(ft|m) couch fit along it\\?`)))) {
      const sc = parseScale(m[3]);
      const wall = toReal({ v: num(m[1]), u: unitOf(m[2]) }, sc), couch = L(num(m[4]), unitOf(m[5]));
      const fits = wall.b.cmp(couch.b) >= 0;
      return q.choices.map(c => {
        const s = clean(c);
        const mm = s.match(new RegExp(`^(Yes|No): the wall is (?:only )?${NUM} ${UW}(?: long)?(?:, (long enough|too short) for ${NUM} ${UW})?\\.$`));
        if (!mm || (mm[1] === 'Yes') !== fits || !sameLen(L(num(mm[2]), unitOf(mm[3])), wall)) return false;
        if (mm[4] && ((mm[4] === 'long enough') !== fits || !sameLen(L(num(mm[5]), unitOf(mm[6])), couch))) return false;
        return true;
      });
    }
    const a = audit(q);
    const verdict = a.wrongWay && a.noConv ? 'both' : a.wrongWay ? 'way' : a.noConv ? 'conv' : a.ok ? 'ok' : 'other';
    return q.choices.map(c => {
      if (/^It is correct/.test(c)) return verdict === 'ok';
      if (/both of those/.test(c)) return verdict === 'both';
      if (/scale step goes the wrong way/.test(c)) return verdict === 'way';
      if (/unit conversion is missing/.test(c)) return verdict === 'conv';
      return false;
    });
  },
};

/** a whole solution "model L in at 1 : N, real length in feet" read from the board: what it does and gets */
function audit(q) {
  const t = clean(q.prompt);
  const m = t.match(new RegExp(`at (\\d+) : (\\d+) is ${NUM} ${UW} long\\. Here is a solution for the real length in (\\w+)`));
  const sc = { d: num(m[1]), a: num(m[2]), du: null, au: null };
  const right = toReal({ v: num(m[3]), u: unitOf(m[4]) }, sc), unit = unitOf(m[5]);
  const lines = texPlain(q.board).split(' ; ').map(s => s.trim());
  const N = num(m[2]);
  let wrongWay = false, convDone = false, normalized = false, arith = true;
  for (const ln of lines) {
    if (!arithOk(ln)) arith = false;
    const op = ln.match(/^(\d[\d,]*(?:\.\d+)?) ([×÷]) (\d[\d,]*(?:\.\d+)?)/);
    if (op && num(op[1]).eq(N) && op[2] === '÷' && /so 1 in : [\d.]+ ft/.test(ln)) { normalized = BASE.ft === Number(op[3]); continue; }
    if (op && num(op[3]).eq(N) && op[2] === '÷') wrongWay = true;
    // an in → ft step on the same line: "= 120 in = 10 ft" / "≈ 0.063 in ≈ 0.005 ft"
    const cv = ln.match(/([\d.,]+) in [=≈] ([\d.,]+) ft/);
    if (cv) { convDone = near(num(cv[1]).value / 12, num(cv[2]).value, 0.25) || Math.abs(num(cv[1]).value / 12 - num(cv[2]).value) < 0.006; }
  }
  const final = lastLen(lines[lines.length - 1]);
  const noConv = !convDone && !normalized && unit !== 'in';
  const ok = !wrongWay && !noConv && arith && !!final && sameLen(final, right);
  return { right, unit, wrongWay, noConv, ok, final };
}

// ---------------------------------------------------------------- contract
const pickIndex = arr => {
  if (!Array.isArray(arr)) return undefined;
  const hits = arr.map((ok, i) => (ok ? i : -1)).filter(i => i >= 0);
  return hits.length ? hits[0] : -1;   // -1: no choice is right (shows in the sweep, named by sane)
};
function answerOf(q, r) {
  if (q.input === 'choice') return pickIndex(r);
  switch (q.family) {
    case 'toUnitless': return r.value.value;
    case 'findScale': return r.value.value;
    case 'sizeError': return (r.dir === 'big' ? r.ben.b.div(r.right.b) : r.right.b.div(r.ben.b)).value;
    case 'auditFix': return inUnit(r.right, unitOf(q.unit)).value;
    case 'unitsBack': return inUnit(r.want, r.unit).value;
    default: return inUnit(r.want, r.unit ?? unitOf(q.unit)).value;
  }
}

export default {
  solve(q) {
    const f = F[q.family];
    if (!f) return undefined;
    let r;
    try { r = f(q); } catch { return undefined; }
    try { return answerOf(q, r); } catch { return undefined; }
  },
  sane(q) {
    const f = F[q.family];
    if (!f) return '';
    let r;
    try { r = f(q); } catch (e) { return `could not read the item (${e.message})`; }
    const probs = [];
    if (q.input === 'choice' && Array.isArray(r)) {
      const n = r.filter(Boolean).length;
      if (n === 0) probs.push('no choice is right');
      if (n > 1) probs.push(`${n} choices are right`);
    }
    const t = clean(q.prompt);
    const subj = subjectOf(t);
    // the real size of the thing the question is about
    if (r && !Array.isArray(r) && r.real) { const p = sizeProblem(subj, r.real); if (p) probs.push(p); }
    if (q.family === 'roomCalc' && r) { const nm = subjectOf(t); for (const x of r.room) { const p = sizeProblem(nm, x); if (p) { probs.push(p); break; } } }
    if (q.family === 'findScale' && r) {
      const p = sizeProblem(r.obj, r.real); if (p) probs.push(p);
      if (r.other) { const p2 = sizeProblem(r.other, r.otherReal); if (p2) probs.push(p2); }
    }
    if (q.family === 'sizeError' && r) {
      if (!sameLen(r.stated, r.right)) probs.push(`the prompt says the right length is ${clean(q.prompt).match(/(?:but it is|real length is|should be) ([^.]+)\./)?.[1]}, the scale gives another`);
      if (r.obj) { const p = sizeProblem(r.obj, r.real); if (p) probs.push(p); }
      const k = (r.dir === 'big' ? r.ben.b.div(r.right.b) : r.right.b.div(r.ben.b)).value;
      if (!(k > 1)) probs.push(`Ben's answer is not too ${r.dir}`);
    }
    if (q.family === 'toUnitless' && r && !r.hintOk) probs.push('the conversion hint is wrong');
    if (q.family === 'auditFix' || (q.family === 'audit' && !/couch/.test(t))) {
      try { const a = audit(q); const p = sizeProblem(subj, a.right); if (p) probs.push(p); } catch { /* fine */ }
    }
    if (q.family === 'audit' && /couch/.test(t)) {
      const m = t.match(new RegExp(`A wall is drawn ${NUM} ${UW} long on a plan at (.+?)\\. Does an? ${NUM}-(ft|m) couch`));
      if (m) {
        const p = sizeProblem('wall', toReal({ v: num(m[1]), u: unitOf(m[2]) }, parseScale(m[3])));
        if (p) probs.push(p);
        const p2 = sizeProblem('couch', L(num(m[4]), unitOf(m[5]))); if (p2) probs.push(p2);
      }
    }
    // the real size behind the choice families that name an object
    const realOf = () => {
      if (q.family === 'sameUnitPick') return lengthQuestion({ ...q, prompt: t.replace(/Which is the length of the real ([\w ]+)\?/, 'How long is the real $1?') }).real;
      if (q.family === 'plausible') return lengthQuestion({ ...q, prompt: t.replace(/Which model length makes sense\?/, 'How long is the model?') }).real;
      if (q.family === 'mixedPick') return lengthQuestion({ ...q, prompt: t.replace(/Which calculation gives its real length\?/, 'How long is it actually?') }).real;
      if (q.family === 'fitPaper') { const m = t.match(new RegExp(`is ${NUM} ${UW} long\\. Can it`)); return L(num(m[1]), unitOf(m[2])); }
      if (q.family === 'fracForm') { const m = t.match(new RegExp(`, an? ${NUM} ${UW} [\\w ]+? is`)); return L(num(m[1]), unitOf(m[2])); }
      if (q.family === 'diagnoseRev') {
        const sc = parseScale(t); let m;
        if ((m = t.match(new RegExp(`To draw an? ${NUM} ${UW}`)))) return L(num(m[1]), unitOf(m[2]));
        if ((m = t.match(new RegExp(`(?:is|The model is|, )\\s*${NUM} ${UW} (?:on the plan|long)`)))) return toReal({ v: num(m[1]), u: unitOf(m[2]) }, sc);
      }
      if (q.family === 'diagnoseConv') {
        const sc = parseScale(t), rest = t.replace(sc.raw, ' '), ls = lengthsIn(rest);
        const before = rest.slice(0, ls[0].at);
        return /real [\w ]+? is $/i.test(before) ? L(ls[0].v, ls[0].u) : toReal(ls[0], sc);
      }
      if (q.family === 'reasonable') {
        const m = t.match(new RegExp(`A plan uses (.+?)\\. The ([\\w ]+?) is ${NUM} ${UW} on the plan\\.`));
        return toReal({ v: num(m[3]), u: unitOf(m[4]) }, parseScale(m[1]));
      }
      return null;
    };
    if (q.input === 'choice') {
      let x = null; try { x = realOf(); } catch { x = null; }
      if (x) { const p = sizeProblem(subj, x); if (p) probs.push(p); }
    }
    // claims the item makes along the way must be true
    if (q.family === 'table') {
      const sc = parseScale(t), m = t.match(new RegExp(`goes with ${NUM} ${UW} and ${NUM} ${UW} with ${NUM} ${UW}`));
      if (m && !sameLen(toReal({ v: num(m[3]), u: unitOf(m[4]) }, sc), L(num(m[5]), unitOf(m[6])))) probs.push('the ratio table row is wrong');
    }
    if (q.family === 'arrowBack') {
      const sc = parseScale(t), m = t.match(/arrow from the (.+?) to the (.+?) says ([×÷]) (\d+)/);
      if (sc && m) {
        const fwd = sc.a.div(sc.d), k = num(m[4]);
        const ok = m[3] === '×' ? fwd.eq(k) : Q(1).div(fwd).eq(k);
        if (!ok) probs.push('the forward arrow does not match the scale');
      }
    }
    if (q.family === 'reasonable') {
      const m = t.match(new RegExp(`A plan uses (.+?)\\. The ([\\w ]+?) is ${NUM} ${UW} on the plan\\..*?An? [\\w ]+? is (?:usually ${NUM} to ${NUM}|about ${NUM}) ${UW} (?:long|tall)\\.`));
      if (m) {
        const right = toReal({ v: num(m[3]), u: unitOf(m[4]) }, parseScale(m[1]));
        const u = unitOf(m[8]);
        const lo = m[5] ? num(m[5]) : num(m[7]).mul(Q(2, 3)), hi = m[6] ? num(m[6]) : num(m[7]).mul(Q(3, 2));
        const v = inUnit(right, u);
        if (v.cmp(lo) < 0 || v.cmp(hi) > 0) probs.push(`the right answer ${v.value} ${u} does not fit the benchmark`);
      }
    }
    if (q.family === 'fitPaper' && Array.isArray(r)) {
      const m = t.match(new RegExp(`is ${NUM} ${UW} long\\. Can it be drawn at (.+?) across a sheet of paper ${NUM} ${UW} wide\\?`));
      const plan = toDrawing({ v: num(m[1]), u: unitOf(m[2]) }, parseScale(m[3]));
      if (plan.b.eq(L(num(m[4]), unitOf(m[5])).b)) probs.push('the drawing is exactly as wide as the paper');
    }
    if (['fracForm', 'sensibleUnit', 'diagnoseConv', 'diagnoseRev'].includes(q.family) && q.family !== 'diagnoseConv' && q.family !== 'diagnoseRev' && !arithOk(texPlain(q.board))) probs.push('the board calculation is wrong');
    if (q.family === 'sensibleUnit') {
      const m = t.match(new RegExp(`An? ${NUM} ${UW} (?:model [\\w ]+?|line on an?) (?:at )?([\\d.]+ : [\\d,]+)(?: plan)? gives a real length of ${NUM} ${UW}`));
      if (m) { const real = toReal({ v: num(m[1]), u: unitOf(m[2]) }, parseScale(m[3])); if (!sameLen(real, L(num(m[4]), unitOf(m[5])))) probs.push('the stated real length is wrong'); const p = sizeProblem(subj, real); if (p) probs.push(p); }
    }
    if (q.family === 'fracForm') {
      const m = t.match(new RegExp(`At (.+?), an? ${NUM} ${UW} [\\w ]+? is ${NUM} ${UW} on the plan`));
      if (m && !sameLen(toDrawing({ v: num(m[2]), u: unitOf(m[3]) }, parseScale(m[1])), L(num(m[4]), unitOf(m[5])))) probs.push('the plan length in the prompt is wrong');
    }
    if (q.family === 'rulerRead') {
      const p = q.data?.picture?.lines?.p;
      if (p?.obj && Math.abs(p.obj.len * 2 - Math.round(p.obj.len * 2)) > 1e-9) probs.push(`the drawn length ${p.obj.len} in is not on a half-inch mark`);
    }
    if (q.family === 'fixRev') {
      const m = t.match(/she wrote (.+?)\. Fix it/) ; const right = r?.want;
      if (m && right) { const y = lastLen(m[1]); if (y && sameLen(y, right)) probs.push('what Ana wrote is already right'); }
    }
    return [...new Set(probs)].join('; ');
  },
};
