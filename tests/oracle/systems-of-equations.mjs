// Oracle for the lesson "systems-of-equations" (secondary-t5-31, 8.EE.C.8), role O of docs/lessons/QUALITY_LAYER.md.
// Every practice item is worked out from what the student sees: the system on the board (TeX), the prompt, the
// choices and the drawn picture (marked points, the plotting window). Equations are parsed into exact linear forms
// over any letters (a·x + b·y + c, fractions exact) and solved here by elimination; every choice is judged by the
// maths of its claim (substitute the pair, add / subtract / scale the equations, count the solutions, compare the
// story's numbers). The picture's `cross` / `crossLabel` (the lesson's own crossing) is never used.
import { Q } from '../../tools/quality/oracle-kit.mjs';

// ---------------------------------------------------------------- text → maths
const decode = s => String(s ?? '')
  .replace(/&#8202;|&#8201;|&thinsp;|&nbsp;|&#160;/g, ' ').replace(/&minus;/g, '−').replace(/&times;/g, '×')
  .replace(/&divide;/g, '÷').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(Number(d)))
  .replace(/&amp;/g, '&');
/** TeX → maths text, \frac{a}{b} as ((a)/(b)) */
function texMath(tex) {
  let s = String(tex ?? '');
  for (let i = 0; i < 6; i++) {
    const before = s;
    s = s.replace(/\\cssId\{[^{}]*\}\{((?:[^{}]|\{[^{}]*\})*)\}/g, '$1')
      .replace(/\\(?:text|mathrm|textbf|mathbf)\{([^{}]*)\}/g, '$1')
      .replace(/\\[td]?frac\{([^{}]*)\}\{([^{}]*)\}/g, '(($1)/($2))');
    if (s === before) break;
  }
  return s.replace(/\\times/g, '×').replace(/\\div/g, '÷').replace(/\\cdot/g, '·').replace(/\\left|\\right/g, '').replace(/\\\$/g, '$')
    .replace(/\\[,;:! ]|\\quad|~/g, ' ').replace(/[{}]/g, '').replace(/\s+/g, ' ').trim();
}
/** the board's parts (separated by \qquad), each as maths text */
const boardParts = q => String(q.board ?? '').split(/\\qquad/).map(texMath).map(s => s.trim()).filter(Boolean);
const clean = s => decode(s).replace(/[−–]/g, '-').replace(/×|·/g, '*').replace(/÷/g, '/').replace(/\$/g, '').replace(/(\d),(\d{3})(?!\d)/g, '$1$2').trim();

function decQ(s) {
  const m = String(s).match(/^(-?)(\d*)(?:\.(\d+))?$/);
  if (!m || (m[2] === '' && !m[3])) throw new Error(`not a number: ${s}`);
  const d = m[3] ? 10 ** m[3].length : 1, n = Number((m[2] || '0') + (m[3] || ''));
  return Q(m[1] ? -n : n, d);
}
/** a number as text: '−3/2', '2.5', '−4' → Q */
function numQ(t) {
  const s = clean(t).replace(/\s+/g, '');
  const m = s.match(/^(-?)(\d+)\/(\d+)$/);
  return m ? Q(Number(m[2]), Number(m[3])).mul(m[1] ? -1 : 1) : decQ(s);
}

// ---- linear forms over letters: { k: {letter: Q}, c: Q } ----
const ZERO = Q(0);
const lconst = c => ({ k: {}, c: Q(0).add(c) });
const lvar = v => ({ k: { [v]: Q(1) }, c: Q(0) });
function ladd(u, w, s = 1) {
  const k = { ...u.k };
  for (const [v, a] of Object.entries(w.k)) k[v] = (k[v] ?? ZERO).add(a.mul(s));
  for (const v of Object.keys(k)) if (k[v].n === 0) delete k[v];
  return { k, c: u.c.add(w.c.mul(s)) };
}
const lscale = (u, s) => { const k = {}; for (const [v, a] of Object.entries(u.k)) if (a.mul(s).n !== 0) k[v] = a.mul(s); return { k, c: u.c.mul(s) }; };
const isConst = u => Object.keys(u.k).length === 0;
const lsame = (u, w) => { const d = ladd(u, w, -1); return isConst(d) && d.c.n === 0; };
const coef = (u, v) => u.k[v] ?? ZERO;
function lval(u, env) { let s = u.c; for (const [v, a] of Object.entries(u.k)) { if (!(v in env)) throw new Error(`no value for ${v}`); s = s.add(a.mul(env[v])); } return s; }
function lsubst(u, v, e) { const a = coef(u, v); if (a.n === 0) return u; const k = { ...u.k }; delete k[v]; return ladd({ k, c: u.c }, lscale(e, a)); }

