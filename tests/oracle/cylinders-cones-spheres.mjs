// Oracle for the lesson "cylinders-cones-spheres" (volume of cylinders, cones and spheres, 8.G.C.9 + surface area,
// units, scaling). Written from what the student sees only: the prompt, the board, the choices and the drawn picture
// (the vessels' drawn proportions and the dimension marks placed on them). Every answer is worked out here with the
// formulas a teacher uses: πr²h, ⅓πr²h, ⁴⁄₃πr³, ⅔πr³, Ph (+ 2B), 2πrh (+ 2πr²). See docs/lessons/QUALITY_LAYER.md.
import { Q, round } from '../../tools/quality/oracle-kit.mjs';

const PI = Math.PI;
const EPS = 1e-9;

// ---------------------------------------------------------------- reading numbers
const VULG = { '½': [1, 2], '⅓': [1, 3], '⅔': [2, 3], '¼': [1, 4], '¾': [3, 4], '⅛': [1, 8] };
const NUM = '(\\d[\\d,]*(?:\\.\\d+)?[½⅓⅔¼¾⅛]?|[½⅓⅔¼¾⅛]|\\d+\\/\\d+)';
/** '2½' → 5/2, '1,000' → 1000, '0.5' → 1/2, '500/3' → 500/3 (exact Q) */
function qn(s) {
  let t = String(s).trim().replace(/,/g, '').replace(/−/g, '-');
  let m = t.match(/^(-?)(\d*)([½⅓⅔¼¾⅛])$/);
  if (m) { const [a, b] = VULG[m[3]]; const f = Q(a, b).add(Number(m[2] || 0)); return m[1] ? f.neg() : f; }
  m = t.match(/^(-?\d+)\/(\d+)$/);
  if (m) return Q(Number(m[1]), Number(m[2]));
  return Q(t);
}
const UNIT = '(in|ft|yd|cm|mm|m)';
/** inches per unit, to compare object sizes */
const INCH = { in: 1, ft: 12, yd: 36, cm: 1 / 2.54, mm: 0.1 / 2.54, m: 100 / 2.54 };
/** length of one unit in another, exactly */
const PER = { 'ft>in': 12, 'yd>ft': 3, 'yd>in': 36, 'm>cm': 100, 'cm>mm': 10, 'm>mm': 1000 };
function factor(from, to) {
  if (from === to) return Q(1);
  if (PER[`${from}>${to}`]) return Q(PER[`${from}>${to}`]);
  if (PER[`${to}>${from}`]) return Q(1, PER[`${to}>${from}`]);
  throw new Error(`no conversion ${from} → ${to}`);
}

// ---------------------------------------------------------------- the picture
const scene = q => q.data?.picture?.scene ?? null;
const vessels = q => scene(q)?.p?.vessels ?? [];
const dims = q => scene(q)?.p?.dims ?? [];
/** the shape of a drawn vessel */
const SHAPE_OF_KIND = { cyl: 'cylinder', cone: 'cone', cup: 'cone', sphere: 'sphere', dome: 'hemisphere', bowl: 'hemisphere', box: 'box' };
/** the dimension marks on vessel v: { r, d, h, l } as { q, unit } */
function marks(q, v = 0) {
  const out = {};
  for (const x of dims(q)) {
    if (x.v !== v) continue;
    const m = String(x.text).replace(/^d = /, '').match(new RegExp(`^${NUM} ${UNIT}$`));
    if (m) out[x.what] = { q: qn(m[1]), unit: m[2] };
  }
  return out;
}

// ---------------------------------------------------------------- the shape and its sizes
/** the shape the question is about: a named shape in the prompt first ("This cone", "Model it as a sphere", "is a
 *  cylinder"), else the drawn vessel */
function shapeOf(q, text = q.prompt) {
  const p = String(text);
  let m = p.match(/Model it as an? (cylinder|cone|hemisphere|sphere)/) ?? p.match(/\bis an? (cylinder|cone|hemisphere|sphere)\b/)
    ?? p.match(/\b(?:This|this|A|a) (cylinder|cone|hemisphere|sphere)\b/);
  if (m) return m[1];
  const v = vessels(q)[0];
  return v ? SHAPE_OF_KIND[v.kind] : null;
}
/** radius and height told in the prompt: { r, h, unit } (exact Q), a diameter halved */
function sizes(p) {
  const s = String(p);
  let r = null, h = null, unit = null, m;
  if ((m = s.match(new RegExp(`radius (?:of )?${NUM} ${UNIT}\\b`))) || (m = s.match(new RegExp(`${NUM} ${UNIT} in radius`)))) { r = qn(m[1]); unit = m[2]; }
  else if ((m = s.match(new RegExp(`diameter ${NUM} ${UNIT}\\b`))) || (m = s.match(new RegExp(`${NUM} ${UNIT} across`)))) { r = qn(m[1]).div(2); unit = m[2]; }
  let hu = null;
  if ((m = s.match(new RegExp(`height ${NUM} ${UNIT}\\b`))) || (m = s.match(new RegExp(`${NUM} ${UNIT} (?:tall|deep|high)\\b`)))) { h = qn(m[1]); hu = m[2]; }
  // a height told in another unit than the radius ("radius 8 in and height 2 ft") is converted to the radius's unit
  // (hu then names the unit h is in, so the world checks do not convert it a second time)
  if (r && h && unit && hu && hu !== unit) { h = h.mul(factor(hu, unit)); hu = unit; }
  return { r, h, unit: unit ?? hu, hu };
}
/** the volume ÷ π of a shape (exact Q) */
function volK(shape, r, h) {
  switch (shape) {
    case 'cylinder': return r.mul(r).mul(h);
    case 'cone': return r.mul(r).mul(h).div(3);
    case 'sphere': return r.mul(r).mul(r).mul(4).div(3);
    case 'hemisphere': return r.mul(r).mul(r).mul(2).div(3);
    default: throw new Error(`no volume for ${shape}`);
  }
}
/** "round to the nearest tenth" / "nearest whole" / "nearest gallon" → places; null when exact */
function places(p) {
  if (/nearest tenth/.test(p)) return 1;
  if (/nearest hundredth/.test(p)) return 2;
  if (/nearest (whole|gallon|liter)/.test(p)) return 0;
  return null;
}
const isTie = (v, k) => { const x = Math.abs(v) * 10 ** k; return Math.abs(x - Math.floor(x) - 0.5) < 1e-6; };
/** a Q as an oracle answer: [n, d] */
const fr = x => x.pair;

