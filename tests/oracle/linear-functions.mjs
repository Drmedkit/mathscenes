// Oracle for the lesson "linear-functions" (linear functions and slope-intercept form, 8.F.B.4). Role O,
// docs/lessons/QUALITY_LAYER.md. Every item is worked out from what the student sees: the prompt (stories, equations,
// points), the table card, the drawn lines and marked points of the graph, and the choices. Equations are parsed into
// exact linear forms (m·x + b, Q fractions); every choice is judged by the maths of its claim (a reason that does not
// prove anything, "it is the constant term, so it is the fee", is a reason, not evidence, and does not count).
// The picture's `tex` / `slateTex` lines (the worked solution shown after a miss) are never read.
import { Q } from '../../tools/quality/oracle-kit.mjs';

// ---------------------------------------------------------------- numbers and linear forms
const N = '([−-]?\\d+(?:\\.\\d+)?)';
const q = s => Q(String(s).replace(/[−–]/g, '-').replace(/[$,]/g, '').trim());
function toQ(v) { return v && typeof v === 'object' && 'n' in v ? v : Q(v); }
const L = (a, b) => ({ a: toQ(a), b: toQ(b) });
const ladd = (u, v) => L(u.a.add(v.a), u.b.add(v.b));
const lneg = u => L(u.a.neg(), u.b.neg());
function lmul(u, v) {
  if (u.a.n !== 0 && v.a.n !== 0) throw new Error('not linear');
  return u.a.n === 0 ? L(v.a.mul(u.b), v.b.mul(u.b)) : L(u.a.mul(v.b), u.b.mul(v.b));
}
function ldiv(u, v) { if (v.a.n !== 0 || v.b.n === 0) throw new Error('bad divisor'); return L(u.a.div(v.b), u.b.div(v.b)); }

/** an expression in one letter variable → {a, b} (a·var + b); `2/3x` is (2/3)·x, `−x` is −1·x */
function parseExpr(text) {
  const s = String(text).replace(/[−–]/g, '-').replace(/×|·|\\cdot/g, '*').replace(/\$/g, '');
  const toks = [];
  const re = /\s*(\d+\.?\d*|\.\d+|[A-Za-z]|[-+*/()])/y;
  let i = 0;
  while (i < s.length) {
    if (/\s/.test(s[i])) { i++; continue; }
    re.lastIndex = i; const m = re.exec(s);
    if (!m) throw new Error(`bad char in ${s}`);
    toks.push(m[1]); i = re.lastIndex;
  }
  let p = 0;
  const peek = () => toks[p], next = () => toks[p++];
  function expr() {
    let v = term();
    while (peek() === '+' || peek() === '-') { const op = next(); const w = term(); v = op === '+' ? ladd(v, w) : ladd(v, lneg(w)); }
    return v;
  }
  function term() {
    let v = factor();
    for (;;) {
      const t = peek();
      if (t === '*') { next(); v = lmul(v, factor()); } else if (t === '/') { next(); v = ldiv(v, factor()); } else if (t !== undefined && (t === '(' || /^[\d.A-Za-z]/.test(t))) v = lmul(v, factor());
      else break;
    }
    return v;
  }
  function factor() {
    const t = peek();
    if (t === '-') { next(); return lneg(factor()); }
    if (t === '+') { next(); return factor(); }
    const u = next();
    if (u === '(') { const v = expr(); if (next() !== ')') throw new Error('missing )'); return v; }
    if (u === undefined) throw new Error('unexpected end');
    if (/^[A-Za-z]$/.test(u)) return L(1, 0);
    return L(0, q(u));
  }
  const v = expr();
  if (p !== toks.length) throw new Error(`trailing tokens in ${s}`);
  return v;
}
/** "Y = rhs" → { m, b, out, var } (the right side linear in its one letter) */
function parseEq(text) {
  const t = String(text).trim();
  const k = t.indexOf('=');
  if (k < 0) return null;
  const out = t.slice(0, k).trim();
  const rhs = t.slice(k + 1).trim();
  const vars = [...new Set((rhs.match(/[A-Za-z]/g) ?? []))];
  if (vars.length > 1) return null;
  try { const f = parseExpr(rhs); return { m: f.a, b: f.b, out, v: vars[0] ?? null }; } catch { return null; }
}
const TERM = '(?:\\d+(?:\\.\\d+)?(?:\\/\\d+)?[a-z]?(?![a-zA-Z])|[a-z](?![a-zA-Z]))';
const EXPR = `[−-]?\\s*${TERM}(?:\\s*[+−-]\\s*${TERM})*`;
/** every equation "Y = …" written in a text, in order */
function eqsIn(text) {
  return [...String(text).matchAll(new RegExp(`(?<![A-Za-z])([A-Za-z]) = (${EXPR})`, 'g'))].map(m => parseEq(`${m[1]} = ${m[2]}`)).filter(Boolean);
}
const sameMB = (e, m, b) => e && e.m.eq(m) && e.b.eq(b);
const val = f => f.value;
const pt = s => { const m = String(s).match(new RegExp(`\\(\\s*${N},\\s*${N}\\s*\\)`)); return m ? [q(m[1]), q(m[2])] : null; };
function namedPoints(text) {
  const out = {};
  for (const m of String(text).matchAll(new RegExp(`\\b([A-Z])\\(\\s*${N},\\s*${N}\\s*\\)`, 'g'))) out[m[1]] = [q(m[2]), q(m[3])];
  return out;
}
const slopeOf = (P1, P2) => (P2[0].eq(P1[0]) ? null : P2[1].sub(P1[1]).div(P2[0].sub(P1[0])));
/** index of the one choice passing pred; -1 when none or several */
function only(q0, pred) {
  const hits = (q0.choices ?? []).map((c, i) => (pred(c, i) ? i : -1)).filter(i => i >= 0);
  return hits.length === 1 ? hits[0] : -1;
}

