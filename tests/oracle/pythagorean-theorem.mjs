// Oracle for the lesson "pythagorean-theorem" (8.G.B.6-8): role O of docs/lessons/QUALITY_LAYER.md. Every practice item
// is worked out from what the student sees: the prompt, the board, the choices and the drawn picture (the triangle's
// drawn corners and right-angle mark, the side labels, the box drawing, the plane points). The lesson's answer logic is
// never read. Choice items are judged claim by claim: each choice is turned into a statement that is checked with the
// numbers of the item (an equation is solved, a counterexample is tested, a reason is checked for what it establishes).
import { nums, texPlain, Q, round, choiceWhere } from '../../tools/quality/oracle-kit.mjs';

// ---------------------------------------------------------------- numbers
const EPS = 1e-9;
const clean = v => Number(Number(v).toFixed(9));
const sq = x => x * x;
/** exact decimal → Q ('2.5' → 5/2) */
function decQ(s) {
  const m = String(s).trim().replace(/−/g, '-').match(/^(-?)(\d*)(?:\.(\d+))?$/);
  if (!m || (m[2] === '' && !m[3])) return null;
  const d = m[3] ? 10 ** m[3].length : 1, n = Number((m[2] || '0') + (m[3] || ''));
  return Q(m[1] ? -n : n, d);
}
const qOf = v => decQ(String(v)) ?? Q(v);
/** √ of an exact rational: { exact, v } */
function sqrtQ(q) {
  const v = Math.sqrt(q.value);
  const rn = Math.round(Math.sqrt(q.n)), rd = Math.round(Math.sqrt(q.d));
  return { exact: q.n >= 0 && rn * rn === q.n && rd * rd === q.d, v: clean(v) };
}
const sumSq = (...xs) => xs.reduce((s, x) => s.add(qOf(x).mul(qOf(x))), Q(0));
const isPerfect = n => Number.isInteger(n) && n >= 0 && Math.round(Math.sqrt(n)) ** 2 === n;
/** "to the nearest tenth" in the prompt */
const wantsTenth = p => /nearest tenth/i.test(p);
/** a length answer: exact when it is a clean number, else rounded when the question asks for it; null when the
 *  exact value is irrational and no rounding is asked (an unfair typed question) */
function lenAnswer(q2, p) {
  const r = sqrtQ(q2);
  if (wantsTenth(p)) return round(r.v, 1);
  return r.exact ? r.v : null;
}

// ---------------------------------------------------------------- picture: a triangle [R, A, B] with side keys a, b, c
const sub = (p, q) => [p[0] - q[0], p[1] - q[1]];
const dot = (u, v) => u[0] * v[0] + u[1] * v[1];
const dist = (p, q) => Math.hypot(p[0] - q[0], p[1] - q[1]);
const SIDE = { a: [0, 1], b: [0, 2], c: [1, 2] };
/** label TeX → { v (number or null), unit, name (text) } */
function lab(t) {
  const s = texPlain(t ?? '').trim();
  const m = s.match(/^(\d+(?:\.\d+)?)\s*([a-z]+)?$/);
  return m ? { v: Number(m[1]), unit: m[2] ?? '', name: s } : { v: null, unit: '', name: s };
}
/** the drawn right-angle vertex of a 'tri' picture (the mark is drawn at the first point) and the side roles */
function triInfo(pic) {
  if (!pic || pic.kind !== 'tri') return null;
  const P = pic.pts;
  const angleRight = i => { const o = P.filter((_, k) => k !== i); const u = sub(o[0], P[i]), v = sub(o[1], P[i]); return Math.abs(dot(u, v)) <= 1e-6 * Math.hypot(...u) * Math.hypot(...v); };
  const geoRight = [0, 1, 2].filter(angleRight);
  const R = pic.right ? 0 : geoRight.length === 1 ? geoRight[0] : -1;
  const keys = Object.keys(SIDE);
  const hyp = R < 0 ? null : keys.find(k => !SIDE[k].includes(R));
  const legs = keys.filter(k => k !== hyp);
  const labels = Object.fromEntries(keys.map(k => [k, lab(pic.labels?.[k])]));
  const verts = pic.verts ?? null;
  const sideName = k => (verts ? SIDE[k].map(i => verts[i]).join('') : labels[k].name);
  return { P, R, geoRight, hyp, legs, labels, verts, sideName, drawnLen: k => dist(P[SIDE[k][0]], P[SIDE[k][1]]) };
}
const sameSide = (x, y) => String(x).replace(/\s/g, '').split('').sort().join('') === String(y).replace(/\s/g, '').split('').sort().join('');

// ---------------------------------------------------------------- picture: a sketch (named points, segments, marks)
const spec = q => q.data?.picture?.pic?.spec ?? null;
/** is the angle at v (between the rays to a and b) drawn as 90° */
function sketchRight(S, v, a, b) {
  const P = S.pts; if (!P[v] || !P[a] || !P[b]) return false;
  const u = sub(P[a], P[v]), w = sub(P[b], P[v]);
  return Math.abs(dot(u, w)) <= 1e-6 * Math.hypot(...u) * Math.hypot(...w);
}
const hasMark = (S, v) => (S.rights ?? []).some(r => r.at === v);

// ---------------------------------------------------------------- the box: A B C D floor, E F G H the top above them
const BOX3 = { A: [0, 0, 0], B: [1, 0, 0], C: [1, 1, 0], D: [0, 1, 0], E: [0, 0, 1], F: [1, 0, 1], G: [1, 1, 1], H: [0, 1, 1] };
/** the box as drawn: an oblique drawing whose top corners sit straight above the floor corners. Returns the 3-D corner
 *  of each letter, or null when the drawing is not such a box. */
function box3(S) {
  const P = S?.pts; if (!P) return null;
  for (const k of 'ABCDEFGH') if (!P[k]) return null;
  const up = sub(P.E, P.A);
  const ok = Math.abs(up[0]) < 1e-6 && up[1] > 0
    && ['BF', 'CG', 'DH'].every(([f, t]) => dist(sub(P[t], P[f]), up) < 1e-6)
    && dist(sub(P.D, P.A), sub(P.C, P.B)) < 1e-6 && Math.abs(P.B[1] - P.A[1]) < 1e-6 && P.B[0] > P.A[0];
  return ok ? BOX3 : null;
}
const diff3 = (s, t) => [0, 1, 2].filter(i => BOX3[s][i] !== BOX3[t][i]).length;
/** is triangle XYZ (box letters) right, and which side is its hypotenuse (dims [l, w, h] scale x, y, z) */
function boxTri(name, dims = [1, 1, 1]) {
  const V = [...name].map(k => BOX3[k].map((c, i) => c * dims[i]));
  for (let i = 0; i < 3; i++) {
    const o = [0, 1, 2].filter(k => k !== i);
    const u = V[o[0]].map((c, k) => c - V[i][k]), w = V[o[1]].map((c, k) => c - V[i][k]);
    if (Math.abs(u.reduce((s, c, k) => s + c * w[k], 0)) < 1e-9) return { right: name[i], hyp: o.map(k => name[k]).join('') };
  }
  return null;
}