// ---------------------------------------------------------------- choice text helpers
/** '× ⅛' → 1/8, '× 27' → 27 */
const timesOf = c => { const m = String(c).match(/^×\s*(\S+)$/); return m ? qn(m[1]) : null; };
/** evaluate a product written like "π · 5² · 4 · 12³" or "2π · 5 · 48" (a number) */
function evalProduct(c) {
  const parts = String(c).split('·').map(t => t.trim());
  let v = 1;
  for (const t of parts) {
    const m = t.match(/^(\d+(?:\.\d+)?)?(π)?(?:(\d+(?:\.\d+)?)([²³])?)?$/);
    if (!m || (!m[1] && !m[2] && !m[3])) return NaN;
    if (m[1]) v *= Number(m[1]);
    if (m[2]) v *= PI;
    if (m[3]) v *= Number(m[3]) ** (m[4] === '³' ? 3 : m[4] === '²' ? 2 : 1);
  }
  return v;
}
const near = (a, b, rel = 1e-9) => Math.abs(a - b) <= rel * Math.max(1, Math.abs(a), Math.abs(b));
const idx = (q, pred) => { const hits = (q.choices ?? []).map((c, i) => (pred(c, i) ? i : -1)).filter(i => i >= 0); return hits.length === 1 ? hits[0] : -1; };

/** the formula of each shape as the choices write it */
const FORMULA = { sphere: 'V=⁴⁄₃πr³', hemisphere: 'V=⅔πr³', cone: 'V=⅓πr²h', cylinder: 'V=πr²h' };
const squash = s => String(s).replace(/\s+/g, '');

// ---------------------------------------------------------------- the estimate families
/** the estimate with π ≈ 3 and the exact value of the drawn solid (with its marks) */
function solidFromMarks(q, shape) {
  const k = marks(q);
  const r = k.r ? k.r.q : k.d ? k.d.q.div(2) : null;
  const h = k.h ? k.h.q : null;
  return { r, h, unit: (k.r ?? k.d ?? k.h)?.unit, shape };
}

