// Oracle for the lesson "linear-systems" (Algebra 1, secondary-t6-08: solving systems of linear equations). Written
// from what the student sees only (docs/lessons/QUALITY_LAYER.md, "O: the oracle"): the prompt, the board and the
// given board lines (`picture.bd`), the choices and the drawn picture (only the items whose key is in `g.show`).
// `picture.tex` (the worked solution) and `slips` are never read.
// Every equation is parsed into an exact linear relation over its letters; systems are solved exactly (Cramer) and
// equations / systems are compared by their solution sets (the same line, the same point, the same set of lines).
// Where a question asks for "the equation you get" after a stated operation (multiply, subtract), the exact result
// of that operation is required. A choice question returns -1 when not exactly one choice is right. Students are
// 14-18: `sane` judges the worlds for them.
import { Q, choiceWhere } from '../../tools/quality/oracle-kit.mjs';

// ---------------------------------------------------------------- numbers and points
const norm = s => String(s ?? '').replace(/[−–]/g, '-').replace(/ /g, ' ');
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
const samePt = (a, b) => !!a && !!b && a[0].eq(b[0]) && a[1].eq(b[1]);
const val = p => [p[0].value, p[1].value];

// ---------------------------------------------------------------- linear expressions over any letters
// { v: { x: Q, y: Q, ... }, c: Q }; "1/2x" is (1/2)·x
function parseLin(s) {
  const t = norm(s).replace(/\s+/g, '');
  let i = 0;
  const peek = () => t[i];
  const add = (a, b) => { const v = { ...a.v }; for (const k in b.v) v[k] = (v[k] ?? Q(0)).add(b.v[k]); return { v, c: a.c.add(b.c) }; };
  const scale = (a, k) => { const v = {}; for (const n in a.v) v[n] = a.v[n].mul(k); return { v, c: a.c.mul(k) }; };
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
    if (/[a-zA-Z]/.test(peek() ?? '') && !/[a-zA-Z]/.test(t[i + 1] ?? '')) { v = { v: { [peek()]: Q(1) }, c: Q(0) }; i++; }
    else if (peek() === '(') { i++; v = expr(); if (peek() !== ')') throw new Error(`bad expr ${s}`); i++; }
    else if (k) return scale({ v: {}, c: k }, sg);
    else throw new Error(`bad expr ${s}`);
    return scale(v, (k ?? Q(1)).mul(sg));
  }
  const r = expr();
  if (i !== t.length) throw new Error(`bad expr ${s}`);
  return r;
}
/** 'y = 1/2x − 4' → { v: {x, y}, c } meaning Σ v·letter = c (left minus right) */
function parseEq(s) {
  const parts = norm(s).split('=');
  if (parts.length !== 2) throw new Error(`not one equation: ${s}`);
  const L = parseLin(parts[0]), R = parseLin(parts[1]);
  const v = { ...L.v };
  for (const k in R.v) v[k] = (v[k] ?? Q(0)).sub(R.v[k]);
  for (const k in v) if (v[k].eq(0)) delete v[k];
  return { v, c: R.c.sub(L.c), text: norm(s).trim(), lhs: parts[0].trim(), rhs: parts[1].trim() };
}
const tryEq = s => { try { return parseEq(s); } catch { return null; } };
const co = (E, k) => E.v[k] ?? Q(0);
const letters = E => Object.keys(E.v);
/** the equation as a line (a, b, c) in the letters X, Y; null when another letter appears */
function line(E, X = 'x', Y = 'y') {
  if (!E || letters(E).some(k => k !== X && k !== Y)) return null;
  return [co(E, X), co(E, Y), E.c];
}
/** k with B = k·A, or null */
function ratio(A, B) {
  const lead = A.findIndex(u => !u.eq(0));
  if (lead < 0) return null;
  const k = B[lead].div(A[lead]);
  if (k.eq(0)) return null;
  return A.every((u, i) => u.mul(k).eq(B[i])) ? k : null;
}
const isLine = L => !!L && !(L[0].eq(0) && L[1].eq(0));
const sameLine = (A, B) => isLine(A) && isLine(B) && ratio(A, B) !== null;
/** the same equation exactly (all terms moved left, nothing scaled) */
const exactSame = (A, B) => !!A && !!B && A.every((u, i) => u.eq(B[i]));
const onLine = (L, p) => L[0].mul(p[0]).add(L[1].mul(p[1])).eq(L[2]);
/** a system of two lines: { kind: 'one' | 'none' | 'inf', p? } */
function solveSys(A, B) {
  const det = A[0].mul(B[1]).sub(A[1].mul(B[0]));
  if (!det.eq(0)) {
    return { kind: 'one', p: [A[2].mul(B[1]).sub(A[1].mul(B[2])).div(det), A[0].mul(B[2]).sub(A[2].mul(B[0])).div(det)] };
  }
  return { kind: ratio(A, B) ? 'inf' : 'none' };
}
function sameSet(S, T, A, C) {
  if (S.kind !== T.kind) return false;
  if (S.kind === 'one') return samePt(S.p, T.p);
  if (S.kind === 'inf') return sameLine(A, C);
  return true;
}
const sysOfTexts = (t1, t2, X = 'x', Y = 'y') => { const A = line(parseEq(t1), X, Y), B = line(parseEq(t2), X, Y); return { A, B, S: solveSys(A, B) }; };
/** "... system E1 and E2?" and the like: two equations around ' and ' */
function twoEqs(s, re) {
  const m = norm(s).match(re);
  if (!m) throw new Error(`no system in: ${s}`);
  return [m[1], m[2]];
}
const kindOf = S => S.kind;
const kindChoice = (q, k) => choiceWhere(q, c => ({ one: /^(One solution|One crossing point|Two lines crossing once|Consistent and independent)/, none: /^(No solution|Parallel lines|Inconsistent)/, inf: /^(Infinitely many|The same line|Consistent and dependent)/ }[k]).test(c));
const slopeOf = L => (L[1].eq(0) ? null : L[0].neg().div(L[1]));

// ---------------------------------------------------------------- the picture
const pic = q => q.data?.picture ?? {};
const shown = q => { const g = pic(q).g; if (!g) return []; const s = new Set(g.show ?? []); return (g.items ?? []).filter(it => s.has(it.key)); };
const drawnLine = it => [Q(it.E.a), Q(it.E.b), Q(it.E.c)];

