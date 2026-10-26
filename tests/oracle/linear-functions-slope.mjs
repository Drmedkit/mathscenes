// Oracle for the lesson "linear-functions-slope" (Algebra 1, secondary-t6-09: slope, function notation, intercepts,
// domain and range, the three forms of a line, transformations of f(x) = x, slope / intercept / zero in context).
// Written from what the student sees only (docs/lessons/QUALITY_LAYER.md, "O: the oracle"): the prompt, the board, the
// choices, the table rows and the drawn graph. A graph shows only the items whose key is in its `show` list (the rest
// appears with the worked solution after a miss); a table's `diffs` and `ring` are drawn only on the solve; a number
// line's set only when `given`; `picture.tex` is the worked solution and is never read. Equations are parsed into exact
// linear relations; every choice is judged by the maths of its claim, and a choice question returns -1 when no single
// choice is right. Students are 14-18: `sane` judges the worlds for them.
import { Q, texPlain, choiceWhere } from '../../tools/quality/oracle-kit.mjs';

// ---------------------------------------------------------------- numbers
const norm = s => String(s ?? '').replace(/[−–]/g, '-');
/** '−3' '$2.50' '16/3' '1,450' → exact Q */
function qs(s) {
  const t = norm(s).replace(/[$,\s%]/g, '');
  let m = t.match(/^(-?)(\d+)\/(\d+)$/);
  if (m) return Q(Number(m[2]), Number(m[3])).mul(m[1] ? -1 : 1);
  m = t.match(/^(-?)(\d*)(?:\.(\d+))?$/);
  if (!m || (m[2] === '' && !m[3])) throw new Error(`not a number: ${s}`);
  const d = m[3] ? 10 ** m[3].length : 1, n = Number((m[2] || '0') + (m[3] || ''));
  return Q(m[1] ? -n : n, d);
}
const tryQ = s => { try { return qs(s); } catch { return null; } };
const NUM = '[−-]?\\$?\\d+(?:\\.\\d+)?(?:\\/\\d+)?';
const N1 = `(${NUM})`;
/** "(−2, 5)" pairs of a text, as [Q, Q] */
const pts = t => [...norm(t).matchAll(/\((-?\d+(?:\.\d+)?(?:\/\d+)?),\s*(-?\d+(?:\.\d+)?(?:\/\d+)?)\)/g)].map(m => [qs(m[1]), qs(m[2])]);
const slopeOf = (p, q) => q[1].sub(p[1]).div(q[0].sub(p[0]));
const eqQ = (a, b) => a && b && a.eq(b);

// ---------------------------------------------------------------- linear expressions and equations
// A small parser: numbers, variables (a letter, maybe with a subscript), + − ( ), implicit products (3x, 2(x + 1)),
// a/b as division (so 3/4x is (3/4)·x, the lesson's way of writing it), x/5. Result: { k: {var: Q}, c: Q } or null.
function tokens(s) {
  const t = norm(s).replace(/·|×|\\cdot/g, '*').replace(/\s+/g, '');
  const out = [];
  for (let i = 0; i < t.length;) {
    const ch = t[i];
    let m;
    if ((m = t.slice(i).match(/^\d+(?:\.\d+)?/))) { out.push({ n: qs(m[0]) }); i += m[0].length; continue; }
    if ((m = t.slice(i).match(/^[A-Za-z][₀-₉_\d]*/))) { out.push({ v: m[0] }); i += m[0].length; continue; }
    if ('+-*/()'.includes(ch)) { out.push({ o: ch }); i++; continue; }
    return null;
  }
  return out;
}
const lin = (k = {}, c = Q(0)) => ({ k, c });
const linAdd = (a, b, sg = 1) => {
  const k = { ...a.k };
  for (const [v, x] of Object.entries(b.k)) k[v] = (k[v] ?? Q(0)).add(x.mul(sg));
  return lin(k, a.c.add(b.c.mul(sg)));
};
const isConst = a => Object.values(a.k).every(x => x.eq(0));
const linScale = (a, s) => { const k = {}; for (const [v, x] of Object.entries(a.k)) k[v] = x.mul(s); return lin(k, a.c.mul(s)); };
function parseLin(s) {
  const T = tokens(s);
  if (!T || !T.length) return null;
  let i = 0;
  const peek = () => T[i], eat = o => (T[i]?.o === o ? (i++, true) : false);
  function expr() {
    let a = term();
    for (;;) {
      if (eat('+')) a = linAdd(a, term());
      else if (eat('-')) a = linAdd(a, term(), -1);
      else return a;
    }
  }
  function term() {
    let a = unary();
    for (;;) {
      const p = peek();
      if (eat('*')) a = mul(a, unary());
      else if (eat('/')) { const b = unary(); if (!isConst(b) || b.c.eq(0)) throw new Error('bad division'); a = linScale(a, Q(1).div(b.c)); }
      else if (p && (p.v || p.o === '(')) a = mul(a, unary());
      else return a;
    }
  }
  function mul(a, b) {
    if (isConst(a)) return linScale(b, a.c);
    if (isConst(b)) return linScale(a, b.c);
    throw new Error('not linear');
  }
  function unary() {
    if (eat('-')) return linScale(unary(), -1);
    if (eat('+')) return unary();
    const p = T[i++];
    if (!p) throw new Error('end');
    if (p.n) return lin({}, p.n);
    if (p.v) return lin({ [p.v]: Q(1) });
    if (p.o === '(') { const a = expr(); if (!eat(')')) throw new Error('no )'); return a; }
    throw new Error('unexpected');
  }
  try {
    const a = expr();
    return i === T.length ? a : null;
  } catch { return null; }
}
/** an equation "lhs = rhs" → lhs − rhs as { k, c } (f(x) / g(x) / C(n) on the left read as y) */
function parseEq(s) {
  const t = norm(s).replace(/^\s*[A-Za-z]\(([a-z])\)\s*=/, 'y =');
  const parts = t.split('=');
  if (parts.length !== 2) return null;
  const L = parseLin(parts[0]), R = parseLin(parts[1]);
  return L && R ? linAdd(L, R, -1) : null;
}
/** a relation scaled so its first non-zero coefficient (variables sorted, then the constant) is 1 */
function normRel(r) {
  if (!r) return null;
  const keys = Object.keys(r.k).filter(v => !r.k[v].eq(0)).sort();
  if (!keys.length) return null;
  const s = r.k[keys[0]];
  const o = {};
  for (const v of keys) o[v] = r.k[v].div(s).toString();
  o[''] = r.c.div(s).toString();
  return JSON.stringify(o);
}
const sameRel = (a, b) => { const x = normRel(a), y = normRel(b); return !!x && x === y; };
/** y = m·x + b as a relation in the variables (yv, xv) */
const relMB = (m, b, yv = 'y', xv = 'x') => lin({ [yv]: Q(1), [xv]: m.neg() }, b.neg());
/** a relation in x and y solved for y: { m, b } (null for a vertical line or other variables) */
function mbOf(r, yv = 'y', xv = 'x') {
  if (!r) return null;
  const vars = Object.keys(r.k).filter(v => !r.k[v].eq(0));
  if (vars.some(v => v !== yv && v !== xv)) return null;
  const B = r.k[yv] ?? Q(0), A = r.k[xv] ?? Q(0);
  if (B.eq(0)) return null;
  return { m: A.neg().div(B), b: r.c.neg().div(B) };
}
/** the right side of "f(x) = …" / "y = …" in a text, as { m, b } in its one variable */
function fnIn(text, v = null) {
  // the expression: numbers, operators, brackets and single letters (a word like "for" or "have" ends it)
  const m = norm(text).match(/(?:\b[A-Za-z]\(([a-z])\)|\b([A-Za-z])) = ((?:[-+\d./()\s]|(?<![A-Za-z])[a-z](?![A-Za-z]))+)/);
  if (!m) return null;
  const r = parseLin(m[3].replace(/[.\s]+$/, ''));
  if (!r) return null;
  const vars = Object.keys(r.k).filter(x => !r.k[x].eq(0));
  if (vars.length > 1) return null;
  const xv = v ?? vars[0] ?? m[1] ?? 'x';
  return { m: r.k[xv] ?? Q(0), b: r.c, v: xv, y: m[2] ?? 'y' };
}
const at = (L, x) => L.m.mul(x).add(L.b);