// ---------------------------------------------------------------- solve
function solve(q) {
  const p = q.prompt;
  const f = q.family;
  let m;
  switch (f) {
    case 'id-lengths': {
      // the drawn cone: its radius and its (straight up) height are the vessel's own numbers
      const v = vessels(q)[0];
      const want = /radius/.test(p) ? v.r : /height/.test(p) ? v.h : null;
      return idx(q, c => near(qn(c.split(' ')[0]).value, want));
    }
    case 'id-sphere': {
      const s = sizes(p);
      if (/How tall/.test(p)) return idx(q, c => (m = c.match(new RegExp(`^${NUM} ${UNIT}$`))) && qn(m[1]).eq(s.r.mul(2)));
      if (/What do you need/.test(p)) return idx(q, c => (m = c.match(new RegExp(`^Only its radius: ${NUM} ${UNIT}$`))) && qn(m[1]).eq(s.r));
      return undefined;
    }
    case 'id-lying': {
      const k = marks(q);
      const r = k.r ? k.r.q : k.d.q.div(2);
      return [r.value, k.h.q.value];
    }
    case 'bh-layers': {
      if ((m = p.match(new RegExp(`top area of ${NUM}π ${UNIT}². The stack is ${NUM} ${UNIT} tall`)))) return fr(qn(m[1]).mul(qn(m[3])));
      const s = sizes(p.replace(/,\s*(\d+) (in|ft|yd|cm|m) tall/, ', height $1 $2'));
      return fr(volK('cylinder', s.r, s.h));
    }
    case 'bh-twin': {
      m = p.match(new RegExp(`The box is ${NUM} ${UNIT} tall, the cylinder ${NUM} ${UNIT}`));
      const hb = qn(m[1]), hc = qn(m[3]);
      if (hb.eq(hc)) return idx(q, c => /^They hold the same/.test(c));
      return idx(q, c => c === (hb.cmp(hc) > 0 ? 'The box' : 'The cylinder'));
    }
    case 'bh-layer-area': {
      const s = sizes(p);
      const want = PI * s.r.value ** 2 * s.h.value;
      const exact = idx(q, c => squash(c) === `π·${s.r}²·${s.h}`);
      return exact >= 0 ? exact : idx(q, c => near(evalProduct(c), want));
    }
    case 'cone-pour': {
      if ((m = p.match(new RegExp(`The cylinder holds ${NUM} ${UNIT}³. How much does the cone`)))) return qn(m[1]).div(3).value;
      if ((m = p.match(new RegExp(`The cone holds ${NUM} ${UNIT}³. How much does the cylinder`)))) return qn(m[1]).mul(3).value;
      return undefined;
    }
    case 'cone-match': {
      const s = sizes(p);
      return idx(q, c => (m = c.match(new RegExp(`^[A-Z]: r = ${NUM} ${UNIT}, h = ${NUM} ${UNIT}$`))) && qn(m[1]).eq(s.r) && qn(m[3]).eq(s.h));
    }
    case 'sph-pour': {
      if ((m = p.match(new RegExp(`The can holds ${NUM}π ${UNIT}³. How much does the ball`)))) return fr(qn(m[1]).mul(2).div(3));
      if ((m = p.match(new RegExp(`The can holds ${NUM} ${UNIT}³. How much does the ball`)))) return qn(m[1]).mul(2).div(3).value;
      if ((m = p.match(new RegExp(`The ball holds ${NUM} ${UNIT}³. How much does the can`)))) return qn(m[1]).mul(3).div(2).value;
      if ((m = p.match(new RegExp(`The ball holds ${NUM}π ${UNIT}³. How much does the can`)))) return fr(qn(m[1]).mul(3).div(2));
      return undefined;
    }
    case 'sph-can': {
      const s = sizes(p);
      return [s.r.value, s.r.mul(2).value];
    }
    case 'calc-pic': case 'calc-story': case 'dec-frac-r': {
      const shape = shapeOf(q);
      const s = sizes(p);
      const K = volK(shape, s.r, s.h);
      const pl = places(p);
      if (pl !== null) return round(K.value * PI, pl);
      return fr(K);
    }
    case 'mix-formula': {
      const shape = shapeOf(q, '');
      return idx(q, c => squash(c) === FORMULA[shape]);
    }
    case 'approx-round': {
      m = p.match(new RegExp(`V = ${NUM} π`));
      const K = qn(m[1]);
      const pi = /use 3\.14/.test(p) ? 3.14 : PI;
      return round(K.value * pi, places(p) ?? 1);
    }
    case 'approx-signs': {
      const K = boardK(q);
      const pi = /3\.14/.test(p) ? 3.14 : PI;
      const X = round(K.value * pi, 1);
      return idx(q, c => {
        const x = c.match(/^V (=|≈) (\S+)π (\w+)³ (=|≈) ([\d.,]+) (\w+)³$/);
        return !!x && x[1] === '=' && x[4] === '≈' && qn(x[2]).eq(K) && Number(x[5].replace(/,/g, '')) === X && x[3] === x[6];
      });
    }
    case 'sa-prism-net': {
      let L, B;
      if ((m = p.match(new RegExp(`rectangular prism: base ${NUM} ${UNIT} by ${NUM} ${UNIT}, height ${NUM} ${UNIT}`)))) {
        const a = qn(m[1]), b = qn(m[3]), h = qn(m[5]);
        L = a.add(b).mul(2).mul(h); B = a.mul(b);
      } else if ((m = p.match(new RegExp(`right-triangle base with sides ${NUM}, ${NUM} and ${NUM} ${UNIT}, height ${NUM} ${UNIT}`)))) {
        const t = [qn(m[1]), qn(m[2]), qn(m[3])].sort((x, y) => x.cmp(y)), h = qn(m[5]);
        L = t[0].add(t[1]).add(t[2]).mul(h); B = t[0].mul(t[1]).div(2);
      } else return undefined;
      return /total surface area/.test(p) ? L.add(B.mul(2)).value : /lateral area/.test(p) ? L.value : undefined;
    }
    case 'sa-prism-story': {
      m = p.match(new RegExp(`${NUM} ${UNIT} long, ${NUM} ${UNIT} wide and ${NUM} ${UNIT} (?:tall|high)`));
      const a = qn(m[1]), b = qn(m[3]), h = qn(m[5]);
      const L = a.add(b).mul(2).mul(h);
      if (/every face/.test(p)) return L.add(a.mul(b).mul(2)).value;
      if (/not the top or bottom|four walls|no floor, no ceiling/.test(p)) return L.value;
      return undefined;
    }
    case 'sa-cyl-net': case 'sa-or-vol': {
      const s = sizes(p.replace(/is radius/, 'radius'));
      const r = s.r, h = s.h;
      const side = r.mul(h).mul(2), ends = r.mul(r).mul(2);
      if (/total surface area|whole closed can/.test(p)) return fr(side.add(ends));
      if (/label/.test(p)) return fr(side);
      if (/fits inside|How much .* (?:hold|inside)/.test(p)) return fr(volK('cylinder', r, h));
      return undefined;
    }
    case 'unit-mixed': {
      m = p.match(new RegExp(`radius ${NUM} ${UNIT} and height ${NUM} ${UNIT}. Find its exact volume in ${UNIT}³`));
      const to = m[5];
      const r = qn(m[1]).mul(factor(m[2], to)), h = qn(m[3]).mul(factor(m[4], to));
      return fr(volK(shapeOf(q), r, h));
    }
    case 'unit-trap': {
      m = p.match(new RegExp(`radius ${NUM} ${UNIT} and height ${NUM} ${UNIT}. Which setup gives its volume in cubic (inches|feet|centimeters)`));
      const to = { inches: 'in', feet: 'ft', centimeters: 'cm' }[m[5]];
      const r = qn(m[1]).mul(factor(m[2], to)), h = qn(m[3]).mul(factor(m[4], to));
      // the setup a teacher writes: π · r² · h with both lengths in the asked unit; else the one product of that value
      const exact = idx(q, c => squash(c) === `π·${r}²·${h}`);
      return exact >= 0 ? exact : idx(q, c => near(evalProduct(c), PI * r.value ** 2 * h.value));
    }
    case 'cubic-conv': {
      m = p.match(new RegExp(`holds ${NUM}(π)? ${UNIT}³. How many (?:π )?${UNIT}³ is that\\? \\(1 ${UNIT} = ${NUM} ${UNIT}\\)`));
      const N = qn(m[1]), big = m[4];
      const k = factor(big, m[3]); // small units per big unit
      return N.div(k.mul(k).mul(k)).value;
    }
    case 'cubic-cube': {
      if ((m = p.match(new RegExp(`holds ${NUM} ft³ of sand. How many cubic yards`)))) return qn(m[1]).div(27).value;
      if ((m = p.match(new RegExp(`is ${NUM} yd by ${NUM} yd by ${NUM} yd. How many cubic feet`)))) return qn(m[1]).mul(qn(m[2])).mul(qn(m[3])).mul(27).value;
      return undefined;
    }
    case 'cap-tank': {
      const s = sizes(p);
      m = p.match(new RegExp(`Use ${NUM} in³ = 1 gallon`));
      const k = factor(s.unit, 'in');
      const V = volK(shapeOf(q), s.r, s.h).mul(k).mul(k).mul(k).value * PI;
      return round(V / qn(m[1]).value, places(p) ?? 1);
    }
    case 'cap-liter': {
      const s = sizes(p);
      const V = volK(shapeOf(q), s.r, s.h).value * PI;
      if ((m = p.match(new RegExp(`Use ${NUM} cm³ = 1 L`)))) return round(V / qn(m[1]).value, places(p) ?? 1);
      if ((m = p.match(new RegExp(`Use 1 ft³ ≈ ${NUM} gal`)))) return round(V * qn(m[1]).value, places(p) ?? 0);
      return undefined;
    }
    case 'est-judge': {
      const e = judge(q);
      return e ? idx(q, c => c === e.verdict) : undefined;
    }
    case 'est-nearest': {
      const s = sizes(p);
      const shape = shapeOf(q);
      const est = volK(shape, s.r, s.h ?? Q(1)).value * 3;
      return closestChoice(q, est);
    }
    case 'audit-input': {
      const a = audit(q);
      if (!a) return undefined;
      const text = { formula: 'The wrong formula was used', diameter: 'The diameter was used as the radius', slant: 'The slant height was used as h', none: 'Nothing: the arithmetic checks out' };
      return a.faults.length === 1 ? idx(q, c => c === text[a.faults[0]]) : -1;
    }
    case 'audit-fix': {
      const a = audit(q);
      return a ? fr(a.right) : undefined;
    }
    case 'solve-h': case 'solve-story': case 'solve-r': {
      const shape = shapeOf(q);
      m = p.match(new RegExp(`(?:V = |holds )${NUM}π ${UNIT}³`));
      const K = qn(m[1]);
      const s = sizes(p);
      if (/How (tall|deep)/.test(p)) {
        const per = volK(shape, s.r, Q(1));
        return K.div(per).value;
      }
      if (/radius\?/.test(p)) {
        if (shape === 'sphere') return Math.cbrt(K.mul(3).div(4).value);
        if (shape === 'hemisphere') return Math.cbrt(K.mul(3).div(2).value);
        const per = volK(shape, Q(1), s.h);
        return Math.sqrt(K.div(per).value);
      }
      return undefined;
    }
    case 'scale-one': {
      const k = scaleOne(p);
      return k ? idx(q, c => { const t = timesOf(c); return !!t && t.eq(k); }) : undefined;
    }
    case 'scale-compare': {
      m = p.match(new RegExp(`holds ${NUM}π ${UNIT}³`));
      const K = qn(m[1]);
      const k = scaleCompare(p);
      return k ? fr(K.mul(k)) : undefined;
    }
    case 'model-inside': {
      m = p.match(new RegExp(`cylinder ${NUM} ${UNIT} in radius and ${NUM} ${UNIT} tall on the outside, open at the top. Its wall and bottom are ${NUM} ${UNIT} thick`));
      const R = qn(m[1]), H = qn(m[3]), t = qn(m[5]);
      return fr(volK('cylinder', R.sub(t), H.sub(t)));
    }
    case 'model-pile': {
      m = p.match(new RegExp(`cone, ${NUM} ${UNIT} across the bottom and ${NUM} ${UNIT} high`));
      const K = volK('cone', qn(m[1]).div(2), qn(m[3]));
      return round(K.value * PI, places(p) ?? 0);
    }
    default: return undefined;
  }
}

