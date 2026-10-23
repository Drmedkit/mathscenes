// composite-figures oracle (role O, docs/lessons/QUALITY_LAYER.md). Works every practice item out from what the student
// sees: the prompt, the board, the choices and the drawn plan figure: its parts as drawn (polygons, and circle pieces
// with centre and radius), the solid edge (outer pieces and hole edges as drawn segments and arcs), the dashed seams,
// the dimension labels on show and a fixed teal trace. Lengths and areas are worked out here from the drawing
// (shoelace for polygons, the drawn arc's angle for arcs, the drawn circle piece's share of a full circle); the
// figure's own area / perimeter / len fields are never read. Answers stay exact as a + bπ, rounded once at the end.
const EPS = 1e-6;
const close = (a, b, e = EPS) => Math.abs(a - b) < e;
const clean = v => Math.round(v * 1e6) / 1e6;
const D = (p, q) => Math.hypot(p[0] - q[0], p[1] - q[1]);
const shoelace = pts => Math.abs(pts.reduce((s, p, i) => { const q = pts[(i + 1) % pts.length]; return s + p[0] * q[1] - q[0] * p[1]; }, 0)) / 2;
const UNI = { '½': '1/2', '¼': '1/4', '¾': '3/4' };
const num = t => { const s = String(t).replace(/[½¼¾]/g, c => UNI[c]).replace(/[−–]/g, '-').replace(/,/g, '').trim(); const m = s.match(/^(-?\d+)\/(\d+)$/); return m ? Number(m[1]) / Number(m[2]) : Number(s); };

// ---------------------------------------------------------------- the drawn figure
const picOf = q => q.data?.picture;
const figOf = q => q.data?.picture?.fig;
/** a drawn piece's length as { a, b } (a + bπ) */
function pieceLen(s) {
  if (s.kind === 'seg') return { a: D(s.a, s.b), b: 0 };
  if (s.kind === 'arc') return { a: 0, b: (s.r * Math.abs(s.t1 - s.t0)) / Math.PI };
  return { a: NaN, b: NaN };
}
const sumPN = list => list.reduce((t, x) => ({ a: t.a + x.a, b: t.b + x.b }), { a: 0, b: 0 });
const holePieces = f => (f.holes ?? []).flatMap(h => (Array.isArray(h) ? h : [h]));
/** the share of a full circle that a drawn circle piece covers (¼, ½, ¾, 1) */
function circleShare(p) {
  const s = shoelace(p.outline) / (Math.PI * p.r * p.r);
  const opts = [0.25, 0.5, 0.75, 1];
  return opts.reduce((b, o) => (Math.abs(o - s) < Math.abs(b - s) ? o : b));
}
/** the area of a part as drawn, { a, b } */
function partArea(p) {
  if (p.c && p.r) return { a: 0, b: circleShare(p) * p.r * p.r };
  return { a: shoelace(p.outline), b: 0 };
}
function areaOf(f) {
  return f.parts.reduce((t, p) => { const x = partArea(p); return { a: t.a + p.sign * x.a, b: t.b + p.sign * x.b }; }, { a: 0, b: 0 });
}
const outerPerim = f => sumPN(f.outer.map(pieceLen));
const fullPerim = f => sumPN([...f.outer, ...holePieces(f)].map(pieceLen));
/** the drawn length of a dimension label (from its geometry, not its value) */
function dimLen(f, id) {
  const d = f.dims.find(x => x.id === id);
  if (!d) return null;
  if (d.kind === 'edge') return D(d.a, d.b);
  if (d.kind === 'rad') return d.diam ? 2 * d.r : d.r;
  if (d.kind === 'arc') { const pc = [...f.outer, ...holePieces(f)].find(s => s.id === d.piece); return pc ? pieceLen(pc) : null; }
  return null;
}
const pnText = (a, b) => `${clean(a)} + ${clean(b)}π`;