/** parse an expression (text, already cleaned or not) into a linear form */
function parseExpr(text) {
  const s = clean(text);
  const toks = [];
  const re = /\s*(\d+\.?\d*|\.\d+|[A-Za-z]|[-+*/()])/y;
  let i = 0;
  while (i < s.length) {
    if (/\s/.test(s[i])) { i++; continue; }
    re.lastIndex = i; const m = re.exec(s);
    if (!m) throw new Error(`bad char in "${s}"`);
    toks.push(m[1]); i = re.lastIndex;
  }
  let p = 0;
  const peek = () => toks[p], next = () => toks[p++];
  const mul = (u, w) => { if (isConst(u)) return lscale(w, u.c); if (isConst(w)) return lscale(u, w.c); throw new Error('not linear'); };
  const div = (u, w) => { if (!isConst(w) || w.c.n === 0) throw new Error('bad divisor'); return lscale(u, Q(1).div(w.c)); };
  function expr() {
    let v = term();
    while (peek() === '+' || peek() === '-') { const op = next(); const w = term(); v = ladd(v, w, op === '+' ? 1 : -1); }
    return v;
  }
  function term() {
    let v = factor();
    for (;;) {
      const t = peek();
      if (t === '*') { next(); v = mul(v, factor()); } else if (t === '/') { next(); v = div(v, factor()); } else if (t !== undefined && (t === '(' || /^[\d.A-Za-z]/.test(t))) v = mul(v, factor());
      else break;
    }
    return v;
  }
  function factor() {
    const t = peek();
    if (t === '-') { next(); return lscale(factor(), -1); }
    if (t === '+') { next(); return factor(); }
    return primary();
  }
  function primary() {
    const t = next();
    if (t === '(') { const v = expr(); if (next() !== ')') throw new Error('missing )'); return v; }
    if (t === undefined) throw new Error('unexpected end');
    if (/^[A-Za-z]$/.test(t)) return lvar(t);
    if (/^[\d.]/.test(t)) return lconst(decQ(t));
    throw new Error(`unexpected ${t}`);
  }
  const v = expr();
  if (p !== toks.length) throw new Error(`trailing tokens in "${s}"`);
  return v;
}
/** "lhs = rhs [= more]" → { L, R, sides: [...] , f: L − R } */
function parseEq(text) {
  const parts = clean(text).split('=');
  if (parts.length < 2) throw new Error(`not an equation: ${text}`);
  const sides = parts.map(parseExpr);
  return { sides, L: sides[0], R: sides[sides.length - 1], f: ladd(sides[0], sides[sides.length - 1], -1), text };
}
const letters = (...fs) => [...new Set(fs.flatMap(f => Object.keys(f.k)))].sort();
/** two linear forms describe the same equation (one is a non-zero multiple of the other) */
function proportional(u, w) {
  const vs = letters(u, w);
  let r = null;
  for (const t of [...vs.map(v => [coef(u, v), coef(w, v)]), [u.c, w.c]]) {
    const [a, b] = t;
    if (a.n === 0 && b.n === 0) continue;
    if (a.n === 0 || b.n === 0) return false;
    const k = a.div(b);
    if (r && !r.eq(k)) return false;
    r = k;
  }
  return r !== null;
}

/** solve a system of two linear equations (f = 0) in the letters [u, v]: { kind: 'one'|'none'|'inf', sol } */
function solve2(f1, f2, vs) {
  const [u, v] = vs;
  const a1 = coef(f1, u), b1 = coef(f1, v), c1 = f1.c.neg(), a2 = coef(f2, u), b2 = coef(f2, v), c2 = f2.c.neg();
  const D = a1.mul(b2).sub(a2.mul(b1));
  if (D.n !== 0) return { kind: 'one', sol: { [u]: c1.mul(b2).sub(c2.mul(b1)).div(D), [v]: a1.mul(c2).sub(a2.mul(c1)).div(D) } };
  // parallel or same: same line when (a1, b1, c1) ∝ (a2, b2, c2)
  return { kind: proportional(f1, f2) ? 'inf' : 'none' };
}
/** the system on the board: the first two parts that are equations with letters */
function systemOf(q) {
  const eqs = [];
  for (const p of boardParts(q)) {
    const t = p.replace(/^line \d:\s*/, '');
    if (!/=/.test(t) || !/[A-Za-z]/.test(t)) continue;
    try { eqs.push(parseEq(t)); } catch { /* not an equation */ }
    if (eqs.length === 2) break;
  }
  if (eqs.length < 2) return null;
  const vs = letters(eqs[0].f, eqs[1].f);
  const all = vs.length === 2 ? vs : vs.length === 1 ? (vs[0] === 'x' ? ['x', 'y'] : vs[0] === 'y' ? ['x', 'y'] : [vs[0], 'y']) : ['x', 'y'];
  return { eqs, vs: all, res: solve2(eqs[0].f, eqs[1].f, all) };
}
/** the pair's letters (x, y) / (q, d) from the input lead */
function pairVars(q, sys) {
  const m = String(q.pair?.lead ?? '').match(/\(\s*([A-Za-z])\s*,\s*([A-Za-z])\s*\)/);
  return m ? [m[1], m[2]] : sys.vs;
}
/** an exact Q as the student types it: an integer, a terminating decimal, or 'a/b' */
function typed(v) {
  if (v.d === 1) return v.n;
  let d = v.d; while (d % 2 === 0) d /= 2; while (d % 5 === 0) d /= 5;
  return d === 1 ? v.value : v.toString();
}
/** "(5, −2)" / "A (−4, 3/2)" → [Q, Q] */
function pairIn(t) {
  const m = String(t).match(/\(\s*([−\-]?[\d./]+)\s*,\s*([−\-]?[\d./]+)\s*\)/);
  return m ? [numQ(m[1]), numQ(m[2])] : null;
}
const fits = (eq, env) => lval(eq.f, env).n === 0;
/** index of the one choice passing pred, −1 when none or several */
function only(q, pred) {
  const hits = (q.choices ?? []).map((c, i) => { let ok = false; try { ok = !!pred(c, i); } catch { ok = false; } return ok ? i : -1; }).filter(i => i >= 0);
  return hits.length === 1 ? hits[0] : -1;
}
const win = q => q.data?.picture?.sys?.win ?? null;
const inWin = (q, s) => { const w = win(q); return !!w && s.x.value >= w.x0 && s.x.value <= w.x1 && s.y.value >= w.y0 && s.y.value <= w.y1; };

