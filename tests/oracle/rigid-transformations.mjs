// rigid-transformations oracle (role O, docs/lessons/QUALITY_LAYER.md). Every practice item is worked out from what
// the student sees: the motion named in the prompt (or on the board), and the grid picture's VISIBLE parts (the
// figures, the mirror, the center, the arrow, the dashed links, the candidate dots). Parts the page hides until after
// the answer (`hide`: the image f1/n1, the tracing-paper ghost, the turn arc, links l<i>, the answer ring) are never
// read. The motion is applied here with its own maths (exact for quarter turns and grid mirrors), every choice is
// judged by the claim it makes (apply the claimed motion, measure the claimed lengths, test the stated reason).
import { round } from '../../tools/quality/oracle-kit.mjs';

// ---------------------------------------------------------------- reading
const clean = s => String(s ?? '').replace(/[−–]/g, '-').replace(/’/g, "'").replace(/\s+/g, ' ').trim();
const num = t => Number(clean(t));
const EPS = 1e-6;
const near = (a, b, e = EPS) => Math.abs(a - b) <= e;
const samePt = (p, q, e = EPS) => !!p && !!q && near(p[0], q[0], e) && near(p[1], q[1], e);
const dist = (p, q) => Math.hypot(p[0] - q[0], p[1] - q[1]);
const prime = '′';

/** the visible parts of the grid picture */
function view(q) {
  const P = q.data?.picture;
  if (!P?.grid) return null;
  const hide = new Set(P.hide ?? []);
  const g = P.grid;
  const figs = (g.figs ?? []).map((f, i) => (hide.has('f' + i) ? null : { ...f, names: hide.has('n' + i) ? [] : (f.names ?? []) }));
  return {
    figs,
    mirror: hide.has('mirror') ? null : g.mirror ?? null,
    center: hide.has('center') ? null : g.center ?? null,
    arrow: hide.has('arrow') ? null : g.arrow ?? null,
    links: (g.links ?? []).filter((_, i) => !hide.has('l' + i)),
    dots: (g.dots ?? []).filter((_, i) => !hide.has('d' + i)),
  };
}
/** a named point of the visible figures: 'A', 'A′' */
function ptNamed(v, name) {
  for (const f of v.figs) {
    if (!f) continue;
    const i = (f.names ?? []).indexOf(name);
    if (i >= 0) return f.pts[i];
  }
  return null;
}
/** the first (preimage) figure: role 'first' with letters (the first one) */
const firstFig = v => v.figs.find(f => f && f.role === 'first');

// ---------------------------------------------------------------- motions
const rot = (c, deg) => {
  const k = ((Math.round(deg) % 360) + 360) % 360;
  return p => {
    const x = p[0] - c[0], y = p[1] - c[1];
    let r;
    if (k === 0) r = [x, y];
    else if (k === 90) r = [-y, x];
    else if (k === 180) r = [-x, -y];
    else if (k === 270) r = [y, -x];
    else { const a = (deg * Math.PI) / 180; r = [x * Math.cos(a) - y * Math.sin(a), x * Math.sin(a) + y * Math.cos(a)]; }
    return [r[0] + c[0], r[1] + c[1]];
  };
};
/** reflection across the line a·x + b·y = c */
const refl = (a, b, c) => p => {
  const d = (a * p[0] + b * p[1] - c) / (a * a + b * b);
  return [p[0] - 2 * a * d, p[1] - 2 * b * d];
};
const trans = (dx, dy) => p => [p[0] + dx, p[1] + dy];

/** a line written as text: 'the x-axis', 'the y-axis', 'x = 3', 'y = -1', 'y = x', 'y = -x + 2', 'y = x - 3' → {a,b,c} */
function lineOf(t) {
  const s = clean(t).replace(/^the (slanted )?line /, '');
  let m;
  if (/^the x-axis/.test(s) || /^x-axis/.test(s)) return { a: 0, b: 1, c: 0 };
  if (/^the y-axis/.test(s) || /^y-axis/.test(s)) return { a: 1, b: 0, c: 0 };
  if ((m = s.match(/^x = (-?\d+(?:\.\d+)?)/))) return { a: 1, b: 0, c: +m[1] };
  if ((m = s.match(/^y = (-?)x(?: ([+-]) (\d+(?:\.\d+)?))?/))) {
    const k = m[1] ? -1 : 1, b0 = m[2] ? (m[2] === '-' ? -1 : 1) * +m[3] : 0;
    return { a: -k, b: 1, c: b0 }; // y − kx = b0
  }
  if ((m = s.match(/^y = (-?\d+(?:\.\d+)?)/))) return { a: 0, b: 1, c: +m[1] };
  return null;
}
const lineFromPts = (p, q) => { const a = q[1] - p[1], b = p[0] - q[0]; return { a, b, c: a * p[0] + b * p[1] }; };

