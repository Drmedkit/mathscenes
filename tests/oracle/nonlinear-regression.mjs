// Oracle for the lesson "nonlinear-regression" (HS Statistics: quadratic and exponential regression).
// Written from what the student sees only (docs/lessons/QUALITY_LAYER.md, "O: the oracle"): the prompt, the board,
// the choices and the picture data (scatter plots, drawn models, residual plots, data / output cards, difference
// tables). Every QuadReg (least squares on y), ExpReg (least squares on ln y, as TI calculators do), residual,
// prediction and solve is recomputed here from the data / the stated model. Choices are decided by testing each
// statement against the numbers, never by "the one that sounds like the lesson".
// Residual-pattern reading follows DESIGN.md: "pattern" = few long sign runs and most of the residuals' size a smooth
// curve (a parabola or a cubic explains > 75%); "no pattern" = at least n/2 sign runs and a parabola explains < 35%.
// Rounding: half away from zero to the places the item names; endpoints of the observed inputs count as inside.
import { nums, round } from '../../tools/quality/oracle-kit.mjs';

// ---------------------------------------------------------------- reading
const MINUS = /[−–]/g;
const norm = s => String(s ?? '').replace(MINUS, '-').replace(/(\d),(\d{3})(?!\d)/g, '$1$2').replace(/(\d),(\d{3})(?!\d)/g, '$1$2');
const num = s => Number(norm(s).trim().replace(/^\$/, '').replace(/^(-?)\./, '$10.'));
const pic = q => q.data?.picture ?? {};
const ptsOf = g => (g?.items ?? []).filter(i => i.kind === 'point').map(p => ({ x: p.x, y: p.y, key: p.key })).sort((a, b) => a.x - b.x);
const modelsOf = g => (g?.items ?? []).filter(i => i.kind === 'model');
const idx = (q, pred) => { const h = (q.choices ?? []).map((c, i) => (pred(c, i) ? i : -1)).filter(i => i >= 0); return h.length === 1 ? h[0] : -1; };
const near = (a, b, tol = 1e-6) => Math.abs(a - b) <= tol * Math.max(1, Math.abs(b));
/** the places an item asks for */
function places(text) {
  const s = String(text);
  if (/tenth of a foot|nearest tenth|nearest 10 cents/i.test(s)) return 1;
  if (/nearest hundredth/i.test(s)) return 2;
  const m = s.match(/(\d) decimal places/); if (m) return Number(m[1]);
  if (/nearest whole number|whole numbers|nearest foot|nearest dollar/i.test(s)) return 0;
  return null;
}
/** a ".x5" tie at `p` decimals (within 2% of a rounding unit) */
const tie = (v, p) => { const k = Math.abs(v) * 10 ** p, f = k - Math.floor(k); return Math.abs(f - 0.5) < 0.02; };
/** a card line "a=−.0125" / "a=9.6903E−5" → number */
function cardVal(lines, key) {
  for (const l of lines ?? []) {
    const m = norm(l).match(new RegExp(`(?:^|\\s)${key}=(-?[\\d.]+(?:E-?\\d+)?)`));
    if (m) return Number(m[1].replace(/^(-?)\./, '$10.'));
  }
  return NaN;
}
/** quadratic ax² + bx + c in a text after "=" (variable x or t) → [a, b, c] */
function quadIn(text, v = '[xt]') {
  const s = norm(text).replace(/<[^>]+>/g, '');
  const re = new RegExp(`=\\s*((?:[-+]?\\s*[\\d.]*(?:e-?\\d+)?\\s*${v}(?:²|\\^2)?\\s*)+(?:[-+]\\s*[\\d.]*\\d(?![\\d.]*\\s*${v}))?)`);
  const m = s.match(re); if (!m) return null;
  const body = m[1].replace(/\s+/g, '');
  const out = [0, 0, 0];
  for (const t of body.match(new RegExp(`[-+]?[\\d.]*(?:e-?\\d+)?(?:${v}(?:²|\\^2)?)?`, 'g')).filter(Boolean)) {
    const sq = /²|\^2/.test(t), hasV = new RegExp(v).test(t);
    let c = t.replace(new RegExp(`${v}(?:²|\\^2)?`), '');
    c = c === '' || c === '+' ? 1 : c === '-' ? -1 : Number(c);
    if (sq) out[0] += c; else if (hasV) out[1] += c; else out[2] += c;
  }
  return out;
}
/** exponential a(b)^x in a text → [a, b] */
function expIn(text) {
  const m = norm(text).replace(/<[^>]+>/g, '').match(/(?:=|and)\s*([\d.]*\d)\(([\d.]*\d)\)\s*\^?\s*[xt]?/);
  return m ? [Number(m[1]), Number(m[2])] : null;
}
const qf = ([a, b, c]) => x => a * x * x + b * x + c;
const ef = ([a, b]) => x => a * b ** x;

// ---------------------------------------------------------------- fitting
/** solve a small linear system (Gauss) */
function gauss(A, v) {
  const n = v.length, M = A.map((r, i) => [...r, v[i]]);
  for (let c = 0; c < n; c++) {
    let p = c; for (let r = c + 1; r < n; r++) if (Math.abs(M[r][c]) > Math.abs(M[p][c])) p = r;
    [M[c], M[p]] = [M[p], M[c]];
    if (Math.abs(M[c][c]) < 1e-300) return null;
    for (let r = 0; r < n; r++) if (r !== c) { const f = M[r][c] / M[c][c]; for (let k = c; k <= n; k++) M[r][k] -= f * M[c][k]; }
  }
  return M.map((r, i) => r[n] / r[i]);
}
/** least-squares polynomial of degree d (coefficients high → low), centred for stability */
function polyFit(P, d) {
  const n = P.length; if (n <= d) return null;
  const c = P.reduce((s, p) => s + p.x, 0) / n, sc = Math.max(1e-12, Math.max(...P.map(p => Math.abs(p.x - c))));
  const X = P.map(p => (p.x - c) / sc);
  const A = [], v = [];
  for (let i = 0; i <= d; i++) { A.push([]); for (let j = 0; j <= d; j++) A[i].push(X.reduce((s, x) => s + x ** (i + j), 0)); v.push(P.reduce((s, p, k) => s + X[k] ** i * p.y, 0)); }
  const w = gauss(A, v); if (!w) return null;
  const f = x => { const u = (x - c) / sc; return w.reduce((s, wi, i) => s + wi * u ** i, 0); };
  return f;
}
function linFit(P) {
  const n = P.length, mx = P.reduce((s, p) => s + p.x, 0) / n, my = P.reduce((s, p) => s + p.y, 0) / n;
  let sxx = 0, sxy = 0; for (const p of P) { sxx += (p.x - mx) ** 2; sxy += (p.x - mx) * (p.y - my); }
  const b = sxx ? sxy / sxx : 0; return { a: my - b * mx, b, f: x => my - b * mx + b * x };
}
/** QuadReg: [a, b, c] by the normal equations on raw x */
function quadReg(P) {
  const n = P.length, c0 = P.reduce((s, p) => s + p.x, 0) / n;
  // centred, then expanded back
  const Q = P.map(p => ({ x: p.x - c0, y: p.y }));
  const s = k => Q.reduce((u, p) => u + p.x ** k, 0), t = k => Q.reduce((u, p) => u + p.x ** k * p.y, 0);
  const w = gauss([[s(4), s(3), s(2)], [s(3), s(2), s(1)], [s(2), s(1), n]], [t(2), t(1), t(0)]);
  if (!w) return null;
  const [A, B, C] = w; // A(x−c0)² + B(x−c0) + C
  return [A, B - 2 * A * c0, A * c0 * c0 - B * c0 + C];
}
/** ExpReg (TI): least squares of ln y on x → [a, b] */
function expReg(P) {
  if (P.some(p => !(p.y > 0))) return null;
  const L = linFit(P.map(p => ({ x: p.x, y: Math.log(p.y) })));
  return [Math.exp(L.a), Math.exp(L.b)];
}
const sse = (P, f) => P.reduce((s, p) => s + (p.y - f(p.x)) ** 2, 0);

