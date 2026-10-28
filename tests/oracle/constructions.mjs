// Oracle for the lesson "constructions" (Geometry: constructions with compass and straightedge).
// Written from what the student sees only: the prompt, the choices, the step card, the proof frame and the drawn
// construction (named points at their positions, given lines / rays / segments / circles). See
// docs/lessons/QUALITY_LAYER.md, "O: the oracle". The board TeX is not drawn on this page, so it is not read.
//
// How it decides:
// - Steps are read as a teacher reads them. A step is a construction step only with the compass, the straightedge or a
//   free mark ("any point", "any line"); a protractor, a ruler's scale, "measure" or "where it looks" is not.
// - An order of steps is simulated: every point a step uses must exist already (given, or made by an earlier step),
//   every line it uses must be drawn, an arc it crosses ("the last one", "it", "the first two", "the long arc") must be
//   drawn and still uncrossed, and "keep that width" keeps the width of the last compass setting. Widths are checked
//   against the drawing: a point made on an arc about X lies at the arc's width from X. Two free widths (each "any
//   width") forced to meet in one point are a broken construction even when the drawing happens to agree.
// - "Which step comes next": the drawn state is the first `upto` steps of the standard construction (the standard
//   order of each construction is textbook knowledge); a step is out when it is not a construction step, needs a point
//   or arc not drawn yet, makes a point that is already drawn, or carries the wrong width.
// - Concept questions: each claim is tested by the maths (distances and angles in the drawing, the givens in words,
//   standard theorems: SSS / SAS, CPCTC, the perpendicular bisector theorem and its converse, linear pairs, the
//   converse of corresponding angles).

import { nums } from '../../tools/quality/oracle-kit.mjs';

// =====================================================================================================================
// helpers
const plain = s => String(s ?? '').replace(/̅/g, '').replace(/[’‘]/g, "'").replace(/[“”]/g, '"').replace(/−/g, '-').replace(/\s+/g, ' ').trim();
const R = (a, why = []) => ({ a, why });
const dist = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1]);
const sub = (a, b) => [a[0] - b[0], a[1] - b[1]];
const cross = (a, b) => a[0] * b[1] - a[1] * b[0];
const dot = (a, b) => a[0] * b[0] + a[1] * b[1];
const angAt = (v, p, q) => { const a = sub(p, v), b = sub(q, v); return (Math.acos(Math.max(-1, Math.min(1, dot(a, b) / (Math.hypot(...a) * Math.hypot(...b))))) * 180) / Math.PI; };
const choiceIdx = (q, pred) => { const i = q.choices.findIndex((c, k) => pred(plain(c), k)); return i; };
const only = (q, pred, why = []) => {
  const hits = q.choices.map((c, i) => (pred(plain(c), i) ? i : -1)).filter(i => i >= 0);
  if (hits.length === 1) return R(hits[0], why);
  return R(hits[0] ?? -1, [...why, hits.length ? `${hits.length} choices are right` : 'no choice is right']);
};
const letterIdx = L => 'abcdef'.indexOf(L);

/** the drawn construction: named points */
function consOf(q) { return q.data?.picture?.cons ?? null; }
function ptsOf(q) {
  const P = {};
  const c = consOf(q)?.c;
  for (const p of c?.pts ?? []) P[p.name] = p.at;
  const f = q.data?.picture?.fig;
  for (const p of f?.points ?? []) if (p.name) P[p.name] = p.at;
  return P;
}
const segLen = (P, s) => dist(P[s[0]], P[s[1]]);
const closeRel = (a, b, rel = 0.01) => Math.abs(a - b) <= Math.max(1.5, rel * Math.max(a, b));
/** the plain text of a congruence like "N̅R̅ ≅ C̅D̅" → [['N','R'],['C','D']] */
const segPair = t => { const m = plain(t).match(/^([A-Z])([A-Z])\s*[≅=≠]\s*([A-Z])([A-Z])/); return m ? [m[1] + m[2], m[3] + m[4]] : null; };