// the factor a volume is multiplied by
function scaleOne(p) {
  let m = p.match(new RegExp(`has only its (height|radius) multiplied by ${NUM}`));
  if (m) { const k = qn(m[2]); return m[1] === 'height' ? k : k.mul(k); }
  m = p.match(new RegExp(`has every length \\(radius and height\\) multiplied by ${NUM}`)) ?? p.match(new RegExp(`A sphere \\(radius [^)]*\\) has its radius multiplied by ${NUM}`));
  if (m) { const k = qn(m[1]); return k.mul(k).mul(k); }
  return null;
}
function scaleCompare(p) {
  let m;
  const kOf = t => (t === 'half' || t === 'halved' ? Q(1, 2) : qn(t));
  if ((m = p.match(/(\d+|half) (?:times )?as tall, same radius/))) return kOf(m[1]);
  if ((m = p.match(/with (\d+|half) (?:times )?the radius, same height/))) { const k = kOf(m[1]); return k.mul(k); }
  if ((m = p.match(/with every length (?:× (\d+)|(halved))/))) { const k = kOf(m[1] ?? m[2]); return k.mul(k).mul(k); }
  return null;
}

/** the exact volume ÷ π on the board "V = 288\pi", "V = \tfrac{500}{3}\pi", "V = \pi" */
function boardK(q) {
  const x = String(q.board).match(/V = (?:\\tfrac\{(\d+)\}\{(\d+)\}|(\d+))?\\pi/);
  if (!x) return null;
  return x[3] ? Q(Number(x[3])) : x[1] ? Q(Number(x[1]), Number(x[2])) : Q(1);
}