// ---------------------------------------------------------------- "how many solutions" claims
/** what kind of solution set a choice claims (or null when unknown) */
function claimKind(c) {
  const t = clean(c);
  if (/^None: it has two letters/i.test(t)) return { kind: 'zero-letters' };
  if (/^No solution/i.test(t) || /^No: they are parallel/i.test(t)) return { kind: 'none' };
  if (/every point \(x, y\) of the plane|^Every pair \(x, y\) works/i.test(t)) return { kind: 'plane' };
  let m;
  if ((m = t.match(/^Infinitely many: every point on (?:its line|the line (.+))$/i))) return { kind: 'inf', line: m[1] ?? null };
  if (/^Infinitely many solutions$/i.test(t) || /^Yes, everywhere: it is the same line/i.test(t)) return { kind: 'inf' };
  if (/^One solution, far off the graph/i.test(t)) return { kind: 'one', off: true };
  if (/^Exactly one( solution)?$/i.test(t) || /^Yes, at exactly one point/i.test(t)) return { kind: 'one' };
  if (/^Exactly (two|three): the marked points/i.test(t)) return { kind: 'finite' };
  if (/^x = -?\d|^0x = -?\d+, so x = -?\d+/.test(t)) return { kind: 'value' };
  return null;
}
function claimTrue(c, res, q, eqs) {
  const k = claimKind(c);
  if (!k) throw new Error(`unknown claim: ${c}`);
  if (k.kind !== res.kind) return false;
  if (k.kind === 'inf' && k.line) { const L = parseEq(k.line); return eqs.some(e => proportional(e.f, L.f)); }
  if (k.kind === 'one' && k.off) return !inWin(q, { x: res.sol[Object.keys(res.sol)[0]], y: res.sol[Object.keys(res.sol)[1]] });
  return true;
}
/** the solution as {x, y} by the system's letters */
const xy = (sys, res) => ({ x: res.sol[sys.vs[0]], y: res.sol[sys.vs[1]] });