// =====================================================================================================================
// one construction step, as text
const ILLEGAL = /protractor|ruler|Measure|looks?\b|look like|where the answer/i;
function parseStep(t0) {
  const t = plain(t0).replace(/^\([a-f]\)\s*/, '');
  const s = { t, fake: ILLEGAL.test(t), needs: new Set(), makes: new Set(), lineNeeds: new Set(), lineMakes: new Set() };
  if (/^Construct the perpendicular from ([A-Z])/.test(t)) {
    // the compound first perpendicular of the "two perpendiculars" construction
    s.needs.add(t.match(/^Construct the perpendicular from ([A-Z])/)[1]); s.makes.add('_crossing'); s.compound = true;
    return s;
  }
  s.keep = /Keep (that|the same) width/.test(t);
  s.newW = /Open the compass (wider|to a new width)|Open wider/.test(t);
  s.center = t.match(/Put the needle on ([A-Z])/)?.[1];
  s.setTo = t.match(/open the compass to ([A-Z])\b/)?.[1];
  s.arc = /\b(draw|Draw) (a long arc|an arc|arcs|equal arcs)\b/.test(t);
  s.long = s.arc && (/long arc crossing the new ray/.test(t) || /, beyond [A-Z]/.test(t));
  s.target = /crossing the (last )?long arc/.test(t) ? 'long' : /crossing (it|the last one)\b/.test(t) ? 'last' : /crossing the first( two)?\b/.test(t) ? 'first' : null;
  s.acrossRay = /arc across the ray/.test(t);
  s.extend = /extend it with the straightedge/.test(t);
  for (const m of t.matchAll(/\bat ([A-Z])(?: and ([A-Z]))?\b/g)) { s.makes.add(m[1]); if (m[2]) s.makes.add(m[2]); }
  for (const m of t.matchAll(/\bLabel ([A-Z])\b/g)) s.makes.add(m[1]);
  if (/arcs crossing m on both sides/.test(t)) s.makes.add('_two');
  if (/those two points/.test(t)) s.needs.add('_two');
  if (/the crossing\b/.test(t)) s.needs.add('_crossing');
  let m;
  if ((m = t.match(/Draw (?:any )?line ([a-z])\b/))) s.lineMakes.add(m[1]);
  if ((m = t.match(/Draw (?:line|ray) ([A-Z])([A-Z])\b/))) s.lineMakes.add(m[1] + m[2]);
  if ((m = t.match(/line ([A-Z]{2}) crosses/))) s.lineNeeds.add(m[1]);
  if (/crossing m\b|crosses m\b/.test(t)) s.lineNeeds.add('m');
  if (/crossing t\b|side of t\b/.test(t)) s.lineNeeds.add('t');
  // every point named in the step that it does not make must exist
  const words = t.replace(/line ([A-Z]{2}) crosses/, 'line crosses');
  for (const w of words.matchAll(/\b([A-Z]{1,2})\b/g)) for (const L of w[1]) if (!s.makes.has(L)) s.needs.add(L);
  if (s.center && s.makes.has(s.center)) s.makes.delete(s.center);
  return s;
}

/** does an order of steps work? returns '' or the reason it breaks */
function runOrder(steps, P, given) {
  const have = new Set(given), lines = new Set(['ℓ']);
  const arcs = [];
  let cur = null;
  const hasExtend = steps.some(s => s.extend);
  let extended = false;
  // the drawing is computed exactly, so a width either is the same length or is not (a 60° angle can make a chord
  // look like a radius: only an exact match counts)
  const check = (sym, d) => { if (sym.val == null) { sym.val = d; return true; } return Math.abs(sym.val - d) <= 1e-6 * Math.max(1, d); };
  for (const s of steps) {
    if (s.fake) return `not a construction step: ${s.t}`;
    for (const n of s.needs) if (!have.has(n)) return `needs ${n} before it exists: ${s.t}`;
    for (const l of s.lineNeeds) if (!lines.has(l)) return `needs line ${l} first: ${s.t}`;
    for (const n of s.makes) if (have.has(n)) return `makes ${n} again: ${s.t}`;
    if (s.extend) extended = true;
    if (s.compound) { s.makes.forEach(n => have.add(n)); continue; }
    if (s.setTo) cur = { val: dist(P[s.center], P[s.setTo]), free: false };
    else if (s.newW) cur = { val: null, free: true };
    else if (s.keep) { if (!cur) return `keeps a width never set: ${s.t}`; }
    else if (s.arc) cur = { val: null, free: true };
    if (s.arc) {
      if (s.acrossRay && hasExtend && !extended) return `the arc misses the short ray: ${s.t}`;
      let target = null;
      if (s.target === 'long') target = [...arcs].reverse().find(a => a.long);
      else if (s.target === 'last') target = [...arcs].reverse().find(a => a.lonely);
      else if (s.target === 'first') target = arcs.find(a => a.lonely);
      if (s.target && !target) return `crosses an arc that is not drawn: ${s.t}`;
      const real = [...s.makes].filter(n => P[n]);
      if (s.center && P[s.center]) for (const n of real) if (!check(cur, dist(P[s.center], P[n]))) return `width does not fit the drawing: ${s.t}`;
      if (target) {
        if (target.sym !== cur && target.sym.free && cur.free) return `two free widths forced to meet: ${s.t}`;
        if (target.center && P[target.center]) for (const n of real) if (!check(target.sym, dist(P[target.center], P[n]))) return `crossing not on the crossed arc: ${s.t}`;
        target.lonely = false;
      }
      arcs.push({ center: s.center, sym: cur, lonely: s.makes.size === 0, long: s.long });
    }
    s.makes.forEach(n => have.add(n));
    s.lineMakes.forEach(l => lines.add(l));
    if (s.lineMakes.size) for (const l of s.lineMakes) if (/^[A-Z]{2}$/.test(l) && (!have.has(l[0]) || !have.has(l[1]))) return `line through a missing point: ${s.t}`;
  }
  return '';
}
/** the given points: the ones no step makes */
function givenPts(q, steps) {
  const made = new Set(steps.flatMap(s => [...s.makes]));
  return Object.keys(ptsOf(q)).filter(n => !made.has(n));
}

const F = {};