// ---------------------------------------------------------------- residual patterns (DESIGN.md)
function runsOf(E) {
  const s = E.filter(e => Math.abs(e) > 1e-9).map(Math.sign);
  let r = s.length ? 1 : 0; for (let i = 1; i < s.length; i++) if (s[i] !== s[i - 1]) r++;
  return r;
}
/** share of Σe² that a smooth curve of degree d (with intercept) explains */
function share(R, d) {
  const tot = R.reduce((s, r) => s + r.y * r.y, 0); if (!tot) return 0;
  const f = polyFit(R, d); if (!f) return 0;
  return 1 - sse(R, f) / tot;
}
/** R: [{x, y=e}] → { kind: 'pattern' | 'none' | 'unclear' (DESIGN.md zones), best: 'pattern' | 'none', runs, p2, p3 } */
function pattern(R) {
  R = [...R].sort((a, b) => a.x - b.x);
  const n = R.length, runs = runsOf(R.map(r => r.y)), p2 = share(R, 2), p3 = n >= 6 ? share(R, 3) : p2;
  let kind = 'unclear';
  if (Math.max(p2, p3) >= 0.75 && runs < n / 2) kind = 'pattern';
  else if (runs >= n / 2 && p2 < 0.35 && p3 < 0.75) kind = 'none';
  // outside both clear zones: the reading a teacher would lean to (a smooth curve that explains most of the residuals
  // = a pattern, else none); sane() reports every such plot that decides an answer as having no clear reading
  const best = kind !== 'unclear' ? kind : Math.max(p2, p3) >= 0.75 ? 'pattern' : 'none';
  return { kind, best, runs, p2, p3, n };
}
const residPlot = g => ptsOf(g).map(p => ({ x: p.x, y: p.y }));
const rms = R => Math.sqrt(R.reduce((s, r) => s + r.y * r.y, 0) / R.length);
const maxAbs = R => Math.max(...R.map(r => Math.abs(r.y)));

// ---------------------------------------------------------------- the families
const S = {};

// family-from-shape
function shapeOf(P) {
  const L = linFit(P), Q = quadReg(P), sL = sse(P, L.f), sQ = sse(P, qf(Q));
  const gain = sL > 1e-12 ? (sL - sQ) / sL : 0;
  const lo = P[0].x, hi = P[P.length - 1].x, span = hi - lo, xv = -Q[1] / (2 * Q[0]);
  // a turn: the parabola's vertex well inside the data, and the data really come back (both ends clearly below/above the extreme)
  const ys = P.map(p => p.y), iMax = ys.indexOf(Math.max(...ys)), iMin = ys.indexOf(Math.min(...ys));
  const noise = Math.sqrt(sQ / Math.max(1, P.length - 3));
  const range = Math.max(...ys) - Math.min(...ys);
  const comeBack = i => i > 0 && i < P.length - 1 && Math.min(Math.abs(ys[i] - ys[0]), Math.abs(ys[i] - ys[P.length - 1])) > Math.max(2 * noise, 0.15 * range);
  const turn = xv > lo + 0.15 * span && xv < hi - 0.15 * span && (Q[0] < 0 ? comeBack(iMax) : comeBack(iMin));
  return { gain, turn, xv, lo, hi, span, Q };
}
S.shapeFamily = q => {
  const P = ptsOf(pic(q).g), sh = shapeOf(P);
  if (sh.turn) return idx(q, c => /^Quadratic only/.test(c));
  if (sh.gain < 0.5) return idx(q, c => /^Linear only/.test(c));
  return idx(q, c => /^Quadratic or exponential/.test(c));
};
S.shapeTurn = q => {
  if (/Could a quadratic model follow/.test(q.prompt)) return idx(q, c => /^Yes: one side of a parabola can bend this way/.test(c));
  if (/Can any exponential follow/.test(q.prompt)) return idx(q, c => /^No: y = a·b\^x only rises or only falls/.test(c));
  return undefined;
};

// table-difference-ratio-test
const diffs = A => A.slice(1).map((v, i) => v - A[i]);
const allEq = (A, tol = 1e-9) => A.every(v => Math.abs(v - A[0]) <= tol * Math.max(1, Math.abs(A[0])));
S.diffTest = q => {
  const D = pic(q).diff, X = D.xs.map(num), Y = D.ys.map(num);
  if (!allEq(diffs(X))) return undefined;
  const d1 = diffs(Y), d2 = diffs(d1);
  const ratios = Y.every(y => y !== 0) ? Y.slice(1).map((v, i) => v / Y[i]) : null;
  if (allEq(d1)) return idx(q, c => /^Linear/.test(c));
  if (allEq(d2)) return idx(q, c => /^Quadratic/.test(c));
  if (ratios && allEq(ratios)) return idx(q, c => /^Exponential/.test(c));
  return idx(q, c => /^None/.test(c));
};
function spacingVerdict(q) {
  const D = pic(q).diff, X = D.xs.map(num), Y = D.ys.map(num), dx = diffs(X);
  const slopes = diffs(Y).map((d, i) => d / dx[i]);
  const unitF = Y.every(y => y > 0) ? Y.slice(1).map((v, i) => (v / Y[i]) ** (1 / dx[i])) : null;
  return { line: allEq(slopes, 1e-9), exp: !!unitF && allEq(unitF, 1e-6), slopes, unitF };
}
S.diffSpacing = q => {
  const v = spacingVerdict(q);
  const aboutLine = /cannot be linear/.test(q.prompt), aboutExp = /cannot be exponential/.test(q.prompt);
  const consistent = aboutLine ? v.line : aboutExp ? v.exp : null;
  if (consistent === null) return undefined;
  if (consistent) {
    const k = aboutLine ? v.slopes[0] : v.unitF[0];
    return idx(q, c => /^Lee is wrong: the x-steps are unequal/.test(c) && nums(c).some(n => near(n, k, 1e-6)));
  }
  return idx(q, c => /^Lee is right/.test(c));
};
function noisyVerdict(q) {
  const Y = pic(q).diff.ys.map(num), d2 = diffs(diffs(Y));
  const mean = d2.reduce((s, v) => s + v, 0) / d2.length, spread = Math.max(...d2) - Math.min(...d2);
  const sameSign = d2.every(v => Math.sign(v) === Math.sign(mean) && v !== 0);
  const close = sameSign && spread <= 0.5 * Math.abs(mean) + 1e-9;
  const far = !sameSign || spread > Math.abs(mean);
  // ratios judged on the growth they show: ln(ratio) (a ratio of 1.08 then 0.99 is not "close to constant")
  const R = Y.every(y => y > 0) ? Y.slice(1).map((v, i) => Math.log(v / Y[i])) : null;
  const rMean = R ? R.reduce((s, v) => s + v, 0) / R.length : 0, rSpread = R ? Math.max(...R) - Math.min(...R) : Infinity;
  const rSame = !!R && R.every(v => Math.sign(v) === Math.sign(rMean) && v !== 0);
  const ratiosClose = rSame && rSpread <= 0.2 * Math.abs(rMean), ratiosFar = !rSame || rSpread > 0.35 * Math.abs(rMean);
  return { close, far, ratiosClose, ratiosFar, d2 };
}
S.diffNoisy = q => {
  const v = noisyVerdict(q);
  if (v.close) return idx(q, c => /^They suggest a quadratic, but only provisionally/.test(c));
  if (v.far && v.ratiosFar) return idx(q, c => /^Inconclusive/.test(c));
  // in between (sane() reports it): the nearer reading
  return v.far ? idx(q, c => /^Inconclusive/.test(c)) : idx(q, c => /^They suggest a quadratic, but only provisionally/.test(c));
};

