// Oracle for the lesson "draw-triangles" (grade 7 constructions: givens, ruler/protractor/compass, SAS/ASA/SSS,
// tolerance, existence, angle sum, side-angle order, uniqueness). Written from what the student sees only: the prompt
// (the triangle's givens), the board, the choices and the drawn picture: ruler readings and the segment's ends, the
// protractor's dots (their direction), the compass on the ruler, the sketches' labels and marks, the rays' directions,
// the measured numbers, the candidate points (the first drawn candidate is the one placed where both arcs / rays
// meet). Triangles are solved with the law of sines and cosines; choices are judged by testing each claim. See
// docs/lessons/QUALITY_LAYER.md, "O: the oracle".
import { Q, choiceWhere } from '../../tools/quality/oracle-kit.mjs';

const EPS = 1e-6, RAD = Math.PI / 180;
// ---------------------------------------------------------------- reading
/** '3½' → 3.5, '4' → 4, '2.5' → 2.5 */
const num = s => { const m = String(s).match(/^(\d+(?:\.\d+)?)([½¼¾])?$/); return m ? +m[1] + (m[2] === '½' ? 0.5 : m[2] === '¼' ? 0.25 : m[2] === '¾' ? 0.75 : 0) : NaN; };
/** the givens of a prompt: { sides: { XY: v }, angles: { X: deg }, unit, names } */
function givens(t) {
  const sides = {}, angles = {};
  let unit = null;
  for (const m of String(t).matchAll(/\b([A-Z])([A-Z]) = (\d+(?:\.\d+)?[½¼¾]?) (cm|in|mm)\b/g)) { sides[[m[1], m[2]].sort().join('')] = num(m[3]); unit = m[4]; }
  for (const m of String(t).matchAll(/∠([A-Z]) = (\d+(?:\.\d+)?)°/g)) angles[m[1]] = +m[2];
  const tri = String(t).match(/[Tt]riangle ([A-Z])([A-Z])([A-Z])\b/);
  return { sides, angles, unit, names: tri ? [tri[1], tri[2], tri[3]] : null };
}
const sideKey = (a, b) => [a, b].sort().join('');
const opp = (names, v) => sideKey(...names.filter(x => x !== v));
/** solve a triangle from three givens: { a: {X: side opposite}, ang: {X: deg} } or null (none) / 'many' / [solutions] */
function solveAll(G) {
  const N = G.names, S = { ...G.sides }, A = { ...G.angles };
  const nS = Object.keys(S).length, nA = Object.keys(A).length;
  const out = [];
  const complete = (side, ang) => {
    // side: { X: length opposite X }, ang: { X: degrees }
    const s = { ...side }, a = { ...ang };
    for (let k = 0; k < 3; k++) {
      const known = N.filter(v => a[v] !== undefined);
      if (known.length === 2) a[N.find(v => a[v] === undefined)] = 180 - a[known[0]] - a[known[1]];
    }
    return { s, a };
  };
  if (nA === 3 && nS === 0) return Math.abs(A[N[0]] + A[N[1]] + A[N[2]] - 180) < EPS ? 'many' : null;
  if (nS === 3) {
    const L = Object.fromEntries(N.map(v => [v, S[opp(N, v)]]));
    const [a, b, c] = N.map(v => L[v]).sort((x, y) => x - y);
    if (a + b <= c + EPS) return null;
    const ang = {};
    for (const v of N) { const o = N.filter(x => x !== v); ang[v] = Math.acos((L[o[0]] ** 2 + L[o[1]] ** 2 - L[v] ** 2) / (2 * L[o[0]] * L[o[1]])) / RAD; }
    return [{ s: L, a: ang }];
  }
  if (nS === 1 && nA === 2) {
    const sum = Object.values(A).reduce((x, y) => x + y, 0);
    if (sum >= 180 - EPS) return null;
    const { a } = complete({}, A);
    const k = Object.keys(S)[0], v = N.find(x => opp(N, x) === k), r = S[k] / Math.sin(a[v] * RAD);
    return [{ s: Object.fromEntries(N.map(x => [x, r * Math.sin(a[x] * RAD)])), a }];
  }
  if (nS === 2 && nA === 1) {
    const V = Object.keys(A)[0], keys = Object.keys(S);
    const inc = keys.every(k => k.includes(V));
    if (inc) {
      const o = N.filter(x => x !== V), b = S[sideKey(V, o[0])], c = S[sideKey(V, o[1])];
      const aV = Math.sqrt(b * b + c * c - 2 * b * c * Math.cos(A[V] * RAD));
      return solveAll({ names: N, sides: { [opp(N, V)]: aV, [sideKey(V, o[0])]: b, [sideKey(V, o[1])]: c }, angles: {} });
    }
    // SSA: the side opposite V is known, and one other side
    const aV = S[opp(N, V)], otherKey = keys.find(k => k !== opp(N, V)), other = S[otherKey];
    const W = N.find(x => opp(N, x) === otherKey);   // the vertex opposite the other side
    const sinW = (other * Math.sin(A[V] * RAD)) / aV;
    if (sinW > 1 + EPS) return null;
    const cands = [Math.asin(Math.min(1, sinW)) / RAD];
    if (sinW < 1 - EPS) cands.push(180 - cands[0]);
    for (const w of cands) if (A[V] + w < 180 - EPS) out.push(w);
    return out.length ? out.map(w => ({ ang: { [V]: A[V], [W]: w } })) : null;
  }
  return undefined;
}
const pic = q => q.data?.picture ?? null;
const angleAt = (P, Q1, Q2) => { const u = [Q1[0] - P[0], Q1[1] - P[1]], v = [Q2[0] - P[0], Q2[1] - P[1]]; return Math.acos((u[0] * v[0] + u[1] * v[1]) / Math.hypot(...u) / Math.hypot(...v)) / RAD; };