F.orderSteps = q => {
  const lines = q.data.picture.card.lines;
  const steps = lines.map(parseStep);
  const P = ptsOf(q);
  const given = givenPts(q, steps);
  const verdict = q.choices.map(c => {
    const order = plain(c).split(/,\s*/).map(letterIdx);
    if (order.some(i => i < 0 || i >= steps.length) || new Set(order).size !== steps.length) return 'not every step once';
    return runOrder(order.map(i => parseStep(lines[i])), P, given);
  });
  const ok = verdict.map((v, i) => (v ? -1 : i)).filter(i => i >= 0);
  if (ok.length === 1) return R(ok[0]);
  return R(ok[0] ?? -1, [ok.length ? `${ok.length} orders work` : 'no order works']);
};

F.spotFake = q => {
  const lines = q.data.picture.card.lines;
  const bad = lines.map((l, i) => (parseStep(l).fake ? i : -1)).filter(i => i >= 0);
  if (bad.length !== 1) return R(bad[0] ?? -1, [`${bad.length} non-construction steps`]);
  const L = 'abcdef'[bad[0]];
  return R(choiceIdx(q, c => c === `(${L})`));
};

// the standard step order of each construction (what `upto` steps are drawn)
const STD = {
  copySeg: ['set', 'arc1', 'arc2'], angleBis: ['arcO', 'arcA', 'arcB', 'ray'], perpBis: ['arcA', 'arcB', 'line', 'mid'],
  perpAt: ['arcP', 'arcA', 'arcB', 'line'], perpFrom: ['arcP', 'arcA', 'arcB', 'line'],
  parallelCorr: ['t', 'arcQ', 'arcP', 'set', 'chord', 'line'], copyAngle: ['arcO', 'arcO2', 'set', 'chord', 'ray'],
};
F.nextStep = q => {
  const cp = consOf(q), c = cp.c;
  const order = STD[c.kind];
  if (!order) return R(-1, [`unknown construction ${c.kind}`]);
  const done = new Set(order.slice(0, cp.upto));
  const last = order[cp.upto - 1];
  const visible = new Set(c.pts.filter(p => p.deps.every(d => done.has(d))).map(p => p.name));
  const lonely = [...done].some(d => /^arc[AB]$/.test(d) && c.pts.some(p => p.deps.includes(d)) && !c.pts.some(p => p.deps.includes(d) && visible.has(p.name)));
  const lines = new Set(['ℓ']);
  if (done.has('t')) lines.add('t');
  const why = q.choices.map(t => {
    const s = parseStep(t);
    if (s.fake) return 'not a construction step';
    for (const n of s.needs) if (!visible.has(n)) return `needs ${n}`;
    for (const l of s.lineNeeds) if (!lines.has(l) && !(/^[A-Z]{2}$/.test(l) && done.has('line') && l.split('').every(n => visible.has(n)))) return `needs line ${l}`;
    for (const n of s.makes) if (visible.has(n)) return `${n} is already drawn`;
    if ((s.target === 'last' || s.target === 'first') && !lonely) return 'no uncrossed arc to cross';
    if (s.target === 'long' && !done.has('arcP') && !done.has('arcO2')) return 'no long arc yet';
    // widths
    if (s.setTo && !done.has('arcP') && !done.has('arcO2')) return 'the compass still holds the radius the long arc needs';
    if (s.newW && s.makes.size) return 'a new width breaks the equal widths the step needs';
    if (s.keep) {
      if (s.target === 'long' && last !== 'set') return 'keeps the radius, the chord is needed';
      if (s.long && !['arcQ', 'arcO2', 'arcO'].includes(last)) return 'keeps the wrong width';
      if (s.acrossRay && last !== 'set' && last !== 'arc1') return 'keeps the wrong width'; // arc1 kept the set width
      if (!s.target && !s.long && !s.acrossRay && s.makes.size) return 'keeps a width nothing asks for';
    }
    if (s.lineMakes.size && [...s.lineMakes].some(l => /^[A-Z]{2}$/.test(l) && l.split('').some(n => !visible.has(n)))) return 'line through a missing point';
    return '';
  });
  const ok = why.map((w, i) => (w ? -1 : i)).filter(i => i >= 0);
  if (ok.length === 1) return R(ok[0]);
  return R(ok[0] ?? -1, [ok.length ? `${ok.length} next steps work` : 'no next step works']);
};

// =====================================================================================================================
// construction-rules
F.toolRules = q => {
  const notAllowed = /NOT allowed/.test(q.prompt);
  const allowedOf = t => !ILLEGAL.test(t) && !/Read the compass opening|exactly where/.test(t);
  return only(q, c => (notAllowed ? !allowedOf(c) : allowedOf(c)));
};
F.freeChoice = q => only(q, c => /any width wider than half/.test(c));

// arc-distance
F.arcRead = q => {
  const p = plain(q.prompt), P = ptsOf(q);
  const m = p.match(/opened to ([\d.]+) cm and an arc was drawn about ([A-Z])\. ([A-Z]) and ([A-Z]) are on the arc/);
  const ask = p.match(/How far is ([A-Z]) from ([A-Z])\?/);
  const w = Number(m[1]);
  const ref = [m[3], m[4]].find(n => n !== ask[1]);
  const ratio = dist(P[ask[1]], P[m[2]]) / dist(P[ref], P[m[2]]);
  const why = Math.abs(ratio - 1) > 0.01 ? [`${ask[1]} is not drawn on the arc`] : [];
  return R(Math.round(w * ratio * 10) / 10, why);
};
F.onInside = q => {
  const p = plain(q.prompt), P = ptsOf(q);
  const m = p.match(/circle about ([A-Z]) .* besides ([A-Z]) is exactly/);
  const O = P[m[1]], r = dist(O, P[m[2]]);
  const on = Object.keys(P).filter(n => n !== m[1] && n !== m[2] && Math.abs(dist(O, P[n]) - r) < 1.5).sort().join(',');
  return only(q, c => c.split(/ and /).map(s => s.trim()).sort().join(',') === on);
};
F.reopened = q => only(q, c => /not equal/.test(c));

