// Oracle for the lesson "slope-and-lines" (slope, y = kx, y = mx + b, 8.EE.B.5-6 / 8.F). Written from what the student
// sees only (docs/lessons/QUALITY_LAYER.md, "O: the oracle"): the prompt, the board, the choices, the table cells and the
// drawn graph. Anything listed in the picture's `hide` (revealed only after the answer) is ignored. Lines are read as
// drawn (a line's slope and crossing are what the grid shows); points and triangles are read from their drawn corners.
// Every choice is judged by the maths of its claim; a choice question returns -1 when no single choice is right.
import { Q, texPlain, choiceWhere } from '../../tools/quality/oracle-kit.mjs';

// ---------------------------------------------------------------- reading numbers and lines
const norm = s => String(s ?? '').replace(/[−–]/g, '-');
/** '−3' '$2.50' '3/4' '1,450' '−1/2' → exact Q */
function qs(s) {
  const t = norm(s).replace(/[$,\s]/g, '').replace(/%$/, '');
  let m = t.match(/^(-?)(\d+)\/(\d+)$/);
  if (m) return Q(Number(m[2]), Number(m[3])).mul(m[1] ? -1 : 1);
  m = t.match(/^(-?)(\d*)(?:\.(\d+))?$/);
  if (!m || (m[2] === '' && !m[3])) throw new Error(`not a number: ${s}`);
  const d = m[3] ? 10 ** m[3].length : 1, n = Number((m[2] || '0') + (m[3] || ''));
  return Q(m[1] ? -n : n, d);
}
const NUM = '[−-]?\\$?\\d+(?:\\.\\d+)?(?:\\/\\d+)?';
/** every number of a text (a/b kept as one fraction), as Q */
const numsQ = t => [...String(t).matchAll(new RegExp(`(?<![\\w.])${NUM}`, 'g'))].map(m => qs(m[0]));
/** "(−2, 5)" pairs of a text, as [Q, Q] */
const pts = t => [...norm(t).matchAll(/\((-?\d+(?:\.\d+)?(?:\/\d+)?),\s*(-?\d+(?:\.\d+)?(?:\/\d+)?)\)/g)].map(m => [qs(m[1]), qs(m[2])]);
/** a linear expression in x ("−1/2x − 4", "3x", "−x + 2", "5") → { m, b } */
function linExpr(text) {
  const s = norm(text).replace(/\s+/g, '').replace(/·/g, '');
  if (!s || /[^-+\d./x]/.test(s)) return null;
  let m = Q(0), b = Q(0), i = 0;
  const re = /([+-]?)(\d+(?:\.\d+)?(?:\/\d+)?)?(x?)/y;
  while (i < s.length) {
    re.lastIndex = i;
    const t = re.exec(s);
    if (!t || t[0] === '') return null;
    i = re.lastIndex;
    if (!t[2] && !t[3]) return null;
    let k = t[2] ? qs(t[2]) : Q(1);
    if (t[1] === '-') k = k.neg();
    if (t[3]) m = m.add(k); else b = b.add(k);
  }
  return { m, b };
}
/** the line "y = …" in a text */
function eqIn(text) {
  const m = norm(text).match(/\by = ([-+\d./x\s]+?)(?=\?|,|:|\.\s|\.$|\s\(|\swith\b|\sfor\b|\safter\b|\s+as\b|$)/);
  return m ? linExpr(m[1]) : null;
}
const at = (L, x) => L.m.mul(x).add(L.b);
const slopeOf = (p, q) => q[1].sub(p[1]).div(q[0].sub(p[0]));
const sameLine = (u, v) => u && v && u.m.eq(v.m) && u.b.eq(v.b);
const near = (a, b) => Math.abs(a - b) < 1e-9;

// ---------------------------------------------------------------- the picture (only what is drawn)
const picOf = q => q.data?.picture ?? {};
const hidden = q => new Set(picOf(q).hide ?? []);
function graphOf(q) {
  const g = picOf(q).graph;
  if (!g) return null;
  const H = hidden(q);
  return {
    ...g,
    lines: (g.lines ?? []).filter(L => !H.has(`line:${L.id}`)),
    points: (g.points ?? []).filter(p => !H.has(`pt:${p.id}`)),
    tris: (g.tris ?? []).filter(t => !H.has(`tri:${t.id}`)),
  };
}
/** a drawn straight line as { m, b } (exact) */
const drawn = L => (L.vx !== undefined || L.curve ? null : { m: Q(L.m), b: Q(L.b) });
/** the table rows as [Q, Q] (cells '$14', '−2'); null when a cell is not a number */
function rowsOf(q) {
  const t = picOf(q).table;
  if (!t) return null;
  try { return t.rows.map(r => [qs(r[0]), qs(r[1])]); } catch { return null; }
}
/** the rates between consecutive rows */
const ratesOf = rows => rows.slice(1).map((r, i) => slopeOf(rows[i], r));
const allEq = arr => arr.every(v => v.eq(arr[0]));
/** slope of a linear table (all row pairs agree), else null */
function tableSlope(rows) {
  if (!rows || rows.length < 2) return null;
  const s = slopeOf(rows[0], rows[1]);
  for (let i = 0; i < rows.length; i++) for (let j = i + 1; j < rows.length; j++) if (!slopeOf(rows[i], rows[j]).eq(s)) return null;
  return s;
}
const singular = w => String(w).trim().toLowerCase().replace(/ies$/, 'y').replace(/s$/, '');
/** the unit word inside an axis name: 'time (min)' → minute, 'time (h)' → hour, 'weeks' → week */
function axisUnit(name) {
  const u = (String(name).match(/\(([^)]+)\)/)?.[1] ?? name).trim();
  return { min: 'minute', h: 'hour', wk: 'week', mi: 'mile', gal: 'gallon', lb: 'pound', $: 'dollar', '°F': '°F', '%': 'percent', GB: 'gigabyte' }[u] ?? singular(u);
}

