// Oracle for the lesson "linear-regression" (HS Statistics: scatter plots, correlation and the regression line).
// Written from what the student sees only (docs/lessons/QUALITY_LAYER.md, "O: the oracle"): the prompt, the board,
// the choices, and the picture data (the plotted points, the drawn line, the residual plot, the cards).
// Every least-squares line, r, r², residual and prediction is recomputed here from the plotted points / the given
// model. Conceptual choices are decided by testing each statement against the statistics (and the context), never by
// "the one that sounds like the lesson". Rounding: half away from zero to the places the item names (DESIGN.md);
// endpoints of the observed x-interval count as inside.
import { nums, texPlain, round } from '../../tools/quality/oracle-kit.mjs';

// ---------------------------------------------------------------- reading
const MINUS = /−/g;
const num = s => Number(String(s).trim().replace(MINUS, '-').replace(/,/g, '').replace(/\.+$/, '').replace(/^(-?)\./, '$10.'));
const pic = q => q.data?.picture ?? {};
const ptsOf = g => (g?.items ?? []).filter(i => i.kind === 'point');
const lineOf = g => (g?.items ?? []).find(i => i.kind === 'line' && i.key === 'fit');
const low = s => String(s ?? '').toLowerCase();
const idx = (q, pred) => { const h = (q.choices ?? []).map((c, i) => (pred(c, i) ? i : -1)).filter(i => i >= 0); return h.length === 1 ? h[0] : -1; };
const has = (c, re) => re.test(c);

/** the model in a text: ŷ = a + bx, a − bx, bx + a, or a constant ŷ = a → { a, b } */
function eqIn(text) {
  const s = String(text).replace(MINUS, '-').replace(/(\d),(\d{3})/g, '$1$2');
  let m = s.match(/(?:ŷ|y)\s*=\s*(-?\s*[\d.]+)\s*([+-])\s*([\d.]+)\s*x\b/);
  if (m) return { a: num(m[1].replace(/\s/g, '')), b: (m[2] === '-' ? -1 : 1) * num(m[3]) };
  m = s.match(/(?:ŷ|y)\s*=\s*(-?\s*[\d.]+)\s*x\s*([+-])\s*([\d.]+)/);
  if (m) return { b: num(m[1].replace(/\s/g, '')), a: (m[2] === '-' ? -1 : 1) * num(m[3]) };
  m = s.match(/(?:ŷ|y)\s*=\s*(-?\s*[\d.]+)\s*x\b/);
  if (m) return { a: 0, b: num(m[1].replace(/\s/g, '')) };
  m = s.match(/(?:ŷ|y)\s*=\s*(-?\s*[\d.]+)(?![\d.]*\s*x)/);
  if (m) return { a: num(m[1].replace(/\s/g, '')), b: 0 };
  return null;
}
const modelOf = q => eqIn(q.prompt) ?? eqIn(texPlain(q.board ?? '').replace(/^y/, 'ŷ').replace(/hat/g, ''));
/** "x = 12 and y = 50" */
const xyIn = text => { const s = String(text).replace(MINUS, '-').replace(/(\d),(\d{3})/g, '$1$2'); const mx = s.match(/\bx = (-?[\d.]+)/), my = s.match(/\by = (-?[\d.]+)/); return { x: mx ? num(mx[1]) : NaN, y: my ? num(my[1]) : NaN }; };
const roundsTenth = q => /nearest tenth/i.test(q.prompt);
const rounds2 = q => /2 decimal places/i.test(q.prompt);
const clean = v => Number(Number(v).toFixed(9));
/** a ".x5" tie at `places` decimals (within 2% of a rounding unit) */
const tie = (v, places) => { const k = Math.abs(v) * 10 ** places, f = k - Math.floor(k); return Math.abs(f - 0.5) < 0.02; };

