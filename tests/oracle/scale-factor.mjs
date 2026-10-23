// Oracle for the lesson "scale-factor" (grade 7 scaled copies: scaled or distorted, matching parts, the factor, lengths
// and angles, grids, reductions, non-integer factors, reverse, counterexamples, context). Written from what the student
// sees only: the prompt, the board, the choices and the drawn figures (the polygons' corners on the grid, their side
// labels and corner letters; figures listed in `hide` are not on screen and are not used, nor the hidden answer of a
// "?" label). Matching parts are found from the drawn shapes (the corner order that makes every side ratio and every
// angle agree); lengths and factors are worked out exactly. See docs/lessons/QUALITY_LAYER.md, "O: the oracle".
import { Q, choiceWhere } from '../../tools/quality/oracle-kit.mjs';

const EPS = 1e-6;
// ---------------------------------------------------------------- reading
/** '3/2', '2.5', '1/2', '½', '1 1/2' → Q */
const val = s => { let t = String(s).trim().replace('½', '1/2').replace('¼', '1/4').replace('¾', '3/4'); try { return /^\d+(?:\.\d+)?$|^\d+\/\d+$|^\d+ \d+\/\d+$/.test(t) ? Q(t) : null; } catch { return null; } };
const factor = p => { const m = String(p).match(/(?:scale factor|scaled by|reduced with scale factor) (\d+ \d+\/\d+|\d+\/\d+|\d+(?:\.\d+)?)/); return m ? val(m[1]) : null; };
const pic = q => q.data?.pict?.pic ?? null;
const hidden = q => new Set(q.data?.pict?.hide ?? []);
/** the figures on screen (not hidden), with their index */
const shown = q => (pic(q)?.figs ?? []).map((f, i) => ({ ...f, i })).filter(f => !hidden(q).has('f' + f.i));
const lab = l => (l == null ? null : typeof l === 'string' ? l : l.t);
const labVal = l => { const t = lab(l); return t && t !== '?' ? val(t) : null; };
const sub = (a, b) => [a[0] - b[0], a[1] - b[1]];
/** the length of side i as the student knows it: its label, or the label of a parallel side of the same drawn length
 *  (the opposite side of a rectangle or parallelogram) */
