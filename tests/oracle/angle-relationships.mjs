// angle-relationships oracle (role O, docs/lessons/QUALITY_LAYER.md). Works every practice item out from what the
// student sees: the prompt, the givens written on the board (q.data.givens, TeX) and the angle figure (q.data.picture:
// fans of rays from a vertex, the lines DRAWN through the vertex, and the marks: arcs / right-angle boxes with their
// visible labels). The lesson's rule is "only encoded evidence counts": a drawn line, a box, a written measure, words.
// So the figure becomes a linear system over the gaps between neighbouring rays (each fan: gaps add to 360; a drawn or
// stated line: 180; a box: 90; a label: its measure or expression in x; equal-angle ticks: equal) plus the facts in the
// prompt and the givens, solved exactly; a quantity is known only when the system determines it. Ray directions are
// used only for the order of the rays and to tell which side a three-letter name means (the angle under 180°), and in
// the one family that asks which angle opens wider. Mark colours are visible (the lavender "marked" angle); the hidden
// `alt` label and the `solve` reveal are never used. Every choice is judged by the maths of its claim and its reason.
import { Q } from '../../tools/quality/oracle-kit.mjs';

const DEBUG = !!process.env.ORACLE_DEBUG;
const dbg = (...a) => { if (DEBUG) console.error('[oracle]', ...a); };

// ---------------------------------------------------------------- linear forms over named variables
const toQ = k => (typeof k === 'object' ? k : Q(k));
function lf(c = 0) { return { c: toQ(c), t: {} }; }
function lv(name, k = 1) { return { c: Q(0), t: { [name]: toQ(k) } }; }
function ladd(u, v, s = 1) {
  const o = { c: u.c.add(v.c.mul(s)), t: { ...u.t } };
  for (const [k, x] of Object.entries(v.t)) { const y = (o.t[k] ?? Q(0)).add(x.mul(s)); if (y.n === 0) delete o.t[k]; else o.t[k] = y; }
  return o;
}
function lmul(u, k) { k = toQ(k); const o = { c: u.c.mul(k), t: {} }; if (k.n !== 0) for (const [n, x] of Object.entries(u.t)) o.t[n] = x.mul(k); return o; }
const isConst = u => Object.keys(u.t).length === 0;

// exact rational system: rows are linear forms meaning form = 0
function solveSystem(rows) {
  const names = [...new Set(rows.flatMap(r => Object.keys(r.t)))];
  const M = rows.map(r => [...names.map(n => r.t[n] ?? Q(0)), r.c]);
  const piv = []; let row = 0; let bad = false;
  for (let col = 0; col < names.length && row < M.length; col++) {
    let p = -1;
    for (let i = row; i < M.length; i++) if (M[i][col].n !== 0) { p = i; break; }
    if (p < 0) continue;
    [M[row], M[p]] = [M[p], M[row]];
    const k = M[row][col];
    M[row] = M[row].map(x => x.div(k));
    for (let i = 0; i < M.length; i++) if (i !== row && M[i][col].n !== 0) { const f = M[i][col]; M[i] = M[i].map((x, j) => x.sub(M[row][j].mul(f))); }
    piv.push({ col, row }); row++;
  }
  for (let i = row; i < M.length; i++) if (M[i][names.length].n !== 0) bad = true;
  return {
    consistent: !bad,
    /** the value of a linear form, or null when the system does not fix it */
    value(u) {
      let t = { ...u.t }, c = u.c;
      for (const { col, row: r } of piv) {
        const n = names[col], k = t[n];
        if (!k || k.n === 0) continue;
        // var n = -(sum others + const) of row r
        for (let j = 0; j < names.length; j++) if (j !== col && M[r][j].n !== 0) t[names[j]] = (t[names[j]] ?? Q(0)).sub(M[r][j].mul(k));
        c = c.sub(M[r][names.length].mul(k));
        delete t[n];
      }
      for (const [n, k] of Object.entries(t)) if (k.n !== 0) { void n; return null; }
      return c;
    },
  };
}

// ---------------------------------------------------------------- text
const clean = s => String(s ?? '').replace(/[−–]/g, '-').replace(/’/g, "'");
function texText(tex) {
  return clean(String(tex ?? '').replace(/\\angle\s*/g, '∠').replace(/\^\s*\{?\\circ\}?/g, '°').replace(/\\circ/g, '°')
    .replace(/\\text\{([^{}]*)\}/g, '$1').replace(/\\[,;:! ]|\\quad|~/g, ' ').replace(/[{}]/g, '').replace(/\\[a-zA-Z]+/g, ''))
    .replace(/\s+/g, ' ').trim();
}

// ---------------------------------------------------------------- the figure model
const norm = d => ((d % 360) + 360) % 360;
const ccw = (a, b) => { const s = norm(b - a); return s === 0 ? 360 : s; };