// ---------------------------------------------------------------- statistics
function stats(P) {
  const n = P.length, mx = P.reduce((s, p) => s + p.x, 0) / n, my = P.reduce((s, p) => s + p.y, 0) / n;
  let sxx = 0, syy = 0, sxy = 0;
  for (const p of P) { sxx += (p.x - mx) ** 2; syy += (p.y - my) ** 2; sxy += (p.x - mx) * (p.y - my); }
  const b = sxx ? sxy / sxx : 0, a = my - b * mx, r = sxx && syy ? sxy / Math.sqrt(sxx * syy) : 0;
  const sse = P.reduce((s, p) => s + (p.y - a - b * p.x) ** 2, 0);
  return { n, mx, my, a, b, r, sse, sst: syy, sxx };
}
/** least-squares quadratic of y on x: share of the remaining variation it explains beyond a line */
function quadGain(P) {
  const S = stats(P); if (P.length < 4 || !S.sst) return 0;
  const c = S.mx, X = P.map(p => p.x - c);
  const s = k => X.reduce((t, x) => t + x ** k, 0), t = k => P.reduce((u, p, i) => u + X[i] ** k * p.y, 0);
  const M = [[s(4), s(3), s(2)], [s(3), s(2), s(1)], [s(2), s(1), P.length]], v = [t(2), t(1), t(0)];
  const det = A => A[0][0] * (A[1][1] * A[2][2] - A[1][2] * A[2][1]) - A[0][1] * (A[1][0] * A[2][2] - A[1][2] * A[2][0]) + A[0][2] * (A[1][0] * A[2][1] - A[1][1] * A[2][0]);
  const D = det(M); if (!D) return 0;
  const col = k => det(M.map((row, i) => row.map((x, j) => (j === k ? v[i] : x))));
  const qa = col(0) / D, qb = col(1) / D, qc = col(2) / D;
  const sseQ = P.reduce((u, p, i) => u + (p.y - (qa * X[i] ** 2 + qb * X[i] + qc)) ** 2, 0);
  return S.sse > 1e-12 ? (S.sse - sseQ) / S.sse : 0;
}
/** the residuals a student sees: the residual plot's points when drawn, else y − line(x) for the drawn line */
function residualsOf(q) {
  const P = pic(q);
  if (P.g2?.resid) return ptsOf(P.g2).map(p => ({ x: p.x, e: p.y }));
  const L = lineOf(P.g), pts = ptsOf(P.g);
  const S = L ? { a: L.b, b: L.m } : stats(pts);
  return pts.map(p => ({ x: p.x, e: p.y - S.a - S.b * p.x }));
}
/** residual plot reading: 'random' | 'curve' | 'fan' | 'one' | 'unclear', with the measures */
function residPattern(R) {
  const P = R.map(r => ({ x: r.x, y: r.e })).sort((a, b) => a.x - b.x), n = P.length;
  const rms = Math.sqrt(P.reduce((s, p) => s + p.y ** 2, 0) / n);
  const curve = quadGain(P);
  // one large residual: the largest |e| against the rms of the others
  const absSorted = P.map(p => Math.abs(p.y)).sort((a, b) => b - a);
  const restRms = Math.sqrt(P.map(p => p.y ** 2).sort((a, b) => b - a).slice(1).reduce((s, v) => s + v, 0) / (n - 1));
  const one = restRms ? absSorted[0] / restRms : 99;
  // fan: spread in the right third against the left third
  const k = Math.max(2, Math.floor(n / 3));
  const spread = A => Math.sqrt(A.reduce((s, p) => s + p.y ** 2, 0) / A.length);
  const fan = spread(P.slice(n - k)) / Math.max(1e-9, spread(P.slice(0, k)));
  // residuals without the largest one, for "one" (the rest must look random)
  const rest = P.filter(p => Math.abs(p.y) !== absSorted[0]);
  const curveRest = quadGain(rest);
  const second = absSorted[1] || 1e-9, lead = absSorted[0] / second;
  let kind = 'unclear';
  const lone = one >= 3.2 && lead >= 2;                 // one point far beyond all the others
  const fanRest = spread(rest.slice(Math.max(0, rest.length - k))) / Math.max(1e-9, spread(rest.slice(0, k)));
  // a fan: the spread grows to the right, several big errors there (not one lone point far above the rest)
  const both = lone && lead < 2.5 && fan >= 2.2;           // a spreading cloud whose biggest error is only 2-2.5x the next
  if (both) kind = 'unclear';
  else if (fan >= 2.2 && curve < 0.4 && !lone) kind = 'fan';
  else if (lone) kind = 'one';
  else if (curve >= 0.7) kind = 'curve';
  else if (curve < 0.5 && fan < 2.2 && fan > 0.3) kind = 'random';
  // the best single reading when the plot is not clear-cut (sane() reports those items as unfair)
  const best = kind !== 'unclear' ? kind : both ? (lead >= 2.25 ? 'one' : 'fan') : curve >= 0.6 ? 'curve' : fan >= 2.2 ? 'fan' : lone ? 'one' : 'random';
  return { kind, best, curve, one, fan, rms, lead, fanRest };
}
const r2 = v => round(v, 2);
const fan_one = R => R.one >= 3.2 && R.lead >= 2 && R.lead < 2.5 && R.fan >= 2.2;

// ---------------------------------------------------------------- choice tests that recur
const isCauseClaim = c => /\bcaus|\bmakes?\b|\bdrives? (?!both)|\bproves?\b/i.test(c);

// ---------------------------------------------------------------- the families
const S = {};

// variable-roles
S.roles = q => {
  const m = q.prompt.match(/predict (.*?) from (.*?)[.?]/i); if (!m) return undefined;
  const from = low(m[2]), to = low(m[1]);
  return idx(q, c => { const w = low(c).replace(/^the /, ''); return !/causes|lists first/.test(w) && from.includes(w) && !to.includes(w); });
};
S.rolesAxis = q => {
  const m = q.prompt.match(/predict (.*?) from (.*?)[.?]/i); if (!m) return undefined;
  const from = low(m[2]), to = low(m[1]);
  const words = low(pic(q).g?.x?.name).replace(/\(.*?\)/g, '').split(/\s+/).filter(w => w.length > 2);
  const sf = words.filter(w => from.includes(w)).length, st = words.filter(w => to.includes(w)).length;
  const right = sf > st;
  return idx(q, c => (right ? /^Yes: the variable we predict from is on the horizontal/ : /^No: the variable we predict from belongs on the horizontal/).test(c));
};

// exact-vs-statistical
// a rule from the context: a unit conversion, a geometric formula, a fixed price or fee
const exactRule = p => /same (length|temperature|distance|weight|time|amount)|fixed (price|rate)|side length of a square|its area|its edge|radius of a round|circumference|perimeter|plan that charges|plus \$[\d.]+ per/i.test(p);
/** the data the student sees: the plotted points, else the first two columns of the card (with the y-column's decimals) */
function dataOf(q) {
  const P = pic(q), pts = ptsOf(P.g);
  if (pts.length) return { pts, dec: Math.max(0, ...pts.map(p => (String(p.y).split('.')[1] ?? '').length)) };
  const c = P.card?.cols; if (!c || c.length < 2) return { pts: [], dec: 0 };
  return { pts: c[0].cells.map((x, i) => ({ x: num(x), y: num(c[1].cells[i]) })), dec: Math.max(0, ...c[1].cells.map(v => (String(v).split('.')[1] ?? '').length)) };
}
/** exact = one rule (a line or a parabola) through every point, up to the rounding of the shown values */
function exactData(q) {
  const { pts, dec } = dataOf(q); if (pts.length < 3) return null;
  for (const p of pts) for (const o of pts) if (p !== o && p.x === o.x && p.y !== o.y) return false;
  const tol = (dec ? 0.5 * 10 ** -dec : 0) + 1e-6;
  const St = stats(pts), lin = Math.max(...pts.map(p => Math.abs(p.y - St.a - St.b * p.x)));
  if (lin <= tol) return true;
  if (pts.length >= 4) { const qf = quadFit(pts); if (qf && Math.max(...pts.map(p => Math.abs(p.y - qf(p.x)))) <= tol) return true; }
  return false;
}
function quadFit(P) {
  const n = P.length, c = P.reduce((s, p) => s + p.x, 0) / n, X = P.map(p => p.x - c);
  const s = k => X.reduce((t, x) => t + x ** k, 0), t = k => P.reduce((u, p, i) => u + X[i] ** k * p.y, 0);
  const M = [[s(4), s(3), s(2)], [s(3), s(2), s(1)], [s(2), s(1), n]], v = [t(2), t(1), t(0)];
  const det = A => A[0][0] * (A[1][1] * A[2][2] - A[1][2] * A[2][1]) - A[0][1] * (A[1][0] * A[2][2] - A[1][2] * A[2][0]) + A[0][2] * (A[1][0] * A[2][1] - A[1][1] * A[2][0]);
  const D = det(M); if (!D) return null;
  const col = k => det(M.map((row, i) => row.map((x, j) => (j === k ? v[i] : x))));
  const qa = col(0) / D, qb = col(1) / D, qc = col(2) / D;
  return x => qa * (x - c) ** 2 + qb * (x - c) + qc;
}
S.exactStat = q => {
  const d = exactData(q), exact = d === null ? exactRule(q.prompt) : d;
  return idx(q, c => (exact ? /^Exact: a rule fixes y/ : /^Statistical: y only tends/).test(c));
};
S.exactSample = q => {
  if (/lie exactly on one line/.test(q.prompt)) {
    // a few measured points on a line show no rule: only a rule from the context could make it exact
    return idx(q, c => /^No:/.test(c) && /chance/.test(c));
  }
  const card = pic(q).card, rows = (q.prompt.match(/rows (\d+) and (\d+)/) ?? []).slice(1).map(Number);
  if (!card || rows.length < 2) return undefined;
  const X = card.cols[0].cells.map(num), Y = card.cols[1].cells.map(num);
  const [i, j] = rows.map(r => r - 1);
  let stat = X[i] === X[j] && Y[i] !== Y[j];
  for (let a = 0; a < X.length; a++) for (let b = 0; b < X.length; b++) if (a !== b && X[a] === X[b] && Y[a] !== Y[b]) stat = true;
  return stat ? idx(q, c => /^Statistical: y only tends/.test(c)) : undefined;
};

