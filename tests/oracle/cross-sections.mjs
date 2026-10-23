// Oracle for the lesson "cross-sections" (plane sections of right rectangular prisms and pyramids). Written from what
// the student sees only: the prompt (the solid's lengths, which face the cut is parallel to, where it is), the choices,
// and the drawn picture (the solid's box l × w × h along x, y, z; the drawn planes n·p = d; the marked points on the
// edges). The section is worked out by geometry: a cut parallel to a face copies that face; a pyramid slice parallel
// to the base is the base scaled by (1 − height / apex height); two marked points are joined by a side exactly when
// they lie on one face; the polygon's sides are counted and named from its vertices. See docs/lessons/QUALITY_LAYER.md.
import { choiceWhere } from '../../tools/quality/oracle-kit.mjs';

const EPS = 1e-6;
const near = (a, b) => Math.abs(a - b) < EPS;
// ---------------------------------------------------------------- reading
/** "9 in long, 3 in wide and 8 in tall" → { l, w, h, u } */
function boxOf(p) {
  const m = p.match(/(\d+(?:\.\d+)?) (in|ft|cm|m) long, (\d+(?:\.\d+)?) \2 wide and (\d+(?:\.\d+)?) \2 tall/);
  return m ? { l: +m[1], w: +m[3], h: +m[4], u: m[2] } : null;
}
/** "with a 4 in × 3 in base" (+ ", 7 in tall") → { l, w, h?, u } */
function pyrOf(p) {
  const m = p.match(/with an? (\d+(?:\.\d+)?) (in|ft|cm) × (\d+(?:\.\d+)?) \2 base(?:, (\d+(?:\.\d+)?) \2 tall)?/);
  return m ? { l: +m[1], w: +m[3], h: m[4] ? +m[4] : null, u: m[2] } : null;
}
/** "a 9 in × 3 in rectangle" / "an 8 in × 8 in square" → { a, b, shape } */
function rectChoice(c) {
  const m = c.match(/^an? (\d+(?:\.\d+)?) (in|ft|cm) × (\d+(?:\.\d+)?) \2 (rectangle|square)/);
  return m ? { a: +m[1], b: +m[3], shape: m[4] } : null;
}
const sameDims = (x, y, a, b) => (near(x, a) && near(y, b)) || (near(x, b) && near(y, a));
/** the two sides of a box section parallel to a face, from the prompt's words */
function parallelSection(p, B) {
  if (/parallel to the front face|parallel to the front\b/.test(p)) return [B.l, B.h];
  if (/parallel to the end faces?|parallel to the ends\b/.test(p)) return [B.w, B.h];
  if (/parallel to the bottom face|parallel to the bottom\b|cut level/.test(p)) return [B.l, B.w];
  return null;
}
/** the fraction of the way from base to apex: "halfway", "a third of the way", "two thirds", "a quarter", "three quarters" */
function wayUp(p) {
  if (/goes through the apex/.test(p)) return 1;
  if (/halfway from the base to the apex/.test(p)) return 1 / 2;
  if (/two thirds of the way/.test(p)) return 2 / 3;
  if (/a third of the way/.test(p)) return 1 / 3;
  if (/three quarters of the way/.test(p)) return 3 / 4;
  if (/a quarter of the way/.test(p)) return 1 / 4;
  return null;
}
const pic = q => q.data?.picture ?? null;