function known(f, i) {
  const own = labVal(f.labels?.[i]);
  if (own) return own;
  const E = f.pts.map((p, j) => [f.pts[(j + 1) % f.pts.length][0] - p[0], f.pts[(j + 1) % f.pts.length][1] - p[1]]);
  const L = v => Math.hypot(v[0], v[1]);
  for (let j = 0; j < E.length; j++) {
    if (j === i) continue;
    const v = labVal(f.labels?.[j]);
    const par = Math.abs(E[i][0] * E[j][1] - E[i][1] * E[j][0]) < 1e-9 * L(E[i]) * L(E[j]);
    if (v && par && Math.abs(L(E[i]) - L(E[j])) < 1e-9 && f.pts.length === 4) return v;
  }
  return null;
}
const len = v => Math.hypot(v[0], v[1]);
const edges = f => f.pts.map((p, i) => sub(f.pts[(i + 1) % f.pts.length], p));
const angleAt = (f, i) => { const n = f.pts.length, a = sub(f.pts[(i - 1 + n) % n], f.pts[i]), b = sub(f.pts[(i + 1) % n], f.pts[i]); return Math.acos(Math.max(-1, Math.min(1, (a[0] * b[0] + a[1] * b[1]) / len(a) / len(b)))) * 180 / Math.PI; };
/** the corner order of B that best matches A: { vmap (A corner → B corner), emap (A side → B side), k, score } */
function correspond(A, B) {
  const n = A.pts.length;
  if (B.pts.length !== n) return null;
  const eA = edges(A).map(len), eB = edges(B).map(len);
  const aA = A.pts.map((_, i) => angleAt(A, i)), aB = B.pts.map((_, i) => angleAt(B, i));
  let best = null;
  for (const dir of [1, -1]) for (let s = 0; s < n; s++) {
    const vmap = [...Array(n)].map((_, i) => (((dir === 1 ? s + i : s - i) % n) + n) % n);
    const emap = [...Array(n)].map((_, i) => (dir === 1 ? (s + i) % n : (((s - i - 1) % n) + n) % n));
    const r = emap.map((j, i) => eB[j] / eA[i]), k = r.reduce((x, y) => x + y, 0) / n;
    const score = Math.max(...r.map(x => Math.abs(x - k) / k)) + Math.max(...vmap.map((j, i) => Math.abs(aA[i] - aB[j]))) / 180;
    if (!best || score < best.score - 1e-12) best = { vmap, emap, k, score, dir };
  }
  return best;
}
/** matching sides as drawn: the same side positions when the copy is drawn the same way round, else the best fit */
function match(A, B) {
  const eA = edges(A), eB = edges(B);
  if (eA.length === eB.length) {
    const dirOk = eA.every((e, i) => { const f = eB[i]; const c = (e[0] * f[0] + e[1] * f[1]) / len(e) / len(f); return c > Math.cos(Math.PI / 4); });
    if (dirOk) { const n = eA.length; return { vmap: [...Array(n)].map((_, i) => i), emap: [...Array(n)].map((_, i) => i), score: 0, dir: 1 }; }
  }
  return correspond(A, B);
}
const similar = (A, B) => { const c = correspond(A, B); return !!c && c.score < 1e-6; };
/** does B copy A with factor k in the same position order and orientation (drawn on the grid, edge by edge)? */
const sameWayCopy = (A, B, k) => { const eA = edges(A), eB = edges(B); return eA.length === eB.length && eA.some((_, s) => eA.every((e, i) => Math.abs(eB[(i + s) % eA.length][0] - k * e[0]) < EPS && Math.abs(eB[(i + s) % eA.length][1] - k * e[1]) < EPS)); };

