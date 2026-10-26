// Oracle for the lesson "linear-inequalities-2d" (Algebra 1, secondary-t6-33: graphing linear inequalities in two
// variables, systems of them, feasible regions, linear programming). Written from what the student sees only
// (docs/lessons/QUALITY_LAYER.md, "O: the oracle"): the prompt, the board (and the extra given board lines
// `picture.bd`), the choices and the drawn picture. A picture draws only the items whose key is in its `show` list;
// `picture.tex` is the worked solution and is never read. Inequalities are parsed into exact relations
// A x + B y op C; every choice is judged by the maths of its claim, and a choice question returns -1 when not exactly
// one choice is right. Students are 14-18: `sane` judges the worlds for them.
import { Q, texPlain, choiceWhere } from '../../tools/quality/oracle-kit.mjs';

// ---------------------------------------------------------------- numbers and points
const norm = s => String(s ?? '').replace(/[−–]/g, '-').replace(/\\le(q)?(?![a-z])/g, '≤').replace(/\\ge(q)?(?![a-z])/g, '≥');
function qs(s) {
  const t = norm(s).replace(/[$,\s]/g, '');
  let m = t.match(/^(-?)(\d+)\/(\d+)$/);
  if (m) return Q(Number(m[2]), Number(m[3])).mul(m[1] ? -1 : 1);
  m = t.match(/^(-?)(\d*)(?:\.(\d+))?$/);
  if (!m || (m[2] === '' && !m[3])) throw new Error(`not a number: ${s}`);
  const d = m[3] ? 10 ** m[3].length : 1, n = Number((m[2] || '0') + (m[3] || ''));
  return Q(m[1] ? -n : n, d);
}
const NUM = '-?\\d+(?:\\.\\d+)?(?:\\/\\d+)?';
/** "(−2, 5)" points of a text, as [Q, Q] */
const pts = t => [...norm(t).matchAll(new RegExp(`\\((${NUM}),\\s*(${NUM})\\)`, 'g'))].map(m => [qs(m[1]), qs(m[2])]);
const samePt = (a, b) => a[0].eq(b[0]) && a[1].eq(b[1]);
const plain = tex => norm(texPlain(norm(tex)));

// ---------------------------------------------------------------- linear expressions: { x, y, c } exact
function parseLin(s) {
  const t = norm(s).replace(/\s+/g, '');
  let i = 0;
  const peek = () => t[i];
  function expr() {
    let a = term(true);
    for (;;) {
      if (peek() === '+') { i++; a = add(a, term(false)); }
      else if (peek() === '-') { i++; a = add(a, scale(term(false), -1)); }
      else return a;
    }
  }
  function term(first) {
    let sg = 1;
    if (first && peek() === '-') { i++; sg = -1; }
    let k = null;
    const m = t.slice(i).match(/^\d+(?:\.\d+)?(?:\/\d+)?/);
    if (m) { k = qs(m[0]); i += m[0].length; }
    let v;
    if (peek() === 'x' || peek() === 'y') { v = { x: Q(0), y: Q(0), c: Q(0) }; v[peek()] = Q(1); i++; }
    else if (peek() === '(') { i++; v = expr(); if (peek() !== ')') throw new Error(`bad expr ${s}`); i++; }
    else if (k) return scale({ x: Q(0), y: Q(0), c: k }, sg);
    else throw new Error(`bad expr ${s}`);
    return scale(v, (k ?? Q(1)).mul(sg));
  }
  const add = (a, b) => ({ x: a.x.add(b.x), y: a.y.add(b.y), c: a.c.add(b.c) });
  const scale = (a, k) => ({ x: a.x.mul(k), y: a.y.mul(k), c: a.c.mul(k) });
  const r = expr();
  if (i !== t.length) throw new Error(`bad expr ${s}`);
  return r;
}
const evalLin = (L, p) => L.x.mul(p[0]).add(L.y.mul(p[1])).add(L.c);