// ---------------------------------------------------------------- one-unknown equations: "x^2 = 12^2 − 9^2", "c = 16 + 12"
/** a side of an equation → { k2, k1, k0 } (coefficients of v², v, 1) */
function side(s, v) {
  const t = s.replace(/−/g, '-').replace(/\s+/g, '');
  const terms = t.match(/[+-]?[^+-]+/g) ?? [];
  const out = { k2: 0, k1: 0, k0: 0 };
  for (const term of terms) {
    const sign = term.startsWith('-') ? -1 : 1, body = term.replace(/^[+-]/, '');
    let m;
    if ((m = body.match(/^([a-z])\^2$/)) && m[1] === v) out.k2 += sign;
    else if (body === v) out.k1 += sign;
    else if ((m = body.match(/^(\d+(?:\.\d+)?)\^2$/))) out.k0 += sign * sq(Number(m[1]));
    else if ((m = body.match(/^(\d+(?:\.\d+)?)$/))) out.k0 += sign * Number(m[1]);
    else return null;
  }
  return out;
}
/** the positive value of the one unknown an equation finds, or null */
function eqValue(text, v) {
  const parts = String(text).split('=');
  if (parts.length !== 2) return null;
  const L = side(parts[0], v), R = side(parts[1], v);
  if (!L || !R) return null;
  const k2 = L.k2 - R.k2, k1 = L.k1 - R.k1, k0 = L.k0 - R.k0;
  if (k2 !== 0 && k1 === 0) { const x2 = -k0 / k2; return x2 > 0 ? Math.sqrt(x2) : null; }
  if (k2 === 0 && k1 !== 0) { const x = -k0 / k1; return x > 0 ? x : null; }
  return null;
}
const near = (a, b, tol = 1e-6) => a !== null && b !== null && Math.abs(a - b) <= tol * Math.max(1, Math.abs(b));

// ---------------------------------------------------------------- situations (story, whichTri, findError)
/** { legs: [p, q] } when the unknown is the hypotenuse, { hyp, leg } when it is a leg */
function situation(p) {
  let m;
  if ((m = p.match(/walks (\d+(?:\.\d+)?) (\w+) east, then (\d+(?:\.\d+)?) \w+ north/))) return { legs: [m[1], m[3]], unit: m[2], kind: 'walk' };
  if ((m = p.match(/screen is (\d+(?:\.\d+)?) (\w+) wide and (\d+(?:\.\d+)?) \w+ tall/))) return { legs: [m[1], m[3]], unit: m[2], kind: 'tv' };
  if ((m = p.match(/park is a rectangle, (\d+(?:\.\d+)?) (\w+) by (\d+(?:\.\d+)?) \w+/))) return { legs: [m[1], m[3]], unit: m[2], kind: 'park' };
  if ((m = p.match(/(\d+(?:\.\d+)?) (\w+) ladder leans (?:against|on) a wall\.? (?:Its foot is|with its foot) (\d+(?:\.\d+)?) \w+ (?:from the wall|out)/))) return { hyp: m[1], leg: m[3], unit: m[2], kind: 'ladder' };
  if ((m = p.match(/(wheelchair )?ramp is (\d+(?:\.\d+)?) (\w+) long and covers (\d+(?:\.\d+)?) \w+ along the ground/))) return { hyp: m[2], leg: m[4], unit: m[3], kind: m[1] ? 'wheelchair ramp' : 'ramp' };
  return null;
}
const situX2 = s => (s.legs ? sumSq(...s.legs) : sumSq(s.hyp).sub(sumSq(s.leg)));

// ---------------------------------------------------------------- the families
const S = {};

S.hypOpp = q => {
  const p = q.prompt, T = triInfo(q.data?.picture?.pic);
  let m;
  if ((m = p.match(/^Triangle ([A-Z]{3}) has its right angle at ([A-Z])/))) {
    const tri = m[1], at = m[2], hyp = [...tri].filter(c => c !== at).join('');
    return choiceWhere(q, c => sameSide(c, hyp));
  }
  if (!T || !T.hyp) return undefined;
  return choiceWhere(q, c => c.trim() === T.labels[T.hyp].name);
};

S.embedded = q => {
  const m = q.prompt.match(/In triangle ([A-Z]{3}), which side is the hypotenuse/), Sp = spec(q);
  if (!m || !Sp) return undefined;
  const tri = [...m[1]];
  const at = tri.filter((v, i) => { const o = tri.filter((_, k) => k !== i); return sketchRight(Sp, v, o[0], o[1]) && hasMark(Sp, v); });
  if (at.length !== 1) return -1;
  const hyp = tri.filter(c => c !== at[0]).join('');
  return choiceWhere(q, c => sameSide(c, hyp));
};

S.tiltArea = q => {
  const m = q.prompt.match(/goes (\d+) across and (\d+) up or down/);
  return m ? sq(Number(m[1])) + sq(Number(m[2])) : undefined;
};

/** evaluate a plain calculation "5 × 5 − 4 × 2" */
function calc(s) {
  const t = s.replace(/−/g, '-').replace(/×/g, '*').replace(/\s+/g, '');
  if (!/^[\d.+\-*]+$/.test(t)) return NaN;
  return t.split(/(?=[+-])/).reduce((acc, term) => acc + term.replace(/^\+/, '').split('*').reduce((a, f) => a * Number(f), 1), 0);
}
S.tiltSteps = q => {
  const m = q.prompt.match(/legs (\d+) and (\d+)/);
  if (!m) return undefined;
  const area = sq(Number(m[1])) + sq(Number(m[2]));
  return choiceWhere(q, c => near(calc(c), area));
};