// observed-vs-predicted
S.yhatRead = q => { const M = modelOf(q), { x } = xyIn(q.prompt); const v = M.a + M.b * x; return roundsTenth(q) ? round(v, 1) : clean(v); };
S.obsPred = q => idx(q, c => {
  if (/^y is what was measured; ŷ is what the line predicts/.test(c)) return true;
  const m = c.match(/^Rows (\d+) and (\d+) have the same .*, so the line could give them different ŷ/);
  if (m) return false; // the same x always gets the same ŷ from one line
  return false;
});

// fit-by-eye
S.eyeEq = q => {
  const s = q.prompt.replace(MINUS, '-').replace(/(\d),(\d{3})/g, '$1$2');
  const P = s.match(/P\((-?[\d.]+), (-?[\d.]+)\)/), Qm = s.match(/Q\((-?[\d.]+), (-?[\d.]+)\)/);
  if (!P || !Qm) return undefined;
  const [x1, y1, x2, y2] = [P[1], P[2], Qm[1], Qm[2]].map(Number);
  const m = (y2 - y1) / (x2 - x1), b = y1 - m * x1;
  return [clean(b), clean(m)];
};
function eyeVerdict(q) {
  const g = pic(q).g, L = lineOf(g), pts = ptsOf(g).slice().sort((a, b) => a.x - b.x);
  const span = (g.y.max - g.y.min) || 1, tol = span * 0.005;
  const res = pts.map(p => p.y - (L.b + L.m * p.x));
  const on = res.map(e => Math.abs(e) <= tol);
  const above = res.filter((e, i) => !on[i] && e > 0).length, below = res.filter((e, i) => !on[i] && e < 0).length;
  const n = pts.length, off = n - on.filter(Boolean).length;
  const joinsEnds = on[0] && on[n - 1] && off > 0 && Math.max(above, below) >= Math.ceil(0.75 * off);
  const nOn = on.filter(Boolean).length;
  const rr = stats(pts.map((p, i) => ({ x: p.x, y: res[i] }))).r; // residuals trending with x = wrong tilt
  const LS = stats(pts);
  const sseL = res.reduce((s, e) => s + e * e, 0), sseRatio = sseL / Math.max(1e-9, LS.sse);
  if (joinsEnds) return 'ends';
  if (nOn >= 3 && sseRatio > 1.5) return 'several';
  if (Math.abs(rr) > 0.6 && Math.abs(above - below) <= 2) return 'tilt';
  if (sseRatio < 1.5 && Math.abs(rr) < 0.4) return 'ok';
  return 'unclear';
}
S.eyeCritique = q => {
  const v = eyeVerdict(q);
  const re = { ends: /^It only joins the first and last/, several: /^It passes through several points/, tilt: /tilts the wrong way/, ok: /^Nothing:/ }[v];
  return re ? idx(q, c => re.test(c)) : undefined;
};

// predict-from-model
S.predict = q => {
  const M = modelOf(q), s = q.prompt.replace(/(\d),(\d{3})/g, '$1$2');
  const x = num(s.match(/\bx = (-?[\d.]+)/)[1]);
  const v = M.a + M.b * x;
  return roundsTenth(q) ? round(v, 1) : clean(v);
};
S.predictTable = q => {
  const M = modelOf(q), card = pic(q).card; if (!card) return undefined;
  const xs = card.cols[0].cells, ys = card.cols[1].cells, i = ys.indexOf('?');
  const v = M.a + M.b * num(xs[i]);
  return roundsTenth(q) ? round(v, 1) : clean(v);
};

// residual-compute
S.residual = q => { const M = modelOf(q), { x, y } = xyIn(q.prompt); const e = y - (M.a + M.b * x); return roundsTenth(q) ? round(e, 1) : clean(e); };
S.residGraph = q => {
  const M = modelOf(q), m = q.prompt.replace(MINUS, '-').match(/at x = (-?[\d.]+), y = (-?[\d.]+)/);
  const e = num(m[2]) - (M.a + M.b * num(m[1]));
  return roundsTenth(q) ? round(e, 1) : clean(e);
};

