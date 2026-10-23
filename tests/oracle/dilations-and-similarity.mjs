// Oracle for the lesson "dilations-and-similarity" (8.G.A.3-5). Written from what the student sees only: the prompt,
// the board, the choices and the drawn picture (corner coordinates, the side and angle labels, the equal-angle arcs,
// the right-angle marks). Never the replay-only data (sim / seq / hi / ask.ans / hidden figures): those appear after a
// miss. Similarity is decided by the maths (side ratios and angles under a correspondence, transformations applied to
// the drawn corners); each choice is judged by the truth of its own claim AND its reason.
// See docs/lessons/QUALITY_LAYER.md, "O: the oracle".
import { Q, nums, choiceWhere } from '../../tools/quality/oracle-kit.mjs';

const EPS = 1e-6;
const DEG = 180 / Math.PI;

// ---------------------------------------------------------------- reading values
const mt = s => String(s ?? '').replace(/[−–]/g, '-');
/** '1/2' → Q(1,2), '-3' → Q(-3), '1.5' → Q(3,2) */
function qv(s) {
  const t = mt(s).trim();
  const m = t.match(/^(-?[\d.]+)\/([\d.]+)$/);
  if (m) return qv(m[1]).div(qv(m[2]));
  const d = t.match(/^(-?)(\d*)(?:\.(\d+))?$/);
  if (!d || (d[2] === '' && !d[3])) throw new Error(`not a number: ${s}`);
  const den = d[3] ? 10 ** d[3].length : 1, n = Number((d[2] || '0') + (d[3] || ''));
  return Q(d[1] ? -n : n, den);
}
const NUM = '(-?\\d+(?:\\.\\d+)?(?:\\/\\d+)?)';
/** an exact value as a student types it in a coordinate box: a number (−1.5) */
const out = q => q.value;
/** a drawn ratio as an exact fraction with a small denominator */
function ratQ(v) {
  for (let d = 1; d <= 60; d++) { const n = Math.round(v * d); if (Math.abs(n / d - v) < 1e-7) return Q(n, d); }
  return null;
}
const near = (a, b, t = 1e-6) => Math.abs(a - b) <= t * Math.max(1, Math.abs(a), Math.abs(b));
/** "k = 3/2" / "k = 1.5" anywhere in a text */
function kOf(text) {
  const m = mt(text).match(new RegExp('k = ' + NUM));
  return m ? qv(m[1]) : null;
}
/** named points "X(1, −1)" in a text */
function points(text) {
  const o = {};
  for (const m of mt(text).matchAll(new RegExp('\\b([A-Z])(′*)\\(' + NUM + ', ' + NUM + '\\)', 'g'))) o[m[1] + m[2]] = [qv(m[3]), qv(m[4])];
  return o;
}
/** the first "(a, b)" in a text */
function pairIn(text) {
  const m = mt(text).match(new RegExp('\\(' + NUM + ', ' + NUM + '\\)'));
  return m ? [qv(m[1]), qv(m[2])] : null;
}
const samePt = (a, b) => a && b && a[0].eq(b[0]) && a[1].eq(b[1]);

// ---------------------------------------------------------------- statements "△ABC ~ △DEF"
function stmt(text) {
  const m = String(text).match(/(?:△)?([A-Z]{3,4})\s*~\s*(?:△)?([A-Z]{3,4})\b/);
  return m ? [m[1], m[2]] : null;
}
/** letter map of a statement: A → D, B → E ... */
const mapOf = ([a, b]) => Object.fromEntries([...a].map((c, i) => [c, b[i]]));
const invMap = mp => Object.fromEntries(Object.entries(mp).map(([k, v]) => [v, k]));
const sameSide = (s, t) => s.length === 2 && t.length === 2 && (s === t || s === t[1] + t[0]);
const mapSide = (mp, s) => [...s].map(c => mp[c]).join('');

// ---------------------------------------------------------------- the picture
const pic = q => q.data?.picture ?? {};
const figs = q => (pic(q).figs ?? []).filter(f => !f.hidden);
const len2 = (p, r) => Math.hypot(r[0] - p[0], r[1] - p[1]);
/** drawn interior angle at corner i (degrees) */
function geoAng(pts, i) {
  const n = pts.length, p = pts[i], a = pts[(i + n - 1) % n], b = pts[(i + 1) % n];
  const u = [a[0] - p[0], a[1] - p[1]], v = [b[0] - p[0], b[1] - p[1]];
  return Math.acos(Math.max(-1, Math.min(1, (u[0] * v[0] + u[1] * v[1]) / (Math.hypot(...u) * Math.hypot(...v))))) * DEG;
}
const labelNum = s => (s == null ? null : (m => (m ? Number(m[0]) : null))(String(s).match(/\d+(\.\d+)?/)));
/** the figure that carries a corner letter (labels may carry primes) */
function figWith(q, letter) {
  for (const f of figs(q)) { const i = (f.labels ?? []).indexOf(letter); if (i >= 0) return { f, i }; }
  return null;
}
/** what the student can read about a corner: its angle label, its arc count, its drawn angle */
function corner(f, i) { return { ang: labelNum(f.angs?.[i]), mark: f.marks?.[i] ?? null, geo: geoAng(f.pts, i), right: (f.rights ?? []).includes(i) }; }
/** two corners show the same angle: by the labels when both have one, else by the arcs, else by the drawing */
function sameCorner(a, b) {
  if (a.ang != null && b.ang != null) return a.ang === b.ang;
  if (a.mark != null && b.mark != null && a.mark > 0 && b.mark > 0) return a.mark === b.mark;
  return Math.abs(a.geo - b.geo) < 0.5;
}
/** the angle at a corner letter, in degrees, from the labels (else from the triangle's other two labels, else drawn) */
function angleAt(q, letter, known = {}) {
  if (known[letter] != null) return known[letter];
  const w = figWith(q, letter);
  if (!w) return null;
  const { f, i } = w;
  const L = f.labels;
  const val = j => known[L[j]] ?? labelNum(f.angs?.[j]) ?? ((f.rights ?? []).includes(j) ? 90 : null);
  if (val(i) != null) return val(i);
  const n = f.pts.length, others = L.map((_, j) => j).filter(j => j !== i).map(val);
  if (others.every(v => v != null)) return (n - 2) * 180 - others.reduce((s, v) => s + v, 0);
  return null;
}
/** the side lengths of a figure as labels: { 'AB': 3, ... } (numeric labels only) */
function sideLabels(f) {
  const o = {}, L = f.labels ?? [], n = f.pts.length;
  (f.lens ?? []).forEach((s, i) => { const v = s == null ? null : String(s).match(/^-?\d+(\.\d+)?$/) ? Number(s) : null; if (v != null && L.length) o[L[i] + L[(i + 1) % n]] = v; });
  return o;
}
function sideVal(q, s) {
  for (const f of figs(q)) { const o = sideLabels(f); for (const [k, v] of Object.entries(o)) if (sameSide(k, s)) return v; }
  return null;
}
/** two drawn polygons are similar (some correspondence, turned or flipped): side ratios and angles */
function similarPolys(A, B, tol = 1e-3) {
  const n = A.length;
  if (B.length !== n) return null;
  for (const dir of [1, -1]) for (let s = 0; s < n; s++) {
    const m = i => (((s + dir * i) % n) + n) % n;
    let k = null, ok = true;
    for (let i = 0; i < n && ok; i++) {
      const r = len2(B[m(i)], B[m(i + 1)]) / len2(A[i], A[(i + 1) % n]);
      if (k == null) k = r; else if (Math.abs(r - k) > tol * k) ok = false;
      if (Math.abs(geoAng(A, i) - geoAng(B, m(i))) > 0.05) ok = false;
    }
    if (ok) return { k, m };
  }
  return null;
}
/** do three side lengths a and b match in ratio under some order? (list of the orders that work, as permutations) */
function triOrders(a, b) {
  const perms = [[0, 1, 2], [0, 2, 1], [1, 0, 2], [1, 2, 0], [2, 0, 1], [2, 1, 0]];
  return perms.filter(p => { const k = b[p[0]] / a[0]; return near(b[p[1]] / a[1], k) && near(b[p[2]] / a[2], k); });
}