// circle-intersections
F.howMany = q => {
  const p = plain(q.prompt);
  const d = Number(p.match(/is ([\d.]+) cm long/)[1]);
  const rs = [...p.matchAll(/radius ([\d.]+) cm/g)].map(m => Number(m[1]));
  const r1 = rs[0], r2 = rs[1] ?? rs[0];
  const s = r1 + r2, df = Math.abs(r1 - r2);
  const why = [];
  if (Math.abs(d - s) < 1e-9 || Math.abs(d - df) < 1e-9) return R(1, why);
  return R(d < s && d > df ? 2 : 0, why);
};
F.bothCond = q => {
  const p = plain(q.prompt);
  const m = p.match(/arc about ([A-Z]) with width ([\d.]+) cm and an arc about ([A-Z]) with width ([\d.]+) cm cross at ([A-Z])/);
  const want = `${m[5]}${m[1]} = ${m[2]} cm and ${m[5]}${m[3]} = ${m[4]} cm`;
  return only(q, c => c === want);
};

// perp-bisector-definition
F.pbWhich = q => {
  const g = q.data.picture.gallery;
  const good = g.figs.map(f => {
    const halves = f.segs.filter(s => s.id === 'AP' || s.id === 'PB');
    const mid = halves.length === 2 && halves[0].ticks > 0 && halves[0].ticks === halves[1].ticks;
    const ang = f.angles[0];
    const right = !!ang && (ang.box || /^90°$/.test(ang.text ?? ''));
    // the line must pass through the split point
    const ln = f.segs.find(s => s.kind === 'line'), Pm = halves[0]?.b;
    const thru = ln && Pm && Math.abs(cross(sub(ln.b, ln.a), sub(Pm, ln.a))) / dist(ln.a, ln.b) < 1.5;
    return mid && right && thru;
  });
  const idx = good.map((v, i) => (v ? i : -1)).filter(i => i >= 0);
  if (idx.length !== 1) return R(-1, [`${idx.length} lines are marked as perpendicular bisectors`]);
  return R(choiceIdx(q, c => c === plain(g.caps[idx[0]])));
};
F.pbBoth = q => {
  const p = plain(q.prompt);
  if (/the midpoint of/.test(p) && !/perpendicular to/.test(p)) return only(q, c => /^Only if .* perpendicular/.test(c));
  if (/is perpendicular to/.test(p)) return only(q, c => /^Only if .* midpoint/.test(c));
  return R(-1, ['unread']);
};

// angle-bisector-definition
F.abHalf = q => { const m = plain(q.prompt).match(/= ([\d.]+)°/); return R(Number(m[1]) / 2); };
F.abMid = q => {
  const p = plain(q.prompt);
  const m = p.match(/m∠([A-Z]) = ([\d.]+)° and m∠([A-Z]) = ([\d.]+)°, so m∠([A-Z]) = ([\d.]+)°/);
  const why = [];
  if (Math.abs(Number(m[2]) + Number(m[4]) + Number(m[6]) - 180) > 1e-9) why.push('angles do not make 180°');
  // the bisector meets the opposite side at its midpoint only when the triangle is isosceles there
  if (Number(m[2]) === Number(m[4])) { why.push('isosceles: the bisector does go through the midpoint'); return R(-1, why); }
  return only(q, c => /^Not in general/.test(c), why);
};

// compass-transfer
F.keepWidth = q => only(q, c => /is no longer as long as/.test(c));
F.needleWhere = q => {
  const c = consOf(q).c, P = ptsOf(q);
  const ray = c.given.find(g => g.kind === 'ray');
  const end = Object.keys(P).find(n => dist(P[n], ray.a) < 1.5);
  return only(q, t => new RegExp(`^On ${end}, the endpoint of the ray`).test(t));
};

// copy-segment
F.copyTwice = q => { const m = plain(q.prompt).match(/is ([\d.]+) cm/); return R(2 * Number(m[1])); };
F.turnedCopy = q => only(q, c => /^Yes: .* the direction does not matter/.test(c));

// equilateral-triangle
F.eqWhy = q => {
  const p = plain(q.prompt);
  const [, A, B] = p.match(/triangle on ([A-Z])([A-Z])\./);
  return only(q, c => {
    const m = c.match(/^([A-Z])([A-Z]) = ([A-Z])([A-Z]) \(on the arc about ([A-Z])[^)]*\) and ([A-Z])([A-Z]) = ([A-Z])([A-Z]) \(on the arc about ([A-Z])/);
    if (!m) return false;
    const base = [A, B].sort().join('');
    return [m[3] + m[4], m[8] + m[9]].every(s => s.split('').sort().join('') === base) && new Set([m[5], m[10]]).size === 2 && [m[5], m[10]].every(x => x === A || x === B);
  });
};
F.eqRhombus = q => { const m = plain(q.prompt).match(/= ([\d.]+) cm/); return R(4 * Number(m[1])); };