S.missingSq = q => {
  const p = q.prompt;
  let m;
  if ((m = p.match(/squares on the legs have areas (\d+(?:\.\d+)?) and (\d+(?:\.\d+)?)/))) return clean(Number(m[1]) + Number(m[2]));
  if ((m = p.match(/hypotenuse has area (\d+(?:\.\d+)?) [a-z ]*?, one leg's square (\d+(?:\.\d+)?)/))) return clean(Number(m[1]) - Number(m[2]));
  return undefined;
};

S.unitsAreas = q => {
  const p = q.prompt, T = triInfo(q.data?.picture?.pic);
  let m;
  if ((m = p.match(/The legs (?:of a right triangle )?are (\d+(?:\.\d+)?) (\w+) and (\d+(?:\.\d+)?) \w+/))) {
    const a = Number(m[1]), b = Number(m[3]), u = m[2], c2 = sq(a) + sq(b);
    if ((m = p.match(/What does (\d+(?:\.\d+)?) measure/))) {
      const N = Number(m[1]);
      return choiceWhere(q, c => {
        if (/area of the square on the hypotenuse, in sq (\w+)/.test(c)) return N === c2 && c.endsWith(`sq ${u}`);
        if (/area of the triangle, in sq (\w+)/.test(c)) return N === (a * b) / 2 && c.endsWith(`sq ${u}`);
        if (/length of the hypotenuse, in (\w+)/.test(c)) return near(N, Math.sqrt(c2)) && c.endsWith(` ${u}`);
        return false;
      });
    }
    if (/area of the square built on the hypotenuse/.test(p)) {
      return choiceWhere(q, c => { const x = c.match(/^(\d+(?:\.\d+)?) (sq )?(\w+)$/); return !!x && Number(x[1]) === c2 && x[2] === 'sq ' && x[3] === u; });
    }
  }
  if ((m = p.match(/For this right triangle, (\d+) \+ (\d+) = (\d+)\. What does that say/))) {
    if (!T || !T.hyp) return undefined;
    const legs = T.legs.map(k => T.labels[k].v), [s1, s2, s3] = m.slice(1).map(Number);
    return choiceWhere(q, c => {
      let x;
      if ((x = c.match(/triangle has an area of (\d+)/))) return Number(x[1]) === (legs[0] * legs[1]) / 2;
      if ((x = c.match(/legs are (\d+) \w+ and (\d+) \w+ long/))) return [Number(x[1]), Number(x[2])].sort((u, v) => u - v).join() === [...legs].sort((u, v) => u - v).join();
      if (/squares on the legs together have the same area as the square on the hypotenuse/.test(c)) return s1 + s2 === s3 && [sq(legs[0]), sq(legs[1])].sort((u, v) => u - v).join() === [s1, s2].sort((u, v) => u - v).join();
      return false;
    });
  }
  return undefined;
};

/** an equation choice "t^2 + s^2 = r^2" / "ED + EF = DF": { left: [names], right: name, squared } */
function eqParts(c) {
  const [L, R] = c.split('=').map(s => s.trim());
  if (!R) return null;
  const terms = L.split('+').map(s => s.trim());
  const sqd = [...terms, R].map(t => /\^2$/.test(t));
  return { left: terms.map(t => t.replace(/\^2$/, '')), right: R.replace(/\^2$/, ''), squared: sqd.every(Boolean) };
}
S.writeEq = q => {
  const p = q.prompt, T = triInfo(q.data?.picture?.pic);
  let legs, hyp, m;
  if ((m = p.match(/^Triangle ([A-Z]{3}) has its right angle at ([A-Z])/))) {
    const tri = m[1], at = m[2], o = [...tri].filter(c => c !== at);
    legs = o.map(c => at + c); hyp = o.join('');
  } else {
    if (!T || !T.hyp) return undefined;
    legs = T.legs.map(k => T.labels[k].name); hyp = T.labels[T.hyp].name;
  }
  return choiceWhere(q, c => {
    const e = eqParts(c);
    if (!e || !e.squared || e.left.length !== 2) return false;
    const lm = e.left.map(t => legs.findIndex(l => sameSide(l, t)));
    return lm.includes(0) && lm.includes(1) && sameSide(e.right, hyp);
  });
};

/** the value of x for a triangle item: from the prompt's two lengths and the picture (which side x is) */
S.legOrHyp = q => {
  const p = q.prompt, T = triInfo(q.data?.picture?.pic);
  let x2, m;
  if ((m = p.match(/legs of a right triangle are (\d+(?:\.\d+)?) \w+ and (\d+(?:\.\d+)?) \w+; x is the third side/))) x2 = sumSq(m[1], m[2]);
  else if ((m = p.match(/has sides (\d+(?:\.\d+)?) \w+ and (\d+(?:\.\d+)?) \w+, and an unknown side x/))) {
    if (!T || !T.hyp) return undefined;
    const xKey = Object.keys(SIDE).find(k => T.labels[k].name === 'x');
    if (!xKey) return undefined;
    if (xKey === T.hyp) x2 = sumSq(m[1], m[2]);
    else { const h = T.labels[T.hyp].v, l = T.labels[T.legs.find(k => k !== xKey)].v; x2 = sumSq(h).sub(sumSq(l)); }
  } else return undefined;
  const xv = Math.sqrt(x2.value);
  return choiceWhere(q, c => near(eqValue(c, 'x'), xv));
};

S.holdsOrNot = q => {
  const p = q.prompt;
  let m;
  if ((m = p.match(/a = (\d+(?:\.\d+)?) and b = (\d+(?:\.\d+)?)/))) return clean(sumSq(m[1], m[2]).value);
  if ((m = p.match(/A triangle has sides (\d+), (\d+), (\d+)(?:,)? (and a right angle \(marked\)|and no right angle)?/))) {
    const s = [m[1], m[2], m[3]].map(Number).sort((u, v) => u - v);
    const holds = sq(s[0]) + sq(s[1]) === sq(s[2]);
    const right = /and a right angle/.test(p) ? true : /no right angle/.test(p) ? false : holds;
    return choiceWhere(q, c => {
      if (/^Yes: it is a right triangle, so the squares match/.test(c)) return holds && right;
      if (/^Yes: it is true for every triangle/.test(c)) return false;
      if (/^No: the squares do not match/.test(c)) return !holds;
      return false;
    });
  }
  return undefined;
};

S.counterEx = q => choiceWhere(q, c => {
  const m = c.match(/^One triangle where it fails: (\d+), (\d+), (\d+) gives (\d+), but (\d+)\^2 = (\d+)$/);
  if (!m) return false; // "the examples prove it", "the theorem says so": a few right triangles never settle EVERY triangle
  const [a, b, cc, g, c2, v] = m.slice(1).map(Number);
  return sq(a) + sq(b) === g && c2 === cc && sq(cc) === v && g !== v && a + b > cc && cc >= a && cc >= b;
});

S.hyp = q => {
  const m = q.prompt.match(/legs of a right triangle are (\d+(?:\.\d+)?) (\w+) and (\d+(?:\.\d+)?) \w+/);
  if (!m) return undefined;
  const v = lenAnswer(sumSq(m[1], m[3]), q.prompt);
  return v === null ? Math.sqrt(sumSq(m[1], m[3]).value) : v;
};
S.leg = q => {
  const m = q.prompt.match(/hypotenuse (\d+(?:\.\d+)?) (\w+) and one leg (\d+(?:\.\d+)?) \w+/);
  if (!m) return undefined;
  const x2 = sumSq(m[1]).sub(sumSq(m[3]));
  const v = lenAnswer(x2, q.prompt);
  return v === null ? Math.sqrt(x2.value) : v;
};
S.rootFinish = q => {
  const p = q.prompt;
  let m, c2;
  if ((m = p.match(/c\^2 = (\d+) \+ (\d+)/))) c2 = Number(m[1]) + Number(m[2]);
  else if ((m = p.match(/hypotenuse has area (\d+)/))) c2 = Number(m[1]);
  else return undefined;
  return clean(Math.sqrt(c2));
};

S.bracketRt = q => {
  const m = q.prompt.match(/√(\d+) lies between/);
  if (!m) return undefined;
  const N = Number(m[1]), lo = Math.floor(Math.sqrt(N));
  return choiceWhere(q, c => { const x = c.match(/^(\d+) and (\d+)$/); return !!x && sq(Number(x[1])) < N && N < sq(Number(x[2])) && Number(x[2]) === Number(x[1]) + 1 && Number(x[1]) === lo; });
};
S.tenthRt = q => {
  const m = q.prompt.match(/√(\d+) = /);
  return m ? round(Math.sqrt(Number(m[1])), 1) : undefined;
};
S.squareCheck = q => {
  const p = q.prompt;
  let m;
  if ((m = p.match(/what is (\d+(?:\.\d+)?)\^2\?/))) return clean(sumSq(m[1]).value);
  if ((m = p.match(/writes √(\d+) = (\d+(?:\.\d+)?)\. But/))) {
    const N = Number(m[1]), v = Number(m[2]), exact = sumSq(m[2]).eq(N), goodRound = round(Math.sqrt(N), 1) === v;
    return choiceWhere(q, c => {
      if (/= [\d.]+ exactly$/.test(c)) return exact;
      if (/≈ [\d.]+: a good rounding, not an exact value$/.test(c)) return !exact && goodRound;
      if (/is wrong, because/.test(c)) return !exact && !goodRound;
      return false;
    });
  }
  return undefined;
};

/** x² of a 'tri' picture whose x is one side and the two other sides carry lengths */
function triX2(T) {
  if (!T || !T.hyp) return null;
  const xKey = Object.keys(SIDE).find(k => T.labels[k].name === 'x');
  if (!xKey) return null;
  const others = Object.keys(SIDE).filter(k => k !== xKey).map(k => T.labels[k].v);
  if (others.some(v => v === null)) return null;
  if (xKey === T.hyp) return sumSq(...others);
  const h = T.labels[T.hyp].v, l = T.labels[T.legs.find(k => k !== xKey)].v;
  return sumSq(h).sub(sumSq(l));
}
S.exactLen = q => {
  const p = q.prompt, T = triInfo(q.data?.picture?.pic);
  let m;
  if ((m = p.match(/x = √(\d+) \w+\. Why is √(\d+) irrational/))) {
    const N = Number(m[2]);
    return choiceWhere(q, c => {
      // a root sign alone or a full display proves nothing; "not a perfect square" is the reason, and it must be true
      const x = c.match(/^(\d+) is not a perfect square, and the root of such a whole number is irrational$/);
      return !!x && Number(x[1]) === N && !isPerfect(N);
    });
  }
  if (/Give the EXACT length of x/.test(p)) {
    const x2 = triX2(T);
    if (!x2) return undefined;
    return choiceWhere(q, c => {
      let x;
      if ((x = c.match(/^√(\d+(?:\.\d+)?) \w+$/))) return qOf(x[1]).eq(x2);
      if ((x = c.match(/^(\d+(?:\.\d+)?) \w+$/))) return sumSq(x[1]).eq(x2);
      return false;
    });
  }
  return undefined;
};
S.lenTenth = q => {
  const x2 = triX2(triInfo(q.data?.picture?.pic));
  return x2 ? round(Math.sqrt(x2.value), 1) : undefined;
};

/** the three side lengths in a prompt ("sides of exactly 5, 4 and 3", "marks 6 ft ... 8 ft ... exactly 10 ft") */
function threeSides(p) {
  let m;
  if ((m = p.match(/sides of exactly (\d+(?:\.\d+)?), (\d+(?:\.\d+)?) and (\d+(?:\.\d+)?)/))) return m.slice(1, 4).map(Number);
  if ((m = p.match(/marks (\d+(?:\.\d+)?) \w+ along one board and (\d+(?:\.\d+)?) \w+ along the other; the diagonal between the marks is exactly (\d+(?:\.\d+)?)/))) return m.slice(1, 4).map(Number);
  return null;
}
const rightBySides = s => { const t = [...s].map(x => sumSq(x)).sort((u, v) => u.cmp(v)); return t[0].add(t[1]).eq(t[2]); };
S.isRight = q => {
  const s = threeSides(q.prompt);
  if (!s) return undefined;
  const r = rightBySides(s);
  return choiceWhere(q, c => (/^Yes/.test(c) ? r : /^No/.test(c) ? !r : false));
};

S.whereRight = q => {
  const m = q.prompt.match(/Triangle ([A-Z]{3}) has ([A-Z]{2}) = (\d+), ([A-Z]{2}) = (\d+), ([A-Z]{2}) = (\d+)\./);
  if (!m) return undefined;
  const sides = [[m[2], Number(m[3])], [m[4], Number(m[5])], [m[6], Number(m[7])]];
  if (!rightBySides(sides.map(s => s[1]))) return -1;
  const longest = sides.reduce((a, b) => (b[1] > a[1] ? b : a))[0];
  const at = [...m[1]].find(c => !longest.includes(c));
  return choiceWhere(q, c => c.trim() === `At ${at}`);
};

S.story = q => {
  const s = situation(q.prompt);
  if (!s) return undefined;
  const v = lenAnswer(situX2(s), q.prompt);
  return v === null ? Math.sqrt(situX2(s).value) : v;
};
S.whichTri = q => {
  const s = situation(q.prompt);
  if (!s) return undefined;
  const v = Math.sqrt(situX2(s).value), name = q.board.match(/^([a-z]) =/)?.[1];
  if (!name) return undefined;
  return choiceWhere(q, c => near(eqValue(c, name), v));
};

const pt = s => s.replace(/−/g, '-').split(',').map(t => Number(t.trim()));
S.dist = q => {
  const m = q.prompt.match(/A\(([^)]*)\) and B\(([^)]*)\)/);
  if (!m) return undefined;
  const A = pt(m[1]), B = pt(m[2]), d2 = sq(B[0] - A[0]) + sq(B[1] - A[1]);
  const v = lenAnswer(Q(d2), q.prompt);
  return v === null ? Math.sqrt(d2) : v;
};
S.distLegs = q => {
  const m = q.prompt.match(/from A\(([^)]*)\) to B\(([^)]*)\)/);
  if (!m) return undefined;
  const A = pt(m[1]), B = pt(m[2]);
  return [Math.abs(B[0] - A[0]), Math.abs(B[1] - A[1])];
};