// ---------------------------------------------------------------- the picture (only what is drawn before the answer)
const picOf = q => q.data?.picture ?? {};
/** the drawn plane items: only the keys in `show` */
function shown(q) {
  const g = picOf(q).g;
  if (!g) return null;
  const S = new Set(g.show ?? []);
  return (g.items ?? []).filter(it => S.has(it.key));
}
const shownItem = (q, key) => shown(q)?.find(it => it.key === key);
/** the drawn (straight, not vertical) line with key k as exact { m, b } */
function drawnLine(q, key = 'L') {
  const L = shownItem(q, key);
  return L && L.kind === 'line' ? { m: Q(L.m), b: Q(L.b), lo: L.lo, hi: L.hi, ends: L.ends } : null;
}
const drawnPt = (q, key) => { const p = shownItem(q, key); return p && p.kind === 'point' ? [Q(p.x), Q(p.y)] : null; };
/** the visible table rows as [Q, Q] (rows in `hide` left out); null when a cell is not a number */
function rowsOf(q) {
  const t = picOf(q).t;
  if (!t) return null;
  const H = new Set(t.hide ?? []);
  try { return t.xs.map((x, i) => (H.has(i) ? null : [Q(x), qs(t.ys[i])])).filter(Boolean); } catch { return null; }
}
/** the line through all rows (null if they are not on one line) */
function tableLine(rows) {
  if (!rows || rows.length < 2) return null;
  const s = rows.slice().sort((a, b) => a[0].cmp(b[0]));
  if (s.some((r, i) => i && r[0].eq(s[i - 1][0]))) return null;
  const m = slopeOf(s[0], s[1]), b = s[0][1].sub(m.mul(s[0][0]));
  return s.every(r => at({ m, b }, r[0]).eq(r[1])) ? { m, b } : null;
}
/** a choice that is a number / fraction / "undefined" / "No zero" */
const choiceNum = (q, v) => choiceWhere(q, c => eqQ(tryQ(c), v));

// ---------------------------------------------------------------- the families
const F = {};

// table: linear (equal changes for equal steps) and proportional (also through (0, 0)); or a situation in words
F.tableLinear = q => {
  if (/situation is linear/.test(q.prompt)) {
    const linear = c => {
      if (/double|triple|% of its balance|area of a square/i.test(c)) return false;
      if (/save \$\d+ every|\$\d+ per day plus|burns down .* every hour|\$\d+ to come out plus \$\d+ per hour/i.test(c)) return true;
      throw new Error(`unknown situation: ${c}`);
    };
    return choiceWhere(q, linear);
  }
  const rows = rowsOf(q);
  if (!rows) return undefined;
  const L = tableLine(rows);
  const want = !L ? /^Not linear/ : L.b.eq(0) ? /^Linear and proportional/ : /^Linear, not proportional/;
  return choiceWhere(q, c => want.test(c));
};

F.changeTable = q => { const L = tableLine(rowsOf(q)); return L ? L.m.value : undefined; };

// rise over run between the two named points; the drawn line must pass through both
F.graphSlope = q => {
  const p = pts(q.prompt);
  if (p.length < 2) return undefined;
  return choiceNum(q, slopeOf(p[0], p[1]));
};

F.twoPointSlope = q => {
  const p = pts(q.prompt);
  if (p.length < 2) return undefined;
  if (/set-up/.test(q.prompt)) {
    // (a − b) ÷ (c − d): a, c from one point and b, d from the other, y's on top
    const P = p;
    return choiceWhere(q, c => {
      const m = norm(c).match(/^\((-?\d+) - \(?(-?\d+)\)?\) ÷ \((-?\d+) - \(?(-?\d+)\)?\)$/);
      if (!m) return false;
      const [a, b, cc, d] = m.slice(1).map(Number);
      return [0, 1].some(i => P[i][1].eq(a) && P[1 - i][1].eq(b) && P[i][0].eq(cc) && P[1 - i][0].eq(d));
    });
  }
  if (p[0][0].eq(p[1][0])) return choiceWhere(q, c => /^undefined/i.test(c.trim()));
  return choiceNum(q, slopeOf(p[0], p[1]));
};

// A from the prompt, B read where it is drawn
F.scaledSlope = q => {
  const A = pts(q.prompt)[0], B = drawnPt(q, 'B');
  return A && B ? slopeOf(A, B).value : undefined;
};