/** a translation written as '5 left', '3 right and 4 up', '4 down' → [dx, dy] */
function slideOf(t) {
  const s = clean(t);
  let dx = 0, dy = 0, hit = false;
  for (const m of s.matchAll(/(\d+(?:\.\d+)?) (?:in |units? )?(?:to the )?(left|right|up|down)\b/g)) {
    hit = true;
    const n = +m[1];
    if (m[2] === 'left') dx -= n; else if (m[2] === 'right') dx += n; else if (m[2] === 'up') dy += n; else dy -= n;
  }
  return hit ? [dx, dy] : null;
}

/** the center a text names: 'the origin', 'O', 'P', 'P(2, 0)', 'C(−1, 2)', 'the center C' */
function centerOf(t, v) {
  const s = clean(t);
  let m;
  if (/^the origin/.test(s)) return [0, 0];
  if ((m = s.match(/^(?:the center )?([A-Z])\((-?\d+(?:\.\d+)?), (-?\d+(?:\.\d+)?)\)/))) return [+m[2], +m[3]];
  if ((m = s.match(/^(?:the center )?([A-Z])\b/))) {
    const L = m[1];
    const c = v?.center;
    const vert = v ? ptNamed(v, L) : null;
    if (c && c.name === L) return c.p;
    if (vert) return vert;
    if (c && !c.name) return c.p;
    if (L === 'O') return [0, 0];
  }
  return null;
}

/** the motion a sentence names, as { kind, f } (kind T / R / M); null when none */
function motionOf(text, v) {
  const s = clean(text);
  let m;
  if ((m = s.match(/(?:reflected|[Rr]eflect|reflection|reflects)\b[^.]*? across (the x-axis|the y-axis|(?:the )?(?:slanted )?(?:line )?[xy] = [^.,?]+)/))) {
    const L = lineOf(m[1]);
    if (L) return { kind: 'M', f: refl(L.a, L.b, L.c), line: L };
  }
  if ((m = s.match(/(\d+)° (?:(clockwise|counterclockwise) )?(?:rotation )?about (the origin|the center [A-Z]|[A-Z](?:\(-?\d+(?:\.\d+)?, -?\d+(?:\.\d+)?\))?)/))) {
    const deg = +m[1] * (m[2] === 'clockwise' ? -1 : 1);
    const c = centerOf(m[3], v);
    if (c) return { kind: 'R', f: rot(c, deg), deg, c };
  }
  if ((m = s.match(/(?:translat\w*|slide) ((?:\d+(?:\.\d+)? (?:in )?(?:to the )?(?:left|right|up|down)(?: and )?)+)/))) {
    const d = slideOf(m[1]);
    if (d) return { kind: 'T', f: trans(d[0], d[1]), d };
  }
  return null;
}

/** pair p's coordinates from a board 'A(4, -5) \to …' for the named point */
function boardPoint(board, name) {
  const s = clean(board);
  const m = s.match(new RegExp(`(?:^|[^A-Za-z'])${name}\\((-?\\d+(?:\\.\\d+)?),\\s*(-?\\d+(?:\\.\\d+)?)\\)`));
  return m ? [+m[1], +m[2]] : null;
}
function promptPoint(prompt, name) { return boardPoint(prompt, name); }

const signedArea = pts => {
  let a = 0;
  for (let i = 0; i < pts.length; i++) { const p = pts[i], r = pts[(i + 1) % pts.length]; a += p[0] * r[1] - r[0] * p[1]; }
  return a / 2;
};
/** the figure pts mapped by f equal pts2 index by index */
const mapsOnto = (f, pts, pts2) => pts.length === pts2.length && pts.every((p, i) => samePt(f(p), pts2[i]));
/** the set of pts mapped by f equals the set pts2 (no letters) */
const mapsSetOnto = (f, pts, pts2) => pts.length === pts2.length && pts.every(p => pts2.some(r => samePt(f(p), r)));

const pickIdx = arr => { const h = arr.map((ok, i) => (ok ? i : -1)).filter(i => i >= 0); return h.length ? h[0] : undefined; };