// residuals-curved-model
function residAsked(q) {
  const s = norm(q.prompt);
  const model = /\(([\d.]*\d)\)/.test(s.split('x = ')[0]) ? { f: ef(expIn(s)) } : { f: qf(quadIn(s.match(/ŷ = [^,]*/)[0])) };
  const m = s.match(/At (-?[\d.]*\d)\s*[^\d]*?observed value was \$?(-?[\d.]*\d)/);
  const x = Number(m[1]), y = Number(m[2]);
  return { x, y, e: y - model.f(x), p: places(q.prompt) };
}
S.residQuad = q => { const r = residAsked(q); return round(r.e, r.p ?? 2); };
S.residExp = S.residQuad;
S.residOne = q => idx(q, c => /^No: one residual says nothing about the others/.test(c));

// residual-pattern
S.patternPick = q => {
  const A = pattern(residPlot(pic(q).g)), B = pattern(residPlot(pic(q).g2));
  const ok = k => (k === 'none' ? true : k === 'pattern' ? false : null);
  const a = ok(A.best), b = ok(B.best);
  if (a === null || b === null) return undefined;
  if (a && !b) return idx(q, c => /^Only model A’s form fits/.test(c));
  if (!a && b) return idx(q, c => /^Only model B’s form fits/.test(c));
  if (a && b) return idx(q, c => /^Both forms fit/.test(c));
  return idx(q, c => /^Neither form fits/.test(c));
};
S.patternSumZero = q => {
  const R = residPlot(pic(q).g), P = pattern(R);
  if (P.best !== 'pattern') return undefined;
  const f = polyFit(R, 2), lo = R[0].x, hi = R[R.length - 1].x, mid = (lo + hi) / 2;
  const shape = f(mid) > (f(lo) + f(hi)) / 2 ? 'arch' : 'U';
  return idx(q, c => new RegExp(`^No: the residuals form an? ${shape},`).test(c));
};

// residual-size
S.sizeUse = q => {
  const A = rms(residPlot(pic(q).g)), B = rms(residPlot(pic(q).g2));
  const W = A < B ? 'A' : 'B';
  return idx(q, c => new RegExp(`^Model ${W}: its residuals are much smaller`).test(c));
};
function tolOf(q) { const m = norm(q.prompt).match(/within \$?([\d.]*\d)/); return m ? Number(m[1]) : NaN; }
S.sizeTol = q => {
  const R = residPlot(pic(q).g), T = tolOf(q), M = maxAbs(R);
  if (M <= T) return idx(q, c => /^Yes: every residual is well within the tolerance/.test(c));
  return idx(q, c => /^No: the residuals are much larger than the tolerance/.test(c));
};

// least-squares-criterion
S.sseCompare = q => {
  const cols = pic(q).card.cols, A = cols.find(c => /\(A\)/.test(c.head)).cells.map(num), B = cols.find(c => /\(B\)/.test(c.head)).cells.map(num);
  const sa = A.reduce((s, e) => s + e * e, 0), sb = B.reduce((s, e) => s + e * e, 0);
  if (sa === sb) return undefined;
  return idx(q, c => c === `Curve ${sa < sb ? 'A' : 'B'}`);
};
S.sseCompute = q => {
  const cols = pic(q).card.cols, Y = cols.find(c => c.head === 'y').cells.map(num), YH = cols.find(c => c.head === 'ŷ').cells.map(num);
  return round(Y.reduce((s, y, i) => s + (y - YH[i]) ** 2, 0), 6);
};

// quadratic-regression
const quadCard = q => { const L = pic(q).card.lines; return [cardVal(L, 'a'), cardVal(L, 'b'), cardVal(L, 'c')]; };
function atX(q) { const m = norm(q.prompt).match(/ at \$?(-?[\d.]*\d)\s*(?:mph|seconds?|hours?|days?|years?|°F)?\s*\./); return m ? Number(m[1]) : NaN; }
S.quadPredict = q => round(qf(quadCard(q))(atX(q)), places(q.prompt) ?? 1);
/** a recorded equation in a choice → [a, b, c] */
function choiceQuad(c) {
  const sup = { '⁰': 0, '¹': 1, '²': 2, '³': 3, '⁴': 4, '⁵': 5, '⁶': 6, '⁷': 7, '⁸': 8, '⁹': 9 };
  const s = norm(c).replace(/\s*×\s*10(⁻?)([⁰¹²³⁴⁵⁶⁷⁸⁹]+)/g, (_, m, d) => `e${m ? '-' : ''}${[...d].map(ch => sup[ch]).join('')}`);
  return quadIn(s, 'x');
}
S.quadPrecision = q => {
  const st = qf(quadCard(q)), m = norm(q.prompt).match(/x = (-?[\d.]*\d) to (-?[\d.]*\d)/), lo = Number(m[1]), hi = Number(m[2]);
  const ok = c => { const Qc = choiceQuad(c); if (!Qc) return false; const f = qf(Qc); let w = 0; for (let k = 0; k <= 400; k++) { const x = lo + (hi - lo) * k / 400; w = Math.max(w, Math.abs(f(x) - st(x))); } return w <= 1; };
  return idx(q, ok);
};
function listsOf(q) {
  const cols = pic(q).card.cols, L = cols.map(c => ({ name: c.head, v: c.cells.map(num) }));
  const big = num(norm(q.prompt).match(/largest: \$?(-?[\d.]*\d)/)[1]);
  const yl = L.filter(l => Math.max(...l.v) === big);
  return { L, yl, big };
}
S.quadLists = q => {
  const { L, yl } = listsOf(q); if (yl.length !== 1) return undefined;
  const y = yl[0].name, x = L.find(l => l !== yl[0]).name;
  return idx(q, c => c === `QuadReg ${x}, ${y}`);
};
S.quad3pts = q => {
  const g = pic(q).g, P = ptsOf(g), LS = quadReg(P), M = modelsOf(g);
  const match = M.filter(m => m.p.every((v, i) => Math.abs(v - LS[i]) <= 1e-6 * Math.max(1, Math.abs(LS[i]))));
  if (match.length !== 1) return undefined;
  return idx(q, c => new RegExp(`^Curve ${match[0].name}: it makes the sum of squared residuals`).test(c));
};

// log-response-scale
S.lnStep = q => {
  const Y = pic(q).card.cols.find(c => c.head === 'y').cells.map(num);
  return round(Math.log(Y[1] / Y[0]), places(q.prompt) ?? 3);
};
S.lnNonpos = q => idx(q, c => /^An error: ln is defined only for y > 0/.test(c));
S.lnRelative = q => {
  const cols = pic(q).card.cols, Y = cols.find(c => c.head === 'y').cells.map(num), YH = cols.find(c => c.head === 'ŷ').cells.map(num);
  const t = num(norm(q.prompt).match(/on the day with y = ([\d.]*\d)/)[1]), i = Y.indexOf(t);
  if (i < 0) return undefined;
  return round(Math.log(Y[i]) - Math.log(YH[i]), places(q.prompt) ?? 3);
};

// exponential-regression
const expCard = q => { const L = pic(q).card.lines; return [cardVal(L, 'a'), cardVal(L, 'b')]; };
S.expOut = q => {
  const [a, b] = expCard(q), pa = /a to the nearest whole number/.test(q.prompt) ? 0 : (Number((q.prompt.match(/a to (\d) decimal/) ?? [])[1] ?? 2));
  const pb = Number((q.prompt.match(/b to (\d)/) ?? [])[1] ?? 4);
  const A = round(a, pa), B = round(b, pb);
  const form = c => norm(c).match(/^ŷ = ([\d.]*\d)\(([\d.]*\d)\)x?$/);
  const exact = idx(q, c => { const m = form(c); return !!m && near(Number(m[1]), A, 1e-9) && near(Number(m[2]), B, 1e-9); });
  if (exact >= 0) return exact;
  // a shown value that is itself a .x5 tie (sane() reports it): the a·b^x choice within half a unit of the shown a and b
  return idx(q, c => { const m = form(c); return !!m && Math.abs(Number(m[1]) - a) <= 0.5 * 10 ** -pa + 1e-9 && Math.abs(Number(m[2]) - b) <= 0.5 * 10 ** -pb + 1e-9; });
};
S.expPredict = q => round(ef(expCard(q))(atX(q)), places(q.prompt) ?? 1);
S.expZero = q => idx(q, c => /^Keep the 0, check how it was measured/.test(c));
function toolsCard(q) {
  const L = pic(q).card.lines.map(norm), ti = L.find(l => /^a=.*b=/.test(l)), de = L.filter(l => /^a=.*b=/.test(l))[1];
  const ab = l => [Number(l.match(/a=(-?[\d.]*\d)/)[1]), Number(l.match(/b=(-?[\d.]*\d)/)[1])];
  return { ti: ab(ti), de: ab(de) };
}
S.expTools = q => {
  if (/Why\?/.test(q.prompt)) return idx(q, c => /^They minimize different sums: ExpReg the squared residuals of ln y, Desmos the squared residuals of y itself/.test(c));
  if (/smaller sum of squared residuals of y itself/.test(q.prompt)) {
    const P = ptsOf(pic(q).g), { ti, de } = toolsCard(q), st = sse(P, ef(ti)), sd = sse(P, ef(de));
    if (st === sd) return undefined;
    return idx(q, c => c === (sd < st ? 'The Desmos fit' : 'The ExpReg fit'));
  }
  return undefined;
};