F.steeperScaled = q => {
  const L = drawnLine(q, 'L'), m = q.prompt.match(new RegExp(`Line B has slope ${N1}`));
  if (!L || !m) return undefined;
  const c = L.m.cmp(qs(m[1]));
  return choiceWhere(q, t => (c > 0 ? /^Line A/ : c < 0 ? /^Line B/ : /^They are equal/).test(t));
};

F.flatOrSteep = q => {
  const p = pts(q.prompt);
  if (p.length < 2) return undefined;
  const vertical = p[0][0].eq(p[1][0]), flat = p[0][1].eq(p[1][1]);
  if (vertical === flat) return undefined;
  if (/which is true/.test(q.prompt)) {
    return choiceWhere(q, c => {
      const slopeOk = /^Undefined slope/.test(c) ? vertical : /^Slope 0/.test(c) ? flat : false;
      const kindOk = /vertical line/.test(c) ? vertical : /horizontal line/.test(c) ? flat : false;
      const fnOk = /not a function/.test(c) ? vertical : /a function/.test(c) ? flat : false;
      return slopeOk && kindOk && fnOk;
    });
  }
  return vertical ? choiceWhere(q, c => /^undefined/i.test(c.trim())) : choiceNum(q, Q(0));
};

// y = c or x = c: judge every part of each description
F.hvLine = q => {
  const t = norm(texPlain(q.board)).replace(/\s+/g, ' ');
  const m = t.match(/^([xy]) = (-?\d+(?:\.\d+)?)$/);
  if (!m) return undefined;
  const v = qs(m[2]), horiz = m[1] === 'y';
  return choiceWhere(q, c0 => {
    const c = norm(c0);
    if (/^The single point/.test(c)) return false;
    const head = c.match(/^A (horizontal|vertical) line through \((-?[\d.]+), (-?[\d.]+)\); (.*)$/);
    if (!head) return false;
    const [, kind, px, py, tail] = head;
    const okKind = horiz ? kind === 'horizontal' && qs(px).eq(0) && qs(py).eq(v) : kind === 'vertical' && qs(px).eq(v) && qs(py).eq(0);
    const rg = tail.match(/^domain all real numbers, range \{(-?[\d.]+)\}$/);
    let okTail = false;
    if (/^not a function$/.test(tail)) okTail = !horiz;
    else if (rg) okTail = horiz && qs(rg[1]).eq(v);
    // "a function with domain {c}" (a vertical line is no function), "domain and range all real numbers": false
    return okKind && okTail;
  });
};

F.evalF = q => {
  const f = fnIn(q.prompt), a = q.prompt.match(new RegExp(`What is f\\(${N1}\\)`));
  return f && a ? at(f, qs(a[1])).value : undefined;
};

F.readNotation = q => {
  let m = q.prompt.match(new RegExp(`What is f\\(${N1}\\)\\?`));
  const L = drawnLine(q, 'L');
  if (m && /graph/.test(q.prompt)) return L ? at(L, qs(m[1])).value : undefined;
  m = q.prompt.match(new RegExp(`f\\(x\\) = ${N1}\\?`));
  if (m && /graph/.test(q.prompt)) return L && !L.m.eq(0) ? qs(m[1]).sub(L.b).div(L.m).value : undefined;
  m = q.prompt.match(new RegExp(`^f\\(${N1}\\) = ${N1}\\. What does that say`));
  if (m) {
    const a = qs(m[1]), b = qs(m[2]);
    return choiceWhere(q, c => {
      let k = c.match(new RegExp(`^The point \\(${N1}, ${N1}\\) is on the graph`));
      if (k) return qs(k[1]).eq(a) && qs(k[2]).eq(b);
      k = c.match(new RegExp(`^When the input is ${N1}, the output is ${N1}$`));
      if (k) return qs(k[1]).eq(a) && qs(k[2]).eq(b);
      return false;   // "f times a equals b": f is a name, not a number
    });
  }
  return undefined;
};

F.yIntercept = q => {
  const t = picOf(q).t;
  const L = t ? tableLine(rowsOf(q)) : drawnLine(q, 'L');
  if (!L) return undefined;
  if (!t) { const p = pts(q.prompt)[0]; if (p && !at(L, p[0]).eq(p[1])) return undefined; }
  return [0, L.b.value];
};

F.readMB = q => {
  const r = parseEq(texPlain(q.board));
  const L = mbOf(r);
  return L ? [L.m.value, L.b.value] : undefined;
};

F.matchGraph = q => {
  const L = drawnLine(q, 'L');
  if (!L) return undefined;
  return choiceWhere(q, c => sameRel(parseEq(c), relMB(L.m, L.b)));
};

F.zeroGraph = q => {
  const L = picOf(q).t ? tableLine(rowsOf(q)) : drawnLine(q, 'L');
  if (!L || L.m.eq(0)) return undefined;
  return [L.b.neg().div(L.m).value, 0];
};

F.zeroCount = q => {
  const f = fnIn(q.prompt);
  if (!f) return undefined;
  const want = !f.m.eq(0) ? /^Exactly one zero/ : f.b.eq(0) ? /^Every input is a zero/ : /^No zero/;
  return choiceWhere(q, c => want.test(c));
};

F.solveZero = q => {
  const f = fnIn(q.prompt);
  if (!f) return undefined;
  if (f.m.eq(0)) return f.b.eq(0) ? undefined : choiceWhere(q, c => /^No zero/.test(c));
  return choiceNum(q, f.b.neg().div(f.m));
};

// the bounds: words (at least / more than / at most / up to and including / fewer than / less than) or the drawn dots
F.phraseToIneq = q => {
  let lo, hi, a, b;
  const n = picOf(q).n;
  if (/number line shows/.test(q.prompt)) {
    if (!n?.given) return undefined;
    a = Q(n.lo.v); b = Q(n.hi.v); lo = n.lo.open ? '<' : '≤'; hi = n.hi.open ? '<' : '≤';
  } else {
    const m = q.prompt.match(/(at least|more than) (\d+(?:\.\d+)?)\b.*?\b(at most|up to and including|fewer than|less than) (\d+(?:\.\d+)?)\b/);
    if (!m) return undefined;
    lo = m[1] === 'at least' ? '≤' : '<'; a = qs(m[2]);
    hi = /at most|up to and including/.test(m[3]) ? '≤' : '<'; b = qs(m[4]);
  }
  return choiceWhere(q, c => {
    const k = norm(c).match(/^(-?[\d.]+) ([<≤]) [a-z] ([<≤]) (-?[\d.]+)$/);
    return !!k && qs(k[1]).eq(a) && k[2] === lo && k[3] === hi && qs(k[4]).eq(b);
  });
};