function model(q, { promptFacts = true } = {}) {
  const pic = q.data?.picture ?? { fans: [] };
  const fans = (pic.fans ?? []).map((f, fi) => {
    const rays = [...f.rays].sort((a, b) => norm(a.deg) - norm(b.deg));
    return { fi, O: f.O, rays, deg: Object.fromEntries(rays.map(r => [r.p, r.deg])), idx: Object.fromEntries(rays.map((r, i) => [r.p, i])), lines: (f.lines ?? []).map(l => [...l]), stated: [], marks: f.marks ?? [], raw: f };
  });
  const eqs = [];
  const gap = (f, i) => `g${f.fi}_${i}`;
  /** the linear form of the angle from ray a counterclockwise to ray b in fan f */
  function span(f, a, b) {
    let i = f.idx[a]; const j = f.idx[b];
    if (i === undefined || j === undefined) throw new Error(`no ray ${a}/${b} at ${f.O}`);
    let u = lf(0), n = 0;
    do { u = ladd(u, lv(gap(f, i))); i = (i + 1) % f.rays.length; n++; } while (i !== j && n < 50);
    return u;
  }
  /** a drawn angle a→b (ccw) → {f, a, b}; a three-letter name → the side under 180° on the drawing */
  function named(f, a, b) {
    if (f.deg[a] === undefined || f.deg[b] === undefined) return null;
    return ccw(f.deg[a], f.deg[b]) <= 180 ? { f, a, b } : { f, a: b, b: a };
  }
  function angOf(ref) {
    ref = ref.replace(/^m?∠/, '');
    if (/^\d+$/.test(ref)) {
      for (const f of fans) for (const m of f.marks) if (String(m.text ?? '') === ref) return { f, a: m.a, b: m.b };
      return null;
    }
    if (ref.length === 3) {
      const f = fans.find(g => g.O === ref[1] && g.deg[ref[0]] !== undefined && g.deg[ref[2]] !== undefined);
      return f ? named(f, ref[0], ref[2]) : null;
    }
    if (ref.length === 1) {
      const f = fans.find(g => g.O === ref);
      if (f && f.rays.length === 2) return named(f, f.rays[0].p, f.rays[1].p);
      if (f && f.marks.length === 1) return { f, a: f.marks[0].a, b: f.marks[0].b };
      return null;
    }
    return null;
  }
  function formOf(ref) {
    const A = angOf(ref);
    if (A) return span(A.f, A.a, A.b);
    const r = ref.replace(/^m?∠/, '');
    if (fans.length && r.length === 3) throw new Error(`unknown angle ${r}`);
    return lv(`free:${r.length === 3 ? r[1] + [r[0], r[2]].sort().join('') : r}`);
  }
  const angForm = A => span(A.f, A.a, A.b);

  // linear expression parser: numbers, x, angle refs (m∠ABC, ∠P, ∠1), + − ( ), implicit products like 5x, 2(x + 1)
  function parseLin(text) {
    const s = clean(text).replace(/°/g, '').replace(/×|·/g, '*');
    const toks = []; let i = 0;
    const re = /\s*(m?∠(?:[A-Z]{3}|[A-Z]|\d+)(?![A-Za-z])|\d+(?:\.\d+)?|x|[-+*()])/y;
    while (i < s.length) {
      if (/\s/.test(s[i])) { i++; continue; }
      re.lastIndex = i; const m = re.exec(s);
      if (!m) throw new Error(`bad text "${s}"`);
      toks.push(m[1]); i = re.lastIndex;
    }
    let p = 0;
    const peek = () => toks[p], next = () => toks[p++];
    function expr() { let v = term(); while (peek() === '+' || peek() === '-') { const op = next(); v = ladd(v, term(), op === '+' ? 1 : -1); } return v; }
    function term() {
      let v = factor();
      for (;;) {
        const t = peek();
        if (t === '*') { next(); v = mulF(v, factor()); } else if (t !== undefined && (t === '(' || t === 'x' || /^[\d∠m]/.test(t))) v = mulF(v, factor());
        else break;
      }
      return v;
    }
    function mulF(u, v) { if (isConst(u)) return lmul(v, u.c); if (isConst(v)) return lmul(u, v.c); throw new Error('not linear'); }
    function factor() { const t = peek(); if (t === '-') { next(); return lmul(factor(), -1); } if (t === '+') { next(); return factor(); } return prim(); }
    function prim() {
      const t = next();
      if (t === '(') { const v = expr(); if (next() !== ')') throw new Error('missing )'); return v; }
      if (t === 'x') return lv('x');
      if (t === undefined) throw new Error('unexpected end');
      if (/^m?∠/.test(t)) return formOf(t);
      if (/^\d/.test(t)) return lf(Q(Number(t)));
      throw new Error(`unexpected ${t}`);
    }
    const v = expr();
    if (p !== toks.length) throw new Error(`trailing in "${s}"`);
    return v;
  }

  const fanWith = (A, B, O) => fans.find(f => (!O || f.O === O) && f.deg[A] !== undefined && f.deg[B] !== undefined);
  function addLine(A, B, O) { const f = fanWith(A, B, O); if (f && !isLineIn(f, A, B)) f.stated.push([A, B]); }
  const isLineIn = (f, A, B) => [...f.lines, ...f.stated].some(([x, y]) => (x === A && y === B) || (x === B && y === A));

  // ---- facts from the board (givens)
  const givens = (q.data?.givens ?? []).map(texText);
  for (const g of givens) {
    let m;
    if ((m = g.match(/^lines? (.+)$/))) { for (const pr of m[1].split(/[, ]+/).filter(Boolean)) if (/^[A-Z]{2}$/.test(pr)) addLine(pr[0], pr[1]); continue; }
    if ((m = g.match(/^∠(\w), ∠(\w) (complementary|supplementary)$/))) { eqs.push(ladd(ladd(formOf(m[1]), formOf(m[2])), lf(m[3] === 'complementary' ? -90 : -180))); continue; }
    if (g.includes('=')) {
      try { const parts = g.split('=').map(parseLin); for (let k = 1; k < parts.length; k++) eqs.push(ladd(parts[k - 1], parts[k], -1)); } catch (e) { dbg('given', g, e.message); }
    }
  }
  // ---- facts from the prompt (only where the prompt states facts, not claims to be checked)
  const P = clean(q.prompt);
  if (promptFacts) {
    for (const m of P.matchAll(/m∠([A-Z]{3}|[A-Z]|\d) = (\d+(?:\.\d+)?)°/g)) eqs.push(ladd(formOf(m[1]), lf(-Number(m[2]))));
    for (const m of P.matchAll(/box marks ∠([A-Z]{3}) as a right angle/g)) eqs.push(ladd(formOf(m[1]), lf(-90)));
    for (const m of P.matchAll(/∠(\w) and ∠(\w) are (complementary|supplementary)/g)) eqs.push(ladd(ladd(formOf(m[1]), formOf(m[2])), lf(m[3] === 'complementary' ? -90 : -180)));
    for (const m of P.matchAll(/Lines ([A-Z]{2}) and ([A-Z]{2}) cross at ([A-Z])/g)) { addLine(m[1][0], m[1][1], m[3]); addLine(m[2][0], m[2][1], m[3]); }
    for (const m of P.matchAll(/Line ([A-Z]{2}) is drawn(?: through ([A-Z]))?/g)) addLine(m[1][0], m[1][1], m[2]);
    for (const m of P.matchAll(/\(([A-Z]) to ([A-Z]) and ([A-Z]) to ([A-Z])\)/g)) if (/straight/.test(P)) { addLine(m[1], m[2]); addLine(m[3], m[4]); }
  }
  // ---- facts from the figure
  for (const f of fans) {
    if (f.rays.length >= 2) eqs.push(ladd(f.rays.reduce((u, _, i) => ladd(u, lv(gap(f, i))), lf(0)), lf(-360)));
    for (const [A, B] of [...f.lines, ...f.stated]) eqs.push(ladd(span(f, A, B), lf(-180)));
    const ticks = {};
    for (const m of f.marks) {
      const u = span(f, m.a, m.b), t = clean(m.text ?? '').trim();
      if (m.box) eqs.push(ladd(u, lf(-90)));
      if (t && t !== '?' && !/^\d+$/.test(t)) {
        try { eqs.push(ladd(u, parseLin(t), -1)); } catch (e) { dbg('mark', t, e.message); }
      }
      if (m.ticks) (ticks[m.ticks] ??= []).push(u);
    }
    for (const us of Object.values(ticks)) for (let k = 1; k < us.length; k++) eqs.push(ladd(us[0], us[k], -1));
  }
  const sys = solveSystem(eqs);
  const isLine = (A, B, O) => { const f = O ? fans.find(g => g.O === O) : fanWith(A, B); return !!f && f.deg[A] !== undefined && f.deg[B] !== undefined && isLineIn(f, A, B); };
  const val = u => sys.value(u);
  const valRef = ref => { try { return val(formOf(ref)); } catch { return null; } };
  function adjacent(X, Y) {
    if (!X || !Y || X.f !== Y.f) return false;
    const ends = new Set([X.a, X.b, Y.a, Y.b]);
    if (ends.size !== 3) return false;
    return (X.b === Y.a) !== (Y.b === X.a);
  }
  function vertical(X, Y) {
    if (!X || !Y || X.f !== Y.f) return false;
    const f = X.f;
    return isLineIn(f, X.a, Y.a) && isLineIn(f, X.b, Y.b) && X.a !== Y.a && X.b !== Y.b;
  }
  const outer = (X, Y) => (X.b === Y.a ? [X.a, Y.b] : [Y.a, X.b]);
  const linearPair = (X, Y) => adjacent(X, Y) && isLineIn(X.f, ...outer(X, Y));
  const marks = fans.flatMap(f => f.marks.map(m => ({ ...m, f })));
  return { q, P, fans, eqs, sys, span, angOf, formOf, angForm, parseLin, val, valRef, isLine, isLineIn, adjacent, vertical, linearPair, outer, marks, givens, named };
}