// ---------------------------------------------------------------- reading a + bπ in text
/** '98 − 0.5π' '97.5π' '17 + 5π' '22' → { a, b } or null */
function readPN(t) {
  const s = String(t).replace(/\s+/g, '').replace(/−/g, '-').replace(/(ft|in|yd|m|cm)²?$/, '');
  let m;
  if ((m = s.match(/^(-?[\d.]+)([+-])([\d.]*)π$/))) return { a: Number(m[1]), b: (m[2] === '-' ? -1 : 1) * (m[3] === '' ? 1 : Number(m[3])) };
  if ((m = s.match(/^(-?[\d.]*)π$/))) return { a: 0, b: m[1] === '' ? 1 : m[1] === '-' ? -1 : Number(m[1]) };
  if ((m = s.match(/^-?[\d.]+$/))) return { a: Number(s), b: 0 };
  return null;
}
/** the board's sum of terms: "16 + 16 + 9.5\pi + 9\pi" → { a, b } */
function boardPN(tex) {
  const s = String(tex).replace(/\\pi/g, 'π').replace(/\\[,;: ]/g, '').replace(/[{}]/g, '').replace(/\s+/g, '').replace(/−/g, '-');
  let a = 0, b = 0;
  for (const m of s.matchAll(/([+-]?)([\d.]*)(π?)/g)) {
    if (!m[0] || (m[2] === '' && m[3] === '')) continue;
    const sg = m[1] === '-' ? -1 : 1;
    if (m[3]) b += sg * (m[2] === '' ? 1 : Number(m[2])); else a += sg * Number(m[2]);
  }
  return { a, b };
}