// ---------------------------------------------------------------- the picture
const lmOf = q0 => q0.data?.picture?.lf?.lm ?? null;
function tableOf(q0) {
  const t = lmOf(q0)?.table;
  if (!t) return null;
  return t.xs.map((x, i) => [Q(x), Q(t.ys[i])]);
}
/** a table's rate and start, when every pair of rows gives the same rate */
function tableLine(rows) {
  if (!rows || rows.length < 2) return null;
  const s = [...rows].sort((u, v) => u[0].cmp(v[0]));
  const m = slopeOf(s[0], s[1]);
  if (!m) return null;
  for (let i = 1; i < s.length - 1; i++) { const k = slopeOf(s[i], s[i + 1]); if (!k || !k.eq(m)) return null; }
  return { m, b: s[0][1].sub(m.mul(s[0][0])) };
}
const tableAt = (rows, x) => rows?.find(r => r[0].eq(x))?.[1];
const drawnLines = q0 => (lmOf(q0)?.lines ?? []).map(l => ({ ...l, m: Q(l.m), b: Q(l.b) }));
const ptsOf = q0 => Object.fromEntries((lmOf(q0)?.pts ?? []).filter(p => p.name).map(p => [p.name, [Q(p.x), Q(p.y)]]));

// ---------------------------------------------------------------- stories: start value b and rate m
function story(p) {
  const s = String(p);
  let m;
  const R = (r, k = 1) => q(r).div(k);
  if ((m = s.match(new RegExp(`charges an? \\$${N} (?:fee|joining fee|delivery fee) plus \\$${N} per (\\w+)`)))) return { b: q(m[1]), m: R(m[2]) };
  if ((m = s.match(new RegExp(`costs \\$${N} a month plus \\$${N} (?:per GB|for every ${N} GB)`)))) return { b: q(m[1]), m: R(m[2], m[3] ? q(m[3]) : 1) };
  if ((m = s.match(new RegExp(`taxi charges \\$${N} to start,? plus \\$${N} (?:per mile|for every ${N} miles)`)))) return { b: q(m[1]), m: R(m[2], m[3] ? q(m[3]) : 1) };
  if ((m = s.match(new RegExp(`candle is ${N} in\\. tall when it is lit and burns down ${N} in\\. per hour`)))) return { b: q(m[1]), m: R(m[2]).neg() };
  if ((m = s.match(new RegExp(`gift card starts with \\$${N}\\. (?:Each drink costs \\$${N}|Every ${N} drinks take \\$${N} off the card)`)))) return { b: q(m[1]), m: (m[2] ? R(m[2]) : R(m[4], q(m[3]))).neg(), disc: true };
  if ((m = s.match(new RegExp(`balloon is ${N} ft up and comes down ${N} ft per minute`)))) return { b: q(m[1]), m: R(m[2]).neg() };
  if ((m = s.match(new RegExp(`seedling is ${N} in\\. tall when it is planted and grows ${N} in\\. per week`)))) return { b: q(m[1]), m: R(m[2]) };
  if ((m = s.match(new RegExp(`tank holds ${N} gallons and (?:drains ${N} gallons per minute|loses ${N} gallons every ${N} minutes)`)))) return { b: q(m[1]), m: (m[2] ? R(m[2]) : R(m[3], q(m[4]))).neg() };
  if ((m = s.match(new RegExp(`At midnight it is ${N}°F\\. After that the temperature (falls|rises) ${N}°F each hour`)))) return { b: q(m[1]), m: m[2] === 'falls' ? R(m[3]).neg() : R(m[3]) };
  if ((m = s.match(new RegExp(`Maya has \\$${N} saved and adds \\$${N} (?:each week|every ${N} weeks)`)))) return { b: q(m[1]), m: R(m[2], m[3] ? q(m[3]) : 1) };
  return null;
}
const DISCRETE = /\b(drinks?|pizzas?)\b/;

// ---------------------------------------------------------------- units
const SING = { dollars: 'dollar', hours: 'hour', inches: 'inch', feet: 'foot', gallons: 'gallon', miles: 'mile', weeks: 'week',
  months: 'month', minutes: 'minute', 'degrees fahrenheit': 'degree fahrenheit', gb: 'gb', drinks: 'drink', pizzas: 'pizza', years: 'year', days: 'day' };
const sing = u => SING[u.toLowerCase()] ?? u.toLowerCase().replace(/s$/, '');
/** "where C is the cost in dollars and h is the time in hours" → { out: 'dollars', in: 'hours' } */
function unitsOf(p) {
  const m = String(p).match(/where \w is the [\w ]+? in ([\w ]+?) and \w is the [\w ]+? in ([\w ]+?)\./);
  return m ? { out: m[1].trim(), in: m[2].trim() } : null;
}

// ---------------------------------------------------------------- the families
const S = {};

// change per ONE unit (or per the stated step) from a table
S.tableRate = q0 => {
  const T = tableLine(tableOf(q0));
  if (!T) return undefined;
  const k = q0.prompt.match(new RegExp(`goes up by ${N}`));
  return val(k ? T.m.mul(q(k[1])) : T.m);
};