// ---------------------------------------------------------------- reasons that are false in general (the misconceptions)
const FALSE_REASON = [
  /\blooks?\b/i, /\bprotractor\b/i, /\bmeasur/i, /any two adjacent/i, /adjacent angles always/i, /are adjacent, so they add/i,
  /must point left and right/i, /they both start at/i, /complementary angles are each 90/i, /do not share a side/i,
  /they are not equal/i, /would have to be obtuse/i, /open up and down/i, /open the same way/i, /have equal measures/i,
  /must be two equal angles/i, /both touch line/i, /half a circle/i, /No reason needed/i, /Angles on a line add to 360/i,
  /vertical angles add to 180/i, /any step is fine/i, /sides are longer/i, /same width/i, /to scale/i,
  /measured five crossings/i, /only works for this drawing/i, /done again with the new angle/i, /across from each other and do not touch/i,
  /every output comes from/i, /arrows are not in order/i,
];
const fallacy = c => FALSE_REASON.some(re => re.test(c));
const num = s => Number(String(s).replace(/[−–]/g, '-'));

// ---------------------------------------------------------------- families
class Unknown extends Error {}
const unknown = (q, c) => { dbg(q.family, q.id, 'unknown choice:', c, '| prompt:', q.prompt); throw new Unknown(c); };

/** the asked angle of a typed item, as a linear form */
function target(M) {
  const P = M.P;
  let m;
  if ((m = P.match(/find x = m∠(\w+)/i))) return M.formOf(m[1]);
  if ((m = P.match(/find m∠(\w+)/i))) return M.formOf(m[1]);
  if (/find x\b/i.test(P)) return { c: Q(0), t: { x: Q(1) } };
  if ((m = P.match(/, ∠([A-Z]{3})\.?$/))) return M.formOf(m[1]);
  const qm = M.marks.filter(k => String(k.text ?? '').trim() === '?');
  if (qm.length === 1) return M.span(qm[0].f, qm[0].a, qm[0].b);
  throw new Error('no target');
}
function typed(q) {
  const M = model(q);
  // a figure whose facts contradict each other (or that does not fix the answer) has no answer to type: NaN makes
  // the sweep show the item, and sane() says why
  if (!M.sys.consistent) return NaN;
  const v = M.val(target(M));
  return v === null ? NaN : v;
}

const F = {};
for (const fam of ['addParts', 'findPair', 'findVertical', 'missingPart', 'lineParts', 'aroundPoint', 'mixed', 'expr', 'exprCombined']) F[fam] = typed;
F.chain = q => (q.input === 'choice' ? chainCan(q) : typed(q));
F.context = q => (q.input === 'choice' ? contextAssume(q) : typed(q));

F.rays = q => {
  const M = model(q), P = M.P;
  let m;
  if (/How many pairs of opposite rays/.test(P)) {
    const n = M.fans.reduce((a, f) => a + f.lines.length + f.stated.length, 0);
    return q.choices.map(c => num(c) === n);
  }
  if ((m = P.match(/The arrow starts at ([A-Z]) and passes through ([A-Z])/))) {
    const f = M.fans[0], drawnLine = f && f.lines.length > 0;
    return q.choices.map(c => { const r = c.match(/^(ray|line) ([A-Z])([A-Z])$/); if (!r) return unknown(q, c); return r[1] === 'ray' ? !drawnLine && r[2] === m[1] && r[3] === m[2] : drawnLine; });
  }
  if (/Which two rays are opposite rays/.test(P)) {
    const f = M.fans[0];
    return q.choices.map(c => {
      const r = c.match(/^ray ([A-Z])([A-Z]) and ray ([A-Z])([A-Z])$/); if (!r) return unknown(q, c);
      return r[1] === f.O && r[3] === f.O && M.isLineIn(f, r[2], r[4]);
    });
  }
  if ((m = P.match(/Rays ([A-Z])([A-Z]) and ([A-Z])([A-Z]) start at ([A-Z])\. Are they opposite rays/))) {
    const f = M.fans.find(g => g.O === m[5]), A = m[2], B = m[4];
    const line = M.isLineIn(f, A, B), bent = Math.abs(ccw(f.deg[A], f.deg[B]) - 180) > 1;
    return q.choices.map(c => {
      if (fallacy(c)) return false;
      if (/^No: together they make a bent angle, not one line/.test(c)) return !line && bent;
      return unknown(q, c);
    });
  }
  return null;
};