/** the choice nearest to a value (by ratio); -1 when two are about as near */
function closestChoice(q, v) {
  const ds = (q.choices ?? []).map(c => { const m = c.match(/about ([\d,.]+)/); return m ? Math.abs(Math.log(Number(m[1].replace(/,/g, '')) / v)) : Infinity; });
  const order = ds.map((d, i) => [d, i]).sort((a, b) => a[0] - b[0]);
  if (order.length > 1 && order[1][0] - order[0][0] < 0.05) return -1;
  return order[0][1];
}

/** est-judge: the claimed number against the estimate with π ≈ 3 */
function judge(q) {
  const p = q.prompt;
  const m = p.match(/says this (cylinder|cone|sphere|hemisphere) holds ([\d,.]+) (\w+)³/);
  if (!m) return null;
  const shape = m[1], claim = Number(m[2].replace(/,/g, ''));
  const s = solidFromMarks(q, shape);
  const K = volK(shape, s.r, s.h ?? Q(1)).value;
  const est = 3 * K, exact = PI * K;
  const ratio = claim / est;
  const verdict = ratio > 1.5 ? 'Too big' : ratio < 0.67 ? 'Too small' : ratio >= 0.85 && ratio <= 1.25 ? 'Reasonable' : null;
  return { verdict, ratio, claim, est, exact };
}

/** audit-input / audit-fix: what the student's work used, against the marks on the drawn solid */
function audit(q) {
  const p = q.prompt;
  const m = p.match(/volume of this (cylinder|cone): V = (⅓ · )?π · (\d+(?:\.\d+)?)² · (\d+(?:\.\d+)?) = (\S+) π (\w+)³/);
  if (!m) return null;
  const shape = m[1], third = !!m[2], A = qn(m[3]), B = qn(m[4]), C = qn(m[5]);
  const k = marks(q);
  const r = k.r ? k.r.q : k.d ? k.d.q.div(2) : null;
  const h = k.h?.q, l = k.l?.q;
  const faults = [];
  if (third !== (shape === 'cone')) faults.push('formula');
  if (!A.eq(r)) { if (k.d && A.eq(k.d.q)) faults.push('diameter'); else faults.push('other-r'); }
  if (!B.eq(h)) { if (l && B.eq(l)) faults.push('slant'); else faults.push('other-h'); }
  const used = (third ? A.mul(A).mul(B).div(3) : A.mul(A).mul(B));
  const arithmetic = used.eq(C);
  if (!faults.length) faults.push(arithmetic ? 'none' : 'arithmetic');
  return { faults, right: volK(shape, r, h), arithmetic, shape };
}

