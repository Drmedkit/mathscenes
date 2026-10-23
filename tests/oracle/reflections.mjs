// Oracle for the lesson "reflections" (reflect 2-D shapes in a line, 8.G.A.1), role O (docs/lessons/QUALITY_LAYER.md).
// Worked out from what the student sees: the prompt, the board and the drawn sheet (line m, the figure, its labels,
// candidate spots and lines, segments with their tick marks, right-angle marks, measured notes). Every image is
// computed here: P′ lies on the line through P at a right angle to m, as far beyond m as P is in front of it.
// The drawn line m (y up, grid units): 'v' x = c, 'h' y = c, 'd' the 45° line y = x + c, 'a' the 45° line
// y = −x + c, 'o' the line through `at` at `deg` degrees; a candidate line runs through its points a and b.

const EPS = 1e-6;
const eq = (a, b) => Math.abs(a - b) < EPS;
const peq = (p, q) => eq(p[0], q[0]) && eq(p[1], q[1]);
const sub = (p, q) => [p[0] - q[0], p[1] - q[1]];
const dot = (u, v) => u[0] * v[0] + u[1] * v[1];
const len = u => Math.hypot(u[0], u[1]);
const unit = u => { const l = len(u); return [u[0] / l, u[1] / l]; };
const key = p => `${Math.round(p[0] * 1000)},${Math.round(p[1] * 1000)}`;

// ---------------------------------------------------------------- the line m
/** a line as { p0, u }: a point on it and its unit direction */
function lineOf(L) {
  if (!L) return null;
  switch (L.kind) {
    case 'v': return { p0: [L.c, 0], u: [0, 1] };
    case 'h': return { p0: [0, L.c], u: [1, 0] };
    case 'd': return { p0: [0, L.c], u: unit([1, 1]) };
    case 'a': return { p0: [0, L.c], u: unit([1, -1]) };
    case 'o': { const t = (L.deg * Math.PI) / 180; return { p0: L.at, u: [Math.cos(t), Math.sin(t)] }; }
    default: return null;
  }
}
const through = (a, b) => ({ p0: a, u: unit(sub(b, a)) });
/** the foot of the perpendicular from p to the line */
const foot = (p, l) => { const t = dot(sub(p, l.p0), l.u); return [l.p0[0] + t * l.u[0], l.p0[1] + t * l.u[1]]; };
const reflect = (p, l) => { const f = foot(p, l); return [2 * f[0] - p[0], 2 * f[1] - p[1]]; };
/** signed distance of p from the line (normal = u turned a quarter counterclockwise) */
const side = (p, l) => dot(sub(p, l.p0), [-l.u[1], l.u[0]]);
const onLine = (p, l) => eq(side(p, l), 0);
const sameLine = (k, l) => eq(Math.abs(dot(k.u, l.u)), 1) && onLine(k.p0, l);
/** the grid's own count from a point to a 45° line: x + y − c ('a') or y − x − c ('d'); one small step changes it by 1 */
const diagS = (p, L) => (L.kind === 'a' ? p[0] + p[1] - L.c : p[1] - p[0] - L.c);

// ---------------------------------------------------------------- picture helpers
const choice = (q, pred) => {
  const hits = (q.choices ?? []).map((c, i) => (pred(c, i) ? i : -1)).filter(i => i >= 0);
  return hits.length === 1 ? hits[0] : -1;
};
const pin = (pic, label) => (pic.pins ?? []).find(x => x.label === label)?.at;
/** the vertex of the figure called `label` */
function vertex(pic, label) {
  for (const f of pic.figure ?? []) { const i = (f.labels ?? []).indexOf(label); if (i >= 0) return f.pts[i]; }
  return undefined;
}
/** the spot at a point → its choice index ("Spot n") */
function spotAt(q, to) {
  const hits = (q.data.pic.spots ?? []).filter(s => peq(s.at, to));
  if (hits.length !== 1) return -1;
  return choice(q, c => c === `Spot ${hits[0].n}`);
}
const setKey = pts => pts.map(key).sort().join(' ');
const sameSet = (A, B) => A.length === B.length && setKey(A) === setKey(B);
/** signed area of a polygon (orientation of its corners in order) */
const area = P => P.reduce((s, a, i) => { const b = P[(i + 1) % P.length]; return s + a[0] * b[1] - b[0] * a[1]; }, 0) / 2;