// ---- polygons from marked points
const sub = (a, b) => a.map((x, i) => x - b[i]);
const dot = (a, b) => a.reduce((s, x, i) => s + x * b[i], 0);
const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const len = a => Math.sqrt(dot(a, a));
/** the faces of the box [0,l]×[0,w]×[0,h] a point lies on */
function facesOf(pt, S) {
  const L = [S.l, S.w, S.h], out = [];
  for (let k = 0; k < 3; k++) { if (Math.abs(pt[k]) < 1e-6) out.push(`${k}-0`); if (Math.abs(pt[k] - L[k]) < 1e-6) out.push(`${k}-1`); }
  return out;
}
/** the marked points in order round the polygon (by angle about the centroid, in the plane) */
function polygon(points) {
  const P = points.map(p => p.at);
  const c = P.reduce((s, p) => s.map((x, i) => x + p[i] / P.length), [0, 0, 0]);
  let nrm = [0, 0, 0];
  for (let i = 0; i < P.length && len(nrm) < 1e-9; i++) for (let j = i + 1; j < P.length && len(nrm) < 1e-9; j++) nrm = cross(sub(P[i], c), sub(P[j], c));
  const u = sub(P[0], c), v = cross(nrm, u);
  return points.map(p => ({ ...p, ang: Math.atan2(dot(sub(p.at, c), v) / len(v), dot(sub(p.at, c), u) / len(u)) })).sort((a, b) => a.ang - b.ang);
}
const parallel = (a, b) => len(cross(a, b)) < 1e-6 * len(a) * len(b);
function quadKind(poly) {
  const V = poly.map(p => p.at), e = V.map((p, i) => sub(V[(i + 1) % 4], p));
  const p02 = parallel(e[0], e[2]), p13 = parallel(e[1], e[3]);
  const para = p02 && p13, right = para && Math.abs(dot(e[0], e[1])) < 1e-6 * len(e[0]) * len(e[1]);
  const square = right && near(len(e[0]), len(e[1]));
  const rhombus = para && near(len(e[0]), len(e[1]));
  return { para, right, square, rhombus, trap: p02 !== p13, anyPair: p02 || p13 };
}