// ---------------------------------------------------------------- sane: what a careful teacher would object to
// Plausible diameter (and height) of each named object, in inches.
const OBJ = {
  'basketball': { d: [8.5, 10.5] }, 'water balloon': { d: [2, 14] }, 'gumball': { d: [0.4, 3] }, 'snow globe': { d: [2, 10] },
  'globe': { d: [4, 24] }, 'glass marble': { d: [0.4, 2] }, 'tennis ball': { d: [2.3, 2.9] }, 'fish bowl': { d: [4, 16] },
  'gumball machine globe': { d: [6, 24] }, 'round lantern': { d: [4, 30] },
  'round water tower tank': { d: [120, 1200] },
  'water tank': { d: [12, 600], h: [12, 600] }, 'round cake pan': { d: [4, 16], h: [1, 6] }, 'rain barrel': { d: [16, 48], h: [20, 60] },
  'juice can': { d: [1.8, 5], h: [3, 8] }, 'grain silo': { d: [120, 1500], h: [240, 2400] }, 'candle': { d: [0.5, 10], h: [1, 16] },
  'snow-cone cup': { d: [2, 5], h: [2, 7] }, 'paper cone cup': { d: [2, 5], h: [2, 7] }, 'funnel': { d: [1.5, 14], h: [1.5, 16] },
  'party hat': { d: [3, 9], h: [3, 14] }, 'mixing bowl': { d: [5, 18] }, 'salad bowl': { d: [5, 18] }, 'dome tent': { d: [48, 300] },
  'igloo': { d: [60, 240] }, 'planetarium dome': { d: [300, 3000] }, 'soup can': { d: [2, 5], h: [2.5, 8] },
  'can of beans': { d: [2, 5], h: [2.5, 8] }, 'drinking glass': { d: [2, 4.5], h: [3, 8] }, 'post mold': { d: [4, 30], h: [12, 180] },
  'tube': { d: [1, 30], h: [6, 180] }, 'vase': { d: [2, 14], h: [4, 36] }, 'water heater': { d: [14, 32], h: [24, 80] },
  'cooler': { d: [8, 30], h: [8, 36] }, 'fish tank': { d: [6, 72], h: [6, 72] }, 'pool': { d: [48, 600], h: [12, 96] },
  'pencil cup': { d: [2, 6], h: [3, 7] }, 'paint can': { d: [3, 12], h: [3, 14] }, 'flower pot': { d: [2, 30], h: [2, 30] },
  'mug': { d: [2.5, 5], h: [3, 7] }, 'planter': { d: [3, 36], h: [3, 36] }, 'ice bucket': { d: [5, 16], h: [5, 16] },
  'roll of paper towels': { d: [4, 8], h: [8, 14] }, 'can': { d: [1.5, 12], h: [2, 14] },
  'gravel pile': { d: [24, 3600] }, 'sand pile': { d: [24, 3600] }, 'salt pile': { d: [24, 3600] }, 'mulch pile': { d: [24, 3600] },
  'road salt pile': { d: [24, 3600] }, 'grain pile': { d: [24, 3600] },
};
const PILES = /pile$/;
const fmtIn = x => (x >= 24 ? `${+(x / 12).toFixed(1)} ft` : `${+x.toFixed(1)} in`);