/** the box dims of "A box is l by w by h" / "l long, w wide and h tall" */
function boxDims(p) {
  let m;
  if ((m = p.match(/A box is (\d+(?:\.\d+)?) \w+ long, (\d+(?:\.\d+)?) \w+ wide and (\d+(?:\.\d+)?) \w+ tall/))) return m.slice(1, 4).map(Number);
  if ((m = p.match(/A box is (\d+(?:\.\d+)?) \w+ by (\d+(?:\.\d+)?) \w+ by (\d+(?:\.\d+)?) \w+/))) return m.slice(1, 4).map(Number);
  return null;
}
S.perp3d = q => {
  const p = q.prompt, B = box3(spec(q));
  let m;
  if (!B) return undefined;
  if ((m = p.match(/angle between the edge ([A-H]{2}) \(straight up\) and the floor diagonal ([A-H]{2})/))) {
    const e = m[1], d = m[2], at = [...e].find(c => d.includes(c));
    if (!at || diff3(e[0], e[1]) !== 1 || diff3(d[0], d[1]) !== 2) return -1;
    const tri = boxTri([...new Set([...e, ...d])].join(''));
    const is90 = !!tri && tri.right === at;
    return choiceWhere(q, c => (c === '90°' ? is90 : /^More than 90°/.test(c) ? false : /^Less than 90°/.test(c) ? false : false));
  }
  if ((m = p.match(/Is the space diagonal ([A-H]{2}) perpendicular to the floor/))) {
    const d = m[1], perp = BOX3[d[0]][0] === BOX3[d[1]][0] && BOX3[d[0]][1] === BOX3[d[1]][1];
    return choiceWhere(q, c => (/^No: it leans; only the edges straight up are perpendicular to the floor/.test(c) ? !perp : /^Yes/.test(c) ? false : false));
  }
  if ((m = p.match(/Why is triangle ([A-H]{3}) a right triangle, with the right angle at ([A-H])/))) {
    const tri = boxTri(m[1]);
    if (!tri || tri.right !== m[2]) return -1;
    // the reason must be true in a real box: an edge straight up is perpendicular to every floor line through its foot.
    // "Any two edges of a box are perpendicular" is false (opposite edges are parallel); a drawing proves nothing.
    return choiceWhere(q, c => /stands straight up from the floor, so it is perpendicular to every floor line through/.test(c));
  }
  return undefined;
};
S.whichTri3d = q => {
  const p = q.prompt, dims = boxDims(p) ?? [1, 1, 1];
  if (!box3(spec(q))) return undefined;
  let m, seg;
  if ((m = p.match(/To find the floor diagonal ([A-H]{2})/))) seg = m[1];
  else if ((m = p.match(/has the space diagonal ([A-H]{2}) as its hypotenuse/))) seg = m[1];
  else return undefined;
  const floorCase = /floor diagonal/.test(p);
  return choiceWhere(q, c => {
    const x = c.match(/^Triangle ([A-H]{3})$/);
    if (!x) return false;
    const t = boxTri(x[1], dims);
    if (!t || !sameSide(t.hyp, seg)) return false;
    // to FIND the floor diagonal the two legs must be known lengths: edges of the box
    if (floorCase) return [...x[1]].filter(k => k !== t.right).every(k => diff3(k, t.right) === 1);
    return true;
  });
};
S.faceOrSpace = q => {
  if (!box3(spec(q))) return undefined;
  return choiceWhere(q, c => /^[A-H]{2}$/.test(c.trim()) && diff3(c[0], c[1]) === 3);
};
S.spaceDiag = q => {
  const d = boxDims(q.prompt);
  if (!d) return undefined;
  const v = lenAnswer(sumSq(...d), q.prompt);
  return v === null ? Math.sqrt(sumSq(...d).value) : v;
};
S.keepExact = q => {
  const d = boxDims(q.prompt);
  return d ? round(Math.sqrt(sumSq(...d).value), 1) : undefined;
};