// residual-in-context
S.residMeaning = q => {
  const M = modelOf(q), s = q.prompt.replace(MINUS, '-').replace(/(\d),(\d{3})/g, '$1$2');
  const x = num(s.match(/has x = (-?[\d.]+)/)[1]);
  const y = num(s.match(/actual [^0-9$-]*\$?(-?[\d.]+)/)[1]);
  const e = round(y - (M.a + M.b * x), 1);
  if (e === 0) return undefined;
  const mag = Math.abs(e);
  // the sentence may give the size to the nearest whole unit (e.g. $97 for 97.4)
  return idx(q, c => (e > 0 ? /^The model under-predicts/.test(c) && /above the prediction/.test(c) : /^The model over-predicts/.test(c) && /below the prediction/.test(c))
    && nums(c).some(v => Math.abs(v - mag) < 1e-9 || v === round(mag, 0)));
};
S.residCompare = q => {
  const M = modelOf(q), s = q.prompt.replace(MINUS, '-').replace(/(\d),(\d{3})/g, '$1$2');
  const grab = L => { const m = s.match(new RegExp(`\\b${L}: x = (-?[\\d.]+),? [^0-9-]*?(-?[\\d.]+)`)); return m ? { x: num(m[1]), y: num(m[2]) } : null; };
  const A = grab('A'), B = grab('B'); if (!A || !B) return undefined;
  const eA = A.y - (M.a + M.b * A.x), eB = B.y - (M.a + M.b * B.x);
  if (Math.abs(eA - eB) < 0.05) return idx(q, c => /equally far above/.test(c));
  const W = eA > eB ? 'A' : 'B';
  const cand = (q.choices ?? []).map((c, i) => (new RegExp(`^\\w+ ${W}:`).test(c) ? i : -1)).filter(i => i >= 0);
  if (cand.length === 1) return cand[0];
  return idx(q, c => new RegExp(`^\\w+ ${W}:`).test(c) && /residual/.test(c));
};

// residual-plot-construct
S.residPoint = q => {
  const card = pic(q).card, i = card.ring?.[0] ?? (num(q.prompt.match(/row (\d+)/)[1]) - 1);
  const x = num(card.cols[0].cells[i]), y = num(card.cols[1].cells[i]), yh = num(card.cols[2].cells[i]);
  return [x, round(y - yh, 2)];
};
S.residZero = q => {
  const g = pic(q).g, L = lineOf(g), hot = ptsOf(g).find(p => /^hot/.test(p.key)); if (!L || !hot) return undefined;
  const e = hot.y - (L.b + L.m * hot.x), tol = (g.y.max - g.y.min) * 0.004;
  if (Math.abs(e) <= tol) return idx(q, c => /lies exactly on the fitted line/.test(c));
  return idx(q, c => (e > 0 ? /is above the fitted line: the model under-predicts/ : /is below the fitted line: the model over-predicts/).test(c));
};

// residual-pattern
S.pattern = q => {
  const P = residPattern(residualsOf(q));
  const re = { random: /^Random scatter/, curve: /^A curved/, fan: /^A fan shape/, one: /^One large residual/ }[P.best];
  return re ? idx(q, c => re.test(c)) : undefined;
};
function twoPlots(q) { const P = pic(q); return [ptsOf(P.g), ptsOf(P.g2)]; }
S.strengthResid = q => {
  const [A, B] = twoPlots(q), sa = stats(A), sb = stats(B);
  const ra = Math.sqrt(sa.sse / (sa.n - 2)), rb = Math.sqrt(sb.sse / (sb.n - 2));
  const W = ra < rb ? 'A' : 'B';
  return idx(q, c => new RegExp(`^Plot ${W}: its points stay much closer`).test(c));
};

// least-squares-criterion
S.sseCompare = q => {
  const cols = pic(q).card.cols, P = cols.find(c => /^Line P$/.test(c.head)).cells.map(num), Qc = cols.find(c => /^Line Q$/.test(c.head)).cells.map(num);
  const sp = P.reduce((s, e) => s + e * e, 0), sq = Qc.reduce((s, e) => s + e * e, 0);
  if (Math.abs(sp - sq) < 1e-9) return undefined;
  const W = sp < sq ? 'P' : 'Q';
  return idx(q, c => c === `Line ${W}`);
};
S.sseCompute = q => { const e = pic(q).card.cols[0].cells.map(num); return round(e.reduce((s, v) => s + v * v, 0), 4); };

// enter-paired-data
S.pairedLists = q => {
  const s = q.prompt.replace(MINUS, '-');
  const pairs = [...s.matchAll(/\((-?[\d.]+), (-?[\d.]+)\)/g)].map(m => [num(m[1]), num(m[2])]);
  const cols = pic(q).card.cols, L1 = cols[0].cells.map(num), L2 = cols[1].cells.map(num);
  const key = p => `${p[0]}|${p[1]}`;
  const want = pairs.map(key).sort().join(), got = L1.map((x, i) => key([x, L2[i]])).sort().join();
  if (want === got && L1.length === pairs.length) return idx(q, c => /^Nothing is wrong/.test(c));
  const sorted = A => A.every((v, i) => i === 0 || A[i - 1] <= v);
  const xsSorted = pairs.map(p => p[0]).sort((a, b) => a - b).join(), ysSorted = pairs.map(p => p[1]).sort((a, b) => a - b).join();
  if (sorted(L1) && sorted(L2) && L1.join() === xsSorted && L2.join() === ysSorted) return idx(q, c => /sorted on its own/.test(c));
  // a skipped y: L1 in table order, L2 the table's y's with one left out from some row on
  const X = pairs.map(p => p[0]), Y = pairs.map(p => p[1]);
  if (L1.join() === X.join()) {
    for (let k = 0; k < Y.length; k++) {
      const shifted = Y.slice(0, k).concat(Y.slice(k + 1));
      if (L2.slice(0, shifted.length).join() === shifted.join()) return idx(q, c => /was skipped/.test(c));
    }
  }
  return undefined;
};

// technology-lsrl
S.readOutput = q => { const St = stats(ptsOf(pic(q).g)); return [r2(St.a), r2(St.b)]; };
S.lsrlData = q => { const St = stats(ptsOf(pic(q).g)); return [r2(St.a), r2(St.b)]; };

// slope-interpret
S.slopeSentence = q => {
  const M = modelOf(q), mag = Math.abs(M.b), dir = M.b < 0 ? /lower|drop|fewer|less/ : /higher|rise|more/;
  return idx(q, c => /^For each additional/.test(c) && /predicted/.test(c) && /on average/.test(c) && dir.test(c)
    && nums(c.replace(/1,000/g, '')).some(v => Math.abs(v - mag) < 1e-9) && !isCauseClaim(c));
};
S.slopeChange = q => {
  const M = modelOf(q), m = q.prompt.replace(MINUS, '-').replace(/(\d),(\d{3})/g, '$1$2').match(/from x = (-?[\d.]+) to x = (-?[\d.]+)/);
  const v = M.b * (num(m[2]) - num(m[1]));
  return roundsTenth(q) ? round(v, 1) : round(v, 6);
};

