// coordinate-transformations oracle (role O, docs/lessons/QUALITY_LAYER.md). Works every practice item out from what
// the student sees: the coordinates in the prompt and on the board, the move the prompt states (a slide "3 left and
// 2 up", a reflection across an axis or a line x = k / y = k, an arrow rule (x, y) → (…, …)), the choices, and the
// drawn figures (the preimage and, where the item draws one, the image). Every move is turned into an affine map
// p ↦ A·p + b and applied here; every choice is judged by testing its claim on those numbers.
import { texPlain } from '../../tools/quality/oracle-kit.mjs';

// ---------------------------------------------------------------- reading
const norm = s => String(s ?? '').replace(/[−–]/g, '-').replace(/’/g, "'").replace(/′/g, "'");
const NUM = '(-?\\d+(?:\\.\\d+)?)';
const eqv = (a, b) => Math.abs(a - b) < 1e-9;
const same = (p, q) => !!p && !!q && eqv(p[0], q[0]) && eqv(p[1], q[1]);

/** every named point "P(−3, 4)" / "P'(2, 1)" in a text → { P: [-3,4], "P'": [2,1] } (later wins) */
function points(text) {
  const out = {};
  for (const m of norm(text).matchAll(new RegExp(`\\b([A-Z])('?)\\s*(?:=\\s*)?\\(\\s*${NUM}\\s*,\\s*${NUM}\\s*\\)`, 'g'))) out[m[1] + m[2]] = [Number(m[3]), Number(m[4])];
  return out;
}
const boardText = q => texPlain(q.board).replace(/\|/g, ' | ');
const allPoints = q => ({ ...points(boardText(q)), ...points(q.prompt) });

// ---- maps: { a: [[a11,a12],[a21,a22]], b: [b1,b2] } ----
const map = (a11, a12, a21, a22, b1, b2) => ({ a: [[a11, a12], [a21, a22]], b: [b1, b2] });
const apply = (M, p) => [M.a[0][0] * p[0] + M.a[0][1] * p[1] + M.b[0], M.a[1][0] * p[0] + M.a[1][1] * p[1] + M.b[1]];
const sameMap = (M, N) => [0, 1].every(i => eqv(M.b[i], N.b[i]) && [0, 1].every(j => eqv(M.a[i][j], N.a[i][j])));
const slide = (dx, dy) => map(1, 0, 0, 1, dx, dy);
const reflAxis = ax => (ax === 'x' ? map(1, 0, 0, -1, 0, 0) : map(-1, 0, 0, 1, 0, 0));
const mirrorLine = (line, k) => (line === 'x' ? map(-1, 0, 0, 1, 2 * k, 0) : map(1, 0, 0, -1, 0, 2 * k));
const det = M => M.a[0][0] * M.a[1][1] - M.a[0][1] * M.a[1][0];