// ---------------------------------------------------------------- transformations, as the prompt words them
function parseMoves(text) {
  const s = mt(text);
  const moves = [];
  const re = /(dilate by (\S+) about the origin)|(translate (?:(\d+(?:\.\d+)?) (right|left))?(?: and )?(?:(\d+(?:\.\d+)?) (up|down))?(?: no steps)?)|(reflect over the (x|y)-axis)|(rotate (\d+)° ?(clockwise|counterclockwise)? about the origin)/g;
  for (const m of s.matchAll(re)) {
    if (m[1]) moves.push({ kind: 'dil', k: qv(m[2]) });
    else if (m[3]) {
      const dx = m[4] ? qv(m[4]).mul(m[5] === 'left' ? -1 : 1) : Q(0), dy = m[6] ? qv(m[6]).mul(m[7] === 'down' ? -1 : 1) : Q(0);
      moves.push({ kind: 'slide', dx, dy });
    } else if (m[8]) moves.push({ kind: 'flip', axis: m[9] });
    else if (m[10]) {
      const deg = Number(m[11]);
      const ccw = m[12] === 'clockwise' ? -deg : deg;           // no direction: 180° (same either way)
      if (!m[12] && deg !== 180) return null;
      moves.push({ kind: 'turn', deg: ((ccw % 360) + 360) % 360 });
    }
  }
  return moves;
}
function applyMove(p, mv) {
  const [x, y] = p;
  switch (mv.kind) {
    case 'dil': return [x.mul(mv.k), y.mul(mv.k)];
    case 'slide': return [x.add(mv.dx), y.add(mv.dy)];
    case 'flip': return mv.axis === 'y' ? [x.neg(), y] : [x, y.neg()];
    case 'turn': return mv.deg === 0 ? [x, y] : mv.deg === 90 ? [y.neg(), x] : mv.deg === 180 ? [x.neg(), y.neg()] : mv.deg === 270 ? [y, x.neg()] : null;
    default: return null;
  }
}
const applyAll = (p, moves) => moves.reduce((a, mv) => (a ? applyMove(a, mv) : null), p);
const toQpt = p => [Q(p[0]), Q(p[1])];

// ---------------------------------------------------------------- the families
function solve(q) {
  const f = SOLVERS[q.family];
  return f ? f(q) : undefined;
}