// perp-bisector-construct
F.pbWidth = q => {
  const L = Number(plain(q.prompt).match(/is ([\d.]+) cm long/)[1]);
  return only(q, c => Number(c.match(/[\d.]+/)[0]) > L / 2);
};

// midpoint-from-bisector
F.midPick = q => {
  const c = consOf(q).c, P = ptsOf(q);
  const seg = c.given[0];
  const M = [(seg.a[0] + seg.b[0]) / 2, (seg.a[1] + seg.b[1]) / 2];
  const name = Object.keys(P).find(n => dist(P[n], M) < 1.5);
  return only(q, t => t === name);
};
F.midNum = q => { const m = plain(q.prompt).match(/= ([\d.]+) cm/); return R(Number(m[1]) / 2); };

// angle-bisector-construct
F.abFlawRays = q => {
  const p = plain(q.prompt), P = ptsOf(q);
  const m = p.match(/marked ([A-Z]) and ([A-Z]) on the sides with two DIFFERENT arcs about ([A-Z])/);
  const why = closeRel(dist(P[m[3]], P[m[1]]), dist(P[m[3]], P[m[2]])) ? ['the two marks are drawn at the same distance'] : [];
  return only(q, c => new RegExp(`^No: ${m[3]}${m[1]} ≠ ${m[3]}${m[2]}`).test(c), why);
};

// perp-through-point-on-line
F.ponWrong = q => {
  const p = plain(q.prompt), P = ptsOf(q);
  const m = p.match(/at ([A-Z]), Leo marked ([A-Z]) and ([A-Z]) with two different arcs/);
  const why = closeRel(dist(P[m[1]], P[m[2]]), dist(P[m[1]], P[m[3]])) ? ['the two marks are drawn at the same distance'] : [];
  return only(q, c => /^No: /.test(c), why);
};

// inscribed-regular-polygons
F.hexClose = q => only(q, c => /^Exactly on /.test(c));
F.centralAngle = q => {
  const p = plain(q.prompt);
  const n = /square/.test(p) ? 4 : /equilateral triangle/.test(p) ? 3 : /hexagon/.test(p) ? 6 : /octagon/.test(p) ? 8 : null;
  return R(n ? 360 / n : -1);
};
F.polyJoin = q => {
  const p = plain(q.prompt), P = ptsOf(q);
  const nm = p.match(/Is ([A-Z])([A-Z])([A-Z])([A-Z]) a square\?/);
  const [a, b, c, d] = nm.slice(1).map(n => P[n]);
  // diagonals a-c and b-d are the diameters
  const ang = angAt([0, 0], sub(c, a), sub(d, b));
  const perp = Math.abs(ang - 90) < 0.5;
  if (perp) return only(q, t => /^Yes: the diameters are perpendicular/.test(t));
  return only(q, t => /^No: the diameters are not perpendicular, so it is a rectangle/.test(t));
};

// perp-through-point-off-line
F.poffRadius = q => {
  const d = Number(plain(q.prompt).match(/is ([\d.]+) cm from line/)[1]);
  return only(q, c => Number(c.match(/[\d.]+/)[0]) > d);
};

// copy-angle
F.caChord = q => only(q, c => /distance between where the first arc crosses the sides/.test(c));
F.armLength = q => only(q, c => /^No: an angle is the turn/.test(c));

// parallel-double-perpendicular
F.secondPerp = q => {
  const p = plain(q.prompt);
  const X = p.match(/line through ([A-Z]) parallel/)[1];
  return only(q, c => c === `At ${X}, perpendicular to m`);
};
F.ddWhy = q => only(q, c => /both perpendicular to m, and two lines perpendicular to the same line are parallel/.test(c));

// parallel-corresponding-angle
F.corrCheck = q => {
  const p = plain(q.prompt), P = ptsOf(q);
  const m = p.match(/copied to ([A-Z]), giving line ([A-Z])([A-Z])/);
  const l = consOf(q).c.given.find(g => g.name === 'ℓ');
  const u = sub(l.b, l.a), v = sub(P[m[3]], P[m[2]]);
  const par = Math.abs(cross(u, v)) / (Math.hypot(...u) * Math.hypot(...v)) < 0.005;
  const why = [];
  for (const ch of q.choices) { const a = plain(ch).match(/the angle at ([A-Z]) is on the far side/); if (a && a[1] !== m[1]) why.push(`a choice speaks of "the angle at ${a[1]}", but the angle was copied to ${m[1]}`); }
  if (par) return only(q, c => /^Yes: the copy is in the corresponding position/.test(c), why);
  return only(q, c => /^No: /.test(c), why);
};
F.corrWhy = q => only(q, c => /^Congruent corresponding angles .* force the lines to be parallel/.test(c));

