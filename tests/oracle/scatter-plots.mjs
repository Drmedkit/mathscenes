// Oracle for the lesson "scatter-plots" (scatter plots and bivariate data, 8.SP.A.1-4). Written from what the student
// sees only (docs/lessons/QUALITY_LAYER.md, "O: the oracle"): the prompt, the board, the choices, and the picture as it
// is drawn when the item opens: the dots (a doubled case counts twice), the visible trend lines (`show.lines`), the
// marks (only when `show.marks`), the straight edge (only when `show.ruler`), the table on the card. Hidden helpers
// (the observed-range band, the cluster groups, rings drawn only on a miss) are never read: ranges, clusters, outliers,
// direction, form and strength are worked out from the dots with a teacher's yardsticks (below).
import { nums, round } from '../../tools/quality/oracle-kit.mjs';

// ---------------------------------------------------------------- yardsticks a careful teacher would use
const R_NONE = 0.3;            // |r| below this: no clear association
const R_STRONG = 0.9;          // |r| at least this: strong
const R_WEAK = 0.8;            // |r| below this: not strong
const BOW = 0.08;              // a curve explains at least this share of y's variation beyond the line: curved
const STRAIGHT = 0.05;         // ... at most this share: straight
const OUT_K = 5;               // an outlier sits at least this many residual SDs off the line through the others
const GAP = 0.26;              // clusters: a gap of this share of the axis span (both axes scaled) splits the dots

// ---------------------------------------------------------------- the picture
const picOf = q => q.data?.picture?.pic ?? {};
const plotOf = q => picOf(q).plot;
/** every case, with doubled dots counted (n) */
function cases(pl) { const out = []; for (const p of pl?.pts ?? []) for (let k = 0; k < (p.n ?? 1); k++) out.push(p); return out; }
const visLines = q => { const pl = plotOf(q), sh = picOf(q).show ?? {}; return (pl?.lines ?? []).map((L, i) => ({ ...L, i })).filter(L => !sh.lines || sh.lines.includes(L.i)); };
const marksOf = q => ((picOf(q).show ?? {}).marks ? plotOf(q)?.marks ?? [] : []);
const tagged = (pl, tag) => (pl?.pts ?? []).find(p => p.tag === tag);
const eq = (a, b) => Math.abs(a - b) < 1e-6;

// ---------------------------------------------------------------- statistics on the dots
function stats(P) {
  const n = P.length, mx = P.reduce((s, p) => s + p.x, 0) / n, my = P.reduce((s, p) => s + p.y, 0) / n;
  let sxx = 0, syy = 0, sxy = 0;
  for (const p of P) { sxx += (p.x - mx) ** 2; syy += (p.y - my) ** 2; sxy += (p.x - mx) * (p.y - my); }
  const m = sxx ? sxy / sxx : 0, b = my - m * mx;
  const r = sxx && syy ? sxy / Math.sqrt(sxx * syy) : 0;
  const sse = P.reduce((s, p) => s + (p.y - (m * p.x + b)) ** 2, 0);
  return { n, mx, my, m, b, r, sse, sxx, syy };
}
/** least-squares quadratic y = a x² + c1 x + c0 (normal equations, x centred) */
function quad(P) {
  const S = stats(P), c = S.mx;
  const X = P.map(p => p.x - c);
  const s = k => X.reduce((t, x) => t + x ** k, 0), t = k => P.reduce((u, p, i) => u + X[i] ** k * p.y, 0);
  const M = [[s(4), s(3), s(2)], [s(3), s(2), s(1)], [s(2), s(1), P.length]], v = [t(2), t(1), t(0)];
  const det = A => A[0][0] * (A[1][1] * A[2][2] - A[1][2] * A[2][1]) - A[0][1] * (A[1][0] * A[2][2] - A[1][2] * A[2][0]) + A[0][2] * (A[1][0] * A[2][1] - A[1][1] * A[2][0]);
  const D = det(M);
  if (!D) return null;
  const col = (k) => det(M.map((row, i) => row.map((x, j) => (j === k ? v[i] : x))));
  const a = col(0) / D, b1 = col(1) / D, c0 = col(2) / D;
  const f = x => a * (x - c) ** 2 + b1 * (x - c) + c0;
  const sse = P.reduce((u, p) => u + (p.y - f(p.x)) ** 2, 0);
  const vx = -b1 / (2 * a) + c; // vertex
  return { a, f, sse, vx };
}
/** the form of a cloud: { kind: 'none' | 'linear' | 'curve' | 'unclear', dir: +1/-1, turn: 'fall-rise'/'rise-fall', bend }.
 *  bow = the share of all the variation in y that a curve explains beyond the straight line; turn = how far the curve
 *  comes back down (or up) after its peak (or dip), as a share of its height */