const SOLVERS = {
  // a statement read letter by letter
  corrSide(q) {
    const st = stmt(q.prompt);
    if (!st) return undefined;
    const mp = mapOf(st);
    let m = q.prompt.match(/corresponds to ∠([A-Z])\?/);
    if (m) return choiceWhere(q, c => c.trim() === `∠${mp[m[1]]}`);
    m = q.prompt.match(/corresponds to ([A-Z]{2})\?/);
    if (!m) return undefined;
    const want = mapSide(mp, m[1]);
    return choiceWhere(q, c => { const x = c.match(/^side ([A-Z]{2})$/); return !!x && sameSide(x[1], want); });
  },
  corrStatement(q) {
    let want;                                                              // the letter map the statement must carry
    const ms = [...q.prompt.matchAll(/([A-Z]) → ([A-Z])/g)];
    if (ms.length >= 3) want = Object.fromEntries(ms.map(m => [m[1], m[2]]));
    else {
      // "△RST has angles R = 57°, ...": match each corner to the other triangle's corner with the same angle
      const F = figs(q);
      if (F.length < 2) return undefined;
      const [A, B] = F;
      want = {};
      for (let i = 0; i < A.labels.length; i++) {
        const hits = B.labels.map((_, j) => j).filter(j => sameCorner(corner(A, i), corner(B, j)));
        if (hits.length !== 1) return -1;
        want[A.labels[i]] = B.labels[hits[0]];
      }
    }
    return choiceWhere(q, c => { const s = stmt(c); if (!s) return false; const mp = mapOf(s); return Object.keys(want).every(k => mp[k] === want[k]); });
  },
  // the dilation of a point about a center
  dilPoint(q) { return dilate(q); },
  dilCenterOn(q) { return dilate(q); },
  ruleImage(q) {
    const k = kOf(q.prompt), P = Object.values(points(q.prompt))[0];
    if (!k || !P) return undefined;
    const im = [P[0].mul(k), P[1].mul(k)];
    if (q.input === 'pair') return im.map(out);
    return choiceWhere(q, c => samePt(pairIn(c), im));
  },
  ruleCenterTrap(q) {
    const p = mt(q.prompt);
    const m = p.match(new RegExp('about P\\(' + NUM + ', ' + NUM + '\\) with k = ' + NUM + '.*?([A-Z])\\(' + NUM + ', ' + NUM + '\\) → \\(' + NUM + ', ' + NUM + '\\)'));
    if (!m) return undefined;
    const C = [qv(m[1]), qv(m[2])], k = qv(m[3]), X = [qv(m[5]), qv(m[6])], said = [qv(m[7]), qv(m[8])];
    const im = [C[0].add(X[0].sub(C[0]).mul(k)), C[1].add(X[1].sub(C[1]).mul(k))];
    const origin = C[0].n === 0 && C[1].n === 0;
    return choiceWhere(q, c => {
      if (/^Yes/.test(c)) return samePt(said, im) && origin;              // "always multiplies" is only true about the origin
      if (/added to each coordinate/.test(c)) return false;                // a dilation never adds
      if (/the center is not the origin/.test(c)) return !origin && !samePt(said, im) && samePt(pairIn(c), im);
      return false;
    });
  },
  kEffect(q) {
    let k = kOf(q.prompt);
    if (!k) { const m = mt(q.prompt).match(new RegExp('→ \\(' + NUM + '?x, ' + NUM + '?y\\)')); if (m) k = qv(m[1] ?? '1'); }
    if (!k) { const m = mt(q.board).match(/\\to \((?:\\tfrac\{(\d+)\}\{(\d+)\}|(\d+(?:\.\d+)?))?\s*(?:\\cdot\s*)?x/); if (m) k = m[1] ? Q(Number(m[1]), Number(m[2])) : qv(m[3] ?? '1'); }
    if (!k) return undefined;
    const c1 = k.cmp(1);
    return choiceWhere(q, c => {
      let ok;
      if (/same size|congruent/.test(c)) ok = c1 === 0;
      else if (/larger|enlargement/.test(c)) ok = c1 > 0;
      else if (/smaller|reduction/.test(c)) ok = c1 < 0;
      else return false;
      const x = mt(c).match(new RegExp('× ' + NUM));
      return ok && (!x || qv(x[1]).eq(k));
    });
  },
  // what a move keeps
  angleKeep(q) {
    const known = {};
    for (const m of q.prompt.matchAll(/∠([A-Z]) = (\d+(?:\.\d+)?)°/g)) known[m[1]] = Number(m[2]);
    const m = q.prompt.match(/What is ∠([A-Z])′\?/);
    if (!m || !/dilation/.test(q.prompt)) return undefined;
    return angleAt(q, m[1], known) ?? undefined;                           // a dilation keeps every angle
  },
  orientKeep(q) {
    const m = q.prompt.match(/goes (clockwise|counterclockwise)\. Dilate about P with k = (\S+)\./);
    if (!m) return undefined;
    if (qv(m[2]).cmp(0) <= 0) return undefined;                            // only positive k in this lesson
    return choiceWhere(q, c => c.trim() === m[1]);                         // a dilation (k > 0) keeps the way round
  },
  propTable(q) {
    const p = q.prompt;
    let want;
    if (/by a translation|rotation/.test(p)) want = { ang: 'kept', len: 'kept', ord: 'kept' };
    else if (/by a reflection/.test(p)) want = { ang: 'kept', len: 'kept', ord: 'reversed' };
    else { const m = mt(p).match(new RegExp('by a dilation by ' + NUM)); if (!m) return undefined; want = { ang: 'kept', len: qv(m[1]), ord: 'kept' }; }
    return choiceWhere(q, c => {
      const m = mt(c).match(new RegExp('^angles (kept|changed|× ' + NUM + ') · lengths (kept|× ' + NUM + ') · order (kept|reversed)$'));
      if (!m) return false;
      if (m[1] !== 'kept') return false;
      const lenOk = want.len === 'kept' ? m[3] === 'kept' || (m[4] && qv(m[4]).eq(1)) : m[4] ? qv(m[4]).eq(want.len) : want.len.eq(1);
      return lenOk && m[5] === want.ord;
    });
  },
  // the shared ratio image / original
  ratioK(q) {
    const F = figs(q);
    const img = F.find(f => (f.labels ?? []).some(l => /′/.test(l))), org = F.find(f => f !== img && (f.labels ?? []).length);
    if (!img || !org) return undefined;
    const ratios = [];
    const so = sideLabels(org), si = sideLabels(img);
    for (const [s, v] of Object.entries(so)) { const t = s.split('').map(c => c + '′').join(''); for (const [u, w] of Object.entries(si)) if (u === t || u === t.slice(2) + t.slice(0, 2)) ratios.push(qv(String(w)).div(qv(String(v)))); }
    if (!ratios.length) {
      // no length labels: measure the drawing (grid figures)
      const n = org.pts.length;
      for (let i = 0; i < n; i++) {
        const j = img.labels.indexOf(org.labels[i] + '′'), j2 = img.labels.indexOf(org.labels[(i + 1) % n] + '′');
        if (j < 0 || j2 < 0) return undefined;
        const r = len2(img.pts[j], img.pts[j2]) / len2(org.pts[i], org.pts[(i + 1) % n]);
        const rq = ratQ(r);
        if (!rq) return undefined;
        ratios.push(rq);
      }
    }
    if (ratios.some(r => !r.eq(ratios[0]))) return undefined;
    // "What scale factor takes X to Y?": Y over X (default: image over original)
    const t = q.prompt.match(/takes (?:△)?(\S+?) to (?:△)?(\S+?)\?/);
    if (t && /′/.test(t[1]) && !/′/.test(t[2])) return Q(1).div(ratios[0]).pair;
    return ratios[0].pair;
  },
  addVsMult(q) {
    const m = q.prompt.match(/has sides (\S+) and (\S+)\. Copy (\d) has (\S+) and (\S+); copy (\d) has (\S+) and (\S+)\./);
    if (!m) return undefined;
    const a = qv(m[1]), b = qv(m[2].replace(/\.$/, ''));
    const ok = {};
    ok[m[3]] = qv(m[4]).div(a).eq(qv(m[5]).div(b));
    ok[m[6]] = qv(m[7]).div(a).eq(qv(m[8]).div(b));
    return choiceWhere(q, c => {
      if (/^both copies$/.test(c)) return ok[m[3]] && ok[m[6]];
      if (/^neither/.test(c)) return !ok[m[3]] && !ok[m[6]];
      const x = c.match(/^copy (\d)$/);
      return !!x && ok[x[1]] && !ok[x[1] === m[3] ? m[6] : m[3]];
    });
  },
  // similar = dilate, then rigid motions
  simYesNo(q) {
    const F = figs(q);
    const P = F.find(f => f.tag === 'P'), R = F.find(f => f.tag === 'Q');
    if (!P || !R) return undefined;
    const sim = !!similarPolys(P.pts, R.pts);
    const p = q.prompt;
    const stretch = /stretching/.test(p);
    const dm = mt(p).match(new RegExp('dilate by ' + NUM));
    const k = dm ? qv(dm[1]) : null;
    return choiceWhere(q, c => {
      if (/^Yes/.test(c)) {
        if (!sim) return false;
        if (/k = (\S+) is allowed, so congruent/.test(c)) return !!k && k.eq(1) && qv(c.match(/k = (\S+) is/)[1]).eq(1);
        if (/a dilation followed by a rigid motion/.test(c)) return !!k && !stretch;
        return false;                                                      // looks / "one transformation" are no reasons
      }
      if (/^No/.test(c)) {
        if (sim) return false;
        return /one-way stretch is not a dilation/.test(c) && stretch;
      }
      return false;
    });
  },
  simSeq(q) {
    const P = Object.values(points(q.prompt))[0];
    const mv = parseMoves(q.prompt.replace(/Dilate/, 'dilate'));
    if (!P || !mv || !mv.length) return undefined;
    const r = applyAll(P, mv);
    return r ? r.map(out) : undefined;
  },
  corrRotated(q) {
    const m = q.prompt.match(/Which corner corresponds to ([A-Z])\?/);
    const F = figs(q);
    if (!m || F.length < 2) return undefined;
    const [A, B] = F, i = A.labels.indexOf(m[1]);
    if (i < 0) return undefined;
    const hits = B.labels.map((_, j) => j).filter(j => sameCorner(corner(A, i), corner(B, j)));
    if (hits.length !== 1) return -1;
    return choiceWhere(q, c => c.trim() === B.labels[hits[0]]);
  },
  kFromSides(q) {
    const st = stmt(q.board) ?? stmt(q.prompt);
    const m = q.prompt.match(/scale factor from (?:△)?([A-Z]{3,4}) to (?:△)?([A-Z]{3,4})/);
    const given = {};
    for (const x of mt(q.board).matchAll(/([A-Z]{2}) = (\d+(?:\.\d+)?)/g)) given[x[1]] = qv(x[2]);
    if (!st || !m) return undefined;
    const mp = mapOf(st);
    for (const [s, v] of Object.entries(given)) {
      const t = mapSide(mp, s);
      const w = Object.entries(given).find(([u]) => sameSide(u, t));
      if (!w) continue;
      // s is in the first triangle of the statement, t its partner in the second
      const k12 = w[1].div(v);
      if (st[0].includes(s[0]) && m[1] === st[0]) return k12.pair;
      if (st[0].includes(s[0]) && m[1] === st[1]) return Q(1).div(k12).pair;
    }
    return undefined;
  },
  simCheck(q) {
    const F = figs(q);
    if (F.length < 2) return undefined;
    const [A, B] = F;
    const pm = {};
    for (const x of q.prompt.matchAll(/([A-Z]) ↔ ([A-Z])/g)) pm[x[1]] = x[2];
    // the "…": the rest in the same order
    A.labels.forEach((l, i) => { if (!pm[l]) pm[l] = B.labels[i]; });
    const n = A.labels.length, sa = sideLabels(A), sb = sideLabels(B);
    const ratio = s => { const a = Object.entries(sa).find(([u]) => sameSide(u, s)), b = Object.entries(sb).find(([u]) => sameSide(u, mapSide(pm, s))); return a && b ? qv(String(b[1])).div(qv(String(a[1]))) : null; };
    const sides = A.labels.map((l, i) => l + A.labels[(i + 1) % n]);
    const rs = sides.map(ratio);
    if (rs.some(r => !r)) return undefined;
    const angOk = A.labels.every((l, i) => { const j = B.labels.indexOf(pm[l]); const a = corner(A, i), b = corner(B, j); return a.right === b.right && sameCorner(a, b); });
    const similar = angOk && rs.every(r => r.eq(rs[0]));
    const named = s => { const x = s.match(/^([A-Z]{2})\/([A-Z]{2})$/); if (!x) return null; const r = ratio(x[2]); return r && sameSide(mapSide(pm, x[2]), x[1]) ? r : null; };
    return choiceWhere(q, c => {
      let x;
      if ((x = c.match(/^Similar: every side ratio is (\S+) and every angle matches\.$/))) return similar && qv(x[1]).eq(rs[0]);
      if ((x = c.match(/^Not similar: (\S+) = (\S+) but (\S+) = (\S+)\.$/))) {
        const r1 = named(x[1]), r2 = named(x[3]);
        return !similar && !!r1 && !!r2 && r1.eq(qv(x[2])) && r2.eq(qv(x[4])) && !r1.eq(r2);
      }
      if (/^Similar: every angle matches its partner\.$/.test(c)) return similar && n === 3;   // enough for triangles only
      return false;                                                        // one ratio, "bigger", "grew by amounts", looks
    });
  },
  rectRhombus(q) {
    const p = q.prompt;
    let m, similar, k = null, texts = {};
    if ((m = p.match(/is a rhombus with sides (\S+) and a (\d+)° angle; \S+ is a rhombus with sides (\S+) and a (\d+)° angle/))) {
      const a1 = Number(m[2]), a2 = Number(m[4]);
      similar = a1 === a2 || a1 === 180 - a2;
      k = qv(m[3]).div(qv(m[1]));
      texts = { angles: [a1, a2] };
      return choiceWhere(q, c => {
        let x;
        if ((x = c.match(/^Yes: every side ratio is (\S+) and the angles match\.$/))) return similar && qv(x[1]).eq(k);
        if ((x = c.match(/^No: the angles are different \((\d+)° and (\d+)°\)\.$/))) return !similar && Number(x[1]) === a1 && Number(x[2]) === a2;
        return false;                                                      // sizes, "can't compare", ratio alone, "both rhombi"
      });
    }
    if ((m = p.match(/Rectangle \S+ is (\S+) by (\S+); rectangle \S+ is (\S+) by (\S+)\./))) {
      const [a, b, c2, d] = [m[1], m[2], m[3], m[4]].map(qv);
      const r1 = c2.div(a), r2 = d.div(b);
      similar = r1.eq(r2) || c2.div(b).eq(d.div(a));
      return choiceWhere(q, c => {
        let x;
        if ((x = c.match(/^Yes: both sides × (\S+), and all angles are 90°\.$/))) return similar && r1.eq(r2) && qv(x[1]).eq(r1);
        if ((x = c.match(/^No: (\S+) = (\S+) but (\S+) = (\S+)\.$/))) {
          // the two side ratios, whatever way they are written: their values must be r1 and r2, and differ
          const v = [x[1], x[2], x[3], x[4]].map(qv);
          return !similar && v[0].eq(v[1]) && v[2].eq(v[3]) && ((v[0].eq(r1) && v[2].eq(r2)) || (v[0].eq(r2) && v[2].eq(r1)));
        }
        return false;
      });
    }
    return undefined;
  },
  // lengths
  lenK(q) {
    const st = stmt(q.prompt);
    const m = mt(q.prompt).match(new RegExp('scale factor k = ' + NUM + ' from (?:△)?([A-Z]{3,4}) to (?:△)?([A-Z]{3,4})\\. ([A-Z]{2}) = ' + NUM + '\\. How long is ([A-Z]{2})\\?'));
    if (!st || !m) return undefined;
    const k = qv(m[1]), from = m[2], s = m[4], v = qv(m[5]), t = m[6];
    const mp = mapOf(st), inv = invMap(mp);
    // k takes `from` to the other triangle
    const sInFrom = from.includes(s[0]) && from.includes(s[1]);
    const partner = sInFrom ? mapSide(st[0] === from ? mp : inv, s) : mapSide(st[0] === from ? inv : mp, s);
    if (!sameSide(partner, t)) return undefined;
    return (sInFrom ? v.mul(k) : v.div(k)).value;
  },
  lenFig(q) {
    const st = stmt(q.prompt);
    if (!st) return undefined;
    const mp = mapOf(st), inv = invMap(mp);
    const given = {};
    for (const x of mt(q.prompt).matchAll(/([A-Z]{2}) = (\d+(?:\.\d+)?)/g)) given[x[1]] = qv(x[2]);
    const t = q.prompt.match(/How long is ([A-Z]{2})\?/)?.[1];
    if (!t) return undefined;
    const partnerOf = s => (st[0].includes(s[0]) && st[0].includes(s[1]) ? mapSide(mp, s) : mapSide(inv, s));
    // k second/first from a pair with both known
    let k = null;
    for (const [s, v] of Object.entries(given)) {
      if (!(st[0].includes(s[0]) && st[0].includes(s[1]))) continue;
      const w = Object.entries(given).find(([u]) => sameSide(u, mapSide(mp, s)));
      if (w) { k = w[1].div(v); break; }
    }
    if (!k) return undefined;
    const pt = partnerOf(t);
    const g = Object.entries(given).find(([u]) => sameSide(u, pt));
    if (!g) return undefined;
    const tInFirst = st[0].includes(t[0]) && st[0].includes(t[1]);
    return (tInFirst ? g[1].div(k) : g[1].mul(k)).value;
  },
  // angles across similar figures
  angCorr(q) {
    const st = stmt(q.prompt);
    const m = q.prompt.match(/What is ∠([A-Z])\?/);
    if (!st || !m) return undefined;
    const inv = invMap(mapOf(st)), mp = mapOf(st);
    const partner = st[1].includes(m[1]) ? inv[m[1]] : mp[m[1]];
    return angleAt(q, partner) ?? undefined;
  },
  angThird(q) { return thirdAngle(q); },
  angThirdFlip(q) { return thirdAngle(q); },
  // contexts
  ctxShadow(q) {
    const m = mt(q.prompt).match(/a (.+?) (\d+(?:\.\d+)?) (inches|ft) tall casts a (\d+(?:\.\d+)?) ft shadow, and the (.+?) casts a (\d+(?:\.\d+)?) ft shadow.*in feet\?/);
    if (!m) return undefined;
    const h = qv(m[2]).div(m[3] === 'inches' ? 12 : 1);
    return h.mul(qv(m[6])).div(qv(m[4])).value;
  },
  ctxMetric(q) {
    const m = mt(q.prompt).match(/is (\d+(?:\.\d+)?) cm wide and (\d+(?:\.\d+)?) cm tall\. A similar .+? is (\d+(?:\.\d+)?) m wide\. How tall .*in centimeters\?/);
    if (!m) return undefined;
    return qv(m[2]).mul(qv(m[3]).mul(100)).div(qv(m[1])).value;
  },
  resize(q) {
    const m = mt(q.prompt).match(/is (\d+(?:\.\d+)?) (\w+) wide and (\d+(?:\.\d+)?) \2 tall\. It is resized to (\d+(?:\.\d+)?) \2 wide, keeping its shape/);
    if (!m) return undefined;
    return qv(m[3]).mul(qv(m[4])).div(qv(m[1])).value;
  },
  resizeJudge(q) {
    const m = mt(q.prompt).match(/An? (\S+) in by (\S+) in .+? is resized to (\S+) in by (\S+) in\./);
    if (!m) return undefined;
    const [a, b, c2, d] = [m[1], m[2], m[3], m[4]].map(qv);
    const r1 = c2.div(a), r2 = d.div(b), keep = r1.eq(r2);
    return choiceWhere(q, c => {
      let x;
      if ((x = mt(c).match(/^Yes: both sides × (\S+)\.$/))) return keep && qv(x[1]).eq(r1);
      if ((x = mt(c).match(/^No: (\S+) = (\S+) but (\S+) = (\S+)\.$/))) {
        const v = [x[1], x[2], x[3], x[4]].map(qv);
        return !keep && v[0].eq(v[1]) && v[2].eq(v[3]) && v[0].eq(r1) && v[2].eq(r2);
      }
      return false;                                                        // "grew by" amounts, "any resize distorts", "still a rectangle"
    });
  },
  // claims
  allSimilar(q) {
    const p = q.prompt;
    const claim = (p.match(/“All (.+?) are similar\.”/) ?? [])[1];
    if (!claim) return undefined;
    const TRUE = { squares: true, 'equilateral triangles': true, rhombi: false, rectangles: false, 'right triangles': false };
    if (!(claim in TRUE)) return undefined;
    const truth = TRUE[claim];
    const drawn = nums(p);
    return choiceWhere(q, c => {
      let x;
      if (/^True/.test(c)) return truth && /have one side ratio for every side and equal angles/.test(c);
      if (!/^False/.test(c) || truth) return false;
      // a counterexample must really have a different shape from the drawn ones
      if (claim === 'rhombi' && (x = c.match(/a square is a rhombus too, but its angles are (\d+)°/))) { const a = Number(x[1]), d = drawn[0]; return a === 90 && d !== 90; }
      if (claim === 'right triangles' && (x = mt(c).match(/legs (\S+) and (\S+) has a different shape/))) {
        const m2 = mt(p).match(/legs (\S+), (\S+) and/);
        if (!m2) return false;
        const r = qv(x[1]).div(qv(x[2])), r0 = qv(m2[1]).div(qv(m2[2]));
        return !r.eq(r0) && !r.eq(Q(1).div(r0));
      }
      if (claim === 'rectangles' && (x = mt(c).match(/a (\S+) by (\S+) rectangle is not similar to the (\S+) by (\S+) one/))) {
        const r = qv(x[1]).div(qv(x[2])), r0 = qv(x[3]).div(qv(x[4]));
        return !r.eq(r0) && !r.eq(Q(1).div(r0));
      }
      return false;                                                        // "different sizes are not similar"
    });
  },
  stmtCheck(q) {
    const st = stmt(q.prompt);
    const F = figs(q);
    if (!st || F.length < 2) return undefined;
    const right = trueMap(F);
    if (!right) return -1;
    const ok = s => { const mp = mapOf(s); return Object.keys(right).every(k => mp[k] === right[k]); };
    return choiceWhere(q, c => {
      if (/^Right as written/.test(c)) return ok(st);
      if (/^Wrong order/.test(c)) { const s = stmt(c); return !ok(st) && !!s && ok(s); }
      return false;                                                        // they are similar (said and drawn)
    });
  },
  otherOrder(q) {
    const F = figs(q);
    if (F.length < 2) return undefined;
    const [A, B] = F;
    const la = Object.values(sideLabels(A)), lb = Object.values(sideLabels(B));
    if (la.length !== 3 || lb.length !== 3) return undefined;
    const sa = sideLabels(A), sb = sideLabels(B);
    const orders = triOrders(la, lb);
    const similar = orders.length > 0;
    return choiceWhere(q, c => {
      let x;
      if ((x = mt(c).match(/tried the wrong order: (?:△)?([A-Z]{3}) ~ (?:△)?([A-Z]{3}) gives (\S+) for every pair\./))) {
        const mp = mapOf([x[1], x[2]]);
        const rs = Object.entries(sa).map(([s, v]) => { const w = Object.entries(sb).find(([u]) => sameSide(u, mapSide(mp, s))); return w ? w[1] / v : NaN; });
        return similar && rs.every(r => near(r, qv(x[3]).value));
      }
      if ((x = mt(c).match(/^Not enough alone, but they are not similar: even shortest-to-shortest gives (\S+) ≠ (\S+)\.$/))) {
        if (similar) return false;
        const a = [...la].sort((u, v) => u - v), b = [...lb].sort((u, v) => u - v);
        const rs = a.map((v, i) => b[i] / v);
        return near(rs[0], qv(x[1]).value) && rs.some(r => near(r, qv(x[2]).value)) && !near(qv(x[1]).value, qv(x[2]).value);
      }
      return false;                                                        // "one order fails", "+2 longer", turned, "ratios don't match"
    });
  },
  enough(q) {
    const p = q.prompt;
    const F = figs(q);
    const verdict = (() => {
      if (/all four angle pairs are equal .*no side lengths/.test(p)) return 'open';
      if (/= \S+ and [A-Z]{2} = \S+, nothing else/.test(p)) return 'open';
      if (/a dilation by \S+ followed by a (rotation|reflection|translation) maps/.test(p)) return 'yes';
      if (/ruler measurements/.test(p)) {
        // rounded to tenths: a common ratio inside every pair's error range leaves it open; none disproves
        const [A, B] = F;
        const la = (A.lens ?? []).map(labelNum), lb = (B.lens ?? []).map(labelNum);
        let lo = 0, hi = Infinity;
        la.forEach((v, i) => { lo = Math.max(lo, (lb[i] - 0.05) / (v + 0.05)); hi = Math.min(hi, (lb[i] + 0.05) / (v - 0.05)); });
        return lo <= hi ? 'open' : 'no';
      }
      if (/all three sides of each triangle|all sides, and equal-angle marks/.test(p)) {
        const st = stmt(p);
        const [A, B] = F;
        const sa = sideLabels(A), sb = sideLabels(B);
        const mp = mapOf(st);
        const rs = Object.entries(sa).map(([s, v]) => { const w = Object.entries(sb).find(([u]) => sameSide(u, mapSide(mp, s))); return w ? w[1] / v : NaN; });
        if (rs.length === 3 && rs.every(r => near(r, rs[0]))) return 'yes';
        return triOrders(Object.values(sa), Object.values(sb)).length ? 'other-order' : 'no';
      }
      return null;
    })();
    if (!verdict || verdict === 'other-order') return verdict ? -1 : undefined;
    return choiceWhere(q, c => (verdict === 'open' ? /^Not decidable/.test(c) : verdict === 'yes' ? /^Proved: they are similar/.test(c) : /^Proved: they are not similar/.test(c)));
  },
  aaQuad(q) {
    const m = mt(q.board).match(/\\dfrac\{([\d.]+)\}\{([\d.]+)\}\\ \\text\{and\}\\ \\dfrac\{([\d.]+)\}\{([\d.]+)\}/);
    if (!m) return undefined;
    // the board's two ratios are of the drawn partner sides: check them against the labels
    const F = figs(q);
    const [A, B] = F;
    const ra = (A.lens ?? []).map(labelNum), rb = (B.lens ?? []).map(labelNum);
    const r1 = rb[0] / ra[0], r2 = rb[1] / ra[1];
    const sim = near(r1, r2);
    return choiceWhere(q, c => {
      let x;
      if ((x = mt(c).match(/^Not similar: equal angles aren't enough for four sides; (\S+) ≠ (\S+)\.$/))) return !sim && near(qv(x[1]).value, r1) && near(qv(x[2]).value, r2);
      if ((x = mt(c).match(/^Similar: the angles match AND both side ratios are (\S+)\.$/))) return sim && near(qv(x[1]).value, r1);
      return false;                                                        // looks, "more than AA", sizes
    });
  },
  measured(q) {
    if (/^Which of these proves/.test(q.prompt)) return choiceWhere(q, c => /^A dilation by \S+ about [A-Z], then a rigid motion, maps/.test(c));
    if (/measured the drawing/.test(q.prompt)) return choiceWhere(q, c => /^No: rounded measurements only suggest it/.test(c));
    return undefined;
  },
  witnessPick(q) {
    const F = figs(q);
    if (F.length < 2) return undefined;
    const [A, B] = F;
    const pm = {};
    for (const x of q.prompt.matchAll(/([A-Z]) → ([A-Z])/g)) pm[x[1]] = x[2];
    return choiceWhere(q, c => {
      const mv = parseMoves(c);
      if (!mv || !mv.length) return false;
      return A.labels.every((l, i) => {
        const j = B.labels.indexOf(pm[l]);
        if (j < 0) return false;
        const r = applyAll(toQpt(A.pts[i]), mv);
        return r && samePt(r, toQpt(B.pts[j]));
      });
    });
  },
  aaArgue(q) {
    const p = q.prompt;
    let m;
    if ((m = mt(p).match(/a rigid motion puts ([A-Z]) on ([A-Z]), with ray ([A-Z]{2}) along ray ([A-Z]{2}).*?\3 = (\S+), \4 = (\S+)\. Which dilation/))) {
      const k = qv(m[6].replace(/,$/, '')).div(qv(m[5].replace(/,$/, '')));
      return choiceWhere(q, c => { const x = mt(c).match(/^Dilate about ([A-Z]) with k = (\S+)\.$/); return !!x && x[1] === m[2] && qv(x[2]).eq(k); });
    }
    if (/What is the first step\?/.test(p)) {
      const eq = [...p.matchAll(/∠([A-Z]) = ∠([A-Z])/g)].map(x => x[1] + x[2]);
      return choiceWhere(q, c => { const x = c.match(/^A rigid motion that puts ∠([A-Z]) exactly on ∠([A-Z]), rays along rays\.$/); return !!x && eq.includes(x[1] + x[2]); });
    }
    return undefined;
  },
  aaWhy(q) {
    const p = q.prompt;
    let m;
    if ((m = p.match(/puts ([A-Z]) on ([A-Z]) with ray [A-Z]{2} along ray [A-Z]{2}\. Why does ray/))) {
      const b = q.board.match(/\\angle ([A-Z]) = \\angle ([A-Z]) = (\d+)/);
      return choiceWhere(q, c => { const x = c.match(/^Because ∠([A-Z]) = ∠([A-Z]) = (\d+)°: the same opening from the same ray\.$/); return !!x && x[1] === m[1] && x[2] === m[2] && !!b && b[3] === x[3]; });
    }
    if ((m = p.match(/([A-Z])″ is on ([A-Z]) and ([A-Z])″ is on ([A-Z]) .*Why must ([A-Z])″ land on ([A-Z])\?/))) {
      const [U, V, W] = [m[2], m[4], m[6]];
      return choiceWhere(q, c => { const x = c.match(/^The equal angles put its two sides along ([A-Z]{2}) and ([A-Z]{2}), and those lines meet only at ([A-Z])\.$/); return !!x && x[3] === W && [x[1], x[2]].some(s => sameSide(s, U + W)) && [x[1], x[2]].some(s => sameSide(s, V + W)); });
    }
    return undefined;
  },
  aaDecide(q) {
    const m = q.prompt.match(/has angles (\d+)° and (\d+)°\. \S+ has angles (\d+)° and (\d+)°\./);
    if (!m) return undefined;
    const t1 = [Number(m[1]), Number(m[2])], t2 = [Number(m[3]), Number(m[4])];
    t1.push(180 - t1[0] - t1[1]); t2.push(180 - t2[0] - t2[1]);
    const key = t => [...t].sort((a, b) => a - b).join();
    const sim = key(t1) === key(t2);
    return choiceWhere(q, c => {
      let x;
      if (/^Similar: two pairs of equal angles are enough \(AA\)\.$/.test(c)) return sim;
      if ((x = c.match(/^Not similar: the angles don't all match \((\d+), (\d+), (\d+) vs (\d+), (\d+), (\d+)\)\.$/))) {
        return !sim && key([x[1], x[2], x[3]].map(Number)) === key(t1) && key([x[4], x[5], x[6]].map(Number)) === key(t2);
      }
      return false;
    });
  },
};

function dilate(q) {
  const p = mt(q.prompt);
  const c = p.match(new RegExp('center P\\(' + NUM + ', ' + NUM + '\\)'));
  const k = kOf(p);
  const t = p.match(new RegExp('Where does ([A-Z])\\(' + NUM + ', ' + NUM + '\\) land'));
  if (!c || !k || !t) return undefined;
  const C = [qv(c[1]), qv(c[2])], X = [qv(t[2]), qv(t[3])];
  return [C[0].add(X[0].sub(C[0]).mul(k)), C[1].add(X[1].sub(C[1]).mul(k))].map(out);
}
function thirdAngle(q) {
  const st = stmt(q.prompt);
  const m = q.prompt.match(/What is ∠([A-Z])\?/);
  if (!st || !m) return undefined;
  const mp = mapOf(st), inv = invMap(mp);
  const toFirst = l => (st[0].includes(l) ? l : inv[l]);
  const known = {};
  for (const x of q.prompt.matchAll(/∠([A-Z]) = (\d+)°/g)) known[toFirst(x[1])] = Number(x[2]);
  const ask = toFirst(m[1]);
  if (known[ask] != null) return known[ask];
  const others = [...st[0]].filter(l => l !== ask);
  if (others.some(l => known[l] == null)) return undefined;
  return 180 - known[others[0]] - known[others[1]];
}
/** the letter map between the two drawn triangles, by their angles (labels / arcs / drawing) */
function trueMap(F) {
  const [A, B] = F, o = {};
  for (let i = 0; i < A.labels.length; i++) {
    const hits = B.labels.map((_, j) => j).filter(j => sameCorner(corner(A, i), corner(B, j)));
    if (hits.length !== 1) return null;
    o[A.labels[i]] = B.labels[hits[0]];
  }
  return o;
}

// ---------------------------------------------------------------- sane: what is impossible or unfair in the item
const SIZES_M = { 'real door': [0.6, 1.5], 'wall screen': [0.4, 3], poster: [0.2, 2], banner: [0.3, 6] };
const MIN_FT = { tree: 6, building: 10, tower: 15, flagpole: 10, 'light pole': 8 };

function sane(q) {
  const o = [];
  const p = q.prompt;
  let m;
  // grammar a student trips over
  if ((m = p.match(/\b[aA] ([A-Z][a-z]+)\b/)) && !/^(A|The)$/.test(m[1])) o.push(`"a ${m[1]}": an article before a name`);
  if ((m = p.match(/\b(A|a) (8|11|18|80)(\.\d+)?\b(?! [a-z]*\/)/))) o.push(`"${m[1]} ${m[2]}…" should be "an"`);
  for (const c of q.choices ?? []) {
    if ((m = mt(c).match(/(\d+(?:\.\d+)?\/\d+|\d+(?:\.\d+)?) = \1 but (\S+) = \2\b/))) o.push(`choice "${c}" writes a ratio as itself (x = x)`);
    if (/grew by different amounts \(-/.test(c)) o.push(`choice "${c}": a shrink called "grew", with a hyphen as minus`);
  }
  // drawn labels against the drawing
  for (const f of figs(q)) {
    const n = f.pts.length;
    (f.angs ?? []).forEach((a, i) => { const v = labelNum(a); if (v != null && Math.abs(geoAng(f.pts, i) - v) > 1.5) o.push(`angle label ${a} at ${f.labels?.[i] ?? i} is drawn as ${geoAng(f.pts, i).toFixed(1)}°`); });
    const ls = (f.lens ?? []).map((s, i) => (s != null && /^\d+(\.\d+)?$/.test(String(s)) ? len2(f.pts[i], f.pts[(i + 1) % n]) / Number(s) : null)).filter(v => v != null);
    if (ls.some(r => Math.abs(r - ls[0]) > 0.02 * ls[0])) o.push('side labels not in proportion to the drawn sides');
    if (n === 3 && (f.angs ?? []).filter(a => a != null).length === 3 && (f.angs ?? []).map(labelNum).reduce((s, v) => s + v, 0) !== 180) o.push('triangle angle labels do not add to 180°');
  }
  // the point in the prompt is the drawn corner; the center is the drawn pin
  const P = pic(q);
  if (/^(dilPoint|dilCenterOn|ruleImage|simSeq|ruleCenterTrap)$/.test(q.family)) {
    for (const [l, pt] of Object.entries(points(p))) {
      if (l === 'P' && P.center && /center P/.test(p)) { if (!(near(pt[0].value, P.center.p[0]) && near(pt[1].value, P.center.p[1]))) o.push('the center in the text is not the drawn center'); continue; }
      const w = figWith(q, l);
      if (w && !(near(pt[0].value, w.f.pts[w.i][0]) && near(pt[1].value, w.f.pts[w.i][1]))) o.push(`${l} in the text is not the drawn ${l}`);
    }
    if (q.family === 'dilCenterOn' && (m = p.match(/is on the corner ([A-Z])/)) && P.center) { const w = figWith(q, m[1]); if (w && !(near(w.f.pts[w.i][0], P.center.p[0]) && near(w.f.pts[w.i][1], P.center.p[1]))) o.push('the center is not on the named corner'); }
  }
  if (q.family === 'orientKeep' && (m = p.match(/goes (clockwise|counterclockwise)/))) {
    const f = figs(q)[0];
    const [a, b, c] = f.pts, cr = (b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0]);
    if ((cr > 0) !== (m[1] === 'counterclockwise')) o.push('the stated way round is not the drawn one');
  }
  if (q.family === 'simYesNo') {
    const F = figs(q), A = F.find(f => f.tag === 'P'), B = F.find(f => f.tag === 'Q');
    const dm = mt(p).match(new RegExp('dilate by ' + NUM));
    if (A && B && dm) { const s = similarPolys(A.pts, B.pts); if (!s) o.push('the drawn Q is not similar to P although the moves say so'); else if (!near(s.k, qv(dm[1]).value, 1e-3)) o.push('the drawn Q is not the stated scale'); }
  }
  if (q.family === 'witnessPick') {
    const F = figs(q);
    for (const [l, pt] of Object.entries(points(p))) { const w = figWith(q, l); if (w && !(near(pt[0].value, w.f.pts[w.i][0]) && near(pt[1].value, w.f.pts[w.i][1]))) o.push(`${l} in the text is not the drawn ${l}`); }
    if (F.length < 2) o.push('no second triangle drawn');
  }
  if (q.family === 'measured' || (q.family === 'enough' && /a dilation by/.test(p))) {
    const F = figs(q);
    const km = mt(p + ' ' + (q.choices ?? []).join(' ')).match(/dilation by (\S+?)[ ,]/);
    if (km && F.length >= 2) { const s = similarPolys(F[0].pts, F[1].pts); if (!s || !near(s.k, qv(km[1]).value, 1e-3)) o.push('the stated dilation does not match the drawn triangles'); }
  }
  if (q.family === 'corrStatement' || q.family === 'corrRotated' || q.family === 'stmtCheck') {
    const F = figs(q);
    if (F.length >= 2 && !similarPolys(F[0].pts, F[1].pts)) o.push('the two drawn triangles are not similar');
  }
  // contexts: sizes a careful teacher believes
  if (q.family === 'ctxMetric' && (m = p.match(/A similar (.+?) is (\d+(?:\.\d+)?) m wide/))) {
    const r = SIZES_M[m[1]];
    if (r && (Number(m[2]) < r[0] || Number(m[2]) > r[1])) o.push(`a ${m[1]} ${m[2]} m wide is not a real ${m[1]}`);
  }
  if (q.family === 'ctxShadow') {
    const h = solve(q), t = (p.match(/How tall is the (.+?), in feet/) ?? [])[1];
    if (t && MIN_FT[t] && h < MIN_FT[t]) o.push(`a ${h} ft ${t}`);
    if ((m = p.match(/the (.+?) casts a (\d+(?:\.\d+)?) ft shadow/))) { /* fine */ }
  }
  // a choice question needs exactly one right choice
  if (q.input === 'choice') {
    let s;
    try { s = solve(q); } catch { s = undefined; }
    if (s === -1) o.push('no single right choice');
  }
  return [...new Set(o)].join('; ');
}

export default { solve, sane };