// other-tools-constructions
F.foldWhich = q => {
  const p = plain(q.prompt);
  let m;
  if ((m = p.match(/bisector of the angle at ([A-Z])/))) return only(q, c => c === `Fold one side of the angle onto the other, creasing through the vertex ${m[1]}`);
  if ((m = p.match(/perpendicular to ℓ through ([A-Z])/))) return only(q, c => c === `Fold ℓ onto itself so that the crease passes through ${m[1]}`);
  if ((m = p.match(/perpendicular bisector of ([A-Z])([A-Z])/))) return only(q, c => c === `Fold the paper so ${m[1]} lands exactly on ${m[2]}, and crease` || c === `Fold the paper so ${m[2]} lands exactly on ${m[1]}, and crease`);
  return R(-1, ['unread']);
};
F.dragTest = q => only(q, c => /built from two circles/.test(c));
F.foldWhy = q => only(q, c => /reflection that swaps/.test(c));

// construction-conjectures
F.circumWhere = q => {
  const angs = [...plain(q.prompt).matchAll(/m∠[A-Z] = ([\d.]+)°/g)].map(m => Number(m[1]));
  const why = Math.abs(angs.reduce((a, b) => a + b, 0) - 180) > 1e-9 ? ['angles do not make 180°'] : [];
  const big = Math.max(...angs);
  if (big === 90) return only(q, c => /On the longest side, at its midpoint/.test(c), why);
  return only(q, c => (big < 90 ? /^Inside/ : /^Outside/).test(c), why);
};
F.guaranteed = q => {
  // redo the construction with another allowed width and keep the claims that still hold
  const p = plain(q.prompt), P = ptsOf(q);
  const [, A, B] = p.match(/bisected ([A-Z])([A-Z]);/);
  const L = dist(P[A], P[B]);
  const names = new Set(q.choices.flatMap(c => plain(c).match(/[A-Z]/g) ?? []));
  const X = [...names].find(n => n !== A && n !== B);
  const side = Math.sign(cross(sub(P[B], P[A]), sub(P[X], P[A]))) || 1;
  const holds = w => {
    const M = [(P[A][0] + P[B][0]) / 2, (P[A][1] + P[B][1]) / 2], h = Math.sqrt(w * w - (L / 2) ** 2);
    const u = sub(P[B], P[A]), n = [(-u[1] / L) * side, (u[0] / L) * side];
    const Q = { [A]: P[A], [B]: P[B], [X]: [M[0] + n[0] * h, M[1] + n[1] * h] };
    return c => {
      let m;
      if ((m = c.match(/^([A-Z])([A-Z]) = ([A-Z])([A-Z])$/))) return closeRel(dist(Q[m[1]], Q[m[2]]), dist(Q[m[3]], Q[m[4]]), 0.002);
      if ((m = c.match(/^m∠([A-Z])([A-Z])([A-Z]) = ([\d.]+)°$/))) return Math.abs(angAt(Q[m[2]], Q[m[1]], Q[m[3]]) - Number(m[4])) < 0.1;
      if ((m = c.match(/^△([A-Z])([A-Z])([A-Z]) is equilateral$/))) { const s = [dist(Q[m[1]], Q[m[2]]), dist(Q[m[2]], Q[m[3]]), dist(Q[m[1]], Q[m[3]])]; return closeRel(s[0], s[1], 0.002) && closeRel(s[1], s[2], 0.002); }
      return false;
    };
  };
  const widths = [0.55, 0.7, 0.9, 1, 1.3, 2].map(k => k * L);
  return only(q, c => widths.every(w => holds(w)(plain(c))));
};
F.testConj = q => only(q, c => /^It is a conjecture/.test(c));

// construction-givens
F.givenFromArcs = q => {
  const P = ptsOf(q);
  return only(q, c => { const s = segPair(c); return !!s && s[0] !== s[1] && closeRel(segLen(P, s[0]), segLen(P, s[1]), 0.02); });
};
F.sharedSide = q => {
  const m = plain(q.prompt).match(/In △([A-Z]{3}) and △([A-Z]{3})/);
  const shared = m[1].split('').filter(x => m[2].includes(x)).sort().join('');
  return only(q, c => { const s = segPair(c); return !!s && s[0] === s[1] && s[0].split('').sort().join('') === shared; });
};

// justify-angle-bisector
F.abProofCrit = q => only(q, c => c === 'SSS');
F.abProofNext = q => {
  const m = plain(q.prompt).match(/△([A-Z])([A-Z])([A-Z]) ≅ △([A-Z])([A-Z])([A-Z])/);
  const [V, A, X] = [m[1], m[2], m[3]], B = m[5];
  return only(q, c => c.startsWith(`∠${A}${V}${X} ≅ ∠${B}${V}${X}`) && /so ray .* bisects the angle/.test(c));
};

// proof frames: the reason of one row, worked out from the statements
const texSt = t => plain(String(t ?? '').replace(/\\overline\{([A-Z]+)\}/g, '$1').replace(/\\overrightarrow\{([A-Z]+)\}/g, 'ray $1').replace(/\\text\{([^{}]*)\}/g, ' $1 ')
  .replace(/\\angle\s*/g, '∠').replace(/\\triangle\s*/g, '△').replace(/\\cong/g, '≅').replace(/\\perp/g, '⊥').replace(/\\[,;: ]/g, ' ').replace(/[{}]/g, '').replace(/\\[a-zA-Z]+/g, ' '));