// recode-input
S.recodeA = q => {
  const L = pic(q).card2.lines.map(norm), a = cardVal(L, 'a');
  const since = norm(q.prompt).match(/x = years since (\d{4})/);
  if (since) {
    const yr = since[1];
    return idx(q, c => new RegExp(`^The model’s estimate for ${yr} \\(x = 0\\): about`).test(c)
      && nums(c.replace(/\(x = 0\)/, '').replace(yr, '')).some(v => Math.abs(v - a) <= 0.5 + 1e-9 && (v === round(a, 0) || v === round(a, 1))));
  }
  if (/x = the calendar year/.test(q.prompt)) return idx(q, c => /^The model’s value extrapolated back to the year 0: it has no real meaning here/.test(c));
  return undefined;
};
S.recodePredict = q => {
  const s = norm(q.prompt), ab = expIn(s), base = Number(s.match(/years since (\d{4})/)[1]), yr = Number(s.match(/value for (\d{4})/)[1]);
  return round(ef(ab)(yr - base), places(q.prompt) ?? 1);
};

// interpret-parameters
S.interpB = q => {
  const b = num(norm(q.prompt).match(/b = ([\d.]*\d)/)[1]), pct = round(Math.abs(b - 1) * 100, 6), dir = b > 1 ? 'grows' : 'falls';
  return idx(q, c => new RegExp(`^The model predicts .* ${dir} by about ([\\d.]+)% per`).test(c) && near(Number(c.match(/about ([\d.]*\d)%/)[1]), pct, 1e-9));
};
S.interpVertex = q => { const [a, b] = quadCard(q); return round(-b / (2 * a), places(q.prompt) ?? 0); };
S.interpC = q => {
  const P = ptsOf(pic(q).g), lo = P[0].x, hi = P[P.length - 1].x, inside = lo <= 0 && 0 <= hi;
  return idx(q, c => (inside ? /^An estimate of .* at x = 0, which is inside the data range/ : /^Nothing reliable: x = 0 is outside the data range/).test(c));
};

// compare-own-fits
function ownFits(P) {
  const L = linFit(P), Q = quadReg(P), E = expReg(P);
  const res = f => P.map(p => ({ x: p.x, y: p.y - f(p.x) }));
  return { Linear: res(L.f), Quadratic: res(qf(Q)), Exponential: E ? res(ef(E)) : null };
}
S.compareFits = q => {
  const F = ownFits(ptsOf(pic(q).g));
  const k = Object.fromEntries(Object.entries(F).map(([n, R]) => [n, R ? pattern(R).best : 'pattern']));
  if (Object.values(k).includes('unclear')) return undefined;
  const ok = Object.keys(k).filter(n => k[n] === 'none');
  if (ok.length === 0) return idx(q, c => /^None of them/.test(c));
  if (ok.length === 1) return idx(q, c => c === `The ${ok[0].toLowerCase()} model`);
  // more than one form passes: the one with the weakest curve left (sane() reports the item)
  const sc = n => { const k = pattern(F[n]); return Math.max(k.p2, k.p3); };
  return idx(q, c => c === `The ${ok.sort((u, v) => sc(u) - sc(v))[0].toLowerCase()} model`);
};

// solve-for-input
function targetOf(q) { const m = norm(q.board ?? '').match(/=\s*(-?[\d.]*\d)\s*$/); return m ? Number(m[1]) : NaN; }
function rootsOf([a, b, c], T) {
  const C = c - T, D = b * b - 4 * a * C, sc = Math.max(b * b, Math.abs(4 * a * C), 1e-12);
  if (Math.abs(D) <= 1e-9 * sc) return [-b / (2 * a)];
  if (D < 0) return [];
  const r = Math.sqrt(D); return [(-b - r) / (2 * a), (-b + r) / (2 * a)].sort((u, v) => u - v);
}
S.solveCount = q => {
  const Qm = quadIn(norm(q.prompt).match(/ŷ = [^.]*?(?=\.\s|\. At)/)?.[0] ?? norm(q.prompt)), T = targetOf(q), r = rootsOf(Qm, T);
  return idx(q, c => (r.length === 2 ? /^Two inputs/ : r.length === 1 ? /^One input/ : /^No input: the model never reaches/).test(c));
};
S.solveExp = q => {
  const [a, b] = expIn(norm(q.prompt)), T = Number(norm(q.prompt).match(/the line y = (-?[\d.]*\d)/)[1]);
  return round(Math.log(T / a) / Math.log(b), places(q.prompt) ?? 1);
};

// report-in-context
function ballOf(q) {
  const s = norm(q.prompt), Qm = quadIn(s.match(/h = [^(]*/)[0], 't'), T = Number(s.match(/Solving h = (-?[\d.]*\d)/)[1]);
  return { Qm, T, r: rootsOf(Qm, T) };
}
S.reportBall = q => {
  const { r } = ballOf(q), ok = r.filter(t => t >= 0);
  const tx = c => nums(c);
  if (ok.length === 0) return idx(q, c => /^Never/.test(c));
  if (ok.length === 2) return idx(q, c => /and t ≈/.test(c) && tx(c).length === 2 && tx(c).every((v, i) => Math.abs(v - ok[i]) < 0.006));
  return idx(q, c => /^Only t ≈/.test(c) && Math.abs(tx(c)[0] - ok[0]) < 0.006);
};
S.reportNever = q => {
  const s = norm(q.prompt);
  if (/predict a value of 0/.test(s) && expIn(s)) return idx(q, c => /^Never: the model only gets closer and closer to 0/.test(c));
  const Qm = quadIn(s.match(/ŷ = (.*?)\. The question/)[0]), T = targetOf(q);
  if (rootsOf(Qm, T).length) return undefined;
  const top = Qm[2] - Qm[1] ** 2 / (4 * Qm[0]);
  return idx(q, c => /^The model never reaches .*: its (highest|lowest) value is about/.test(c) && Math.abs(nums(c).slice(-1)[0] - top) <= 0.5 + 1e-9);
};
const unitOf = name => (String(name ?? '').match(/\(([^)]*)\)/) ?? [])[1] ?? '';
S.reportWords = q => {
  const g = pic(q).g, xu = unitOf(g.x.name), s = norm(q.prompt), yh = Number(s.match(/ŷ ≈ (-?[\d.]*\d)/)[1]);
  return idx(q, c => {
    const m = norm(c).match(/^The model predicts about (\$?)(-?[\d.]*\d) ?(.*?) at /); if (!m) return false;
    const u = m[3].trim();
    if (u === xu || u === 'percent' || u === '°F' && /°F/.test(xu)) return false;
    if (!m[1] && !u) return false;
    return Math.abs(Number(m[2]) - yh) <= 0.05 + 1e-9 || (Math.abs(Number(m[2]) - yh) <= 0.5 + 1e-9 && Number.isInteger(Number(m[2])));
  });
};