// ---------------------------------------------------------------- the families
const F = {
  whichCopy(q) {
    const F0 = shown(q);
    const orig = F0.find(f => f.caption === 'original');
    if (!orig) return undefined;
    const good = Object.fromEntries(F0.filter(f => f.caption && f.caption !== 'original').map(f => [f.caption, similar(orig, f)]));
    return choiceWhere(q, c => good[c] === true);
  },
  scaledOrNot(q) {
    const [A, B] = shown(q);
    if (!A || !B) return undefined;
    const yes = similar(A, B);
    return choiceWhere(q, c => (/^Yes/.test(c) ? yes : /^No/.test(c) ? !yes : false));
  },
  partner(q) {
    const p = q.prompt, [A, B] = shown(q);
    let m = p.match(/: A → ([A-Z]), B → ([A-Z]), C → ([A-Z])\. Which side of the copy matches side ([A-Z])([A-Z])\?/);
    if (m) {
      const mp = { A: m[1], B: m[2], C: m[3] }, want = [mp[m[4]], mp[m[5]]].sort().join('');
      return choiceWhere(q, c => [...c].sort().join('') === want);
    }
    m = p.match(/Which vertex of the copy matches ([A-Z])\?/);
    if (!m || !A?.letters || !B?.letters) return undefined;
    const c = correspond(A, B);
    if (!c || c.score > 1e-6) return undefined;
    // an isosceles triangle has two ways to match: then the corner is not decided by the shape
    const alt = [1, -1].flatMap(dir => [0, 1, 2].map(s => ({ dir, s }))).filter(({ dir, s }) => {
      const vmap = [0, 1, 2].map(i => (((dir === 1 ? s + i : s - i) % 3) + 3) % 3);
      return vmap.every((j, i) => Math.abs(angleAt(A, i) - angleAt(B, j)) < 1e-6);
    });
    const ia = A.letters.indexOf(m[1]);
    const targets = new Set(alt.map(({ dir, s }) => B.letters[(((dir === 1 ? s + ia : s - ia) % 3) + 3) % 3]));
    if (targets.size !== 1) return -1;
    const t = [...targets][0];
    return choiceWhere(q, x => x === t);
  },
  nameK(q) {
    const [A, B] = shown(q);
    if (!A || !B) return undefined;
    const c = correspond(A, B);
    if (!c) return undefined;
    for (let i = 0; i < A.pts.length; i++) {
      const a = known(A, i), b = known(B, c.emap[i]);
      if (a && b) return b.div(a).pair;
    }
    return undefined;
  },
  predict(q) {
    const k = factor(q.prompt);
    if (!k) return undefined;
    const cmp = k.cmp(1);
    return choiceWhere(q, c => (cmp > 0 ? /^larger/.test(c) : cmp < 0 ? /^smaller/.test(c) : /^the same size/.test(c)));
  },
  angle(q) {
    const [A] = shown(q);
    const a = A?.angles?.find(x => x.t && x.t !== '?');
    if (!a) return undefined;
    const deg = parseFloat(String(a.t).replace('^\\circ', ''));
    if (/How many degrees/.test(q.prompt)) return deg;
    return choiceWhere(q, c => /^They are the same size$/.test(c));
  },
  computeSide: sideAsked,
  reduce: sideAsked,
  nonInt: sideAsked,
  bothSides(q) {
    const m = q.prompt.match(/is (\S+) in\. wide and (\S+) in\. tall\. It is copied with scale factor (\S+)\./);
    if (!m) return undefined;
    const k = val(m[3]);
    return [val(m[1]).mul(k).value, val(m[2]).mul(k).value];
  },
  readSeg(q) {
    const s = shown(q).find(f => f.role === 'pick' && f.open);
    if (!s) return undefined;
    if (q.input === 'pair') {
      // the path from the dot: the first leg across, then the leg up or down (grid y grows upward)
      const dot = pic(q).dots?.[0]?.at, P = dot && Math.abs(s.pts[0][0] - dot[0]) + Math.abs(s.pts[0][1] - dot[1]) < EPS ? s.pts : [...s.pts].reverse();
      const a = sub(P[1], P[0]), b = sub(P[2], P[1]);
      return [Math.abs(a[0]) + Math.abs(b[0]), Math.abs(a[1]) + Math.abs(b[1])];
    }
    let L = 0;
    for (let i = 0; i + 1 < s.pts.length; i++) L += len(sub(s.pts[i + 1], s.pts[i]));
    return Math.round(L * 1e9) / 1e9;
  },
  drawNext(q) {
    const k = factor(q.prompt) ?? val(q.prompt.match(/scale factor (\S+?)\./)?.[1]);
    const figs = shown(q), A = figs.find(f => f.role === 'first'), part = figs.find(f => f.role === 'second' && f.open);
    if (!k || !A || !part) return undefined;
    // the copy starts at the same corner and goes the same way: the next side matches the original's side number m-1
    const i = part.pts.length - 1;
    const e = edges(A)[i % A.pts.length];
    const dir = q.prompt.match(/Next it goes (up|down|left|right)\./)?.[1];
    const ok = dir === 'up' ? e[1] > 0 && Math.abs(e[0]) < EPS : dir === 'down' ? e[1] < 0 && Math.abs(e[0]) < EPS : dir === 'right' ? e[0] > 0 && Math.abs(e[1]) < EPS : dir === 'left' ? e[0] < 0 && Math.abs(e[1]) < EPS : true;
    if (!ok) return -1;
    return k.mul(Q(len(e))).value;
  },
  pickDrawing(q) {
    const k = factor(q.prompt);
    const figs = shown(q), orig = figs.find(f => f.caption === 'original');
    if (!k || !orig) return undefined;
    // the drawing on the grid decides (a label can be wrong): every side k times the original's, same shape
    const good = Object.fromEntries(figs.filter(f => f.caption && f.caption !== 'original').map(f => [f.caption, sameWayCopy(orig, f, k.value) || (similar(orig, f) && Math.abs(correspond(orig, f).k - k.value) < 1e-6)]));
    return choiceWhere(q, c => good[c] === true);
  },
  slant(q) {
    const m = q.prompt.match(/goes (right|left) (\d+), (up|down) (\d+)\. The copy \(scale factor (\S+?)\)/);
    if (!m) return undefined;
    const k = val(m[5]);
    return [k.mul(+m[2]).value, k.mul(+m[4]).value];
  },
  findK(q) {
    const m = q.prompt.match(/A side that is (\S+) in\. on the original is (\S+) in\. on the [a-z ]+\./);
    return m ? val(m[2]).div(val(m[1])).pair : undefined;
  },
  missing(q) {
    const p = q.prompt;
    let m = p.match(/is (\S+) in\. wide and (\S+) in\. tall\. It is [a-z]+ as a scaled copy (\S+) in\. wide\. How tall/);
    if (m) return val(m[2]).mul(val(m[3])).div(val(m[1])).value;
    m = p.match(/is (\S+) in\. wide and (\S+) in\. tall\. It is [a-z]+ as a scaled copy (\S+) in\. tall\. How wide/);
    if (m) return val(m[1]).mul(val(m[3])).div(val(m[2])).value;
    return undefined;
  },
  reverse(q) {
    const m = q.prompt.match(/with scale factor (\S+?)\. A side of the copy is (\S+?)\. How long/);
    if (m) return val(m[2]).div(val(m[1])).value;
    const r = q.prompt.match(/The scale factor from the original to the copy is (\S+?)\. What scale factor takes the copy back to the original\?/);
    if (r) { const v = Q(1).div(val(r[1])); return q.input === 'frac' ? v.pair : v.value; }
    return undefined;
  },
  refute(q) {
    const k = val(q.prompt.match(/scaled by (\S+?)\. Which pair/)?.[1] ?? '');
    const [A, B] = shown(q);
    if (!k || !A || !B) return undefined;
    const c = match(A, B);
    const pairs = A.pts.map((_, i) => [known(A, i), known(B, c.emap[i])]).filter(([a, b]) => a && b);
    return choiceWhere(q, s => {
      const x = s.match(/^(\S+) → (\S+)$/);
      if (!x) return /^None:/.test(s) ? pairs.every(([a, b]) => b.eq(a.mul(k))) : false;
      const a = val(x[1]), b = val(x[2]);
      return pairs.some(([u, v]) => u.eq(a) && v.eq(b)) && !b.eq(a.mul(k));
    });
  },
  allRatios(q) {
    const [A, B] = shown(q);
    if (!A || !B) return undefined;
    const c = match(A, B);
    const r = A.pts.map((_, i) => { const a = known(A, i), b = known(B, c.emap[i]); return a && b ? b.div(a) : null; }).filter(Boolean);
    if (r.length < A.pts.length) return undefined;
    const same = r.every(x => x.eq(r[0]));
    return choiceWhere(q, s => (/^Yes/.test(s) ? same : /^No/.test(s) ? !same : false));
  },
  angleCheck(q) {
    const [A, B] = shown(q);
    if (!A || !B) return undefined;
    const c = correspond(A, B);
    const sidesOk = c && Math.max(...c.emap.map((j, i) => Math.abs(len(edges(B)[j]) / len(edges(A)[i]) - c.k))) < 1e-6;
    const anglesOk = c && c.vmap.every((j, i) => Math.abs(angleAt(A, i) - angleAt(B, j)) < 1e-6);
    return choiceWhere(q, s => (/^Yes: every side is ×/.test(s) ? sidesOk && anglesOk : /^No: the angles do not match$/.test(s) ? sidesOk && !anglesOk : false));
  },
  resize(q) {
    const m = q.prompt.match(/A (\d+) in\. × (\d+) in\. [a-z]+ is .+? (?:to|at) (\d+) in\. × (\d+) in\./);
    if (!m) return undefined;
    const w = Q(+m[3], +m[1]), h = Q(+m[4], +m[2]), same = w.eq(h);
    return choiceWhere(q, c => {
      let x = c.match(/^Yes: both sides are ×(\S+) \((\d+) ÷ (\d+) = (\d+) ÷ (\d+)\)$/);
      if (x) return same && val(x[1])?.eq(w) && +x[2] === +m[3] && +x[3] === +m[1] && +x[4] === +m[4] && +x[5] === +m[2];
      x = c.match(/^No: the width is ×(\S+) but the height is ×(.+)$/);
      if (x) return !same && val(x[1])?.eq(w) && val(x[2])?.eq(h);
      return false;   // "still a rectangle", "grew by the same amount", "different amounts", "the width doubled", "never the same shape"
    });
  },
  fixIt(q) {
    const m = q.prompt.match(/A (\d+) in\. × (\d+) in\. [a-z]+ was [a-z]+ to .+? Keep the width at (\d+) inches\. What height/);
    if (m) return Q(+m[2]).mul(Q(+m[3], +m[1])).value;
    const n = q.prompt.match(/A (\d+) in\. × (\d+) in\. [a-z]+ was [a-z]+ to .+? Keep the height at (\d+) inches\. What width/);
    if (n) return Q(+n[1]).mul(Q(+n[3], +n[2])).value;
    return undefined;
  },
};
/** the side marked ? on the copy: the factor times the matching side of the original */
function sideAsked(q) {
  const k = factor(q.prompt), [A, B] = shown(q);
  if (!k || !A || !B) return undefined;
  const c = correspond(A, B);
  if (!c) return undefined;
  for (let i = 0; i < A.pts.length; i++) {
    if (lab(B.labels?.[c.emap[i]]) === '?') {
      const a = known(A, i);
      return a ? a.mul(k).value : undefined;
    }
  }
  return undefined;
}