// ---------------------------------------------------------------- the image figure (by letters with primes)
function imagePts(v, names) {
  return names.map(n => ptNamed(v, n + prime));
}

// ---------------------------------------------------------------- per family
const F = {
  // which numbered corner of the image is X′
  match(q) {
    const v = view(q);
    const mv = motionOf(q.prompt, v);
    const name = clean(q.prompt).match(/Which corner is ([A-Z])′/)[1];
    const P = ptNamed(v, name);
    const img = mv.f(P);
    const pick = v.figs.find(f => f && f.role === 'pick');
    const i = pick.pts.findIndex(p => samePt(p, img));
    const label = i >= 0 ? String(pick.names[i]) : null;
    return q.choices.map(c => label !== null && clean(c) === `Corner ${label}`);
  },

  // is it a translation, and which one
  nameT(q) {
    const v = view(q);
    const A = firstFig(v), B = v.figs.find(f => f && f.role === 'link');
    const vecs = A.pts.map((p, i) => [B.pts[i][0] - p[0], B.pts[i][1] - p[1]]);
    const isT = vecs.every(d => samePt(d, vecs[0]));
    const d = vecs[0];
    return q.choices.map(c => {
      const s = clean(c);
      if (/^Not a translation: the figure turned/.test(s)) return !isT;
      if (/^No: the points move in different directions/.test(s)) return !isT;
      if (/^Yes: every point moved/.test(s)) return false; // every move moves points: no reason
      const m = s.match(/^(?:Yes: )?A translation (.+)$/i) || s.match(/^Yes: a translation (.+)$/);
      if (m) { const e = slideOf(m[1]); return isT && !!e && samePt(e, d); }
      return false;
    });
  },

  // is the image the reflection across m
  isMirror(q) {
    const v = view(q);
    const A = firstFig(v), B = v.figs.find(f => f && f.role === 'link');
    const L = v.mirror ? lineFromPts(v.mirror.p, v.mirror.q) : lineOf(clean(texish(q.board)).replace(/^line m: /, ''));
    const f = refl(L.a, L.b, L.c);
    const isRefl = mapsOnto(f, A.pts, B.pts);
    const sd = p => (L.a * p[0] + L.b * p[1] - L.c) / Math.hypot(L.a, L.b);
    const equalAcross = A.pts.every((p, i) => near(sd(p), -sd(B.pts[i])));
    const perp = A.pts.every((p, i) => { const dx = B.pts[i][0] - p[0], dy = B.pts[i][1] - p[1]; return near(dx * L.b - dy * L.a, 0); });
    return q.choices.map(c => {
      const s = clean(c);
      if (/^Yes: each segment is cut in half by m, at a right angle/.test(s)) return isRefl;
      if (/^Yes:/.test(s)) return false; // equal distance alone is not enough (a glide has it too)
      if (/^No: the image is the right distance from m, but slid along it/.test(s)) return !isRefl && equalAcross;
      if (/^No: the dashed segments do not cross m at a right angle/.test(s)) return !isRefl && !perp;
      if (/^No: a reflection would be a slide/.test(s)) return false;
      return false;
    });
  },

  // name the rotation from the picture
  nameR(q) {
    const v = view(q);
    const A = firstFig(v), B = v.figs.find(f => f && f.role === 'link');
    return q.choices.map(c => {
      const s = clean(c);
      const m = s.match(/^(\d+)° (?:(clockwise|counterclockwise) )?about (.+)$/);
      if (!m) return false;
      if (+m[1] !== 180 && !m[2]) return false;
      const ctr = centerOf(m[3], v);
      if (!ctr) return false;
      return mapsOnto(rot(ctr, +m[1] * (m[2] === 'clockwise' ? -1 : 1)), A.pts, B.pts);
    });
  },

  // order kept / reversed → which single motion
  order(q) {
    const v = view(q);
    const A = firstFig(v), B = v.figs.find(f => f && f.role === 'link');
    const kept = Math.sign(signedArea(A.pts)) === Math.sign(signedArea(B.pts));
    const vecs = A.pts.map((p, i) => [B.pts[i][0] - p[0], B.pts[i][1] - p[1]]);
    const isT = vecs.every(d => samePt(d, vecs[0]));
    const type = !kept ? 'reflection' : isT ? 'translation' : 'rotation';
    return q.choices.map(c => {
      const s = clean(c);
      const m = s.match(/^A (translation|rotation|reflection): (.+)$/);
      if (!m || m[1] !== type) return false;
      const why = m[2];
      if (type === 'reflection') return /^the order is reversed$/.test(why);
      if (type === 'translation') return /^the order is kept$/.test(why);
      return /^the order is kept, and the figure has turned$/.test(why);
    });
  },

  // one motion or more
  howMany(q) {
    const v = view(q);
    const A = firstFig(v), B = v.figs.find(f => f && f.role === 'link');
    const p = clean(q.prompt);
    if (/unlabeled/.test(p)) {
      return q.choices.map(c => {
        const s = clean(c);
        let m;
        if ((m = s.match(/^Both the reflection across (.+?) and a slide (.+) work$/))) {
          const L = lineOf(m[1]), d = slideOf(m[2]);
          return !!L && !!d && mapsSetOnto(refl(L.a, L.b, L.c), A.pts, B.pts) && mapsSetOnto(trans(d[0], d[1]), A.pts, B.pts);
        }
        if (/^Only one motion/.test(s)) return false; // checked below by sane: the two above both work
        if (/^Only a slide works/.test(s)) return false;
        return false;
      });
    }
    const mv = motionOf(p, v);
    const d = slideOf(p.match(/Does a slide (.+?) also/)[1]);
    const names = A.names;
    const imgs = A.pts.map(mv.f);
    const slid = A.pts.map(trans(d[0], d[1]));
    const all = slid.every((r, i) => samePt(r, imgs[i]));
    return q.choices.map(c => {
      const s = clean(c);
      let m;
      if (/^Yes/.test(s)) return all;
      if ((m = s.match(/^No: the slide sends ([A-Z]) to where ([A-Z])′ is$/))) {
        const i = names.indexOf(m[1]), j = names.indexOf(m[2]);
        return !all && i >= 0 && j >= 0 && i !== j && samePt(slid[i], imgs[j]);
      }
      return false; // "a slide can never land on a reflected figure"
    });
  },

  // slide along the arrow; or the arrow's length
  slide(q) {
    const v = view(q);
    const p = clean(q.prompt);
    if (q.input === 'choice') {
      const d = slideOf(p.match(/goes (.+?)\. How long/)[1]);
      const len = Math.hypot(d[0], d[1]);
      return q.choices.map(c => {
        const s = clean(c);
        let m;
        if ((m = s.match(/^About (\d+(?:\.\d+)?) units?$/))) return near(round(len, 1), +m[1]) && !Number.isInteger(len);
        if ((m = s.match(/^(\d+(?:\.\d+)?) units?(?::|$)/))) {
          if (!near(len, +m[1])) return false;
          return !/across plus|crosses/.test(s);
        }
        return false;
      });
    }
    const a = v.arrow;
    const d = [a.to[0] - a.from[0], a.to[1] - a.from[1]];
    const name = p.match(/Where does ([A-Z])′ land/)[1];
    const P = boardPoint(q.board, name) ?? ptNamed(v, name);
    return [P[0] + d[0], P[1] + d[1]];
  },

  flipGrid(q) { return movePoint(q); },
  turnGrid(q) { return movePoint(q); },
  flipDiag(q) { return movePoint(q); },
  whole(q) { return movePoint(q); },

  // which candidate dot is Q′ after a turn by any angle
  turnAngle(q) {
    const v = view(q);
    const p = clean(q.prompt);
    const m = p.match(/Turn (?:segment [A-Z]+|point [A-Z]) (\d+)° (clockwise|counterclockwise) about the center ([A-Z])\. Which point is ([A-Z])′/);
    const c = v.center && v.center.name === m[3] ? v.center.p : null;
    const Q = ptNamed(v, m[4]);
    const img = rot(c, +m[1] * (m[2] === 'clockwise' ? -1 : 1))(Q);
    return q.choices.map(ch => {
      const n = clean(ch).match(/^Point (\S+)$/)?.[1];
      const d = v.dots.find(x => String(x.name) === n);
      return !!d && samePt(d.p, img, 1e-4);
    });
  },

  // the image of a point on the segment
  straight(q) {
    const v = view(q);
    const p = clean(q.prompt);
    const m = p.match(/M is on segment ([A-Z])([A-Z]), (\d+) of (\d+) equal steps from ([A-Z])\. After (.+?), which point is M′/);
    const A = ptNamed(v, m[5]), B = ptNamed(v, m[5] === m[1] ? m[2] : m[1]);
    const t = +m[3] / +m[4];
    const M = [A[0] + t * (B[0] - A[0]), A[1] + t * (B[1] - A[1])];
    const mv = motionOf(m[6], v);
    const img = mv.f(M);
    return q.choices.map(ch => {
      const n = clean(ch).match(/^Point (\S+)$/)?.[1];
      const d = v.dots.find(x => String(x.name) === n);
      return !!d && samePt(d.p, img);
    });
  },

  // which length must be equal: the corresponding side
  keepLen(q) {
    const p = clean(q.prompt);
    const side = p.match(/Side ([A-Z])([A-Z]) is/);
    return q.choices.map(c => {
      const s = clean(c);
      const m = s.match(/^([A-Z])′([A-Z])′$/);
      if (!m) return false; // "XX′, how far X moved" is not kept by the motion
      return (m[1] === side[1] && m[2] === side[2]) || (m[1] === side[2] && m[2] === side[1]);
    });
  },

  keepAngle(q) {
    const p = clean(q.prompt);
    const val = +p.match(/≈ (\d+(?:\.\d+)?)°/)[1];
    if (q.input === 'num') return val;
    return q.choices.map(c => { const m = clean(c).match(/^The same: (\d+(?:\.\d+)?)°$/); return !!m && +m[1] === val; });
  },

  keepPar(q) { return q.choices.map(c => /^Still parallel$/.test(clean(c))); },

  ruleT(q) {
    const p = clean(q.prompt);
    let m;
    if ((m = p.match(/takes [A-Z]\((-?\d+), (-?\d+)\) to [A-Z]′\((-?\d+), (-?\d+)\)/))) return [m[3] - m[1], m[4] - m[2]];
    m = p.match(/\(x, y\) → \(x(?: ([+-]) (\d+))?, y(?: ([+-]) (\d+))?\) moves [A-Z]\((-?\d+), (-?\d+)\)/);
    const a = m[1] ? (m[1] === '-' ? -1 : 1) * +m[2] : 0, b = m[3] ? (m[3] === '-' ? -1 : 1) * +m[4] : 0;
    return [+m[5] + a, +m[6] + b];
  },
  ruleAx(q) { return movePoint(q); },
  ruleLine(q) { return movePoint(q); },
  rule180(q) {
    if (q.input === 'pair') return movePoint(q);
    const p = clean(q.prompt);
    const m = p.match(/turns [A-Z]\((-?\d+), (-?\d+)\) 180° clockwise about the origin\. \w+ turns it 180° counterclockwise/);
    const r = [-m[1], -m[2]];
    return q.choices.map(c => { const mm = clean(c).match(/^The same point, \((-?\d+), (-?\d+)\)$/); return !!mm && samePt([+mm[1], +mm[2]], r); });
  },
  rule90(q) { return movePoint(q); },

  // measures known without measuring
  predict(q) {
    const meas = boardMeasures(q.board);
    const p = clean(q.prompt);
    let m;
    if ((m = p.match(/How long is ([A-Z])′([A-Z])′\?/))) return meas.side(m[1], m[2]);
    if ((m = p.match(/How big is ∠([A-Z])′\?/))) return meas.angle[m[1]];
    if ((m = p.match(/Can you know ([A-Z])′([A-Z])′ without measuring/))) {
      const want = meas.side(m[1], m[2]);
      return q.choices.map(c => { const mm = clean(c).match(/^Yes: ([A-Z])′([A-Z])′ = (\d+(?:\.\d+)?) in$/); return !!mm && mm[1] === m[1] && mm[2] === m[2] && +mm[3] === want; });
    }
    return undefined;
  },

  // rigid or not, from the rule and the drawn figure
  rigid(q) {
    const v = view(q);
    const rule = ruleFn(q.board);
    const A = firstFig(v);
    const img = A.pts.map(rule);
    let rigid = true;
    for (let i = 0; i < A.pts.length; i++) for (let j = i + 1; j < A.pts.length; j++) if (!near(dist(A.pts[i], A.pts[j]), dist(img[i], img[j]))) rigid = false;
    return q.choices.map(c => {
      const s = clean(c);
      let m;
      if ((m = s.match(/^No: ([A-Z])([A-Z]) = (\d+(?:\.\d+)?) but ([A-Z])′([A-Z])′ = (\d+(?:\.\d+)?)$/))) {
        if (rigid || m[1] !== m[4] || m[2] !== m[5]) return false;
        const i = A.names.indexOf(m[1]), j = A.names.indexOf(m[2]);
        return i >= 0 && j >= 0 && near(dist(A.pts[i], A.pts[j]), +m[3]) && near(dist(img[i], img[j]), +m[6]) && !near(+m[3], +m[6]);
      }
      if ((m = s.match(/^Yes: it is a (\d+)° (?:(clockwise|counterclockwise) )?rotation about the origin$/))) {
        if (!rigid) return false;
        if (+m[1] !== 180 && !m[2]) return false;
        const f = rot([0, 0], +m[1] * (m[2] === 'clockwise' ? -1 : 1));
        return A.pts.every((p, i) => samePt(f(p), img[i]));
      }
      if ((m = s.match(/^Yes: it is a reflection across (the [xy]-axis)$/))) {
        if (!rigid) return false;
        const L = lineOf(m[1]); const f = refl(L.a, L.b, L.c);
        return A.pts.every((p, i) => samePt(f(p), img[i]));
      }
      return false; // "right angle kept", "AB kept its length", "same shape only bigger", "faces a different way", "different place"
    });
  },

  proof(q) {
    const p = clean(q.prompt);
    let m;
    if ((m = p.match(/(\w+) (?:reflected|rotated) (\d+) triangles and measured/))) {
      return q.choices.map(c => { const mm = clean(c).match(/^No: (\d+) examples are evidence, not a proof for every figure$/); return !!mm && +mm[1] === +m[2]; });
    }
    if ((m = p.match(/[A-Z]{2} = (\d+(?:\.\d+)?) cm, [A-Z]′[A-Z]′ = (\d+(?:\.\d+)?) cm/))) {
      const diff = round(Math.abs(+m[2] - +m[1]), 2);
      return q.choices.map(c => { const mm = clean(c).match(/^The (\d+(?:\.\d+)?) cm is measuring error: reflections keep lengths exactly$/); return !!mm && near(+mm[1], diff); });
    }
    return undefined;
  },
};