// two lines: which grows faster (greater m)
S.fasterLine = q0 => {
  const ls = drawnLines(q0).filter(l => l.name);
  if (ls.length !== 2) return undefined;
  const [u, v] = ls;
  if (u.m.eq(v.m)) return only(q0, c => /same rate/.test(c));
  const fast = u.m.cmp(v.m) > 0 ? u : v;
  return only(q0, c => c.startsWith(`${fast.name}’s`));
};

// the output at input 0 (or the stated input) from a table, walking back with the rate
S.startTable = q0 => {
  const rows = tableOf(q0);
  const at = q0.prompt.match(new RegExp(`output at input ${N}`));
  const x0 = at ? q(at[1]) : Q(0);
  const direct = tableAt(rows, x0);
  const T = tableLine(rows);
  if (T) return val(T.m.mul(x0).add(T.b));
  return direct ? val(direct) : undefined;
};

// b from the graph: the drawn line's crossing, or two named points when the window does not reach x = 0
S.startGraph = q0 => {
  const P = namedPoints(q0.prompt);
  if (P.A && P.B) { const m = slopeOf(P.A, P.B); return val(P.A[1].sub(m.mul(P.A[0]))); }
  const ls = drawnLines(q0);
  if (ls.length === 1) return val(ls[0].b);
  return undefined;
};

// rate from two marked points read off scaled axes
S.scaledRate = q0 => {
  const P = ptsOf(q0);
  if (!P.A || !P.B) return undefined;
  return val(slopeOf(P.A, P.B));
};

// which sentence says the rate
function rateClaim(c) {
  let m;
  if ((m = c.match(new RegExp(`goes (up|down) \\$?${N}°?\\s*(?:[\\w.]+(?: Fahrenheit)?)? for every ${N} `)))) {
    const r = q(m[2]).div(q(m[3]));
    return m[1] === 'down' ? r.neg() : r;
  }
  if ((m = c.match(new RegExp(`stays \\$?${N}[^:]*: it changes by \\$?${N} for every`)))) return q(m[2]);
  return null; // "The cost is $30." / "There is no rate" say no rate
}
S.rateSentence = q0 => {
  let r;
  const T = tableLine(tableOf(q0));
  if (T) r = T.m;
  else if (/same however many/.test(q0.prompt)) r = Q(0);
  if (!r) return undefined;
  return only(q0, c => { const k = rateClaim(c); return k !== null && k.eq(r); });
};

// the unit of m, of the term mx, of b
S.rateUnit = q0 => {
  const U = unitsOf(q0.prompt);
  if (!U) return undefined;
  const cap = s => s.toLowerCase();
  let want;
  if (/unit of the slope/.test(q0.prompt)) want = `${cap(U.out)} per ${sing(U.in)}`;
  else if (/unit of the term|unit of b =/.test(q0.prompt)) want = cap(U.out);
  else return undefined;
  return only(q0, c => c.toLowerCase() === want);
};

// spot m or b in an equation
S.pickMB = q0 => {
  const m = q0.prompt.match(/^In (.+?), what is the (slope m|initial value b)/);
  if (!m) return undefined;
  const e = parseEq(m[1]);
  if (!e) return undefined;
  return val(m[2] === 'slope m' ? e.m : e.b);
};

// which equation has the given m and b
S.sameFunction = q0 => {
  const m = q0.prompt.match(new RegExp(`slope m = ${N} and initial value b = ${N}`));
  if (!m) return undefined;
  return only(q0, c => sameMB(parseEq(c), q(m[1]), q(m[2])));
};

// line A → line B: what changed
function changeTrue(c, A, B) {
  const dm = !A.m.eq(B.m), db = !A.b.eq(B.b);
  const abs = x => (x.cmp(0) < 0 ? x.neg() : x);
  let m;
  if (/^Both m and b changed/.test(c)) return dm && db;
  if (/^Only b/.test(c)) {
    if (dm || !db) return false;
    if ((m = c.match(new RegExp(`moved (up|down) ${N}`)))) return B.b.sub(A.b).eq(m[1] === 'up' ? q(m[2]) : q(m[2]).neg());
    if (/moved up/.test(c)) return B.b.cmp(A.b) > 0;
    if (/moved down/.test(c)) return B.b.cmp(A.b) < 0;
    return false;
  }
  if (/^Only m/.test(c)) {
    if (!dm || db) return false;
    if (/because it is (higher|lower)/.test(c)) return false; // height says nothing about steepness
    if (/falls instead of rising/.test(c)) return A.m.cmp(0) > 0 && B.m.cmp(0) < 0;
    if (/rises instead of falling/.test(c)) return A.m.cmp(0) < 0 && B.m.cmp(0) > 0;
    if (/less steep/.test(c)) return abs(B.m).cmp(abs(A.m)) < 0;
    if (/steeper/.test(c)) return abs(B.m).cmp(abs(A.m)) > 0;
    return false;
  }
  return false;
}
S.whatChanged = q0 => {
  const ls = drawnLines(q0);
  const A = ls.find(l => l.name === 'A'), B = ls.find(l => l.name === 'B');
  if (!A || !B) return undefined;
  return only(q0, c => changeTrue(c, A, B));
};