/** an interval / set text → a predicate description { kind, lo, hi, loOpen, hiOpen, set } */
function readSet(c, v) {
  const t = norm(c).trim();
  if (/^all real numbers$/.test(t)) return { kind: 'all' };
  let k = t.match(new RegExp(`^(?:\\{${v} \\| )?(-?[\\d.]+) ([<≤]) ${v} ([<≤]) (-?[\\d.]+)\\}?$`));
  if (k) return { kind: 'int', lo: qs(k[1]), hi: qs(k[4]), loOpen: k[2] === '<', hiOpen: k[3] === '<' };
  k = t.match(new RegExp(`^${v} ([≥>]) (-?[\\d.]+)$`));
  if (k) return { kind: 'ray', lo: qs(k[2]), loOpen: k[1] === '>' };
  k = t.match(/^\{([-\d., …]+)\}$/);
  if (k && !/…/.test(k[1])) return { kind: 'set', set: k[1].split(',').map(s => qs(s)).sort((a, b) => a.cmp(b)).map(String).join(',') };
  if (k) {
    const e = k[1].split(',').map(s => s.trim());
    return { kind: 'range', from: qs(e[0]), to: qs(e[e.length - 1]), step: qs(e[1]).sub(qs(e[0])) };
  }
  return { kind: 'other' };
}
const sameSet = (s, w) => {
  if (!s || s.kind !== w.kind) return false;
  if (w.kind === 'all') return true;
  if (w.kind === 'int') return s.lo.eq(w.lo) && s.hi.eq(w.hi) && s.loOpen === w.loOpen && s.hiOpen === w.hiOpen && s.lo.cmp(s.hi) < 0;
  if (w.kind === 'set') return s.set === w.set;
  if (w.kind === 'range') return s.from.eq(w.from) && s.to.eq(w.to) && s.step.eq(w.step);
  return false;
};