/** TeX → plain enough to read a line / a point */
function texish(t) {
  return String(t ?? '').replace(/\\text\{([^{}]*)\}/g, '$1').replace(/\\[,;:! ]|\\quad/g, ' ').replace(/\\to/g, '→').replace(/[{}]/g, '');
}

/** the item asks where X′ lands: apply the motion from the prompt to X (coordinates from the board / prompt / picture) */
function movePoint(q) {
  const v = view(q) ?? { figs: [], dots: [], links: [] };
  const p = clean(q.prompt);
  const name = (p.match(/Where (?:does|is) ([A-Z])′/) ?? [])[1];
  let P = boardPoint(texish(q.board), name) ?? promptPoint(p, name) ?? ptNamed(v, name);
  let mv = motionOf(p, v);
  if (!mv) {
    // the board names the motion (e.g. "turn 180° about O", "90° cw about O")
    const b = clean(texish(q.board)).replace(/\bcw\b/, 'clockwise').replace(/\bccw\b/, 'counterclockwise').replace(/^turn /, '');
    mv = motionOf('rotation ' + b, v);
  }
  if (!P || !mv) return undefined;
  return mv.f(P);
}

/** board 'AB = 8 in, BC = 18 in \\ CA = 20 in \\ ∠B = 126°' → { side(a, b), angle{} } */
function boardMeasures(board) {
  const s = clean(texish(board).replace(/\\angle/g, '∠').replace(/\^\\circ|\^circ/g, '°').replace(/\\\\/g, ','));
  const sides = {}, angle = {};
  for (const m of s.matchAll(/(?<![∠A-Z])([A-Z])([A-Z]) = (\d+(?:\.\d+)?)/g)) sides[m[1] + m[2]] = +m[3];
  for (const m of s.matchAll(/∠\s*([A-Z]) = (\d+(?:\.\d+)?)/g)) angle[m[1]] = +m[2];
  return { side: (a, b) => sides[a + b] ?? sides[b + a], angle };
}