// y = m1 x + b1 changed to y = m2 x + b2: what happens to the graph
function shiftTrue(c, E, F) {
  const abs = x => (x.cmp(0) < 0 ? x.neg() : x);
  const sameM = E.m.eq(F.m), db = F.b.sub(E.b);
  let m;
  if (/^Nothing changes/.test(c)) return sameM && db.n === 0;
  if ((m = c.match(new RegExp(`^It moves (up|down) ${N}`)))) return sameM && db.eq(m[1] === 'up' ? q(m[2]) : q(m[2]).neg());
  if ((m = c.match(new RegExp(`^It moves (left|right) ${N}`)))) {
    // y = m(x − h) + b: right h means the new b is b − m·h
    if (!sameM || E.m.n === 0) return false;
    const h = m[1] === 'right' ? q(m[2]) : q(m[2]).neg();
    return db.eq(E.m.mul(h).neg());
  }
  if ((m = c.match(/^It (falls|rises) instead, still through (.+?)\.$/))) {
    const P = pt(m[2]);
    const ok = m[1] === 'falls' ? E.m.cmp(0) > 0 && F.m.cmp(0) < 0 : E.m.cmp(0) < 0 && F.m.cmp(0) > 0;
    return ok && !!P && P[1].eq(E.m.mul(P[0]).add(E.b)) && P[1].eq(F.m.mul(P[0]).add(F.b));
  }
  if ((m = c.match(/^It gets steeper and still crosses the y-axis at (.+?)\.$/))) {
    const P = pt(m[1]);
    return abs(F.m).cmp(abs(E.m)) > 0 && !!P && P[0].n === 0 && P[1].eq(E.b) && P[1].eq(F.b);
  }
  if (/^It gets steeper\.?$/.test(c)) return abs(F.m).cmp(abs(E.m)) > 0;
  return false;
}
S.predictShift = q0 => {
  const m = q0.prompt.match(/^The line (.+?) is changed to (.+?)\. What happens/);
  if (!m) return undefined;
  const E = parseEq(m[1]), F = parseEq(m[2]);
  if (!E || !F) return undefined;
  return only(q0, c => shiftTrue(c, E, F));
};

// a story → its equation (choice) or the two boxes m and b
S.storyToEq = q0 => {
  const st = story(q0.prompt);
  if (!st) return undefined;
  return only(q0, c => sameMB(parseEq(c), st.m, st.b));
};
S.storyPair = q0 => {
  const st = story(q0.prompt);
  return st ? [val(st.m), val(st.b)] : undefined;
};

// slope from two points (prompt coordinates)
S.twoPointRate = q0 => {
  const P = namedPoints(q0.prompt);
  if (!P.A || !P.B) return undefined;
  const m = slopeOf(P.A, P.B);
  return m ? val(m) : undefined;
};
S.specialSlope = q0 => {
  const P = namedPoints(q0.prompt);
  if (!P.A || !P.B) return undefined;
  const m = slopeOf(P.A, P.B);
  if (!m) return only(q0, c => /no finite slope/.test(c) && /change in x is 0/.test(c) || /no finite slope/.test(c) && !/change in y/.test(c));
  return only(q0, c => /^[−-]?\d+(\.\d+)?$/.test(c.trim()) && q(c).eq(m));
};

// linear or not (a table)
S.isLinear = q0 => {
  const rows = tableOf(q0);
  if (!rows) return undefined;
  const lin = !!tableLine(rows);
  const rates = rows.slice(1).map((r, i) => slopeOf(rows[i], r));
  return only(q0, c => {
    if (/^Yes/.test(c) !== lin) return false;
    if (/change per ONE unit of input is the same between every two rows/.test(c)) return lin;
    let m;
    if ((m = c.match(/not the same between rows (\d+) and (\d+)/))) {
      const i = Number(m[1]) - 1, j = Number(m[2]) - 1;
      if (j !== i + 1 || !rates[i]) return false;
      return rates.some((r, k) => k !== i && r && !r.eq(rates[i])) && (i === 0 ? !rates[1].eq(rates[0]) : !rates[i].eq(rates[0]));
    }
    return false; // "outputs go up every time", "first two steps match", "would need to start at 0", "does not start at (0, 0)"…: no proof
  });
};

// does the rule fit the table
S.fitsRule = q0 => {
  const m0 = q0.prompt.match(/the rule (.+?) fits this table/);
  const rows = tableOf(q0);
  if (!m0 || !rows) return undefined;
  const e = parseEq(m0[1]);
  if (!e) return undefined;
  const f = x => e.m.mul(x).add(e.b);
  const fits = rows.every(([x, y]) => f(x).eq(y));
  return only(q0, c => {
    if (/^Yes: it gives every output in the table/.test(c)) return fits;
    let m;
    if ((m = c.match(new RegExp(`^No: at x = ${N} it gives ${N}, not ${N}`)))) {
      const x = q(m[1]), y = tableAt(rows, x);
      return !fits && !!y && f(x).eq(q(m[2])) && y.eq(q(m[3])) && !y.eq(q(m[2]));
    }
    return false; // "b should be the first output", "does not start at x = 0", "it is a straight line", "works for the first row", "changes by m each row"
  });
};

// b from a slope and a point
S.backSolve = q0 => {
  let m;
  if ((m = q0.prompt.match(new RegExp(`slope ${N} and goes through P\\(${N}, ${N}\\)`)))) return val(q(m[3]).sub(q(m[1]).mul(q(m[2]))));
  if ((m = q0.prompt.match(new RegExp(`is \\$${N} per (?:\\w+) plus the [\\w ]+?\\. For ${N} \\w+ it comes to \\$${N}`)))) return val(q(m[3]).sub(q(m[1]).mul(q(m[2]))));
  return undefined;
};