// ---------------------------------------------------------------- the families
const F = {
  sketch(q) {
    const G = givens(q.prompt), P = pic(q);
    if (!G.names || P?.kind !== 'tris') return undefined;
    const ok = t => {
      const map = { [t.names[0]]: 'A', [t.names[1]]: 'B', [t.names[2]]: 'C' };
      const wantS = Object.fromEntries(Object.entries(G.sides).map(([k, v]) => [[map[k[0]], map[k[1]]].sort().join(''), v]));
      const wantA = Object.fromEntries(Object.entries(G.angles).map(([k, v]) => [map[k], v]));
      const hasS = Object.fromEntries(Object.entries(t.sides ?? {}).map(([k, v]) => [k, num(String(v.text).replace(/ .*/, ''))]));
      const hasA = Object.fromEntries(Object.entries(t.angles ?? {}).map(([k, v]) => [k, parseFloat(v.text)]));
      const same = (x, y) => Object.keys(x).length === Object.keys(y).length && Object.keys(x).every(k => Math.abs(x[k] - y[k]) < EPS);
      const extra = t.right || t.ticks || t.equal || t.arcs || t.parallel;
      return same(wantS, hasS) && same(wantA, hasA) && !extra;
    };
    const good = P.ts.map(ok);
    return choiceWhere(q, c => { const m = c.match(/^Sketch (\d)$/); return !!m && good[+m[1] - 1]; });
  },
  included(q) {
    const G = givens(q.prompt), V = Object.keys(G.angles)[0], sides = Object.keys(G.sides);
    if (!V || sides.length !== 2) return undefined;
    const meet = [...sides[0]].find(x => sides[1].includes(x));
    const inc = meet === V;
    return choiceWhere(q, c => {
      let m = c.match(/^Yes: ∠([A-Z]) is the corner where ([A-Z]{2}) and ([A-Z]{2}) meet\.$/);
      if (m) return inc && m[1] === V && [m[2], m[3]].map(s => sideKey(...s)).sort().join() === sides.map(s => sideKey(...s)).sort().join();
      m = c.match(/^No: ∠([A-Z]) is on ([A-Z]{2}) only; the two sides meet at ([A-Z])\.$/);
      if (m) return !inc && m[1] === V && m[3] === meet && m[2].includes(V) && sides.some(s => sideKey(...s) === sideKey(...m[2]));
      if (/^No: ∠[A-Z] touches only one of the two sides\.$/.test(c)) return !inc && sides.filter(s => s.includes(V)).length === 1;
      return false;   // "every angle is between two sides", "only from a drawing"
    });
  },
  invent(q) {
    const G = givens(q.prompt);
    if (!G.names) return undefined;
    const sol = solveAll(G);
    const tri = Array.isArray(sol) && sol.length === 1 && sol[0].s ? sol[0] : null;
    const sideLen = k => { if (G.sides[k] !== undefined) return G.sides[k]; if (!tri) return null; const v = G.names.find(x => opp(G.names, x) === k); return tri.s[v]; };
    const angOf = v => (G.angles[v] !== undefined ? G.angles[v] : tri ? tri.a[v] : null);
    return choiceWhere(q, c => {
      let m = c.match(/^([A-Z])([A-Z]) = (\d+(?:\.\d+)?[½¼¾]?) (cm|in)$/);
      if (m) { const L = sideLen(sideKey(m[1], m[2])); return L != null && Math.abs(L - num(m[3])) < EPS; }
      m = c.match(/^∠([A-Z]) = (\d+)°$/);
      if (m) { const a = angOf(m[1]); return a != null && Math.abs(a - +m[2]) < 1e-6; }
      m = c.match(/^([A-Z]{2}) = ([A-Z]{2})$/);
      if (m) { const x = sideLen(sideKey(...m[1])), y = sideLen(sideKey(...m[2])); return x != null && y != null && Math.abs(x - y) < EPS; }
      return false;
    });
  },
  segLen(q) {
    const P = pic(q);
    if (P?.kind !== 'ruler' || !P.seg) return undefined;
    const r0 = P.seg[0] === 'edge' ? -P.inset : P.seg[0];
    const L = P.seg[1] - r0;
    return q.input === 'frac' ? Q(L).pair : L;
  },
  endMark(q) {
    const P = pic(q), m = q.prompt.match(/([A-Z]{2}) = (\d+(?:\.\d+)?[½¼¾]?) (cm|in)\??/);
    if (P?.kind !== 'ruler' || P.start === undefined || !m) return undefined;
    // the first point sits at the drawn start (the ruler's very end is −inset from its 0)
    const s = /at the very end of the ruler/.test(q.prompt) ? -P.inset : P.start;
    const v = s + num(m[2]);
    return q.input === 'frac' ? Q(v).pair : v;
  },
  sasWhere(q) {
    const V = Object.keys(givens(q.prompt).angles)[0];
    return V ? choiceWhere(q, c => c.startsWith(`At ${V},`)) : undefined;
  },
  protractor(q) {
    const P = pic(q), m = q.prompt.match(/∠[A-Z] = (\d+)°/);
    if (P?.kind !== 'protractor' || !m) return undefined;
    // the side runs from the centre toward B: to the right (0°) or to the left (180°); the ray is x° away from it
    const x = +m[1], target = P.bRight ? x : 180 - x;
    const dot = P.dots.find(d => Math.abs(d.deg - target) < EPS);
    return dot ? choiceWhere(q, c => c === `Dot ${dot.name}`) : -1;
  },
  asaRays(q) {
    const G = givens(q.prompt), P = pic(q);
    if (!G.names || P?.kind !== 'tris') return undefined;
    const [nA, nB] = G.names, aA = G.angles[nA], aB = G.angles[nB];
    const ok = t => {
      const rA = (t.rays ?? []).find(r => r.from === 'A'), rB = (t.rays ?? []).find(r => r.from === 'B');
      if (!rA || !rB || t.names[0] !== nA || t.names[1] !== nB) return false;
      // the angle between the ray and the base: from A the base runs to 0°, from B it runs to 180°
      const angA = rA.deg, angB = 180 - rB.deg;
      const labA = parseFloat(rA.mark?.text), labB = parseFloat(rB.mark?.text);
      return Math.abs(angA - aA) < EPS && Math.abs(angB - aB) < EPS && labA === aA && labB === aB;
    };
    const good = P.ts.map(ok);
    return choiceWhere(q, c => { const m = c.match(/^Drawing (\d)$/); return !!m && good[+m[1] - 1]; });
  },
  asaWhere(q) { return candPoint(q); },
  sssPoint(q) { return candPoint(q); },
  compassCopy(q) {
    const p = q.prompt;
    if (/^Copy [A-Z]{2} .+ What do you do\?$/.test(p)) return choiceWhere(q, c => /^Open the compass from [A-Z] to [A-Z], keep that opening, and swing an arc from [A-Z] across the ray\.$/.test(c));
    const m = p.match(/slipped a little (wider|narrower)/);
    if (m) return choiceWhere(q, c => (m[1] === 'wider' ? /^No: [A-Z]{2} is now longer than [A-Z]{2}\.$/.test(c) : /^No: [A-Z]{2} is now shorter than [A-Z]{2}\.$/.test(c)));
    return undefined;
  },
  compassOpen(q) {
    const P = pic(q);
    if (P?.kind !== 'compassRuler') return undefined;
    const r = P.e - P.s;
    return q.input === 'frac' ? Q(r).pair : r;
  },
  sssNext(q) {
    const G = givens(q.prompt);
    if (!G.names) return undefined;
    const [A, B, C] = G.names;
    const rA = G.sides[sideKey(A, C)], rB = G.sides[sideKey(B, C)];
    return choiceWhere(q, c => {
      const m = c.match(/^An arc of (\S+) (?:cm|in) around ([A-Z]), an arc of (\S+) (?:cm|in) around ([A-Z]); ([A-Z]) is where they cross\.$/);
      if (!m) return false;
      const r = { [m[2]]: num(m[1]), [m[4]]: num(m[3]) };
      return m[5] === C && Math.abs(r[A] - rA) < EPS && Math.abs(r[B] - rB) < EPS;
    });
  },
  audit(q) {
    const G = givens(q.prompt.split(', lengths within')[0]), P = pic(q);
    const tol = q.prompt.match(/lengths within (\d+) mm and angles within (\d+)°/);
    if (!G.names || P?.kind !== 'tri' || !tol) return undefined;
    const t = P.t, map = { A: t.names[0], B: t.names[1], C: t.names[2] };
    const meas = {};
    for (const [k, v] of Object.entries(t.sides ?? {})) meas[sideKey(map[k[0]], map[k[1]])] = parseFloat(v.text);
    for (const [k, v] of Object.entries(t.angles ?? {})) meas['∠' + map[k]] = parseFloat(v.text);
    const off = {};   // mm for sides, degrees for angles (rounded to the measuring step)
    for (const [k, v] of Object.entries(G.sides)) off[k] = Math.round(Math.abs(meas[k] - v) * 10 * 1000) / 1000;
    for (const [k, v] of Object.entries(G.angles)) off['∠' + k] = Math.abs(meas['∠' + k] - v);
    if (Object.values(off).some(x => !Number.isFinite(x))) return undefined;
    const lim = k => (k.startsWith('∠') ? +tol[2] : +tol[1]);
    const pass = Object.keys(off).every(k => off[k] <= lim(k) + EPS);
    return choiceWhere(q, c => {
      if (/^Yes: every condition is within its tolerance\.$/.test(c)) return pass;
      let m = c.match(/^No: (∠?[A-Z]{1,2}) is (\d+(?:\.\d+)?) ?(mm|°) off(?:, more than (\d+) ?(?:mm|°))?(?:, so it is wrong)?\.$/);
      if (m) {
        const k = m[1].startsWith('∠') ? m[1] : sideKey(...m[1]);
        return off[k] !== undefined && Math.abs(off[k] - +m[2]) < EPS && off[k] > lim(k) + EPS && (m[4] === undefined || +m[4] === lim(k));
      }
      return false;   // "two of them are within", "one is exact", "never exact anyway", "must match exactly"
    });
  },
  exists(q) {
    const m = q.prompt.match(/sticks of (\S+) (cm|in), (\S+) \2 and (\S+) \2 make a triangle\?/);
    if (!m) return undefined;
    const L = [num(m[1]), num(m[3]), num(m[4])], [a, b, c] = [...L].sort((x, y) => x - y);
    const yes = a + b > c + EPS, flat = Math.abs(a + b - c) < EPS;
    return choiceWhere(q, s => {
      let x = s.match(/^Yes: (\S+) \+ (\S+) (?:is more than|= (\S+), more than) (\S+)\.$/);
      if (x) { const u = num(x[1]), v = num(x[2]), w = num(x[4]); return yes && Math.abs(Math.max(u, v, w) - c) < EPS && Math.abs(w - c) < EPS && Math.abs(u + v - (a + b)) < EPS && (x[3] === undefined || Math.abs(num(x[3]) - u - v) < EPS); }
      x = s.match(/^No: (\S+) \+ (\S+) = (\S+) exactly, so they lie flat\.$/);
      if (x) return flat && Math.abs(num(x[3]) - c) < EPS && Math.abs(num(x[1]) + num(x[2]) - c) < EPS;
      x = s.match(/^No: (\S+) \+ (\S+) = (\S+), less than (\S+)\.$/);
      if (x) return !yes && !flat && Math.abs(num(x[4]) - c) < EPS && Math.abs(num(x[1]) + num(x[2]) - (a + b)) < EPS && Math.abs(num(x[3]) - a - b) < EPS;
      x = s.match(/^No: the (\S+) (?:cm|in) stick is too long for the other two\.$/);
      if (x) return !yes && !flat && Math.abs(num(x[1]) - c) < EPS;
      return false;
    });
  },
  thirdSide(q) {
    const m = q.prompt.match(/Two sides of a triangle are (\S+) (cm|in) and (\S+) \2\./);
    if (!m) return undefined;
    const a = num(m[1]), b = num(m[3]);
    return [Math.floor(Math.abs(a - b) + EPS) + 1, Math.ceil(a + b - EPS) - 1];
  },
  thirdAngle(q) {
    const n = [...q.prompt.matchAll(/(\d+)°/g)].map(x => +x[1]);
    return n.length === 2 ? 180 - n[0] - n[1] : undefined;
  },
  sumCheck(q) {
    const p = q.prompt;
    let m = p.match(/measured the angles of a drawn triangle: (\d+)°, (\d+)° and (\d+)°\. They add up to (\d+)°\./);
    if (m) {
      const s = +m[1] + +m[2] + +m[3];
      return choiceWhere(q, c => /^The readings are a little off; the true total is 180°\.$/.test(c) && s !== 180 && Math.abs(s - 180) <= 5);
    }
    if (/What do its three angles add up to\?/.test(p)) return choiceWhere(q, c => /^180°, like every triangle$/.test(c));
    return undefined;
  },
  longest(q) {
    const p = q.prompt, G = givens(p);
    if (!G.names) return undefined;
    if (/Which two angles are equal\?/.test(p)) {
      const ks = Object.keys(G.sides), eq = [];
      for (let i = 0; i < ks.length; i++) for (let j = i + 1; j < ks.length; j++) if (Math.abs(G.sides[ks[i]] - G.sides[ks[j]]) < EPS) eq.push([ks[i], ks[j]]);
      if (eq.length !== 1) return -1;
      const vs = eq[0].map(k => G.names.find(v => opp(G.names, v) === k)).sort().join();
      return choiceWhere(q, c => { const x = c.match(/^∠([A-Z]) and ∠([A-Z])$/); return !!x && [x[1], x[2]].sort().join() === vs; });
    }
    const m = p.match(/Which (angle|side) is the (largest|smallest|longest|shortest)\?/);
    if (!m) return undefined;
    let ang = {};
    if (Object.keys(G.sides).length === 3) { const s = solveAll(G); if (!Array.isArray(s)) return undefined; ang = s[0].a; }
    else { ang = { ...G.angles }; const kn = G.names.filter(v => ang[v] !== undefined); if (kn.length === 2) ang[G.names.find(v => ang[v] === undefined)] = 180 - ang[kn[0]] - ang[kn[1]]; }
    const big = /largest|longest/.test(m[2]);
    const vs = [...G.names].sort((x, y) => (big ? ang[y] - ang[x] : ang[x] - ang[y]));
    if (Math.abs(ang[vs[0]] - ang[vs[1]]) < EPS) return -1;
    const v = vs[0];
    return m[1] === 'angle' ? choiceWhere(q, c => c === `∠${v}`) : choiceWhere(q, c => /^[A-Z]{2}$/.test(c) && sideKey(...c) === opp(G.names, v));
  },
  ratio(q) {
    const m = q.prompt.match(/has angles of (\d+)°, (\d+)° and (\d+)°\. The side across from the (\d+)° angle is (\S+) (cm|in)\. .+? “The (\d+)° angle is (twice|three times) as big, so the side across from it is (\S+) \6\.”/);
    if (!m) return undefined;
    const a1 = +m[4], a2 = +m[7], s1 = num(m[5]);
    const s2 = (s1 * Math.sin(a2 * RAD)) / Math.sin(a1 * RAD), k = m[8] === 'twice' ? 2 : 3;
    const claim = num(m[9]);
    return choiceWhere(q, c => {
      const x = c.match(/^No: it is longer than (\S+) (?:cm|in), but not (twice|three times) as long\.$/);
      if (x) return Math.abs(num(x[1]) - s1) < EPS && x[2] === m[8] && s2 > s1 + EPS && Math.abs(s2 - k * s1) > 1e-3 && Math.abs(claim - s2) > 1e-3;
      return false;   // "sides grow in step with the angles" is false; "the side next to it" is made up
    });
  },
  howMany(q) {
    const G = givens(q.prompt);
    const names = G.names ?? (() => { const v = Object.keys(G.angles); return v.length === 3 ? v : null; })();
    if (!names) {
      const vs = [...new Set([...Object.keys(G.angles), ...Object.keys(G.sides).join('')])];
      if (vs.length === 2) vs.push('_');   // the third corner is not named
      if (vs.length !== 3) return undefined;
      G.names = vs;
    } else G.names = names;
    const s = solveAll(G);
    const kind = s === null ? 'none' : s === 'many' ? 'many' : Array.isArray(s) ? (s.length === 1 ? 'one' : 'many') : undefined;
    if (!kind) return undefined;
    return choiceWhere(q, c => (kind === 'none' ? c === 'No triangle' : kind === 'one' ? c === 'Exactly one triangle' : c === 'Many different triangles'));
  },
  flipped(q) {
    const P = pic(q);
    if (P?.kind !== 'tris' || P.ts.length !== 2) return undefined;
    const mirrored = !!P.ts[0].mirror !== !!P.ts[1].mirror;
    return choiceWhere(q, c => {
      if (/^Yes: a traced copy fits exactly after a turn or a flip\.$/.test(c)) return true;
      if (/^Yes: a traced copy fits exactly after a turn\.$/.test(c)) return !mirrored;
      return false;
    });
  },
};
/** the candidate drawn where both arcs (or both rays) meet: the first one the picture places, at the true corner */
function candPoint(q) {
  const c = pic(q)?.c;
  if (!c?.cands) return undefined;
  if (c.kind === 'sss') { const [a, b, d] = [c.AB, c.AC, c.BC].sort((x, y) => x - y); if (a + b <= d + EPS) return -1; }
  if (c.kind === 'asa' && c.angA + c.angB >= 180) return -1;
  return choiceWhere(q, s => s === c.cands[0]);
}