/** the right triangle of a findError item: { x2 (the true x²), hypName } */
function errorWorld(q) {
  const p = q.prompt, s = situation(p);
  if (s && s.hyp) return { x2: situX2(s), hyp: Number(s.hyp), leg: Number(s.leg), xIsHyp: false };
  if (/\(see the picture\)/.test(p)) {
    const T = triInfo(q.data?.picture?.pic), x2 = triX2(T);
    if (!x2) return null;
    const xIsHyp = T.labels[T.hyp].name === 'x';
    return { x2, hyp: xIsHyp ? null : T.labels[T.hyp].v, leg: xIsHyp ? null : T.labels[T.legs.find(k => T.labels[k].name !== 'x')].v, xIsHyp };
  }
  return null;
}
S.findError = q => {
  const W = errorWorld(q), p = q.prompt;
  const w = p.match(/x\^2 = (\d+(?:\.\d+)?)\^2 \+ (\d+(?:\.\d+)?)\^2 = (\d+(?:\.\d+)?), so x ≈ (\d+(?:\.\d+)?)/);
  if (!W || !w) return undefined;
  const sx2 = sumSq(w[1], w[2]);
  const workRight = sx2.eq(W.x2) && Number(w[3]) === sx2.value && round(Math.sqrt(sx2.value), 1) === Number(w[4]);
  return choiceWhere(q, c => {
    let m;
    if (/^Nothing: the work is right/.test(c)) return workRight;
    if (/should add the lengths/.test(c)) return false; // a side is never the sum of the other two
    if ((m = c.match(/^(\d+(?:\.\d+)?) is the hypotenuse \(across from the right angle\), so x\^2 = (\d+(?:\.\d+)?)\^2 − (\d+(?:\.\d+)?)\^2 and x = (\d+(?:\.\d+)?)$/))) {
      const [h, h2, l, x] = m.slice(1).map(Number);
      return !workRight && !W.xIsHyp && h === W.hyp && h2 === W.hyp && l === W.leg && sumSq(x).eq(W.x2);
    }
    return false;
  });
};

S.sizeCheck = q => {
  const mustBeWrong = c => {
    let m;
    if ((m = c.match(/^A leg of (\d+(?:\.\d+)?) \w+, with a hypotenuse of (\d+(?:\.\d+)?) \w+$/))) return Number(m[1]) >= Number(m[2]);
    if ((m = c.match(/^A hypotenuse of (\d+(?:\.\d+)?) \w+, with legs (\d+(?:\.\d+)?) \w+ and (\d+(?:\.\d+)?) \w+$/))) { const [h, a, b] = m.slice(1).map(Number); return h <= Math.max(a, b) || h >= a + b; }
    return null;
  };
  const any = (q.choices ?? []).some(c => mustBeWrong(c) === true);
  return choiceWhere(q, c => (/^None: you have to redo the work/.test(c) ? !any : mustBeWrong(c) === true));
};