// ---------------------------------------------------------------- stories
function storyModel(p) {
  let m = p.match(/A bus tour sold (\d+) tickets\. There were (\d+) times as many student tickets as adult tickets/);
  if (m) return { X: 'a', Y: 's', eqs: [[Q(1), Q(1), Q(Number(m[1]))], [Q(-Number(m[2])), Q(1), Q(0)]], whole: true };
  m = p.match(/A theater sold (\d+) tickets for \$(\d+): adult tickets at \$(\d+), student tickets at \$(\d+)/);
  if (m) return { X: 'a', Y: 's', eqs: [[Q(1), Q(1), Q(Number(m[1]))], [Q(Number(m[3])), Q(Number(m[4])), Q(Number(m[2]))]], whole: true };
  m = p.match(/A jar holds (\d+) coins, only nickels and dimes, worth (\d+) cents in all/);
  if (m) return { X: 'n', Y: 'd', eqs: [[Q(1), Q(1), Q(Number(m[1]))], [Q(5), Q(10), Q(Number(m[2]))]], whole: true };
  m = p.match(/A store mixes (\d+(?:\.\d+)?) pounds of peanuts and cashews and charges \$(\d+(?:\.\d+)?) for the whole mix\. Peanuts cost \$(\d+(?:\.\d+)?) a pound, cashews \$(\d+(?:\.\d+)?) a pound/);
  if (m) return { X: 'p', Y: 'c', eqs: [[Q(1), Q(1), qs(m[1])], [qs(m[3]), qs(m[4]), qs(m[2])]], whole: false };
  throw new Error('unknown story');
}
/** a written system "E1 and E2" (or "E1, E2 and E3") as lines in X, Y; null when a part is not such a line */
function writtenSystem(text, X, Y) {
  const parts = norm(text).split(/\s+and\s+|,\s+/);
  const L = parts.map(t => line(tryEq(t), X, Y));
  return L.every(isLine) ? L : null;
}
const sameLineSet = (A, B) => A.length === B.length && A.every(a => B.some(b => sameLine(a, b))) && B.every(b => A.some(a => sameLine(a, b)));

/** plans: "Plan A: $30 to join plus $35 a month" / "$40 a month" / "$30 for the first month, then $20 for each month after that" */
function planCost(t) {
  let m = t.match(/\$(\d+) to join plus \$(\d+) a month/);
  if (m) return { r: Q(Number(m[2])), j: Q(Number(m[1])) };
  m = t.match(/\$(\d+) for the first month, then \$(\d+) for each month after that/);
  if (m) return { r: Q(Number(m[2])), j: Q(Number(m[1]) - Number(m[2])) };
  m = t.match(/^\s*\$(\d+) a month/);
  if (m) return { r: Q(Number(m[1])), j: Q(0) };
  throw new Error(`plan? ${t}`);
}

// ---------------------------------------------------------------- the families
const yesNo = (q, yes) => choiceWhere(q, c => (yes ? /^Yes\b/ : /^No\b/).test(c));
const SYS_RE = /system (.+?) and (.+?)(?:\?| \(graphed\)| are drawn| have)/;

function solvePair(t1, t2) {
  const { S } = sysOfTexts(t1, t2);
  if (S.kind !== 'one') return null;
  return val(S.p);
}

/** the context system of ctxMeaning / ctxRead: lines in (X, Y) and the words that name the axes */
function ctxSystem(p) {
  let m = p.match(/C = ([^.,]+?)\. Plan B.*?C = ([^.,]+?)\. /);
  if (m) return { kind: 'plan', X: 'm', Y: 'C', A: line(parseEq(`C = ${m[1]}`), 'm', 'C'), B: line(parseEq(`C = ${m[2]}`), 'm', 'C') };
  m = p.match(/car (d = [^,]+), bus (d = [^.]+?)\. /);
  if (m) return { kind: 'bus', X: 't', Y: 'd', A: line(parseEq(m[1]), 't', 'd'), B: line(parseEq(m[2]), 't', 'd') };
  m = p.match(/student tickets: (.+?) and (.+?)\. /);
  if (m) return { kind: 'tickets', X: 'a', Y: 's', A: line(parseEq(m[1]), 'a', 's'), B: line(parseEq(m[2]), 'a', 's') };
  throw new Error('unknown context');
}