F.names = q => {
  const M = model(q, { promptFacts: false }), P = M.P;
  let m;
  if (/Which name fits the marked angle/.test(P)) {
    const mk = M.marks.length === 1 ? M.marks[0] : M.marks.find(k => k.col === 'pick');
    const f = mk.f;
    return q.choices.map(c => {
      const r = c.match(/^∠([A-Z]+)$/); if (!r) return unknown(q, c);
      const n = r[1];
      if (n.length === 1) return n === f.O && f.rays.length === 2;
      return n.length === 3 && n[1] === f.O && new Set([n[0], n[2]]).size === 2 && [n[0], n[2]].every(x => x === mk.a || x === mk.b);
    });
  }
  if ((m = P.match(/Which numbered angle is ∠([A-Z]{3})/))) {
    const A = M.angOf(m[1]);
    const mk = M.marks.find(k => k.f === A.f && ((k.a === A.a && k.b === A.b)));
    return q.choices.map(c => { const r = c.match(/^angle (\d+)$/); if (!r) return unknown(q, c); return !!mk && String(mk.text) === r[1]; });
  }
  if ((m = P.match(/Which two rays are the sides of ∠([A-Z])([A-Z])([A-Z])/))) {
    return q.choices.map(c => { const r = c.match(/^([A-Z])([A-Z]) and ([A-Z])([A-Z])$/); if (!r) return unknown(q, c); return r[1] === m[2] && r[3] === m[2] && new Set([r[2], r[4]]).size === 2 && [r[2], r[4]].every(x => x === m[1] || x === m[3]); });
  }
  return null;
};