// ---------------------------------------------------------------- inequalities: A x + B y op C
const OPS = { '<': '<', '>': '>', '≤': '≤', '≥': '≥', '=': '=', '<=': '≤', '>=': '≥' };
/** 'y + 3 > −2(x + 2)' → { A, B, C, op } */
function parseIneq(s) {
  const t = norm(s).trim();
  const m = t.match(/^(.*?)(<=|>=|[<>≤≥=])(.*)$/);
  if (!m) throw new Error(`no comparison: ${s}`);
  const L = parseLin(m[1]), R = parseLin(m[3]);
  return { A: L.x.sub(R.x), B: L.y.sub(R.y), C: R.c.sub(L.c), op: OPS[m[2]] };
}
const tryIneq = s => { try { return parseIneq(s); } catch { return null; } };
const sigma = op => (op === '>' || op === '≥' ? 1 : op === '<' || op === '≤' ? -1 : 0);
const strict = op => op === '<' || op === '>';
/** the value A x + B y − C at p */
const val = (I, p) => I.A.mul(p[0]).add(I.B.mul(p[1])).sub(I.C);
function holds(I, p) {
  const v = val(I, p).cmp(0);
  return { '<': v < 0, '>': v > 0, '≤': v <= 0, '≥': v >= 0, '=': v === 0 }[I.op];
}
const onLine = (I, p) => val(I, p).eq(0);
/** k with b = k·a for the boundary lines (A, B, C), or null */
function ratio(a, b) {
  const pairs = [[a.A, b.A], [a.B, b.B], [a.C, b.C]];
  const lead = pairs.find(([u]) => !u.eq(0));
  if (!lead) return null;
  const k = lead[1].div(lead[0]);
  if (k.eq(0)) return null;
  return pairs.every(([u, w]) => u.mul(k).eq(w)) ? k : null;
}
const sameLine = (a, b) => ratio(a, b) !== null;
const parallel = (a, b) => a.A.mul(b.B).eq(a.B.mul(b.A));
/** the same set of points */
function sameIneq(a, b) {
  const k = ratio(a, b);
  if (!k) return false;
  if (a.op === '=' || b.op === '=') return a.op === b.op;
  return strict(a.op) === strict(b.op) && sigma(b.op) * Math.sign(k.value) === sigma(a.op);
}
/** where the solutions are: 'above' / 'below' / 'right' / 'left' */
function sideOf(I) {
  const s = sigma(I.op);
  if (!I.B.eq(0)) return s * Math.sign(I.B.value) > 0 ? 'above' : 'below';
  return s * Math.sign(I.A.value) > 0 ? 'right' : 'left';
}
const sideWord = w => (/right/.test(w) ? 'right' : /left/.test(w) ? 'left' : /above/.test(w) ? 'above' : /below/.test(w) ? 'below' : null);
/** a drawn shading (one half-plane part) and line → the inequality the graph shows */
const fromDrawn = (line, part) => ({ A: Q(line.A), B: Q(line.B), C: Q(line.C), op: part.s > 0 ? (line.dash ? '>' : '≥') : (line.dash ? '<' : '≤') });
const partIneq = part => ({ A: Q(part.A), B: Q(part.B), C: Q(part.C), op: part.s > 0 ? '≥' : '≤' });
const lineOf = (A, B, C) => ({ A: Q(A), B: Q(B), C: Q(C), op: '=' });

/** every inequality written in a text (constraint lists): 'x + y ≤ 20', 'x ≥ 0', '20x + 10y ≥ 240' */
function ineqsIn(text) {
  const t = norm(text).replace(/x, y ≥ 0/g, 'x ≥ 0, y ≥ 0');
  const T = `(?:${NUM})?[xy]`;
  const re = new RegExp(`(-?\\s*${T}(?:\\s*[+-]\\s*${T})*)\\s*([<>≤≥=])\\s*(-?\\$?\\d+(?:\\.\\d+)?(?:\\/\\d+)?)`, 'g');
  return [...t.matchAll(re)].map(m => parseIneq(`${m[1]} ${m[2]} ${m[3].replace('$', '')}`));
}
const ineqText = I => `${I.A}x + ${I.B}y ${I.op} ${I.C}`;

// ---------------------------------------------------------------- the picture
const pic = q => q.data?.picture ?? {};
const shown = q => { const g = pic(q).g; if (!g) return []; const s = new Set(g.show ?? []); return g.items.filter(it => s.has(it.key)); };
const given = q => (pic(q).bd ?? []).map(plain);
const boardText = q => plain(q.board);

/** the system in a prompt: "... the system I1 and I2?" */
function systemOf(q) {
  const m = norm(q.prompt).match(/system (.+?) and (.+?)(?:\?|\. |$)/);
  return m ? [parseIneq(m[1]), parseIneq(m[2])] : null;
}

// region sampling (off every grid line, so no sample sits on a boundary)
function samples(q) {
  const g = pic(q).g;
  const x0 = g?.x?.min ?? -6, x1 = g?.x?.max ?? 6, y0 = g?.y?.min ?? -6, y1 = g?.y?.max ?? 6;
  const out = [], n = 60;
  for (let i = 0; i <= n; i++) for (let j = 0; j <= n; j++)
    out.push([Q(Math.round((x0 + (x1 - x0) * (i + 0.37) / (n + 1)) * 1000), 1000), Q(Math.round((y0 + (y1 - y0) * (j + 0.61) / (n + 1)) * 1000), 1000)]);
  return out;
}

// ---------------------------------------------------------------- polygons (feasible regions)
function cross(a, b) {
  const det = a.A.mul(b.B).sub(a.B.mul(b.A));
  if (det.eq(0)) return null;
  return [a.C.mul(b.B).sub(a.B.mul(b.C)).div(det), a.A.mul(b.C).sub(a.C.mul(b.A)).div(det)];
}
const nonStrict = I => ({ ...I, op: I.op === '<' ? '≤' : I.op === '>' ? '≥' : I.op });
function vertices(cons) {
  const out = [];
  for (let i = 0; i < cons.length; i++) for (let j = i + 1; j < cons.length; j++) {
    const p = cross(cons[i], cons[j]);
    if (p && cons.every(c => holds(nonStrict(c), p)) && !out.some(o => samePt(o, p))) out.push(p);
  }
  return out;
}
/** a direction (dx, dy) in which the region runs off forever, with objective growth > 0 when obj is given */
function unboundedDir(cons, obj) {
  for (let k = 0; k <= 720; k++) {
    const a = (k / 720) * 2 * Math.PI, d = [Q(Math.round(Math.cos(a) * 1e6), 1e6), Q(Math.round(Math.sin(a) * 1e6), 1e6)];
    const ok = cons.every(c => { const v = c.A.mul(d[0]).add(c.B.mul(d[1])).cmp(0); return sigma(c.op) > 0 ? v >= 0 : sigma(c.op) < 0 ? v <= 0 : v === 0; });
    if (ok && (!obj || evalLin(obj, d).sub(obj.c).cmp(0) > 0)) return d;
  }
  return null;
}