// intercept-interpret
S.interceptMeaning = q => {
  const m = q.prompt.replace(MINUS, '-').replace(/(\d),(\d{3})/g, '$1$2').match(/observed from (-?[\d.]+) to (-?[\d.]+)/);
  const lo = num(m[1]), hi = num(m[2]), inside = lo <= 0 && 0 <= hi;
  return idx(q, c => (inside ? /and that is meaningful here: x = 0 is inside the data/ : /but x = 0 is far outside the data/).test(c));
};
S.whichCoef = q => {
  const M = modelOf(q);
  const want = /change in .* for each additional/.test(q.prompt) ? M.b : /\b0 (square feet|miles|inches|pounds|hours|years)|0 inches across|age 0|0 feet|0°F|for a car that weighs 0/.test(q.prompt) ? M.a : NaN;
  if (Number.isNaN(want)) return undefined;
  return idx(q, c => Math.abs(num(c) - want) < 1e-9);
};

// r-obtain
S.readR = q => r2(stats(ptsOf(pic(q).g)).r);
S.rData = q => r2(stats(ptsOf(pic(q).g)).r);
S.rUnits = q => idx(q, c => /^r stays .*: r has no units/.test(c));

// r-direction
S.rSign = q => {
  const r = stats(ptsOf(pic(q).g)).r;
  let best = -1, d = Infinity;
  (q.choices ?? []).forEach((c, i) => { const v = num(c.replace(/^r = /, '')); if (Math.abs(v - r) < d) { d = Math.abs(v - r); best = i; } });
  return best;
};
S.rMismatch = q => {
  const r = stats(ptsOf(pic(q).g)).r, rep = num(q.prompt.match(/says r = (−?-?[\d.]+)/)[1]);
  if (Math.sign(r) !== Math.sign(rep)) return idx(q, c => /^The sign is wrong/.test(c) && (r < 0 ? /go down to the right, so r must be negative/ : /go up to the right, so r must be positive/).test(c));
  if (Math.abs(r - rep) <= 0.1) return idx(q, c => /^Nothing: the reported r matches/.test(c));
  return undefined;
};

// r-strength
S.rStrongest = q => {
  const vals = (q.choices ?? []).map(c => Math.abs(num(c.replace(/^r = /, ''))));
  const target = /weakest/.test(q.prompt) ? Math.min(...vals) : Math.max(...vals);
  return vals.filter(v => v === target).length === 1 ? vals.indexOf(target) : undefined;
};
S.steepTight = q => {
  const [A, B] = twoPlots(q), ra = Math.abs(stats(A).r), rb = Math.abs(stats(B).r);
  const given = nums(q.prompt.match(/One plot has r = .*?, the other r = [-−]?[\d.]+/)[0]).map(Math.abs);
  const hi = Math.max(...given), lo = Math.min(...given);
  const [wa, wb] = ra > rb ? [hi, lo] : [lo, hi];
  return idx(q, c => { const v = nums(c).map(Math.abs); return v.length === 2 && v[0] === wa && v[1] === wb; });
};

// r-linear-only
S.rZero = q => idx(q, c => /^There is no LINEAR association, but y depends on x completely/.test(c));
S.highRCurve = q => {
  const P = residPattern(residualsOf(q));
  return P.best === 'curve' ? idx(q, c => /^No: the residual plot curves/.test(c)) : undefined;
};

// interpolation-extrapolation
S.interExtra = q => {
  const s = q.prompt.replace(MINUS, '-').replace(/(\d),(\d{3})/g, '$1$2');
  const m = s.match(/from (-?[\d.]+) to (-?[\d.]+)/), x = num(s.match(/prediction at x = (-?[\d.]+)/)[1]);
  const inside = num(m[1]) <= x && x <= num(m[2]);
  return idx(q, c => (inside ? /^Interpolation:/ : /^Extrapolation:/).test(c));
};
S.extraNonsense = q => {
  const s = q.prompt.replace(MINUS, '-').replace(/(\d),(\d{3})/g, '$1$2');
  const m = s.match(/from (-?[\d.]+) to (-?[\d.]+)/), x = num(s.match(/\(x = (-?[\d.]+)\)/)[1]);
  const outside = x < num(m[1]) || x > num(m[2]);
  return outside ? idx(q, c => /is far outside the data .*: the trend need not continue there/.test(c)) : undefined;
};

// representative-data, population-scope
S.represent = q => idx(q, c => /like those in the data:/.test(c));
S.bigSample = q => idx(q, c => /^The random sample of/.test(c));
/** a case outside the data's population or conditions (another place, kind, age group, season or way of measuring) */
const OTHER = /Arizona|electric|\bchild\b|\d+-year-old with an arm span|pine|January|Manhattan|summer-session|carpet with shoes|physics|office worker|another school|other city|truck/i;
function caseInterval(q) { const m = q.prompt.replace(MINUS, '-').replace(/(\d),(\d{3})/g, '$1$2').match(/from (-?[\d.]+) to (-?[\d.]+)/); return [num(m[1]), num(m[2])]; }
function caseX(text, q) {
  const s = String(text).replace(/(\d),(\d{3})/g, '$1$2');
  const units = /(-?[\d.]+)(?:-| )(?:mile|inch|thousand|square|hours?|year|°F|-inch)/;
  const m = s.match(/(-?[\d.]+)\s*(?:thousand feet|thousand pounds|square feet|inches|hours|-mile|-inch|-year-old|°F|miles)/) ?? s.match(units);
  return m ? num(m[1]) : NaN;
}
S.scope = q => {
  const caseText = q.prompt.split(/Should it be used to predict/)[1] ?? '';
  if (OTHER.test(caseText)) return idx(q, c => /^Not without new data/.test(c));
  const [lo, hi] = caseInterval(q), x = caseX(caseText, q);
  if (!(lo <= x && x <= hi)) return undefined;
  return idx(q, c => /^Yes, as an estimate/.test(c));
};
S.scopeWhich = q => {
  const [lo, hi] = caseInterval(q);
  return idx(q, c => { const x = caseX(c, q); return !OTHER.test(c) && lo <= x && x <= hi; });
};

// lurking-variable, experiment-for-cause
S.lurking = q => idx(q, c => !/different units|^The correlation is strong, so|^There can be no real association/.test(c)
  && /other way|coincidence|drives both|drive both|both happen/i.test(c));