// ---------------------------------------------------------------- the families
const F = {
  name(q) {
    const B = boxOf(q.prompt), s = B && parallelSection(q.prompt, B);
    if (!s) return undefined;
    return choiceWhere(q, c => { const r = rectChoice(c); return !!r && sameDims(r.a, r.b, s[0], s[1]) && (r.shape === 'square') === near(s[0], s[1]); });
  },
  dims(q) {
    const B = boxOf(q.prompt), s = B && parallelSection(q.prompt, B);
    return s ? s : undefined;
  },
  orient(q) {
    const p = q.prompt, B = boxOf(p);
    if (!B) return undefined;
    let m = p.match(/Which cut gives an? (\d+(?:\.\d+)?) \w+ × (\d+(?:\.\d+)?) \w+ cross-section\?/);
    if (m) {
      const a = +m[1], b = +m[2];
      const ok = { front: sameDims(a, b, B.l, B.h), ends: sameDims(a, b, B.w, B.h), bottom: sameDims(a, b, B.l, B.w) };
      return choiceWhere(q, c => (/parallel to the front$/.test(c) ? ok.front : /parallel to the ends$/.test(c) ? ok.ends : /parallel to the bottom$/.test(c) ? ok.bottom : false));
    }
    if (/A slanted cut runs from one top edge down to the opposite bottom edge/.test(p)) {
      // the drawn plane contains the edge direction whose normal component is 0; the other side is a face diagonal
      const n = pic(q)?.planes?.[0]?.n;
      if (!n) return undefined;
      const L = [B.l, B.w, B.h];
      const k = n.findIndex(x => Math.abs(x) < 1e-9);
      if (k < 0 || k === 2) return undefined;
      const others = [0, 1, 2].filter(i => i !== k), diag = Math.hypot(L[others[0]], L[others[1]]);
      return choiceWhere(q, c => {
        let x = c.match(/^a rectangle: one side (\d+(?:\.\d+)?) \w+, the other (shorter|longer) than (\d+(?:\.\d+)?) \w+$/);
        if (x) return near(+x[1], L[k]) && (x[2] === 'longer' ? diag > +x[3] + EPS : diag < +x[3] - EPS);
        if (/the same as the bottom$/.test(c)) return false;   // a slanted plane is not level
        return false;
      });
    }
    return undefined;
  },
  taper(q) {
    const p = q.prompt, Y = pyrOf(p);
    if (/Which face is its base\?/.test(p)) return choiceWhere(q, c => /^the rectangle face$/.test(c));
    if (/Planes A and B are both parallel to the base\. Which cross-section is larger\?/.test(p)) {
      const P = pic(q), pl = P?.planes;
      if (!pl || pl.length !== 2 || !P.planeNames) return undefined;
      const dA = pl[P.planeNames.indexOf('A')].d, dB = pl[P.planeNames.indexOf('B')].d;
      return choiceWhere(q, c => (c === 'A' ? dA < dB - EPS : c === 'B' ? dB < dA - EPS : /same size/.test(c) ? near(dA, dB) : false));
    }
    const f = wayUp(p);
    if (f === null || !Y) return undefined;
    if (f === 1) return choiceWhere(q, c => /^a single point$/.test(c));
    return choiceWhere(q, c => /^a rectangle, smaller than the base$/.test(c));
  },
  half(q) {
    const Y = pyrOf(q.prompt), f = wayUp(q.prompt);
    if (!Y || f !== 1 / 2) return undefined;
    return [Y.l / 2, Y.w / 2];
  },
  upright(q) {
    const p = q.prompt;
    if (!/A plane perpendicular to the base cuts it/.test(p)) return undefined;
    const through = /through the apex/.test(p), missing = /missing the apex/.test(p);
    if (!through && !missing) return undefined;
    return choiceWhere(q, c => (through ? c === 'a triangle' : c === 'a trapezoid'));
  },
  bottom(q) {
    const p = q.prompt, m = p.match(/cuts it parallel to the (\d+(?:\.\d+)?) (?:in|ft|cm) edges/);
    // the bottom side lies in the base, parallel to those edges, from one side face to the other: as long as they are
    return m ? +m[1] : undefined;
  },
  join(q) {
    const P = pic(q);
    if (!P?.points || P.solid?.kind !== 'box') return undefined;
    const byName = Object.fromEntries(P.points.map(pt => [pt.name, facesOf(pt.at, P.solid)]));
    return choiceWhere(q, c => {
      const m = c.match(/^([A-Z]) and ([A-Z])$/);
      if (!m || !byName[m[1]] || !byName[m[2]]) return false;
      return byName[m[1]].some(f => byName[m[2]].includes(f));
    });
  },
  count(q) {
    const P = pic(q);
    if (!P?.points || P.points.length < 3) return undefined;
    const n = P.points.length, poly = polygon(P.points);
    const qk = n === 4 ? quadKind(poly) : null;
    const NAMES = { 3: 'triangle', 5: 'pentagon', 6: 'hexagon', 7: 'heptagon', 8: 'octagon' };
    return choiceWhere(q, c => {
      const m = c.match(/^(\d+) sides: an? (.+)$/);
      if (!m || +m[1] !== n) return false;
      if (n !== 4) return m[2] === NAMES[n];
      switch (m[2]) {
        case 'quadrilateral': return true;
        case 'parallelogram': return qk.para;
        case 'rectangle': return qk.right;
        case 'square or a rectangle': return qk.right;
        case 'square': return qk.square;
        case 'rhombus': return qk.rhombus;
        case 'trapezoid': return qk.anyPair;
        default: return false;
      }
    });
  },
  equi(q) {
    const m = q.prompt.match(/which are (\d+(?:\.\d+)?) \w+, (\d+(?:\.\d+)?) \w+ and (\d+(?:\.\d+)?) \w+ from corner C/);
    if (!m) return undefined;
    const [a, b, c] = [+m[1], +m[2], +m[3]];
    // sides √(a²+b²), √(b²+c²), √(a²+c²): all equal exactly when a = b = c
    const eq = near(a, b) && near(b, c);
    return choiceWhere(q, s => (/^Yes: all three cuts are the same distance from the corner$/.test(s) ? eq : /^No: the cuts are different distances from the corner$/.test(s) ? !eq : false));
  },
  possible(q) {
    const m = q.prompt.match(/^Can a flat cut through (a cube|a right rectangular pyramid|a box \(a rectangular prism\)) make a cross-section that is an? \w+ \((\d+) sides\)\?/);
    if (!m) return undefined;
    const faces = /pyramid/.test(m[1]) ? 5 : 6, n = +m[2];
    // one side per face crossed: possible from 3 up to the number of faces (a cube or box: 3–6; a pyramid: 3–5)
    const yes = n >= 3 && n <= faces;
    return choiceWhere(q, c => {
      if (yes) return /^Yes: a cut that crosses exactly \d+ faces makes one$/.test(c) && +c.match(/exactly (\d+)/)[1] === n;
      const x = c.match(/^No: each side needs its own face, and an? (?:cube|box|pyramid) has only (\d+) faces$/);
      return !!x && +x[1] === faces;
    });
  },
  most(q) {
    const m = q.prompt.match(/a cross-section of (a cube|a right rectangular pyramid|a box \(a rectangular prism\)) can have\?/);
    return m ? (/pyramid/.test(m[1]) ? 5 : 6) : undefined;
  },
};