/** board '(x, y) \to (2x, -y)' → point function */
function ruleFn(board) {
  const s = clean(texish(board)).replace(/\s/g, '');
  const m = s.match(/\(x,y\)→\((.+),(.+)\)$/);
  const term = t => {
    const mm = t.match(/^(-?)(\d*(?:\.\d+)?)([xy])$/);
    const k = (mm[1] ? -1 : 1) * (mm[2] ? +mm[2] : 1);
    return p => k * (mm[3] === 'x' ? p[0] : p[1]);
  };
  const fx = term(m[1]), fy = term(m[2]);
  return p => [fx(p), fy(p)];
}

// ---------------------------------------------------------------- sane: the item's world
function sanity(q) {
  const probs = [];
  const v = view(q);
  // a center named like a vertex but drawn elsewhere: "about P" names two different points
  if (v?.center?.name) {
    const vert = v.figs.filter(f => f && f.role !== 'link' && f.role !== 'pick').map(f => { const i = (f.names ?? []).indexOf(v.center.name); return i >= 0 ? f.pts[i] : null; }).find(Boolean);
    if (vert && !samePt(vert, v.center.p) && new RegExp(`about ${v.center.name}\\b`).test(clean(q.prompt))) probs.push(`the center ${v.center.name} and the vertex ${v.center.name} are different points`);
  }
  // the drawn image (when shown) must be the image of the named motion
  if (v && ['keepLen', 'keepAngle', 'keepPar', 'straight', 'whole', 'slide', 'flipGrid', 'turnGrid', 'match'].includes(q.family)) {
    const A = firstFig(v);
    let mv = motionOf(clean(q.prompt), v);
    if (q.family === 'slide' && v.arrow) mv = { f: trans(v.arrow.to[0] - v.arrow.from[0], v.arrow.to[1] - v.arrow.from[1]) };
    if (A && mv) {
      for (const f of v.figs) {
        if (!f || f.role !== 'link') continue;
        (f.names ?? []).forEach((n, i) => {
          if (!n || !n.endsWith(prime)) return;
          const P = ptNamed(v, n.slice(0, -1));
          if (P && !samePt(mv.f(P), f.pts[i])) probs.push(`${n} is not drawn where the motion sends ${n.slice(0, -1)}`);
        });
      }
      if (q.family === 'match') {
        const pick = v.figs.find(f => f && f.role === 'pick');
        if (pick && !mapsSetOnto(mv.f, A.pts, pick.pts)) probs.push('the numbered image is not the image of the named motion');
      }
    }
  }
  if (q.family === 'straight') {
    const p = clean(q.prompt);
    const m = p.match(/M is on segment ([A-Z])([A-Z]), (\d+) of (\d+) equal steps from ([A-Z])/);
    const A = ptNamed(v, m[5]), B = ptNamed(v, m[5] === m[1] ? m[2] : m[1]), M = ptNamed(v, 'M');
    const t = +m[3] / +m[4];
    if (M && !samePt(M, [A[0] + t * (B[0] - A[0]), A[1] + t * (B[1] - A[1])])) probs.push('M is not drawn where the prompt puts it');
  }
  if (q.family === 'order') {
    const A = firstFig(v), B = v.figs.find(f => f && f.role === 'link');
    if (Math.sign(signedArea(A.pts)) !== Math.sign(signedArea(B.pts))) {
      // reversed: is it a true reflection (not a glide)? the perpendicular bisector of AA′ must map every point
      const P = A.pts[0], P2 = B.pts[0];
      const L = { a: P2[0] - P[0], b: P2[1] - P[1], c: ((P2[0] ** 2 + P2[1] ** 2) - (P[0] ** 2 + P[1] ** 2)) / 2 };
      if ((L.a || L.b) && !mapsOnto(refl(L.a, L.b, L.c), A.pts, B.pts)) probs.push('the order is reversed but no single reflection maps it (a glide)');
    }
  }
  if (q.family === 'nameT') {
    const A = firstFig(v), B = v.figs.find(f => f && f.role === 'link');
    const vecs = A.pts.map((p, i) => [B.pts[i][0] - p[0], B.pts[i][1] - p[1]]);
    if (!vecs.every(d => samePt(d, vecs[0])) && q.choices.some(c => /figure turned/.test(c))) {
      const kept = Math.sign(signedArea(A.pts)) === Math.sign(signedArea(B.pts));
      if (!kept) probs.push('"the figure turned" but the image is flipped');
    }
  }
  if (q.family === 'keepLen') {
    // a wrong choice whose drawn length happens to equal the side too
    const p = clean(q.prompt);
    const len = +p.match(/is (\d+(?:\.\d+)?) units long/)[1];
    const side = p.match(/Side ([A-Z])([A-Z]) is/);
    const a = ptNamed(v, side[1]), b = ptNamed(v, side[2]);
    if (a && b && !near(dist(a, b), len)) probs.push(`side ${side[1]}${side[2]} is drawn ${round(dist(a, b), 2)} units, not ${len}`);
    for (const c of q.choices) {
      const s = clean(c);
      let m;
      if ((m = s.match(/^([A-Z])′([A-Z])′$/)) && !((m[1] === side[1] && m[2] === side[2]) || (m[1] === side[2] && m[2] === side[1]))) {
        const x = ptNamed(v, m[1] + prime), y = ptNamed(v, m[2] + prime);
        if (x && y && near(dist(x, y), len)) probs.push(`${m[1]}′${m[2]}′ is also ${len} units in the picture`);
      }
      if ((m = s.match(/^([A-Z])\1′, how far/))) {
        const x = ptNamed(v, m[1]), y = ptNamed(v, m[1] + prime);
        if (x && y && near(dist(x, y), len)) probs.push(`${m[1]}${m[1]}′ is also ${len} units in the picture`);
      }
    }
  }
  if (q.family === 'keepAngle') {
    // the protractor reading must be close to the drawn angle
    const p = clean(q.prompt);
    const m = p.match(/∠([A-Z])([A-Z])([A-Z]) ≈ (\d+(?:\.\d+)?)°/);
    const [X, Y, Z] = [m[1], m[2], m[3]].map(n => ptNamed(v, n));
    if (X && Y && Z) {
      const a1 = Math.atan2(X[1] - Y[1], X[0] - Y[0]), a2 = Math.atan2(Z[1] - Y[1], Z[0] - Y[0]);
      let d = Math.abs(a1 - a2) * 180 / Math.PI; if (d > 180) d = 360 - d;
      if (Math.abs(d - +m[4]) > 1.5) probs.push(`the drawn angle is ${round(d, 1)}°, the protractor says ${m[4]}°`);
    }
  }
  if (q.family === 'predict') {
    const meas = boardMeasures(q.board);
    const p = clean(q.prompt);
    const four = /ABCD/.test(p) || /CD =/.test(clean(texish(q.board)));
    if (meas.angle.B !== undefined && (meas.angle.B <= 0 || meas.angle.B >= 180)) probs.push(`∠B = ${meas.angle.B}°`);
    // a triangle's sides must make a triangle
    if (!four) {
      const a = meas.side('A', 'B'), b = meas.side('B', 'C'), c = meas.side('C', 'A');
      if ([a, b, c].every(x => x > 0)) {
        if (a + b <= c || a + c <= b || b + c <= a) probs.push(`sides ${a}, ${b}, ${c} make no triangle`);
        else {
          // ∠B from the law of cosines must match the board's ∠B
          const B = Math.acos((a * a + b * b - c * c) / (2 * a * b)) * 180 / Math.PI;
          if (meas.angle.B !== undefined && Math.abs(B - meas.angle.B) > 1.5) probs.push(`sides ${a}, ${b}, ${c} give ∠B ≈ ${round(B, 1)}°, not ${meas.angle.B}°`);
        }
      }
    }
  }
  if (q.family === 'proof') {
    const m = clean(q.prompt).match(/(\w+) (?:reflected|rotated) (\d+) triangles/);
    if (m && +m[2] < 2) probs.push(`${m[2]} triangles`);
  }
  return probs;
}