// square-root-regression
S.sqrtFit = q => {
  const L = pic(q).card.lines.map(norm), s = norm(q.prompt);
  if (/PwrReg/.test(pic(q).card.title)) {
    const a = cardVal(L, 'a'), b = cardVal(L, 'b'), T = Number(s.match(/period of ([\d.]*\d) seconds/)[1]);
    return round((T / a) ** (1 / b), places(q.prompt) ?? 1);
  }
  const a = cardVal(L, 'a'), k = cardVal(L, 'k'), V = Number(s.match(/speed of ([\d.]*\d) mph/)[1]);
  return round(((V - k) / a) ** 2, places(q.prompt) ?? 0);
};
S.sqrtShape = q => {
  const s = norm(q.prompt);
  const h = s.match(/√\(x - ([\d.]*\d)\)/);
  if (h && /For which inputs is the model defined/.test(s)) return idx(q, c => c.replace(MINUS, '-') === `x ≥ ${h[1]}`);
  const m = s.match(/ŷ = ([\d.]*\d)√x/);
  if (m && /As the skid length grows/.test(s)) return Number(m[1]) > 0 ? idx(q, c => /^It keeps increasing, more and more slowly, with no ceiling/.test(c)) : undefined;
  const b = s.match(/gives b = (-?[\d.]*\d)/);
  if (b) { const v = Number(b[1].replace(/^(-?)\./, '$10.')); return Math.abs(v - 0.5) <= 0.05 ? idx(q, c => /^Close to 0.5: the data are consistent with a square-root model/.test(c)) : undefined; }
  return undefined;
};

// interp-vs-extrap
function rangeAndX(q) {
  const s = norm(q.prompt);
  const rec = s.match(/x = years since (\d{4})\. The data cover the years (\d{4}) to (\d{4})\. You predict the value for (\d{4})/);
  if (rec) { const b = Number(rec[1]); return { lo: rec[2] - b, hi: rec[3] - b, x: rec[4] - b }; }
  const P = ptsOf(pic(q).g), x = Number(s.match(/use it at \$?(-?[\d.]*\d)/)[1]);
  return { lo: P[0].x, hi: P[P.length - 1].x, x };
}
S.interpExtrap = q => {
  const { lo, hi, x } = rangeAndX(q), inside = lo <= x && x <= hi;
  return idx(q, c => (inside ? /^Interpolation: .* is within the observed inputs/ : /^Extrapolation: .* is outside the observed inputs/).test(c));
};

// context-domain
S.domainQuad = q => idx(q, c => /^About .* \(the data\), with caution just beyond/.test(c));
S.domainPop = q => idx(q, c => /^Not without more data: .* is inside the range, but this case comes from a different (population|condition)/.test(c));

// model-divergence
function twoModels(q) {
  const s = norm(q.prompt);
  const Qm = quadIn(s.match(/ŷ = -?[\d.]*x² [^a-z]*?x(?: [-+] [\d.]*\d)?/)[0]), E = expIn(s.match(/ŷ = [\d.]+\([\d.]+\)/)[0]);
  const x = Number(s.match(/at x = (\d+)/)[1]);
  return { Qm, E, x };
}
S.divergePair = q => { const { Qm, E, x } = twoModels(q); return [round(qf(Qm)(x), 0), round(ef(E)(x), 0)]; };
S.divergeClaim = q => {
  const { Qm, E, x } = twoModels(q), vq = qf(Qm)(x), ve = ef(E)(x);
  return idx(q, c => {
    const m = norm(c).match(/^No: at x = (\d+) the quadratic predicts about ([\d.]*\d) and the exponential about ([\d.]*\d)$/);
    return !!m && Number(m[1]) === x && Math.abs(Number(m[2]) - vq) <= 0.5 + 1e-9 && Math.abs(Number(m[3]) - ve) <= 0.5 + 1e-9;
  });
};

// log-linearization
S.linRecover = q => {
  const L = pic(q).card.lines, A = cardVal(L, 'a'), B = cardVal(L, 'b');
  const pa = /a to the nearest whole number/.test(q.prompt) ? 0 : Number((q.prompt.match(/a to (\d) decimal/) ?? [])[1] ?? 2);
  const pb = Number((q.prompt.match(/b to (\d) decimal/) ?? [])[1] ?? 3);
  return [round(Math.exp(A), pa), round(Math.exp(B), pb)];
};
S.linCurved = q => {
  const P = ptsOf(pic(q).g), L = linFit(P), R = P.map(p => ({ x: p.x, y: p.y - L.f(p.x) })), k = pattern(R).best;
  if (k === 'pattern') return idx(q, c => /^No: the \(x, ln y\) points still bend/.test(c));
  if (k === 'none') return idx(q, c => /^Yes: the \(x, ln y\) points follow a line with no pattern/.test(c));
  return undefined;
};

// model-choice-argument
function twoPlots(q) {
  const P = pic(q);
  return [P.g, P.g2].map(g => ({ name: String(g.title ?? '').toLowerCase(), R: residPlot(g), k: pattern(residPlot(g)).best, kind: pattern(residPlot(g)).kind }));
}
S.cerPick = q => {
  const T = twoPlots(q);
  let good = T.filter(t => t.k === 'none'), bad = T.filter(t => t.k === 'pattern');
  if (good.length !== 1) {
    // not one clean plot: the plot with the weaker curve is the better-founded choice; sane() reports the item
    const sc = t => { const k = pattern(t.R); return Math.max(k.p2, k.p3); };
    const [g0, b0] = [...T].sort((u, v) => sc(u) - sc(v)); good = [g0]; bad = [b0];
  }
  return idx(q, c => new RegExp(`^Choose the ${good[0].name}: no residual pattern \\(the ${bad[0].name}’s curve\\)`).test(c));
};
S.cerVerdict = q => {
  const T = twoPlots(q), n = T[0].R.length;
  if (n <= 4) return idx(q, c => /^Ask for more data first/.test(c));
  const good = T.filter(t => t.k === 'none'), bad = T.filter(t => t.k === 'pattern');
  if (good.length + bad.length !== 2) return undefined;
  if (good.length === 1) return idx(q, c => c === `Choose the ${good[0].name} model`);
  if (good.length === 0) return idx(q, c => /^Recommend neither: both residual plots show a pattern/.test(c));
  return idx(q, c => /^Ask for more data first/.test(c));
};

// no-guaranteed-bounds
S.boundsClaim = q => {
  const R = residPlot(pic(q).g), lo = R[0].x, hi = R[R.length - 1].x;
  const x = Number(norm(q.prompt).match(/next \w+, at \$?(-?[\d.]*\d)/)[1]), inside = lo <= x && x <= hi;
  const cand = (q.choices ?? []).map((c, i) => (/only describes the misses in these data; a new case can miss by more/.test(c) ? i : -1)).filter(i => i >= 0);
  if (cand.length === 1) return cand[0];
  return idx(q, c => /only describes the misses in these data/.test(c) && (inside ? !/far outside/.test(c) : /far outside/.test(c)));
};

// ---------------------------------------------------------------- export
function solve(q) {
  const f = S[q.family];
  if (!f) return undefined;
  const v = f(q);
  return q.input === 'choice' && v === -1 ? undefined : v;
}