// ---------------------------------------------------------------- families
const yesNo = (q, yes) => choiceWhere(q, c => (yes ? /^Yes\b/ : /^No\b/).test(c));
const choicePts = q => q.choices.map(c => pts(c)[0]);

const F = {
  readPoint(q) {
    const P = shown(q).find(it => it.kind === 'point');
    return [P.x, P.y];
  },
  evalExpr(q) {
    const m = norm(q.prompt).match(/^Evaluate (.+) at \((.+)\)\.?$/);
    const p = pts(`(${m[2]})`)[0];
    return evalLin(parseLin(m[1]), p).value;
  },
  compareTF(q) {
    const m = norm(q.prompt).match(/:\s*(-?[\d.\/]+)\s*([<>≤≥=])\s*(-?[\d.\/]+)/);
    const v = qs(m[1]).cmp(qs(m[3]));
    const ok = { '<': v < 0, '>': v > 0, '≤': v <= 0, '≥': v >= 0, '=': v === 0 }[m[2]];
    return choiceWhere(q, c => (ok ? /^True/ : /^False/).test(c));
  },
  isSolution(q) {
    const I = parseIneq(boardText(q));
    return yesNo(q, holds(I, pts(q.prompt)[0]));
  },
  whichSolution(q) {
    const I = parseIneq(boardText(q));
    return choiceWhere(q, c => holds(I, pts(c)[0]));
  },
  hvMember(q) {
    const I = parseIneq(boardText(q));
    return choiceWhere(q, c => holds(I, pts(c)[0]));
  },
  hvGraph(q) {
    const I = parseIneq(boardText(q));
    return choiceWhere(q, c => {
      const p = pts(c)[0];
      if (/single point/.test(c)) return false; // a line equation has infinitely many points
      const horiz = I.A.eq(0), vert = I.B.eq(0);
      if (/horizontal line/.test(c)) return horiz && holds(I, p);
      if (/vertical line/.test(c)) return vert && holds(I, p);
      return false;
    });
  },
  regionShape(q) {
    const I = parseIneq(norm(q.prompt).match(/solutions of (.+?)\?/)[1]);
    return choiceWhere(q, c => {
      const m = c.match(/^Every point (above|below|to the left of|to the right of) the line (.+?) \(the line itself (included|left out)\), with no end$/);
      if (!m) return false;
      const L = parseIneq(m[2]);
      return sameLine(L, I) && sideWord(m[1]) === sideOf(I) && (m[3] === 'included') === !strict(I.op);
    });
  },
  farPoint(q) {
    const I = parseIneq(norm(q.prompt).match(/shows (.+?)\. Is/)[1]);
    return yesNo(q, holds(I, pts(q.prompt)[0]));
  },
  boundaryOf(q) {
    const I = parseIneq(boardText(q));
    return choiceWhere(q, c => { const L = tryIneq(c); return L && L.op === '=' && sameLine(L, I); });
  },
  inclusionPair(q) {
    const p = pts(q.prompt)[0];
    return choiceWhere(q, c => holds(parseIneq(c), p));
  },
  lineStyle(q) {
    const I = parseIneq(norm(q.prompt).match(/boundary of (.+?)\?$/)[1]);
    return choiceWhere(q, c => {
      const m = c.match(/^(Solid|Dashed): points on the line are (not )?solutions$/);
      if (!m) return false;
      return (m[1] === 'Dashed') === strict(I.op) && !!m[2] === strict(I.op);
    });
  },
  intercepts(q) {
    const I = parseIneq(boardText(q));
    return [I.C.div(I.A).value, I.C.div(I.B).value];
  },
  throughOrigin(q) {
    const I = parseIneq(boardText(q));
    return choiceWhere(q, c => {
      if (/^Nothing/.test(c)) return false; // one point does not fix a line
      if (/y-axis/.test(c)) return I.B.eq(0) && I.C.eq(0);
      if (/x-axis/.test(c)) return I.A.eq(0) && I.C.eq(0);
      const p = pts(c).find(p => !(p[0].eq(0) && p[1].eq(0)));
      return !!p && onLine(I, p);
    });
  },
  matchBoundary(q) {
    const L = shown(q).find(it => it.kind === 'bline');
    const line = lineOf(L.A, L.B, L.C);
    return choiceWhere(q, c => { const E = tryIneq(c); return E && E.op === '=' && sameLine(E, line); });
  },
  wrongStyle(q) {
    const I = parseIneq(norm(q.prompt).match(/graphed (.+?) like this/)[1]);
    return critiqueOne(q, I);
  },
  critique(q) {
    const I = parseIneq(norm(q.prompt).match(/graphed (.+?)\. What/)[1]);
    return critiqueOne(q, I);
  },
  testPointSide(q) {
    const p = norm(q.prompt);
    let m = p.match(/^The boundary of (.+?) passes through \(0, 0\)/);
    if (m) {
      const I = parseIneq(m[1]);
      return choiceWhere(q, c => { const t = pts(c)[0]; return !!t && !onLine(I, t); });
    }
    m = p.match(/^Test \((.+?)\) in (.+?)\. Which side/);
    const t = pts(`(${m[1]})`)[0], I = parseIneq(m[2]);
    if (onLine(I, t)) return choiceWhere(q, c => /cannot decide/.test(c));
    const inSide = holds(I, t);
    return choiceWhere(q, c => (inSide ? /^Shade the side that contains/ : /^Shade the side that does not contain/).test(c));
  },
  siGraph(q) {
    const I = parseIneq(norm(q.prompt).match(/graph (.+?)\?$/)[1]);
    return choiceWhere(q, c => {
      const m = c.match(/^(Solid|Dashed) line, shade (above|below|to the left of|to the right of) it$/);
      return !!m && (m[1] === 'Dashed') === strict(I.op) && sideWord(m[2]) === sideOf(I);
    });
  },
  writeGraph(q) {
    const S = shown(q);
    const line = S.find(it => it.kind === 'bline'), sh = S.find(it => it.kind === 'shade');
    const G = fromDrawn(line, sh.parts[0]);
    return choiceWhere(q, c => { const I = tryIneq(c); return I && I.op !== '=' && sameIneq(I, G); });
  },
  axisSide(q) {
    const I = parseIneq(norm(q.prompt).match(/graph (.+?) in the coordinate plane/)[1]);
    return choiceWhere(q, c => {
      const m = c.match(/^(Solid|Dashed) (vertical|horizontal) line (.+?), shade (above|below|to the left of|to the right of) it$/);
      if (!m) return false;
      const L = parseIneq(m[3]);
      const kindOk = m[2] === 'vertical' ? L.B.eq(0) : L.A.eq(0);
      return kindOk && sameLine(L, I) && (m[1] === 'Dashed') === strict(I.op) && sideWord(m[4]) === sideOf(I);
    });
  },
  stdSide(q) {
    const I = parseIneq(norm(q.prompt).match(/solutions of (.+?)\?$/)[1]);
    if (I.op === '=') return choiceWhere(q, c => /^Only on the line/.test(c));
    return choiceWhere(q, c => !/^Only/.test(c) && sideWord(c.toLowerCase()) === sideOf(I));
  },
  isolateY(q) {
    const I = parseIneq(norm(q.prompt).match(/^Rewrite (.+?) with y alone/)[1]);
    return choiceWhere(q, c => /^y\s*[<>≤≥]/.test(norm(c)) && !/y/.test(norm(c).replace(/^y/, '')) && sameIneq(parseIneq(c), I));
  },
  bZero(q) {
    const I = parseIneq(norm(q.prompt).match(/^(.+?) has no y/)[1]);
    return choiceWhere(q, c => {
      const m = c.match(/^(.+?): the half-plane to the (left|right) of the (solid|dashed) line (.+)$/);
      if (!m) return false;
      const J = parseIneq(m[1]), L = parseIneq(m[4]);
      return sameIneq(J, I) && sameLine(L, I) && m[2] === sideOf(I) && (m[3] === 'dashed') === strict(I.op);
    });
  },
  psRead(q) {
    const I = parseIneq(boardText(q));
    if (I.B.eq(0)) return -1;
    const slope = I.A.neg().div(I.B);
    return choiceWhere(q, c => {
      const m = norm(c).match(/^\((.+?)\), slope (.+)$/);
      return !!m && onLine(I, pts(`(${m[1]})`)[0]) && qs(m[2]).eq(slope);
    });
  },
  psToSI(q) {
    const I = parseIneq(norm(q.prompt).match(/^Write (.+?) in slope-intercept form/)[1]);
    return choiceWhere(q, c => /^y\s*[<>≤≥]/.test(norm(c)) && sameIneq(parseIneq(c), I));
  },
  sysPoint(q) {
    const [I1, I2] = systemOf(q), p = pts(q.prompt)[0];
    const h1 = holds(I1, p), h2 = holds(I2, p);
    return choiceWhere(q, c => {
      if (/^Yes/.test(c)) return h1 && h2;
      if (/only/.test(c)) {
        const m = c.match(/makes only (.+?) false$/);
        const J = m && parseIneq(m[1]);
        if (!J) return false;
        const is1 = sameIneq(J, I1), is2 = sameIneq(J, I2);
        return (is1 && !h1 && h2) || (is2 && !h2 && h1);
      }
      if (/both inequalities false/.test(c)) return !h1 && !h2;
      return false;
    });
  },
  sysRegion(q) {
    const [I1, I2] = systemOf(q);
    const labels = shown(q).filter(it => it.kind === 'text' && /^[A-D]$/.test(it.text));
    return choiceWhere(q, c => {
      const L = labels.find(l => l.text === c.match(/Region ([A-D])/)?.[1]);
      if (!L) return false;
      const p = [Q(Math.round(L.x * 1000), 1000), Q(Math.round(L.y * 1000), 1000)];
      return holds(I1, p) && holds(I2, p);
    });
  },
  sysCorner(q) {
    const m = norm(q.prompt).match(/boundaries of (.+?) and (.+?) cross at/);
    const I1 = parseIneq(m[1]), I2 = parseIneq(m[2]), p = pts(q.prompt.split('cross at')[1])[0];
    const ok = holds(I1, p) && holds(I2, p);
    return choiceWhere(q, c => (ok ? /^Yes: .* makes both inequalities true/ : /^No: .* makes at least one inequality false/).test(c));
  },
  specialKind(q) {
    const [I1, I2] = systemOf(q);
    if (!parallel(I1, I2)) return choiceWhere(q, c => /wedge|angle|corner/i.test(c));
    // both as intervals of t = A x + B y (the direction of I1)
    const k = I1.A.eq(0) ? I2.B.div(I1.B) : I2.A.div(I1.A);
    const iv = (C, op, flip) => {
      let o = op;
      if (flip) o = { '<': '>', '>': '<', '≤': '≥', '≥': '≤', '=': '=' }[op];
      return { C, op: o };
    };
    const a = iv(I1.C, I1.op, false), b = iv(I2.C.div(k), I2.op, k.value < 0);
    // lower and upper bounds
    let lo = null, hi = null;
    for (const r of [a, b]) {
      if (r.op === '>' || r.op === '≥' || r.op === '=') { const L = { v: r.C, s: r.op === '>' }; if (!lo || L.v.cmp(lo.v) > 0 || (L.v.eq(lo.v) && L.s)) lo = L; }
      if (r.op === '<' || r.op === '≤' || r.op === '=') { const H = { v: r.C, s: r.op === '<' }; if (!hi || H.v.cmp(hi.v) < 0 || (H.v.eq(hi.v) && H.s)) hi = H; }
    }
    let kind;
    if (lo && hi) {
      const d = lo.v.cmp(hi.v);
      if (d > 0 || (d === 0 && (lo.s || hi.s))) kind = 'empty';
      else if (d === 0) kind = 'line';
      else kind = 'strip';
    } else kind = 'half';
    const pat = { empty: /^No points at all/, line: /^A single line/, strip: /^A strip between/, half: /^A half-plane/ }[kind];
    return choiceWhere(q, c => pat.test(c));
  },
  multiPoint(q) {
    const cons = ineqsIn(norm(q.prompt).split('feasible region of')[1]);
    return choiceWhere(q, c => cons.every(I => holds(I, pts(c)[0])));
  },
  addConstraint(q) {
    const p = norm(q.prompt);
    const cons = ineqsIn(p.match(/region of (.+?)\. Add/)[1]);
    const K = ineqsIn(p.match(/Add the constraint (.+?)\. What/)[1])[0];
    const V = vertices(cons);
    if (unboundedDir(cons)) return -1;
    const inK = V.filter(v => holds(K, v)).length;
    const kind = inK === V.length ? 'same' : inK === 0 ? 'empty' : 'smaller';
    const pat = { same: /^Nothing changes/, empty: /^The region becomes empty/, smaller: /^The region gets smaller but is not empty/ }[kind];
    return choiceWhere(q, c => pat.test(c));
  },
  whyIncluded(q) {
    const I = parseIneq(norm(q.prompt).match(/graph of (.+?)\?$/)[1]);
    return choiceWhere(q, c => {
      const m = c.match(/^On the line, .+? equals .+? exactly, and (\S+) (does not allow|allows) equal$/);
      return !!m && OPS[m[1]] === I.op && (m[2] === 'allows') === !strict(I.op);
    });
  },
  oneTestWhy(q) {
    const I = parseIneq(norm(q.prompt).match(/makes (.+?) (?:true|false), so/)[1]);
    return choiceWhere(q, c => {
      const m = norm(c).match(/^Moving from \(0, 0\) to any point on its side never crosses the line, and only on the line can (.+?) equal (.+?), so the comparison cannot switch on the way$/);
      return !!m && sameLine(parseIneq(`${m[1]} = ${m[2]}`), I);
    });
  },
  vertCompare(q) {
    const m = norm(q.prompt).match(/^For (.+?): at x = (\S+) the boundary/);
    const I = parseIneq(m[1]), a = qs(m[2]);
    if (I.B.eq(0)) return -1;
    const b = I.C.sub(I.A.mul(a)).div(I.B); // the boundary's y at x = a
    // solutions at x = a: B y op (C − A a) → y op' b
    const op = I.B.value > 0 ? I.op : { '<': '>', '>': '<', '≤': '≥', '≥': '≤' }[I.op];
    return choiceWhere(q, c => {
      const n = norm(c).match(/^Every point \((\S+), y\) with y ([<>≤≥]) (\S+)$/);
      return !!n && qs(n[1]).eq(a) && n[2] === op && qs(n[3]).eq(b);
    });
  },
  writeTable(q) {
    const p = norm(q.prompt);
    if (/are all solutions of one inequality/.test(p)) {
      // a few points never fix one inequality: many different ones have all of them as solutions
      return choiceWhere(q, c => /^Many different inequalities/.test(c));
    }
    const G = given(q);
    const bnd = pts(G.find(t => /^boundary/.test(t)) ?? ''), sol = pts(G.find(t => /^solutions/.test(t)) ?? ''), non = pts(G.find(t => /^not solutions/.test(t)) ?? '');
    return choiceWhere(q, c => {
      const I = tryIneq(c);
      if (!I || I.op === '=') return false;
      return bnd.every(b => onLine(I, b)) && sol.every(s => holds(I, s)) && non.every(s => !holds(I, s));
    });
  },
  critiqueSystem(q) {
    const [I1, I2] = systemOf(q);
    const S = shown(q);
    const shades = S.filter(it => it.kind === 'shade');
    const inDrawn = p => shades.some(sh => sh.parts.every(pt => holds(partIneq(pt), p)));
    const inSys = p => holds(I1, p) && holds(I2, p);
    // samples clear of every drawn or given boundary (a sample on a line would test the line, not the region)
    const bounds = [I1, I2, ...shades.flatMap(sh => sh.parts.map(partIneq))];
    const sm = samples(q).filter(p => bounds.every(b => Math.abs(val(b, p).value) > 1e-3));
    const sysEmpty = !sm.some(inSys) && !vertices([I1, I2]).some(v => holds(I1, v) && holds(I2, v)) && parallel(I1, I2);
    const drawnAny = sm.some(inDrawn);
    const extra = sm.some(p => inDrawn(p) && !inSys(p));
    const missing = sm.some(p => inSys(p) && !inDrawn(p));
    // a filled corner point on a dashed boundary
    const corner = S.find(it => it.kind === 'point' && it.open === false);
    let cornerBad = false;
    if (corner) { const cp = [Q(corner.x), Q(corner.y)]; cornerBad = !(holds(I1, cp) && holds(I2, cp)); }
    // drawn boundary styles
    const lines = S.filter(it => it.kind === 'bline');
    const styleBad = lines.some(l => { const L = lineOf(l.A, l.B, l.C); const I = sameLine(L, I1) ? I1 : sameLine(L, I2) ? I2 : null; return I && l.dash !== strict(I.op); });
    let kind;
    if (sysEmpty && drawnAny) kind = 'empty';
    else if (extra) kind = 'union';
    else if (cornerBad) kind = 'corner';
    else if (!missing && !styleBad) kind = 'none';
    else return -1;
    const pat = { empty: /^The system has no solution/, union: /^It shades points that make only one/, corner: /^The corner point should not be included/, none: /^Nothing is wrong/ }[kind];
    return choiceWhere(q, c => pat.test(c));
  },
  viablePlan(q) {
    const P = shown(q).find(it => it.kind === 'point' && it.key === 'P');
    const p = [Q(P.x), Q(P.y)];
    const cons = ineqsIn(norm(q.prompt).split('Plan:')[0]);
    const cap = cons.find(c => sigma(c.op) < 0), need = cons.find(c => sigma(c.op) > 0);
    const capBad = !holds(cap, p), needBad = !holds(need, p);
    return choiceWhere(q, c => {
      if (/^It works/.test(c)) return !capBad && !needBad;
      if (/breaks both/.test(c)) return capBad && needBad;
      const m = c.match(/^It breaks the (.+?) only$/);
      if (!m) return false;
      const isCap = /limit|budget|most|cap/.test(m[1]), isNeed = /target|need|least/.test(m[1]);
      return (isCap && capBad && !needBad) || (isNeed && needBad && !capBad);
    });
  },
  phraseIneq(q) {
    const p = norm(q.prompt);
    // first sentence: the two quantities, each half naming its variable and its rate
    const cut = p.indexOf('. ');
    const halves = p.slice(0, cut).split(' and ');
    const rate = v => { const h = halves.find(s => new RegExp(`(^|[\\s(])${v}(\\s|$)`).test(s)); return h && qs(h.match(/\$?(\d+(?:\.\d+)?)/)[1]); };
    const ph = p.slice(cut).match(/(at least|no less than|more than|at most|no more than|less than|exactly) \$?(\d+(?:\.\d+)?)/);
    const op = { 'at least': '≥', 'no less than': '≥', 'more than': '>', 'at most': '≤', 'no more than': '≤', 'less than': '<', exactly: '=' }[ph[1]];
    const W = { A: rate('x'), B: rate('y'), C: qs(ph[2]), op };
    return choiceWhere(q, c => { const I = tryIneq(c); return I && sameIneq(I, W); });
  },
  psContext(q) {
    const p = norm(q.prompt);
    // the plan: a start value at a start x, then a steady rate
    let m = p.match(/\$(\d+(?:\.\d+)?) by week (\d+), then \$(\d+(?:\.\d+)?) more each week/);
    let y0, x0, r;
    if (m) [y0, x0, r] = [qs(m[1]), qs(m[2]), qs(m[3])];
    else {
      m = p.match(/(\d+(?:\.\d+)?) (\w+) tall on day (\d+) and grow (\d+(?:\.\d+)?) \w+ a day/);
      if (!m) return undefined;
      [y0, x0, r] = [qs(m[1]), qs(m[3]), qs(m[4])];
    }
    const op = /at least the plan/.test(p) ? '≥' : /at most the plan/.test(p) ? '≤' : /more than the plan/.test(p) ? '>' : /less than the plan/.test(p) ? '<' : null;
    if (!op) return undefined;
    // y op y0 + r (x − x0)  →  −r x + y op y0 − r x0
    const W = { A: r.neg(), B: Q(1), C: y0.sub(r.mul(x0)), op };
    return choiceWhere(q, c => { const I = tryIneq(c); return I && sameIneq(I, W); });
  },
  wholeOnly(q) {
    const I = parseIneq(boardText(q));
    const want = /NOT/.test(q.prompt) ? false : true;
    return choiceWhere(q, c => {
      const [x, y] = pts(c)[0];
      const ok = x.d === 1 && y.d === 1 && x.cmp(0) >= 0 && y.cmp(0) >= 0 && holds(I, [x, y]);
      return ok === want;
    });
  },
  countBoundary(q) {
    const I = parseIneq(boardText(q));
    let n = 0;
    for (let y = 0; Q(y).mul(I.B).cmp(I.C) <= 0; y++) {
      const x = I.C.sub(I.B.mul(y)).div(I.A);
      if (x.d === 1 && x.cmp(0) >= 0) n++;
      if (y > 10000) break;
    }
    return n;
  },
  vertexPair(q) {
    const m = norm(q.prompt).match(/where (.+?) and (.+?) meet/);
    const p = cross(parseIneq(m[1]), parseIneq(m[2]));
    return [p[0].value, p[1].value];
  },
  notVertex(q) {
    const p = norm(q.prompt);
    const cons = ineqsIn(p.match(/Feasible region: (.+?)\. The lines/)[1]);
    const m = p.match(/The lines (.+?) and (.+?) cross at/);
    const P = pts(p.split('cross at')[1])[0];
    const L1 = parseIneq(m[1]), L2 = parseIneq(m[2]);
    if (!onLine(L1, P) || !onLine(L2, P)) return -1;
    const broken = cons.filter(c => !holds(c, P));
    return choiceWhere(q, c => {
      if (/^Yes: it lies on two boundary lines and meets every constraint/.test(c)) return broken.length === 0;
      const n = c.match(/^No: it breaks (.+)$/);
      if (n) { const J = parseIneq(n[1]); return broken.some(b => sameIneq(b, J)); }
      return false;
    });
  },
  lpBest(q) {
    const p = norm(q.prompt);
    const cons = ineqsIn(p.split('Profit')[0]);
    const obj = parseLin(p.match(/P = (.+?) dollars/)[1]);
    const V = vertices(cons);
    if (!V.length || unboundedDir(cons, obj)) return -1;
    const best = V.reduce((a, v) => (evalLin(obj, v).cmp(evalLin(obj, a)) > 0 ? v : a));
    const max = evalLin(obj, best);
    return choiceWhere(q, c => { const t = pts(c)[0]; return cons.every(k => holds(k, t)) && evalLin(obj, t).eq(max); });
  },
  lpSpecial(q) {
    const p = norm(q.prompt);
    const m = p.match(/^(Maximize|Minimize) P = (.+?) over (.+?)\. Which/);
    const obj0 = parseLin(m[2]), obj = m[1] === 'Minimize' ? { x: obj0.x.neg(), y: obj0.y.neg(), c: obj0.c.neg() } : obj0;
    const cons = ineqsIn(m[3]);
    const V = vertices(cons);
    let kind;
    if (!V.length) kind = 'none';
    else if (unboundedDir(cons, obj)) kind = 'unbounded';
    else {
      const max = V.reduce((a, v) => (evalLin(obj, v).cmp(a) > 0 ? evalLin(obj, v) : a), evalLin(obj, V[0]));
      const at = V.filter(v => evalLin(obj, v).eq(max)).length;
      kind = at === 1 ? 'one' : 'edge';
    }
    const pat = { none: /^There is no solution/, unbounded: /^There is no (maximum|minimum)/, one: /exactly one corner/, edge: /along one edge/ }[kind];
    return choiceWhere(q, c => pat.test(c));
  },
};