/** "3 right and 2 up", "4 left", "1.5 down" → [dx, dy]; null when no direction words */
function slidePhrase(text) {
  const t = norm(text);
  const ms = [...t.matchAll(new RegExp(`${NUM} (left|right|up|down)\\b`, 'g'))];
  if (!ms.length) return null;
  let dx = 0, dy = 0;
  for (const m of ms) {
    const v = Number(m[1]);
    if (m[2] === 'right') dx += v; else if (m[2] === 'left') dx -= v; else if (m[2] === 'up') dy += v; else dy -= v;
  }
  return [dx, dy];
}
/** an affine expression in x and y ("x + 5", "-y", "2x", "y + x") → [cx, cy, c] */
function affine(expr) {
  const s = norm(expr).replace(/\s+/g, '');
  let cx = 0, cy = 0, c = 0;
  for (const m of s.matchAll(/([+-]?)(\d+(?:\.\d+)?)?([xy]?)/g)) {
    if (!m[0]) continue;
    const sg = m[1] === '-' ? -1 : 1;
    const k = m[2] !== undefined ? Number(m[2]) : 1;
    if (m[3] === 'x') cx += sg * k; else if (m[3] === 'y') cy += sg * k; else if (m[2] !== undefined) c += sg * k;
  }
  return [cx, cy, c];
}
/** "(x, y) → (x + 5, y − 4)" anywhere in a text → map */
function ruleIn(text) {
  const m = norm(text).match(/\(x,\s*y\)\s*(?:→|->)\s*\(([^,()]+),\s*([^()]+?)\)/);
  if (!m) return null;
  const [ax, bx, cx] = affine(m[1]), [ay, by, cy] = affine(m[2]);
  return map(ax, bx, ay, by, cx, cy);
}
/** the move a sentence states (reflection, mirror line, arrow rule, slide words) */
function moveIn(text) {
  const t = norm(text);
  let m;
  if ((m = t.match(new RegExp(`across the line ([xy]) = ${NUM}`)))) return mirrorLine(m[1], Number(m[2]));
  if ((m = t.match(/across the ([xy])-axis/))) return reflAxis(m[1]);
  const r = ruleIn(t);
  if (r) return r;
  const s = slidePhrase(t);
  return s ? slide(s[0], s[1]) : null;
}
/** the letter asked about: "Where is B′?", "Write K′", "Calculate N′", "corner R′", "point is S′", "What is N′?" */
function asked(q) {
  const t = norm(q.prompt);
  const m = t.match(/(?:Where is|Write|Calculate|corner|point is|What is) ([A-Z])'/) ?? t.match(/Where does ([A-Z])\(/);
  return m ? m[1] : null;
}
/** a pair "(a, b)" inside a text */
const pairIn = t => { const m = norm(t).match(new RegExp(`\\(\\s*${NUM}\\s*,\\s*${NUM}\\s*\\)`)); return m ? [Number(m[1]), Number(m[2])] : null; };
const dirWords = (dx, dy) => [dx > 0 ? `${dx} right` : dx < 0 ? `${-dx} left` : '', dy > 0 ? `${dy} up` : dy < 0 ? `${-dy} down` : ''];
/** a choice's slide words mean exactly (dx, dy) */
const slideIs = (text, dx, dy) => { const s = slidePhrase(text); return !!s && eqv(s[0], dx) && eqv(s[1], dy); };

// ---- geometry ----
const sub = (p, q) => [p[0] - q[0], p[1] - q[1]];
const cross = (u, v) => u[0] * v[1] - u[1] * v[0];
const dist = (p, q) => Math.hypot(p[0] - q[0], p[1] - q[1]);
const angleAt = (a, v, b) => { const u = sub(a, v), w = sub(b, v); return Math.acos(Math.max(-1, Math.min(1, (u[0] * w[0] + u[1] * w[1]) / (Math.hypot(...u) * Math.hypot(...w))))) * 180 / Math.PI; };
const turn = pts => { let s = 0; for (let i = 0; i < pts.length; i++) { const p = pts[i], r = pts[(i + 1) % pts.length]; s += p[0] * r[1] - r[0] * p[1]; } return Math.sign(s); }; // +1 counterclockwise
const pre = q => q.data?.pic?.p?.pre;
const preMap = q => { const P = pre(q); const o = {}; P?.names?.forEach((n, i) => { o[n] = P.pts[i]; }); return o; };

/** the point the item asks to move, and the move: from the prompt (and board) */
function pointAndMove(q) {
  const L = asked(q);
  const pts = allPoints(q);
  const M = moveIn(q.prompt) ?? moveIn(boardText(q));
  if (!L || !pts[L] || !M) throw new Error('cannot read point/move');
  return { L, p: pts[L], M };
}

// ---------------------------------------------------------------- per family: num / pair → value; choice → [bool]
const F = {
  isSlide(q) {
    const P = q.data.pic.p.pre.pts, I = q.data.pic.p.img.pts;
    const d = P.map((p, i) => sub(I[i], p));
    const uniform = d.every(v => same(v, d[0]));
    const congruent = P.every((p, i) => eqv(dist(p, P[(i + 1) % P.length]), dist(I[i], I[(i + 1) % I.length])));
    // "one vertex moves a different amount": all but one vertex share a move
    const oneOff = !uniform && d.some((v, i) => d.filter((w, j) => j !== i).every(w => same(w, d.find((_, k) => k !== i)))
      && !same(v, d.find((_, k) => k !== i)));
    return q.choices.map(c => {
      if (/^Yes/.test(c)) return uniform && slideIs(c, d[0][0], d[0][1]);
      if (/one vertex moves a different amount/.test(c)) return oneOff;
      if (/turned around/.test(c)) return !uniform && congruent;
      return false;
    });
  },
  slideVector(q) {
    // the image is drawn from the slide; the student reads the move off the two drawn figures
    const mv = q.data.pic.p.move;
    return q.choices.map(c => !/slant/.test(c) && slideIs(c, mv.dx, mv.dy));
  },
  moveOne(q) { const { p, M } = pointAndMove(q); return apply(M, p); },
  whichChanges(q) {
    const pts = points(q.prompt), L = Object.keys(pts)[0], p = pts[L];
    const s = slidePhrase(q.prompt.replace(/^.*?\)/, '')); const n = [p[0] + s[0], p[1] + s[1]];
    return q.choices.map(c => {
      const t = norm(c);
      const part = (ax, i) => {
        const m = t.match(new RegExp(`${ax} (stays|becomes) ${NUM}`));
        if (!m) return false;
        const v = Number(m[2]);
        return m[1] === 'stays' ? eqv(n[i], p[i]) && eqv(v, p[i]) : !eqv(n[i], p[i]) && eqv(v, n[i]);
      };
      return part('x', 0) && part('y', 1);
    });
  },
  reflectPlot(q) { const { p, M } = pointAndMove(q); return apply(M, p); },
  reflectCalc(q) { const { p, M } = pointAndMove(q); return apply(M, p); },
  fixedPoint(q) {
    const M = moveIn(q.prompt);
    const fixed = q.choices.map(c => { const p = pairIn(c); return !!p && same(apply(M, p), p); });
    const none = !fixed.some(Boolean);
    return q.choices.map((c, i) => (/^None/.test(c) ? none : fixed[i]));
  },
  axisRule(q) {
    const { L, p, M } = pointAndMove({ ...q, prompt: q.prompt.replace(/^([A-Z])\(/, 'Where is $1\' $1(') });
    const img = apply(M, p);
    return q.choices.map(c => {
      const R = ruleIn(c); const got = pairIn(c.split('so')[1] ?? '');
      if (!R || !got || !sameMap(R, M) || !same(got, img)) return false;
      if (/still negative/.test(c)) return img[0] < 0 && img[1] < 0 && p[0] < 0 && p[1] < 0;
      return true;
    });
  },
  matchPrime(q) {
    const { p, M } = pointAndMove(q);
    const img = apply(M, p);
    return q.choices.map(c => same(pairIn(c), img));
  },
  primeMeaning(q) {
    const { L, p, M } = pointAndMove(q);
    const img = apply(M, p);
    return q.choices.map(c => {
      if (/where \w lands after the move/.test(c)) return same(pairIn(c), img);
      return false; // "X with a new name" / "a new point: it can be anywhere" misread what X′ means
    });
  },
  writeRule(q) {
    const s = slidePhrase(q.prompt); const M = slide(s[0], s[1]);
    return q.choices.map(c => { const R = ruleIn(c); return !!R && sameMap(R, M); });
  },
  ruleMeaning(q) {
    const M = ruleIn(q.prompt) ?? ruleIn(boardText(q));
    const ident = sameMap(M, slide(0, 0));
    return q.choices.map(c => {
      if (/stays put/.test(c)) return ident;
      const N = moveIn(c);
      return !!N && sameMap(N, M);
    });
  },
  readRule(q) { const { p, M } = pointAndMove(q); return apply(M, p); },
  translateCalc(q) { const { p, M } = pointAndMove(q); return apply(M, p); },
  signedStep(q) {
    const t = norm(q.prompt);
    const m = t.match(new RegExp(`has ([xy])-coordinate ${NUM}\\. It moves ${NUM} (left|right|up|down)`));
    const v = Number(m[2]), k = Number(m[3]);
    const d = { right: [k, 0], left: [-k, 0], up: [0, k], down: [0, -k] }[m[4]];
    return v + (m[1] === 'x' ? d[0] : d[1]);
  },
  mixedPoint(q) { const { p, M } = pointAndMove(q); return apply(M, p); },
  polygonVertex(q) {
    const pts = points(boardText(q)), M = moveIn(q.prompt);
    const L = asked(q);
    return apply(M, pts[L]);
  },
  polygonCheck(q) {
    const pts = points(boardText(q)), M = moveIn(q.prompt);
    const names = Object.keys(pts).filter(k => !k.endsWith("'"));
    return q.choices.map(c => {
      const got = points(c);
      return names.every(n => same(got[n + "'"], apply(M, pts[n]))) && Object.keys(got).length === names.length;
    });
  },
  nameMove(q) {
    const pts = points(boardText(q));
    const names = Object.keys(pts).filter(k => !k.endsWith("'"));
    const fits = M => names.every(n => same(apply(M, pts[n]), pts[n + "'"]));
    const v = q.choices.map(c => { if (/^None/.test(c)) return null; const M = moveIn(c); return !!M && fits(M); });
    const none = !v.some(x => x === true);
    return v.map(x => (x === null ? none : x));
  },
  straightImage(q) {
    if (/proves every line/.test(q.prompt)) return q.choices.map(c => /^No: a few checks are evidence; a proof needs a reason/.test(c));
    const { L, p, M } = pointAndMove(q);
    const img = apply(M, p);
    // the image of a point on the segment lies on the image segment (a slide / reflection keeps lines straight)
    const others = Object.entries(points(boardText(q))).filter(([k]) => k !== L).map(([, v]) => apply(M, v));
    const onSeg = others.length === 2 && eqv(cross(sub(others[1], others[0]), sub(img, others[0])), 0);
    return q.choices.map(c => {
      if (/on segment/.test(c)) return same(pairIn(c), img) && onSeg;
      return false; // "just off the segment: an image can bend" / "skip it"
    });
  },
  sideLength(q) {
    const t = norm(q.prompt);
    const m = t.match(/How long is ([A-Z])'([A-Z])'\?/);
    const pts = points(t), M = moveIn(t.replace(/[A-Z]\([^)]*\)/g, ''));
    return dist(apply(M, pts[m[1]]), apply(M, pts[m[2]]));
  },
  lengthKept(q) {
    const t = norm(q.prompt);
    const isRefl = /reflected/.test(t);
    const P = preMap(q), M = moveIn(t);
    if (/Is one side enough\?/.test(t)) return q.choices.map(c => /^No: one side is not enough/.test(c));
    const m = t.match(/side ([A-Z])'([A-Z])' as long as ([A-Z])([A-Z])\?/);
    const kept = eqv(dist(apply(M, P[m[1]]), apply(M, P[m[2]])), dist(P[m[3]], P[m[4]]));
    return q.choices.map(c => {
      if (/^Yes: a (reflection|slide) keeps every length/.test(c)) return kept && (/reflection/.test(c) === isRefl);
      return false;
    });
  },
  angleImage(q) {
    const m = norm(q.prompt).match(/∠[A-Z]{3} = (\d+(?:\.\d+)?)°/);
    return Number(m[1]); // slides and reflections keep every angle
  },
  angleKept(q) {
    const a = Number(norm(q.prompt).match(/∠[A-Z]{3} = (\d+(?:\.\d+)?)°/)[1]);
    return q.choices.map(c => { const m = norm(c).match(/^No: the opening is the same, so ∠[A-Z]'[A-Z]'[A-Z]' = (\d+(?:\.\d+)?)°/); return !!m && eqv(Number(m[1]), a); });
  },
  parallelKept(q) {
    const t = norm(q.prompt), P = preMap(q), M = moveIn(t);
    const m = t.match(/Is ([A-Z])'([A-Z])' parallel to ([A-Z])'([A-Z])'\?/);
    const u = sub(apply(M, P[m[2]]), apply(M, P[m[1]])), v = sub(apply(M, P[m[4]]), apply(M, P[m[3]]));
    const par = eqv(cross(u, v), 0);
    return q.choices.map(c => {
      const cc = norm(c);
      const mm = cc.match(/^Yes: ([A-Z])'([A-Z])' is parallel to ([A-Z])'([A-Z])'/);
      if (mm) return par && [mm[1], mm[2], mm[3], mm[4]].join('') === [m[1], m[2], m[3], m[4]].join('');
      if (/^No/.test(cc)) return !par;
      return false; // "same length" is no reason for parallel
    });
  },
  orientation(q) {
    const t = norm(q.prompt), P = q.data.pic.p.pre.pts, M = moveIn(t.replace(/^[^.]*\./, ''));
    const img = P.map(p => apply(M, p));
    const ccw = turn(img) > 0;
    return q.choices.map(c => {
      if (/^Counterclockwise/.test(c)) return ccw && (!/the same way as/.test(c) || turn(P) > 0);
      if (/^Clockwise/.test(c)) return !ccw && !/angles changed/.test(c);
      return false;
    });
  },
  checkImage(q) {
    const b = boardText(q);
    const [preT, kimT] = b.split(/Kim:/);
    const P = points(preT), K = points(kimT), M = moveIn(q.prompt);
    const names = Object.keys(P);
    const right = names.every(n => same(K[n + "'"], apply(M, P[n])));
    return q.choices.map(c => {
      const cc = norm(c);
      if (/^Yes: every vertex follows the rule/.test(cc)) return right;
      const m = cc.match(/^No: ([A-Z])' should be/);
      if (m) return !right && !same(K[m[1] + "'"], apply(M, P[m[1]])) && same(pairIn(cc), apply(M, P[m[1]]));
      return false; // "must not face another way" (a reflection does) / "same lengths" (not enough)
    });
  },
  contextMove(q) { const { p, M } = pointAndMove(q); return apply(M, p); },
  contextCheck(q) {
    const s = slidePhrase(norm(q.prompt).match(/has to move ([^.]*)\./)[1]);
    return q.choices.map(c => { if (!/^No: every corner must move exactly/.test(c)) return false; return slideIs(c.replace(/^.*exactly/, ''), s[0], s[1]); });
  },
  rationalPoint(q) { const { p, M } = pointAndMove({ ...q, prompt: q.prompt.replace(/\(Decimals.*$/, '') }); return apply(M, p); },
  rationalChoice(q) {
    const pts = points(q.prompt), L = Object.keys(pts)[0], M = moveIn(q.prompt);
    const img = apply(M, pts[L]);
    return q.choices.map(c => (/^Yes/.test(c) ? same(pairIn(c), img) : false)); // any point can be reflected
  },
  reflectLine(q) { const { p, M } = pointAndMove(q); return apply(M, p); },
  rigidOrNot(q) {
    const M = ruleIn(q.prompt) ?? ruleIn(boardText(q));
    if (/Does the rule move ([A-Z])\?/.test(q.prompt)) {
      // a rule is a rule for every point of the plane, on the figure or not
      const L = q.prompt.match(/Does the rule move ([A-Z])\?/)[1], p = points(q.prompt)[L], img = apply(M, p);
      return q.choices.map(c => /^Yes/.test(c) && same(pairIn(c), img) && (!/moves/.test(c) || /every point of the plane/.test(c)));
    }
    const A = M.a;
    const isId = eqv(A[0][0], 1) && eqv(A[1][1], 1) && eqv(A[0][1], 0) && eqv(A[1][0], 0);
    const isAxis = eqv(A[0][1], 0) && eqv(A[1][0], 0) && eqv(Math.abs(A[0][0]), 1) && eqv(Math.abs(A[1][1]), 1) && eqv(det(M), -1) && eqv(M.b[0], 0) && eqv(M.b[1], 0);
    const orth = eqv(A[0][0] ** 2 + A[1][0] ** 2, 1) && eqv(A[0][1] ** 2 + A[1][1] ** 2, 1) && eqv(A[0][0] * A[0][1] + A[1][0] * A[1][1], 0);
    return q.choices.map(c => {
      if (/^A translation/.test(c)) return isId;
      if (/^A reflection across an axis/.test(c)) return isAxis;
      if (/^Neither/.test(c)) return !orth;
      return false;
    });
  },
};

// ---------------------------------------------------------------- contract
const pick = arr => {
  if (!Array.isArray(arr)) return undefined;
  const hits = arr.map((ok, i) => (ok ? i : -1)).filter(i => i >= 0);
  return hits.length ? hits[0] : -1; // -1: no choice is right (the sweep shows the item)
};
const clean = v => Number(Number(v).toFixed(9));

export default {
  solve(q) {
    const f = F[q.family];
    if (!f) return undefined;
    let r;
    try { r = f(q); } catch { return undefined; }
    if (q.input === 'choice') return pick(r);
    if (q.input === 'pair') return Array.isArray(r) ? r.map(clean) : undefined;
    return r == null ? undefined : clean(r);
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
    if (q.input === 'num' && typeof r === 'number' && Math.abs(r * 100 - Math.round(r * 100)) > 1e-6) probs.push(`the length ${r} has no exact decimal to type`);
    // a figure's letters: one point per letter
    const P = pre(q);
    if (P?.names && new Set(P.names).size !== P.names.length) probs.push('two vertices share a letter');
    // the drawn figure agrees with the coordinates the board / prompt state
    if (P?.names && !P.loose) {
      const stated = allPoints(q);
      for (const [i, n] of P.names.entries()) if (stated[n] && !same(stated[n], P.pts[i]) && !['checkImage'].includes(q.family)) probs.push(`${n} is drawn at (${P.pts[i]}) but stated as (${stated[n]})`);
    }
    // the stated angle is the drawn angle
    if (q.family === 'angleImage' || q.family === 'angleKept') {
      const m = norm(q.prompt).match(/∠([A-Z])([A-Z])([A-Z]) = (\d+(?:\.\d+)?)°/);
      const pm = preMap(q);
      if (m && pm[m[1]] && pm[m[2]] && pm[m[3]]) {
        const a = angleAt(pm[m[1]], pm[m[2]], pm[m[3]]);
        if (Math.abs(a - Number(m[4])) > 0.5) probs.push(`∠${m[1]}${m[2]}${m[3]} is drawn as ${a.toFixed(1)}° but stated as ${m[4]}°`);
      }
    }
    // the stated sides are parallel in the drawing
    if (q.family === 'parallelKept') {
      const m = norm(q.prompt).match(/side ([A-Z])([A-Z]) is parallel to ([A-Z])([A-Z])/), pm = preMap(q);
      if (m && !eqv(cross(sub(pm[m[2]], pm[m[1]]), sub(pm[m[4]], pm[m[3]])), 0)) probs.push(`${m[1]}${m[2]} is not parallel to ${m[3]}${m[4]} in the drawing`);
    }
    // the stated turning direction is the drawn one
    if (q.family === 'orientation') {
      const m = norm(q.prompt).match(/turns (counterclockwise|clockwise)/);
      const tp = turn(P.pts);
      if (m && (m[1] === 'counterclockwise') !== (tp > 0)) probs.push(`the preimage is drawn ${tp > 0 ? 'counterclockwise' : 'clockwise'} but stated ${m[1]}`);
    }
    // the slanted side asked about really is slanted
    if (q.family === 'lengthKept') {
      const m = norm(q.prompt).match(/as long as ([A-Z])([A-Z])\?/), pm = preMap(q);
      if (m && pm[m[1]] && pm[m[2]] && (eqv(pm[m[1]][0], pm[m[2]][0]) || eqv(pm[m[1]][1], pm[m[2]][1]))) probs.push(`side ${m[1]}${m[2]} is called slanted but is horizontal or vertical`);
    }
    // Dev's drawn proposal: two corners moved right, one by one square more (contextCheck)
    if (q.family === 'contextCheck') {
      const W = q.data?.pic?.p?.wrong?.pts, s = slidePhrase(norm(q.prompt).match(/has to move ([^.]*)\./)[1]);
      const m = norm(q.prompt).match(new RegExp(`moves ([A-Z]) and ([A-Z]) ${NUM} \\w+, but corner ([A-Z]) ${NUM} (\\w+)`));
      if (W && m) {
        const d = P.pts.map((p, i) => sub(W[i], p)), ix = n => P.names.indexOf(n);
        const exp = [ix(m[1]), ix(m[2])].every(i => same(d[i], s));
        if (!exp) probs.push('the drawn proposal does not move the two corners as stated');
      }
    }
    // a point letter in the asked image is also the letter of a fixed object: nothing here
    return probs.join('; ');
  },
};