// ---------------------------------------------------------------- sane: what a 14-18-year-old would find unfair
function sane(q) {
  const out = [], P = pic(q), fam = q.family;
  const say = m => out.push(m);
  // drawn points must sit on the drawn grid
  for (const k of ['g', 'g2']) {
    const g = P[k]; if (!g?.items) continue;
    for (const p of ptsOf(g)) if (p.x < g.x.min - 1e-9 || p.x > g.x.max + 1e-9 || p.y < g.y.min - 1e-9 || p.y > g.y.max + 1e-9) say(`point (${p.x}, ${p.y}) is off the drawn grid`);
  }
  const p = places(q.prompt);
  try {
    if (fam === 'shapeFamily') {
      const sh = shapeOf(ptsOf(P.g));
      if (!sh.turn && sh.gain >= 0.35 && sh.gain < 0.7) say(`shape between straight and bending (a parabola removes ${Math.round(100 * sh.gain)}% of the line's squared error)`);
    }
    if (fam === 'shapeTurn') {
      const sh = shapeOf(ptsOf(P.g));
      if (/Could a quadratic model follow/.test(q.prompt) && sh.turn) say('the data turn around, but the item treats them as one bending branch');
      if (/Can any exponential follow/.test(q.prompt) && !sh.turn) say('the item says the data turn (peak or bottom out), but the points barely come back from their extreme (an exponential that levels off could follow them)');
      const pk = norm(q.prompt).match(/(peaks|bottoms out) at about \$?([\d.]*\d) [^n]*near \$?([\d.]*\d)/);
      if (pk) { const Pt = ptsOf(P.g), ys = Pt.map(t => t.y), e = pk[1] === 'peaks' ? Math.max(...ys) : Math.min(...ys), xe = Pt[ys.indexOf(e)].x; if (Math.abs(e - Number(pk[2])) > 0.051 * Math.max(1, Math.abs(e)) || Math.abs(xe - Number(pk[3])) > 1e-9) say(`stated extreme ${pk[2]} near ${pk[3]}, the points give ${e} at ${xe}`); }
    }
    if (fam === 'diffTest') {
      const D = P.diff, s = norm(q.prompt); if (D.xs.map(num).join() !== (s.match(/x = ([-\d., ]+?) and/)?.[1] ?? '').split(', ').map(Number).join()) say('the stated x values differ from the table');
    }
    if (fam === 'diffSpacing') {
      const D = P.diff, Y = D.ys.map(num), d = norm(q.prompt).match(/finds the (1st differences|ratios) (.*?) and says/);
      if (d) { const said = d[2].split(', ').map(t => Number(t.replace(/^[×+]/, ''))); const real = d[1] === 'ratios' ? Y.slice(1).map((v, i) => v / Y[i]) : diffs(Y); if (said.length !== real.length || said.some((v, i) => Math.abs(v - real[i]) > 1e-6 * Math.max(1, Math.abs(real[i])))) say(`Lee's ${d[1]} ${d[2]} do not match the table (${real.map(v => +v.toFixed(4)).join(', ')})`); }
      const xb = norm(q.board ?? '').match(/x:\s*(.*)$/); if (xb && xb[1].replace(/\\\s*/g, '').split(',').map(t => Number(t.trim())).join() !== D.xs.map(num).join()) say('the board x values differ from the table');
    }
    if (fam === 'diffNoisy') {
      const v = noisyVerdict(q), shown = (P.diff.show?.d2 ?? []).map(num);
      if (!v.close && !v.far) say(`2nd differences ${v.d2.map(x => +x.toFixed(2)).join(', ')} are neither clearly near-constant nor clearly not`);
      if (v.far && !v.ratiosFar) say('the ratios are close to constant, so "neither the 2nd differences nor the ratios are close to constant" is doubtful');
      if (shown.some((s, i) => Math.abs(s - v.d2[i]) > 0.051)) say('the shown 2nd differences do not match the y values');
    }
    if (fam === 'residQuad' || fam === 'residExp') {
      const r = residAsked(q); if (p !== null && tie(r.e, p)) say(`residual ${r.e} is a rounding tie`);
      const hot = ptsOf(P.g).find(t => /^hot/.test(t.key)); if (hot && (hot.x !== r.x || hot.y !== r.y)) say(`highlighted point (${hot.x}, ${hot.y}) is not the asked case (${r.x}, ${r.y})`);
    }
    if (fam === 'residOne') {
      const R = residPlot(P.g), k = pattern(R), hot = ptsOf(P.g).find(t => /^rhot/.test(t.key));
      if (k.kind !== 'pattern') say(`the residual plot shows no clear pattern (runs ${k.runs}/${k.n}, curve share ${k.p2.toFixed(2)}/${k.p3.toFixed(2)}), but the right choice says it does`);
      const s = norm(q.prompt), L = s.match(/ŷ = (-?[\d.]*\d) ([-+]) ([\d.]*\d)x/), m = s.match(/At (-?[\d.]*\d) \w+ the observed value is \$?(-?[\d.]*\d)/);
      if (L && m) { const yh = Number(L[1]) + (L[2] === '-' ? -1 : 1) * Number(L[3]) * Number(m[1]); if (Math.abs(yh - Number(m[2])) > 0.01 * Math.max(1, Math.abs(yh))) say(`the line gives ŷ = ${yh.toFixed(3)} at x = ${m[1]}, not the observed ${m[2]} (residual not 0)`); }
      if (hot && Math.abs(hot.y) > 1e-9) say('the highlighted residual is not drawn at 0');
    }
    if (fam === 'patternPick') {
      for (const [nm, g] of [['A', P.g], ['B', P.g2]]) { const k = pattern(residPlot(g)); if (k.kind === 'unclear') say(`plot ${nm} has no clear reading (runs ${k.runs}/${k.n}, curve share ${k.p2.toFixed(2)}/${k.p3.toFixed(2)})`); }
    }
    if (fam === 'patternSumZero') {
      const R = residPlot(P.g), k = pattern(R), listed = nums(norm(q.prompt).split('are ')[1]?.split('. Sam')[0] ?? '');
      if (k.kind !== 'pattern') say(`the residuals show no clear pattern (runs ${k.runs}/${k.n}, curve share ${k.p2.toFixed(2)})`);
      const sum = listed.reduce((s, v) => s + v, 0); if (Math.abs(sum) > 0.05 * listed.length + 1e-9) say(`the listed residuals add to ${sum.toFixed(2)}, not about 0`);
    }
    if (fam === 'sizeUse') {
      const A = residPlot(P.g), B = residPlot(P.g2), ra = rms(A), rb = rms(B);
      if (Math.max(ra, rb) < 3 * Math.min(ra, rb)) say(`residual sizes too close to call "much smaller" (${ra.toFixed(3)} vs ${rb.toFixed(3)})`);
      for (const [nm, R] of [['A', A], ['B', B]]) { const k = pattern(R); if (k.kind === 'pattern') say(`plot ${nm} shows a pattern, but the item says neither does`); }
    }
    if (fam === 'sizeTol') {
      const R = residPlot(P.g), T = tolOf(q), M = maxAbs(R), k = pattern(R);
      if (M <= T && M > 0.85 * T) say(`largest residual ${M} is close to the tolerance ${T}: not "well within"`);
      if (M > T && M < 1.3 * T) say(`largest residual ${M} is close to the tolerance ${T}: not "much larger"`);
      if (k.kind === 'pattern') say('the residual plot shows a pattern, but the item says it has none');
    }
    if (fam === 'sseCompare') {
      const cols = P.card.cols, A = cols[1].cells.map(num), B = cols[2].cells.map(num), sa = A.reduce((s, e) => s + e * e, 0), sb = B.reduce((s, e) => s + e * e, 0);
      if (sa === sb) say('both curves have the same sum of squared residuals');
      if (A.reduce((s, v) => s + v, 0) !== 0 || B.reduce((s, v) => s + v, 0) !== 0) say('a residual list does not add to 0, but the prompt says both do');
    }
    if (fam === 'quadPredict' || fam === 'expPredict') {
      const f = fam === 'quadPredict' ? qf(quadCard(q)) : ef(expCard(q)), v = f(atX(q)); if (p !== null && tie(v, p)) say(`prediction ${v} is a rounding tie`);
      const Pt = ptsOf(P.g), fit = fam === 'quadPredict' ? quadReg(Pt) : expReg(Pt), shown = fam === 'quadPredict' ? quadCard(q) : expCard(q);
      if (fit) fit.forEach((v2, i) => { const d = (String(pic(q).card.lines.map(norm).find(l => l.startsWith('abc'[i] + '=')) ?? '').split('.')[1] ?? '').length; if (Math.abs(v2 - shown[i]) > 0.5 * 10 ** -d + 1e-9 + 1e-4 * Math.abs(v2)) say(`card ${'abc'[i]} = ${shown[i]} but the plotted points give ${v2.toPrecision(6)}`); });
      const Pr = ptsOf(P.g), x = atX(q); if (x < Pr[0].x || x > Pr[Pr.length - 1].x) say(`prediction at ${x} is outside the data (${Pr[0].x} to ${Pr[Pr.length - 1].x})`);
    }
    if (fam === 'quadPrecision') {
      const fit = quadReg(ptsOf(P.g)), shown = quadCard(q);
      fit.forEach((v, i) => { if (Math.abs(v - shown[i]) > 1e-3 * Math.abs(v) + 1e-4 && !(i === 2 && Math.abs(v - shown[i]) < 1e-3)) say(`card ${'abc'[i]} = ${shown[i]} but the points give ${v.toPrecision(5)}`); });
    }
    if (fam === 'quadLists') {
      const { L, yl, big } = listsOf(q); if (yl.length !== 1) say(`the largest value ${big} is the maximum of ${yl.length} lists`);
      const y = yl[0]?.v ?? [], x = L.find(l => l !== yl[0])?.v ?? []; if (new Set(x).size !== x.length) say('the input list repeats a value');
      void y;
    }
    if (fam === 'quad3pts') {
      const g = P.g, Pt = ptsOf(g), M = modelsOf(g), LS = quadReg(Pt), xs = nums(norm(q.prompt).split('points at ')[1]?.split(' and finds')[0] ?? '');
      const other = M.find(m => !m.p.every((v, i) => Math.abs(v - LS[i]) <= 1e-6 * Math.max(1, Math.abs(LS[i]))));
      if (other) for (const x of xs) { const pt = Pt.find(t => t.x === x); if (!pt || Math.abs(qf(other.p)(x) - pt.y) > 1e-6 * Math.max(1, Math.abs(pt.y))) say(`curve ${other.name} does not pass through the data point at ${x}`); }
    }
    if (fam === 'lnStep') {
      const Y = norm(q.board).replace(/\{,\}/g, '').replace(/^y:\s*/, '').split(',').map(t => Number(t.replace(/\\/g, '').trim())), f = Number(norm(q.prompt).match(/multiplies y by ([\d.]*\d)/)[1]);
      if (!allEq(Y.slice(1).map((v, i) => v / Y[i]), 1e-9) || !near(Y[1] / Y[0], f, 1e-9)) say('the y column does not multiply by the stated factor');
      if (tie(Math.log(f), 3)) say('ln of the factor is a rounding tie');
    }
    if (fam === 'lnNonpos') { const m = norm(q.prompt).match(/with y = (-?[\d.]*\d)/); if (m && Number(m[1]) > 0) say('the asked y is positive'); }
    if (fam === 'lnRelative') { const v = S.lnRelative(q); if (v === undefined) say('the asked day is not in the table'); }
    if (fam === 'expOut') {
      const fit = expReg(ptsOf(P.g)), [a, b] = expCard(q);
      const pa = /a to the nearest whole number/.test(q.prompt) ? 0 : Number((q.prompt.match(/a to (\d) decimal/) ?? [])[1] ?? 2);
      if (Math.abs(Math.abs(a) * 10 ** pa % 1 - 0.5) < 1e-7) say(`the card shows a = ${a}, an exact tie when rounded to ${pa} decimal places (the choices round it down)`);
      if (fit && (Math.abs(fit[0] - a) > 1e-4 * a + 1e-4 || Math.abs(fit[1] - b) > 6e-5)) say(`card a = ${a}, b = ${b} but ExpReg on the points gives ${fit[0].toFixed(4)}, ${fit[1].toFixed(4)}`);
    }
    if (fam === 'expPredict') {
      const fit = expReg(ptsOf(P.g)), [a, b] = expCard(q);
      if (fit && (Math.abs(fit[0] - a) > 1e-4 * a + 1e-4 || Math.abs(fit[1] - b) > 6e-5)) say(`card a = ${a}, b = ${b} but ExpReg on the points gives ${fit[0].toFixed(4)}, ${fit[1].toFixed(4)}`);
    }
    if (fam === 'expTools') {
      const Pt = ptsOf(P.g), { ti, de } = toolsCard(q), fit = expReg(Pt);
      if (fit && (Math.abs(fit[0] - ti[0]) > 1e-3 * ti[0] + 1e-3 || Math.abs(fit[1] - ti[1]) > 1e-4)) say(`TI ExpReg shown a = ${ti[0]}, b = ${ti[1]} but ln-scale least squares gives ${fit[0].toFixed(4)}, ${fit[1].toFixed(4)}`);
      const st = sse(Pt, ef(ti)), sd = sse(Pt, ef(de));
      if (sd > st) say(`the "Desmos" fit has a larger original-scale SSE (${sd.toFixed(4)}) than ExpReg (${st.toFixed(4)})`);
      if (/smaller sum/.test(q.prompt) && Math.abs(sd - st) < 0.01 * st) say(`the two SSEs differ by under 1% (${st.toFixed(4)} vs ${sd.toFixed(4)})`);
    }
    if (fam === 'recodeA') {
      const L = P.card2.lines.map(norm), a = cardVal(L, 'a'), b = cardVal(L, 'b'), cols = P.card?.cols;
      if (cols) {
        const yrs = cols[0].cells.map(num), ys = cols[1].cells.map(num), since = norm(q.prompt).match(/years since (\d{4})/);
        const fit = expReg(yrs.map((y, i) => ({ x: since ? y - Number(since[1]) : y, y: ys[i] })));
        if (fit && since && (Math.abs(fit[0] - a) > 1e-3 * a || Math.abs(fit[1] - b) > 1e-4)) say(`card a = ${a}, b = ${b} but ExpReg on the table gives ${fit[0].toFixed(4)}, ${fit[1].toFixed(5)}`);
      }
    }
    if (fam === 'recodePredict') {
      const s = norm(q.prompt), v = ef(expIn(s))(Number(s.match(/value for (\d{4})/)[1]) - Number(s.match(/years since (\d{4})/)[1]));
      if (p !== null && tie(v, p)) say(`prediction ${v} is a rounding tie`);
    }
    if (fam === 'interpVertex') {
      const [a, b] = quadCard(q), v = -b / (2 * a); if (p !== null && tie(v, p)) say(`vertex ${v} is a rounding tie`);
      const Pt = ptsOf(P.g); if (v < Pt[0].x || v > Pt[Pt.length - 1].x) say(`the vertex ${v.toFixed(2)} is outside the data`);
      const fit = quadReg(Pt); if (fit && Math.abs(-fit[1] / (2 * fit[0]) - v) > 0.5 * 10 ** -(p ?? 0)) say(`the shown coefficients give a vertex ${v.toFixed(3)}, the points' QuadReg ${(-fit[1] / (2 * fit[0])).toFixed(3)}`);
    }
    if (fam === 'interpC') {
      const Pt = ptsOf(P.g), M = modelsOf(P.g)[0], s = norm(q.prompt), m = s.match(/gives [ac] = (-?[\d.]*\d)/);
      if (M && m) { const v0 = M.fam === 'quad' ? M.p[2] : M.p[0]; if (Math.abs(v0 - Number(m[1])) > 0.051 * Math.max(1, Math.abs(v0)) + 0.051) say(`stated ${m[1]} but the drawn model has ${v0.toFixed(2)} at x = 0`); }
      const fit = M?.fam === 'quad' ? quadReg(Pt) : expReg(Pt); if (M && fit && fit.some((v, i) => Math.abs(v - M.p[i]) > 1e-6 * Math.max(1, Math.abs(v)))) say('the drawn model is not the least-squares fit of the points');
    }
    if (fam === 'compareFits') {
      const F = ownFits(ptsOf(P.g)), cols = P.card.cols;
      for (const [nm, R] of Object.entries(F)) {
        const col = cols.find(c => c.head === nm); if (!R || !col) continue;
        col.cells.forEach((cell, i) => { const v = num(cell), d = (String(cell).split('.')[1] ?? '').length; if (Math.abs(v - R[i].y) > 0.5 * 10 ** -d + 1e-6) say(`${nm} residual ${i + 1} shown ${v}, the fit gives ${R[i].y.toFixed(3)}`); });
        const k = pattern(R); if (k.kind === 'unclear') say(`${nm} residuals have no clear reading (runs ${k.runs}/${k.n}, curve share ${k.p2.toFixed(2)}/${k.p3.toFixed(2)})`);
      }
      const pass = Object.entries(F).filter(([, R]) => R && pattern(R).best === 'none').map(([nm]) => nm);
      if (pass.length > 1) say(`more than one model leaves no pattern (${pass.join(', ')})`);
    }
    if (fam === 'solveCount') {
      const Qm = quadIn(norm(q.prompt).match(/ŷ = [^.]*?(?=\.\s|\. At)/)?.[0] ?? norm(q.prompt)), r = rootsOf(Qm, targetOf(q));
      if (r.some(x => x < 0)) say(`a solution x = ${r.find(x => x < 0).toFixed(2)} is negative: not an input in this context`);
      const g = P.g;
      if (r.length === 2 && Math.abs(r[1] - r[0]) < 0.02 * (g.x.max - g.x.min)) say('the two solutions are too close to tell apart from one on the graph');
    }
    if (fam === 'solveExp') {
      const s = norm(q.prompt), [a, b] = expIn(s), T = Number(s.match(/the line y = (-?[\d.]*\d)/)[1]), x = Math.log(T / a) / Math.log(b);
      if (tie(x, p ?? 1)) say(`solution ${x} is a rounding tie`); if (x < 0) say('the solution is negative');
    }
    if (fam === 'reportBall') {
      const { r } = ballOf(q), said = nums(norm(q.prompt).split(/gives t ≈/)[1] ?? '');
      if (r.length !== said.length || r.some((t, i) => Math.abs(round(t, 2) - said[i]) > 0.011)) say(`stated roots ${said.join(', ')} but the equation gives ${r.map(t => t.toFixed(3)).join(', ')}`);
    }
    if (fam === 'reportWords') {
      const M = modelsOf(P.g)[0], s = norm(q.prompt), yh = Number(s.match(/ŷ ≈ (-?[\d.]*\d)/)[1]), bx = norm(q.board ?? '').match(/hat\{y\}\((-?[\d.]*\d)\)/), x = Number(bx ? bx[1] : s.match(/ at \$?(-?[\d.]*\d)/)[1]);
      if (M) { const v = (M.fam === 'quad' ? qf(M.p) : ef(M.p))(x); if (Math.abs(v - yh) > 0.0006 * Math.max(1, Math.abs(v))) say(`stated ŷ ≈ ${yh} but the drawn model gives ${v.toFixed(3)}`); }
    }
    if (fam === 'sqrtFit') {
      const v = S.sqrtFit(q), L = P.card.lines.map(norm), s = norm(q.prompt);
      const raw = /PwrReg/.test(P.card.title) ? (Number(s.match(/period of ([\d.]*\d)/)[1]) / cardVal(L, 'a')) ** (1 / cardVal(L, 'b')) : ((Number(s.match(/speed of ([\d.]*\d)/)[1]) - cardVal(L, 'k')) / cardVal(L, 'a')) ** 2;
      if (tie(raw, p ?? 0)) say(`answer ${raw} is a rounding tie`); void v;
    }
    if (fam === 'interpExtrap') {
      const { lo, hi } = rangeAndX(q);
      for (const c of q.choices ?? []) { const m = norm(c).match(/observed inputs, \$?(-?[\d.]*\d)[^\d$-]*?(?:to) \$?(-?[\d.]*\d)/); if (m && (Number(m[1]) !== lo || Number(m[2]) !== hi)) say(`choice states inputs ${m[1]} to ${m[2]}, the data run ${lo} to ${hi}`); }
    }
    if (fam === 'domainQuad' || fam === 'domainPop') {
      const Pt = ptsOf(P.g), m = norm(q.prompt).match(/from \$?(-?[\d.]*\d)[^\d$-]*? to \$?(-?[\d.]*\d)/);
      if (m && Pt.length && (Number(m[1]) !== Pt[0].x || Number(m[2]) !== Pt[Pt.length - 1].x)) say(`stated range ${m[1]} to ${m[2]}, the points run ${Pt[0].x} to ${Pt[Pt.length - 1].x}`);
      if (fam === 'domainPop' && m) { const x = Number(norm(q.prompt).match(/ at \$?(-?[\d.]*\d)\s*[^\d]*\?$/)?.[1]); if (Number.isFinite(x) && (x < Number(m[1]) || x > Number(m[2]))) say(`the case at ${x} is outside the stated range, but the right choice calls it inside`); }
      if (fam === 'domainQuad') { const n = Number(q.prompt.match(/fitted to (\d+) measurements/)?.[1]); if (n && Pt.length && n !== Pt.length) say(`prompt says ${n} measurements, ${Pt.length} are plotted`); }
    }
    if (fam === 'divergePair' || fam === 'divergeClaim') {
      const { Qm, E } = twoModels(q), Pt = ptsOf(P.g), w = Number(norm(q.prompt).match(/within ±([\d.]*\d)/)[1]);
      const mq = Math.max(...Pt.map(t => Math.abs(t.y - qf(Qm)(t.x)))), me = Math.max(...Pt.map(t => Math.abs(t.y - ef(E)(t.x))));
      if (Math.max(mq, me) > w + 0.051) say(`stated every residual within ±${w}, but the models miss by up to ${mq.toFixed(2)} / ${me.toFixed(2)}`);
      if (fam === 'divergePair') { const { x } = twoModels(q); if (tie(qf(Qm)(x), 0) || tie(ef(E)(x), 0)) say('a prediction is a rounding tie'); }
      if (fam === 'divergeClaim') { const { x } = twoModels(q); if (qf(Qm)(x) > ef(E)(x)) say('the quadratic predicts more, so "the quadratic predicts more" is also true'); }
    }
    if (fam === 'linRecover') {
      const L = P.card.lines, A = cardVal(L, 'a'), B = cardVal(L, 'b'), Pt = ptsOf(P.g), fit = linFit(Pt);
      if (Math.abs(fit.a - A) > 1.5e-4 || Math.abs(fit.b - B) > 1.5e-4) say(`card A = ${A}, B = ${B} but the (x, ln y) points give ${fit.a.toFixed(4)}, ${fit.b.toFixed(4)}`);
      const pa = /a to the nearest whole number/.test(q.prompt) ? 0 : 2; if (tie(Math.exp(A), pa) || tie(Math.exp(B), 3)) say('a recovered value is a rounding tie');
    }
    if (fam === 'linCurved') {
      const Pt = ptsOf(P.g), L = linFit(Pt), R = Pt.map(t => ({ x: t.x, y: t.y - L.f(t.x) })), k = pattern(R);
      if (k.kind === 'unclear') say(`the (x, ln y) residuals have no clear reading (runs ${k.runs}/${k.n}, curve share ${k.p2.toFixed(2)}/${k.p3.toFixed(2)})`);
      const rp = residPlot(P.g2); if (rp.length === R.length && rp.some((r, i) => Math.abs(r.y - R[i].y) > 0.002)) say('the residual plot does not match the line drawn');
    }
    if (fam === 'cerPick' || fam === 'cerVerdict') {
      for (const t of twoPlots(q)) if (t.kind === 'unclear' && t.R.length > 4) { const k = pattern(t.R); say(`the ${t.name} plot has no clear reading (runs ${k.runs}/${k.n}, curve share ${k.p2.toFixed(2)}/${k.p3.toFixed(2)})`); }
    }
    if (fam === 'boundsClaim') {
      const R = residPlot(P.g), w = Number(norm(q.prompt).match(/within ±\$?([\d.]*\d)/)[1]), M = maxAbs(R), k = pattern(R);
      if (M > w + 1e-9) say(`a residual ${M} exceeds the stated ±${w}`);
      if (k.kind === 'pattern') say('the residual plot shows a pattern, but the item says it has none');
    }
  } catch (e) { say(`sane check failed: ${e.message}`); }
  return [...new Set(out)].join('; ');
}

export default { solve, sane };