// ---------------------------------------------------------------- the families
function solve(q) {
  const pic = q.data?.pic;
  if (!pic) return undefined;
  const p = q.prompt;
  const m = lineOf(pic.line);
  switch (q.family) {
    case 'move': {
      const A = pic.figure[0].pts, B = pic.image[0].pts;
      const isRefl = sameSet(A.map(x => reflect(x, m)), B);
      const sum = P => P.reduce((s, x) => [s[0] + x[0], s[1] + x[1]], [0, 0]);
      const sa = sum(A), sb = sum(B), n = A.length;
      const d = [(sb[0] - sa[0]) / n, (sb[1] - sa[1]) / n];
      const isSlide = (Math.abs(d[0]) > EPS || Math.abs(d[1]) > EPS) && sameSet(A.map(x => [x[0] + d[0], x[1] + d[1]]), B);
      const c = [(sa[0] + sb[0]) / (2 * n), (sa[1] + sb[1]) / (2 * n)];
      const isHalf = sameSet(A.map(x => [2 * c[0] - x[0], 2 * c[1] - x[1]]), B);
      return choice(q, t => (/^A reflection in line m$/.test(t) ? isRefl : /^A slide$/.test(t) ? isSlide : /^A half turn$/.test(t) ? isHalf : false));
    }
    case 'fold': {
      const L = p.match(/Which spot does ([A-Z]) land on/)?.[1];
      const P = pin(pic, L);
      return P ? spotAt(q, reflect(P, m)) : -1;
    }
    case 'perp': {
      const P = pin(pic, 'P');
      const hits = (pic.spots ?? []).filter(s => {
        const v = sub(s.at, P);
        return len(v) > EPS && eq(dot(unit(v), m.u), 0) && Math.sign(side(s.at, m)) === -Math.sign(side(P, m));
      });
      return hits.length === 1 ? choice(q, c => c === `Spot ${hits[0].n}`) : -1;
    }
    case 'distance': case 'count': case 'diag': case 'half': case 'oblique': case 'extend': {
      const P = pin(pic, 'P');
      return spotAt(q, reflect(P, m));
    }
    case 'vertex': {
      const L = p.match(/Which spot is ([A-Z])′/)?.[1];
      const V = vertex(pic, L);
      return V ? spotAt(q, reflect(V, m)) : -1;
    }
    case 'fixed': {
      const L = p.match(/How many squares does vertex ([A-Z]) move/)?.[1];
      const V = vertex(pic, L);
      if (!V) return undefined;
      const d = len(sub(reflect(V, m), V));
      // a move along a diagonal is not a whole number of squares; sane() names it
      return Number.isInteger(Math.round(d * 1e6) / 1e6) ? Math.round(d) : d;
    }
    case 'stepsNum': {
      const P = pin(pic, 'P');
      const L = pic.line;
      if (/Count whole diagonal steps/.test(p)) return Math.abs(diagS(P, L)) / 2;
      if (/Count SMALL steps/.test(p)) return Math.abs(diagS(P, L));
      const d = Math.abs(side(P, m));
      if (/How many squares is P from line m/.test(p)) return d;
      if (/How many squares apart are P and P′/.test(p)) return 2 * d;
      return undefined;
    }
    case 'tool': {
      const P = pin(pic, 'P');
      const hits = (pic.cands ?? []).filter(cd => { const k = through(cd.a, cd.b); return onLine(P, k) && eq(dot(k.u, m.u), 0); });
      return hits.length === 1 ? choice(q, c => c === `Line ${hits[0].n}`) : -1;
    }
    case 'transfer': {
      const mm = p.match(/is (\d+)(½)? (cm|in) long/);
      if (!mm) return undefined;
      return 2 * (Number(mm[1]) + (mm[2] ? 0.5 : 0));
    }
    case 'crossing': {
      const A = pic.figure[0].pts, lab = pic.figure[0].labels, B = pic.image[0].pts;
      const right = sameSet(A.map(x => reflect(x, m)), B);
      const onM = A.map((x, i) => (onLine(x, m) ? lab[i] : null)).filter(Boolean);
      const onMoved = A.some(x => onLine(x, m) && !B.some(y => peq(x, y)));
      return choice(q, c => {
        let mm;
        if ((mm = c.match(/^Yes: ([A-Z]) is on m, so its image is \1 itself$/))) return right && onM.includes(mm[1]);
        if (/^Yes: every vertex is reflected, so the image crosses m too$/.test(c)) return right;
        if (/^No: the vertex on m must stay where it is$/.test(c)) return !right && onMoved;
        if (/^No: each vertex must go straight across, just as far$/.test(c)) return !right;
        return false;   // "must lie all on the other side", "can not overlap / touch", "every point moves": false rules
      });
    }
    case 'verify': {
      const P = pin(pic, 'P'), Q = pin(pic, 'Q');
      const sp = side(P, m), sq = side(Q, m);
      const pOn = eq(sp, 0);
      const perp = eq(dot(unit(sub(Q, P)), m.u), 0);
      const far = eq(Math.abs(sp), Math.abs(sq));
      const isImage = pOn ? peq(P, Q) : peq(reflect(P, m), Q);
      return choice(q, c => {
        if (/^Yes: Q is the image of P$/.test(c)) return isImage;
        if (/^No: P is on m, so its image is P itself$/.test(c)) return pOn && !isImage;
        if (/^No: PQ does not cross m at a right angle$/.test(c)) return !isImage && !perp;
        if (/^No: Q is not as far from m as P$/.test(c)) return !isImage && !far;
        if (/^No: Q is on the same side of m as P$/.test(c)) return !isImage && !pOn && Math.sign(sp) === Math.sign(sq) && !eq(sq, 0);
        return false;
      });
    }
    case 'audit': {
      const F = pic.figure[0], I = pic.image[0];
      const fails = F.labels.map((l, i) => {
        const j = (I.labels ?? []).indexOf(`${l}'`);
        return j < 0 || !peq(reflect(F.pts[i], m), I.pts[j]);
      });
      const nf = fails.filter(Boolean).length;
      // every vertex fails: is the image the reflection in some other line (the perpendicular bisector of AA′)?
      const otherLine = () => {
        // a vertex that moved fixes the line: the perpendicular bisector of it and its image (a vertex on that line stays)
        const i0 = F.labels.findIndex((l, i) => !peq(F.pts[i], I.pts[I.labels.indexOf(`${l}'`)]));
        if (i0 < 0) return false;
        const A = F.pts[i0], A2 = I.pts[I.labels.indexOf(`${F.labels[i0]}'`)];
        const mid = [(A[0] + A2[0]) / 2, (A[1] + A2[1]) / 2], d = unit(sub(A2, A));
        const k = { p0: mid, u: [-d[1], d[0]] };
        return !sameLine(k, m) && F.labels.every((l, i) => peq(reflect(F.pts[i], k), I.pts[I.labels.indexOf(`${l}'`)]));
      };
      return choice(q, c => {
        if (/^It is the reflection: every vertex checks$/.test(c)) return nf === 0;
        const mm = c.match(/^Only ([A-Z])′ fails$/);
        if (mm) return nf === 1 && fails[F.labels.indexOf(mm[1])];
        if (/^Every vertex fails: it is reflected in a different line$/.test(c)) return nf === F.labels.length && otherLine();
        return false;
      });
    }
    case 'sameShape': {
      const F = pic.figure[0], I = pic.image[0];
      const img = F.labels.map(l => I.pts[I.labels.indexOf(`${l}'`)]);
      const R = F.pts.map(x => reflect(x, m));
      const shift = sub(img[0], R[0]);
      const allShift = R.every((r, i) => peq(sub(img[i], r), shift));
      const isRefl = allShift && eq(len(shift), 0);
      const along = allShift && !isRefl && eq(dot(shift, [-m.u[1], m.u[0]]), 0);      // flipped, then moved along m
      const across = allShift && !isRefl && eq(dot(shift, m.u), 0);                    // = the reflection in a parallel line
      const d = sub(img[0], F.pts[0]);
      const slid = F.pts.every((x, i) => peq(sub(img[i], x), d)) && !eq(len(d), 0);
      return choice(q, c => {
        if (/^Yes: every vertex and its image check$/.test(c)) return isRefl;
        if (/^No: it is flipped, then moved along m$/.test(c)) return along;
        if (/^No: it is the reflection in a different line$/.test(c)) return across;
        if (/^No: it is only slid, not flipped$/.test(c)) return slid;
        return false;
      });
    }
    case 'orient': {
      const F = pic.figure[0], I = pic.image[0];
      const img = F.labels.map(l => I.pts[I.labels.indexOf(`${l}'`)]);
      const same = Math.sign(area(F.pts)) === Math.sign(area(img));
      // the order alone: the same way round rules a reflection out; reversed decides nothing on its own
      return choice(q, c => (same ? /^Same way round: it can not be a reflection$/ : /^Reversed: that alone can not decide; check the vertex pairs$/).test(c));
    }
    case 'bisect': {
      const A = pin(pic, 'A'), A2 = pin(pic, "A'");
      const mid = [(A[0] + A2[0]) / 2, (A[1] + A2[1]) / 2], d = unit(sub(A2, A));
      const hits = (pic.cands ?? []).filter(cd => { const k = through(cd.a, cd.b); return onLine(mid, k) && eq(dot(k.u, d), 0); });
      return hits.length === 1 ? choice(q, c => c === `Line ${hits[0].n}`) : -1;
    }
    case 'locate': {
      const F = pic.figure[0], I = pic.image[0];
      const hits = (pic.cands ?? []).filter(cd => {
        const k = through(cd.a, cd.b);
        return F.pts.every((x, i) => peq(reflect(x, k), I.pts[i]));
      });
      return hits.length === 1 ? choice(q, c => c === `Line ${hits[0].n}`) : -1;
    }
    case 'slip': return solveSlip(q, pic, m);
    case 'exact': {
      if (/^Mia measured/.test(p)) return choice(q, c => /^It is good evidence, but it does not prove it exactly$/.test(c));
      // the marks of a not-to-scale diagram are given facts: PQ ⟂ m and PM = MQ prove it
      if (/Its marks say PQ ⊥ m and PM = MQ/.test(p)) return choice(q, c => /^It proves that Q is the image of P$/.test(c));
      return -1;
    }
    case 'marks': {
      const M = pin(pic, 'M');
      const segs = pic.segs ?? [];
      const ticks = segs.map(s => s.ticks ?? 0);
      const equal = segs.length === 2 && ticks[0] > 0 && ticks[0] === ticks[1];
      const right = (pic.marks ?? []).some(mk => peq(mk.at, M) && (eq(Math.abs(dot(unit(mk.u), m.u)), 1) || eq(Math.abs(dot(unit(mk.v), m.u)), 1)));
      return choice(q, c => {
        if (/^Yes: Q is the image of P$/.test(c)) return equal && right;
        if (/^Not shown: PM and MQ are not marked equal$/.test(c)) return !equal && right;
        if (/^Not shown: no right angle is marked at M$/.test(c)) return !right && equal;
        return false;
      });
    }
    default: return undefined;
  }
}