// ---------------------------------------------------------------- sane
function sane(q) {
  const out = [], p = q.prompt, P = pic(q), G = givens(p);
  // a drawn triangle whose labelled angles are not its own angles
  if (P?.kind === 'tri' && P.t?.angles && !P.t.freehand && q.family !== 'audit') {
    const t = P.t, V = { A: t.A, B: t.B, C: t.C };
    for (const [k, v] of Object.entries(t.angles)) {
      const d = parseFloat(v.text);
      if (!Number.isFinite(d)) continue;
      const o = ['A', 'B', 'C'].filter(x => x !== k), real = angleAt(V[k], V[o[0]], V[o[1]]);
      if (Math.abs(real - d) > 3 && q.family !== 'sumCheck') out.push(`the drawn angle at ${t.names['ABC'.indexOf(k)]} is ${real.toFixed(0)}°, labelled ${d}°`);
    }
  }
  if (q.family === 'compassCopy') {
    const m = p.match(/^Copy ([A-Z])([A-Z]) .+? from ([A-Z]), so that \3D = /) ?? p.match(/from ([A-Z]) to ([A-Z]) .+? swung the arc from ([A-Z]) anyway/);
    if (m && [m[1], m[2], m[3]].includes('D')) out.push('the new point D has the name of a point already in the picture');
  }
  if (q.family === 'protractor' && P?.kind === 'protractor') {
    const dn = P.dots.map(d => d.name);
    if (dn.some(n => P.names.includes(n))) out.push(`dot ${dn.filter(n => P.names.includes(n)).join(', ')} has the name of a vertex`);
  }
  if (q.family === 'segLen' && P?.kind === 'ruler' && P.seg && P.seg[1] > P.len) out.push('the segment runs off the ruler');
  if (q.input === 'choice') {
    let r; try { r = F[q.family]?.(q); } catch { r = undefined; }
    if (r === -1) out.push('no single right choice');
  }
  return [...new Set(out)].join('; ');
}

export default {
  solve(q) {
    const f = F[q.family];
    if (!f) return undefined;
    try { return f(q); } catch { return undefined; }
  },
  sane,
};