/** what is wrong with a drawn single-inequality graph (wrongStyle / critique) */
function critiqueOne(q, I) {
  const S = shown(q);
  const line = S.find(it => it.kind === 'bline'), sh = S.find(it => it.kind === 'shade');
  const L = lineOf(line.A, line.B, line.C);
  const placeBad = !sameLine(L, I);
  const styleBad = line.dash !== strict(I.op);
  // the drawn side, judged with the drawn shading's own half-plane against the inequality's
  let sideBad = false;
  if (!placeBad && sh) {
    const D = partIneq(sh.parts[0]);
    const k = ratio(I, D);
    sideBad = !(k && sigma(D.op) * Math.sign(k.value) === sigma(I.op));
  }
  const errs = [placeBad && 'place', styleBad && 'style', sideBad && 'side'].filter(Boolean);
  return choiceWhere(q, c => {
    if (/^Nothing/.test(c)) return errs.length === 0 && /^Nothing is wrong$/.test(c);
    if (/^The line should be dashed/.test(c)) return errs.join() === 'style' && strict(I.op);
    if (/^The line should be solid/.test(c)) return errs.join() === 'style' && !strict(I.op);
    if (/^The line style is wrong/.test(c)) return errs.join() === 'style';
    if (/shading should be on the other side|wrong side is shaded/.test(c)) return errs.join() === 'side';
    if (/boundary line is in the wrong place/.test(c)) return errs.includes('place') && errs.length === 1;
    return false;
  });
}