F.evidence = q => {
  const M = model(q, { promptFacts: false }), P = M.P;
  let m;
  if ((m = P.match(/Do ([A-Z])([A-Z]) and ([A-Z])([A-Z]) make one line/))) {
    const line = M.isLine(m[2], m[4], m[1]);
    return q.choices.map(c => {
      if (fallacy(c) && !/^You can't tell/.test(c)) return false;
      if (/^You can't tell: no line is drawn or stated/.test(c)) return !line;
      if (/^Yes: line/.test(c)) return line;
      return unknown(q, c);
    });
  }
  if ((m = P.match(/Are ([A-Z])([A-Z]) and ([A-Z])([A-Z]) opposite rays/))) {
    const line = M.isLine(m[2], m[4], m[1]);
    return q.choices.map(c => {
      let r;
      if ((r = c.match(/^Yes: line ([A-Z])([A-Z]) is drawn through ([A-Z])$/))) return line && r[3] === m[1] && new Set([r[1], r[2], m[2], m[4]]).size === 2;
      if (/^Only if/.test(c)) return false; // with a drawn line nothing more is needed; without one, "only if" is not an answer
      return unknown(q, c);
    });
  }
  if ((m = P.match(/says ∠([A-Z]{3}) is a right angle\. What does the figure tell you\?/))) {
    const v = M.valRef(m[1]), A = M.angOf(m[1]);
    const boxed = M.marks.some(k => k.box && A && k.f === A.f && new Set([k.a, k.b, A.a, A.b]).size === 2);
    return q.choices.map(c => {
      if (/^Nothing marks it as 90°: there is no box and no number$/.test(c)) return v === null && !boxed;
      if (fallacy(c)) return false;
      if (/^It is 90°: the box marks a right angle$/.test(c)) return boxed;
      return unknown(q, c);
    });
  }
  if ((m = P.match(/What is m∠([A-Z]{3})\?/))) {
    const v = M.valRef(m[1]);
    const A = M.angOf(m[1]);
    const boxed = M.marks.some(k => k.box && A && k.f === A.f && ((k.a === A.a && k.b === A.b) || (k.a === A.b && k.b === A.a)));
    return q.choices.map(c => {
      let r;
      if (fallacy(c)) return false;
      if (/^You can't tell/.test(c)) return v === null;
      if ((r = c.match(/^(\d+)°: the box marks a right angle$/))) return boxed && v !== null && v.eq(num(r[1]));
      if ((r = c.match(/^(\d+)°$/))) return v !== null && v.eq(num(r[1]));
      return unknown(q, c);
    });
  }
  return null;
};

F.adjacent = q => {
  const M = model(q), P = M.P;
  let m;
  if ((m = P.match(/^∠([A-Z]{3}) and ∠([A-Z]{3}) are adjacent\. What can you say about their total/))) {
    const s = M.val(ladd(M.formOf(m[1]), M.formOf(m[2])));
    const a = M.valRef(m[1]), b = M.valRef(m[2]);
    return q.choices.map(c => {
      let r;
      if ((r = c.match(/^They must add to (\d+)°$/))) return s !== null && s.eq(num(r[1])) && (num(r[1]) === 180 ? M.isLine(...M.outer(M.angOf(m[1]), M.angOf(m[2]))) : M.marks.some(k => k.box));
      if ((r = c.match(/^(\d+) \+ (\d+) = (\d+)°: adjacent says nothing about the total$/))) return a !== null && b !== null && a.eq(num(r[1])) && b.eq(num(r[2])) && num(r[1]) + num(r[2]) === num(r[3]);
      return unknown(q, c);
    });
  }
  if (/Which two angles are adjacent/.test(P)) {
    return q.choices.map(c => { const r = c.match(/^∠([A-Z]{3}) and ∠([A-Z]{3})$/); if (!r) return unknown(q, c); return M.adjacent(M.angOf(r[1]), M.angOf(r[2])); });
  }
  return null;
};

F.armLength = q => {
  const M = model(q, { promptFacts: false });
  const sz = {};
  for (const f of M.fans) { const mk = f.marks[0]; sz[f.O] = ccw(f.deg[mk.a], f.deg[mk.b]); }
  return q.choices.map(c => {
    let r;
    if (fallacy(c)) return false;
    if ((r = c.match(/^∠([A-Z]): it opens wider$/))) { const o = Object.keys(sz).find(k => k !== r[1]); return sz[r[1]] > sz[o] + 0.5; }
    if (/^They are the same size$/.test(c)) { const [a, b] = Object.values(sz); return Math.abs(a - b) <= 0.5; }
    return unknown(q, c);
  });
};

F.pairName = q => {
  const M = model(q), P = M.P;
  let m;
  if ((m = P.match(/^m∠(\w+) = (\d+)°\. What is the complement of ∠\w+\?/))) {
    const v = M.valRef(m[1]).value;
    return q.choices.map(c => {
      let r;
      if ((r = c.match(/^None: (\d+)° is already more than 90°$/))) return v >= 90 && num(r[1]) === v && v > 90;
      if ((r = c.match(/^(\d+)°$/))) return v < 90 && num(r[1]) === 90 - v;
      return unknown(q, c);
    });
  }
  if ((m = P.match(/^m∠(\w+) = (\d+)° and m∠(\w+) = (\d+)°\. Are they complementary, supplementary or neither/))) {
    const a = M.valRef(m[1]), b = M.valRef(m[3]);
    const s = a.add(b).value;
    return q.choices.map(c => {
      let r;
      if (fallacy(c)) return false;
      if ((r = c.match(/^(Complementary|Supplementary)(?:: (\d+) \+ (\d+) = (\d+))?$/))) {
        const want = r[1] === 'Complementary' ? 90 : 180;
        if (s !== want) return false;
        return !r[2] || (a.eq(num(r[2])) && b.eq(num(r[3])) && num(r[4]) === s);
      }
      if ((r = c.match(/^Neither: (\d+) \+ (\d+) = (\d+)$/))) return s !== 90 && s !== 180 && a.eq(num(r[1])) && b.eq(num(r[2])) && num(r[3]) === s;
      return unknown(q, c);
    });
  }
  return null;
};

F.linearPair = q => {
  const M = model(q, { promptFacts: false }), P = M.P;
  let m;
  if ((m = P.match(/Are ∠([A-Z]{3}) and ∠([A-Z]{3}) a linear pair\?/))) {
    const X = M.angOf(m[1]), Y = M.angOf(m[2]);
    const lp = M.linearPair(X, Y);
    return q.choices.map(c => {
      let r;
      if (fallacy(c)) return false;
      if ((r = c.match(/^You can't tell: no line through ([A-Z]), ([A-Z]) and ([A-Z]) is drawn or stated$/))) {
        const adj = M.adjacent(X, Y); const [o1, o2] = adj ? M.outer(X, Y) : [null, null];
        return adj && r[2] === X.f.O && new Set([r[1], r[3], o1, o2]).size === 2 && !M.isLineIn(X.f, r[1], r[3]);
      }
      if ((r = c.match(/^Yes: they are adjacent, and ([A-Z])([A-Z]) and ([A-Z])([A-Z]) are opposite rays of line ([A-Z])([A-Z])$/))) {
        const [o1, o2] = M.adjacent(X, Y) ? M.outer(X, Y) : [null, null];
        return lp && r[1] === X.f.O && r[3] === X.f.O && new Set([r[2], r[4], r[5], r[6], o1, o2]).size === 2;
      }
      if (/^Yes: they are adjacent$/.test(c)) return false; // adjacent alone is not a linear pair
      if ((r = c.match(/^No: ([A-Z])([A-Z]) and ([A-Z])([A-Z]) are not opposite rays$/))) {
        if (lp) return false;
        const adj = M.adjacent(X, Y); const [o1, o2] = adj ? M.outer(X, Y) : [null, null];
        return adj && new Set([r[2], r[4], o1, o2]).size === 2 && !M.isLineIn(X.f, r[2], r[4]);
      }
      if (/^No: nothing says they add to 180°$/.test(c)) return !lp && M.val(ladd(M.angForm(X), M.angForm(Y))) === null;
      return unknown(q, c);
    });
  }
  if ((m = P.match(/^Why is m∠([A-Z]{3}) \+ m∠([A-Z]{3}) = 180°\?/))) {
    const X = M.angOf(m[1]), Y = M.angOf(m[2]);
    return q.choices.map(c => {
      let r;
      if (fallacy(c)) return false;
      if ((r = c.match(/^([A-Z])([A-Z]) and ([A-Z])([A-Z]) are opposite rays of line ([A-Z])([A-Z]), so the two angles fill a straight angle$/))) {
        const [o1, o2] = M.adjacent(X, Y) ? M.outer(X, Y) : [null, null];
        return M.linearPair(X, Y) && r[1] === X.f.O && r[3] === X.f.O && new Set([r[2], r[4], r[5], r[6], o1, o2]).size === 2;
      }
      return unknown(q, c);
    });
  }
  return null;
};

F.vertical = q => {
  const M = model(q, { promptFacts: true }), P = M.P;
  let m;
  if ((m = P.match(/Are ∠(\d) and ∠(\d) vertical angles\?/))) {
    const X = M.angOf(m[1]), Y = M.angOf(m[2]);
    const v = M.vertical(X, Y);
    return q.choices.map(c => {
      let r;
      if (fallacy(c)) return false;
      if ((r = c.match(/^No: ([A-Z])([A-Z]) and ([A-Z])([A-Z]) are not one line$/))) {
        if (v) return false;
        const pairs = [[X.a, Y.a], [X.b, Y.b]];
        return r[1] === X.f.O && r[3] === X.f.O && !M.isLineIn(X.f, r[2], r[4]) && pairs.some(([s, t]) => new Set([s, t, r[2], r[4]]).size === 2);
      }
      return unknown(q, c);
    });
  }
  if ((m = P.match(/Which angle is vertical to ∠(\d)\?/))) {
    const X = M.angOf(m[1]);
    return q.choices.map(c => {
      let r;
      if (fallacy(c)) return false;
      if ((r = c.match(/^∠(\d)$/))) return M.vertical(X, M.angOf(r[1]));
      return unknown(q, c);
    });
  }
  return null;
};

F.equalPick = q => {
  const M = model(q), P = M.P;
  if (/two separate angles, both (\d+)°\. Are they vertical angles/.test(P)) {
    const sameFan = M.fans.length === 1;
    return q.choices.map(c => {
      if (fallacy(c)) return false;
      if (/^No: vertical angles are made by the same two crossing lines$/.test(c)) return !sameFan;
      return unknown(q, c);
    });
  }
  if (/Which statement is true\?/.test(P)) {
    return q.choices.map(c => {
      const r = c.match(/^m∠(\d) = (\d+)°(?:: (.*))?$/); if (!r) return unknown(q, c);
      const v = M.valRef(r[1]);
      if (v === null || !v.eq(num(r[2]))) return false;
      if (!r[3]) return true;
      if (r[3] === 'vertical angles are equal') {
        const X = M.angOf(r[1]);
        return M.marks.some(k => { const Y = { f: k.f, a: k.a, b: k.b }; return M.vertical(X, Y) && /°/.test(k.text ?? '') && M.val(M.angForm(Y))?.eq(num(r[2])); });
      }
      return unknown(q, c);
    });
  }
  return null;
};

F.allNames = q => {
  const M = model(q, { promptFacts: false }), P = M.P;
  const m = P.match(/Which names fit ∠(\w+)(?: \(the right angle\))? and ∠(\w+)\?/);
  if (!m) return null;
  const X = M.angOf(m[1]), Y = M.angOf(m[2]);
  const s = M.val(ladd(M.angForm(X), M.angForm(Y)));
  const truth = new Set();
  if (M.adjacent(X, Y)) truth.add('adjacent');
  if (M.vertical(X, Y)) truth.add('vertical');
  if (s && s.eq(90)) truth.add('complementary');
  if (s && s.eq(180)) truth.add('supplementary');
  const eqSet = (a, b) => a.size === b.size && [...a].every(x => b.has(x));
  return q.choices.map(c => {
    let r, set;
    if (/^No name fits$/.test(c) || /^Neither: they do not touch$/.test(c)) {
      set = new Set();
      if (/do not touch/.test(c) && X.f === Y.f) return false;
      return eqSet(set, truth);
    }
    if (/^A linear pair$/.test(c)) return eqSet(new Set(['adjacent', 'supplementary']), truth);
    if ((r = c.match(/^Only (adjacent|vertical|supplementary|complementary)(?:: (\d+) \+ (\d+) = (\d+))?$/))) {
      if (r[2]) { const a = M.val(M.angForm(X)), b = M.val(M.angForm(Y)); if (!(a?.eq(num(r[2])) && b?.eq(num(r[3])) && num(r[2]) + num(r[3]) === num(r[4]))) return false; }
      return eqSet(new Set([r[1]]), truth);
    }
    if ((r = c.match(/^(Adjacent|Vertical|Supplementary|Complementary) and (adjacent|vertical|supplementary|complementary)(: a linear pair)?$/))) {
      set = new Set([r[1].toLowerCase(), r[2]]);
      if (r[3] && !(set.has('adjacent') && set.has('supplementary'))) return false;
      return eqSet(set, truth);
    }
    return unknown(q, c);
  });
};

function chainCan(q) {
  const M = model(q);
  const x = M.val(target(M));
  return q.choices.map(c => {
    let r;
    if ((r = c.match(/^No: ∠([A-Z]{3}) has no number on it$/))) return x === null;
    if ((r = c.match(/^Yes: x = (\d+)°, the same as ∠([A-Z]{3})$/))) return x !== null && x.eq(num(r[1])) && M.vertical(M.angOf(r[2]), (() => { const qm = M.marks.find(k => k.text === 'x'); return qm && { f: qm.f, a: qm.a, b: qm.b }; })());
    if ((r = clean(c).match(/^Yes: m∠([A-Z]{3}) = (\d+)° \(vertical to ∠([A-Z]{3})\), so x = (\d+) - (\d+) = (\d+)°$/))) {
      const w = M.valRef(r[1]);
      return x !== null && w !== null && w.eq(num(r[2])) && M.vertical(M.angOf(r[1]), M.angOf(r[3])) && num(r[4]) === num(r[2]) && num(r[4]) - num(r[5]) === num(r[6]) && x.eq(num(r[6]));
    }
    return unknown(q, c);
  });
}

function contextAssume(q) {
  // "To say the corner across from the 62° corner is also 62°, what must you assume?" Vertical angles need two
  // straight lines; street width and a to-scale map play no part.
  return q.choices.map(c => {
    if (/^Both streets are straight lines$/.test(c)) return true;
    if (fallacy(c)) return false;
    return unknown(q, c);
  });
}

/** a solution step "m∠ABC = 180° − 130° = 50°" / "m∠ABC = 60°" → { ang, kind, total?, sub?, res } */
function parseStep(text) {
  const t = clean(text);
  let m;
  if ((m = t.match(/m∠([A-Z]{3}) = (\d+)° - (\d+)° = (\d+)°/))) return { ang: m[1], total: +m[2], sub: +m[3], res: +m[4] };
  if ((m = t.match(/m∠([A-Z]{3}) = (\d+)°/))) return { ang: m[1], res: +m[2] };
  return null;
}

F.reason = q => {
  const M = model(q, { promptFacts: false });
  const st = parseStep(M.P);
  const T = M.angOf(st.ang), tv = M.val(M.angForm(T));
  const others = M.marks.filter(k => !(k.f === T.f && k.a === T.a && k.b === T.b));
  return q.choices.map(c => {
    let r;
    const cc = clean(c);
    if (fallacy(cc)) return false;
    if ((r = cc.match(/^The (\w+) angles fill the full turn around ([A-Z]): 360°$/))) {
      const n = { two: 2, three: 3, four: 4, five: 5, six: 6 }[r[1]];
      const f = T.f;
      return st.total === 360 && r[2] === f.O && f.rays.length === n && f.marks.length === n && others.reduce((a, k) => a + num(String(k.text).replace('°', '')), 0) === st.sub && st.total - st.sub === st.res;
    }
    if ((r = cc.match(/^Linear pair: ([A-Z])([A-Z]) and ([A-Z])([A-Z]) are opposite rays of line ([A-Z])([A-Z])$/))) {
      if (st.total !== 180) return false;
      const ok = r[1] === T.f.O && r[3] === T.f.O && new Set([r[2], r[4], r[5], r[6]]).size === 2 && M.isLineIn(T.f, r[2], r[4]);
      // the target and the angle subtracted must make the straight angle along that line
      const partner = others.find(k => M.linearPair(T, { f: k.f, a: k.a, b: k.b }) && new Set([...M.outer(T, { f: k.f, a: k.a, b: k.b }), r[2], r[4]]).size === 2);
      return ok && !!partner && num(String(partner.text).replace('°', '')) === st.sub && 180 - st.sub === st.res;
    }
    if ((r = cc.match(/^∠([A-Z]{3}) and ∠([A-Z]{3}) are a linear pair$/))) {
      if (st.total !== 180) return false;
      return M.linearPair(M.angOf(r[1]), M.angOf(r[2]));
    }
    if ((r = cc.match(/^Vertical angles are equal(?:: lines ([A-Z]{2}) and ([A-Z]{2}) cross at ([A-Z]))?$/))) {
      if (st.total !== undefined) return false;
      if (!r[1]) return false;
      const ok = r[3] === T.f.O && M.isLineIn(T.f, r[1][0], r[1][1]) && M.isLineIn(T.f, r[2][0], r[2][1]);
      return ok && others.some(k => M.vertical(T, { f: k.f, a: k.a, b: k.b }) && num(String(k.text).replace('°', '')) === st.res);
    }
    if ((r = cc.match(/^The box marks ∠([A-Z]{3}) as a right angle, and the two parts fill it$/))) {
      if (st.total !== 90) return false;
      const W = M.angOf(r[1]);
      const boxed = M.marks.some(k => k.box && k.f === W.f && k.a === W.a && k.b === W.b);
      const inside = W.f === T.f && (T.a === W.a || T.b === W.b) && T.a !== T.b;
      return boxed && inside && 90 - st.sub === st.res;
    }
    return unknown(q, c);
  }).map((ok, i) => ok && (tv === null || tv.eq(st.res) || !/./.test(q.choices[i])));
};

F.critique = q => {
  const M = model(q, { promptFacts: false });
  const st = parseStep(M.P);
  const T = M.angOf(st.ang), tv = M.val(M.angForm(T));
  const right = tv !== null && tv.eq(st.res);
  const claimedVertical = /writes: vertical angles, so/.test(M.P);
  return q.choices.map(c => {
    let r;
    const cc = clean(c);
    if (fallacy(cc)) return false;
    if ((r = cc.match(/^Supported: line ([A-Z])([A-Z]) is drawn, so it is a linear pair$/))) {
      if (!right || st.total !== 180) return false;
      return M.isLineIn(T.f, r[1], r[2]) && M.marks.some(k => { const Y = { f: k.f, a: k.a, b: k.b }; return M.linearPair(T, Y) && new Set([...M.outer(T, Y), r[1], r[2]]).size === 2; });
    }
    if (/^Not supported: no text says the angles add to 180°$/.test(cc)) return !right;
    if ((r = cc.match(/^Not supported: no line through ([A-Z]), ([A-Z]) and ([A-Z]) is drawn or stated$/))) return !right && r[2] === T.f.O && !M.isLineIn(T.f, r[1], r[3]);
    if ((r = cc.match(/^Not supported: nothing marks ∠([A-Z]{3}) as a right angle$/))) {
      const W = M.angOf(r[1]);
      return !right && !!W && M.val(M.angForm(W)) === null;
    }
    if (/^Supported: ∠([A-Z]{3}) and ∠([A-Z]{3}) are adjacent$/.test(cc)) return false; // adjacency gives no total
    if (/^Supported: the two angles are complementary$/.test(cc)) return right && st.total === 90;
    if ((r = cc.match(/^Wrong: vertical angles are equal, so m∠([A-Z]{3}) = (\d+)°$/))) {
      // the step adds up to 180 for vertical angles: a wrong fact, even when the number happens to come out right
      return claimedVertical && st.total === 180 && r[1] === st.ang && tv !== null && tv.eq(num(r[2])) && M.marks.some(k => M.vertical(T, { f: k.f, a: k.a, b: k.b }) && /°/.test(k.text ?? '') && num(String(k.text).replace('°', '')) === num(r[2]));
    }
    if (/^Right:/.test(cc)) return right && !claimedVertical;
    return unknown(q, c);
  });
};

F.argument = q => {
  const M = model(q, { promptFacts: false }), P = M.P;
  let m;
  if (/Which argument shows that vertical angles are ALWAYS equal/.test(P)) {
    return q.choices.map(c => {
      const cc = clean(c);
      if (fallacy(cc)) return false;
      // the deductive argument: the two sums and the conclusion it draws must follow from the figure's two lines
      const r = cc.match(/^m∠(\d) \+ m∠(\d) = 180° and m∠(\d) \+ m∠(\d) = 180° \(two linear pairs\), so m∠(\d) = m∠(\d) for any crossing$/);
      if (!r) return unknown(q, c);
      const z = u => M.val(u)?.eq(0) ?? false;
      const f = d => M.formOf(d);
      return z(ladd(ladd(f(r[1]), f(r[2])), lf(-180))) && z(ladd(ladd(f(r[3]), f(r[4])), lf(-180))) && z(ladd(f(r[5]), f(r[6]), -1))
        && M.linearPair(M.angOf(r[1]), M.angOf(r[2])) && M.linearPair(M.angOf(r[3]), M.angOf(r[4]));
    });
  }
  if ((m = P.match(/on a figure with m∠1 = (\d+)°: (.*?)\. Does that prove it for a crossing with m∠1 = (\d+)°\?/))) {
    const usesNumber = new RegExp(`\\b${m[1]}\\b`).test(m[2]);
    return q.choices.map(c => {
      const cc = clean(c);
      let r;
      if ((r = cc.match(/^Yes: the steps used only the two linear pairs, never (\d+)°$/))) return !usesNumber && num(r[1]) === num(m[1]);
      if (fallacy(cc)) return false;
      return unknown(q, c);
    });
  }
  if ((m = P.match(/^Fill in the last step: (.*), so …$/))) {
    // the premises as written, nothing else: which statement follows from them for every value?
    const prem = clean(m[1]).split(' and ').map(s => s.split('='));
    const vars = s => clean(s).replace(/m∠(\d)/g, 'a$1');
    const rows = prem.map(([l, r]) => ladd(linOfSimple(vars(l)), linOfSimple(vars(r)), -1));
    const S = solveSystem(rows);
    return q.choices.map(c => {
      const [l, r] = clean(c).split('=');
      if (r === undefined) return unknown(q, c);
      const v = S.value(ladd(linOfSimple(vars(l)), linOfSimple(vars(r)), -1));
      return v !== null && v.eq(0);
    });
  }
  return null;
};
/** "a1 + a2 + 180°" → linear form over a1, a2, ... */
function linOfSimple(s) {
  let u = lf(0);
  for (const m of String(s).replace(/°/g, '').matchAll(/([+-]?)\s*(a\d|\d+)/g)) {
    const k = m[1] === '-' ? -1 : 1;
    u = /^a/.test(m[2]) ? ladd(u, lv(m[2]), k) : ladd(u, lf(Number(m[2])), k);
  }
  return u;
}

// ---------------------------------------------------------------- world checks
function worldProblems(q) {
  const probs = [];
  const promptFacts = !['reason', 'critique', 'argument', 'names', 'evidence', 'linearPair', 'allNames', 'armLength'].includes(q.family);
  let M;
  try { M = model(q, { promptFacts }); } catch (e) { return [`could not read the figure (${e.message})`]; }
  if (!M.sys.consistent) probs.push('the numbers in the figure and the text contradict each other');
  const nts = !!q.data?.picture?.nts;
  for (const f of M.fans) {
    const letters = f.rays.filter(r => !r.noLetter).map(r => r.p);
    const dup = letters.filter((p, i) => letters.indexOf(p) !== i);
    if (dup.length) probs.push(`two rays at ${f.O} carry the same letter ${[...new Set(dup)].join(', ')}`);
    // a drawn line must be straight on the drawing
    for (const [A, B] of f.lines) if (Math.abs(ccw(f.deg[A], f.deg[B]) - 180) > 0.6) probs.push(`line ${A}${B} is drawn bent at ${f.O}`);
    // every angle between neighbouring rays that the givens fix must be positive and look like its value
    f.rays.forEach((r, i) => {
      const v = M.val(lv(`g${f.fi}_${i}`));
      if (v === null) return;
      if (v.value <= 0) probs.push(`an angle at ${f.O} would be ${v.value}°`);
      const drawn = ccw(r.deg, f.rays[(i + 1) % f.rays.length].deg);
      if (!nts && Math.abs(drawn - v.value) > 25) probs.push(`the angle ${r.p}${f.O}${f.rays[(i + 1) % f.rays.length].p} is ${v.value}° but drawn as ${drawn}°`);
    });
  }
  if (q.input === 'num' && ['addParts', 'findPair', 'findVertical', 'missingPart', 'lineParts', 'aroundPoint', 'mixed', 'expr', 'exprCombined', 'chain', 'context'].includes(q.family)) {
    let t = null;
    try { t = M.val(target(M)); } catch (e) { probs.push(`no clear question (${e.message})`); }
    if (t === null) probs.push('the asked value is not fixed by the figure and the text');
    else {
      if (t.d !== 1) probs.push(`the answer ${t} is not a whole number`);
      // every angle written with x must be positive
      for (const k of M.marks) if (/x/.test(k.text ?? '')) { const v = M.val(M.span(k.f, k.a, k.b)); if (v && v.value <= 0) probs.push(`${k.text} would be ${v.value}°`); }
    }
  }
  return probs;
}

// ---------------------------------------------------------------- contract
const pick = arr => {
  if (!Array.isArray(arr)) return undefined;
  const hits = arr.map((ok, i) => (ok ? i : -1)).filter(i => i >= 0);
  return hits.length >= 1 ? hits[0] : -1;
};
const cleanQ = q => ({ ...q, prompt: clean(q.prompt), choices: q.choices?.map(clean) });
export default {
  solve(q) {
    q = cleanQ(q);
    const f = F[q.family];
    if (!f) { dbg('no family', q.family); return undefined; }
    let r;
    try { r = f(q); } catch (e) { dbg(q.family, q.id, 'throws', e.message); return undefined; }
    if (q.input === 'choice') return pick(r);
    if (r === null || r === undefined) return undefined;
    return typeof r === 'object' ? r.value : r;   // a number (NaN: no single answer, see sane)
  },
  sane(q) {
    q = cleanQ(q);
    const probs = worldProblems(q);
    if (q.family === 'critique' && /writes: vertical angles, so/.test(q.prompt)) {
      try {
        const M = model(q, { promptFacts: false }), st = parseStep(q.prompt), v = M.val(M.angForm(M.angOf(st.ang)));
        if (v && v.eq(st.res)) probs.push(`the wrong rule (180° − ${st.sub}°) gives the right number ${st.res}° here, so "Wrong … = ${st.res}°" repeats the student's own answer`);
      } catch { /* fine */ }
    }
    if (q.input === 'choice') {
      let r = null;
      try { r = F[q.family]?.(q); } catch { r = null; }
      if (Array.isArray(r)) {
        const n = r.filter(Boolean).length;
        if (n === 0) probs.push('no choice is right');
        if (n > 1) probs.push(`${n} choices are right: ${r.map((ok, i) => (ok ? `"${q.choices[i]}"` : '')).filter(Boolean).join(' / ')}`);
      }
    }
    return [...new Set(probs)].join('; ');
  },
};