/** the named object of a story and its sizes in inches */
function objectOf(q) {
  const p = q.prompt;
  const cap = vessels(q)[0]?.caption;
  let name = null, m;
  if ((m = p.match(/^(?:A|An|This) (.+?) (?:has|is|holds|fits)\b/))) name = m[1];
  if ((m = p.match(/^A pile of (\w+(?: \w+)?) is shaped like a cone/))) name = `${m[1]} pile`;
  if ((m = p.match(/volume of this (.+?) \(radius/))) name = m[1];
  if (!name || !OBJ[name.replace(/^(round|cylinder) /, '')]) name = cap ?? name;
  if (!name) return null;
  name = name.replace(/^cylinder /, '');
  if (!OBJ[name] && OBJ[name.replace(/^round /, '')]) name = name.replace(/^round /, '');
  return OBJ[name] ? { name, spec: OBJ[name] } : null;
}

function sane(q) {
  const out = [];
  const p = q.prompt;
  const f = q.family;
  let m;
  const s = sizes(p);

  // ---- every length positive, every answer a sensible size
  if (s.r && s.r.value <= 0) out.push('a radius of 0');
  if (s.h && s.h.value <= 0) out.push('a height of 0');

  // ---- the object is a real one of that size
  const o = objectOf(q);
  if (o && s.r && s.unit && !['scale-compare', 'scale-one', 'cubic-conv', 'cubic-cube', 'est-judge', 'audit-input', 'audit-fix'].includes(f)) {
    const dIn = s.r.value * 2 * INCH[s.unit];
    if (o.spec.d && (dIn < o.spec.d[0] * 0.999 || dIn > o.spec.d[1] * 1.001)) out.push(`a ${o.name} ${fmtIn(dIn)} across is not a real ${o.name} (about ${fmtIn(o.spec.d[0])}–${fmtIn(o.spec.d[1])})`);
    if (o.spec.h && s.h && s.hu) {
      const hIn = s.h.value * INCH[s.hu];
      if (hIn < o.spec.h[0] * 0.999 || hIn > o.spec.h[1] * 1.001) out.push(`a ${o.name} ${fmtIn(hIn)} tall is not a real ${o.name} (about ${fmtIn(o.spec.h[0])}–${fmtIn(o.spec.h[1])})`);
    }
    if (PILES.test(o.name) && s.h && s.h.value * INCH[s.hu] > s.r.value * INCH[s.unit] * 1.0001) out.push(`a ${o.name} taller than its radius (sides steeper than 45°) cannot stand`);
  }
  if (f === 'id-lying' && (m = p.match(/^This (.+?) is lying on its side, marked (\d+) (\w+) and (\d+) (\w+)/))) {
    const spec = OBJ[m[1]];
    const k = marks(q);
    const r = k.r ? k.r.q.value : k.d.q.value / 2;
    if (spec) {
      const dIn = 2 * r * INCH[m[3]], hIn = k.h.q.value * INCH[m[3]];
      if (dIn < spec.d[0] || dIn > spec.d[1]) out.push(`a ${m[1]} ${fmtIn(dIn)} across is not real`);
      if (hIn < spec.h[0] || hIn > spec.h[1]) out.push(`a ${m[1]} ${fmtIn(hIn)} long is not real`);
    }
  }
  if (f === 'bh-layers' && (m = p.match(/each layer is (\d+(?:\.\d+)?) (\w+) thick/))) {
    const t = Number(m[1]) * INCH[m[2]];
    if (/coins|crackers|stickers|pancakes/.test(p) && t > 1.01) out.push(`a ${/coins/.test(p) ? 'coin' : /crackers/.test(p) ? 'cracker' : /stickers/.test(p) ? 'sticker' : 'pancake'} ${m[1]} ${m[2]} thick`);
    const x = p.match(/(\d+) (\w+) tall: (\d+) layers, each (\d+(?:\.\d+)?) \w+ thick/);
    if (x && Number(x[3]) * Number(x[4]) !== Number(x[1])) out.push('the layers do not make the stated height');
  }
  if (f === 'sa-prism-story' && (m = p.match(/a room (\d+) ft long, (\d+) ft wide and (\d+) ft high/))) {
    if (Number(m[3]) < 7 || Number(m[3]) > 20) out.push(`a room with ${m[3]} ft walls`);
    if (Number(m[1]) < 6 || Number(m[2]) < 6) out.push('a room narrower than 6 ft');
  }
  if (f === 'cubic-cube' && (m = p.match(/(\d+) yd by (\d+) yd by (\d+) yd/)) && Number(m[3]) * 3 > 3) out.push(`a sandbox ${Number(m[3]) * 3} ft deep`);
  if (f === 'cubic-cube') { const v = vessels(q)[0]; if (v?.kind === 'box' && v.h * 3 > 3) out.push(`the drawn sandbox is ${v.h * 3} ft deep`); }

  // ---- the drawing agrees with the words
  const v0 = vessels(q)[0];
  const named = (p.match(/\b(?:This|this|A|a) (cylinder|cone|hemisphere|sphere)\b/) ?? p.match(/\bis an? (cylinder|cone|hemisphere|sphere)\b/) ?? p.match(/Model it as an? (cylinder|cone|hemisphere|sphere)/) ?? [])[1];
  if (named && v0 && SHAPE_OF_KIND[v0.kind] && SHAPE_OF_KIND[v0.kind] !== named && !['cone-pour', 'bh-twin', 'cone-match'].includes(f)) out.push(`the words say ${named}, the picture draws a ${SHAPE_OF_KIND[v0.kind]}`);

  // ---- per family checks
  switch (f) {
    case 'id-lengths': {
      const v = vessels(q)[0];
      const k = marks(q);
      if (v && k.l && !near(Math.hypot(v.r, v.h), k.l.q.value, 1e-6)) out.push('the slant mark is not the drawn slant');
      if (v && k.r && !near(v.r, k.r.q.value, 1e-6)) out.push('the radius mark is not the drawn radius');
      break;
    }
    case 'bh-layer-area': {
      const want = PI * s.r.value ** 2 * s.h.value;
      const same = (q.choices ?? []).filter(c => near(evalProduct(c), want)).length;
      if (same > 1) out.push('two products give the same volume (a distractor equals πr²h for these numbers)');
      break;
    }
    case 'unit-trap': {
      if ((m = p.match(new RegExp(`radius ${NUM} ${UNIT} and height ${NUM} ${UNIT}. Which setup gives its volume in cubic inches`)))) {
        const r = qn(m[1]).mul(factor(m[2], 'in')).value, h = qn(m[3]).mul(factor(m[4], 'in')).value;
        if ((q.choices ?? []).filter(c => near(evalProduct(c), PI * r * r * h)).length > 1) out.push('two setups give the same number (2π·r·h equals π·r²·h when r = 2): the label-area distractor is also "a setup that gives its volume"');
      }
      break;
    }
    case 'cone-match': {
      // the drawn cylinders keep the proportions of their captions
      const vs = vessels(q);
      const cone = vs[0];
      for (const c of q.choices ?? []) {
        const x = c.match(new RegExp(`^([A-Z]): r = ${NUM} ${UNIT}, h = ${NUM} ${UNIT}$`));
        const w = x && vs.find(t => t.caption === x[1]);
        if (w && cone && !near((w.r / cone.r) / (qn(x[2]).value / s.r.value), 1, 1e-6)) out.push(`cylinder ${x[1]} is not drawn to its numbers`);
      }
      break;
    }
    case 'sph-pour': {
      if ((m = p.match(new RegExp(`radius ${NUM} ${UNIT} fits snugly in a can with the same radius and height ${NUM} ${UNIT}. The can holds ${NUM}π`)))) {
        const r = qn(m[1]);
        if (!qn(m[3]).eq(r.mul(2))) out.push('the can is not as tall as the ball');
        if (!qn(m[5]).eq(r.mul(r).mul(r).mul(2))) out.push('the can volume is not πr²·2r');
      }
      break;
    }
    case 'approx-round': case 'approx-signs': {
      // the stated exact volume is the drawn solid's
      const K = (() => {
        if (f === 'approx-round') { const x = p.match(new RegExp(`V = ${NUM} π`)); return x ? qn(x[1]) : null; }
        return boardK(q);
      })();
      const said = p.match(/this (\w+)’s volume/);
      const shape = shapeOf(q, said ? `This ${said[1]}` : p);
      const sm = solidFromMarks(q, shape);
      if (K && sm.r) { try { const W = volK(shape, sm.r, sm.h ?? Q(1)); if (!W.eq(K)) out.push(`the stated V = ${K}π is not the drawn ${shape}'s ${W}π`); } catch { /* no marks */ } }
      if (K) { const pi = /use the π key/.test(p) ? PI : 3.14; if (isTie(K.value * pi, 1)) out.push('the rounding is a .x5 tie'); }
      if (f === 'approx-signs' && solve(q) === -1) out.push('no single right line');
      break;
    }
    case 'calc-pic': case 'calc-story': case 'cap-tank': case 'cap-liter': case 'model-pile': {
      const pl = places(p);
      if (pl !== null) {
        let V;
        try {
          V = volK(shapeOf(q), s.r, s.h).value * PI;
          if ((m = p.match(new RegExp(`Use ${NUM} in³ = 1 gallon`)))) V /= qn(m[1]).value;
          else if ((m = p.match(new RegExp(`Use ${NUM} cm³ = 1 L`)))) V /= qn(m[1]).value;
          else if ((m = p.match(new RegExp(`Use 1 ft³ ≈ ${NUM} gal`)))) V *= qn(m[1]).value;
          if (isTie(V, pl)) out.push('the rounding is a .x5 tie');
          if (round(V, pl) === 0) out.push('the rounded answer is 0');
        } catch { /* sizes missing */ }
      }
      break;
    }
    case 'est-judge': {
      const e = judge(q);
      if (e && !e.verdict) out.push(`the claim is ${e.ratio.toFixed(2)} × the estimate: neither clearly reasonable nor clearly off`);
      if (e && e.verdict === 'Reasonable' && Math.abs(e.claim / e.exact - 1) > 0.01) out.push('a "reasonable" claim that is still not the right volume');
      break;
    }
    case 'est-nearest': {
      const shape = shapeOf(q);
      const K = volK(shape, s.r, s.h ?? Q(1)).value;
      const a = closestChoice(q, 3 * K), b = closestChoice(q, PI * K);
      if (a === -1) out.push('two choices are about as near the estimate');
      else if (a !== b) out.push('the choice nearest the estimate is not the one nearest the true volume');
      break;
    }
    case 'audit-input': case 'audit-fix': {
      const a = audit(q);
      if (a && a.faults.length !== 1) out.push(`the work has ${a.faults.length} faults (${a.faults.join(', ')})`);
      if (a && a.faults[0] === 'none' && f === 'audit-fix') out.push('"one input is wrong", but none is');
      if (a && !a.arithmetic) out.push('the work\'s arithmetic is wrong too');
      if (a && f === 'audit-input' && a.faults.some(x => /^other|arithmetic/.test(x))) out.push('the fault is not among the choices');
      break;
    }
    case 'solve-h': case 'solve-story': case 'solve-r': {
      const x = solve(q);
      if (typeof x === 'number' && Math.abs(x - Math.round(x)) > 1e-9 && Math.abs(x * 10 - Math.round(x * 10)) > 1e-9) out.push(`the answer ${x} is not a clean number`);
      break;
    }
    case 'model-inside': {
      if ((m = p.match(new RegExp(`cylinder ${NUM} ${UNIT} in radius and ${NUM} ${UNIT} tall on the outside, open at the top. Its wall and bottom are ${NUM} ${UNIT} thick`)))) {
        const R = qn(m[1]).value, H = qn(m[3]).value, t = qn(m[5]).value;
        if (t >= R || t >= H) out.push('the wall is as thick as the container');
        const vs = vessels(q);
        if (vs[1] && !near(vs[1].r / vs[0].r, (R - t) / R, 1e-6)) out.push('the drawn inside radius is off');
      }
      break;
    }
    default: break;
  }

  // a choice question needs exactly one right choice
  if (q.input === 'choice') {
    let r;
    try { r = solve(q); } catch { r = undefined; }
    if (r === -1) out.push('no single right choice');
  }
  return [...new Set(out)].join('; ');
}

export default { solve, sane };