// ---------------------------------------------------------------- contract
export default {
  solve(q) {
    const f = F[q.family];
    if (!f) return undefined;
    let r;
    try { r = f(q); } catch { return undefined; }
    if (r == null) return undefined;
    if (q.input === 'choice') return Array.isArray(r) ? pickIdx(r) : undefined;
    if (q.input === 'pair') return Array.isArray(r) ? r.map(x => round(x, 6)) : undefined;
    return typeof r === 'number' ? r : undefined;
  },
  sane(q) {
    const f = F[q.family];
    if (!f) return '';
    let r;
    try { r = f(q); } catch (e) { return `could not read the item (${e.message})`; }
    const probs = [];
    if (q.input === 'choice' && Array.isArray(r)) {
      const n = r.filter(Boolean).length;
      if (n === 0) probs.push('no choice is right');
      if (n > 1) probs.push(`${n} choices are right`);
      if (new Set(q.choices.map(clean)).size !== q.choices.length) probs.push('two choices read the same');
    }
    if (q.input === 'pair' && Array.isArray(r) && r.some(x => !Number.isInteger(round(x, 6)))) probs.push(`the answer (${r.join(', ')}) is not a grid point`);
    if (q.family === 'howMany' && /unlabeled/.test(q.prompt) && Array.isArray(r) && r.filter(Boolean).length === 0) probs.push('neither the reflection nor the slide maps the figure');
    try { probs.push(...sanity(q)); } catch (e) { probs.push(`sane could not read the item (${e.message})`); }
    return [...new Set(probs)].join('; ');
  },
};