// equation from two points / a table / a graph
function mbFrom(P1, P2) { const m = slopeOf(P1, P2); return m ? [m, P1[1].sub(m.mul(P1[0]))] : null; }
S.eqTwoPoints = q0 => {
  const P = namedPoints(q0.prompt);
  const r = P.A && P.B && mbFrom(P.A, P.B);
  return r ? r.map(val) : undefined;
};
S.eqFromTable = q0 => {
  const T = tableLine(tableOf(q0));
  if (!T) return undefined;
  return only(q0, c => sameMB(parseEq(c), T.m, T.b));
};
S.graphToEq = q0 => {
  const P = ptsOf(q0);
  const r = P.A && P.B && mbFrom(P.A, P.B);
  return r ? r.map(val) : undefined;
};

// points on the graph of an equation
S.onTheLine = q0 => {
  const E = eqsIn(q0.prompt)[0];
  if (!E) return undefined;
  const on = P => P && P[1].eq(E.m.mul(P[0]).add(E.b));
  if (/Which point is also on its graph/.test(q0.prompt)) return only(q0, c => /^\(.*\)$/.test(c.trim()) && on(pt(c)));
  const m = q0.prompt.match(/Is (\(.+?\)) on the graph/);
  if (!m) return undefined;
  const P = pt(m[1]);
  if (on(P)) return only(q0, c => /^Yes: it solves the equation/.test(c));
  const want = E.m.mul(P[0]).add(E.b);
  return only(q0, c => { const k = c.match(new RegExp(`^No: y would have to be ${N} there`)); return !!k && q(k[1]).eq(want); });
};
S.plotPoint = q0 => {
  const m = q0.prompt.match(new RegExp(`^Graph (.+?) point by point\\..*next point has x = ${N}`));
  if (!m) return undefined;
  const E = parseEq(m[1]);
  return E ? val(E.m.mul(q(m[2])).add(E.b)) : undefined;
};
S.slopeStep = q0 => {
  const m = q0.prompt.match(new RegExp(`Start at \\(${N}, ${N}\\)\\. Take ONE slope step \\(run ${N} right, then rise ${N}\\)`));
  if (!m) return undefined;
  return [val(q(m[1]).add(q(m[3]))), val(q(m[2]).add(q(m[4])))];
};
S.whichGraph = q0 => {
  const ls = drawnLines(q0).filter(l => l.name);
  let m;
  if ((m = q0.prompt.match(/^Which line is the graph of (.+?)\?$/))) {
    const E = parseEq(m[1]);
    const hit = ls.filter(l => l.m.eq(E.m) && l.b.eq(E.b));
    if (hit.length !== 1) return -1;
    return only(q0, c => c === `Line ${hit[0].name}`);
  }
  if ((m = q0.prompt.match(/^Which equation belongs to line ([A-Z])\?$/))) {
    const l = ls.find(x => x.name === m[1]);
    return l ? only(q0, c => sameMB(parseEq(c), l.m, l.b)) : undefined;
  }
  return undefined;
};

// axis scale: the smallest step per square that still reaches the top value
S.chooseScale = q0 => {
  const st = story(q0.prompt);
  const m = q0.prompt.match(new RegExp(`graph runs to ${N} \\w+.*?has ${N} squares`));
  if (!st || !m) return undefined;
  const X = q(m[1]), K = q(m[2]);
  const top = [st.b, st.m.mul(X).add(st.b)].reduce((a, b) => (a.cmp(b) >= 0 ? a : b));
  const steps = (q0.choices ?? []).map(c => { const k = c.match(new RegExp(`^${N} per square`)); return k ? q(k[1]) : null; });
  let best = -1;
  steps.forEach((s, i) => { if (s && s.mul(K).cmp(top) >= 0 && (best < 0 || s.cmp(steps[best]) < 0)) best = i; });
  return best;
};

// read a value off a scaled graph (the story's line)
S.scaledRead = q0 => {
  const st = story(q0.prompt);
  const m = q0.prompt.match(new RegExp(`at ${N} \\w+\\? Watch`));
  if (!st || !m) return undefined;
  return val(st.m.mul(q(m[1])).add(st.b));
};

// dots, a segment or a line
S.dotsOrLine = q0 => {
  const m = q0.prompt.match(new RegExp(`plotted for ${N} to ${N} (\\w+)`));
  if (!m) return undefined;
  const lo = q(m[1]), hi = q(m[2]);
  const disc = DISCRETE.test(m[3]);
  return only(q0, c => {
    let k;
    if (disc && (k = c.match(new RegExp(`^Dots at ${N}, ${N}, ${N}, …, ${N}$`)))) return q(k[1]).eq(lo) && q(k[4]).eq(hi) && q(k[2]).eq(lo.add(1)) && q(k[3]).eq(lo.add(2));
    if (!disc && (k = c.match(new RegExp(`^A solid line segment from ${N} to ${N}$`)))) return q(k[1]).eq(lo) && q(k[2]).eq(hi);
    return false; // "only the plotted dots" (the story goes on between them), "a line that goes on forever"
  });
};