function form(P) {
  const S = stats(P), Qd = quad(P);
  if (!Qd || !S.syy) return { kind: 'unclear', r: S.r, bow: 0 };
  const bow = (S.sse - Qd.sse) / S.syy, q2 = 1 - Qd.sse / S.syy;
  const xs = P.map(p => p.x), lo = Math.min(...xs), hi = Math.max(...xs);
  const v = Math.min(Math.max(Qd.vx, lo), hi), ys = [lo, hi, v].map(Qd.f), span = Math.max(...ys) - Math.min(...ys) || 1;
  const turn = Qd.vx > lo && Qd.vx < hi ? Math.min(Math.abs(Qd.f(Qd.vx) - Qd.f(lo)), Math.abs(Qd.f(Qd.vx) - Qd.f(hi))) / span : 0;
  const base = { r: S.r, bow, q2, turn };
  if (Math.abs(S.r) < R_NONE && q2 < 0.5) return { ...base, kind: 'none' };
  if (bow >= BOW && q2 >= 0.8) {
    if (turn >= 0.25) return { ...base, kind: 'curve', turn: Qd.a > 0 ? 'fall-rise' : 'rise-fall' };
    if (turn <= 0.12) return { ...base, kind: 'curve', turn: undefined, dir: Math.sign(S.r), bend: Qd.a > 0 ? 'up' : 'down' };
    return { ...base, kind: 'unclear' };
  }
  if (bow <= STRAIGHT && Math.abs(S.r) >= R_NONE) return { ...base, kind: 'linear', dir: Math.sign(S.r) };
  return { ...base, kind: 'unclear' };
}
/** the clusters (single linkage on both axes scaled to the plot spans) */
function clusters(pl) {
  const P = pl.pts, sx = pl.x1 - pl.x0 || 1, sy = pl.y1 - pl.y0 || 1;
  const parent = P.map((_, i) => i), find = i => (parent[i] === i ? i : (parent[i] = find(parent[i])));
  const d = (a, b) => Math.hypot((a.x - b.x) / sx, (a.y - b.y) / sy);
  // a gap splits only when it is wide on the drawing AND wide next to the usual spacing of neighbouring dots
  const nn = P.map((p, i) => Math.min(...P.filter((_, j) => j !== i).map(o => d(p, o)))).sort((a, b) => a - b);
  const link = Math.min(0.45, Math.max(GAP, 6 * (nn[Math.floor(nn.length / 2)] ?? 0)));   // a gap of 0.45 always splits
  for (let i = 0; i < P.length; i++) for (let j = i + 1; j < P.length; j++) if (d(P[i], P[j]) < link) parent[find(i)] = find(j);
  const groups = new Map();
  P.forEach((_, i) => { const r = find(i); if (!groups.has(r)) groups.set(r, []); groups.get(r).push(i); });
  const gs = [...groups.values()];
  // the widest gap between groups vs the widest link inside one: how clear the split is
  return { count: gs.filter(g => g.length >= 2).length, groups: gs };
}
/** how far a dot sits from the line through the others, in residual SDs */
function offness(P, pt) {
  const rest = P.filter(p => p !== pt);
  const S = stats(rest);
  const ys = rest.map(p => p.y), yr = Math.max(...ys) - Math.min(...ys) || 1;
  // the scatter of the others round their line (never below 2% of their y-range: dots exactly on a line)
  const sd = Math.max(Math.sqrt(S.sse / Math.max(1, rest.length - 2)), 0.02 * yr);
  return Math.abs(pt.y - (S.m * pt.x + S.b)) / sd;
}

/** an outlier: far off the others' line both in their scatter (OUT_K SDs) and on the drawing (a quarter of their y-range) */
function isOutlier(P, pt) {
  const rest = P.filter(p => p !== pt), S = stats(rest), ys = rest.map(p => p.y), yr = Math.max(...ys) - Math.min(...ys) || 1;
  return offness(P, pt) >= OUT_K && Math.abs(pt.y - (S.m * pt.x + S.b)) / yr >= 0.25;
}

