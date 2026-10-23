// Oracle for the lesson "scale-drawings" (scale drawings, grade 7). Written from what the student sees only: the
// prompt, the board, the choices and the drawn plan (figure corners in drawing units, the drawn side labels, the
// legend, the page size). Lengths are exact (Q); units convert through inches or centimeters. Drawing → real multiplies
// by the real length per drawing unit, real → drawing divides; areas use the factor squared. Choices are judged by
// computing what each one claims. Answer-side picture fields (labels2, text2) are never read.
// See docs/lessons/QUALITY_LAYER.md, "O: the oracle".
import { Q, texPlain, choiceWhere } from '../../tools/quality/oracle-kit.mjs';

// ---------------------------------------------------------------- reading
const clean = s => String(s ?? '').replace(/[−–]/g, '-').replace(/[’‘]/g, "'");
const UNI = { '½': [1, 2], '¼': [1, 4], '¾': [3, 4], '⅛': [1, 8], '⅜': [3, 8], '⅝': [5, 8], '⅞': [7, 8], '⅓': [1, 3], '⅔': [2, 3] };
/** "4 1/2", "4½", "1/4", "5.5", "12" → Q */
function amount(s) {
  let t = clean(s).trim();
  let extra = Q(0);
  const u = t.match(/[½¼¾⅛⅜⅝⅞⅓⅔]/);
  if (u) { extra = Q(...UNI[u[0]]); t = t.replace(u[0], '').trim(); if (!t) return extra; }
  let m = t.match(/^(\d+)\s+(\d+)\/(\d+)$/);
  if (m) return Q(Number(m[2]), Number(m[3])).add(Number(m[1])).add(extra);
  m = t.match(/^(\d+)\/(\d+)$/);
  if (m) return Q(Number(m[1]), Number(m[2])).add(extra);
  m = t.match(/^(\d*)(?:\.(\d+))?$/);
  if (!m || (m[1] === '' && !m[2])) throw new Error(`not a length: ${s}`);
  return Q(Number((m[1] || '0') + (m[2] || '')), m[2] ? 10 ** m[2].length : 1).add(extra);
}
const N = '(\\d+(?:\\.\\d+)?(?:\\s+\\d+/\\d+)?(?:/\\d+)?[½¼¾⅛⅜⅝⅞⅓⅔]?|[½¼¾⅛⅜⅝⅞⅓⅔])';
const U = '(mm|cm|m|km|in|ft|yd|mi)';
const TO = { mm: Q(1, 10), cm: Q(1), m: Q(100), km: Q(100000), in: Q(1), ft: Q(12), yd: Q(36), mi: Q(63360) };
const SYS = { mm: 'cm', cm: 'cm', m: 'cm', km: 'cm', in: 'in', ft: 'in', yd: 'in', mi: 'in' };
/** convert v (Q) from unit a to unit b */
function conv(v, a, b) {
  if (SYS[a] !== SYS[b]) throw new Error(`cannot convert ${a} to ${b}`);
  return v.mul(TO[a]).div(TO[b]);
}
const rx = (s, re) => clean(s).match(new RegExp(re));
/** the legend "A u1 represents B u2" (or "A u1 : B u2" on the board): { d, du, a, au, per } where per = real units per 1 drawing unit */
function legend(text) {
  const m = rx(text, `${N} ${U} represents ${N} ${U}`);
  if (!m) return null;
  const d = amount(m[1]), a = amount(m[3]);
  return { d, du: m[2], a, au: m[4], per: a.div(d) };
}
/** a scale "1 : 12" (one unit): factor real / model */
function ratioScale(text) {
  const m = clean(text).match(/scale (\d+(?:\.\d+)?) : (\d+(?:\.\d+)?)/) ?? clean(text).match(/at (\d+(?:\.\d+)?) : (\d+(?:\.\d+)?)/);
  return m ? amount(m[2]).div(amount(m[1])) : null;
}
const plan = q => q.data?.picture?.plan ?? null;
const qpt = p => [Q(p[0]), Q(p[1])];
function polyArea(pts) {
  let s = Q(0);
  for (let i = 0; i < pts.length; i++) {
    const [x1, y1] = qpt(pts[i]), [x2, y2] = qpt(pts[(i + 1) % pts.length]);
    s = s.add(x1.mul(y2).sub(x2.mul(y1)));
  }
  return s.n < 0 ? s.neg().div(2) : s.div(2);
}
const sideLen2 = (a, b) => (a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2;
const sides = pts => pts.map((p, i) => Math.sqrt(sideLen2(p, pts[(i + 1) % pts.length])));
function corners(pts) {
  return pts.map((p, i) => {
    const a = pts[(i - 1 + pts.length) % pts.length], b = pts[(i + 1) % pts.length];
    const u = [a[0] - p[0], a[1] - p[1]], v = [b[0] - p[0], b[1] - p[1]];
    return Math.acos((u[0] * v[0] + u[1] * v[1]) / Math.hypot(...u) / Math.hypot(...v)) * 180 / Math.PI;
  });
}
/** is figure B a scale copy of figure A (same corners, every side the same multiple; any start corner, either direction) */
function isScaleCopy(A, B) {
  if (A.length !== B.length) return false;
  const sa = sides(A), ca = corners(A);
  for (const pts of [B, [...B].reverse()]) {
    const sb = sides(pts), cb = corners(pts);
    for (let s = 0; s < pts.length; s++) {
      const k = sb[s] / sa[0];
      let ok = true;
      for (let i = 0; i < A.length && ok; i++) {
        const j = (s + i) % pts.length;
        if (Math.abs(sb[j] - k * sa[i]) > 1e-9 || Math.abs(cb[j] - ca[i]) > 1e-6) ok = false;
      }
      // corners shift with the start of the side list (corner i sits between side i-1 and side i)
      if (ok) return true;
    }
  }
  return false;
}
const near = (a, b) => Math.abs(a - b) < 1e-9;

// ---------------------------------------------------------------- families
const F = {};

F.copy = q => {
  const figs = plan(q)?.figs ?? [];
  const orig = figs.find(f => f.name === 'original');
  if (!orig) return undefined;
  return choiceWhere(q, c => { const f = figs.find(g => g.name === c.trim()); return !!f && isScaleCopy(orig.pts, f.pts); });
};

F.copyLen = q => {
  const p = clean(q.prompt);
  let m;
  if ((m = p.match(new RegExp(`original \\(${N} ${U} by ${N} ${U}\\)\\. The ${N} ${U} side became ${N} ${U}\\. How long is the copy's other side`)))) {
    const a = amount(m[1]), b = amount(m[3]), from = amount(m[5]), to = amount(m[7]);
    const other = from.eq(a) ? b : a;
    return other.mul(to).div(from).value;
  }
  if ((m = p.match(/has a corner of (\d+(?:\.\d+)?)°\. A scale copy/))) return Number(m[1]);   // a scale copy keeps every angle
  return undefined;
};

F.legend = q => {
  const p = clean(q.prompt);
  const L = legend(p);
  if (L && /written in one unit/.test(p)) {
    const real = conv(L.a, L.au, L.du), r = L.d.div(real);   // drawing : real
    return choiceWhere(q, c => { const k = clean(c).match(/^(\d+(?:\.\d+)?) : (\d+(?:\.\d+)?)$/); return !!k && amount(k[1]).div(amount(k[2])).eq(r); });
  }
  const m = p.match(/built at the scale (\d+) : (\d+)\. What does that tell you/);
  if (m) {
    const model = Number(m[1]), real = Number(m[2]);
    if (real > model) return choiceWhere(q, c => c.startsWith('The model is smaller: the real one is') && amount(c.match(/is (\S+) times as long/)?.[1] ?? 'x').eq(Q(real, model)));
    return choiceWhere(q, c => c.startsWith('The model is larger:') && amount(c.match(/it is (\S+) times as long/)?.[1] ?? 'x').eq(Q(model, real)));
  }
  return undefined;
};

F.legendNum = q => {
  const L = legend(q.prompt);
  return conv(L.a, L.au, L.du).div(L.d).value;
};

/** "How long is the real one, in feet?" → the asked unit */
const askedUnit = (q, fallback) => (clean(q.prompt).match(/in (feet|meters|inches|yards|centimeters|miles|kilometers)\?/)?.[1] ?? null)
  ? { feet: 'ft', meters: 'm', inches: 'in', yards: 'yd', centimeters: 'cm', miles: 'mi', kilometers: 'km' }[clean(q.prompt).match(/in (feet|meters|inches|yards|centimeters|miles|kilometers)\?/)[1]]
  : (q.unit?.trim() || fallback);

F.toActual = q => {
  const p = clean(q.prompt);
  let m;
  const k = ratioScale(p);
  if (k && (m = p.match(new RegExp(`(?:model|path on the plan|drawing) is ${N} ${U} long`)) ?? p.match(new RegExp(`is ${N} ${U} long`)))) {
    const real = amount(m[1]).mul(k);
    return conv(real, m[2], askedUnit(q, m[2])).value;
  }
  const L = legend(p);
  if (L && (m = p.match(new RegExp(`is ${N} ${U} on the plan`)))) {
    const drawn = conv(amount(m[1]), m[2], L.du);
    return conv(drawn.mul(L.per), L.au, askedUnit(q, L.au)).value;
  }
  return undefined;
};

/** a real length → drawn length (Q) in the drawing unit */
const toDraw = (L, v, u) => conv(v, u, L.au).div(L.per);
F.toDrawing = q => {
  const p = clean(q.prompt);
  const L = legend(p), m = p.match(new RegExp(`is ${N} ${U} long\\. The plan's scale`));
  if (!L || !m) return undefined;
  let d = toDraw(L, amount(m[1]), m[2]);
  if (/nearest quarter inch/.test(p)) d = Q(Math.round(d.mul(4).value), 4);   // (a .125 tie is flagged by sane)
  return q.input === 'frac' ? d.pair : d.value;
};

F.fracLegend = q => {
  const p = clean(q.prompt);
  const L = legend(p);
  let m;
  if ((m = p.match(new RegExp(`A real wall is ${N} ${U} long\\. How long do you draw it`)))) {
    const d = toDraw(L, amount(m[1]), m[2]);
    return q.input === 'frac' ? d.pair : d.value;
  }
  if ((m = p.match(new RegExp(`A wall is ${N} ${U} on the plan\\. How long is the real wall`)))) {
    const r = conv(amount(m[1]), m[2], L.du).mul(L.per);
    return q.input === 'frac' ? r.pair : r.value;
  }
  return undefined;
};

F.fracRewrite = q => {
  const p = clean(q.prompt);
  const L = legend(p);
  if (/Written in one unit/.test(p)) {
    const r = L.d.div(conv(L.a, L.au, L.du));
    return choiceWhere(q, c => { const k = clean(c).match(/^(\d+(?:\.\d+)?) : (\d+(?:\.\d+)?)$/); return !!k && amount(k[1]).div(amount(k[2])).eq(r); });
  }
  if (/Which scale means the same/.test(p)) {
    return choiceWhere(q, c => { const C = legend(c); return !!C && C.du === L.du && C.au === L.au && C.per.eq(L.per); });
  }
  return undefined;
};

F.ruler = q => {
  const p = clean(q.prompt);
  let m;
  if ((m = p.match(new RegExp(`starts at the ${N} ${U} mark and ends at the ${N} ${U} mark`)))) {
    const len = amount(m[3]).sub(amount(m[1]));
    return q.input === 'frac' ? len.pair : len.value;
  }
  if ((m = p.match(new RegExp(`segment ${N} ${U} long(?: from the ${N} mark|, starting at the ${N} ${U} mark)\\. At which mark`)))) {
    const end = amount(m[3] ?? m[4]).add(amount(m[1]));
    return choiceWhere(q, c => { const k = clean(c).match(new RegExp(`^${N} ${U}$`)); return !!k && k[2] === m[2] && amount(k[1]).eq(end); });
  }
  return undefined;
};

F.makePlan = q => {
  const p = clean(q.prompt);
  let m;
  if ((m = p.match(/corner of a real \w+ measures (\d+(?:\.\d+)?)°/))) return Number(m[1]);
  const L = legend(p);
  if ((m = p.match(new RegExp(`is ${N} ${U} by ${N} ${U}\\. You draw it at`)))) {
    const a = toDraw(L, amount(m[1]), m[2]), b = toDraw(L, amount(m[3]), m[4]);
    return choiceWhere(q, c => { const k = clean(c).match(new RegExp(`^${N} ${U} by ${N} ${U}$`)); return !!k && k[2] === L.du && k[4] === L.du && amount(k[1]).eq(a) && amount(k[3]).eq(b); });
  }
  if ((m = p.match(new RegExp(`The inside wall at the corner is ${N} ${U}\\.`)))) {
    const d = toDraw(L, amount(m[1]), m[2]);
    return q.input === 'frac' ? d.pair : d.value;
  }
  return undefined;
};

F.rescale = q => {
  const p = clean(q.prompt);
  const m = p.match(new RegExp(`drawn at ${N} ${U} represents ${N} ${U} shows a \\w+ ${N} ${U} long\\. You redraw the plan at ${N} ${U} represents ${N} ${U}\\.`));
  if (!m) return undefined;
  const L1 = { d: amount(m[1]), du: m[2], a: amount(m[3]), au: m[4] }, L2 = { d: amount(m[7]), du: m[8], a: amount(m[9]), au: m[10] };
  const real = conv(amount(m[5]), m[6], L1.du).mul(L1.a).div(L1.d);               // in L1.au
  const d = conv(real, L1.au, L2.au).mul(L2.d).div(L2.a);                           // in L2.du
  return q.input === 'frac' ? d.pair : d.value;
};

/** the drawn figure's area (plan units²) from its corners */
const figArea = q => { const f = plan(q)?.figs?.[0]; return f ? polyArea(f.pts) : null; };
F.area = q => {
  const p = clean(q.prompt);
  const L = legend(p);
  if (!L) return undefined;
  let m;
  if ((m = p.match(new RegExp(`The drawing's area is ${N} sq ${U}\\. What is the real area`)))) {
    const k = conv(L.a, L.au, L.du).div(L.d);   // real per drawing, same unit
    const target = q.unit?.replace(/^sq /, '').trim() || L.du;
    return areaConv(amount(m[1]).mul(k).mul(k), m[2], target).value;
  }
  if (/Find the real area/.test(p)) {
    const A = figArea(q);
    const target = q.unit?.replace(/^sq /, '').trim() || L.au;
    // each drawing unit is L.per real units (L.au) long
    return areaConv(A.mul(L.per).mul(L.per).mul(conv(Q(1), plan(q).unit, L.du)).mul(conv(Q(1), plan(q).unit, L.du)), L.au, target).value;
  }
  return undefined;
};
const areaConv = (v, a, b) => v.mul(conv(Q(1), a, b)).mul(conv(Q(1), a, b));

F.audit = q => {
  const p = clean(q.prompt);
  const L = legend(p);
  const m = p.match(new RegExp(`is ${N} ${U} by ${N} ${U}\\. Is this a correct plan`));
  const f = plan(q)?.figs?.[0];
  if (!L || !m || !f) return undefined;
  const real = [amount(m[1]), amount(m[3])].map((v, i) => toDraw(L, v, m[2 + 2 * i]).value);
  const s = sides(f.pts), cs = corners(f.pts);
  const right = cs.every(a => Math.abs(a - 90) < 1e-6);
  // a rectangle drawn: its two side lengths, long ↔ long
  const drawn = [s[0], s[1]].sort((a, b) => b - a), want = [...real].sort((a, b) => b - a);
  const lengthsOK = f.pts.length === 4 && near(drawn[0], want[0]) && near(drawn[1], want[1]);
  const ok = right && lengthsOK;
  return choiceWhere(q, c => {
    let k;
    if (/^Yes/.test(c)) return ok;
    if (/^No: the corners (are not|must stay) right angles/.test(c)) return !right;
    if ((k = clean(c).match(new RegExp(`^No: the ${N} ${U} side should be longer`)))) {
      const realLong = amount(k[1]).value >= Math.max(...[amount(m[1]), amount(m[3])].map(x => x.value)) - 1e-12;
      return (realLong ? drawn[0] : drawn[1]) < toDraw(L, amount(k[1]), k[2]).value - 1e-9;
    }
    if (/^No: the width does not fit the scale/.test(c)) return !near(drawn[1], want[1]);
    if (/^No: the length does not fit the scale/.test(c)) return !near(drawn[0], want[0]);
    if ((k = clean(c).match(new RegExp(`^No: the plan should be ${N} ${U} by ${N} ${U}`)))) {
      const cl = [amount(k[1]), amount(k[3])].map((v, i) => conv(v, k[2 + 2 * i], L.du).value).sort((x, y) => y - x);
      return near(cl[0], want[0]) && near(cl[1], want[1]) && !lengthsOK;
    }
    if ((k = clean(c).match(new RegExp(`^No: the ${N} ${U} side should be ${N} ${U}`)))) {
      const should = toDraw(L, amount(k[1]), k[2]).value;
      if (!near(should, amount(k[3]).value)) return false;
      // the drawn side standing for that real side (the long real side ↔ the long drawn side) is not that length
      const realLong = amount(k[1]).value >= Math.max(...[amount(m[1]), amount(m[3])].map(x => x.value)) - 1e-12;
      const thatDrawn = realLong ? drawn[0] : drawn[1];
      return !near(thatDrawn, should) && right;
    }
    return false;
  });
};

F.fit = q => {
  const p = clean(q.prompt);
  const m = p.match(new RegExp(`is ${N} ft by ${N} ft\\. Your page is ${N} in by ${N} in`));
  if (!m) return undefined;
  const [a, b] = [amount(m[1]), amount(m[2])].map(x => x.value).sort((x, y) => y - x);
  const [P1, P2] = [amount(m[3]), amount(m[4])].map(x => x.value).sort((x, y) => y - x);
  const fits = k => a / k <= P1 + 1e-12 && b / k <= P2 + 1e-12;
  if (/smallest whole number of feet per inch/.test(p)) { let k = 1; while (!fits(k)) k++; return k; }
  if (/biggest plan that still fits/.test(p)) {
    const ks = (q.choices ?? []).map(c => legend(c)?.per.value);
    const ok = ks.map((k, i) => (k && fits(k) ? i : -1)).filter(i => i >= 0);
    if (!ok.length) return -1;
    const best = Math.min(...ok.map(i => ks[i]));
    return choiceWhere(q, (c, i) => ok.includes(i) && ks[i] === best);
  }
  return undefined;
};

F.areaWhy = q => {
  const p = clean(q.prompt);
  const L = legend(p);
  let m;
  if ((m = p.match(/Why ([\d.]+), and not ([\d.]+)\?/))) {
    const k = L.per;
    // only the claim "length AND width each grow k times" explains k²
    return choiceWhere(q, c => /The length AND the width are both/.test(c) && amount(c.match(/both (\S+) times as long/)[1]).eq(k) && amount(m[1]).eq(k.mul(k)));
  }
  if (/How does the \w+'s real area compare with the drawing's area/.test(p)) {
    const r = conv(L.a, L.au, L.du).div(L.d), f = r.mul(r);   // real / drawing
    return choiceWhere(q, c => { const k = clean(c).match(/^It is (\d+\/\d+|\d+(?:\.\d+)?) of it: both directions/); return !!k && amount(k[1]).eq(f); });
  }
  if ((m = p.match(new RegExp(`One square ${'(\\w+)'} of the plan stands for how many square (\\w+)`)))) {
    const word = { centimeter: 'cm', inch: 'in', meter: 'm', foot: 'ft', feet: 'ft', meters: 'm', yard: 'yd', yards: 'yd', millimeter: 'mm' };
    const from = word[m[1]], to = word[m[2].replace(/s$/, '')] ?? word[m[2]];
    const per = conv(L.a, L.au, to).div(conv(L.d, L.du, from));
    return per.mul(per).value;
  }
  return undefined;
};

F.cost = q => {
  const p = clean(q.prompt);
  const L = legend(p), f = plan(q)?.figs?.[0];
  if (!L || !f) return undefined;
  const unitScale = conv(Q(1), plan(q).unit, L.du).mul(L.per);   // real units (L.au) per plan unit
  let m;
  if ((m = p.match(/at \$(\d+(?:\.\d+)?) per square (foot|meter|yard)/))) {
    const A = polyArea(f.pts).mul(unitScale).mul(unitScale);
    const to = { foot: 'ft', meter: 'm', yard: 'yd' }[m[2]];
    return areaConv(A, L.au, to).mul(amount(m[1])).value;
  }
  if ((m = p.match(/costs \$(\d+(?:\.\d+)?) per (foot|meter|yard)/))) {
    let per = Q(0);
    for (let i = 0; i < f.pts.length; i++) {
      const a = f.pts[i], b = f.pts[(i + 1) % f.pts.length];
      if (a[0] !== b[0] && a[1] !== b[1]) return undefined;   // only axis-parallel sides are exact here
      per = per.add(Q(Math.abs(a[0] - b[0]) + Math.abs(a[1] - b[1])));
    }
    const to = { foot: 'ft', meter: 'm', yard: 'yd' }[m[2]];
    return conv(per.mul(unitScale), L.au, to).mul(amount(m[1])).value;
  }
  return undefined;
};

export function solve(q) {
  const f = F[q.family];
  return f ? f(q) : undefined;
}

// ---------------------------------------------------------------- the world
/** drawn side labels must match the drawn corners; a stated plan area must match the figure */
export function sane(q) {
  const out = [], p = clean(q.prompt), P = plan(q);
  let s; try { s = solve(q); } catch { s = undefined; }
  if (q.input === 'choice' && s === -1) out.push('no single right choice');
  for (const f of P?.figs ?? []) {
    (f.labels ?? []).forEach((lab, i) => {
      if (!lab || lab === '?') return;
      const t = texPlain(lab.replace(/(\d+)\\tfrac\{(\d+)\}\{(\d+)\}/g, '$1 $2/$3')).match(new RegExp(`^${N} ${U}$`));
      if (!t || t[2] !== P.unit) return;      // a real-length label (ft on an inch plan) is not a drawn length
      const len = Math.sqrt(sideLen2(f.pts[i], f.pts[(i + 1) % f.pts.length]));
      if (Math.abs(len - amount(t[1]).value) > 1e-6) out.push(`side ${i} is labelled ${texPlain(lab)} but drawn ${len}`);
    });
  }
  const b = texPlain(q.board ?? '').match(new RegExp(`plan: ${N} sq ${U}`));
  if (b && P?.figs?.[0] && !polyArea(P.figs[0].pts).eq(amount(b[1]))) out.push('the stated plan area is not the drawn figure\'s area');
  let m;
  if (q.family === 'toDrawing' && /nearest quarter inch/.test(p)) {
    const L = legend(p); m = p.match(new RegExp(`is ${N} ${U} long\\. The plan's scale`));
    if (L && m) { const d = toDraw(L, amount(m[1]), m[2]).mul(4); const two = d.mul(2); if (two.d === 1 && two.n % 2 === 1) out.push('the length is exactly halfway between two quarter inches'); }
  }
  if (q.family === 'audit' && P?.figs?.[0]) {
    const L = legend(p); m = p.match(new RegExp(`is ${N} ${U} by ${N} ${U}\\. Is this a correct plan`));
    if (L && m && q.choices.some(c => /^Yes/.test(c))) {
      const y = q.choices.find(c => /^Yes/.test(c)).match(new RegExp(`the ${N} ${U} side is ${N} ${U}`));
      if (y && !toDraw(L, amount(y[1]), y[2]).eq(amount(y[3]))) out.push('the Yes choice states a wrong drawn length');
    }
  }
  return [...new Set(out)].join('; ');
}

export default { solve, sane };