// convert a rate's units
S.convertRate = q0 => {
  const m = q0.prompt.match(new RegExp(`rate (\\$)?${N}(?: ([\\w ]+?))? per (hour|minute) in ([\\w ]+?) per (hour|minute)\\.`));
  if (!m) return undefined;
  const MIN = { hour: 60, minute: 1 }; // minutes in the time unit
  let r = q(m[2]).div(MIN[m[4]]).mul(MIN[m[6]]);
  // the amount unit: dollars → cents multiplies by 100; otherwise the same unit on both sides
  const from = m[1] ? 'dollars' : m[3], to = m[5].trim();
  if (from === 'dollars' && to === 'cents') r = r.mul(100);
  else if (from !== to) return undefined;
  return val(r);
};

// rewrite an equation in new units
S.rewriteEq = q0 => {
  const E = eqsIn(q0.prompt)[0];
  if (!E) return undefined;
  let m, b;
  if (/K = the cost in CENTS/.test(q0.prompt)) { m = E.m.mul(100); b = E.b.mul(100); } else if (/t = the time in MINUTES/.test(q0.prompt)) { m = E.m.div(60); b = E.b; } else return undefined;
  return only(q0, c => sameMB(parseEq(c), m, b));
};

// what b means
S.interceptMeaning = q0 => {
  const p = q0.prompt;
  let m;
  if ((m = p.match(new RegExp(`meets the (\\w+) axis at \\(${N}, ${N}\\)`)))) {
    const st = story(p);
    const x = q(m[2]), y = q(m[3]);
    if (x.n !== 0 || (st && !st.b.eq(y))) return -1;
    return only(q0, c => { const k = c.match(new RegExp(`^At ${N} \\w+, the (\\w+) is \\$?${N}`)); return !!k && q(k[1]).n === 0 && k[2] === m[1] && q(k[3]).eq(y); });
  }
  if ((m = p.match(new RegExp(`So \\w = (.+?)\\. Does b = ${N} have a real meaning`)))) {
    const st = story(p), E = parseEq(`y = ${m[1]}`);
    if (!st || !E || !E.b.eq(q(m[2])) || !st.b.eq(E.b)) return -1;
    return only(q0, c => { const k = c.match(new RegExp(`^Yes: it is the [\\w ]+?, \\$?${N}, paid even at ${N} `)); return !!k && q(k[1]).eq(E.b) && q(k[2]).n === 0; });
  }
  if ((m = p.match(new RegExp(`: (\\w = .+?) \\(inches\\),? for (ages|days) ${N} to ${N}.*?Does b = ${N} mean the [\\w ]+? at (?:age|day) ${N}\\?`)))) {
    const lo = q(m[3]), hi = q(m[4]), at = q(m[6]);
    const inside = at.cmp(lo) >= 0 && at.cmp(hi) <= 0;
    if (!inside) return only(q0, c => { const k = c.match(new RegExp(`^No: the model only fits (?:ages|days) ${N} to ${N}`)); return !!k && q(k[1]).eq(lo) && q(k[2]).eq(hi); });
    const E = parseEq(m[1]);
    return only(q0, c => { const k = c.match(new RegExp(`^Yes: at (?:age|day) ${N} the [\\w ]+? was ${N}`)); return !!k && q(k[1]).eq(at) && q(k[2]).eq(E.m.mul(at).add(E.b)); });
  }
  return undefined;
};

// proportional: through (0, 0)
S.isProportional = q0 => {
  let b;
  const E = eqsIn(q0.prompt)[0];
  if (E) b = E.b;
  else { const ls = drawnLines(q0); if (ls.length !== 1) return undefined; b = ls[0].b; }
  const prop = b.n === 0;
  return only(q0, c => {
    if (/^Yes: it goes through \(0, 0\), and double/.test(c)) return prop;
    const k = c.match(new RegExp(`^No: at ${N} \\w+ it is already \\$?${N}, so doubling`));
    if (k) return !prop && q(k[1]).n === 0 && q(k[2]).eq(b);
    return false; // "it is linear so it can't be", "only linear", "same $R every…", "a straight line": no proof
  });
};

// double the input: the fee is paid once
S.doubleInput = q0 => {
  const st = story(q0.prompt);
  const m = q0.prompt.match(new RegExp(`What do ${N} \\w+ cost\\?`));
  if (!st || !m) return undefined;
  return val(st.m.mul(q(m[1])).add(st.b));
};

// evidence for "the b is the fee" / "the m is the price per unit"
S.whichEvidence = q0 => {
  const rows = tableOf(q0);
  const E = eqsIn(q0.prompt)[0];
  const m = q0.prompt.match(new RegExp(`Claim: the ${N} is the (.+?)\\. Which`));
  if (!rows || !E || !m) return undefined;
  const k = q(m[1]);
  const perUnit = /^price per/.test(m[2]);
  return only(q0, c => {
    let x;
    if (!perUnit && (x = c.match(new RegExp(`^At \\w = ${N} the table gives \\$?${N}: you pay it before using anything`)))) {
      const y = tableAt(rows, q(x[1]));
      return q(x[1]).n === 0 && !!y && y.eq(q(x[2])) && y.eq(k);
    }
    if (perUnit && (x = c.match(new RegExp(`^From \\w = ${N} to ${N} the cost goes \\$?${N} → \\$?${N}: \\$?${N} more for one`)))) {
      const a = q(x[1]), b = q(x[2]), ya = tableAt(rows, a), yb = tableAt(rows, b);
      return b.sub(a).eq(1) && !!ya && !!yb && ya.eq(q(x[3])) && yb.eq(q(x[4])) && yb.sub(ya).eq(q(x[5])) && q(x[5]).eq(k);
    }
    return false; // "the last number", "the constant term", "the slope, so…", "At h = 1 the cost is $32" prove nothing
  });
};