const normSeg = s => s.split('').sort().join('');
function reasonOf(rows, i) {
  const st = texSt(rows[i].st);
  const before = rows.slice(0, i).map(r => texSt(r.st));
  const tri = st.match(/^△([A-Z]{3}) ≅ △([A-Z]{3})$/);
  if (tri) {
    const [a, b] = [tri[1], tri[2]];
    const segs = new Set(), angs = new Set();
    for (const s of before) for (const part of s.split(/,\s*/)) {
      let m;
      if ((m = part.match(/^([A-Z]{2}) ≅ ([A-Z]{2})$/))) { segs.add(normSeg(m[1]) + '|' + normSeg(m[2])); segs.add(normSeg(m[2]) + '|' + normSeg(m[1])); }
      if ((m = part.match(/^∠([A-Z]{3}) ≅ ∠([A-Z]{3})$/))) { angs.add(m[1][1] + normSeg(m[1][0] + m[1][2]) + '|' + m[2][1] + normSeg(m[2][0] + m[2][2])); angs.add(m[2][1] + normSeg(m[2][0] + m[2][2]) + '|' + m[1][1] + normSeg(m[1][0] + m[1][2])); }
    }
    const side = (i, j) => { const x = normSeg(a[i] + a[j]), y = normSeg(b[i] + b[j]); return x === y || segs.has(x + '|' + y); };
    const ang = k => { const o = [0, 1, 2].filter(t => t !== k); const x = a[k] + normSeg(a[o[0]] + a[o[1]]), y = b[k] + normSeg(b[o[0]] + b[o[1]]); return x === y || angs.has(x + '|' + y); };
    const S = [side(0, 1), side(1, 2), side(0, 2)];
    if (S.every(Boolean)) return 'SSS';
    // SAS: the angle between two known sides
    if (S[0] && S[1] && ang(1)) return 'SAS';
    if (S[1] && S[2] && ang(2)) return 'SAS';
    if (S[0] && S[2] && ang(0)) return 'SAS';
    return null;
  }
  const parts = st.split(/,\s*/);
  const allSeg = parts.every(x => /^[A-Z]{2} ≅ [A-Z]{2}$/.test(x));
  if (parts.length === 1 && /^([A-Z]{2}) ≅ \1$/.test(st)) return 'Reflexive Property of Congruence';
  const afterTri = before.some(s => /^△/.test(s));
  if (/^ray [A-Z]{2} bisects ∠/.test(st)) return 'Definition of angle bisector';
  if (afterTri) return 'CPCTC';
  if (allSeg) return 'Same compass width (construction)';
  return null;
}
F.proofReason = q => {
  const pr = q.data.picture.proof;
  const ask = pr.ask[0];
  const want = reasonOf(pr.rows, ask.i);
  if (!want) return R(-1, ['unread proof row']);
  return only(q, c => c === want);
};

// justify-copy-angle
F.caProof = q => only(q, c => /by SSS \(two radii and the transferred chord\)/.test(c));
F.caMissing = q => {
  const m = plain(q.prompt).match(/copied ∠([A-Z])([A-Z])([A-Z])/);
  const chord = normSeg(m[1] + m[3]);
  return only(q, c => { const s = segPair(c); return !!s && s.some(x => normSeg(x) === chord); });
};

// justify-perp-bisector
F.pbProof1 = q => {
  const p = plain(q.prompt), P = ptsOf(q);
  const [, , , A, B] = p.match(/line ([A-Z])([A-Z]) is the perpendicular bisector of ([A-Z])([A-Z])/);
  const off = n => Math.abs(cross(sub(P[B], P[A]), sub(P[n], P[A]))) / dist(P[A], P[B]) > 1.5;
  return only(q, c => {
    const m = c.match(/^△([A-Z]{3}) ≅ △([A-Z]{3}) by (SSS|SAS)$/);
    if (!m || m[3] !== 'SSS') return false;
    const others = m[1].split('').filter(x => x !== A && x !== B);
    // the first congruence needs only the arc widths: both other vertices are the arc crossings, off the segment
    return others.length === 2 && others.every(off) && others.every(x => closeRel(dist(P[x], P[A]), dist(P[x], P[B]), 0.01));
  });
};
F.pbProof2 = q => only(q, c => / AND .* a linear pair, so both are 90°/.test(c));
F.pbLinear = () => R(90);

// equidistance
F.fwdNum = q => { const m = plain(q.prompt).match(/= ([\d.]+) cm/); return only(q, c => c === `${m[1]} cm`); };
F.fwdWhy = q => only(q, c => /by SAS: .* right angles at .* shared/.test(c));
F.convWhy = q => {
  const p = plain(q.prompt);
  const names = new Set(p.match(/\b[A-Z]\b/g));
  const why = [];
  for (const c of q.choices) { const m = plain(c).match(/equidistant from ([A-Z]) and ([A-Z])/); if (m && (!names.has(m[1]) || !names.has(m[2]))) why.push(`a choice names points ${m[1]} and ${m[2]} that are not in the item`); }
  return only(q, c => /by SSS, so .* a congruent linear pair: both 90°/.test(c), why);
};
F.iffBoth = q => only(q, c => / AND every point equidistant/.test(c));
F.boundaryCase = q => {
  const why = [];
  for (const l of q.data.picture.card?.lines ?? []) for (const m of plain(l).matchAll(/△([A-Z]{3})/g)) if (new Set(m[1]).size < 3) why.push(`the card names a triangle △${m[1]} with a repeated vertex`);
  return only(q, c => /^At the midpoint of/.test(c), why);
};