// ---------------------------------------------------------------- per family
function solve(q) {
  const p = clean(q.prompt);
  const sys = systemOf(q);
  let m;
  switch (q.family) {
    case 'onLine': {
      const e = parseEq(boardParts(q)[0]);
      const vs = letters(e.f).length === 2 ? letters(e.f) : ['x', 'y'];
      return only(q, c => { const pr = pairIn(c); return pr && fits(e, { [vs[0]]: pr[0], [vs[1]]: pr[1], x: pr[0], y: pr[1] }); });
    }
    case 'makeSolution': case 'fillCount': {
      // board: "<equation>,  <letter> = <value>"; the question asks for the other letter
      const [eqT, givenT] = texMath(q.board).split(/,\s+(?=[A-Za-z]\s*=)/);
      const e = parseEq(eqT), g = givenT.match(/([A-Za-z])\s*=\s*(.+)$/);
      const f = lsubst(e.f, g[1], lconst(numQ(g[2])));
      const vs = letters(f);
      if (vs.length !== 1) return undefined;
      return typed(f.c.neg().div(coef(f, vs[0])));
    }
    case 'howMany': {
      // one linear equation in two letters: every point of its line solves it
      const e = parseEq(boardParts(q)[0]);
      const res = { kind: isConst(e.f) ? (e.f.c.n === 0 ? 'plane' : 'none') : 'inf' };
      return only(q, c => claimTrue(c, res, q, [e]));
    }
    case 'pickPair': case 'solOrNot':
      return only(q, c => { const pr = pairIn(c); const env = { [sys.vs[0]]: pr[0], [sys.vs[1]]: pr[1] }; return fits(sys.eqs[0], env) && fits(sys.eqs[1], env); });
    case 'pointPick': {
      const pts = q.data?.picture?.sys?.pts ?? [];
      return only(q, c => {
        const L = c.match(/Point ([A-Z])/)[1];
        const pt = pts.find(x => x.label === L);
        const env = { [sys.vs[0]]: Q(pt.p[0]), [sys.vs[1]]: Q(pt.p[1]) };
        return fits(sys.eqs[0], env) && fits(sys.eqs[1], env);
      });
    }
    case 'checkWork': return checkWork(q, sys);
    case 'readCross': case 'subSolve': case 'elimSolve': case 'ratSolve': case 'graphRead': {
      if (sys.res.kind !== 'one') return undefined;   // not one crossing: nothing to type (sane() names it)
      const [u, v] = pairVars(q, sys);
      return [typed(sys.res.sol[u]), typed(sys.res.sol[v])];
    }
    case 'twoPoints': {
      const lines = boardParts(q).map(part => [...part.matchAll(/\(\s*(-?[\d.]+)\s*,\s*(-?[\d.]+)\s*\)/g)].map(x => [numQ(x[1]), numQ(x[2])]));
      const f = lines.map(lineThrough);
      const res = solve2(f[0], f[1], ['x', 'y']);
      if (res.kind !== 'one') return undefined;
      return [typed(res.sol.x), typed(res.sol.y)];
    }
    case 'meetOrNot': {
      const lines = boardParts(q).map(part => [...part.matchAll(/\(\s*(-?[\d.]+)\s*,\s*(-?[\d.]+)\s*\)/g)].map(x => [numQ(x[1]), numQ(x[2])]));
      const f = lines.map(lineThrough);
      const res = solve2(f[0], f[1], ['x', 'y']);
      return only(q, c => claimTrue(c, res, q, []));
    }
    case 'parallelGraph': case 'howManySys': case 'sameLine': case 'zeroEq':
      return only(q, c => claimTrue(c, sys.res, q, sys.eqs));
    case 'subChoice': {
      // the first equation names a letter alone; put its expression into the second
      const [e1, e2] = sys.eqs;
      const iso = isolated(e1);
      if (!iso) return undefined;
      const want = lsubst(e2.f, iso.v, iso.e);
      const L = lsubst(e2.L, iso.v, iso.e), R = lsubst(e2.R, iso.v, iso.e);
      return only(q, c => { const ce = parseEq(c); return lsame(ce.L, L) && lsame(ce.R, R); });
    }
    case 'setEqual': {
      const [e1, e2] = sys.eqs;
      const i1 = isolated(e1), i2 = isolated(e2);
      if (!i1 || !i2 || i1.v !== i2.v) return undefined;
      const want = ladd(i1.e, i2.e, -1);
      return only(q, c => { const e = parseEq(c); return (lsame(e.L, i1.e) && lsame(e.R, i2.e)) || (lsame(e.L, i2.e) && lsame(e.R, i1.e)); });
    }
    case 'reportPair': case 'methodsAgree': {
      if (sys.res.kind !== 'one') return undefined;
      const s = xy(sys, sys.res);
      return only(q, c => /^\(.*\)(:|$)/.test(clean(c)) && /^\([^)]*\)$/.test(clean(c).split(':')[0].trim()) && (pr => pr && pr[0].eq(s.x) && pr[1].eq(s.y))(pairIn(c)));
    }
    case 'isolate': {
      const e = parseEq(boardParts(q)[0]);
      const v = p.match(/ for ([A-Za-z])\.?$/)[1];
      return only(q, c => { const ce = parseEq(c); return isolated(ce)?.v === v && proportional(ce.f, e.f); });
    }
    case 'whichVar': {
      // the easiest first step: solve for a letter whose coefficient is 1 (or −1): no fractions appear
      const score = c => {
        const mm = clean(c).match(/^Solve the (first|second) equation for ([a-z])$/);
        if (!mm) return Infinity;   // "you can't substitute yet": any letter can be solved for
        const a = coef(sys.eqs[mm[1] === 'first' ? 0 : 1].f, mm[2]);
        return a.n === 0 ? Infinity : Math.abs(a.value) === 1 ? 0 : 1;
      };
      const sc = (q.choices ?? []).map(score), best = Math.min(...sc);
      return best === Infinity || sc.filter(x => x === best).length !== 1 ? -1 : sc.indexOf(best);
    }
    case 'addEq': case 'subEq': {
      const want = q.family === 'addEq' ? ladd(sys.eqs[0].f, sys.eqs[1].f) : ladd(sys.eqs[0].f, sys.eqs[1].f, -1);
      return only(q, c => lsame(parseEq(c).f, want));
    }
    case 'afterAdd': {
      // after one letter is known, put it into an original equation to find the other one
      return only(q, c => /^Put [a-z] = [-\d./]+ into one of the original equations to find [a-z]$/.test(clean(c)));
    }
    case 'scaleOne': {
      const part = texMath(q.board);
      const mm = part.match(/^(.*=.*?)\s*×\s*\(?(-?[\d.]+)\)?$/);
      const e = parseEq(mm[1]), k = numQ(mm[2]);
      const want = lscale(e.f, k);
      return only(q, c => sameSides(parseEq(c), lscale(e.L, k), lscale(e.R, k), want));
    }
    case 'clearFrac': {
      const e = parseEq(boardParts(q)[0]), k = numQ(p.match(/[Mm]ultiply by (\d+)/)[1]);
      return only(q, c => sameSides(parseEq(c), lscale(e.L, k), lscale(e.R, k), lscale(e.f, k)));
    }
    case 'pickMult': {
      if (q.input === 'num') {
        // "To eliminate y by ADDING ..., multiply the first equation by what number?"
        const mm = p.match(/eliminate ([a-z]) by (ADDING|SUBTRACTING)[\s\S]*multiply the (first|second) equation/i);
        if (!mm) return undefined;
        const v = mm[1], add = /ADD/i.test(mm[2]), which = mm[3] === 'first' ? 0 : 1;
        const a = coef(sys.eqs[which].f, v), b = coef(sys.eqs[1 - which].f, v);
        if (a.n === 0) return undefined;
        return typed(add ? b.neg().div(a) : b.div(a));
      }
      // both equations: "first × 2, second × 5" — the letter's coefficients must come out the same size
      const v = p.match(/eliminate ([a-z])/)[1];
      const a1 = coef(sys.eqs[0].f, v), a2 = coef(sys.eqs[1].f, v);
      return only(q, c => {
        const mm = clean(c).match(/first \* \(?(-?\d+)\)?, second \* \(?(-?\d+)\)?/);
        return Math.abs(a1.mul(numQ(mm[1])).value) === Math.abs(a2.mul(numQ(mm[2])).value);
      });
    }
    case 'chooseMethod': return chooseMethod(q, sys);
    case 'sketchTrap': return sketchTrap(q, sys);
    case 'estimate': {
      if (sys.res.kind !== 'one') return undefined;
      const s = xy(sys, sys.res);
      const d = (q.choices ?? []).map(c => { const pr = pairIn(c); return Math.hypot(pr[0].value - s.x.value, pr[1].value - s.y.value); });
      const best = Math.min(...d);
      return d.filter(x => Math.abs(x - best) < 1e-9).length === 1 ? d.indexOf(best) : -1;
    }
    case 'writeOne': return writeOne(q, p);
    case 'writeSystem': return writeSystem(q, p);
    case 'timesAsMany': {
      m = p.match(/There are (\d+) times as many (\w+) as (\w+)\. With ([a-z]) = the number of \2 and ([a-z]) = the number of \3/);
      const want = ladd(lvar(m[4]), lscale(lvar(m[5]), Q(Number(m[1]))), -1);
      return only(q, c => proportional(parseEq(c).f, want));
    }
    case 'verify': {
      const pr = pairIn(boardParts(q)[2] ?? p);
      const env = { [sys.vs[0]]: pr[0], [sys.vs[1]]: pr[1] };
      const f1 = fits(sys.eqs[0], env), f2 = fits(sys.eqs[1], env);
      return only(q, c => {
        const t = clean(c);
        if (/^Yes: it makes both/.test(t)) return f1 && f2;
        if (/^No: it fails both/.test(t)) return !f1 && !f2;
        if (/^No: it fails the first equation only/.test(t)) return !f1 && f2;
        if (/^No: it fails the second equation only/.test(t)) return f1 && !f2;
        throw new Error(`verify claim ${c}`);
      });
    }
    case 'findSlip': return findSlip(q, sys);
    case 'exactVsEst': {
      if (sys.res.kind !== 'one') return undefined;
      const s = xy(sys, sys.res);
      const read = pairIn(p.match(/reads the crossing as about (\([^)]*\))/)[1]);
      const same = read[0].eq(s.x) && read[1].eq(s.y);
      return only(q, c => {
        const t = clean(c);
        if (/^Both: they are the same point/.test(t)) return same;
        const pr = pairIn(t);
        if (/algebra is exact/.test(t)) return !same && pr[0].eq(s.x) && pr[1].eq(s.y);
        return false;   // "you can see it on the graph": a reading is never the proof
      });
    }
    case 'viable': return viable(q, sys, p);
    case 'planMeaning': return planMeaning(q, sys, p);
    default: return undefined;
  }
}