F.domainGraph = q => {
  if (/no restriction stated/.test(q.prompt)) return choiceWhere(q, c => readSet(c, 'x').kind === 'all');
  if (/only these points/.test(q.prompt)) {
    const D = shownItem(q, 'D');
    if (!D) return undefined;
    const w = { kind: 'set', set: D.xs.map(x => Q(x)).sort((a, b) => a.cmp(b)).map(String).join(',') };
    return choiceWhere(q, c => sameSet(readSet(c, 'x'), w));
  }
  const L = drawnLine(q, 'L');
  if (!L || L.lo === undefined || L.hi === undefined || !L.ends) return undefined;
  const w = { kind: 'int', lo: Q(L.lo), hi: Q(L.hi), loOpen: L.ends[0] === 'open', hiOpen: L.ends[1] === 'open' };
  const setBuilder = /set-builder/.test(q.prompt);
  return choiceWhere(q, c => (setBuilder ? /^\{x \|/.test(c) : !/^\{/.test(c)) && sameSet(readSet(c, 'x'), w));
};

// whole items (dots 0..K) or a continuous fill (segment 0..K)
F.contextDomain = q => {
  let m = q.prompt.match(/cost \$(\d+(?:\.\d+)?) each, and you have \$(\d+(?:\.\d+)?)\. C\(n\) = (\d+(?:\.\d+)?)n/);
  let discrete, K, v;
  if (m) { discrete = true; K = qs(m[2]).div(qs(m[1])); v = 'n'; if (!qs(m[3]).eq(qs(m[1]))) return undefined; K = Q(Math.floor(K.value)); }
  else {
    m = q.prompt.match(/An empty (\d+)-gallon tank fills at (\d+(?:\.\d+)?) gallons per minute until it is full\. V\(t\) = (\d+(?:\.\d+)?)t/);
    if (!m) return undefined;
    discrete = false; K = qs(m[1]).div(qs(m[2])); v = 't';
    if (!qs(m[3]).eq(qs(m[2]))) return undefined;
  }
  if (/How should the graph/.test(q.prompt)) {
    return choiceWhere(q, c => {
      let k = c.match(new RegExp(`^Dots at ${v} = 0, 1, 2, …, ${N1}$`));
      if (k) return discrete && qs(k[1]).eq(K);
      k = c.match(new RegExp(`^A solid segment from ${v} = 0 to ${N1}$`));
      if (k) return !discrete && qs(k[1]).eq(K);
      return false;   // a whole line, a ray past the end
    });
  }
  const w = discrete ? { kind: 'range', from: Q(0), to: K, step: Q(1) } : { kind: 'int', lo: Q(0), hi: K, loOpen: false, hiOpen: false };
  return choiceWhere(q, c => sameSet(readSet(c, v), w));
};

F.rangeInterval = q => {
  const f = fnIn(q.prompt);
  if (!f) return undefined;
  let w;
  let m = q.prompt.match(/with domain \{([^}]*)\}/);
  if (m) w = { kind: 'set', set: [...new Set(m[1].split(',').map(s => at(f, qs(s)).toString()))].map(s => Q(s)).sort((a, b) => a.cmp(b)).map(String).join(',') };
  else if (/for all real x/.test(q.prompt)) w = f.m.eq(0) ? { kind: 'set', set: f.b.toString() } : { kind: 'all' };
  else {
    m = norm(q.prompt).match(/ on (-?[\d.]+) ([<≤]) x ([<≤]) (-?[\d.]+)\./);
    if (!m) return undefined;
    const a = qs(m[1]), b = qs(m[4]), fa = at(f, a), fb = at(f, b), oa = m[2] === '<', ob = m[3] === '<';
    if (f.m.eq(0)) w = { kind: 'set', set: fa.toString() };
    else w = f.m.cmp(0) > 0 ? { kind: 'int', lo: fa, hi: fb, loOpen: oa, hiOpen: ob } : { kind: 'int', lo: fb, hi: fa, loOpen: ob, hiOpen: oa };
  }
  return choiceWhere(q, c => sameSet(readSet(c, 'y'), w));
};

F.mixedFeature = q => {
  const L = picOf(q).t ? tableLine(rowsOf(q)) : drawnLine(q, 'L');
  if (!L) return undefined;
  if (/What is the slope/.test(q.prompt)) return L.m.value;
  if (/y-intercept/.test(q.prompt)) return L.b.value;
  if (/zero/.test(q.prompt)) return L.m.eq(0) ? undefined : L.b.neg().div(L.m).value;
  return undefined;
};

F.buildMB = q => {
  const m = q.prompt.match(new RegExp(`slope is ${N1} and the y-intercept is (?:the point \\(0, ${N1}\\)|${N1})`));
  if (!m) return undefined;
  const M = qs(m[1]), B = qs(m[2] ?? m[3]);
  return choiceWhere(q, c => sameRel(parseEq(c), relMB(M, B)));
};

F.bFromPoint = q => {
  const m = q.prompt.match(new RegExp(`slope ${N1} and passes through`)), p = pts(q.prompt)[0];
  return m && p ? p[1].sub(qs(m[1]).mul(p[0])).value : undefined;
};

/** the line a prompt names: "slope m through (a, b)" or "through (a, b) and (c, d)" */
function promptLine(text) {
  const p = pts(text), m = text.match(new RegExp(`slope ${N1}`));
  if (m && p.length >= 1) { const M = qs(m[1]); return { m: M, b: p[0][1].sub(M.mul(p[0][0])) }; }
  if (p.length >= 2 && !p[0][0].eq(p[1][0])) { const M = slopeOf(p[0], p[1]); return { m: M, b: p[0][1].sub(M.mul(p[0][0])) }; }
  return null;
}
/** "y − k = m(x − h)" with one bracket and y alone with a number on the left */
const isPointSlope = c => /^y [+−-] [\d.]+ = [−-]?(?:\d+(?:\/\d+)?)?\(x [+−-] [\d.]+\)$/.test(c.trim()) || /^y = [−-]?(?:\d+(?:\/\d+)?)?\(x [+−-] [\d.]+\)$/.test(c.trim());

F.writePS = q => {
  const L = promptLine(q.prompt);
  if (!L) return undefined;
  return choiceWhere(q, c => isPointSlope(c) && sameRel(parseEq(c), relMB(L.m, L.b)));
};

F.eqTwoPoints = q => {
  const p = pts(q.prompt);
  if (p.length < 2 || p[0][0].eq(p[1][0])) return undefined;
  const m = slopeOf(p[0], p[1]);
  return [m.value, p[0][1].sub(m.mul(p[0][0])).value];
};

/** "after a U the NAME is v1; after c U it is v2" */
function twoObs(text) {
  const m = text.match(new RegExp(`after ${N1} \\w+ the [\\w ]+? is ${N1}; after ${N1} \\w+ it is ${N1}\\.`));
  if (!m) return null;
  const A = [qs(m[1]), qs(m[2])], B = [qs(m[3]), qs(m[4])];
  const M = slopeOf(A, B);
  return { A, B, m: M, b: A[1].sub(M.mul(A[0])) };
}
F.twoPointsStory = q => {
  const o = twoObs(q.prompt);
  if (!o) return undefined;
  if (/rate of change/.test(q.prompt)) return o.m.value;
  if (/What was it at 0/.test(q.prompt)) return o.b.value;
  return undefined;
};

F.tableRule = q => { const L = tableLine(rowsOf(q)); return L ? [L.m.value, L.b.value] : undefined; };

F.tableCheck = q => {
  const f = fnIn(q.prompt), rows = rowsOf(q);
  if (!f || !rows) return undefined;
  const bad = rows.filter(r => !at(f, r[0]).eq(r[1]));
  return choiceWhere(q, c => {
    if (/^Yes: it fits every row/.test(c)) return bad.length === 0;
    const k = c.match(new RegExp(`^No: at x = ${N1} the rule gives ${N1}, not ${N1}$`));
    if (k) { const r = rows.find(r => r[0].eq(qs(k[1]))); return !!r && at(f, r[0]).eq(qs(k[2])) && r[1].eq(qs(k[3])) && !r[1].eq(qs(k[2])); }
    return false;   // "two rows are enough", "no row with x = 0 so no rule": false reasons
  });
};

// A from the prompt, B where it is drawn; the drawn line must agree
F.graphRule = q => {
  const A = pts(q.prompt)[0], B = drawnPt(q, 'B');
  if (!A || !B || A[0].eq(B[0])) return undefined;
  const m = slopeOf(A, B);
  return [m.value, A[1].sub(m.mul(A[0])).value];
};

// the pair of points that are both on the drawn line AND on grid crossings (exact readings)
F.exactPoints = q => {
  const L = drawnLine(q, 'L'), g = picOf(q).g;
  if (!L || !g) return undefined;
  const onGrid = (v, ax) => { const k = Q(v).sub(Q(ax.min)).div(Q(ax.step)); return k.d === 1; };
  return choiceWhere(q, c => {
    if (/\d\.\d{3}/.test(c)) return false;   // a three-decimal estimate is not a reading
    const p = pts(c);
    return p.length === 2 && p.every(P => at(L, P[0]).eq(P[1]) && onGrid(P[0].value, g.x) && onGrid(P[1].value, g.y));
  });
};

/** the stories: the equation in the story's own letters { yv, xv, m, b } */
function storyModel(text) {
  let m;
  if ((m = text.match(new RegExp(`saves \\$${N1} every week\\. After ${N1} weeks she has \\$${N1}`)))) {
    const r = qs(m[1]); return { yv: 'S', xv: 'w', m: r, b: qs(m[3]).sub(r.mul(qs(m[2]))) };
  }
  if ((m = text.match(new RegExp(`tank drains ${N1} gallons per minute\\. After ${N1} minutes, ${N1} gallons are left`)))) {
    const r = qs(m[1]).neg(); return { yv: 'V', xv: 't', m: r, b: qs(m[3]).sub(r.mul(qs(m[2]))) };
  }
  if ((m = text.match(new RegExp(`charges a \\$${N1} sign-up fee plus \\$${N1} per month`)))) return { yv: 'C', xv: 'n', m: qs(m[2]), b: qs(m[1]) };
  if ((m = text.match(new RegExp(`battery loses ${N1}% per hour\\. After ${N1} hours it shows ${N1}%`)))) {
    const r = qs(m[1]).neg(); return { yv: 'B', xv: 'h', m: r, b: qs(m[3]).sub(r.mul(qs(m[2]))) };
  }
  if ((m = text.match(new RegExp(`A ${N1}-gallon tank starts full and drains ${N1} gallons per minute`)))) return { yv: 'V', xv: 't', m: qs(m[2]).neg(), b: qs(m[1]) };
  return null;
}
F.storyEq = q => {
  const s = storyModel(q.prompt);
  if (!s) return undefined;
  return choiceWhere(q, c => sameRel(parseEq(c), relMB(s.m, s.b, s.yv, s.xv)));
};
F.storyValue = q => { const s = storyModel(q.prompt); return s ? s.b.value : undefined; };

F.readPS = q => {
  const L = mbOf(parseEq(texPlain(q.board)));
  if (!L) return undefined;
  return choiceWhere(q, c => {
    const k = c.match(new RegExp(`^slope ${N1}, through \\(${N1}, ${N1}\\)$`));
    return !!k && qs(k[1]).eq(L.m) && at(L, qs(k[2])).eq(qs(k[3]));
  });
};

F.stdSlope = q => { const L = mbOf(parseEq(texPlain(q.board))); return L ? choiceNum(q, L.m) : undefined; };

F.stdIntercepts = q => {
  const r = parseEq(texPlain(q.board));
  if (!r) return undefined;
  let xv = 'x', yv = 'y';
  const ax = q.prompt.match(/With (\w) across and (\w) up/);
  if (ax) { xv = ax[1]; yv = ax[2]; }
  const A = r.k[xv], B = r.k[yv];
  if (!A || !B || A.eq(0) || B.eq(0)) return undefined;
  return [r.c.neg().div(A).value, r.c.neg().div(B).value];
};

F.toSlopeInt = q => { const L = mbOf(parseEq(texPlain(q.board))); return L ? [L.m.value, L.b.value] : undefined; };

// standard form: Ax + By = C with integers, A ≥ 0, the same line
F.siToStd = q => {
  let L = mbOf(parseEq(texPlain(q.board)));
  if (!L) L = promptLine(q.prompt);
  if (!L) return undefined;
  return choiceWhere(q, c => {
    const k = norm(c).trim().match(/^(\d*)x ([+-]) (\d*)y = (-?\d+)$/);
    if (!k) return false;
    return sameRel(parseEq(c), relMB(L.m, L.b));
  });
};

// start at the point the equation names ((0, b) or (h, k)), one slope step with the given run
F.stepFrom = q => {
  const t = norm(texPlain(q.board)).replace(/\s+/g, ' ');
  const run = q.prompt.match(/\(run (\d+)\)/);
  const L = mbOf(parseEq(t));
  if (!L || !run) return undefined;
  let S;
  const ps = t.match(/^y ([+-]) (\d+(?:\.\d+)?) = .*\(x ([+-]) (\d+(?:\.\d+)?)\)$/);
  if (ps) S = [qs(ps[4]).mul(ps[3] === '-' ? 1 : -1), qs(ps[2]).mul(ps[1] === '-' ? 1 : -1)];
  else if (/^y = [^()]*$/.test(t)) S = [Q(0), L.b];
  else return undefined;
  const r = qs(run[1]);
  return [S[0].add(r).value, S[1].add(L.m.mul(r)).value];
};

/** g(x) as a transformation of f: g(x) = A·f(B·x + C) + D, read from "f(x − 2)", "f(0.5x)", "3f(x)", "f(x) + 5" */
function transformOf(text) {
  const t = norm(text).replace(/\s+/g, '');
  const m = t.match(/^(-?\d*(?:\.\d+)?)f\((-?\d*(?:\.\d+)?)x(?:([+-])(\d+(?:\.\d+)?))?\)(?:([+-])(\d+(?:\.\d+)?))?$/);
  if (!m) return null;
  const coef = s => (s === '' ? Q(1) : s === '-' ? Q(-1) : qs(s));
  return { A: coef(m[1]), B: coef(m[2]), C: m[3] ? qs(m[4]).mul(m[3] === '-' ? -1 : 1) : Q(0), D: m[5] ? qs(m[6]).mul(m[5] === '-' ? -1 : 1) : Q(0) };
}
/** for f(x) = x: the line of A·f(Bx + C) + D */
const lineOfT = T => ({ m: T.A.mul(T.B), b: T.A.mul(T.C).add(T.D) });

F.transformPoint = q => {
  const p = pts(q.prompt)[0], g = q.prompt.match(/g\(x\) = (.+?)\?/);
  if (!p || !g || !/f\(x\) = x passes/.test(q.prompt)) return undefined;
  const T = transformOf(g[1]);
  if (!T) return undefined;
  // the input x of g with B·x + C = p's input; the output A·f(p) + D
  const x = p[0].sub(T.C).div(T.B), y = T.A.mul(p[1]).add(T.D);
  return [x.value, y.value];
};

F.transformWords = q => {
  let m = q.prompt.match(/same graph as (.+?)\?$/);
  if (m) {
    const T = transformOf(m[1]);
    if (!T) return undefined;
    const G = lineOfT(T);
    const others = q.choices.map(c => { const U = transformOf(c); return U ? lineOfT(U) : null; });
    const any = others.some(L => L && L.m.eq(G.m) && L.b.eq(G.b));
    return choiceWhere(q, (c, i) => (/^None/.test(c) ? !any : !!others[i] && others[i].m.eq(G.m) && others[i].b.eq(G.b)));
  }
  m = q.prompt.match(/Describe g\(x\) = (.+?)\.$/);
  if (!m) return undefined;
  const T = transformOf(m[1]);
  if (!T) return undefined;
  const G = lineOfT(T);
  const same = (mm, bb) => G.m.eq(mm) && G.b.eq(bb);
  return choiceWhere(q, c0 => {
    const c = norm(c0);
    const claims = c.replace(/^A /, "").split(/, and |, | and /).map(s => s.replace(/^an? /, ""));
    const refl = claims.includes("reflection across the x-axis");
    let ok = claims.length > 0, k;
    for (const cl of claims) {
      if ((k = cl.match(/^shift (up|down|left|right) (\d+(?:\.\d+)?)$/))) { const d = qs(k[2]); ok = ok && same(Q(1), k[1] === 'up' || k[1] === 'left' ? d : d.neg()); }
      else if ((k = cl.match(/^(?:slope still|the slope becomes|The slope changes to) (-?\d+(?:\.\d+)?)$/))) ok = ok && G.m.eq(qs(k[1]));
      else if ((k = cl.match(/^(?:vertical )?stretch by (\d+(?:\.\d+)?)$/))) ok = ok && same(refl ? qs(k[1]).neg() : qs(k[1]), Q(0));
      else if (cl === "reflection across the x-axis") ok = ok && G.m.cmp(0) < 0;
      else if (cl === "no reflection") ok = ok && G.m.cmp(0) > 0;
      else return false;
    }
    return ok;
  });
};

F.enoughInfo = q => {
  const text = q.prompt.replace(/^A linear function: /, '');
  const p = pts(text), sl = text.match(new RegExp(`slope is ${N1}`));
  const seen = new Set(), P = p.filter(x => { const k = `${x[0]},${x[1]}`; if (seen.has(k)) return false; seen.add(k); return true; });
  let n;   // 0, 1 or Infinity linear functions
  if (sl) {
    if (!P.length) n = Infinity;
    else { const m = qs(sl[1]), b = P[0][1].sub(m.mul(P[0][0])); n = P.every(x => at({ m, b }, x[0]).eq(x[1])) ? 1 : 0; }
  } else if (P.length < 2) n = Infinity;
  else if (P[0][0].eq(P[1][0])) n = 0;
  else { const m = slopeOf(P[0], P[1]), b = P[0][1].sub(m.mul(P[0][0])); n = P.every(x => !x[0].eq(P[0][0]) || x[1].eq(P[0][1])) && P.every(x => at({ m, b }, x[0]).eq(x[1])) ? 1 : 0; }
  const want = n === 1 ? /^Exactly one/ : n === 0 ? /^No linear function/ : /^Infinitely many/;
  return choiceWhere(q, c => want.test(c));
};

F.sameLineForms = q => {
  const m = q.prompt.match(/^Do (.+?) and (.+?) describe the same line\?$/);
  if (!m) return undefined;
  const a = parseEq(m[1]), b = parseEq(m[2]);
  if (!a || !b) return undefined;
  const same = sameRel(a, b);
  return choiceWhere(q, c => (same ? /^Yes: the same line/ : /^No: different lines/).test(c));
};

/** "V = −4t + 40 models the water in the tank (t = minutes…)": m, b of the board's model */
function modelOf(q) {
  const r = parseEq(texPlain(q.board));
  if (!r) return null;
  const vars = Object.keys(r.k).filter(v => !r.k[v].eq(0));
  const yv = norm(texPlain(q.board)).match(/^([A-Za-z])\s*=/)?.[1];
  const xv = q.prompt.match(/\((\w) = /)?.[1];
  if (!yv || !xv || vars.some(v => v !== yv && v !== xv)) return null;
  return mbOf(r, yv, xv);
}
const money = s => /^\$/.test(s.trim());
const amt = s => qs(s.replace(/[^\d.\-−]/g, '') || 'x');

F.slopeSentence = q => {
  const L = modelOf(q);
  if (!L) return undefined;
  return choiceWhere(q, c0 => {
    const c = norm(c0);
    let k;
    if ((k = c.match(/ (rises|grows|drops|shrinks) (\$?-?[\d.]+)(?: .*)? each \w+$/))) { const v = amt(k[2]); return L.m.eq(/rises|grows/.test(k[1]) ? v : v.neg()) && !v.eq(0); }
    if (/ stays the same each \w+$/.test(c)) return L.m.eq(0);
    if ((k = c.match(/^It takes 1 \w+ for .* to change by (\$?-?[\d.]+)/))) { void money; return L.m.value !== 0 && Math.abs(L.m.value) === amt(k[1]).value; }
    if (/^The .* is \$?-?[\d.]+/.test(c)) return false;   // a value, not a rate
    return false;
  });
};

F.bMeaning = q => {
  const L = modelOf(q);
  if (!L) return undefined;
  return choiceWhere(q, c0 => {
    const c = norm(c0);
    let k;
    if ((k = c.match(/^At 0 \w+.*?, the .* is (\$?-?[\d.]+)/))) return L.b.eq(amt(k[1]));
    if ((k = c.match(/^After 1 \w+, the .* is (\$?-?[\d.]+)/))) return at(L, Q(1)).eq(amt(k[1]));
    if ((k = c.match(/ (rises|grows|drops|shrinks) (\$?-?[\d.]+)(?: .*)? each \w+$/))) { const v = amt(k[2]); return L.m.eq(/rises|grows/.test(k[1]) ? v : v.neg()); }
    if ((k = c.match(/ changes by (\$?-?[\d.]+)(?: .*)? per \w+$/))) return L.m.eq(amt(k[1]));
    return false;
  });
};

/** "V = 85 − 5t gallons after t minutes" → { m, b } in that letter */
function zeroModel(text) {
  const m = norm(text).match(/([A-Z]) = ([-\d.]+(?: [-+] [\d.]+[a-z])?|[\d.]+[a-z] - [\d.]+) (?:gallons|dollars|inches)/);
  if (!m) return null;
  const r = parseLin(m[2]);
  if (!r) return null;
  const v = Object.keys(r.k)[0];
  return v ? { m: r.k[v], b: r.c } : null;
}
F.zeroWhen = q => {
  const L = zeroModel(q.prompt);
  if (!L || L.m.eq(0)) return undefined;
  const z = L.b.neg().div(L.m);
  if (q.input === 'num') return z.value;
  const given = q.prompt.match(new RegExp(`The zero of this model is ${N1}\\.`));
  if (!given || !qs(given[1]).eq(z)) return -1;
  return choiceWhere(q, c => {
    let k;
    if ((k = c.match(new RegExp(`^After ${N1} \\w+, `)))) return qs(k[1]).eq(z);
    if ((k = c.match(new RegExp(`^At the start there are ${N1} `)))) return L.b.eq(qs(k[1]));
    if ((k = c.match(new RegExp(`^There are ${N1} \\w+ at that moment`)))) return qs(k[1]).eq(0);
    return false;
  });
};

F.isZero = q => {
  let m = norm(q.prompt).match(/T = (\d+)t - (\d+) \(°F\).*for (\d+) ≤ t ≤ (\d+)\. Does the model have a zero/);
  if (m) {
    const L = { m: qs(m[1]), b: qs(m[2]).neg() }, lo = qs(m[3]), hi = qs(m[4]);
    const r = L.b.neg().div(L.m), inside = r.cmp(lo) >= 0 && r.cmp(hi) <= 0;
    return choiceWhere(q, c0 => {
      const c = norm(c0);
      let k;
      if ((k = c.match(/^No: the root t = ([\d.]+) lies outside/))) return !inside && qs(k[1]).eq(r);
      if ((k = c.match(/^Yes: t = ([\d.]+), because/))) return inside && qs(k[1]).eq(r);
      if ((k = c.match(/^Yes: t = ([\d.]+), the end of the domain/))) return at(L, qs(k[1])).eq(0);
      return false;
    });
  }
  m = norm(q.prompt).match(/C = (\d+)n \+ (\d+) dollars .* for n ≥ (\d+)\. Is \((\d+), (\d+)\) a y-intercept/);
  if (m) {
    const inDomain = Q(0).cmp(qs(m[3])) >= 0;
    return choiceWhere(q, c => {
      if (/^No: n = 0 is not in the domain/.test(c)) return !inDomain;
      if (/^Yes: b = /.test(c)) return inDomain;
      return false;   // "(20, 0)" swaps the coordinates
    });
  }
  m = norm(q.prompt).match(/h = ([\d.]+)t - ([\d.]+) \(cm.*domain t ≥ (\d+)\. What is true about its y-intercept/);
  if (m) {
    const b = qs(m[2]).neg(), inDomain = Q(0).cmp(qs(m[3])) >= 0;
    return choiceWhere(q, c0 => {
      const c = norm(c0);
      let k;
      if ((k = c.match(/^It exists, \(0, (-?[\d.]+)\), but a height of (-?[\d.]+) cm is not plausible/))) return inDomain && b.cmp(0) < 0 && qs(k[1]).eq(b) && qs(k[2]).eq(b);
      if (/^There is none/.test(c)) return !inDomain;
      if ((k = c.match(/^It is \(0, (-?[\d.]+)\), and since the domain .* the model is right for every/))) return inDomain && b.cmp(0) >= 0 && qs(k[1]).eq(b);
      return false;
    });
  }
  return undefined;
};

F.firstWhole = q => {
  const m = norm(q.prompt).match(/P\(n\) = (\d+(?:\.\d+)?)n - (\d+(?:\.\d+)?) is the profit.*first n that makes a profit \(P > 0\)/);
  if (!m) return undefined;
  const a = qs(m[1]), c = qs(m[2]);
  let n = 0;
  while (a.mul(n).sub(c).cmp(0) <= 0) n++;
  return n;
};

// ---------------------------------------------------------------- sane: the world for a 14-18-year-old
function sane(q) {
  const f = q.family, p = norm(q.prompt);
  if (f === 'twoPointSlope' && /set-up/.test(q.prompt)) {
    // a wrong set-up whose value is still the slope: two choices give the right number
    const P = pts(q.prompt);
    if (P.length >= 2 && !P[0][0].eq(P[1][0])) {
      const s = slopeOf(P[0], P[1]);
      const hits = (q.choices ?? []).filter(c => {
        const m = norm(c).match(/^\((-?\d+) - \(?(-?\d+)\)?\) ÷ \((-?\d+) - \(?(-?\d+)\)?\)$/);
        if (!m) return false;
        const [a, b, cc, d] = m.slice(1).map(Number);
        return cc - d !== 0 && Q(a - b, cc - d).eq(s);
      });
      if (hits.length > 1) return `two set-ups give the slope's value ${s} (${hits.join(' | ')})`;
    }
  }
  if (f === 'storyValue' || f === 'storyEq') {
    const s = storyModel(q.prompt);
    if (s && s.b.cmp(0) < 0) return `the start amount is ${s.b}`;
    if (s && s.yv === 'B' && s.b.cmp(100) > 0) return `a phone battery starts at ${s.b}%`;
  }
  if (f === 'twoPointsStory') {
    const o = twoObs(q.prompt);
    if (o) {
      if (/melting/.test(p) && o.m.cmp(0) >= 0) return 'a melting ice block that does not lose weight';
      if (/being filled/.test(p) && o.m.cmp(0) <= 0) return 'a pool being filled that does not gain water';
      if (/miles left/.test(p) && o.m.cmp(0) >= 0) return 'the miles left do not go down on a trip';
      if (/total paid/.test(p) && o.m.cmp(0) <= 0) return 'a total paid that goes down';
      if (o.b.cmp(0) < 0) return `the value at 0 is ${o.b}`;
    }
  }
  if (f === 'slopeSentence' || f === 'bMeaning') {
    const L = modelOf(q);
    if (L && /distance from the start line|water in the tank|snow depth|cost/.test(p) && L.b.cmp(0) < 0) return `the model starts at a negative amount (${L.b}) for ${p.match(/models the ([\w ]+?) \(/)?.[1]}`;
    if (f === 'bMeaning' && L) {
      const n = p.match(/What does the (-?[\d.]+) say/);
      if (n && qs(n[1]).eq(L.b) && L.m.eq(L.b)) return `the asked number ${n[1]} is both the slope and the y-intercept`;
    }
  }
  if (f === 'zeroWhen') {
    const L = zeroModel(q.prompt);
    if (L && !L.m.eq(0) && L.b.neg().div(L.m).cmp(0) <= 0) return 'the zero is not after the start';
  }
  if (f === 'contextDomain') {
    const m = p.match(/cost \$(\d+(?:\.\d+)?) each, and you have \$(\d+(?:\.\d+)?)/);
    if (m && qs(m[2]).div(qs(m[1])).d !== 1) return 'the budget is not a whole number of items';
    const t = p.match(/An empty (\d+)-gallon tank fills at (\d+(?:\.\d+)?) gallons/);
    if (t && Number(t[1]) / Number(t[2]) > 600) return 'a tank that takes over 10 hours to fill';
  }
  return '';
}

function solve(q) {
  const fn = F[q.family];
  return fn ? fn(q) : undefined;
}

export default { solve, sane };