// diagnose-failed-construction
F.diagnose = q => {
  const P = ptsOf(q);
  return only(q, c => {
    const m = c.match(/^([A-Z])([A-Z]) ≠ ([A-Z])([A-Z])/);
    if (!m) return false;
    return !closeRel(dist(P[m[1]], P[m[2]]), dist(P[m[3]], P[m[4]]), 0.02);
  });
};
F.measuredProof = q => only(q, c => /^No: a measured drawing/.test(c));

// loci
F.chooseLocus = q => {
  const p = plain(q.prompt);
  let m;
  if ((m = p.match(/same distance from the two .* at ([A-Z]) and ([A-Z])\./))) return only(q, c => c === `The perpendicular bisector of ${m[1]}${m[2]}` || c === `The perpendicular bisector of ${m[2]}${m[1]}`);
  if ((m = p.match(/equal angles with both fences/))) { const v = p.match(/corner ([A-Z])/)[1]; return only(q, c => c === `The bisector of the angle at ${v}`); }
  if ((m = p.match(/exactly ([\d.]+) (mi|ft|cm|m|km) from the .* at ([A-Z])\./))) return only(q, c => c === `A circle about ${m[3]} with radius ${m[1]} ${m[2]}`);
  return R(-1, ['unread']);
};
F.onPath = q => {
  const f = q.data.picture.fig, P = ptsOf(q);
  const names = plain(q.prompt).match(/from ([A-Z]) and ([A-Z])\./);
  const A = P[names[1]], B = P[names[2]];
  const road = f.segs.find(s => s.id === 'road');
  // points X on the road with XA = XB: (X - M)·(B - A) = 0
  const M = [(A[0] + B[0]) / 2, (A[1] + B[1]) / 2], u = sub(B, A), d = sub(road.b, road.a);
  const k = dot(d, u), c0 = dot(sub(road.a, M), u);
  const why = [];
  if (Math.abs(k) < 1e-6 * Math.hypot(...d) * Math.hypot(...u)) {
    if (Math.abs(c0) < 1e-6 * Math.hypot(...u) * 300) return only(q, c => c === 'Every point of the road', why);
    return only(q, c => c === 'No point', why);
  }
  const t = -c0 / k, X = [road.a[0] + d[0] * t, road.a[1] + d[1] * t];
  if (dist(X, M) < 1.5) why.push('the one point is the midpoint: two choices are right');
  return only(q, c => c === 'Exactly one point', why);
};
F.threeTowns = q => {
  const P = ptsOf(q);
  const [a, b, c] = Object.values(P);
  const area = Math.abs(cross(sub(b, a), sub(c, a)));
  if (area < 1e-6 * dist(a, b) * dist(a, c)) return only(q, t => /^There is none/.test(t));
  return only(q, t => /perpendicular bisectors of two sides cross/.test(t));
};
F.whyTwo = q => only(q, c => /so .* is on the third bisector too/.test(c));
F.circleLocus = q => {
  const m = plain(q.prompt).match(/is a .*\. Which set is every point exactly ([\d.]+) (mi|ft|cm|m|km) from ([A-Z])\?/);
  return only(q, c => c === `A circle with center ${m[3]} and radius ${m[1]} ${m[2]}`);
};
F.arcMeaning = q => only(q, c => /^Every point on that arc is exactly/.test(c));

// later sub-goals
F.abArbitrary = q => {
  const p = plain(q.prompt), P = ptsOf(q);
  const m = p.match(/marked ([A-Z]) and ([A-Z]) on the sides of ∠([A-Z])/);
  const why = closeRel(dist(P[m[3]], P[m[1]]), dist(P[m[3]], P[m[2]])) ? ['the marks are drawn at equal distances'] : [];
  return only(q, c => /^No: that works only when/.test(c), why);
};
F.ponSlant = q => only(q, c => /^The construction: /.test(c));
F.connector = q => {
  const p = plain(q.prompt), P = ptsOf(q);
  const m = p.match(/\(line ([A-Z])([A-Z])\)\. ([A-Z]) is another point of ℓ/);
  const l = consOf(q).c.given.find(g => g.name === 'ℓ');
  const v = sub(P[m[3]], P[m[1]]), u = sub(l.b, l.a);
  const perp = Math.abs(dot(u, v)) / (Math.hypot(...u) * Math.hypot(...v)) < 0.005;
  if (perp) return R(-1, [`${m[1]}${m[3]} is drawn perpendicular to ℓ`]);
  return only(q, c => /^No: only line/.test(c));
};

// =====================================================================================================================
const cache = new WeakMap();
function judge(q) {
  if (cache.has(q)) return cache.get(q);
  let out;
  try { out = F[q.family] ? F[q.family](q) : R(undefined, []); } catch (e) { out = R(undefined, [`oracle error: ${e.message}`]); }
  cache.set(q, out);
  return out;
}
void nums;
export default {
  solve(q) { const a = judge(q).a; return a === -1 ? undefined : a; },
  sane(q) { return judge(q).why.join('; '); },
};