/** the line through two points, as a linear form in x, y */
function lineThrough([[x1, y1], [x2, y2]]) {
  // (y2 − y1)(x − x1) − (x2 − x1)(y − y1) = 0
  const dy = y2.sub(y1), dx = x2.sub(x1);
  return ladd(lscale(ladd(lvar('x'), lconst(x1), -1), dy), lscale(ladd(lvar('y'), lconst(y1), -1), dx), -1);
}
/** "y = 3x + 9" → { v: 'y', e: 3x + 9 } (a letter alone on one side, not on the other) */
function isolated(e) {
  for (const [a, b] of [[e.sides[0], e.sides[e.sides.length - 1]], [e.sides[e.sides.length - 1], e.sides[0]]]) {
    const ks = Object.keys(a.k);
    if (ks.length === 1 && a.c.n === 0 && a.k[ks[0]].eq(1) && coef(b, ks[0]).n === 0) return { v: ks[0], e: b };
  }
  return null;
}
/** a choice equation equals the expected one side by side (or as L − R, the same equation written exactly) */
function sameSides(ce, L, R, f) {
  if (lsame(ce.L, L) && lsame(ce.R, R)) return true;
  return lsame(ce.f, f) && isConst(ce.R) && isConst(R) && lsame(ce.R, R);
}