// ---------------------------------------------------------------- text helpers
const lc = s => String(s ?? '').toLowerCase();
const key = name => lc(name).replace(/\s*\(.*$/, '').trim(); // "height (in)" → "height"
const firstNum = s => nums(String(s).replace(/−/g, '-'))[0];
function choiceIdx(q, pred) {
  const h = (q.choices ?? []).map((c, i) => (pred(c, i) ? i : -1)).filter(i => i >= 0);
  return h.length === 1 ? h[0] : -1;
}
const choiceStarts = (q, re) => choiceIdx(q, c => re.test(c));
/** "y = −1.6x + 92" / "y = x" / "y = 3x − 170" → { m, b } */
function lineEq(s) {
  const t = String(s).replace(/−/g, '-').replace(/\s+/g, '');
  const m = t.match(/y=(-?[\d.]*)x([+-][\d.]+)?/);
  if (!m) return null;
  const k = m[1] === '' ? 1 : m[1] === '-' ? -1 : Number(m[1]);
  return { m: k, b: m[2] ? Number(m[2]) : 0 };
}
/** a table's columns and rows (strings), with the label column split off */
function tbl(T) {
  const head = T.head, rows = T.rows;
  const off = T.rowHead ? 1 : 0;
  return { head, rows, off, label: T.rowHead ? head[0] : null };
}
/** the table column that holds a plot variable (by its name's first word) */
function colFor(T, name) {
  const k = key(name).split(' ')[0];
  const t = tbl(T);
  for (let c = t.off; c < t.head.length; c++) if (key(t.head[c]).split(' ')[0] === k) return c;
  return -1;
}
/** the table's (x, y) pairs for a plot: columns matched by name, else the order that matches more of the drawn dots */
function tablePairs(T, pl) {
  const t = tbl(T), a = t.off, b = t.off + 1;
  const asXY = (cx, cy) => t.rows.map(r => ({ x: Number(r[cx]), y: Number(r[cy]), label: t.label ? r[0] : null }));
  const nx = colFor(T, pl.xName), ny = colFor(T, pl.yName);
  if (nx >= 0 && ny >= 0 && nx !== ny) return asXY(nx, ny);
  if (nx === b || ny === a) return asXY(b, a);
  if (nx === a || ny === b) return asXY(a, b);
  const C = cases(pl), hit = P => P.filter(p0 => C.some(c => eq(c.x, p0.x) && eq(c.y, p0.y))).length;
  const A = asXY(a, b), B = asXY(b, a);
  return hit(B) > hit(A) ? B : A;
}

/** is this variable the one the question's predictor phrase names (more shared words than the other variable)? */
const words = s => lc(s).replace(/\(.*?\)/g, ' ').replace(/’s\b/g, '').split(/[^a-z]+/).filter(w => w.length >= 4 && !['help', 'predict', 'used', 'daily', 'many', 'hours'].includes(w) || /^(age|sold|span)$/.test(w));
function isPred(name, pred, q) {
  const all = (q.choices ?? []).map(c => c.replace(/^x-axis: /, '').split(/[:,;]/)[0].trim()).filter((v, i, A) => A.indexOf(v) === i);
  const score = n => { const W = words(n), P = words(pred); return W.filter(w => P.some(p0 => p0 === w || p0.startsWith(w) || w.startsWith(p0))).length; };
  const s0 = score(name), best = Math.max(...all.map(score));
  return s0 > 0 && s0 === best && all.filter(n => score(n) === best && key(n) !== key(name)).length === 0;
}

// ---------------------------------------------------------------- two-way tables (readCell, grandTotal, relFreq, associated)
function twoWay(T) {
  const head = T.head, rows = T.rows;
  const cols = head.slice(1, -1), names = rows.slice(0, -1).map(r => r[0]);
  const cell = (r, c) => { const s = rows[r][c + 1]; return s === '' || s === '?' ? null : Number(s); };
  const R = names.length, C = cols.length;
  const g = Array.from({ length: R + 1 }, (_, r) => Array.from({ length: C + 1 }, (_, c) => cell(r, c)));
  for (let pass = 0; pass < 10; pass++) {
    for (let r = 0; r <= R; r++) {
      const unk = [...Array(C).keys()].filter(c => g[r][c] === null), s = [...Array(C).keys()].reduce((t, c) => t + (g[r][c] ?? 0), 0);
      if (g[r][C] === null && !unk.length) g[r][C] = s; else if (g[r][C] !== null && unk.length === 1) g[r][unk[0]] = g[r][C] - s;
    }
    for (let c = 0; c <= C; c++) {
      const unk = [...Array(R).keys()].filter(r => g[r][c] === null), s = [...Array(R).keys()].reduce((t, r) => t + (g[r][c] ?? 0), 0);
      if (g[R][c] === null && !unk.length) g[R][c] = s; else if (g[R][c] !== null && unk.length === 1) g[unk[0]][c] = g[R][c] - s;
    }
  }
  const unknown = []; rows.forEach((row, r) => row.slice(1).forEach((s, c) => { if (s === '?') unknown.push([r, c]); }));
  return { cols, names, g, R, C, unknown };
}
/** the row / column a phrase names (longest name first) */
function findName(list, text) {
  const t = lc(text);
  const order = list.map((n, i) => ({ n: lc(n), i })).sort((a, b) => b.n.length - a.n.length);
  let s = t;
  for (const o of order) { const k = s.indexOf(o.n); if (k >= 0) return o.i; }
  return -1;
}
/** the row-group share of each column category, in % */
const rowPct = (W, r, c) => (100 * W.g[r][c]) / W.g[r][W.C];

// ---------------------------------------------------------------- solve
function solve(q) {
  const p = q.prompt, f = q.family, pic = picOf(q), pl = plotOf(q);
  let m;
  switch (f) {
    case 'caseVars': {
      const t = tbl(pic.table), unit = (p.match(/shows \d+ (\w+?)s?\./) ?? [])[1];
      if (/Which two variables/.test(p)) {
        const vars = t.head.slice(t.off).map(lc);
        return choiceIdx(q, c => lc(c) === `${vars[0]} and ${vars[1]}`);
      }
      if (/stay together/.test(p)) return choiceStarts(q, /^They are two measurements of the same /);
      if (/What is one case/.test(p)) return choiceIdx(q, c => /^One \w+: one row, with both of (their|its) measurements$/.test(c));
      return undefined;
    }
    case 'keepPairs': {
      const t = tbl(pic.table);
      m = p.match(/puts \$?([\d.]+)/);
      const x = Number(m[1]);
      const xs = t.rows.filter(r => Number(r[t.off]) === x);
      // two cases may share that value (then "the student with 6 hours" names no single one: see sane); the first is given
      return Number(xs[0][t.off + 1]);
    }
    case 'readPoint': {
      const A = tagged(pl, 'A');
      if (q.input === 'pair') return [A.x, A.y];
      return choiceIdx(q, c => { const v = nums(c.replace(/\([^)]*\)/g, '')); return /^An? /.test(c) && v.length === 2 && eq(v[0], A.x) && eq(v[1], A.y); });
    }
    case 'countCases': {
      const C = cases(pl);
      if ((m = p.match(/how many \w+ have .+? ([\d.]+)\?$/))) return C.filter(c => eq(c.x, Number(m[1]))).length;
      if (/How many \w+ does this plot show/.test(p)) return C.length;
      if (/Which \w+ is missing from the plot/.test(p)) {
        const left = C.map(c => ({ ...c }));
        const missing = [];
        for (const row of tablePairs(pic.table, pl)) {
          const k = left.findIndex(c => eq(c.x, row.x) && eq(c.y, row.y));
          if (k >= 0) left.splice(k, 1); else missing.push(row.label);
        }
        if (missing.length === 0) return choiceStarts(q, /^None/);
        if (missing.length === 1) return choiceIdx(q, c => c === missing[0]);
        return -1;
      }
      return undefined;
    }
    case 'whereDot': {
      let x, y;
      if ((m = p.match(/A new \w+: .+? ([\d.]+), .+? ([\d.]+)\. Which spot/))) { x = Number(m[1]); y = Number(m[2]); }
      else if ((m = p.match(/dot for row (\d+) go/))) {
        const row = tablePairs(pic.table, pl)[Number(m[1]) - 1];
        x = row.x; y = row.y;
      } else return undefined;
      const mk = marksOf(q).filter(k => eq(k.x, x) && eq(k.y, y));
      return mk.length === 1 ? choiceIdx(q, c => c === mk[0].tag) : -1;
    }
    case 'joinOrNot': {
      const overTime = /each (week|day|month|year) for \d+/.test(p) && /^(week|day|month|year)/.test(lc(pl.xName));
      if (overTime) return choiceStarts(q, /^Yes: one \w+ over time/);
      return choiceStarts(q, /^No: each dot is a different /);
    }
    case 'whichOnX': case 'axisPlan': {
      const quote = (p.match(/“(.+?)”/) ?? [])[1] ?? '';
      let pred = null;
      if ((m = quote.match(/^Can (.+?) help predict/))) pred = lc(m[1]);
      if (f === 'whichOnX') {
        if (!pred) return /relationship between/.test(quote) ? choiceStarts(q, /^Either one: the question names no predictor/) : undefined;
        return choiceIdx(q, c => /predict/.test(c) && isPred(c.split(':')[0], pred, q));
      }
      // axisPlan: the predictor across, both axes equal-interval and covering the values, ticks not crowded
      const rng = [...p.matchAll(/values (?:run )?from (\d+(?:\.\d+)?) to (\d+(?:\.\d+)?)/g)].map(x => [Number(x[1]), Number(x[2])]);
      const vnames = [...p.replace(/^.*”/, '').matchAll(/(?:The|the) (.+?) values (?:run )?from/g)].map(x => x[1]);
      const ok = c => {
        const x = c.match(/^x-axis: (.+?), ([\d.]+) to ([\d.]+) by ([\d.]+); y-axis: (.+?), ([\d.]+) to ([\d.]+) by ([\d.]+)$/);
        if (!x) return false;
        const ax = [{ name: x[1], a: +x[2], b: +x[3], s: +x[4] }, { name: x[5], a: +x[6], b: +x[7], s: +x[8] }];
        if (!pred || !isPred(ax[0].name, pred, q)) return false;
        return ax.every(A => {
          const vi = vnames.findIndex(n => lc(n) === lc(A.name));
          if (vi < 0) return false;
          const [lo, hi] = rng[vi], k = (A.b - A.a) / A.s;
          return A.a <= lo && A.b >= hi && Math.abs(k - Math.round(k)) < 1e-9 && k >= 3 && k <= 12;
        });
      };
      return choiceIdx(q, ok);
    }
    case 'pickScale': {
      if (/tick at each value/.test(p)) {
        const v = nums(p.split(':').slice(1).join(':'));
        const gaps = v.slice(1).map((x, i) => round(x - v[i], 6));
        const equal = gaps.every(g => eq(g, gaps[0]));
        if (equal) return choiceStarts(q, /^Nothing/);
        return choiceIdx(q, c => { const x = c.match(/^The gaps are (.+?) but drawn the same size/); return !!x && nums(x[1]).join() === gaps.join(); });
      }
      const v = nums(q.board.replace(/\\,|\\ /g, ' '));
      const lo = Math.min(...v), hi = Math.max(...v);
      return choiceIdx(q, c => {
        const x = c.match(/^([\d.]+) to ([\d.]+), every ([\d.]+)/);
        if (!x) return false;
        const a = +x[1], b = +x[2], s = +x[3], k = (b - a) / s;
        return a <= lo && b >= hi && Math.abs(k - Math.round(k)) < 1e-9 && k >= 3 && k <= 14;
      });
    }
    case 'readScaleY': return tagged(pl, 'A').y;
    case 'findTheFlaw': {
      const rows = tablePairs(pic.table, pl);
      const C = cases(pl);
      const sameSet = (A, B) => A.length === B.length && A.every(a => B.filter(b => eq(b.x, a.x) && eq(b.y, a.y)).length === A.filter(c => eq(c.x, a.x) && eq(c.y, a.y)).length);
      const flaws = [];
      if ((pic.show ?? {}).join) flaws.push('join');
      if (!sameSet(rows, C)) {
        // shifted: every dot pairs a row's x with the next row's y (wrapping)
        const shifted = rows.map((r, i) => ({ x: r.x, y: rows[(i + 1) % rows.length].y }));
        if (sameSet(shifted, C)) flaws.push('next');
        else if (C.length === rows.length - 1 && rows.some((r, i) => rows.some((s, j) => j !== i && eq(s.x, r.x)))) flaws.push('missing');
        else flaws.push('other');
      }
      if (flaws.length === 0) return choiceStarts(q, /^Nothing/);
      if (flaws.length > 1) return -1;
      const re = { join: /^The dots are joined/, next: /NEXT row/, missing: /^A row is missing/ }[flaws[0]];
      return re ? choiceStarts(q, re) : undefined;
    }
    case 'nameDirection': {
      const S = stats(cases(pl));
      const dir = Math.abs(S.r) < R_NONE ? 0 : Math.sign(S.r);
      if (/If you swapped the axes/.test(p)) {
        if (dir === 0) return choiceStarts(q, /^No clear/);
        const stated = /is positive/.test(p) ? 1 : /is negative/.test(p) ? -1 : 0;
        return choiceStarts(q, stated === dir ? /^Still/ : /^(Positive|Negative)$/);
      }
      if (dir === 0) return choiceStarts(q, /^No clear association/);
      return choiceStarts(q, dir > 0 ? /^Positive:/ : /^Negative:/);
    }
    case 'exceptionPair': return choiceStarts(q, /^No: an association is an overall tendency/);
    case 'linearOrCurve': case 'straightEdge': case 'fullDescription': return formChoice(q);
    case 'whichStronger': {
      const a = pic.a, b = pic.b;
      const same = a.pts.length === b.pts.length && a.pts.every((p0, i) => eq(p0.x, b.pts[i].x) && eq(p0.y, b.pts[i].y));
      if (same) return choiceStarts(q, /^(Equally strong|They are equally strong)/);
      const ra = Math.abs(stats(cases(a)).r), rb = Math.abs(stats(cases(b)).r);
      if (Math.abs(ra - rb) < 0.05) return choiceStarts(q, /equally strong/i);
      return choiceIdx(q, c => c === (ra > rb ? 'Plot A' : 'Plot B'));
    }
    case 'strongMeans': {
      const r = Math.abs(stats(cases(pl)).r);
      if (r >= R_STRONG) return choiceStarts(q, /^Yes: the dots stay close to the line/);
      if (r < R_WEAK && r >= R_NONE) return choiceStarts(q, /^Not very: the dots scatter far from the line/);
      if (r < R_NONE) return choiceStarts(q, /^No: there is no association/);
      return -1;
    }
    case 'countClusters': return clusters(pl).count;
    case 'completeDesc': {
      const P = cases(pl), S = stats(P), k = clusters(pl).count;
      const dir = Math.abs(S.r) < R_NONE ? 0 : Math.sign(S.r);
      return choiceIdx(q, c => {
        const x = c.match(/^(Positive|Negative): .+ and the dots form (two|three) clusters/);
        if (!x) return false;
        return (x[1] === 'Positive' ? 1 : -1) === dir && ({ two: 2, three: 3 })[x[2]] === k;
      });
    }
    case 'findOutlier': {
      const P = cases(pl);
      if ((m = p.match(/^Dot ([A-Z]): .+ both ordinary values\. Can it be an outlier\?/))) {
        const d = tagged(pl, m[1]);
        return choiceStarts(q, isOutlier(P, d) ? /^Yes: it sits far from the pattern/ : /^No: an outlier needs/);
      }
      const tags = (q.choices ?? []).map(c => c.replace(/^Dot /, ''));
      const outs = tags.map((tg, i) => (isOutlier(P, tagged(pl, tg)) ? i : -1)).filter(i => i >= 0);
      return outs.length === 1 ? outs[0] : -1;
    }
    case 'keepOrDelete':
      if (/measurements are right/.test(p)) return choiceStarts(q, /^Keep it and mention it/);
      if (/typed wrong/.test(p)) return choiceStarts(q, /^Check the original record/);
      return undefined;
    case 'whichDisplay': {
      const d = (p.match(/^Data set: (.+?) \(/) ?? [])[1] ?? '';
      const time = /\b(each|every) (week|day|month|year)\b|\beach year from\b|\bdaily\b.*\bfor (two|\d+) (weeks|days|months)/.test(d) && !/of each of \d+/.test(d);
      return time ? choiceStarts(q, /^Line graph: one value per/) : choiceStarts(q, /^Scatter plot: separate /);
    }
    case 'bestLine': {
      const P = cases(pl);
      const L = visLines(q).filter(x => x.tag);
      const sse = L.map(x => ({ tag: x.tag, s: P.reduce((t, p0) => t + (p0.y - (x.m * p0.x + x.b)) ** 2, 0) })).sort((a, b) => a.s - b.s);
      if (sse.length < 2 || sse[1].s < sse[0].s * 1.3) return -1;
      return choiceIdx(q, c => c === `Line ${sse[0].tag}`);
    }
    case 'equalCounts': {
      const P = cases(pl), L = visLines(q)[0];
      const res = P.map(p0 => p0.y - (L.m * p0.x + L.b));
      const S = stats(P);
      const good = L && P.reduce((t, p0, i) => t + res[i] ** 2, 0) <= 1.5 * S.sse;
      if (/^.+? Kim says her line fits because/.test(p)) return choiceStarts(q, good ? /^Yes: equal counts/ : /^No: the dots above sit at one end/);
      if (/Does that make it a bad fit/.test(p)) return good ? choiceStarts(q, /^No: it follows the trend/) : -1;
      return undefined;
    }
    case 'readPrediction': {
      const x = firstNum(q.board.replace(/^x\s*=\s*/, ''));
      const L = visLines(q)[0];
      return round(L.m * x + L.b, 2);
    }
    case 'estimateMeaning': {
      if (/What does that mean\?/.test(p)) return choiceStarts(q, /^A typical .+ would be about .+; a real one may differ$/);
      if (/sure to be close/.test(p)) {
        const x = firstNum(q.board.replace(/^x\s*=\s*/, '')), xs = cases(pl).map(c => c.x);
        const inside = x >= Math.min(...xs) && x <= Math.max(...xs);
        return inside ? choiceStarts(q, /^No: real \w+ scatter around the line/) : -1;
      }
      return undefined;
    }
    case 'predictEq': {
      const L = lineEq(q.board);
      const x = Number(p.match(/predict y for x = (-?[\d.]+)/)[1]);
      return round(L.m * x + L.b, 6);
    }
    case 'writeEq': {
      const mk = marksOf(q), P0 = mk.find(k => k.tag === 'P'), Q0 = mk.find(k => k.tag === 'Q');
      const mm = (Q0.y - P0.y) / (Q0.x - P0.x);
      return [round(mm, 6), round(P0.y - mm * P0.x, 6)];
    }
    case 'classify': {
      const x = firstNum(q.board.replace(/^x\s*=\s*/, '')), xs = cases(pl).map(c => c.x);
      const inside = x >= Math.min(...xs) && x <= Math.max(...xs);
      return choiceStarts(q, inside ? /^Interpolation/ : /^Extrapolation/);
    }
    case 'observedRange': { const xs = cases(pl).map(c => c.x); return [Math.min(...xs), Math.max(...xs)]; }
    case 'whyRisky': {
      const xs = cases(pl).map(c => c.x), lo = Math.min(...xs), hi = Math.max(...xs);
      const dist = x => (x < lo ? lo - x : x > hi ? x - hi : 0);
      if ((m = p.match(/deserves more trust: at (-?[\d.]+) or at (-?[\d.]+)\?/))) {
        const a = Number(m[1]), b = Number(m[2]);
        if (eq(dist(a), dist(b))) return -1;
        const near = dist(a) < dist(b) ? a : b;
        return choiceIdx(q, c => new RegExp(`^At ${near}:`).test(c));
      }
      if ((m = p.match(/to predict (.+?) at .+? (-?[\d.]+)\. Is that reliable/))) {
        const x = Number(m[2]);
        if (dist(x) < 0.4 * (hi - lo)) return -1; // not far out: the "far outside" choice would not hold
        return choiceIdx(q, c => new RegExp(`^No: ${x} is far outside the data`).test(c));
      }
      return undefined;
    }
    case 'slopeMeaning': {
      const L = lineEq(q.board || p);
      if ((m = p.match(/differ by ([\d.]+) /))) return round(Math.abs(L.m) * Number(m[1]), 6);
      const dir = L.m > 0 ? 'up' : 'down';
      return choiceIdx(q, c => { const x = c.match(/^On average, .+ goes (up|down) by about \$?([\d.]+) /); return !!x && x[1] === dir && eq(Number(x[2]), Math.abs(L.m)); });
    }
    case 'interceptMeaning': {
      const L = lineEq(q.board);
      const xs = cases(pl).map(c => c.x), lo = Math.min(...xs), hi = Math.max(...xs);
      // how far x = 0 lies outside the observed x, as a share of the observed spread
      const out = (0 < lo ? lo : 0 > hi ? -hi : 0) / (hi - lo);
      const offered = (q.choices ?? []).filter(c => /^(The predicted|Nothing real)/.test(c)).length;
      // both offered: near (≤ 0.35 of the spread) → a prediction, far (≥ 0.7) → nothing real; one offered: it stands
      // unless it is clearly wrong (a prediction 0 more than a whole spread away; "outside" when 0 is nearly inside)
      const predOk = offered === 2 ? out <= 0.35 : out <= 1, noneOk = offered === 2 ? out >= 0.7 : out >= 0.2;
      const judge = c => {
        let x;
        if ((x = c.match(/^The predicted .+: about \$?(−?[\d.]+) /))) return eq(firstNum(x[1]), L.b) && predOk ? 'ok' : 'no';
        if ((x = c.match(/^Nothing real: .+ 0 is outside the observed ([\d.]+) to ([\d.]+),/))) return eq(+x[1], lo) && eq(+x[2], hi) && noneOk ? 'ok' : 'no';
        // "the change in y for each extra ..." is the slope; "every ... had exactly", "a day with 0 had" claim a
        // measurement at x = 0 that is not among the dots
        return 'no';
      };
      return choiceIdx(q, c => judge(c) === 'ok');
    }
    case 'readCell': {
      const W = twoWay(pic.table);
      let rr = -1, cc = -1;
      if ((m = p.match(/in the (.+?) row (?:and|AND) the (.+?) column/))) { rr = findName(W.names, m[1]); cc = findName(W.cols, m[2]); }
      else if ((m = p.match(/How many (.+?) students come by (.+?)\?/))) { rr = findName(W.names, m[1]); cc = findName(W.cols, m[2]); }
      if (rr < 0 || cc < 0) return undefined;
      return W.g[rr][cc];
    }
    case 'grandTotal': {
      if ((m = p.match(/^\d+ \w+ answered both questions\. (\d+) .+?; (\d+) of them also .+? How many .+ but do NOT/))) return Number(m[1]) - Number(m[2]);
      if (/How many \w+ were surveyed/.test(p)) {
        const W = twoWay(pic.table);
        let s = 0; for (let r = 0; r < W.R; r++) for (let c = 0; c < W.C; c++) s += Number(pic.table.rows[r][c + 1]);
        return s;
      }
      return undefined;
    }
    case 'relFreq': {
      const W = twoWay(pic.table);
      if ((m = p.match(/Of the \w+ in the (.+?) row, what percent are in the (.+?) column\?/))) {
        const r = findName(W.names, m[1]), c = findName(W.cols, m[2]);
        const v = rowPct(W, r, c);
        return /nearest/.test(p) ? round(v, /tenth/.test(p) ? 1 : 0) : round(v, 6);
      }
      if ((m = p.match(/“Of the \w+ in the (.+?) row, what fraction (.+?)\?” The numerator is (\d+)/))) {
        const r = findName(W.names, m[1]);
        return choiceIdx(q, c => Number(c) === W.g[r][W.C]);
      }
      if ((m = p.match(/Of the \w+ in the (.+?) column, what fraction are (.+?)\?/))) {
        const c = findName(W.cols, m[1]), r = findName(W.names, m[2]);
        return [W.g[r][c], W.g[W.R][c]];
      }
      return undefined;
    }
    case 'associated': return assocChoice(q);
    default: return undefined;
  }
}

// ---------------------------------------------------------------- form choices (linearOrCurve, straightEdge, fullDescription)
function formChoice(q) {
  const pl = plotOf(q), P = cases(pl), F = form(P), S = stats(P), f = q.family, p = q.prompt;
  const claims = c => {
    const s = lc(c);
    if (/^no clear association: knowing/.test(s)) return { kind: 'none' };
    if (/^no association/.test(s)) return f === 'fullDescription' ? null : { kind: 'none' };
    if (/^linear: the dots follow a straight line/.test(s) || /stay close along it all the way: the form is linear/.test(s) || /^yes: the dots follow a straight trend/.test(s)) return { kind: 'linear' };
    if (/bow away from it in the middle: the form is nonlinear/.test(s) || /^no: the dots curve, so a line misses/.test(s)) return { kind: 'curve' };
    let x;
    if ((x = s.match(/^nonlinear: a curve that (rises|falls) more and more slowly/))) return { kind: 'curve', dir: x[1] === 'rises' ? 1 : -1, bend: x[1] === 'rises' ? 'down' : 'up' };
    if ((x = s.match(/^nonlinear: it (falls, then rises|rises, then falls)/))) return { kind: 'curve', turn: x[1] === 'falls, then rises' ? 'fall-rise' : 'rise-fall' };
    if ((x = s.match(/^as .+ increases, .+ tends to (increase|decrease): a (strong|moderate) linear association(, with one possible outlier)?$/))) return { kind: 'linear', dir: x[1] === 'increase' ? 1 : -1, strong: x[2] === 'strong', moderate: x[2] === 'moderate', outlier: !!x[3] };
    if ((x = s.match(/^as .+ increases, .+ (falls, then rises|rises, then falls): a strong nonlinear association/))) return { kind: 'curve', turn: x[1] === 'falls, then rises' ? 'fall-rise' : 'rise-fall' };
    if ((x = s.match(/^as .+ increases, .+ (rises|falls) quickly at first, then levels off: a strong nonlinear/))) return { kind: 'curve', dir: x[1] === 'rises' ? 1 : -1, bend: x[1] === 'rises' ? 'down' : 'up' };
    return null; // lists of words, one case, "touch at both ends", "keep rising": not a description of the form
  };
  const outlierThere = P.some(pt => isOutlier(P, pt));
  const fits = cl => {
    if (!cl) return false;
    // "the best description" among those offered: a borderline form contradicts neither a linear nor a curved claim
    if (cl.kind !== F.kind && !(f === 'fullDescription' && F.kind === 'unclear' && cl.kind !== 'none')) return false;
    if (cl.kind === 'linear') {
      if (cl.dir !== undefined && cl.dir !== (F.dir ?? Math.sign(S.r))) return false;
      if (cl.strong && Math.abs(S.r) < (cl.outlier ? R_WEAK : R_STRONG)) return false;
      if (cl.moderate && (Math.abs(S.r) >= R_STRONG || Math.abs(S.r) < 0.5)) return false;
      if (cl.outlier !== undefined && cl.outlier !== outlierThere) return false;
    }
    if (cl.kind === 'curve') {
      if (cl.turn !== undefined && cl.turn !== F.turn) return false;
      if (cl.dir !== undefined && (F.turn || cl.dir !== F.dir || cl.bend !== F.bend)) return false;
    }
    return true;
  };
  if (f === 'fullDescription' && F.kind === 'none') return choiceIdx(q, c => /^No clear association: knowing/.test(c));
  return choiceIdx(q, c => fits(claims(c)));
}

// ---------------------------------------------------------------- association in a two-way table
function assocChoice(q) {
  const W = twoWay(picOf(q).table);
  const p = q.prompt;
  const out = c => {
    let x;
    if ((x = c.match(/^In the (.+?) group, a larger share (.+?) \(([\d.]+)% vs ([\d.]+)%\): the two are associated$/))) {
      const r = findName(W.names, x[1]), o = 1 - r, col = colOf(W, x[2]);
      if (r < 0 || col < 0) return false;
      const a = rowPct(W, r, col), b = rowPct(W, o, col);
      return eq(round(a, 0), +x[3]) && eq(round(b, 0), +x[4]) && a - b >= 10;
    }
    if ((x = c.match(/^Yes: ([\d.]+)% of the (.+?) group vs ([\d.]+)% of the (.+?) group (.+?), clearly different$/))) {
      const r1 = findName(W.names, x[2]), r2 = findName(W.names, x[4]), col = colOf(W, x[5]);
      if (r1 < 0 || r2 < 0 || col < 0) return false;
      const a = rowPct(W, r1, col), b = rowPct(W, r2, col);
      return eq(round(a, 0), +x[1]) && eq(round(b, 0), +x[3]) && Math.abs(a - b) >= 10;
    }
    if ((x = c.match(/^(?:Little or no association|No clear association): ([\d.]+)% vs ([\d.]+)% (.+?)(?:, nearly the same)?$/))) {
      const col = colOf(W, x[3]);
      if (col < 0) return false;
      const a = rowPct(W, 0, col), b = rowPct(W, 1, col);
      const shown = [round(a, 0), round(b, 0)];
      return (eq(shown[0], +x[1]) && eq(shown[1], +x[2]) || eq(shown[0], +x[2]) && eq(shown[1], +x[1])) && Math.abs(a - b) <= 5;
    }
    return false; // counts compared, "makes", "some in both groups": not a well-stated conclusion
  };
  void p;
  return choiceIdx(q, out);
}
/** the column a verb phrase names: "bring lunch" ↔ "brings lunch", "have a sibling" ↔ "has a sibling", "go to bed before 10 pm" ↔ "before 10 pm" */
function colOf(W, phrase) {
  const t = lc(phrase);
  const norm = s => lc(s).replace(/\bbrings\b/, 'bring').replace(/\bbuys\b/, 'buy').replace(/\bhas\b/, 'have').replace(/\beats\b/, 'eat').replace(/\bskips\b/, 'skip').replace(/\bwalks?\b/, 'walk');
  const hits = W.cols.map((c, i) => ({ i, c: norm(c) })).filter(o => norm(t).includes(o.c));
  if (hits.length === 1) return hits[0].i;
  if (hits.length > 1) return hits.sort((a, b) => b.c.length - a.c.length)[0].i;
  return -1;
}

// ---------------------------------------------------------------- sane: what is impossible or unfair
function sane(q) {
  const out = [];
  const p = q.prompt, f = q.family, pic = picOf(q), pl = plotOf(q);
  let s;
  try { s = solve(q); } catch { s = undefined; }
  if (q.input === 'choice' && s === -1) out.push('no single right choice');
  if (f === 'keepPairs') {
    const t = tbl(pic.table), m = p.match(/puts \$?([\d.]+)/);
    if (m && t.rows.filter(r => Number(r[t.off]) === Number(m[1])).length > 1) out.push(`two cases have ${m[1]}: "the student with ${m[1]}" names no single one`);
  }
  if (pl && ['linearOrCurve', 'straightEdge'].includes(f)) {
    const F = form(cases(pl));
    if (F.kind === 'unclear') out.push(`the form is borderline (bow ${round(F.bow, 3)}, r ${round(F.r, 2)})`);
  }
  if (f === 'countClusters' || f === 'completeDesc') {
    const C = clusters(pl);
    if (C.groups.some(g => g.length === 1)) out.push('a lone dot sits apart from every cluster');
  }
  if (f === 'whichStronger') {
    const a = pic.a, b = pic.b;
    const ra = Math.abs(stats(cases(a)).r), rb = Math.abs(stats(cases(b)).r);
    if (Math.abs(ra - rb) >= 0.05 && Math.abs(ra - rb) < 0.1) out.push(`the two plots are close in strength (|r| ${round(ra, 2)} vs ${round(rb, 2)})`);
  }
  if (f === 'strongMeans' && pl) {
    const r = Math.abs(stats(cases(pl)).r);
    const L = visLines(q)[0];
    if (L && /shallow/.test(p) && Math.abs(L.m) * (pl.x1 - pl.x0) / (pl.y1 - pl.y0) > 1) out.push('the line called shallow is drawn steep');
    if (r >= R_WEAK && r < R_STRONG) out.push(`|r| = ${round(r, 2)}: neither clearly strong nor clearly scattered`);
  }
  if (f === 'exceptionPair' && pl) {
    const A = tagged(pl, 'A'), B = tagged(pl, 'B'), S = stats(cases(pl));
    const m = p.match(/a (higher|lower) .+ than dot A, but a (higher|lower) .+\. Does that break the (positive|negative)/);
    if (m && A && B) {
      if ((B.x > A.x) !== (m[1] === 'higher')) out.push('dot B is not on the side of A the text says (x)');
      if ((B.y > A.y) !== (m[2] === 'higher')) out.push('dot B is not on the side of A the text says (y)');
      if ((S.r > 0) !== (m[3] === 'positive')) out.push('the stated direction is not the plot’s');
    }
  }
  if (f === 'nameDirection' && pl && /is (positive|negative)/.test(p)) {
    const S = stats(cases(pl)), st = /is positive/.test(p) ? 1 : -1;
    if (Math.sign(S.r) !== st) out.push('the stated direction is not the plot’s');
  }
  if (f === 'equalCounts' && pl) {
    const L = visLines(q)[0], P = cases(pl);
    const m = p.match(/(\d+) dots are above it and (\d+) are below|has (\d+) dots above it and (\d+) below/);
    if (L && m) {
      const up = P.filter(c => c.y > L.m * c.x + L.b + 1e-9).length, dn = P.filter(c => c.y < L.m * c.x + L.b - 1e-9).length;
      const a = Number(m[1] ?? m[3]), b = Number(m[2] ?? m[4]);
      if (up !== a || dn !== b) out.push(`the line has ${up} dots above and ${dn} below, not ${a} and ${b}`);
    }
  }
  if (f === 'estimateMeaning' || f === 'readPrediction') {
    const m = p.match(/predicts ([\d.]+) /), L = pl ? visLines(q)[0] : null, x = firstNum((q.board ?? '').replace(/^x\s*=\s*/, ''));
    if (m && L && Math.abs(L.m * x + L.b - Number(m[1])) > 0.51) out.push('the stated prediction is not the line’s value');
  }
  if (f === 'whyRisky') {
    const m = p.match(/observed from (-?[\d.]+) to (-?[\d.]+)/), xs = cases(pl).map(c => c.x);
    if (m && (!eq(+m[1], Math.min(...xs)) || !eq(+m[2], Math.max(...xs)))) out.push('the stated observed range is not the dots’');
    const k = p.match(/Jo uses (y = .+?) to predict (−?[\d.]+) .+? at .+? (-?[\d.]+)\. /);
    if (k) { const L = lineEq(k[1]); if (L && Math.abs(L.m * Number(k[3]) + L.b - firstNum(k[2])) > 0.51) out.push('Jo’s prediction is not the line’s value'); }
  }
  if (f === 'interceptMeaning') {
    const m = p.match(/observed from (-?[\d.]+) to (-?[\d.]+)/), xs = cases(pl).map(c => c.x);
    if (m && (!eq(+m[1], Math.min(...xs)) || !eq(+m[2], Math.max(...xs)))) out.push('the stated observed range is not the dots’');
  }
  if (f === 'writeEq') {
    const mk = marksOf(q), L = visLines(q)[0];
    for (const k of mk) if (L && Math.abs(L.m * k.x + L.b - k.y) > 1e-6) out.push(`${k.tag} is not on the line`);
  }
  if (f === 'grandTotal' || f === 'readCell' || f === 'relFreq' || f === 'associated') {
    const W = twoWay(pic.table);
    for (let r = 0; r <= W.R; r++) for (let c = 0; c <= W.C; c++) if (W.g[r][c] !== null && W.g[r][c] < 0) out.push('a negative count');
    for (let r = 0; r < W.R; r++) if (W.g[r][W.C] === 0) out.push('a group of 0');
  }
  if (q.input === 'num' && typeof s === 'number' && /How many/.test(p) && !Number.isInteger(s)) out.push('a fractional count');
  return [...new Set(out)].join('; ');
}

export default { solve, sane };