// ---------------------------------------------------------------- sane: the world of the item
function sane(q) {
  const f = q.family, p = norm(q.prompt);
  try {
    if (f === 'inclusionPair') {
      const P = pts(p)[0], L = parseIneq(boardText(q));
      if (!onLine(L, P)) return `the point (${P}) is not on the line`;
    }
    if (f === 'testPointSide') {
      const m = p.match(/^The boundary of (.+?) passes through \(0, 0\)/);
      if (m && !onLine(parseIneq(m[1]), [Q(0), Q(0)])) return 'the boundary does not pass through (0, 0)';
    }
    if (f === 'throughOrigin' && !parseIneq(boardText(q)).C.eq(0)) return 'the line does not pass through (0, 0)';
    if (f === 'oneTestWhy') {
      const m = p.match(/makes (.+?) (true|false), so the side (with|without)\b/);
      const ok = holds(parseIneq(m[1]), [Q(0), Q(0)]);
      if (ok !== (m[2] === 'true')) return `(0, 0) does not make it ${m[2]}`;
      if ((m[3] === 'with') !== ok) return 'the shaded side does not follow the test';
    }
    if (f === 'vertCompare') {
      const m = p.match(/^For (.+?): at x = (\S+) the boundary is at y = (\S+?)\./);
      const I = parseIneq(m[1]);
      if (!onLine(I, [qs(m[2]), qs(m[3])])) return 'the boundary is not at that y';
    }
    if (f === 'sysCorner') {
      const m = p.match(/boundaries of (.+?) and (.+?) cross at/), P = pts(p.split('cross at')[1])[0];
      if (!onLine(parseIneq(m[1]), P) || !onLine(parseIneq(m[2]), P)) return 'the boundaries do not cross there';
    }
    if (f === 'sysRegion') {
      const [I1, I2] = systemOf(q);
      for (const l of shown(q).filter(it => it.kind === 'text')) {
        const P = [Q(Math.round(l.x * 1000), 1000), Q(Math.round(l.y * 1000), 1000)];
        if (Math.abs(val(I1, P).value) < 0.3 || Math.abs(val(I2, P).value) < 0.3) return `label ${l.text} sits on a boundary`;
      }
    }
    if (f === 'viablePlan') {
      const P = shown(q).find(it => it.key === 'P');
      if (P.x < 0 || P.y < 0) return 'a plan with negative hours or feet';
      const plan = p.split('Plan:')[1] ?? '';
      const n = [...plan.matchAll(/(\d+(?:\.\d+)?)/g)].map(x => Number(x[1]));
      if (n[0] !== P.x || n[1] !== P.y) return 'the drawn plan is not the plan in the text';
      if (/tutor/.test(p) && P.x + P.y > 80) return 'more than 80 hours of work a week';
    }
    if (f === 'notVertex' || f === 'vertexPair') {
      const m = p.match(/(?:The lines|where) (.+?) and (.+?) (?:cross|meet)/);
      if (m && !cross(parseIneq(m[1]), parseIneq(m[2]))) return 'the two lines are parallel';
    }
    if (f === 'notVertex') {
      const m = p.match(/The lines (.+?) and (.+?) cross at/), P = pts(p.split('cross at')[1])[0];
      if (!onLine(parseIneq(m[1]), P) || !onLine(parseIneq(m[2]), P)) return 'the lines do not cross at that point';
    }
    if (f === 'wholeOnly') {
      const m = p.match(/cost \$(\d+) and child tickets cost \$(\d+)/);
      if (m && (Number(m[1]) <= 0 || Number(m[2]) <= 0 || Number(m[1]) > 200)) return 'an odd ticket price';
    }
    if (f === 'countBoundary') {
      const I = parseIneq(boardText(q));
      if (I.C.cmp(0) <= 0) return 'no cups wanted';
    }
    if (f === 'addConstraint' && /shaded triangle/.test(p)) {
      const cons = ineqsIn(p.match(/region of (.+?)\. Add/)[1]);
      if (vertices(cons).length !== 3 || unboundedDir(cons)) return 'the region is not a triangle';
    }
    if (f === 'lpBest') {
      const cons = ineqsIn(p.split('Profit')[0]);
      if (unboundedDir(cons)) return 'the bakery region has no end';
    }
  } catch (e) {
    return `could not read the item: ${e.message}`;
  }
  return '';
}

function solve(q) {
  const fn = F[q.family];
  return fn ? fn(q) : undefined;
}

export default { solve, sane };