// ---- checkWork: which check of a pair is right ----
function checkWork(q, sys) {
  const pr = pairIn(clean(q.prompt).match(/whether (\([^)]*\))/)[1]);
  const env = { [sys.vs[0]]: pr[0], [sys.vs[1]]: pr[1] };
  const isSol = fits(sys.eqs[0], env) && fits(sys.eqs[1], env);
  /** "E = V" substitutes the pair into a side of equation k that has letters, and its arithmetic is right */
  const stmt = (s, k) => {
    const [E, V] = s.split('=').map(x => x.trim());
    const ev = parseExpr(E), vv = numQ(V);
    if (!isConst(ev) || !ev.c.eq(vv)) return null;
    const eq = sys.eqs[k];
    const sides = eq.sides.filter(sd => !isConst(sd)).map(sd => lval(sd, env));
    return sides.some(x => x.eq(vv)) ? { v: vv, k } : null;
  };
  return only(q, c => {
    const t = clean(c);
    let m;
    if ((m = t.match(/^A solution: (.+) and (.+)$/)) && !/it makes/.test(t)) {
      if (!isSol) return false;
      const a = stmt(m[1], 0), b = stmt(m[2], 1);
      return !!a && !!b && fits(sys.eqs[0], env) && fits(sys.eqs[1], env);
    }
    if (/^A solution: it makes .* true$/.test(t)) return false;   // one equation is not enough
    if ((m = t.match(/^Not a solution: (.+), not (.+)$/))) {
      if (isSol) return false;
      for (const k of [0, 1]) {
        const a = stmt(m[1], k);
        if (!a) continue;
        const other = sys.eqs[k].sides.map(sd => lval(sd, env));
        if (!fits(sys.eqs[k], env) && other.some(x => x.eq(numQ(m[2]))) && !a.v.eq(numQ(m[2]))) return true;
      }
      return false;
    }
    throw new Error(`checkWork claim ${c}`);
  });
}

// ---- chooseMethod ----
function chooseMethod(q, sys) {
  const [e1, e2] = sys.eqs;
  const alone = isolated(e1) || isolated(e2);
  const std = e => isConst(e.R) && !isConst(e.L);
  const vs = sys.vs;
  const opp = !alone && std(e1) && std(e2) && vs.some(v => coef(e1.L, v).n !== 0 && coef(e1.L, v).eq(coef(e2.L, v).neg()));
  const eqc = !alone && std(e1) && std(e2) && vs.some(v => coef(e1.L, v).n !== 0 && coef(e1.L, v).eq(coef(e2.L, v)));
  const best = alone ? 'sub' : opp && !eqc ? 'add' : eqc && !opp ? 'subtract' : opp && eqc ? 'both' : 'mult';
  return only(q, c => {
    const t = clean(c);
    if (/^Substitution/.test(t)) return best === 'sub';
    if (/^Elimination by adding/.test(t)) return best === 'add';
    if (/^Elimination by subtracting/.test(t)) return best === 'subtract';
    if (/^Multiply first/.test(t)) return best === 'mult';
    throw new Error(`method ${c}`);
  });
}

// ---- sketchTrap ----
function sketchTrap(q, sys) {
  const res = sys.res;
  const slopes = sys.eqs.map(e => { const b = coef(e.f, sys.vs[1]); return b.n === 0 ? null : coef(e.f, sys.vs[0]).neg().div(b); });
  const sameSlope = (slopes[0] === null && slopes[1] === null) || (slopes[0] && slopes[1] && slopes[0].eq(slopes[1]));
  const outside = res.kind === 'one' && !inWin(q, xy(sys, res));
  return only(q, c => {
    const t = clean(c);
    if (/^No: same slope, different intercepts, so the lines are parallel/.test(t)) return res.kind === 'none' && sameSlope;
    if (/^Yes: the slopes are different, so the lines cross outside the window/.test(t)) return !sameSlope && outside;
    if (/^Yes: they cross somewhere outside the window/.test(t)) return outside;
    if (/^No: they do not meet on this graph|^No: they look parallel/.test(t)) return false;   // the window / a look is no reason
    throw new Error(`sketchTrap ${c}`);
  });
}

// ---- writeOne ----
function writeOne(q, p) {
  let m, want;
  if ((m = p.match(/costs (\d+) to join plus (\d+) a month\. Which equation gives the cost ([a-z]) in dollars after ([a-z]) months/))) {
    want = ladd(lvar(m[3]), ladd(lscale(lvar(m[4]), Q(Number(m[2]))), lconst(Q(Number(m[1])))), -1);
  } else if ((m = p.match(/^(\w+) (\w+) cost (\d+(?:\.\d+)?), (\w+) \2 cost (\d+(?:\.\d+)?)\. A group spends (\d+(?:\.\d+)?)\. With ([a-z]) (\w+) and ([a-z]) (\w+) \2/))) {
    const price = { [m[1].toLowerCase()]: decQ(m[3]), [m[4].toLowerCase()]: decQ(m[5]) };
    const pa = price[m[8].toLowerCase()], pb = price[m[10].toLowerCase()];
    if (!pa || !pb) return undefined;
    want = ladd(ladd(lscale(lvar(m[7]), pa), lscale(lvar(m[9]), pb)), lconst(decQ(m[6])), -1);
  } else return undefined;
  return only(q, c => proportional(parseEq(c).f, want));
}
// ---- writeSystem ----
function writeSystem(q, p) {
  const m = p.match(/^(\d+) (\w+) were sold: (\w+) ones at (\d+(?:\.\d+)?) and (\w+) ones at (\d+(?:\.\d+)?), for (\d+(?:\.\d+)?) in all\. Let ([a-z]) = the number of (\w+) \2 and ([a-z]) = the number of (\w+) \2/);
  if (!m) return undefined;
  const price = { [m[3]]: decQ(m[4]), [m[5]]: decQ(m[6]) };
  const a = m[8], b = m[10], pa = price[m[9]], pb = price[m[11]];
  const want = [ladd(ladd(lvar(a), lvar(b)), lconst(decQ(m[1])), -1), ladd(ladd(lscale(lvar(a), pa), lscale(lvar(b), pb)), lconst(decQ(m[7])), -1)];
  return only(q, c => {
    const parts = clean(c).split(' and ').map(parseEq);
    if (parts.length !== 2) return false;
    return want.every(w => parts.some(e => proportional(e.f, w))) && parts.every(e => want.some(w => proportional(e.f, w)));
  });
}