const F = {
  pairCheck(q) {
    const [e1, e2] = twoEqs(q.prompt, SYS_RE);
    const P = pts(q.prompt)[0];
    const t1 = onLine(line(parseEq(e1)), P), t2 = onLine(line(parseEq(e2)), P);
    const pat = t1 && t2 ? /^Yes: it makes both/ : t1 ? /^No: only the first/ : t2 ? /^No: only the second/ : /^No: neither/;
    return choiceWhere(q, c => pat.test(c));
  },
  whichPair(q) {
    const [e1, e2] = twoEqs(q.prompt, SYS_RE);
    const { S } = sysOfTexts(e1, e2);
    return choiceWhere(q, c => S.kind === 'one' && samePt(pts(c)[0], S.p));
  },
  readCross(q) {
    const [e1, e2] = twoEqs(q.prompt, SYS_RE);
    return solvePair(e1, e2);
  },
  markedPoint(q) {
    const [e1, e2] = twoEqs(q.prompt, SYS_RE);
    const { S } = sysOfTexts(e1, e2);
    return choiceWhere(q, c => S.kind === 'one' && samePt(pts(c)[0], S.p));
  },
  ctxMeaning(q) {
    const p = norm(q.prompt);
    const C = ctxSystem(p);
    const at = (L, x) => L[2].sub(L[0].mul(x)).div(L[1]);
    return choiceWhere(q, c0 => {
      const c = norm(c0);
      let m;
      if (C.kind === 'plan') {
        if ((m = c.match(/^After (\S+) months both plans cost \$(\S+) in total\.$/))) return at(C.A, qs(m[1])).eq(qs(m[2])) && at(C.B, qs(m[1])).eq(qs(m[2]));
        if ((m = c.match(/^After (\S+) months Plan A costs \$(\S+), and Plan B costs a different amount\.$/))) return at(C.A, qs(m[1])).eq(qs(m[2])) && !at(C.B, qs(m[1])).eq(qs(m[2]));
        if (/^The plans cross, so from month \S+ on they are the same plan\.$/.test(c)) return sameLine(C.A, C.B);
      }
      if (C.kind === 'bus') {
        if ((m = c.match(/^After (\S+) hours they are both (\S+) miles from town\.$/))) return at(C.A, qs(m[1])).eq(qs(m[2])) && at(C.B, qs(m[1])).eq(qs(m[2]));
        if ((m = c.match(/^After (\S+) hours the car is (\S+) miles from town; the bus can be somewhere else\.$/))) return at(C.A, qs(m[1])).eq(qs(m[2])) && !at(C.B, qs(m[1])).eq(qs(m[2]));
        if ((m = c.match(/^(\S+) hours after the car leaves, the car and the bus are both (\S+) miles from town: the car catches up\.$/))) return at(C.A, qs(m[1])).eq(qs(m[2])) && at(C.B, qs(m[1])).eq(qs(m[2]));
        if (/^The lines cross, so the road makes a crossing there\.$/.test(c)) return false;
      }
      if (C.kind === 'tickets') {
        const both = (a, s) => onLine(C.A, [a, s]) && onLine(C.B, [a, s]);
        const total = Number(p.match(/sold (\d+) tickets/)[1]), money = Number(p.match(/for \$(\d+) in all/)[1]);
        if ((m = c.match(/^(\S+) adult and (\S+) student tickets: that makes (\S+) tickets AND \$(\S+)\.$/))) return both(qs(m[1]), qs(m[2])) && Number(m[3]) === total && Number(m[4]) === money;
        if ((m = c.match(/^(\S+) adult and (\S+) student tickets make (\S+) tickets; the money does not have to match\.$/))) return onLine(C.A, [qs(m[1]), qs(m[2])]) && !onLine(C.B, [qs(m[1]), qs(m[2])]) && Number(m[3]) === total;
        if ((m = c.match(/^(\S+) adult and (\S+) student tickets\.$/))) return both(qs(m[1]), qs(m[2]));
        if (/^The lines cross, so adult and student tickets cost the same there\.$/.test(c)) return false;
      }
      throw new Error(`ctxMeaning choice? ${c0}`);
    });
  },
  ctxRead(q) {
    const C = ctxSystem(norm(q.prompt));
    const S = solveSys(C.A, C.B);
    return S.kind === 'one' ? val(S.p) : null;
  },
  siMatch(q) {
    const [A, B] = pts(q.prompt);
    return choiceWhere(q, c => { const E = tryEq(c); const L = line(E); return isLine(L) && /^y$/.test(E.lhs) && onLine(L, A) && onLine(L, B); });
  },
  stdIntercepts(q) {
    const L = line(parseEq(norm(q.prompt).match(/To graph (.+?) quickly/)[1]));
    if (L[0].eq(0) || L[1].eq(0)) return null;
    return [L[2].div(L[0]).value, L[2].div(L[1]).value];
  },
  stdSlope(q) {
    const L = line(parseEq(norm(q.prompt).match(/slope of the line (.+?)\?/)[1]));
    const m = slopeOf(L);
    return choiceWhere(q, c => (m === null ? /^undefined$/.test(c) : (() => { try { return qs(c).eq(m); } catch { return false; } })()));
  },
  hvWhich(q) {
    const p = norm(q.prompt);
    if (/marked points/.test(p)) {
      const [A, B] = pts(p);
      return choiceWhere(q, c => { const L = line(tryEq(c)); return isLine(L) && onLine(L, A) && onLine(L, B); });
    }
    const L = line(parseEq(p.match(/graph of (.+?) look like/)[1]));
    return choiceWhere(q, c0 => {
      const c = norm(c0); let m;
      if ((m = c.match(/^An upright \(vertical\) line through (\(.+\))$/))) return L[1].eq(0) && !L[0].eq(0) && onLine(L, pts(m[1])[0]);
      if ((m = c.match(/^A flat \(horizontal\) line through (\(.+\))$/))) return L[0].eq(0) && !L[1].eq(0) && onLine(L, pts(m[1])[0]);
      if (/^Only the single point/.test(c)) return false;
      if ((m = c.match(/^The line (.+) through the origin$/))) return sameLine(line(parseEq(m[1])), L) && onLine(L, [Q(0), Q(0)]);
      throw new Error(`hvWhich choice? ${c0}`);
    });
  },
  hvCross(q) {
    const [e1, e2] = twoEqs(q.prompt, /lines (.+?) and (.+?) cross/);
    return solvePair(e1, e2);
  },
  hvSlope(q) {
    const L = line(parseEq(norm(q.prompt).match(/slope of (.+?)\?/)[1]));
    const m = slopeOf(L);
    return choiceWhere(q, c => (m === null ? /^undefined$/.test(c) : (() => { try { return qs(c).eq(m); } catch { return false; } })()));
  },
  toSI(q) {
    const E = parseEq(norm(q.prompt).match(/^Rewrite (.+?) (?:as|in the form) y = mx/)[1]);
    const L = line(E);
    return choiceWhere(q, c0 => {
      const c = norm(c0); let m;
      if ((m = c.match(/^(.+?): a vertical line, it has no y = mx \+ b form$/))) return L[1].eq(0) && sameLine(line(parseEq(m[1])), L) && /^x$/.test(parseEq(m[1]).lhs);
      if ((m = c.match(/^(.+?): a horizontal line$/))) return L[0].eq(0) && sameLine(line(parseEq(m[1])), L);
      const C = tryEq(c);
      return !!C && C.lhs === 'y' && !/y/.test(C.rhs) && sameLine(line(C), L);
    });
  },
  estimateExact(q) {
    const [e1, e2] = twoEqs(q.prompt, /graphs of (.+?) and (.+?) cross/);
    const { S } = sysOfTexts(e1, e2);
    return choiceWhere(q, c => S.kind === 'one' && samePt(pts(c)[0], S.p));
  },
  roundedFails(q) {
    const [e1, e2] = twoEqs(q.prompt, /graphs (.+?) and (.+?) and reads/);
    const P = pts(norm(q.prompt).split('reads the crossing as')[1])[0];
    const ok = onLine(line(parseEq(e1)), P) && onLine(line(parseEq(e2)), P);
    return choiceWhere(q, c => (ok ? /is the exact solution: it checks/ : /is only an estimate: it fails/).test(c));
  },
  techExact(q) {
    const p = norm(q.prompt);
    const [e1, e2] = twoEqs(p, /intersection of (.+?) and (.+?) and shows/);
    const { S } = sysOfTexts(e1, e2);
    if (/Is that value exact\?/.test(p)) {
      const T = pts(p.split('shows')[1])[0];
      const ok = S.kind === 'one' && samePt(T, S.p);
      return choiceWhere(q, c => (ok ? /^Exact: it checks/ : /^Rounded:/).test(c));
    }
    return choiceWhere(q, c => S.kind === 'one' && samePt(pts(c)[0], S.p));
  },
  techWindow(q) {
    const [e1, e2] = twoEqs(q.prompt, /graphing tool shows (.+?) and (.+?) but no intersection/);
    const { S } = sysOfTexts(e1, e2);
    if (S.kind === 'one') return choiceWhere(q, c => /^Change the window: the slopes differ/.test(c));
    if (S.kind === 'none') return choiceWhere(q, c => /^The lines are parallel$/.test(c));
    return -1;
  },
  subStep(q) {
    const p = norm(q.prompt);
    const m = p.match(/^(.+?) is already solved for ([xy])\. Substitute it into (.+?)\. Which/);
    const iso = parseEq(m[1]), other = parseEq(m[3]), v = m[2], w = v === 'x' ? 'y' : 'x';
    if (iso.lhs !== v) throw new Error('not isolated');
    // v = r·w + s  →  other: a·v + b·w = c becomes (a·r + b)·w = c − a·s
    const r = co(parseEq(`0 = ${iso.rhs}`), w).neg(), s = parseEq(`0 = ${iso.rhs}`).c;
    const a = co(other, v), b = co(other, w);
    const want = [a.mul(r).add(b), other.c.sub(a.mul(s))];
    const sol1 = (k, c) => (k.eq(0) ? (c.eq(0) ? 'all' : 'none') : c.div(k).toString());
    return choiceWhere(q, c => {
      const E = tryEq(c);
      if (!E || letters(E).some(k => k !== w)) return false;
      return sol1(co(E, w), E.c) === sol1(want[0], want[1]);
    });
  },
  subSolve(q) {
    const p = norm(q.prompt);
    let m = p.match(/^Both equations of (.+?) and (.+?) give [xy]\. Set the two expressions equal and solve for ([xy])\./);
    let e1, e2, ask;
    if (m) [e1, e2, ask] = [m[1], m[2], m[3]];
    else { m = p.match(/^Solve (.+?) and (.+?) by substitution\. What is ([xy])\?/); [e1, e2, ask] = [m[1], m[2], m[3]]; }
    const r = solvePair(e1, e2);
    return r ? r[ask === 'x' ? 0 : 1] : null;
  },
  backSub(q) {
    const [e1, e2] = twoEqs(q.prompt, /^Solving (.+?) and (.+?), Kai found/);
    return solvePair(e1, e2);
  },
  fullSub(q) {
    const [e1, e2] = twoEqs(q.prompt, /^Solve (.+?) and (.+?) by substitution/);
    return solvePair(e1, e2);
  },
  isolate(q) {
    const m = norm(q.prompt).match(/^Solve (.+?) for ([xy])\.$/);
    const L = line(parseEq(m[1])), v = m[2];
    return choiceWhere(q, c => { const E = tryEq(c); return !!E && E.lhs === v && !new RegExp(v).test(E.rhs) && sameLine(line(E), L); });
  },
  isoSubSolve(q) {
    const [e1, e2] = twoEqs(q.prompt, /alone in (.+?) and (.+?)\. Isolate/);
    return solvePair(e1, e2);
  },
  whereSub(q) {
    const p = norm(q.prompt);
    let m = p.match(/^In (.+?) and (.+?) no letter is alone yet\./);
    if (m) {
      const E = [parseEq(m[1]), parseEq(m[2])];
      return choiceWhere(q, c0 => {
        const c = norm(c0); let k;
        if ((k = c.match(/^Yes: first isolate ([xy]) in (.+), then substitute$/))) { const C = parseEq(k[2]); return E.some(e => sameLine(line(e), line(C))) && !co(C, k[1]).eq(0); }
        if (/^No:/.test(c)) return false;
        throw new Error(`whereSub choice? ${c0}`);
      });
    }
    m = p.match(/solves (.+?) and (.+?)\. From the (first|second) equation: (.+?)\. Where/);
    const E1 = line(parseEq(m[1])), E2 = line(parseEq(m[2]));
    const from = m[3] === 'first' ? E1 : E2, other = m[3] === 'first' ? E2 : E1;
    if (!sameLine(line(parseEq(m[4])), from)) return -1;
    return choiceWhere(q, c0 => {
      const c = norm(c0); let k;
      if ((k = c.match(/^Into the other equation, (.+)$/))) return sameLine(line(parseEq(k[1])), other);
      if (/^Back into|^Into either one/.test(c)) return false;
      throw new Error(`whereSub choice? ${c0}`);
    });
  },
  replaceSum(q) {
    const p = norm(q.prompt);
    const [e1, e2] = twoEqs(p, /first equation of (.+?) and (.+?) by the SUM/);
    const [n1, n2] = twoEqs(p, /new system is (.+?) and (.+?)\. What/);
    const O = sysOfTexts(e1, e2), N = sysOfTexts(n1, n2);
    const same = sameSet(O.S, N.S, O.A, N.A);
    return choiceWhere(q, c0 => {
      const c = norm(c0); let k;
      if ((k = c.match(/^The same solution, (\(.+?\)): the new system has exactly the same solutions$/))) return same && O.S.kind === 'one' && samePt(pts(k[1])[0], O.S.p);
      if (/^A different solution: changing an equation changes the solutions$/.test(c)) return !same;
      if (/^Only .+ matters now: the system is just/.test(c)) return false;
      if (/^No solution: one equation has lost its/.test(c)) return N.S.kind === 'none';
      throw new Error(`replaceSum choice? ${c0}`);
    });
  },
  recover(q) {
    const [n1, n2] = twoEqs(q.prompt, /new system is (.+?) and (.+?)\. What/);
    const A = line(parseEq(n1)), B = line(parseEq(n2));
    const E1 = [A[0].sub(B[0]), A[1].sub(B[1]), A[2].sub(B[2])];
    return choiceWhere(q, c => sameLine(line(tryEq(c)), E1));
  },
  elimAdd(q) {
    const [e1, e2] = twoEqs(q.prompt, /^Solve (.+?) and (.+?) by elimination/);
    return solvePair(e1, e2);
  },
  elimSub(q) {
    const [e1, e2] = twoEqs(q.prompt, /^In (.+?) and (.+?) the [xy]-terms are equal/);
    const A = line(parseEq(e1)), B = line(parseEq(e2));
    const D = A.map((u, i) => u.sub(B[i]));
    return choiceWhere(q, c => exactSame(line(tryEq(c)), D));
  },
  scaleRow(q) {
    const p = norm(q.prompt);
    const [e1, e2] = twoEqs(p, /from (.+?) and (.+?), multiply/);
    const m = p.match(/multiply the (first|second) equation by (-?\d+)/);
    const L = line(parseEq(m[1] === 'first' ? e1 : e2)).map(u => u.mul(Number(m[2])));
    return choiceWhere(q, c => exactSame(line(tryEq(c)), L));
  },
  scaleSolve(q) {
    const [e1, e2] = twoEqs(q.prompt, /^Solve (.+?) and (.+?) by elimination/);
    return solvePair(e1, e2);
  },
  bothMult(q) {
    const p = norm(q.prompt);
    const v = p.match(/make the ([xy])-terms/)[1];
    const [e1, e2] = twoEqs(p, /terms of (.+?) and (.+?) OPPOSITE/);
    const b1 = co(parseEq(e1), v), b2 = co(parseEq(e2), v);
    return choiceWhere(q, c => { const m = norm(c).match(/^First × (-?\d+), second × (-?\d+)$/); return !!m && b1.mul(Number(m[1])).add(b2.mul(Number(m[2]))).eq(0); });
  },
  anyMultiple(q) {
    const p = norm(q.prompt);
    const v = p.match(/To cancel ([xy]) in/)[1];
    const [e1, e2] = twoEqs(p, /To cancel [xy] in (.+?) and (.+?), /);
    const b1 = co(parseEq(e1), v), b2 = co(parseEq(e2), v);
    let m = p.match(/multiplies the first equation by (-?\d+) and the second by (-?\d+)\./);
    if (!m) m = p.match(/\w+ multiplies by (-?\d+) and (-?\d+) instead\./);
    const P = Number(m[1]), R = Number(m[2]);
    const X = b1.mul(P), Y = b2.mul(R);
    const works = X.add(Y).eq(0) || X.eq(Y);
    const g = (a, b) => (b ? g(b, a % b) : a);
    const lcm = Math.abs(b1.value * b2.value) / g(Math.abs(b1.value), Math.abs(b2.value));
    const swapWorks = b1.mul(R).add(b2.mul(P)).eq(0) || b1.mul(R).eq(b2.mul(P));
    const term = t => { const k = norm(t).match(new RegExp(`^(-?\\d*)${v}$`)); return k ? Q(k[1] === '' ? 1 : k[1] === '-' ? -1 : Number(k[1])) : null; };
    return choiceWhere(q, c0 => {
      const c = norm(c0); let k;
      if ((k = c.match(/^No: (\S+) and (\S+) do not cancel; the multipliers are the wrong way round$/))) { const s = term(k[1]), t = term(k[2]); return !works && swapWorks && !!s && !!t && s.eq(X) && t.eq(Y); }
      if (/^Yes: any two multipliers work/.test(c)) return false;
      if (/^Yes: it is the least common multiple$/.test(c)) return works && Math.abs(X.value) === lcm;
      if ((k = c.match(/^Yes: (\S+) and (\S+) cancel too; the numbers are just bigger$/))) { const s = term(k[1]), t = term(k[2]); return works && !!s && !!t && s.eq(X) && t.eq(Y) && Math.abs(X.value) > lcm; }
      if (/^No: only the least common multiple works$|^No: both equations must be multiplied by the same number$/.test(c)) return false;
      throw new Error(`anyMultiple choice? ${c0}`);
    });
  },
  clearFrac(q) {
    const p = norm(q.prompt);
    const m = p.match(/^Clear the (?:fractions|decimals) in (.+?): multiply the whole equation by (\d+)\./);
    const L = line(parseEq(m[1])).map(u => u.mul(Number(m[2])));
    return choiceWhere(q, c => /\(decimals rounded/.test(c) ? false : exactSame(line(tryEq(c)), L));
  },
  ratSolve(q) {
    const [e1, e2] = twoEqs(q.prompt, /^Solve (.+?) and (.+?)\. Clear/);
    return solvePair(e1, e2);
  },
  chooseMethod(q) {
    const [e1, e2] = twoEqs(q.prompt, /exact answer for (.+?) and (.+?)\. Which/);
    const E1 = parseEq(e1), E2 = parseEq(e2), A = line(E1), B = line(E2);
    const has = re => (q.choices ?? []).some(c => re.test(c));
    let pick;
    const det = A[0].mul(B[1]).sub(A[1].mul(B[0]));
    if (det.eq(0) && has(/^Inspection/)) pick = /^Inspection/;
    else if ([E1, E2].some(E => /^[xy]$/.test(E.lhs) && !new RegExp(E.lhs).test(E.rhs))) pick = /^Substitution/;
    else if ([0, 1].some(i => !A[i].eq(0) && (A[i].eq(B[i]) || A[i].eq(B[i].neg())))) pick = /^Elimination as they are/;
    else if ([0, 1].some(i => !A[i].eq(0) && !B[i].eq(0) && (B[i].div(A[i]).d === 1 || A[i].div(B[i]).d === 1))) pick = /^Elimination after multiplying one/;
    else return -1;
    return choiceWhere(q, c => pick.test(c));
  },
  methodsAgree(q) {
    const p = norm(q.prompt);
    const [e1, e2] = twoEqs(p, /solves (.+?) and (.+?) by substitution/);
    const { S } = sysOfTexts(e1, e2);
    return choiceWhere(q, c0 => {
      const c = norm(c0);
      if (/^\(.+\)$/.test(c)) return S.kind === 'one' && samePt(pts(c)[0], S.p);
      if (/in either order$|^A different pair|only: elimination finds one letter$/.test(c)) return false;
      throw new Error(`methodsAgree choice? ${c0}`);
    });
  },
  classifyGraph(q) {
    const [e1, e2] = twoEqs(q.prompt, /graphs of (.+?) and (.+?) are drawn/);
    return kindChoice(q, kindOf(sysOfTexts(e1, e2).S));
  },
  cannotTell(q) {
    return choiceWhere(q, c => /^Cannot tell from the picture alone/.test(c));
  },
  termsCI(q) {
    const [e1, e2] = twoEqs(q.prompt, /system (.+?) and (.+?) \(graphed\)/);
    return kindChoice(q, kindOf(sysOfTexts(e1, e2).S));
  },
  predictSlopes(q) {
    const [e1, e2] = twoEqs(q.prompt, /solutions does (.+?) and (.+?) have/);
    return kindChoice(q, kindOf(sysOfTexts(e1, e2).S));
  },
  inspect(q) {
    const [e1, e2] = twoEqs(q.prompt, /solutions does (.+?) and (.+?) have/);
    return kindChoice(q, kindOf(sysOfTexts(e1, e2).S));
  },
  contraMeaning(q) {
    const [e1, e2] = twoEqs(q.prompt, /^Solving (.+?) and (.+?): multiply/);
    const k = kindOf(sysOfTexts(e1, e2).S);
    return choiceWhere(q, c => (k === 'none' ? /^No solution: no pair/ : k === 'inf' ? /^Infinitely many/ : /^\u0000/).test(c));
  },
  contraSub(q) {
    const p = norm(q.prompt);
    const [e1, e2] = twoEqs(p, /^Substitute (.+?) into (.+?)\. The/);
    const { S } = sysOfTexts(e1, e2);
    return choiceWhere(q, c0 => {
      const c = norm(c0); let k;
      if (/^No solution$/.test(c)) return S.kind === 'none';
      if (/^Infinitely many/.test(c)) return S.kind === 'inf';
      if ((k = c.match(/^One solution, with x = (\S+)$/))) return S.kind === 'one' && S.p[0].eq(qs(k[1]));
      throw new Error(`contraSub choice? ${c0}`);
    });
  },
  identityMeaning(q) {
    const [e1, e2] = twoEqs(q.prompt, /^Solving (.+?) and (.+?): multiply/);
    const { A, S } = sysOfTexts(e1, e2);
    return choiceWhere(q, c0 => {
      const c = norm(c0); let k;
      if ((k = c.match(/^Every \(x, y\) on the line (.+)$/))) return S.kind === 'inf' && sameLine(line(parseEq(k[1])), A);
      if (/^Every point \(x, y\) of the plane$/.test(c)) return false;
      if ((k = c.match(/^Only (\(.+\))$/))) return S.kind === 'one' && samePt(pts(k[1])[0], S.p);
      if (/^The lines cross at many separate points$/.test(c)) return false;
      throw new Error(`identityMeaning choice? ${c0}`);
    });
  },
  identityMember(q) {
    const [e1, e2] = twoEqs(q.prompt, /^The system (.+?) and (.+?) has infinitely/);
    const { A, B } = sysOfTexts(e1, e2);
    return choiceWhere(q, c => { const P = pts(c)[0]; return !!P && onLine(A, P) && onLine(B, P); });
  },
  scaledConst(q) {
    const p = norm(q.prompt);
    let m = p.match(/^In (.+?) and (.+?), the second equation's/);
    if (!m) m = p.match(/^The left side of (.+?) is \d+ times the left side of (.+?)\. Compare/);
    return choiceWhere(q, c => {
      if (/^Many separate crossing points$/.test(c)) return false;
      const k = kindOf(sysOfTexts(m[1], m[2]).S);
      return ({ one: /^(One crossing point|Two lines crossing once)$/, none: /^Parallel lines: no solution$/, inf: /^The same line: infinitely many solutions$/ }[k]).test(c);
    });
  },
  sameLineForms(q) {
    const L = line(parseEq(norm(q.prompt).match(/SAME line as (.+?)\?$/)[1]));
    return choiceWhere(q, c => (/^None:/.test(c) ? false : sameLine(line(tryEq(c)), L)));
  },
  proofDir(q) {
    return choiceWhere(q, c => /^Both: every old solution solves the new system, AND every new solution solves the old one$/.test(c));
  },
  proofReverse(q) {
    return choiceWhere(q, c => /^Subtract k times E₁ from E₂ \+ kE₁: what is left is E₂, and equals minus equals are equal$/.test(c));
  },
  writeVerbal(q) {
    const M = storyModel(norm(q.prompt));
    return choiceWhere(q, c => { const S = writtenSystem(c, M.X, M.Y); return !!S && sameLineSet(S, M.eqs); });
  },
  fromGraph(q) {
    const P = pts(q.prompt);
    const through = (a, b) => [b[1].sub(a[1]), a[0].sub(b[0]), b[1].sub(a[1]).mul(a[0]).add(a[0].sub(b[0]).mul(a[1]))];
    const want = [through(P[0], P[1]), through(P[2], P[3])];
    return choiceWhere(q, c => { const S = writtenSystem(c, 'x', 'y'); return !!S && sameLineSet(S, want); });
  },
  fromTable(q) {
    const p = norm(q.prompt);
    const vals = t => t.split(',').map(s => qs(s.replace('$', '')));
    const A = vals(p.match(/Plan A: (.+?)\. Plan B/)[1]), B = vals(p.match(/Plan B: (.+?)\. Which/)[1]);
    const lin = V => { const r = V[1].sub(V[0]); if (!V.every((v, i) => i === 0 || v.sub(V[i - 1]).eq(r))) return null; return [r.neg(), Q(1), V[0].sub(r)]; };
    const LA = lin(A), LB = lin(B);
    if (!LA || !LB) return -1;
    return choiceWhere(q, c => { const S = writtenSystem(c, 'm', 'C'); return !!S && sameLineSet(S, [LA, LB]); });
  },
  writeSolve(q) {
    const M = storyModel(norm(q.prompt));
    const S = solveSys(M.eqs[0], M.eqs[1]);
    return S.kind === 'one' ? val(S.p) : null;
  },
  viable(q) {
    const p = norm(q.prompt);
    const [e1, e2] = twoEqs(p, /Solving (.+?) and (.+?) gives/);
    const { S } = sysOfTexts(e1, e2, 'a', 's');
    const ok = S.kind === 'one' && S.p.every(v => v.d === 1 && v.cmp(0) >= 0);
    return choiceWhere(q, c => (ok ? /^Viable: two whole, non-negative/ : /^Not viable:/).test(c));
  },
  planMeaning(q) {
    const p = norm(q.prompt);
    const A = planCost(p.match(/Plan A: (.+?)\. Plan B/)[1]), B = planCost(p.match(/Plan B: (.+?)\. When/)[1]);
    let kind, m, cost;
    if (A.r.eq(B.r)) kind = A.j.eq(B.j) ? 'inf' : 'none';
    else { kind = 'one'; m = B.j.sub(A.j).div(A.r.sub(B.r)); cost = A.r.mul(m).add(A.j); }
    return choiceWhere(q, c0 => {
      const c = norm(c0); let k;
      if (/^Never: the system has no solution$/.test(c)) return kind === 'none';
      if (/^Every month: the two descriptions are the same plan/.test(c)) return kind === 'inf';
      if (/^After exactly one number of months$/.test(c)) return kind === 'one' && m.cmp(0) >= 0;
      if ((k = c.match(/^After exactly (\S+) months \(both \$(\S+)\)$/))) return kind === 'one' && m.eq(qs(k[1])) && cost.eq(qs(k[2]));
      throw new Error(`planMeaning choice? ${c0}`);
    });
  },
};

// ---------------------------------------------------------------- sane: what a 14-18 year old would call unfair
function sane(q) {
  const p = norm(q.prompt), f = q.family;
  try {
    // drawn system lines must be the lines of the equations the prompt names
    const S = shown(q).filter(it => it.kind === 'line' && (it.key === 'L1' || it.key === 'L2'));
    const sysRe = {
      pairCheck: SYS_RE, whichPair: SYS_RE, readCross: SYS_RE, markedPoint: SYS_RE, classifyGraph: /graphs of (.+?) and (.+?) are drawn/,
      termsCI: /system (.+?) and (.+?) \(graphed\)/, estimateExact: /graphs of (.+?) and (.+?) cross/, roundedFails: /graphs (.+?) and (.+?) and reads/,
      techExact: /intersection of (.+?) and (.+?) and shows/, techWindow: /graphing tool shows (.+?) and (.+?) but no/, hvCross: /lines (.+?) and (.+?) cross/,
      replaceSum: /first equation of (.+?) and (.+?) by the SUM/, recover: /new system is (.+?) and (.+?)\. What/,
    }[f];
    if (sysRe && S.length) {
      const [e1, e2] = twoEqs(p, sysRe);
      const want = { L1: line(parseEq(e1)), L2: line(parseEq(e2)) };
      for (const it of S) if (!sameLine(drawnLine(it), want[it.key])) return `the drawn ${it.key} is not the line of its equation`;
    }
    if (['ctxMeaning', 'ctxRead'].includes(f)) {
      const C = ctxSystem(p);
      for (const it of S) if (!sameLine(drawnLine(it), it.key === 'L1' ? C.A : C.B)) return `the drawn ${it.key} is not the line of its equation`;
      const X = solveSys(C.A, C.B);
      if (X.kind !== 'one') return 'the two conditions never meet once';
      const [u, v] = X.p;
      if (u.cmp(0) < 0 || v.cmp(0) < 0) return 'a negative time, count or cost at the crossing';
      if (C.kind === 'tickets' && (u.d !== 1 || v.d !== 1)) return 'a fractional number of tickets';
      if (C.kind === 'plan') {
        for (const [tag, E] of [['A', C.A], ['B', C.B]]) {
          const w = planCost(p.match(new RegExp(`Plan ${tag}: (.+?), C =`))[1]);
          if (!sameLine(E, [w.r.neg(), Q(1), w.j])) return `Plan ${tag}'s words and equation disagree`;
        }
      }
      if (C.kind === 'bus') {
        const m = p.match(/bus leaves town at (\d+) mi\/h\. (Two hours|An hour) later a car follows on the same road at (\d+) mi\/h/);
        const h = m[2] === 'An hour' ? 1 : 2;
        if (!sameLine(C.A, [Q(-Number(m[3])), Q(1), Q(0)])) return 'the car equation does not match its speed';
        if (!sameLine(C.B, [Q(-Number(m[1])), Q(1), Q(Number(m[1]) * h)])) return 'the bus equation does not match the story';
      }
      if (C.kind === 'tickets') {
        const m = p.match(/sold (\d+) tickets for \$(\d+) in all: adult tickets at \$(\d+), student tickets at \$(\d+)/);
        if (!sameLineSet([C.A, C.B], [[Q(1), Q(1), Q(Number(m[1]))], [Q(Number(m[3])), Q(Number(m[4])), Q(Number(m[2]))]])) return 'the ticket equations do not match the story';
      }
      if (f === 'ctxMeaning') {
        const P = pts(p.split('cross at')[1])[0];
        if (!samePt(P, X.p)) return 'the graphs do not cross at the stated point';
      }
    }
    if (['readCross', 'hvCross'].includes(f)) {
      const [e1, e2] = twoEqs(p, sysRe);
      const X = sysOfTexts(e1, e2).S;
      if (X.kind !== 'one') return 'the lines do not cross once';
      if (X.p.some(v => v.d !== 1)) return 'the crossing is not on grid points, so it cannot be read from the graph';
      const g = pic(q).g;
      if (g && (X.p[0].value < g.x.min || X.p[0].value > g.x.max || X.p[1].value < g.y.min || X.p[1].value > g.y.max)) return 'the crossing is off the drawn grid';
    }
    if (f === 'estimateExact') {
      const [e1, e2] = twoEqs(p, sysRe);
      const X = sysOfTexts(e1, e2).S;
      if (X.kind === 'one' && X.p.every(v => v.d === 1)) return 'the crossing is on a grid point, not between grid points';
    }
    if (f === 'techWindow') {
      const [e1, e2] = twoEqs(p, sysRe);
      const X = sysOfTexts(e1, e2).S;
      if (X.kind === 'one' && X.p.every(v => Math.abs(v.value) <= 10)) return 'the crossing is inside the standard window';
    }
    if (f === 'techExact' && !/Is that value exact/.test(p)) {
      const [e1, e2] = twoEqs(p, sysRe);
      const X = sysOfTexts(e1, e2).S;
      const T = pts(p.split('shows')[1])[0];
      if (X.kind === 'one' && !X.p.every((v, i) => Math.abs(v.value - T[i].value) < 0.0006)) return 'the tool value is not the rounded crossing';
    }
    if (['pairCheck', 'markedPoint', 'whichPair', 'fromGraph', 'siMatch', 'hvWhich', 'hvSlope', 'roundedFails', 'techExact', 'fromTable'].includes(f)) {
      // drawn points must match the prompt / choice coordinates (the names the student reads)
      for (const it of shown(q)) if (it.kind === 'point' && it.name && /\(/.test(it.name)) {
        const P = pts(it.name)[0];
        if (!samePt(P, [Q(it.x), Q(it.y)])) return `point ${it.key} is drawn away from its label`;
      }
    }
    if (f === 'markedPoint') {
      for (const it of shown(q)) if (it.kind === 'point' && /^[A-D]$/.test(it.name ?? '')) {
        const c = (q.choices ?? []).find(t => t.startsWith(it.name + ' '));
        if (c && !samePt(pts(c)[0], [Q(it.x), Q(it.y)])) return `marked point ${it.name} is not where its choice says`;
      }
    }
    if (f === 'fromGraph') {
      const P = pts(p);
      const L = shown(q).filter(it => it.kind === 'line');
      const a = L.find(it => it.key === 'L1'), b = L.find(it => it.key === 'L2');
      if (a && !(onLine(drawnLine(a), P[0]) && onLine(drawnLine(a), P[1]))) return 'the amber line misses its stated points';
      if (b && !(onLine(drawnLine(b), P[2]) && onLine(drawnLine(b), P[3]))) return 'the teal line misses its stated points';
    }
    if (f === 'siMatch' || (f === 'hvWhich' && /marked points/.test(p))) {
      const [A, B] = pts(p);
      if (samePt(A, B)) return 'the two marked points are the same';
      const L = shown(q).find(it => it.kind === 'line');
      if (L && !(onLine(drawnLine(L), A) && onLine(drawnLine(L), B))) return 'the drawn line misses the marked points';
    }
    if (f === 'cannotTell') {
      const P = pts(p);
      const L = shown(q).filter(it => it.kind === 'line').map(drawnLine);
      if (L.length === 2) {
        const yi = l => (l[1].eq(0) ? null : l[2].div(l[1]));
        const got = L.map(yi);
        if (!(got.some(v => v && v.eq(P[0][1])) && got.some(v => v && v.eq(P[1][1])))) return 'the drawn lines do not meet the y-axis where the prompt says';
      }
    }
    if (f === 'stdIntercepts') {
      const L = line(parseEq(p.match(/To graph (.+?) quickly/)[1]));
      if (L[0].eq(0) || L[1].eq(0)) return 'the line misses an axis';
      if (L[2].eq(0)) return 'both intercepts are the origin';
    }
    if (f === 'roundedFails') {
      const [e1, e2] = twoEqs(p, sysRe);
      if (sysOfTexts(e1, e2).S.kind !== 'one') return 'the lines do not cross once';
    }
    if (f === 'backSub') {
      const [e1, e2] = twoEqs(p, /^Solving (.+?) and (.+?), Kai found/);
      const X = sysOfTexts(e1, e2).S;
      const m = p.match(/Kai found ([xy]) = (\S+?)\. Put it into (.+?) to find/);
      if (X.kind !== 'one') return 'the system has no single solution';
      if (!X.p[m[1] === 'x' ? 0 : 1].eq(qs(m[2]))) return "Kai's value is wrong";
      const E = line(parseEq(m[3]));
      if (![e1, e2].some(e => sameLine(line(parseEq(e)), E))) return 'the equation to use is not in the system';
    }
    if (['subSolve', 'fullSub', 'isoSubSolve', 'elimAdd', 'scaleSolve', 'ratSolve', 'whichPair', 'markedPoint', 'subStep'].includes(f)) {
      const re = { subSolve: /(?:Both equations of|Solve) (.+?) and (.+?) (?:give|by)/, fullSub: /^Solve (.+?) and (.+?) by/, isoSubSolve: /alone in (.+?) and (.+?)\. Isolate/, elimAdd: /^Solve (.+?) and (.+?) by/, scaleSolve: /^Solve (.+?) and (.+?) by/, ratSolve: /^Solve (.+?) and (.+?)\. Clear/, whichPair: SYS_RE, markedPoint: SYS_RE, subStep: /^(.+?) is already solved for [xy]\. Substitute it into (.+?)\. Which/ }[f];
      const [e1, e2] = twoEqs(p, re);
      if (sysOfTexts(e1, e2).S.kind !== 'one') return 'the system has no single solution';
      if (f === 'elimAdd') {
        const v = p.match(/the ([xy])-terms are already opposite/)[1];
        if (!co(parseEq(e1), v).add(co(parseEq(e2), v)).eq(0)) return `the ${v}-terms are not opposite`;
      }
    }
    if (f === 'elimSub') {
      const [e1, e2] = twoEqs(p, /^In (.+?) and (.+?) the [xy]-terms are equal/);
      const v = p.match(/the ([xy])-terms are equal/)[1];
      if (!co(parseEq(e1), v).eq(co(parseEq(e2), v))) return `the ${v}-terms are not equal`;
    }
    if (f === 'scaleRow') {
      const [e1, e2] = twoEqs(p, /from (.+?) and (.+?), multiply/);
      const v = p.match(/To eliminate ([xy])/)[1];
      const m = p.match(/multiply the (first|second) equation by (-?\d+)/);
      const [s, o] = m[1] === 'first' ? [e1, e2] : [e2, e1];
      if (!co(parseEq(s), v).mul(Number(m[2])).add(co(parseEq(o), v)).eq(0)) return `multiplying by ${m[2]} does not make the ${v}-terms opposite`;
    }
    if (f === 'contraMeaning' || f === 'identityMeaning') {
      const [e1, e2] = twoEqs(p, /^Solving (.+?) and (.+?): multiply/);
      const k = Number(p.match(/multiply the first by (-?\d+) and add/)[1]);
      const A = line(parseEq(e1)), B = line(parseEq(e2));
      const R = A.map((u, i) => u.mul(k).add(B[i]));
      const got = p.match(/get (-?\d+) = (-?\d+)/);
      if (!R[0].eq(0) || !R[1].eq(0)) return 'the letters do not cancel';
      if (!(Number(got[1]) === 0 && R[2].eq(Number(got[2])))) return 'the stated 0 = k is not what adding gives';
    }
    if (f === 'contraSub') {
      const [e1, e2] = twoEqs(p, /^Substitute (.+?) into (.+?)\. The/);
      const iso = parseEq(e1), other = parseEq(e2);
      const v = iso.lhs, w = v === 'x' ? 'y' : 'x';
      const R = parseEq(`0 = ${iso.rhs}`);
      const r = co(R, w).neg(), s = R.c;
      const a = co(other, v), b = co(other, w);
      if (!a.mul(r).add(b).eq(0)) return `the ${w}-terms do not cancel`;
      const got = p.match(/get (-?\d+) = (-?\d+)/);
      // a·s = c (written as a·s on the left, c on the right)
      if (!(a.mul(s).eq(Number(got[1])) && other.c.eq(Number(got[2])))) return 'the stated false statement is not what substituting gives';
    }
    if (f === 'replaceSum') {
      const [e1, e2] = twoEqs(p, /first equation of (.+?) and (.+?) by the SUM/);
      const [n1, n2] = twoEqs(p, /new system is (.+?) and (.+?)\. What/);
      const A = line(parseEq(e1)), B = line(parseEq(e2));
      if (!exactSame(line(parseEq(n1)), A.map((u, i) => u.add(B[i])))) return 'the new first equation is not the sum';
      if (!exactSame(line(parseEq(n2)), B)) return 'the second equation was not kept';
    }
    if (f === 'proofDir' && /^In /.test(p)) {
      const m = p.match(/^In (.+?) and (.+?), the first is kept and the second is replaced by second ([+-]) (\d+) × first: (.+?)\. To/);
      const A = line(parseEq(m[1])), B = line(parseEq(m[2])), k = Number(m[4]) * (m[3] === '+' ? 1 : -1);
      if (!exactSame(line(parseEq(m[5])), B.map((u, i) => u.add(A[i].mul(k))))) return 'the new equation is not second + k × first';
    }
    if (f === 'proofReverse' && /\(the second came from/.test(p)) {
      const m = p.match(/makes (.+?) and (.+?) true \(the second came from second ([+-]) (\d+) × first\)\. Why does \(p, q\) make (.+?) true/);
      const A = line(parseEq(m[1])), N = line(parseEq(m[2])), k = Number(m[4]) * (m[3] === '+' ? 1 : -1);
      if (!exactSame(line(parseEq(m[5])), N.map((u, i) => u.sub(A[i].mul(k))))) return 'the recovered second equation is wrong';
    }
    if (f === 'methodsAgree') {
      const [e1, e2] = twoEqs(p, /solves (.+?) and (.+?) by substitution/);
      const X = sysOfTexts(e1, e2).S;
      if (X.kind !== 'one' || !samePt(X.p, pts(p.split('and gets')[1])[0])) return "the substitution answer in the story is wrong";
    }
    if (f === 'identityMember' || f === 'scaledConst') {
      // nothing beyond the solve
    }
    if (f === 'writeSolve' || f === 'writeVerbal') {
      const M = storyModel(p);
      const X = solveSys(M.eqs[0], M.eqs[1]);
      if (X.kind !== 'one') return 'the story has no single answer';
      if (X.p.some(v => v.cmp(0) < 0)) return 'a negative amount';
      if (M.whole && X.p.some(v => v.d !== 1)) return 'a fractional number of tickets or coins';
      if (/A theater sold/.test(p)) { const m = p.match(/adult tickets at \$(\d+), student tickets at \$(\d+)/); if (Number(m[1]) <= 0 || Number(m[2]) <= 0 || Number(m[1]) > 300) return 'an odd ticket price'; }
    }
    if (f === 'viable') {
      const [e1, e2] = twoEqs(p, /Solving (.+?) and (.+?) gives/);
      const X = sysOfTexts(e1, e2, 'a', 's').S;
      const G = pts(p.split('gives')[1]);
      const given = G[G.length - 1];
      if (X.kind !== 'one' || !samePt(given, X.p)) return 'the stated solution is not the solution of the system';
      const m = p.match(/(\d+) tickets for \$(\d+), adult tickets \$(\d+), student tickets \$(\d+)/);
      if (!sameLineSet([line(parseEq(e1), 'a', 's'), line(parseEq(e2), 'a', 's')], [[Q(1), Q(1), Q(Number(m[1]))], [Q(Number(m[3])), Q(Number(m[4])), Q(Number(m[2]))]])) return 'the equations do not match the note';
    }
    if (f === 'planMeaning' || f === 'ctxRead' || f === 'ctxMeaning') {
      for (const m of p.matchAll(/\$(\d+) a month/g)) if (Number(m[1]) <= 0 || Number(m[1]) > 500) return 'an odd monthly price';
    }
    if (f === 'planMeaning') {
      const A = planCost(p.match(/Plan A: (.+?)\. Plan B/)[1]), B = planCost(p.match(/Plan B: (.+?)\. When/)[1]);
      if (!A.r.eq(B.r)) { const m = B.j.sub(A.j).div(A.r.sub(B.r)); if (m.cmp(0) < 0) return 'the plans would only cost the same before month 0'; }
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