// ---------------------------------------------------------------- sane
function sane(q) {
  const out = [], p = q.prompt, P = pic(q);
  const B = boxOf(p), Y = pyrOf(p);
  if (B) {
    if (/sheet cake/.test(p) && B.h > 4) out.push(`a ${B.h} in tall sheet cake`);
    if (/cube/.test(p) && !(B.l === B.w && B.w === B.h)) out.push('a "cube" with unequal sides');
    if (/cube/.test(p) === false && B.l === B.w && B.w === B.h && /block|brick|bar|crate/.test(p)) { /* a cube-shaped block is fine */ }
    let m = p.match(/(\d+(?:\.\d+)?) \w+ back from the front/);
    if (m && +m[1] >= B.w) out.push('the cut is behind the block');
    m = p.match(/(\d+(?:\.\d+)?) \w+ from the left end/);
    if (m && +m[1] >= B.l) out.push('the cut is past the right end');
    m = p.match(/(\d+(?:\.\d+)?) \w+ up from the bottom/);
    if (m && +m[1] >= B.h) out.push('the cut is above the block');
    if (P?.solid?.kind === 'box' && !(P.solid.l === B.l && P.solid.w === B.w && P.solid.h === B.h)) out.push('the drawn block is not the stated one');
    if (/bar of soap/.test(p) && Math.max(B.l, B.w, B.h) > 8) out.push(`a ${B.l} × ${B.w} × ${B.h} in bar of soap`);
  }
  if (Y && P?.solid?.kind === 'pyramid') {
    if (!(P.solid.l === Y.l && P.solid.w === Y.w)) out.push('the drawn pyramid is not the stated one');
    const f = wayUp(p);
    if (f !== null && P.planes?.length === 1 && !near(P.planes[0].d, f * P.solid.h)) out.push('the drawn plane is not at the stated height');
  }
  if (q.family === 'orient') {
    const m = p.match(/Which cut gives an? (\d+(?:\.\d+)?) \w+ × (\d+(?:\.\d+)?) \w+ cross-section\?/);
    if (m && B) {
      const a = +m[1], b = +m[2];
      const k = [sameDims(a, b, B.l, B.h), sameDims(a, b, B.w, B.h), sameDims(a, b, B.l, B.w)].filter(Boolean).length;
      if (k !== 1) out.push(`${k} of the three cuts give ${a} × ${b}`);
    }
  }
  if ((q.family === 'join' || q.family === 'count') && P?.points && P.solid?.kind === 'box') {
    // every marked point on an edge (two faces) and all of them on one plane
    for (const pt of P.points) if (facesOf(pt.at, P.solid).length < 2) out.push(`${pt.name} is not on an edge`);
    const pl = P.planes?.[0];
    if (pl) for (const pt of P.points) if (Math.abs(dot(pl.n, pt.at) - pl.d) > 1e-6) out.push(`${pt.name} is not on the cut`);
  }
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