// ---------------------------------------------------------------- families
const F = {
  shown(q) {
    const f = figOf(q), pic = picOf(q);
    if (/What does the shading show\?/.test(q.prompt)) return q.choices.map(c => (pic.shade ? /^The area: the surface/.test(c) : false));
    const T = new Set(pic.cand ?? []);
    const O = f.outer.map(s => s.id), H = holePieces(f).map(s => s.id);
    const hasHole = H.length > 0;
    const seamIn = T.has('seam') && (f.seams ?? []).length > 0;
    const allO = O.every(id => T.has(id)), allH = H.every(id => T.has(id));
    const missing = [...O, ...H].filter(id => !T.has(id));
    const missArc = missing.some(id => [...f.outer, ...holePieces(f)].find(s => s.id === id)?.kind === 'arc');
    let want;
    if (seamIn) want = /^Not (the|a) perimeter: it runs along a seam inside$/;
    else if (allO && allH) want = hasHole ? /^The perimeter: the outside edge and the hole’s edge$/ : /^The perimeter: all of the edge$/;
    else if (hasHole && allO && !H.some(id => T.has(id))) want = /^The outer perimeter: the outside edge only$/;
    else if (missArc && !hasHole) want = /^Not the perimeter: a curved edge is missing$/;
    else return q.choices.map(() => false);
    return q.choices.map(c => want.test(c));
  },
  measure(q) {
    const p = q.prompt, u = picOf(q).unit;
    const around = /go around|run along the edge|around the edge|along the edge/.test(p);
    const cover = /to cover|for this (window|tablecloth)|glass|fabric/.test(p);
    if (around === cover) return null;
    const want = around ? `Perimeter, in ${u}` : `Area, in ${u}²`;
    return q.choices.map(c => c === want);
  },
  inventory(q) {
    const f = figOf(q);
    const pieces = /outer perimeter/.test(q.prompt) ? f.outer : [...f.outer, ...holePieces(f)];
    const straight = pieces.filter(s => s.kind === 'seg').map(s => clean(D(s.a, s.b))).sort((x, y) => x - y);
    const arcs = pieces.filter(s => s.kind === 'arc').length;
    return q.choices.map(c => {
      if (/ − /.test(c)) return false;
      const toks = c.split(' + ');
      const nums = [], curves = [];
      for (const t of toks) {
        if (t === 'the curve') curves.push(1);
        else if (t === 'the two curves') curves.push(2);
        else if (/^the hole’s edge$|^the circle$/.test(t)) curves.push(1);
        else if (/^[\d.]+$/.test(t)) nums.push(Number(t));
        else return false;
      }
      const nc = curves.reduce((s, x) => s + x, 0);
      return nc === arcs && nums.sort((x, y) => x - y).join() === straight.join();
    });
  },
  arcVs(q) {
    const f = figOf(q);
    const arc = f.outer.find(s => s.kind === 'arc');
    if (!arc) return null;
    const L = pieceLen(arc).b * Math.PI;
    const p = q.prompt;
    if (/what part of the whole circle’s circumference/.test(p)) {
      const share = Math.abs(arc.t1 - arc.t0) / (2 * Math.PI);
      const word = close(share, 0.5, 1e-3) ? '½' : close(share, 0.25, 1e-3) ? '¼' : close(share, 0.75, 1e-3) ? '¾' : close(share, 1, 1e-3) ? 'All' : null;
      return q.choices.map(c => (word === 'All' ? /^All of it$/.test(c) : c === `${word} of it`));
    }
    const segs = f.outer.filter(s => s.kind === 'seg').map(s => D(s.a, s.b));
    let S;
    if (/one straight edge\?/.test(p)) { if (!segs.every(x => close(x, segs[0]))) return null; S = segs[0]; }
    else if (/the two straight edges together\?/.test(p)) { if (segs.length !== 2) return null; S = segs[0] + segs[1]; }
    else if (/the straight edge \(the diameter\)\?/.test(p)) { if (segs.length !== 1) return null; S = segs[0]; }
    else return null;
    const longer = close(L, S, 1e-9) ? 'same' : L > S ? 'curve' : 'straight';
    return q.choices.map(c => (longer === 'same' ? /^They are the same length$/.test(c) : longer === 'curve' ? /^The curved edge$/.test(c) : /^The (straight edge|two straight edges|diameter)$/.test(c)));
  },
  arcEst(q) {
    const f = figOf(q), arc = f.outer.find(s => s.kind === 'arc');
    return arc ? clean(pieceLen(arc).b * 3) : null;
  },
  exact(q) {
    const f = figOf(q), p = f.parts[0];
    if (/circumference/.test(q.prompt)) return clean(2 * p.r);
    if (/area/.test(q.prompt)) return clean(circleShare(p) * p.r * p.r);
    return null;
  },
  readPi(q) {
    return q.choices.map(c => /^[\d.]+ × π: an exact, finished answer$/.test(c) && new RegExp(`(area|circumference) is ${c.match(/^([\d.]+)/)[1]}π`).test(q.prompt));
  },
  partArea(q) { const f = figOf(q), p = f.parts.find(x => x.c); return p ? clean(circleShare(p) * p.r * p.r) : null; },
  arcLen(q) {
    const f = figOf(q);
    if (/the curved edge only/.test(q.prompt)) { const t = sumPN(f.outer.filter(s => s.kind === 'arc').map(pieceLen)); return [0, clean(t.b)]; }
    if (/whole perimeter/.test(q.prompt)) { const t = outerPerim(f); return [clean(t.a), clean(t.b)]; }
    return null;
  },
  infer(q) {
    const f = figOf(q), pic = picOf(q);
    const ask = (pic.dims ?? []).find(d => d.text === '?');
    if (!ask) return null;
    const v = dimLen(f, ask.id);
    return typeof v === 'number' ? clean(v) : null;
  },
  combine(q) { const t = boardPN(q.board); return [clean(t.a), clean(t.b)]; },
  likeTerms(q) {
    const t = boardPN(q.board);
    return q.choices.map(c => {
      const v = readPN(c.replace(/: it does not combine$/, ''));
      if (!v || !close(v.a, t.a) || !close(v.b, t.b)) return false;
      return /\+/.test(c) || t.a === 0 || t.b === 0;
    });
  },
  areaAdd(q) { const t = areaOf(figOf(q)); return [clean(t.a), clean(t.b)]; },
  perimAdd(q) { const t = fullPerim(figOf(q)); return [clean(t.a), clean(t.b)]; },
  cutArea(q) { const t = areaOf(figOf(q)); if (q.input === 'num') return close(t.a, 0) ? clean(t.b) : null; return [clean(t.a), clean(-t.b)]; },
  cutPick(q) {
    const t = areaOf(figOf(q));
    return q.choices.map(c => { const v = readPN(c); return !!v && close(v.a, t.a) && close(v.b, t.b) && /−/.test(c); });
  },
  notch(q) { const t = fullPerim(figOf(q)); return [clean(t.a), clean(t.b)]; },
  round(q) {
    const m = q.prompt.match(/The exact (?:area|perimeter) is ([\d.]+) ([+−]) ([\d.]+)π .+?\. Use (π ≈ 3\.14|the π key on a calculator) and round to the nearest (tenth|whole number)/);
    const pi = /3\.14/.test(m[4]) ? 3.14 : Math.PI;
    const v = Number(m[1]) + (m[2] === '−' ? -1 : 1) * Number(m[3]) * pi;
    const k = m[5] === 'tenth' ? 10 : 1;
    return Math.round(v * k + 1e-9) / k;
  },
  approx(q) {
    const t = boardPN(q.board.replace(/^[AP]\s*=\s*/, '').replace(/\\text\{[^{}]*\}/g, ''));
    const v = t.a + t.b * Math.PI;
    return q.choices.map(c => {
      const m = c.match(/^.+? ≈ ([\d.]+) \w+$/);
      if (!m) return false; // "=" with a rounded value is not true
      const dp = (m[1].split('.')[1] ?? '').length;
      return close(Math.round(v * 10 ** dp + 1e-9) / 10 ** dp, Number(m[1]), 1e-9);
    });
  },
  hole(q) {
    const f = figOf(q);
    if (/Find the outer perimeter/.test(q.prompt)) { const t = outerPerim(f); return [clean(t.a), clean(t.b)]; }
    if (/Find the perimeter/.test(q.prompt)) { const t = fullPerim(f); return [clean(t.a), clean(t.b)]; }
    if (/Find the area/.test(q.prompt)) { const t = areaOf(f); return [clean(t.a), clean(-t.b)]; }
    return null;
  },
  critique(q) {
    const f = figOf(q), p = q.prompt;
    let m;
    if ((m = p.match(/splits the L into two rectangles and adds: (\d+) × (\d+) \+ (\d+) × (\d+) = (\d+) (\w+)²\./))) {
      const claimed = Number(m[1]) * Number(m[2]) + Number(m[3]) * Number(m[4]);
      const truth = areaOf(f).a, extra = claimed - truth;
      return q.choices.map(c => {
        let mm;
        if ((mm = c.match(/^The (\d+) × (\d+) corner is in both parts: it is counted twice$/))) return extra > EPS && close(Number(mm[1]) * Number(mm[2]), extra);
        if (/^Nothing: the parts cover the whole shape$/.test(c)) return close(claimed, truth) && close(Number(m[5]), claimed);
        return false;
      });
    }
    if ((m = p.match(/the rectangle’s perimeter \((\d+)\) plus the half circle’s perimeter \((\d+) \+ ([\d.]+)π\), minus the seam once\./))) {
      const t = fullPerim(f);
      const seam = (f.seams ?? []).reduce((s, x) => s + D(x.a, x.b), 0);
      const theirs = { a: Number(m[1]) + Number(m[2]) - seam, b: Number(m[3]) };
      return q.choices.map(c => {
        const mm = c.match(/^The (\d+) \w+ seam was in BOTH perimeters, so it has to come off twice$/);
        if (mm) return close(Number(mm[1]), seam) && close(theirs.a - seam, t.a) && close(theirs.b, t.b);
        if (/^Nothing: there is one seam, so it comes off once$/.test(c)) return close(theirs.a, t.a) && close(theirs.b, t.b);
        return false;
      });
    }
    return null;
  },
  counter(q) {
    let m;
    if ((m = q.prompt.match(/^Compare one circle of radius (\d+) \w+ with (\w+) separate circles of radius (\d+) \w+\./))) {
      const R = Number(m[1]), n = { two: 2, three: 3, four: 4, nine: 9 }[m[2]] ?? Number(m[2]), r = Number(m[3]);
      const A1 = R * R, A2 = n * r * r, P1 = 2 * R, P2 = n * 2 * r;
      return q.choices.map(c => {
        if (/^The same area, and the \w+ small circles have MORE perimeter$/.test(c)) return A1 === A2 && P2 > P1;
        if (/^The same area, so the same perimeter$/.test(c)) return A1 === A2 && P1 === P2;
        if (/^The big circle has more area and more perimeter$/.test(c)) return A1 > A2 && P1 > P2;
        return false;
      });
    }
    const f = figOf(q);
    const before = (() => { const base = f.parts.find(p => p.sign > 0 && !p.c); return base ? { A: shoelace(base.outline), P: base.outline.reduce((s, pt, i) => s + D(pt, base.outline[(i + 1) % base.outline.length]), 0) } : null; })();
    if (!before) return null;
    const a = areaOf(f), p = fullPerim(f);
    const A = a.a + a.b * Math.PI, P = p.a + p.b * Math.PI;
    const dA = Math.sign(clean(A - before.A)), dP = Math.sign(clean(P - before.P));
    return q.choices.map(c => {
      if (/^Both go down$/.test(c)) return dA < 0 && dP < 0;
      if (/^The area goes down and the perimeter goes UP$/.test(c)) return dA < 0 && dP > 0;
      if (/^The area goes down, the perimeter stays the same$/.test(c)) return dA < 0 && dP === 0;
      return false;
    });
  },
  which(q) {
    const p = q.prompt;
    let want;
    if (/both edges of the path/.test(p)) want = /^Both edges of the path$/;
    else if (/along the pond’s edge only/.test(p)) want = /^The inside edge only, along the pond$/;
    else if (/every edge, around the tree hole too/.test(p)) want = /^The outside edge and the hole’s edge$/;
    else if (/around the outside of the deck/.test(p)) want = /^The outside edge only$/;
    else if (/to (cover|fill)/.test(p)) want = /^The surface of the /;
    else if (/along the curved top only/.test(p)) want = /^The curved top only$/;
    else if (/all the way around the window/.test(p)) want = /^All the way around the window$/;
    else return null;
    return q.choices.map(c => want.test(c));
  },
  job(q) {
    const f = figOf(q), p = q.prompt;
    let t;
    if (/around the OUTSIDE only|all the way around the outside/.test(p)) t = outerPerim(f);
    else if (/BOTH edges|EVERY edge/.test(p)) t = fullPerim(f);
    else return null;
    const v = t.a + t.b * Math.PI;
    if (/nearest tenth/.test(p)) return Math.round(v * 10 + 1e-9) / 10;
    if (/nearest whole/.test(p)) return Math.round(v + 1e-9);
    return clean(v);
  },
};