// ---------------------------------------------------------------- sane
function sane(q) {
  const out = [], p = q.prompt;
  const figs = shown(q);
  // a label that does not match its drawn side (the copy's labels against the original's, scaled)
  if (['nameK', 'computeSide', 'reduce', 'nonInt', 'refute', 'allRatios', 'angleCheck', 'resize'].includes(q.family) && figs.length >= 2) {
    const [A, B] = figs, c = correspond(A, B);
    if (c && c.score < 1e-6) {
      const scaleA = A.pts.map((_, i) => { const v = labVal(A.labels?.[i]); return v ? v.value / len(edges(A)[i]) : null; }).filter(x => x);
      if (scaleA.some(x => Math.abs(x - scaleA[0]) > 1e-6)) out.push('the original is not drawn to its labels');
    }
  }
  if (q.family === 'partner' && /(turned|flipped over)\./.test(p)) {
    const [A, B] = figs, c = A && B ? correspond(A, B) : null;
    if (c && c.score < 1e-6) {
      const area = P => P.reduce((t, a, i) => { const b = P[(i + 1) % P.length]; return t + a[0] * b[1] - a[1] * b[0]; }, 0);
      const flipped = Math.sign(area(A.pts)) !== Math.sign(area(c.vmap.map(j => B.pts[j])));
      if (/turned\./.test(p) && flipped) out.push('"turned", but the copy is flipped over');
      if (/flipped over\./.test(p) && !flipped) out.push('"flipped over", but the copy is only turned');
    }
  }
  if (q.input === 'choice') {
    let r; try { r = F[q.family]?.(q); } catch { r = undefined; }
    if (r === -1) out.push('no single right choice');
  }
  return [...new Set(out)].join('; ');
}

export default {
  solve(q) {
    const f = F[q.family];
    if (!f) return undefined;
    try { return f(q); } catch { return undefined; }
  },
  sane,
};