/** Riley's slip: compare Riley's points with the true images, vertex by vertex */
function solveSlip(q, pic, m) {
  const L = pic.line;
  const diag = L.kind === 'a' || L.kind === 'd';
  let pairs;   // [original, Riley's]
  let slid = false;
  if (pic.figure) {
    const A = pic.figure[0].pts, B = pic.image[0].pts;
    pairs = A.map((x, i) => [x, B[i]]);
    const d = sub(B[0], A[0]);
    slid = !eq(len(d), 0) && A.every((x, i) => peq(sub(B[i], x), d)) && !A.every((x, i) => peq(reflect(x, m), B[i]));
  } else pairs = [[pin(pic, 'P'), pin(pic, 'R')]];
  const kinds = new Set();
  for (const [P, R] of pairs) {
    const T = reflect(P, m);
    if (peq(T, R)) continue;
    const v = sub(R, P);
    const perp = eq(dot(unit(v), m.u), 0);
    if (!perp) { kinds.add(eq(v[0], 0) || eq(v[1], 0) ? 'across' : 'other'); continue; }
    if (onLine(R, m) && eq(len(sub(R, foot(P, m))), 0)) { kinds.add('fromP'); continue; }
    if (diag) {
      const sP = diagS(P, L), sR = diagS(R, L), dev = Math.abs(sR + sP);
      if (Math.abs(sP) % 2 === 1 && dev === 2) kinds.add('corner');
      else if (Math.abs(sP) % 2 === 0 && dev === 2) kinds.add('one');
      else kinds.add('other');
    } else kinds.add(eq(Math.abs(Math.abs(side(R, m)) - Math.abs(side(P, m))), 1) && Math.sign(side(R, m)) === -Math.sign(side(P, m)) ? 'one' : 'other');
  }
  if (slid) { kinds.clear(); kinds.add('slid'); }
  if (kinds.size !== 1) return -1;
  const k = [...kinds][0];
  const re = {
    slid: /^Riley slid the triangle across instead of flipping it$/,
    across: /^Riley went straight across the page, not at a right angle to m$/,
    fromP: /^Riley counted the distance from P instead of from the line$/,
    corner: /^Riley stopped at a grid corner, but m is crossed in the middle of a square$/,
    one: /^Riley counted one square too many or too few beyond m$/,
  }[k];
  return re ? choice(q, c => re.test(c)) : -1;
}