S.enough = q => {
  const p = q.prompt, Sp = spec(q);
  let known; // true: right angle established · false: known not 90° · null: not known
  let m;
  if (/corner is marked as a right angle/.test(p)) known = true;
  else if (/problem says the two sides are perpendicular/.test(p)) known = true;
  else if ((m = p.match(/The angle between the two sides is (\d+)°/))) known = Number(m[1]) === 90;
  else if ((m = p.match(/([A-Z]{4}) is a rectangle, ([A-Z]{2}) = [\d.]+ \w+, ([A-Z]{2}) = [\d.]+ \w+; the third side is the diagonal ([A-Z]{2})/))) {
    // two sides of a rectangle that share a corner meet at a right angle; the diagonal joins their far ends
    const s1 = m[2], s2 = m[3], d = m[4], shared = [...s1].filter(c => s2.includes(c));
    known = shared.length === 1 && sameSide(d, [...s1, ...s2].filter(c => c !== shared[0]).join('')) ? true : null;
  } else if (/no right-angle mark and nothing says the corner is square/.test(p)) known = null;
  else return undefined;
  return choiceWhere(q, c => {
    if (/^Yes: the right angle is established/.test(c)) return known === true;
    if (/^No: the angle is known not to be 90°/.test(c)) return known === false;
    if (/^No: it only looks like a right angle/.test(c)) return known === null;
    return false;
  });
};