// ---------------------------------------------------------------- the world
function worldProblems(q, r) {
  const probs = [];
  const f = figOf(q), pic = picOf(q), p = q.prompt;
  if (f) {
    // every label on show must say what the drawing measures
    for (const d of pic.dims ?? []) {
      if (d.text) continue;
      const fd = f.dims.find(x => x.id === d.id);
      if (!fd) { probs.push(`a label "${d.id}" the figure does not have`); continue; }
      const len = dimLen(f, d.id);
      const v = typeof fd.value === 'object' ? fd.value : { a: fd.value, b: 0 };
      if (typeof len === 'number' && !(close(v.a, len, 1e-4) && close(v.b, 0))) probs.push(`label ${d.id} says ${JSON.stringify(fd.value)}, the drawing is ${clean(len)}`);
    }
    // a teal trace may only name pieces that exist ('seam' = the seams)
    if (pic.cand) {
      const ids = new Set([...f.outer, ...holePieces(f), ...(f.seams ?? [])].map(s => s.id));
      for (const id of pic.cand) if (id !== 'seam' && !ids.has(id)) probs.push(`the teal trace names a missing piece "${id}"`);
    }
    // straight edges should be clean lengths
    for (const s of [...f.outer, ...holePieces(f)]) if (s.kind === 'seg') { const L = D(s.a, s.b); if (!close(L * 4, Math.round(L * 4), 1e-6)) probs.push(`an edge of length ${clean(L)}`); }
    // the prompt's numbers must be the drawing's
    let m;
    if ((m = p.match(/A (\d+) by (\d+) (?:ft|m|yd|in) /))) {
      const base = f.parts.find(x => x.sign > 0 && !x.c);
      if (base) { const xs = base.outline.map(pt => pt[0]), ys = base.outline.map(pt => pt[1]); const w = Math.max(...xs) - Math.min(...xs), h = Math.max(...ys) - Math.min(...ys); if (![w, h].sort((a, b) => a - b).every((v, i) => close(v, [Number(m[1]), Number(m[2])].sort((a, b) => a - b)[i]))) probs.push(`the drawn board is ${w} by ${h}`); }
    }
    if ((m = p.match(/quarter circle of radius (\d+) \w+ is cut away/))) { const c = f.parts.find(x => x.sign < 0 && x.c); if (c && !close(c.r, Number(m[1]))) probs.push(`the drawn corner radius is ${c.r}`); }
    if ((m = p.match(/rectangle’s perimeter \((\d+)\) plus the half circle’s perimeter \((\d+) \+ ([\d.]+)π\)/))) {
      const rect = f.parts.find(x => x.kind === 'rect');
      const rp = rect ? rect.outline.reduce((s, pt, i) => s + D(pt, rect.outline[(i + 1) % rect.outline.length]), 0) : NaN;
      const semi = f.parts.find(x => x.c);
      if (!close(rp, Number(m[1])) || (semi && (!close(2 * semi.r, Number(m[2])) || !close(semi.r, Number(m[3]))))) probs.push('the perimeters in the critique are not the drawn ones');
    }
    if ((m = p.match(/splits the L into two rectangles and adds: (\d+) × (\d+) \+ (\d+) × (\d+) = (\d+)/)) && Number(m[1]) * Number(m[2]) + Number(m[3]) * Number(m[4]) !== Number(m[5])) probs.push('the critique adds wrong');
  }
  if (q.family === 'round') {
    const m = p.match(/The exact (?:area|perimeter) is ([\d.]+) ([+−]) ([\d.]+)π .+?\. Use (π ≈ 3\.14|the π key on a calculator) and round to the nearest (tenth|whole number)/);
    if (m) { const pi = /3\.14/.test(m[4]) ? 3.14 : Math.PI; const v = Number(m[1]) + (m[2] === '−' ? -1 : 1) * Number(m[3]) * pi; const k = m[5] === 'tenth' ? 10 : 1; if (close(v * k - Math.floor(v * k), 0.5, 1e-7)) probs.push('a .5 tie'); }
  }
  return probs;
}

// ---------------------------------------------------------------- contract
const pick = arr => { const hits = arr.map((ok, i) => (ok ? i : -1)).filter(i => i >= 0); return hits.length ? hits[0] : -1; };
function runF(q) { const fn = F[q.family]; return fn ? fn(q) : undefined; }
export default {
  solve(q) {
    let r;
    try { r = runF(q); } catch { return undefined; }
    if (r == null) return undefined;
    if (q.input === 'choice') return Array.isArray(r) ? pick(r) : undefined;
    if (q.input === 'pair') return Array.isArray(r) && r.every(Number.isFinite) ? r : undefined;
    return Number.isFinite(r) ? r : undefined;
  },
  sane(q) {
    let r;
    try { r = runF(q); } catch (e) { return `could not read the item (${e.message})`; }
    const probs = [];
    if (q.input === 'choice' && Array.isArray(r)) {
      const n = r.filter(Boolean).length;
      if (n === 0) probs.push('no choice is right');
      if (n > 1) probs.push(`${n} choices are right: ${q.choices.filter((_, i) => r[i]).join(' | ')}`);
    }
    try { probs.push(...worldProblems(q, r)); } catch (e) { probs.push(`could not check the figure (${e.message})`); }
    return probs.join('; ');
  },
};