// ---- findSlip: the first step that does not follow ----
function findSlip(q, sys) {
  const raw = q.data?.picture?.sys?.eqs ?? [];
  const steps = raw.filter(s => /\\text\{\d:\}/.test(s)).map(s => texMath(s).replace(/^\d:\s*/, ''));
  if (steps.length !== 4) return undefined;
  const [e1, e2] = sys.eqs;
  const iso = isolated(e1);
  if (!iso) return undefined;
  const other = sys.vs.find(v => v !== iso.v);
  const sub = lsubst(e2.f, iso.v, iso.e);
  const s1 = parseEq(steps[0]), s2 = parseEq(steps[1]), s3 = parseEq(steps[2]);
  let slip = 0;
  if (!proportional(s1.f, sub)) slip = 1;
  else if (!proportional(s2.f, s1.f)) slip = 2;
  else if (!proportional(s3.f, s2.f) || !isolated(s3)) slip = 3;
  else {
    const xv = s3.R.c, parts = steps[3].split('=').map(x => x.trim());
    const want = lval(iso.e, { [other]: xv });
    const mid = parseExpr(parts[1]), last = numQ(parts[parts.length - 1]);
    if (parts[0] !== iso.v || !isConst(mid) || !mid.c.eq(want) || !last.eq(want)) slip = 4;
  }
  return only(q, c => (slip === 0 ? /^No slip/.test(c) : new RegExp(`^Step ${slip}$`).test(c)));
}

// ---- viable ----
function viable(q, sys, p) {
  if (sys.res.kind !== 'one') return undefined;
  const s = xy(sys, sys.res);
  const vals = [s.x, s.y];
  const whole = vals.every(v => v.d === 1), nonneg = vals.every(v => v.value >= 0);
  const ok = whole && nonneg;
  const g = p.match(/gives (\S+) ([\w ]+?) and (\S+) ([\w ]+?)\. What/);
  return only(q, c => {
    const t = clean(c);
    let m;
    if ((m = t.match(/^Not possible: (\S+) (.+) is not a whole number$/))) { const v = numQ(m[1]); return !ok && vals.some(x => x.eq(v) && x.d !== 1); }
    if (/^Not possible: a count can.t be negative$/.test(t)) return !nonneg;
    if (/^Not possible: the numbers are too small/.test(t)) return false;
    if ((m = t.match(/^(?:It works: )?(\S+) [\w ]+? and (\S+) [\w ]+?(?: is the answer)?$/)) && (/^It works/.test(t) || / is the answer$/.test(t))) {
      return ok && numQ(m[1]).eq(s.x) && numQ(m[2]).eq(s.y);
    }
    if (/^Round|\(drop the minus\)$/.test(t)) return false;
    throw new Error(`viable ${c} ${g}`);
  });
}