// settle a wrong claim about m or b with numbers from the table
S.refuteClaim = q0 => {
  const rows = tableOf(q0);
  const st = story(q0.prompt);
  if (!rows || !st) return undefined;
  const f = x => st.m.mul(x).add(st.b);
  const at = x => tableAt(rows, x) ?? f(x);
  return only(q0, c => {
    let x;
    if ((x = c.match(new RegExp(`^From ${N} to ${N} \\w+ the cost goes \\$?${N} → \\$?${N}: ${N} dollars for ONE \\w+, so dollars per`)))) {
      const a = q(x[1]), b = q(x[2]);
      return /unit of the slope/.test(q0.prompt) && b.sub(a).eq(1) && at(a).eq(q(x[3])) && at(b).eq(q(x[4])) && q(x[4]).sub(q(x[3])).eq(q(x[5])) && q(x[5]).eq(st.m);
    }
    if ((x = c.match(new RegExp(`^${N} \\w+ costs \\$?${N} and ${N} cost \\$?${N}: each extra \\w+ adds \\$?${N}`)))) {
      return /in total/.test(q0.prompt) && at(q(x[1])).eq(q(x[2])) && at(q(x[3])).eq(q(x[4])) && q(x[3]).sub(q(x[1])).eq(1) && q(x[4]).sub(q(x[2])).eq(q(x[5])) && q(x[5]).eq(st.m);
    }
    if ((x = c.match(new RegExp(`^At ${N} \\w+ the cost is already \\$?${N}, and it is \\$?${N} after ${N} \\w+: only \\$?${N} more`)))) {
      return /per (hour|month|GB)\. Which/.test(q0.prompt) && q(x[1]).n === 0 && at(Q(0)).eq(q(x[2])) && at(q(x[4])).eq(q(x[3])) && q(x[4]).eq(1) && q(x[3]).sub(q(x[2])).eq(q(x[5]));
    }
    return false; // "X is right/wrong because …": no numbers, no evidence
  });
};

// inputs that make sense: from 0 until the amount runs out (whole numbers for things you count)
S.validInputs = q0 => {
  const st = story(q0.prompt);
  if (!st || st.m.cmp(0) >= 0) return undefined; // every story here runs down
  const end = st.b.div(st.m.neg());
  if (st.disc) {
    const n = Math.floor(end.value + 1e-9);
    return only(q0, c => { const k = c.match(new RegExp(`^Whole numbers from ${N} to ${N}$`)); return !!k && q(k[1]).n === 0 && q(k[2]).eq(n); });
  }
  return only(q0, c => { const k = c.match(new RegExp(`^${N} ≤ \\w ≤ ${N}$`)); return !!k && q(k[1]).n === 0 && q(k[2]).eq(end); });
};

// predict inside the stated range
S.predict = q0 => {
  const E = eqsIn(q0.prompt)[0];
  const m = q0.prompt.match(new RegExp(`Predict the [\\w ]+? at ${N} \\w+\\.`));
  if (!E || !m) return undefined;
  return val(E.m.mul(q(m[1])).add(E.b));
};

// can the model say? outside its range it cannot
S.predictValid = q0 => {
  const E = eqsIn(q0.prompt)[0];
  const m = q0.prompt.match(new RegExp(`valid for ${N} to ${N} [\\w ]+?\\. What does it predict at ${N} `));
  if (!E || !m) return undefined;
  const lo = q(m[1]), hi = q(m[2]), x = q(m[3]);
  if (x.cmp(lo) < 0 || x.cmp(hi) > 0) return only(q0, c => new RegExp(`^No safe prediction: ${m[3]} is outside ${m[1]} to ${m[2]}`).test(c));
  const y = E.m.mul(x).add(E.b);
  return only(q0, c => { const k = c.match(new RegExp(`^\\$?${N}(?: in\\.)?$`)); return !!k && q(k[1]).eq(y); });
};

// ---------------------------------------------------------------- solve
function solve(q0) {
  const f = S[q0.family];
  if (!f) return undefined;
  try { return f(q0); } catch { return undefined; }
}