S.deckBrace = q => {
  const p = q.prompt;
  let known, m;
  if ((m = p.match(/measured exactly (\d+(?:\.\d+)?) ft and (\d+(?:\.\d+)?) ft from the corner and exactly (\d+(?:\.\d+)?) ft between the marks/))) known = rightBySides(m.slice(1, 4).map(Number)) ? true : false; // the converse
  else if ((m = p.match(/carpenter's square: it is (\d+)°/))) known = Number(m[1]) === 90;
  else if ((m = p.match(/The corner was measured: it is (\d+)°/))) known = Number(m[1]) === 90;
  else if (/Nobody checked the corner; it looks square/.test(p)) known = null;
  else return undefined;
  return choiceWhere(q, c => {
    if (/^Yes: the corner is known to be a right angle/.test(c)) return known === true;
    if (/^No: the corner is known not to be a right angle/.test(c)) return known === false;
    if (/^No: nobody knows the corner is a right angle/.test(c)) return known === null;
    return false;
  });
};

S.refute = q => {
  const p = q.prompt;
  let m;
  if ((m = p.match(/the triangle with sides of exactly (\d+), (\d+) and (\d+) units has a right angle/))) {
    const s = m.slice(1, 4).map(Number).sort((u, v) => u - v), L = sq(s[0]) + sq(s[1]), R = sq(s[2]);
    return choiceWhere(q, c => {
      let x;
      if ((x = c.match(/^It has no right angle: (\d+) ≠ (\d+)$/))) return L !== R && Number(x[1]) === L && Number(x[2]) === R;
      if (/^It is a right angle/.test(c)) return false; // "close" is never equal
      if (/^Not enough information/.test(c)) return false; // exact sides decide it
      return false;
    });
  }
  if ((m = p.match(/measures a frame with a tape \(to the nearest inch\): (\d+) ft, (\d+) ft, and (\d+) ft across the corner/))) {
    const [a, b, c0] = m.slice(1, 4).map(Number), e = 1 / 24; // half an inch, in feet
    const lo = sq(a - e) + sq(b - e), hi = sq(a + e) + sq(b + e), clo = sq(c0 - e), chi = sq(c0 + e);
    const canBeRight = hi >= clo && lo <= chi, canBeNot = true; // a rounded measurement never forces exactly 90°
    return choiceWhere(q, c => {
      if (/^It is very close to a right angle; a rounded measurement cannot prove it is exactly 90°/.test(c)) return canBeRight && canBeNot;
      if (/^It is exactly 90°/.test(c)) return false;
      if (/^It is not a right angle/.test(c)) return !canBeRight;
      return false;
    });
  }
  return undefined;
};

S.whySquare = q => {
  const p = q.prompt;
  let m;
  // a good reason must give BOTH equal sides AND right corners (four equal sides alone make a rhombus; looks prove nothing)
  const both = c => /sides/.test(c) && (/corner/.test(c) || /90°/.test(c)) && !/looks/.test(c);
  if ((m = p.match(/legs (\d+) and (\d+)\) slide, two shapes are left uncovered in the big square\. Why is the smaller one a square of side (\d+)/))) {
    const a = Number(m[1]), b = Number(m[2]), s = Number(m[3]);
    if (s !== Math.min(a, b)) return -1;
    return choiceWhere(q, c => both(c) && new RegExp(`sides are all ${s} long`).test(c));
  }
  if (/Why is the shape in the middle a square/.test(p)) return choiceWhere(q, c => both(c) && /hypotenuses/.test(c) && /180° − 90° = 90°/.test(c));
  return undefined;
};

S.innerAngle = q => {
  const p = q.prompt;
  let m;
  if ((m = p.match(/^One sharp angle of the right triangle is (\d+(?:\.\d+)?)°/))) return clean(90 - Number(m[1]));
  if ((m = p.match(/sharp angles are (\d+(?:\.\d+)?)° and (\d+(?:\.\d+)?)°.*straight side \(180°\)/))) return clean(180 - Number(m[1]) - Number(m[2]));
  return undefined;
};

S.equalRemainders = q => {
  const p = q.prompt;
  let m;
  if ((m = p.match(/leave two squares uncovered, of sides (\d+(?:\.\d+)?) and (\d+(?:\.\d+)?)/))) return clean(sumSq(m[1], m[2]).value);
  if ((m = p.match(/big square has side (\d+) \+ (\d+) = (\d+)\. Four triangles with legs (\d+) and (\d+)/))) {
    const [, , s, a, b] = m.slice(1).map(Number);
    return s * s - 4 * (a * b) / 2;
  }
  if ((m = p.match(/same big square \(side (\d+)\) and the same four triangles \(legs (\d+) and (\d+)\)/))) {
    const [s, a, b] = m.slice(1).map(Number);
    return s * s - 4 * (a * b) / 2;
  }
  return undefined;
};

S.proofLogic = q => choiceWhere(q, c => /work for any legs a and b/.test(c) && /equal squares minus equal triangles leave equal remainders/.test(c));

S.converseStep = q => {
  const p = q.prompt;
  const m = p.match(/sides (\d+), (\d+), (\d+) and/), st = p.match(/Proof step \d: “([^”]*)”/);
  if (!m || !st) return undefined;
  const [a, b, c0] = m.slice(1, 4).map(Number), step = st[1];
  let want;
  if (/^Build a right triangle with legs/.test(step)) want = c => /^Two perpendicular sides of any lengths can always be drawn/.test(c);
  else if (/^Its hypotenuse is/.test(step)) want = c => { const x = c.match(/^The theorem applies to the new right triangle: (\d+) \+ (\d+) = (\d+) = (\d+)\^2$/); return !!x && Number(x[1]) === a * a && Number(x[2]) === b * b && Number(x[3]) === a * a + b * b && Number(x[4]) === c0 && c0 * c0 === a * a + b * b; };
  else if (/^The given triangle has a right angle across from the side/.test(step)) want = c => /^Triangles with the same three side lengths are copies, so their angles match/.test(c);
  else return undefined;
  return choiceWhere(q, want);
};

/** is the counterexample in "No: rules do not always flip (...)" a real counterexample to the converse of the rule */
function counterexampleOK(rule, ce) {
  let m;
  if (/^If a number ends in 0, it is even\.$/.test(rule) && (m = ce.match(/^(\d+) is even and ends in (\d)$/))) { const n = Number(m[1]); return n % 2 === 0 && n % 10 === Number(m[2]) && n % 10 !== 0; }
  if (/^If an animal is a dog, it has four legs\.$/.test(rule)) return /^a (cat|horse|cow|lion|goat|pig|sheep) has four legs$/.test(ce);
  if (/^If a triangle is equilateral, it has two equal sides\.$/.test(rule) && (m = ce.match(/^a (\d+), (\d+), (\d+) triangle has two equal sides and is not equilateral$/))) {
    const s = m.slice(1, 4).map(Number).sort((u, v) => u - v);
    return (s[0] === s[1] || s[1] === s[2]) && !(s[0] === s[2]) && s[0] + s[1] > s[2];
  }
  if (/^If a shape is a square, it has four right angles\.$/.test(rule) && (m = ce.match(/^a (\d+) by (\d+) rectangle has four right angles and is not a square$/))) return m[1] !== m[2];
  if ((m = rule.match(/^If x = (\d+), then x² = (\d+)\.$/))) {
    const k = Number(m[1]), k2 = Number(m[2]), x = ce.match(/^x = −(\d+) also gives x² = (\d+)$/);
    return k * k === k2 && !!x && Number(x[1]) === k && Number(x[2]) === k2;
  }
  return false;
}
S.converseWhy = q => {
  const r = q.prompt.match(/Try it on “([^”]*)”/);
  if (!r) return undefined;
  return choiceWhere(q, c => { const m = c.match(/^No: rules do not always flip \((.*)\)$/); return !!m && counterexampleOK(r[1], m[1]); });
};

export function solve(q) {
  const f = S[q.family];
  return f ? f(q) : undefined;
}

// ---------------------------------------------------------------- sane: what is impossible or unfair in an item
/** ladder / ramp / screen sizes a 7th grader would meet (in feet) */
const FT = { in: 1 / 12, ft: 1, yd: 3, m: 3.28084, cm: 0.0328084, mi: 5280 };
export function sane(q) {
  const out = [], p = q.prompt, pic = q.data?.picture?.pic;
  let m;
  // a typed length with an irrational exact value and no rounding asked
  const typedLen = { hyp: 1, leg: 1, story: 1, dist: 1, spaceDiag: 1 };
  if (typedLen[q.family] && q.input === 'num') {
    const v = solve(q);
    if (typeof v === 'number' && !wantsTenth(p) && Math.abs(v - Number(v.toFixed(6))) > 1e-9) out.push('the exact length is irrational but no rounding is asked');
  }
  // the picture must agree with the prompt
  const T = triInfo(pic);
  if (T) {
    if (pic.right && !T.geoRight.includes(0)) out.push('the right-angle mark sits on a corner that is not drawn as 90°');
    if ((m = p.match(/right angle at ([A-Z])/)) && T.verts && T.verts[T.R] !== m[1]) out.push(`the picture marks the right angle at ${T.verts[T.R]}, the text at ${m[1]}`);
    // labelled lengths must fit a right triangle: legs shorter than the hypotenuse, and a² + b² = c² when all three are numbers
    const L = Object.fromEntries(Object.keys(SIDE).map(k => [k, T.labels[k].v]));
    if (T.hyp) {
      for (const k of T.legs) if (L[k] !== null && L[T.hyp] !== null && L[k] >= L[T.hyp]) out.push('a leg label is not shorter than the hypotenuse label');
      if (Object.values(L).every(v => v !== null) && !sumSq(L[T.legs[0]], L[T.legs[1]]).eq(sumSq(L[T.hyp]))) out.push('the three labelled lengths do not make a right triangle');
    }
    // the labels' numbers must be the prompt's numbers
    const labNums = Object.values(T.labels).map(l => l.v).filter(v => v !== null);
    if ((m = p.match(/(?:legs (?:of a right triangle )?are|has sides|hypotenuse) (\d+(?:\.\d+)?) \w+ and (?:one leg )?(\d+(?:\.\d+)?) \w+/)) && labNums.length >= 2) {
      const want = [Number(m[1]), Number(m[2])].sort((u, v) => u - v).join(), got = labNums.slice().sort((u, v) => u - v).join();
      if (labNums.length === 2 && want !== got) out.push('the picture labels are not the lengths in the text');
    }
    if (pic.areas && T.hyp) {
      const A = Object.fromEntries(Object.entries(pic.areas).map(([k, v]) => [k, v === '?' ? null : Number(v)]));
      const h = A[T.hyp], l1 = A[T.legs[0]], l2 = A[T.legs[1]];
      if (h !== null && l1 !== null && l2 !== null && h !== undefined && Math.abs(l1 + l2 - h) > 1e-9) out.push('the square areas drawn do not add up');
      for (const k of Object.keys(SIDE)) if (A[k] != null && L[k] !== null && Math.abs(sq(L[k]) - A[k]) > 1e-9) out.push(`the ${k}-square area is not its side squared`);
    }
  }
  if (pic?.kind === 'tilt' && (m = p.match(/goes (\d+) across and (\d+) up or down/))) {
    if (Number(m[1]) !== pic.q || Number(m[2]) !== pic.p) out.push('the drawn tilted square is not the one described');
  }
  if (pic?.kind === 'tilt' && (m = p.match(/legs (\d+) and (\d+)/))) {
    if ([Number(m[1]), Number(m[2])].sort().join() !== [pic.p, pic.q].sort().join()) out.push('the drawn corner triangles are not the ones described');
  }
  if (pic?.kind === 'plane' && (m = p.match(/A\(([^)]*)\) (?:and|to) B\(([^)]*)\)/))) {
    const A = pt(m[1]), B = pt(m[2]);
    if (A.join() !== pic.A.join() || B.join() !== pic.B.join()) out.push('the plotted points are not the ones in the text');
    if (pic.run !== undefined && Number(pic.run) !== Math.abs(B[0] - A[0])) out.push('the drawn run label is wrong');
    if (pic.rise !== undefined && Number(pic.rise) !== Math.abs(B[1] - A[1])) out.push('the drawn rise label is wrong');
    if (pic.hyp !== undefined && /^\d+(\.\d+)?$/.test(String(pic.hyp)) && !near(Number(pic.hyp), Math.hypot(B[0] - A[0], B[1] - A[1]))) out.push('the drawn distance label is wrong');
  }
  if (['perp3d', 'whichTri3d', 'faceOrSpace'].includes(q.family) && !box3(spec(q))) out.push('the box drawing is not a box with the usual corner letters');
  // the embedded figures: the triangle asked must have exactly one MARKED right angle
  if (q.family === 'embedded' && solve(q) === -1) out.push('the triangle asked has no single marked right angle');
  // situations: real sizes
  const s = situation(p);
  if (s) {
    const f = FT[s.unit] ?? 1;
    if (s.kind === 'ladder') {
      const L = Number(s.hyp) * f, foot = Number(s.leg) * f, h = Math.sqrt(Math.max(0, L * L - foot * foot));
      if (L < 3 || L > 50) out.push(`a ${s.hyp} ${s.unit} ladder is not a real ladder`);
      if (foot >= h) out.push(`the ladder leans flatter than 45° (foot ${s.leg} ${s.unit} out, reaching ${clean(h / f)} ${s.unit}): it would slide`);
    }
    if (s.kind === 'wheelchair ramp') {
      const L = Number(s.hyp), g = Number(s.leg), rise = Math.sqrt(Math.max(0, L * L - g * g));
      if (rise / g > 1 / 8) out.push(`a wheelchair ramp rising ${clean(rise)} ${s.unit} over ${g} ${s.unit} (steeper than 1:8; the rule is 1:12) is not a wheelchair ramp`);
    }
    if (s.kind === 'tv') {
      const d = Math.hypot(Number(s.legs[0]), Number(s.legs[1])) * f * 12;
      if (d < 10 || d > 120) out.push(`a ${clean(d)} in screen is not a TV`);
    }
  }
  if (q.family === 'deckBrace' || q.family === 'isRight' || q.family === 'refute') {
    if ((m = p.match(/\b(Mr\.) [A-Z]\w+ builds/)) && /\bshe\b/.test(p)) out.push('"Mr." and "she" in the same story');
  }
  if (q.family === 'deckBrace' && (m = p.match(/√(\d+) \+ (\d+) = (\d+)/))) {
    if (sq(Number(m[3])) !== Number(m[1]) + Number(m[2])) out.push('the brace arithmetic is wrong');
  }
  if (q.family === 'exactLen' && (m = p.match(/x = √(\d+)/))) {
    const x2 = triX2(T);
    if (x2 && !x2.eq(Number(m[1]))) out.push('the picture does not give x = √' + m[1]);
  }
  if (q.family === 'tenthRt' && (m = p.match(/√(\d+) = (\d+\.\d+)…/))) {
    // a calculator display is the root cut or rounded at its last digit
    const shown = Number(m[2]), dec = m[2].split('.')[1].length, r = Math.sqrt(Number(m[1])), tr = Math.floor(r * 10 ** dec) / 10 ** dec;
    if (Math.abs(shown - tr) > 1e-9 && Math.abs(shown - round(r, dec)) > 1e-9) out.push('the calculator display is not √' + m[1]);
  }
  if (q.family === 'squareCheck' && (m = p.match(/But (\d+(?:\.\d+)?)\^2 = (\d+(?:\.\d+)?), not/)) && !sumSq(m[1]).eq(qOf(m[2]))) out.push('the stated square is wrong');
  if (q.family === 'innerAngle' && (m = p.match(/sharp angles are (\d+)° and (\d+)°/)) && Number(m[1]) + Number(m[2]) !== 90) out.push('the two sharp angles of a right triangle do not add to 90°');
  if (q.family === 'equalRemainders' && (m = p.match(/side (\d+) \+ (\d+) = (\d+)/)) && Number(m[1]) + Number(m[2]) !== Number(m[3])) out.push('the big square side is not a + b');
  if (q.family === 'proofLogic' && (m = p.match(/legs (\d+) and (\d+) and finds c² = (\d+)/)) && sq(Number(m[1])) + sq(Number(m[2])) !== Number(m[3])) out.push("the found c² is not a² + b²");
  if (q.family === 'whereRight' && (m = q.board.match(/(\d+)\^2 \+ (\d+)\^2 = (\d+)\^2/)) && sq(Number(m[1])) + sq(Number(m[2])) !== sq(Number(m[3]))) out.push('the board equation is false');
  if (q.family === 'sizeCheck') {
    // a hypotenuse result that is wrong only by the squares cannot be spotted "without redoing any work"
    for (const c of q.choices ?? []) {
      const x = c.match(/^A hypotenuse of (\d+) \w+, with legs (\d+) \w+ and (\d+) \w+$/);
      if (x && sq(Number(x[2])) + sq(Number(x[3])) !== sq(Number(x[1]))) out.push(`"${c}" is also wrong (by the squares)`);
    }
  }
  if (q.family === 'whySquare' && (m = p.match(/legs (\d+) and (\d+)/)) && m[1] === m[2] && /smaller one/.test(p)) out.push('equal legs: there is no smaller square');
  if (q.family === 'holdsOrNot' && (m = p.match(/A triangle has sides (\d+), (\d+), (\d+)/))) {
    const s = m.slice(1, 4).map(Number).sort((u, v) => u - v);
    if (s[0] + s[1] <= s[2]) out.push('the sides do not make a triangle');
    const holds = sq(s[0]) + sq(s[1]) === sq(s[2]);
    if (/a right angle \(marked\)|\(a right triangle\)/.test(p) && !holds) out.push('called a right triangle, but the squares do not match');
    if (/no right angle/.test(p) && holds) out.push('said to have no right angle, but the squares match (the converse makes it right)');
  }
  if (q.family === 'isRight') {
    const sd = threeSides(p);
    if (sd) { const s = [...sd].sort((u, v) => u - v); if (s[0] + s[1] <= s[2]) out.push('the sides do not make a triangle'); }
  }

  // a choice question needs exactly one right choice
  if (q.input === 'choice') {
    let r;
    try { r = solve(q); } catch { r = undefined; }
    if (r === -1) out.push('no single right choice');
  }
  return [...new Set(out)].join('; ');
}

export default { solve, sane };