S.causeClaim = q => idx(q, c => /tends? to go with .*: an association/.test(c));
S.design = q => idx(q, c => /^Randomly assign/.test(c));
S.designLimits = q => {
  if (/Why can't researchers/.test(q.prompt)) return idx(q, c => /unethical|impossible to assign/.test(c));
  return idx(q, c => /caused the change for people like these/.test(c));
};

// influential-point
function refitSlopes(q) {
  const pts = ptsOf(pic(q).g), A = pts.find(p => p.name === 'A'), B = pts.find(p => p.name === 'B');
  const all = stats(pts), noA = A ? stats(pts.filter(p => p !== A)) : null, noB = B ? stats(pts.filter(p => p !== B)) : null;
  return { all, noA, noB, A, B };
}
S.refit = q => {
  const { all, noA, noB } = refitSlopes(q); if (!noA || !noB) return undefined;
  const dA = Math.abs(noA.b - all.b), dB = Math.abs(noB.b - all.b);
  if (Math.max(dA, dB) < 2 * Math.min(dA, dB)) return undefined;
  const W = dA > dB ? 'A' : 'B';
  return idx(q, c => new RegExp(`^${W}: removing it changes the slope`).test(c));
};
S.reportNotDelete = q => idx(q, c => /^Check B for a recording error; if it is real, report the fit with and without it/.test(c));

// three-check-critique
S.critique = q => {
  const claim = (q.prompt.match(/Claim: "(.*)"/) ?? [])[1] ?? '';
  const fails = [];
  const P = residPattern(residualsOf(q));
  if (P.best === 'curve') fails.push('Fit');
  const [lo, hi] = caseInterval(q);
  const x = nums(claim.replace(/ is about .*$/, ''))[0];
  if (/predicted/.test(claim) && Number.isFinite(x) && (x < lo || x > hi)) fails.push('Scope');
  if (isCauseClaim(claim) || /\bwould (raise|lower|cut|add)|\bif .* (more|less|longer)|\bincreas(e|ing) .* (will|would)/i.test(claim)) fails.push('Cause');
  // two failing checks: answer with the claim's own fault (scope / cause); sane() reports the item
  const key = fails.find(f => f !== 'Fit') ?? fails[0] ?? 'Nothing';
  return idx(q, c => c.startsWith(key + ':'));
};

// r-squared
S.r2SS = q => { const [sst, sse] = [num(q.prompt.match(/SST = ([\d.,]+)/)[1]), num(q.prompt.match(/SSE = ([\d.,]+)/)[1])]; return round(100 * (1 - sse / sst), 0); };
S.r2Sentence = q => {
  const v = num(q.prompt.match(/r² = ([\d.]+)/)[1]);
  return idx(q, c => /of the variation in .* is accounted for by the linear model/.test(c) && nums(c).some(n => Math.abs(n - v * 100) < 1e-6));
};
S.rFromR2 = q => {
  const s = q.prompt.replace(MINUS, '-');
  if (/What is r²/.test(s)) { const r = num(s.match(/r = (-?[\d.]+)/)[1]); return round(r * r, 2); }
  const M = modelOf(q), v = num(s.match(/r² = ([\d.]+)/)[1]);
  return round(Math.sign(M.b) * Math.sqrt(v), 2);
};
S.r2Compare = q => {
  if (/same data and the same response/.test(q.prompt)) {
    const v = [...q.prompt.matchAll(/model (\d) has r² = ([\d.]+)/g)].map(m => ({ k: m[1], v: num(m[2]) }));
    const best = v[0].v > v[1].v ? v[0].k : v[1].k;
    return idx(q, c => new RegExp(`^Model ${best} accounts for more of the variation; before using it, check its residual plot`).test(c));
  }
  if (/one point/.test(q.prompt)) return idx(q, c => /rests on one point/.test(c));
  if (/gives r² = .*; .* gives r² =/.test(q.prompt)) {
    // different responses: r² values do not compare
    const resp = [...q.prompt.matchAll(/(?::|;) ([a-z ]+?) against ([a-z ]+?) gives/g)].map(m => m[1].trim());
    if (resp.length === 2 && resp[0] !== resp[1]) return idx(q, c => /^Neither can be called better from r²/.test(c));
  }
  return undefined;
};

// ---------------------------------------------------------------- export
function solve(q) {
  const f = S[q.family];
  if (!f) return undefined;
  const v = f(q);
  return q.input === 'choice' && v === -1 ? undefined : v;
}

// ---------------------------------------------------------------- sane: what a 14-18-year-old would find unfair
const RANGE = [
  [/Test score|test score/, 0, 100],
  [/Sleep/, 3, 12],
  [/Height \(inches\)/, 20, 84],
  [/Arm span|Foot length/, 5, 90],
  [/Hot drinks|Monthly rent|Commute time|Height \(feet\)|Highway mileage|Points per game/, 0, Infinity],
];
function sane(q) {
  const out = [];
  const P = pic(q);
  for (const k of ['g', 'g2']) {
    const g = P[k]; if (!g || g.resid) continue;
    for (const p of ptsOf(g)) {
      for (const [re, lo, hi] of RANGE) if (re.test(g.y?.name ?? '') && (p.y < lo || p.y > hi)) out.push(`${g.y.name} = ${p.y} is impossible`);
      if (p.x < g.x.min - 1e-9 || p.x > g.x.max + 1e-9 || p.y < g.y.min - 1e-9 || p.y > g.y.max + 1e-9) out.push(`point (${p.x}, ${p.y}) is off the drawn grid`);
    }
  }
  // stated numbers must match the data the student sees
  const fam = q.family;
  if (fam === 'readOutput' || fam === 'readR') {
    const St = stats(ptsOf(P.g)), card = P.card;
    const vals = (card?.lines ?? []).map(l => { const m = l.replace(MINUS, '-').match(/^\s*(\w+²?)\s*=\s*(-?[\d.]*)/); return m ? [m[1], num(m[2])] : null; }).filter(Boolean);
    const want = { r: St.r, 'r²': St.r * St.r };
    if (card?.lines?.[0] === 'y=a+bx') Object.assign(want, { a: St.a, b: St.b });
    else if (card?.lines?.[0] === 'y=ax+b') Object.assign(want, { a: St.b, b: St.a });
    else if (/mx/.test(card?.title ?? '')) Object.assign(want, { m: St.b, b: St.a });
    for (const [k, v] of vals) if (k in want && Math.abs(v - want[k]) > 0.002 * Math.max(1, Math.abs(want[k]))) out.push(`card ${k} = ${v} but the points give ${want[k].toFixed(4)}`);
    if (card?.cols) {
      const c = card.cols[1].cells.map(num), w = [St.b, St.a, St.r * St.r, St.r];
      c.forEach((v, i) => { if (Math.abs(v - w[i]) > 0.002 * Math.max(1, Math.abs(w[i]))) out.push(`spreadsheet value ${v} but the points give ${w[i].toFixed(4)}`); });
    }
  }
  if (['readOutput', 'lsrlData'].includes(fam)) { const St = stats(ptsOf(P.g)); if (tie(St.a, 2) || tie(St.b, 2)) out.push('a coefficient is a .xx5 rounding tie'); }
  if (['readR', 'rData'].includes(fam)) { const r = stats(ptsOf(P.g)).r; if (tie(r, 2)) out.push('r is a .xx5 rounding tie'); }
  if (fam === 'residMeaning') {
    const M = modelOf(q), s = q.prompt.replace(MINUS, '-').replace(/(\d),(\d{3})/g, '$1$2');
    const x = num(s.match(/has x = (-?[\d.]+)/)[1]), y = num(s.match(/actual [^0-9$-]*\$?(-?[\d.]+)/)[1]);
    const stated = num(s.match(/residual is (-?[\d.]+)/)[1]);
    if (Math.abs(round(y - M.a - M.b * x, 1) - stated) > 1e-9) out.push(`stated residual ${stated} but y − ŷ = ${round(y - M.a - M.b * x, 2)}`);
  }
  if (fam === 'obsPred') {
    const M = modelOf(q), c = P.card?.cols;
    if (c) c[0].cells.forEach((x, i) => { const w = round(M.a + M.b * num(x), 1); if (Math.abs(num(c[2].cells[i]) - w) > 0.051) out.push(`ŷ in row ${i + 1} is ${c[2].cells[i]} but the line gives ${w}`); });
  }
  if (fam === 'residPoint') {
    // the table's ŷ should come from one line
    const c = P.card.cols, X = c[0].cells.map(num), YH = c[2].cells.map(num);
    const St = stats(X.map((x, i) => ({ x, y: YH[i] })));
    if (Math.sqrt(St.sse / X.length) > 0.06) out.push('the ŷ column is not on one line');
  }
  if (fam === 'residZero') {
    const g = P.g, L = lineOf(g), hot = ptsOf(g).find(p => /^hot/.test(p.key));
    if (L && hot) {
      const e = hot.y - (L.b + L.m * hot.x), said = /is above the 0 line/.test(q.prompt) ? 1 : /is below the 0 line/.test(q.prompt) ? -1 : 0;
      const tol = (g.y.max - g.y.min) * 0.004, real = Math.abs(e) <= tol ? 0 : Math.sign(e);
      if (said !== real) out.push(`prompt says the point is ${said > 0 ? 'above' : said < 0 ? 'below' : 'on'} the 0 line, but its residual is ${e.toFixed(2)}`);
      const rh = ptsOf(P.g2).find(p => /^rhot/.test(p.key));
      if (rh && Math.abs(rh.y - e) > 0.05) out.push(`residual plot shows ${rh.y} for the highlighted point, the line gives ${e.toFixed(2)}`);
    }
  }
  if (['pattern', 'highRCurve', 'critique'].includes(fam)) {
    const R = residPattern(residualsOf(q));
    if (R.kind === 'unclear' && !fan_one(R)) out.push(`residual plot has no clear reading (curve ${R.curve.toFixed(2)}, one ${R.one.toFixed(2)}, fan ${R.fan.toFixed(2)})`);
    if (P.g2?.resid) {
      // the drawn residuals must belong to the drawn line
      const L = lineOf(P.g), pts = ptsOf(P.g), rp = ptsOf(P.g2);
      if (L && rp.length === pts.length) pts.forEach((p, i) => { const e = p.y - L.b - L.m * p.x; if (Math.abs(e - rp[i].y) > 0.06 * Math.max(1, R.rms)) out.push(`residual of point ${i + 1} drawn ${rp[i].y.toFixed(2)}, line gives ${e.toFixed(2)}`); });
    }
  }
  if (['highRCurve', 'critique', 'causeClaim', 'steepTight'].includes(fam) && P.g) {
    const pts = ptsOf(P.g), r = stats(pts).r;
    const m = q.prompt.replace(MINUS, '-').match(/\br = (-?[\d.]+)/);
    if (m && fam !== 'steepTight' && Math.abs(num(m[1]) - r) > 0.015) out.push(`stated r = ${m[1]} but the points give ${r.toFixed(3)}`);
    if (fam === 'critique') {
      const M = modelOf(q), St = stats(pts);
      const em = q.prompt.replace(MINUS, '-').match(/ŷ = (-?[\d.]+) ([+-]) ([\d.]+)x/), dec = t => (t.split('.')[1] ?? '').length;
    if (M && em && (Math.abs(M.a - St.a) > 0.5 * 10 ** -dec(em[1]) + 1e-9 || Math.abs(M.b - St.b) > 0.5 * 10 ** -dec(em[3]) + 1e-9)) out.push(`stated line ŷ = ${M.a} + ${M.b}x but the points give ${St.a.toFixed(3)} + ${St.b.toFixed(4)}x`);
    }
  }
  if (fam === 'steepTight') {
    const [A, B] = twoPlots(q), ra = Math.abs(stats(A).r), rb = Math.abs(stats(B).r);
    const given = nums(q.prompt.match(/One plot has r = .*?, the other r = [-−]?[\d.]+/)[0]).map(Math.abs).sort();
    const got = [ra, rb].sort();
    if (Math.abs(given[0] - got[0]) > 0.015 || Math.abs(given[1] - got[1]) > 0.015) out.push(`given r values ${given} but the plots give ${got.map(v => v.toFixed(3))}`);
  }
  if (fam === 'strengthResid') {
    const [A, B] = twoPlots(q), sa = stats(A), sb = stats(B);
    const ra = Math.sqrt(sa.sse / (sa.n - 2)), rb = Math.sqrt(sb.sse / (sb.n - 2));
    if (Math.max(ra, rb) < 1.5 * Math.min(ra, rb)) out.push(`residual sizes too close to call (${ra.toFixed(2)} vs ${rb.toFixed(2)})`);
    if ((Math.abs(sa.r) > Math.abs(sb.r)) !== (ra < rb)) out.push(`the tighter plot by residuals has the smaller |r| (${sa.r.toFixed(2)} vs ${sb.r.toFixed(2)})`);
    if (Math.abs(Math.abs(sa.r) - Math.abs(sb.r)) < 0.15) out.push(`|r| gap under 0.15 (${sa.r.toFixed(2)} vs ${sb.r.toFixed(2)})`);
    const LA = lineOf(P.g), LB = lineOf(P.g2);
    if (LA && Math.abs(LA.m - sa.b) > 1e-6) out.push('plot A line is not its least-squares line');
    if (LB && Math.abs(LB.m - sb.b) > 1e-6) out.push('plot B line is not its least-squares line');
  }
  if (fam === 'refit') {
    const { all, noA, noB } = refitSlopes(q), cells = P.card.cols;
    const b = cells[1].cells.map(num), r = cells[2].cells.map(num), w = [all, noA, noB];
    w.forEach((S1, i) => { if (S1 && (Math.abs(r2(S1.b) - b[i]) > 0.011 || Math.abs(r2(S1.r) - r[i]) > 0.011)) out.push(`card row ${i + 1}: b ${b[i]}, r ${r[i]} but the points give ${S1.b.toFixed(3)}, ${S1.r.toFixed(3)}`); });
    if (noA && noB) { const dA = Math.abs(noA.b - all.b), dB = Math.abs(noB.b - all.b); if (Math.max(dA, dB) < 2 * Math.min(dA, dB)) out.push('neither point is clearly more influential'); }
  }
  if (fam === 'reportNotDelete') {
    const { all, noB } = refitSlopes(q), s = q.prompt.replace(MINUS, '-');
    const m = s.match(/With B the slope is (-?[\d.]+); without B it is (-?[\d.]+)/);
    if (m && noB && (Math.abs(num(m[1]) - r2(all.b)) > 0.011 || Math.abs(num(m[2]) - r2(noB.b)) > 0.011)) out.push(`stated slopes ${m[1]} / ${m[2]} but the points give ${all.b.toFixed(3)} / ${noB.b.toFixed(3)}`);
  }
  if (fam === 'rSign' || fam === 'rMismatch') {
    const r = stats(ptsOf(P.g)).r;
    if (fam === 'rSign') { const close = (q.choices ?? []).map(c => Math.abs(num(c.replace(/^r = /, '')) - r)).sort((a, b) => a - b); if (close[0] > 0.1) out.push(`no choice is near the plot's r = ${r.toFixed(2)}`); if (close[1] - close[0] < 0.2) out.push('two choices fit the plot'); }
    if (fam === 'rMismatch') { const rep = num(q.prompt.replace(MINUS, '-').match(/says r = (-?[\d.]+)/)[1]); if (Math.abs(Math.abs(rep) - Math.abs(r)) > 0.1) out.push(`reported |r| ${rep} far from the plot's ${r.toFixed(2)}`); }
  }
  if (fam === 'rZero') { const pts = ptsOf(P.g); if (pts.length) { const r = stats(pts).r; if (Math.abs(r) >= 0.005) out.push(`the points give r = ${r.toFixed(3)}, not 0.00`); } }
  if (fam === 'exactStat') {
    const d = exactData(q);
    if (d !== null && d !== exactRule(q.prompt)) out.push(`the data ${d ? 'lie exactly on a rule' : 'scatter'}, but the context reads ${d ? 'statistical' : 'exact'}`);
  }
  if (fam === 'interceptMeaning') {
    const m = q.prompt.replace(MINUS, '-').replace(/(\d),(\d{3})/g, '$1$2').match(/observed from (-?[\d.]+) to (-?[\d.]+)/);
    const lo = num(m[1]), hi = num(m[2]);
    if (lo > 0 && lo < 0.1 * (hi - lo)) out.push(`x = 0 is called far outside the data, but the data start at ${lo}`);
  }
  if (fam === 'extraNonsense') {
    const M = modelOf(q), s = q.prompt.replace(MINUS, '-').replace(/(\d),(\d{3})/g, '$1$2');
    const x = num(s.match(/\(x = (-?[\d.]+)\)/)[1]), said = num(s.match(/predicts ŷ = (-?[\d.]+)/)[1]);
    if (Math.abs(round(M.a + M.b * x, 1) - said) > 0.051) out.push(`stated ŷ ${said} but the line gives ${round(M.a + M.b * x, 2)}`);
  }
  if (fam === 'eyeCritique' && eyeVerdict(q) === 'unclear') out.push('the drawn line has no single clear fault');
  if (fam === 'pattern') {
    const R = residPattern(residualsOf(q));
    if (fan_one(R)) out.push(`fan (spread ratio ${R.fan.toFixed(1)}) and one large residual (${R.lead.toFixed(1)}× the next) both show`);
  }
  if (fam === 'critique') {
    const claim0 = (q.prompt.match(/Claim: "(.*)"/) ?? [])[1] ?? '';
    const R = residPattern(residualsOf(q)), [lo, hi] = caseInterval(q), x0 = nums(claim0.replace(/ is about .*$/, ''))[0];
    const n = (R.best === 'curve') + (/predicted/.test(claim0) && (x0 < lo || x0 > hi)) + isCauseClaim(claim0);
    if (n > 1) out.push('the claim fails more than one check');
    const claim = (q.prompt.match(/Claim: "(.*)"/) ?? [])[1] ?? '';
    const M = modelOf(q), x = nums(claim.replace(/ is about .*$/, ''))[0], said = nums(claim.replace(/^.*about/, ''))[0];
    if (/predicted .* about/.test(claim) && M && Number.isFinite(x) && Number.isFinite(said) && Math.abs(round(M.a + M.b * x, 1) - said) > 0.051 && Math.abs(round(M.a + M.b * x, 2) - said) > 0.0051) out.push(`claim says ${said} but the line gives ${(M.a + M.b * x).toFixed(2)}`);
  }
  return [...new Set(out)].join('; ');
}

export default { solve, sane };