// ---------------------------------------------------------------- sane: the world and the picture
function sane(q0) {
  const out = [];
  const p = q0.prompt;
  const st = story(p);
  const lm = lmOf(q0);
  const SHOW = q0.data?.picture?.lf?.show ?? [];
  const ls = drawnLines(q0).filter((l, k) => SHOW.includes(['line', 'line2', 'line3'][k]));
  const rows = tableOf(q0);
  // the story's own numbers: no negative or zero prices, heights, amounts
  if (st) {
    if (/charges an? |costs \$[\d.]+ a month|Maya|gift card/.test(p) && st.b.cmp(0) < 0) out.push('a negative fee or balance');
    if (/charges an? |costs \$[\d.]+ a month|Maya/.test(p) && st.m.cmp(0) <= 0) out.push('a price per unit that is not positive');
  }
  // the table and the drawn line agree (a table that is drawn as a line must be on it)
  if (rows && ls.length === 1 && !/area of a square/.test(p) && !/fits this table/.test(p)) {
    const l = ls[0];
    if (!rows.every(([x, y]) => l.m.mul(x).add(l.b).eq(y)) && tableLine(rows)) out.push('the drawn line misses the table rows');
  }
  // marked points lie on the drawn line
  if (lm?.pts && ls.length === 1 && !/area of a square/.test(p) && !/fits this table/.test(p) && !ls[0].dots) {
    const l = ls[0];
    for (const P of lm.pts) if (!Q(P.y).eq(l.m.mul(Q(P.x)).add(l.b))) { out.push('a marked point is off the drawn line'); break; }
  }
  // points the student must read are inside the window and on grid lines
  if (['scaledRate', 'graphToEq'].includes(q0.family) && lm) {
    for (const P of lm.pts ?? []) {
      if (P.x < lm.x.min || P.x > lm.x.max || P.y < lm.y.min || P.y > lm.y.max) out.push('a marked point is outside the window');
      if (Math.abs(2 * P.x / lm.x.step - Math.round(2 * P.x / lm.x.step)) > 1e-9 || Math.abs(2 * P.y / lm.y.step - Math.round(2 * P.y / lm.y.step)) > 1e-9) out.push('a marked point is not on a grid line or halfway between two (cannot be read)');
    }
    const m = p.match(new RegExp(`each grid square is ${N} across and ${N} up`));
    if (m && (Number(m[1].replace('−', '-')) !== lm.x.step || Number(m[2].replace('−', '-')) !== lm.y.step)) out.push('the stated grid scale is not the drawn one');
  }
  // the graph's line matches the story
  if (st && ls.length >= 1 && ['scaledRead', 'chooseScale', 'doubleInput', 'storyToEq', 'storyPair', 'interceptMeaning'].includes(q0.family)) {
    if (!ls.some(l => l.m.eq(st.m) && l.b.eq(st.b))) out.push('the drawn line is not the story');
  }
  // the y-intercept to be read on a plain graph is inside the window
  if (q0.family === 'startGraph' && /cross the y-axis/.test(p) && lm && ls[0] && (ls[0].b.value < lm.y.min || ls[0].b.value > lm.y.max)) out.push('the crossing is outside the window');
  if (q0.family === 'scaledRead' && lm) {
    const m = p.match(new RegExp(`at ${N} \\w+\\? Watch`));
    if (m && st) { const y = st.m.mul(q(m[1])).add(st.b).value; if (y < lm.y.min || y > lm.y.max || q(m[1]).value > lm.x.max) out.push('the value to read is outside the window'); if (y < 0) out.push('a negative amount read off the graph'); }
  }
  // fasterLine: "higher everywhere" must be true in the window
  if (q0.family === 'fasterLine' && lm) {
    const m = p.match(/(\w+)’s (?:plan|plant) is higher everywhere/);
    if (m) {
      const me = ls.find(l => l.name === m[1]), other = ls.find(l => l.name && l.name !== m[1]);
      if (me && other) for (const x of [lm.x.min, lm.x.max]) if (me.m.mul(Q(x)).add(me.b).cmp(other.m.mul(Q(x)).add(other.b)) <= 0) { out.push('the "higher everywhere" line is not higher everywhere'); break; }
    }
  }
  // chooseScale: the stated end value is the story's
  if (q0.family === 'chooseScale' && st) {
    const m = p.match(new RegExp(`runs to ${N} \\w+, so the \\w+ reaches \\$?${N}`));
    if (m) {
      const end = st.m.mul(q(m[1])).add(st.b);
      const top = end.cmp(st.b) >= 0 ? end : st.b;
      if (!q(m[2]).eq(top) && !q(m[2]).eq(end)) out.push('the stated top value is not the story’s');
      if (end.cmp(0) < 0) out.push('the amount goes below 0 inside the graph');
    }
  }
  // dotsOrLine / predict: the range stays physical
  if (['dotsOrLine', 'predict'].includes(q0.family) && st) {
    const m = p.match(new RegExp(`(?:plotted for|holds for) ${N} to ${N}`));
    if (m && st.m.mul(q(m[2])).add(st.b).cmp(0) < 0) out.push('the amount goes below 0 inside the stated range');
    const k = p.match(new RegExp(`Predict the [\\w ]+? at ${N} `));
    if (m && k && (q(k[1]).cmp(q(m[1])) < 0 || q(k[1]).cmp(q(m[2])) > 0)) out.push('the prediction asked is outside the range the model holds for');
  }
  // twoPointRate / specialSlope / eqTwoPoints: two different points
  if (['twoPointRate', 'eqTwoPoints', 'specialSlope'].includes(q0.family)) {
    const P = namedPoints(p);
    if (P.A && P.B && P.A[0].eq(P.B[0]) && P.A[1].eq(P.B[1])) out.push('A and B are the same point');
    if (q0.family !== 'specialSlope' && P.A && P.B && P.A[0].eq(P.B[0])) out.push('a vertical line asked for a number slope');
  }
  // a told story equation must be the story
  if (st && ['rateUnit', 'isProportional', 'predict', 'refuteClaim', 'validInputs'].includes(q0.family)) {
    const E = eqsIn(p)[0];
    if (E && !(E.m.eq(st.m) && E.b.eq(st.b))) out.push('the equation in the prompt is not the story');
  }
  // whichGraph: the three lines are different
  if (q0.family === 'whichGraph') {
    const named = ls.filter(l => l.name);
    for (let i = 0; i < named.length; i++) for (let j = i + 1; j < named.length; j++) if (named[i].m.eq(named[j].m) && named[i].b.eq(named[j].b)) out.push('two drawn lines are the same line');
  }
  // a choice question needs exactly one right choice
  if (q0.input === 'choice') {
    const s = solve(q0);
    if (s === -1) out.push('no single right choice');
  }
  return [...new Set(out)].join('; ');
}

export default { solve, sane };