// ---------------------------------------------------------------- the families
const F = {};

// rise for a run of 1 between the two board points
F.unitRate = q => { const p = pts(texPlain(q.board)); return p.length >= 2 ? slopeOf(p[0], p[1]).pair : undefined; };

F.rateTable = q => {
  const rows = rowsOf(q);
  let m = q.prompt.match(/from x = (\S+) to x = (\S+?):/);
  if (m && rows) {
    const a = rows.find(r => r[0].eq(qs(m[1]))), b = rows.find(r => r[0].eq(qs(m[2])));
    return a && b ? slopeOf(a, b).value : undefined;
  }
  const s = tableSlope(rows);
  if (!s) return undefined;
  if (q.input !== 'choice') return s.value;
  // unit rate as a choice: the slope, in output units per 1 input unit
  const xu = singular(picOf(q).table.heads[0]);
  return choiceWhere(q, c => {
    const k = c.match(new RegExp(`^(${NUM})\\s*(?:\\S+\\s+)?per (\\w+)$`));
    return !!k && qs(k[1]).eq(s) && singular(k[2]) === xu;
  });
};

F.changes = q => {
  const t = texPlain(q.board), p = pts(t), names = [...t.matchAll(/([AB])\(/g)].map(m => m[1]);
  const want = q.prompt.match(/from point (\w) to point (\w)/);
  if (p.length < 2 || !want) return undefined;
  const P = {}; names.forEach((n, i) => { P[n] = p[i]; });
  const a = P[want[1]], b = P[want[2]];
  return [b[0].sub(a[0]).value, b[1].sub(a[1]).value];
};

F.tableChanges = q => {
  const m = q.prompt.match(/from the row x = (\S+) to the row x = ([−-]?\$?\d+(?:\.\d+)?(?:\/\d+)?)\./), rows = rowsOf(q);
  if (!m || !rows) return undefined;
  const a = rows.find(r => r[0].eq(qs(m[1]))), b = rows.find(r => r[0].eq(qs(m[2])));
  return a && b ? [b[0].sub(a[0]).value, b[1].sub(a[1]).value] : undefined;
};

F.slopePts = q => { const p = pts(q.prompt); return p.length >= 2 ? (q.input === 'frac' ? slopeOf(p[0], p[1]).pair : slopeOf(p[0], p[1]).value) : undefined; };

// the drawn slope triangle (its corners sit on the grid); a scaled axis is in data units already
F.slopeTri = q => {
  const g = graphOf(q), t = g?.tris?.[0];
  if (!t) return undefined;
  const s = slopeOf([Q(t.a[0]), Q(t.a[1])], [Q(t.b[0]), Q(t.b[1])]);
  return q.input === 'frac' ? s.pair : s.value;
};

F.squaresToScale = q => {
  const m = q.prompt.match(/(\d+) squares? across and (\d+) squares? up\. One square across is ([−-]?\d+(?:\.\d+)?); one square up is ([−-]?\$?\d+(?:\.\d+)?(?:\/\d+)?)\./);
  if (!m) return undefined;
  return qs(m[2]).mul(qs(m[4])).div(qs(m[1]).mul(qs(m[3]))).value;
};

F.slopeMeaning = q => {
  const pq = pts(q.prompt);
  if (pq.length >= 2) {
    // a graph through P and Q: the slope in (y units) per (x unit)
    const s = slopeOf(pq[0], pq[1]), xu = axisUnit(picOf(q).graph?.xName ?? '');
    return choiceWhere(q, c => {
      const k = c.match(new RegExp(`^(${NUM}) (\\S+) per (\\S+)$`));
      return !!k && qs(k[1]).eq(s) && singular(k[3]) === xu;
    });
  }
  const L = eqIn(q.prompt), xu = singular(q.prompt.match(/with x in (\w+)/)?.[1] ?? '');
  if (!L) return undefined;
  return choiceWhere(q, c => {
    let k = c.match(new RegExp(`^It (goes up|goes down|drops|rises) (${NUM}) .+? (each|every) (?:(${NUM}) )?(\\w+)\\.$`));
    if (!k) return false;
    const sign = /up|rises/.test(k[1]) ? 1 : -1, per = k[4] ? qs(k[4]) : Q(1);
    return singular(k[5]) === xu && qs(k[2]).mul(sign).div(per).eq(L.m);
  });
};

F.whySimilar = q => {
  const g = graphOf(q), T = (picOf(q).graph?.tris ?? []);
  if (T.length < 2) return undefined;
  const r = T.map(t => slopeOf([Q(t.a[0]), Q(t.a[1])], [Q(t.b[0]), Q(t.b[1])]));
  if (!r[0].eq(r[1])) return -1;
  return choiceWhere(q, c => /^Similar: right angles, and equal corresponding angles/.test(c));
};

F.similarOrNot = q => {
  const m = q.prompt.match(/legs (\S+) across and (\S+) up, and legs (\S+) across and (\S+) up/);
  if (!m) return undefined;
  const same = qs(m[2]).div(qs(m[1])).eq(qs(m[4]).div(qs(m[3])));
  return choiceWhere(q, c => (same ? /^Yes: rise ÷ run is the same/.test(c) : /^No: rise ÷ run is different/.test(c)));
};

F.bigTriangle = q => {
  const m = norm(q.prompt).match(/run (\S+) and rise ([−-]?\$?\d+(?:\.\d+)?(?:\/\d+)?)\. The big one has run ([−-]?\$?\d+(?:\.\d+)?(?:\/\d+)?)\./);
  return m ? qs(m[2]).div(qs(m[1])).mul(qs(m[3])).value : undefined;
};

F.brokenPath = q => {
  const p = pts(q.prompt);
  if (p.length < 3) return undefined;
  const s1 = slopeOf(p[0], p[1]), s2 = slopeOf(p[1], p[2]);
  return choiceWhere(q, c => {
    let k = c.match(new RegExp(`^Yes: the slope is (${NUM}) from A to B and from B to C\\.$`));
    if (k) return s1.eq(s2) && qs(k[1]).eq(s1);
    k = c.match(new RegExp(`^No: the slope from A to B is (${NUM}), but from B to C it is (${NUM})\\.$`));
    if (k) return !s1.eq(s2) && qs(k[1]).eq(s1) && qs(k[2]).eq(s2);
    return false; // "a line can change its slope", "every piece goes up": not reasons
  });
};

F.specialSlope = q => {
  const p = pts(q.prompt);
  if (p.length < 2) return undefined;
  if (p[0][0].eq(p[1][0])) return choiceWhere(q, c => /^undefined$/.test(c));
  const s = slopeOf(p[0], p[1]);
  return choiceWhere(q, c => (/^zero\b/.test(c) ? s.n === 0 : new RegExp(`^${NUM}$`).test(c.trim()) && qs(c).eq(s)));
};

F.flatMeaning = q => {
  const V = numsQ(q.prompt.match(/flat line at ([−-]?\$?\d+(?:\.\d+)?(?:\/\d+)?)\./)?.[1] ?? '')[0];
  const L = graphOf(q)?.lines?.[0];
  if (!V) return undefined;
  const flat = L && L.m === 0;
  return choiceWhere(q, c => {
    if (/^It stays/.test(c)) return flat && numsQ(c)[0]?.eq(V);
    if (/^The slope is/.test(c)) return numsQ(c)[0]?.n === 0;
    if (/goes up at a steady rate/.test(c)) return false;
    const k = numsQ(c);
    return k.length === 1 && k[0].eq(V) && /\bis\b/.test(c); // "The bill is $0": true only if the value really is that
  });
};

F.hvMatch = q => {
  const t = texPlain(q.board), want = /slope of 0/.test(q.prompt) ? 'y' : /undefined slope/.test(q.prompt) ? 'x' : null;
  if (!want) return undefined;
  const lines = [...norm(t).matchAll(/([AB]):\s*([xy]) = (-?[\d.]+)/g)].map(m => ({ name: m[1], v: m[2] }));
  const hits = lines.filter(l => l.v === want).map(l => l.name);
  if (hits.length !== 1) return choiceWhere(q, c => (hits.length === 2 ? /^Both/.test(c) : /^Neither/.test(c)));
  return choiceWhere(q, c => c === `Line ${hits[0]}`);
};

F.onLine = q => {
  const L = eqIn(q.prompt), p = pts(q.prompt)[0];
  if (!L || !p) return undefined;
  const on = at(L, p[0]).eq(p[1]);
  return choiceWhere(q, c => (on ? /^Yes/.test(c) : /^No/.test(c)));
};

F.whichPoint = q => {
  const L = eqIn(q.prompt);
  if (!L) return undefined;
  return choiceWhere(q, c => { const p = pts(c)[0]; return !!p && at(L, p[0]).eq(p[1]); });
};

F.writeFromGraph = q => {
  const p = pts(texPlain(q.board));
  if (p.length < 2) return undefined;
  const m = slopeOf(p[0], p[1]), L = { m, b: p[0][1].sub(m.mul(p[0][0])) };
  return choiceWhere(q, c => sameLine(eqIn(c), L));
};

F.directVar = q => {
  const p = norm(q.prompt);
  let m;
  if ((m = p.match(/goes (\S+) miles in (\S+) hours\. How far in (\S+) hours/))) return qs(m[1]).div(qs(m[2])).mul(qs(m[3])).value;
  if ((m = p.match(/goes (\S+) miles in (\S+) hours\. How many hours for (\S+) miles/))) return qs(m[3]).div(qs(m[1]).div(qs(m[2]))).value;
  if ((m = p.match(/(\S+) tickets cost \$([−-]?\$?\d+(?:\.\d+)?(?:\/\d+)?)\. What do (\S+) tickets cost/))) return qs(m[2]).div(qs(m[1])).mul(qs(m[3])).value;
  if ((m = p.match(/(\S+) tickets cost \$([−-]?\$?\d+(?:\.\d+)?(?:\/\d+)?)\. How many tickets cost \$(\S+?)\?/))) return qs(m[3]).div(qs(m[2]).div(qs(m[1]))).value;
  if ((m = p.match(/y = (\S+) when x = ([−-]?\$?\d+(?:\.\d+)?(?:\/\d+)?)\. Find y when x = ([−-]?\$?\d+(?:\.\d+)?(?:\/\d+)?)\./))) return qs(m[1]).div(qs(m[2])).mul(qs(m[3])).value;
  if ((m = p.match(/y = (\S+) when x = ([−-]?\$?\d+(?:\.\d+)?(?:\/\d+)?)\. Find x when y = ([−-]?\$?\d+(?:\.\d+)?(?:\/\d+)?)\./))) return qs(m[3]).div(qs(m[1]).div(qs(m[2]))).value;
  return undefined;
};

F.graphStep = q => {
  const p = norm(q.prompt).match(/^Graph y = (.+?)\. Start at (?:the y-intercept )?\((\S+), (\S+)\) and use the slope with a run of ([−-]?\$?\d+(?:\.\d+)?(?:\/\d+)?)\./);
  if (!p) return undefined;
  const L = linExpr(p[1]), x0 = qs(p[2]), y0 = qs(p[3]), r = qs(p[4]);
  if (!L) return undefined;
  return [x0.add(r).value, y0.add(L.m.mul(r)).value];
};

F.whichGraph = q => {
  const L = eqIn(q.prompt), g = graphOf(q);
  if (!L || !g) return undefined;
  const hits = g.lines.filter(l => sameLine(drawn(l), L)).map(l => l.name);
  return hits.length === 1 ? choiceWhere(q, c => c === `Line ${hits[0]}`) : -1;
};

F.readB = q => {
  const t = norm(texPlain(q.board)), m = t.match(/m = (\S+?),/), p = pts(t)[0];
  return m && p ? p[1].sub(qs(m[1]).mul(p[0])).value : undefined;
};

F.tableB = q => {
  const rows = rowsOf(q), s = tableSlope(rows);
  if (!rows || !s) return undefined;
  return rows[0][1].sub(s.mul(rows[0][0])).value;
};

F.wordsToMB = q => {
  const p = norm(q.prompt);
  let m;
  if ((m = p.match(/is (\S+) inches tall and grows (\S+) inches each week/))) return [qs(m[2]).value, qs(m[1]).value];
  if ((m = p.match(/starts at (\S+?)% and drops (\S+?)% each hour/))) return [qs(m[2]).neg().value, qs(m[1]).value];
  if ((m = p.match(/costs \$(\S+) plus \$(\S+) per mile/))) return [qs(m[2]).value, qs(m[1]).value];
  if ((m = p.match(/costs \$(\S+) to join plus \$(\S+) per month/))) return [qs(m[2]).value, qs(m[1]).value];
  return undefined;
};

/** the inputs a story allows: { kind: 'line'|'ray'|'segment'|'points', lo, hi } */
function domainOf(p) {
  let m;
  if (/for any number x/.test(p)) return { kind: 'line', lo: -Infinity, hi: Infinity };
  if ((m = p.match(/T-shirts .*?up to (\d+)/))) return { kind: 'points', lo: 0, hi: Number(m[1]) };
  if (/Movie tickets cost/.test(p)) return { kind: 'points', lo: 0, hi: Infinity };
  if ((m = p.match(/from (\d+) up to (\d+) hours/)) || (m = p.match(/for (\d+) to (\d+) hours/))) return { kind: 'segment', lo: Number(m[1]), hi: Number(m[2]) };
  if (/no end time given|keeps filling/.test(p)) return { kind: 'ray', lo: 0, hi: Infinity };
  return null;
}
F.domainShape = q => {
  const D = domainOf(q.prompt);
  if (!D) return undefined;
  const want = { line: /^a full line$/, ray: /^a ray from the start$/, segment: /^a segment/, points: /^separate points$/ }[D.kind];
  return choiceWhere(q, c => want.test(c));
};
F.allowedInput = q => {
  const D = domainOf(q.prompt), x = Number(norm(q.prompt.match(/Is x = (\S+) an allowed input/)?.[1]));
  if (!D || !Number.isFinite(x)) return undefined;
  const ok = x >= D.lo - 1e-9 && x <= D.hi + 1e-9 && (D.kind !== 'points' || Number.isInteger(x));
  return choiceWhere(q, c => (ok ? /^Yes/.test(c) : /^No/.test(c)));
};

F.bFromPoint = q => {
  const m = norm(q.prompt).match(/slope (\S+) and goes through/), p = pts(q.prompt)[0];
  return m && p ? p[1].sub(qs(m[1]).mul(p[0])).value : undefined;
};
F.lineFromTwo = q => {
  const p = pts(q.prompt);
  if (p.length < 2) return undefined;
  const m = slopeOf(p[0], p[1]);
  return [m.value, p[0][1].sub(m.mul(p[0][0])).value];
};
F.missingY = q => { const L = eqIn(q.prompt), x = norm(q.prompt).match(/\((\S+), \?\)/); return L && x ? at(L, qs(x[1])).value : undefined; };
F.missingX = q => {
  const L = eqIn(q.prompt), y = norm(q.prompt).match(/\(\?, (\S+?)\)/);
  if (!L || !y || L.m.n === 0) return undefined; // a flat line has no single x for a y
  return qs(y[1]).sub(L.b).div(L.m).value;
};

F.meaningMB = q => {
  const L = eqIn(q.prompt), A = qs(q.prompt.match(/What does the (\S+) (?:mean|tell you)\?/)?.[1] ?? 'x');
  if (!L) return undefined;
  const dom = norm(q.prompt).match(/from week (\S+) to week ([−-]?\$?\d+(?:\.\d+)?(?:\/\d+)?)\./), lo = dom ? qs(dom[1]) : Q(0);
  return choiceWhere(q, c => {
    const k = numsQ(c);
    if (!k.length || !k[0].eq(A)) return false;
    if (/more (?:for )?each month$|grows .* each week\.$/.test(c)) return L.m.eq(A);
    if (/^\$\S+ to start$|^\$\S+ at the start, at 0 months$/.test(c)) return L.b.eq(A);
    if (/after the first month$/.test(c)) return at(L, 1).eq(A);
    if (/tall at week (\S+)\.$/.test(c)) return at(L, k[1]).eq(A);
    if (/The rule gives \S+ cm at week 0, but week 0 was never measured/.test(c)) return L.b.eq(A) && lo.cmp(0) > 0;
    return false; // "in total", "months for each dollar", "N months", "N weeks old": not what a number in the rule means
  });
};

/** the hourly rate of Ben (graph, table or words) */
function benRate(q) {
  const p = norm(q.prompt);
  let m;
  if ((m = p.match(/Ben earns \$(\S+) (?:for each|per) hour/)) || (m = p.match(/Ben earns \$\S+ to start plus \$(\S+) for each hour/))) return qs(m[1]);
  if (/Ben's pay is in the table/.test(p)) return tableSlope(rowsOf(q));
  if (/Ben's pay is on the graph/.test(p)) {
    const g = graphOf(q), P = g?.points ?? [];
    if (P.length >= 2) return slopeOf([Q(P[0].x), Q(P[0].y)], [Q(P[1].x), Q(P[1].y)]);
    const L = g?.lines?.[0];
    return L ? Q(L.m) : null;
  }
  return null;
}
F.compareRates = q => {
  const A = linExpr(texPlain(q.board).replace(/^Ava:\s*y = /, '')), B = benRate(q);
  if (!A || !B) return undefined;
  const c = A.m.cmp(B);
  return choiceWhere(q, t => (c > 0 ? t === 'Ava' : c < 0 ? t === 'Ben' : /same rate/.test(t)));
};

F.compareGraphs = q => {
  const g = graphOf(q);
  const A = g?.lines.find(l => l.name === 'A'), B = g?.lines.find(l => l.name === 'B');
  if (!A || !B) return undefined;
  const key = /grows faster/.test(q.prompt) ? 'm' : /bigger starting fee/.test(q.prompt) ? 'b' : null;
  if (!key) return undefined;
  const c = Math.sign(A[key] - B[key]);
  return choiceWhere(q, t => (c > 0 ? t === 'Plan A' : c < 0 ? t === 'Plan B' : /same/.test(t)));
};

F.ratioOrSlope = q => {
  const rows = rowsOf(q);
  if (!rows) return undefined;
  const r = rows.filter(x => x[0].n !== 0).map(x => x[1].div(x[0]));
  const ratio = allEq(r), slope = allEq(ratesOf(rows));
  const want = ratio && slope ? /^Both/ : slope ? /^Only the slope/ : ratio ? /^Only y\/x/ : /^Neither/;
  return choiceWhere(q, c => want.test(c));
};

F.yOverX = q => {
  const L = eqIn(q.prompt), m = q.prompt.match(/at x = (\S+) and at x = ([−-]?\$?\d+(?:\.\d+)?(?:\/\d+)?)\./);
  if (!L || !m) return undefined;
  const a = qs(m[1]), b = qs(m[2]);
  return [at(L, a).div(a).value, at(L, b).div(b).value];
};

/** the facts of a table: linear, the rate, proportional */
function tableFacts(rows) {
  const rates = ratesOf(rows), linear = allEq(rates);
  const nz = rows.filter(r => r[0].n !== 0), k = nz.length ? nz[0][1].div(nz[0][0]) : null;
  const prop = !!k && nz.every(r => r[1].div(r[0]).eq(k)) && rows.every(r => r[0].n !== 0 || r[1].n === 0);
  const evenX = allEq(rows.slice(1).map((r, i) => r[0].sub(rows[i][0])));
  return { rates, linear, prop, evenX, diffs: rows.slice(1).map((r, i) => r[1].sub(rows[i][1])) };
}
F.varyingRate = q => {
  const rows = rowsOf(q);
  if (!rows) return undefined;
  const T = tableFacts(rows);
  return choiceWhere(q, c => {
    let k;
    if ((k = c.match(/^Not linear: the rates are (.+)$/))) { const v = numsQ(k[1]); return !T.linear && v.length === T.rates.length && v.every((x, i) => x.eq(T.rates[i])); }
    if (/^Not linear: the outputs grow by different amounts/.test(c)) return !T.linear && T.evenX; // only a reason when the x-steps are equal
    if ((k = c.match(new RegExp(`^Linear: the rate is (${NUM}) every time$`)))) return T.linear && qs(k[1]).eq(T.rates[0]);
    if (/^Proportional: y\/x is the same in every row$/.test(c)) return T.prop;
    return false; // "not proportional", "outputs keep going up", "goes through (0, 0)": not reasons for the claim
  });
};

F.classify3 = q => {
  const t = norm(texPlain(q.board)).replace(/\s+/g, ' ');
  const rhs = t.replace(/^[A-Za-z] = /, '');
  let kind;
  if (/x\^|\/x\b|\d\/\(?x/.test(rhs)) kind = 'non';
  else {
    const L = linExpr(rhs.replace(/^x\/(\d+(?:\.\d+)?)$/, (_, d) => `1/${d}x`));
    if (!L) return undefined;
    kind = L.m.n === 0 ? 'lin' : L.b.n === 0 ? 'prop' : 'lin';
  }
  return choiceWhere(q, c => ({ prop: /^Proportional$/, lin: /^Linear, not proportional$/, non: /^Nonlinear$/ })[kind].test(c));
};

F.classifyGraph = q => {
  const L = graphOf(q)?.lines?.[0];
  if (!L) return undefined;
  const kind = L.curve ? (L.curve.a !== 0 ? 'non' : L.curve.c === 0 ? 'prop' : 'lin') : L.vx !== undefined ? 'non' : L.b === 0 ? 'prop' : 'lin';
  return choiceWhere(q, c => ({ prop: /^Proportional$/, lin: /^Linear, not proportional$/, non: /^Nonlinear$/ })[kind].test(c));
};

F.bZero = q => {
  const p = norm(q.prompt);
  let m;
  if ((m = p.match(/through \(0, 0\) with slope (\S+?),/))) {
    const k = qs(m[1]);
    return choiceWhere(q, c => { const x = norm(c).match(/rise y and run x, so y\/x is the slope, ([−-]?\$?\d+(?:\.\d+)?(?:\/\d+)?)\.$/); return !!x && qs(x[1]).eq(k); });
  }
  if ((m = p.match(/relationship y = (\S+?)x is also linear/))) {
    const k = qs(m[1]);
    return choiceWhere(q, c => { const x = norm(c).match(/^b = 0, because at x = 0 the output is (\S+) · 0 = 0\.$/); return !!x && qs(x[1]).eq(k); });
  }
  return undefined;
};

F.chooseModel = q => {
  const p = norm(q.prompt);
  let m, L;
  if ((m = p.match(/costs a \$(\S+) fee plus \$(\S+) per hour/))) L = { m: qs(m[2]), b: qs(m[1]) };
  else if ((m = p.match(/costs \$(\S+) per hour, with no other fee/))) L = { m: qs(m[1]), b: Q(0) };
  else return undefined;
  return choiceWhere(q, c => sameLine(eqIn(c), L));
};

F.doubling = q => {
  const p = norm(q.prompt), m = p.match(/costs (?:a \$(\S+) fee plus )?\$(\S+) per hour .*What do (\S+) hours cost/);
  return m ? qs(m[1] ?? '0').add(qs(m[2]).mul(qs(m[3]))).value : undefined;
};

F.evidence = q => {
  const rows = rowsOf(q);
  if (!rows) return undefined;
  const T = tableFacts(rows);
  const rule = norm(q.prompt).match(/always adds (\S+) gallons each minute/);
  const want = !T.linear ? /^Proven not linear$/ : rule ? (T.rates[0].eq(qs(rule[1])) ? /^Proven linear$/ : null) : /^Consistent with linear, but not proven$/;
  return want ? choiceWhere(q, c => want.test(c)) : -1;
};

// ---------------------------------------------------------------- solve
function solve(q) {
  const f = F[q.family];
  if (!f) return undefined;
  return f(q);
}

// ---------------------------------------------------------------- sane: what is impossible or unfair
function sane(q) {
  const out = [], p = norm(q.prompt), g = graphOf(q), rows = rowsOf(q);
  // a picture whose drawn line disagrees with the stated numbers
  const statedPts = pts(q.prompt);
  const line = g?.lines?.length === 1 ? drawn(g.lines[0]) : null;
  if (line && ['slopePts', 'unitRate', 'writeFromGraph'].includes(q.family)) {
    const P = q.family === 'slopePts' ? statedPts : pts(texPlain(q.board));
    for (const x of P) if (!at(line, x[0]).eq(x[1])) out.push(`the drawn line misses the stated point (${x[0]}, ${x[1]})`);
  }
  if (q.family === 'slopeMeaning' && statedPts.length >= 2 && line) for (const x of statedPts) if (!at(line, x[0]).eq(x[1])) out.push('the drawn line misses P or Q');
  if (q.family === 'tableB' || (q.family === 'rateTable' && !/from x =/.test(p)) || q.family === 'chooseModel') {
    if (rows && !tableSlope(rows)) out.push('the table is not linear');
  }
  if (q.family === 'tableB' && /taxi/.test(p) && rows) { const s = tableSlope(rows), k = p.match(/plus \$(\S+) per mile/); if (s && k && !s.eq(qs(k[1]))) out.push('the table rate is not the stated per-mile rate'); }
  if (q.family === 'chooseModel' && rows) {
    const m = p.match(/costs a \$(\S+) fee plus \$(\S+) per hour/) ?? p.match(/costs \$(\S+) per hour, with no other fee/);
    const L = /fee plus/.test(p) && m ? { m: qs(m[2]), b: qs(m[1]) } : m ? { m: qs(m[1]), b: Q(0) } : null;
    if (L && rows.some(r => !at(L, r[0]).eq(r[1]))) out.push('the table does not match the story');
  }
  if (q.family === 'doubling') {
    const m = p.match(/costs (?:a \$(\S+) fee plus )?\$(\S+) per hour \((\S+) to (\S+) hours\)\. (\S+) hours cost \$([−-]?\$?\d+(?:\.\d+)?(?:\/\d+)?)\. What do (\S+) hours cost/);
    if (m) {
      const L = { m: qs(m[2]), b: qs(m[1] ?? '0') };
      if (!at(L, qs(m[5])).eq(qs(m[6]))) out.push('the stated cost does not fit the rate and fee');
      if (Number(m[7]) > Number(m[4]) || Number(m[7]) < Number(m[3])) out.push('the asked hours are outside the rental range');
    }
  }
  if (q.family === 'directVar' && /tickets/.test(p)) { const v = solve(q); if (/How many tickets/.test(p) && !Number.isInteger(v)) out.push('a fractional number of tickets'); }
  if (q.family === 'compareRates' && /on the graph/.test(p) && g) {
    const P = g.points, L = g.lines[0];
    if (L && P.length >= 2 && P.some(x => !near(L.m * x.x + L.b, x.y))) out.push('the marked points are not on the drawn line');
  }
  if (q.family === 'compareGraphs' && g) {
    const A = g.lines.find(l => l.name === 'A'), B = g.lines.find(l => l.name === 'B');
    let m;
    if (A && B && (m = p.match(/plan (\w) starts at \$(\S+?), plan (\w) at \$([−-]?\$?\d+(?:\.\d+)?(?:\/\d+)?)\./))) {
      const L = { A, B };
      if (!near(L[m[1]].b, Number(m[2])) || !near(L[m[3]].b, Number(m[4]))) out.push('the stated starts are not the drawn starts');
    }
    if (A && B && (m = p.match(/plan (\w) adds \$(\S+) a month, plan (\w) \$([−-]?\$?\d+(?:\.\d+)?(?:\/\d+)?)\./))) {
      const L = { A, B };
      if (!near(L[m[1]].m, Number(m[2])) || !near(L[m[3]].m, Number(m[4]))) out.push('the stated monthly adds are not the drawn slopes');
    }
  }
  if (q.family === 'flatMeaning' && g?.lines?.[0]) { const V = numsQ(p.match(/flat line at ([−-]?\$?\d+(?:\.\d+)?(?:\/\d+)?)\./)?.[1] ?? '')[0]; if (V && !near(g.lines[0].b, V.value)) out.push('the flat line is not drawn at the stated value'); }
  if (q.family === 'whySimilar' && g) {
    const ls = (picOf(q).graph.lines ?? []);
    if (/two parallel lines/.test(p) && (ls.length !== 2 || ls[0].m !== ls[1].m || ls[0].b === ls[1].b)) out.push('the two lines are not two parallel lines');
    if (/the same line/.test(p) && ls.length !== 1) out.push('not one line');
  }
  if (q.family === 'hvMatch' && g) {
    for (const m of norm(texPlain(q.board)).matchAll(/([AB]):\s*([xy]) = (-?[\d.]+)/g)) {
      const L = g.lines.find(l => l.name === m[1]);
      if (!L || (m[2] === 'y' ? !(L.m === 0 && near(L.b, Number(m[3]))) : !near(L.vx, Number(m[3])))) out.push(`line ${m[1]} is not drawn as ${m[2]} = ${m[3]}`);
    }
  }
  if (q.family === 'classifyGraph' && g?.lines?.[0]) {
    const L = g.lines[0], f = x => (L.curve ? L.curve.a * x * x + L.curve.c : L.m * x + L.b);
    for (const x of pts(texPlain(q.board))) if (!near(f(x[0].value), x[1].value)) out.push('a board point is not on the drawn graph');
  }
  if (q.family === 'meaningMB') {
    const L = eqIn(p), A = p.match(/What does the (\S+) (?:mean|tell you)/)?.[1];
    if (L && A && L.m.eq(qs(A)) && L.b.eq(qs(A))) out.push('the asked number is both the slope and the start');
  }
  if (q.family === 'classify3') {
    let m;
    const L = linExpr(norm(texPlain(q.board)).replace(/^[A-Za-z] = /, ''));
    if ((m = p.match(/\$(\S+) a month plus \$(\S+) per gigabyte/)) && !sameLine(L, { m: qs(m[2]), b: qs(m[1]) })) out.push('the board rule is not the story');
    if ((m = p.match(/apples at \$(\S+) per pound/)) && !sameLine(L, { m: qs(m[1]), b: Q(0) })) out.push('the board rule is not the story');
  }
  if (q.family === 'evidence' && rows) {
    const T = tableFacts(rows), shown = numsQ(texPlain(q.board).replace(/^rates:\s*/, ''));
    if (shown.length !== T.rates.length || shown.some((x, i) => !x.eq(T.rates[i]))) out.push('the board rates are not the table rates');
    const rule = p.match(/always adds (\S+) gallons each minute/);
    if (rule && !T.linear) out.push('the stated rule and the measured table disagree');
  }
  if (q.family === 'graphStep') {
    const m = norm(q.prompt).match(/^Graph y = (.+?)\. Start at (?:the y-intercept )?\((\S+), (\S+)\)/);
    const L = m && linExpr(m[1]);
    if (L && !at(L, qs(m[2])).eq(qs(m[3]))) out.push('the start point is not on the line');
  }
  // a choice question needs exactly one right choice
  if (q.input === 'choice') {
    let s;
    try { s = solve(q); } catch { s = undefined; }
    if (s === -1) out.push('no single right choice');
  }
  return [...new Set(out)].join('; ');
}

export default { solve, sane };