function sane(q) {
  const out = [];
  const pic = q.data?.pic ?? {};
  const p = q.prompt;
  if (q.family === 'fixed') {
    const v = solve(q);
    if (v !== undefined && !Number.isInteger(v)) out.push('the vertex moves along a diagonal: not a whole number of squares');
  }
  if (q.family === 'transfer') {
    const mm = p.match(/is (\d+)(½)? (cm|in) long/);
    const note = pic.notes?.[0]?.text;
    if (mm && note && !note.startsWith(mm[1])) out.push('the drawn length note and the prompt disagree');
  }
  if (q.family === 'marks') {
    const segs = pic.segs ?? [];
    const equal = segs.length === 2 && (segs[0].ticks ?? 0) > 0 && segs[0].ticks === segs[1].ticks;
    const right = (pic.marks ?? []).length > 0;
    if (!equal && !right) out.push('two things are not marked: two right "Not shown" answers');
  }
  if (q.family === 'stepsNum' && /Count whole diagonal steps/.test(p)) {
    const P = (pic.pins ?? []).find(x => x.label === 'P')?.at;
    if (P && Math.abs(diagS(P, pic.line)) % 2 === 1) out.push('m is crossed in the middle of a square: no whole number of diagonal steps');
  }
  if (q.input === 'choice') {
    let s;
    try { s = solve(q); } catch { s = undefined; }
    if (s === -1) out.push('no single right choice');
  }
  return [...new Set(out)].join('; ');
}

export default { solve, sane };