// ---- planMeaning ----
/** the (months, cost) order of a plan system */
const mFirst = sys => (sys.vs.includes('m') ? ['m', sys.vs.find(v => v !== 'm')] : sys.vs);
function planMeaning(q, sys, p) {
  const plans = {};
  for (const m of p.matchAll(/Plan ([AB]): ([^.(]+?)(?:\.| \()/g)) plans[m[1]] = parseEq(m[2]);
  const res = sys.res;
  const vs = mFirst(sys);
  const r2 = solve2(sys.eqs[0].f, sys.eqs[1].f, vs);
  const rate = e => coef(isolated(e).e, vs[0]), fee = e => isolated(e).e.c;
  const [A, B] = [plans.A, plans.B];
  return only(q, c => {
    const t = clean(c);
    let m;
    if (/^They never cost the same: same monthly rate, different start fees/.test(t)) return res.kind === 'none' && rate(A).eq(rate(B)) && !fee(A).eq(fee(B));
    if (/^They cost the same at month 0/.test(t)) return fee(A).eq(fee(B));
    if (/^After a while, when the cheaper plan catches up/.test(t)) return r2.kind === 'one' && r2.sol[vs[0]].value > 0;
    if ((m = t.match(/^After (\d+) months?, both plans cost (\d+(?:\.\d+)?)$/))) return r2.kind === 'one' && r2.sol[vs[0]].eq(Number(m[1])) && r2.sol[vs[1]].eq(decQ(m[2]));
    if (/^It means \d+ months?$/.test(t)) return false;   // half the answer
    if ((m = t.match(/^Plan ([AB]) is cheaper for the first (\d+) months$/))) {
      if (r2.kind !== 'one') return false;
      const me = plans[m[1]], them = plans[m[1] === 'A' ? 'B' : 'A'];
      return r2.sol[vs[0]].eq(Number(m[2])) && fee(me).cmp(fee(them)) < 0;
    }
    throw new Error(`plan ${c}`);
  });
}

// ---------------------------------------------------------------- sane: what is impossible or unfair
function sane(q) {
  const out = [];
  const p = clean(q.prompt);
  let sys = null, m;
  try { sys = systemOf(q); } catch { /* single equations */ }
  const sol = sys?.res?.kind === 'one' ? xy(sys, sys.res) : null;
  const isCount = s => s && s.x.d === 1 && s.y.d === 1 && s.x.value >= 0 && s.y.value >= 0;
  switch (q.family) {
    case 'readCross': case 'graphRead':
      if (!sol) out.push('the lines do not cross once');
      else {
        if (!inWin(q, sol)) out.push('the crossing is outside the drawn window');
        if (sol.x.d !== 1 || sol.y.d !== 1) out.push('the crossing to read off is not a grid point');
      }
      break;
    case 'subSolve': case 'elimSolve':
      if (!sol) out.push('the system has no single solution');
      break;
    case 'ratSolve':
      if (!sol) out.push('the system has no single solution');
      else if (/coins/.test(p) && !isCount(sol)) out.push('a coin count that is not a whole number');
      break;
    case 'fillCount': case 'makeSolution': {
      const v = solve(q);
      if (q.family === 'fillCount' && !(Number.isInteger(Number(v)) && Number(v) >= 0)) out.push(`${v} items sold`);
      break;
    }
    case 'writeSystem': case 'writeOne':
      if (q.family === 'writeSystem' && sol && !isCount(sol)) out.push('the story counts are not whole numbers');
      break;
    case 'reportPair':
      if ((m = p.match(/gives ([a-z]) = (\S+?)\. What/)) && sol && !sol[m[1] === sys.vs[0] ? 'x' : 'y'].eq(numQ(m[2]))) out.push('the given letter value is not the solution');
      break;
    case 'afterAdd':
      if ((m = p.match(/gives (.+?), so ([a-z]) = (\S+?)\. What/))) {
        const sum = ladd(sys.eqs[0].f, sys.eqs[1].f), said = parseEq(m[1]);
        if (!lsame(said.f, sum)) out.push('the sum of the equations is not what the prompt says');
        if (sol && !sol[m[2] === sys.vs[0] ? 'x' : 'y'].eq(numQ(m[3]))) out.push('the letter value after adding is wrong');
      }
      break;
    case 'zeroEq': {
      const z = boardParts(q).find(x => /^0 = /.test(x));
      if (z && sys) {
        const c = numQ(z.split('=')[1]);
        if (sys.res.kind === 'one') out.push('the letters do not cancel');
        if (sys.res.kind === 'none' && c.n === 0) out.push('0 = 0 for a system with no solution');
        if (sys.res.kind === 'inf' && c.n !== 0) out.push('0 = c for one line');
      }
      break;
    }
    case 'subChoice': case 'setEqual': {
      // a wrong choice that is the same equation in another form (same solution) is a second right answer in disguise
      const r = solve(q);
      if (r >= 0) { const want = parseEq(q.choices[r]).f; q.choices.forEach((c, i) => { if (i !== r && proportional(parseEq(c).f, want)) out.push(`wrong choice "${c}" is equivalent to the right one (same solution)`); }); }
      break;
    }
    case 'methodsAgree':
      if ((m = p.match(/got (\([^)]*\))/)) && sol) { const pr = pairIn(m[1]); if (!pr[0].eq(sol.x) || !pr[1].eq(sol.y)) out.push('the pair said to check is not the solution'); }
      break;
    case 'exactVsEst':
      if ((m = p.match(/Solving gives (\([^)]*\))/)) && sol) { const pr = pairIn(m[1]); if (!pr[0].eq(sol.x) || !pr[1].eq(sol.y)) out.push('"solving gives" is not the solution'); }
      break;
    case 'estimate':
      if (sol && sol.x.d === 1 && sol.y.d === 1) out.push('the crossing is a grid point');
      break;
    case 'sketchTrap':
      if (sol && inWin(q, sol)) out.push('the lines cross inside the window');
      break;
    case 'viable': {
      if ((m = p.match(/^(\S+) (tables|vehicles|boxes) hold/))) { const n = numQ(m[1]); if (n.d !== 1) out.push(`${m[1]} ${m[2]} in all: a count that is not a whole number`); }
      if ((m = p.match(/gives (\S+) [\w ]+? and (\S+) [\w ]+?\. What/)) && sol && (!numQ(m[1]).eq(sol.x) || !numQ(m[2]).eq(sol.y))) out.push('"solving gives" is not the solution');
      break;
    }
    case 'planMeaning':
      if (/false statement/.test(p) && sys.res.kind !== 'none') out.push('"a false statement" but the plans meet');
      if ((m = p.match(/The solution is (\([^)]*\))/))) { const vs = mFirst(sys), r = solve2(sys.eqs[0].f, sys.eqs[1].f, vs), pr = pairIn(m[1]); if (r.kind !== 'one' || !pr[0].eq(r.sol[vs[0]]) || !pr[1].eq(r.sol[vs[1]])) out.push('the stated solution is wrong'); }
      break;
    default: break;
  }
  if (q.input === 'choice') {
    let s; try { s = solve(q); } catch { s = undefined; }
    if (s === -1) out.push('no single right choice');
  }
  return [...new Set(out)].join('; ');
}

export default { solve, sane };
