// composite-area-volume oracle (role O, docs/lessons/QUALITY_LAYER.md). Works every practice item out from what the
// student sees: the prompt, the board, the choices and the drawing: a plan (outer polygon, holes, the pieces on show,
// the length labels) or solids (boxes added / cut, prisms, pyramids, cylinders, the marked glow region, the length
// labels), in the camera the page uses (az 30°, el 24°). Areas and volumes come from the drawn coordinates (shoelace,
// a grid over the boxes for volume and exposed faces); a plan marked "Not to scale" is solved from its labels only
// (the edges along one direction add up). Solution-side picture parts (pieces not on show) are never used.
const EPS = 1e-6;
const close = (a, b, e = EPS) => Math.abs(a - b) < e;
const clean = v => Math.round(v * 1e6) / 1e6;
const UNI = { '½': '.5', '¼': '.25', '¾': '.75' };
const num = t => { let s = String(t).trim(); const fr = s.match(/^(\d*)([⅓⅔])$/); if (fr) return Number(fr[1] || 0) + (fr[2] === '⅓' ? 1 / 3 : 2 / 3); s = s.replace(/(\d)([½¼¾])/g, (_, d, c) => d + UNI[c]).replace(/^([½¼¾])/, c => '0' + UNI[c]).replace(/,/g, ''); return Number(s); };
const shoelace = pts => Math.abs(pts.reduce((s, p, i) => { const q = pts[(i + 1) % pts.length]; return s + p[0] * q[1] - q[0] * p[1]; }, 0)) / 2;
const D = (p, q) => Math.hypot(...p.map((x, i) => x - q[i]));
const pic = q => q.data?.picture;
const plan = q => q.data?.picture?.plan;
const solids = q => q.data?.picture?.solids;
const cube = u => `${u}³`, square = u => `${u}²`;

// ---------------------------------------------------------------- plans
function planArea(p) { return shoelace(p.outer) - (p.holes ?? []).reduce((s, h) => s + shoelace(h), 0); }
/** the shown pieces of a split (show: p0, p1 …) */
function shownPieces(q) {
  const P = plan(q), show = pic(q).show ?? [];
  return (P.pieces ?? []).filter((_, i) => show.includes(`p${i}`));
}
function rectOf(pts) { const xs = pts.map(p => p[0]), ys = pts.map(p => p[1]); return [Math.min(...xs), Math.min(...ys), Math.max(...xs), Math.max(...ys)]; }
const overlap = (a, b) => Math.max(0, Math.min(a[2], b[2]) - Math.max(a[0], b[0])) * Math.max(0, Math.min(a[3], b[3]) - Math.max(a[1], b[1]));
/** solve the '?' edge of a right-angled plan from its labels only (edges along one direction add up) */
function hiddenFromLabels(P) {
  const pts = P.outer, n = pts.length;
  const edges = pts.map((p, i) => ({ a: p, b: pts[(i + 1) % n] }));
  const same = (u, v) => close(u[0], v[0]) && close(u[1], v[1]);
  const labelOf = e => (P.labels ?? []).find(l => (same(l.a, e.a) && same(l.b, e.b)) || (same(l.a, e.b) && same(l.b, e.a)));
  const ask = edges.find(e => labelOf(e)?.text === '?');
  if (!ask) return null;
  const horiz = close(ask.a[1], ask.b[1]);
  let sum = 0, sAsk = 0;
  for (const e of edges) {
    const isH = close(e.a[1], e.b[1]);
    if (isH !== horiz) continue;
    const dir = Math.sign(horiz ? e.b[0] - e.a[0] : e.b[1] - e.a[1]);
    const l = labelOf(e);
    if (e === ask) { sAsk = dir; continue; }
    if (!l) return { underdetermined: true };
    sum += dir * num(l.text.replace(/\s*[a-z]+$/, ''));
  }
  return { v: -sum / sAsk };
}

// ---------------------------------------------------------------- solids: a grid over the boxes
function grid(boxesAdd, boxesCut = []) {
  const ax = [0, 1, 2].map(k => [...new Set([...boxesAdd, ...boxesCut].flatMap(b => [b.at[k], b.at[k] + b.size[k]]))].sort((x, y) => x - y));
  const inside = (b, c) => [0, 1, 2].every(k => c[k] > b.at[k] - EPS && c[k] < b.at[k] + b.size[k] + EPS);
  const N = ax.map(a => a.length - 1);
  const filled = (i, j, k) => {
    if (i < 0 || j < 0 || k < 0 || i >= N[0] || j >= N[1] || k >= N[2]) return false;
    const c = [(ax[0][i] + ax[0][i + 1]) / 2, (ax[1][j] + ax[1][j + 1]) / 2, (ax[2][k] + ax[2][k + 1]) / 2];
    return boxesAdd.some(b => inside(b, c)) && !boxesCut.some(b => inside(b, c));
  };
  let V = 0, S = 0, bottom = 0;
  const L = (k, i) => ax[k][i + 1] - ax[k][i];
  for (let i = 0; i < N[0]; i++) for (let j = 0; j < N[1]; j++) for (let k = 0; k < N[2]; k++) {
    if (!filled(i, j, k)) continue;
    V += L(0, i) * L(1, j) * L(2, k);
    if (!filled(i - 1, j, k)) S += L(1, j) * L(2, k);
    if (!filled(i + 1, j, k)) S += L(1, j) * L(2, k);
    if (!filled(i, j - 1, k)) S += L(0, i) * L(2, k);
    if (!filled(i, j + 1, k)) S += L(0, i) * L(2, k);
    if (!filled(i, j, k - 1)) { S += L(0, i) * L(1, j); if (close(ax[2][k], 0)) bottom += L(0, i) * L(1, j); }
    if (!filled(i, j, k + 1)) S += L(0, i) * L(1, j);
  }
  return { V: clean(V), S: clean(S), bottom: clean(bottom), occupied: p => boxesAdd.some(b => [0, 1, 2].every(k => p[k] > b.at[k] && p[k] < b.at[k] + b.size[k])) && !boxesCut.some(b => [0, 1, 2].every(k => p[k] > b.at[k] && p[k] < b.at[k] + b.size[k])) };
}
const boxesOf = (bodies, idx) => idx.flatMap(i => (bodies[i]?.kind === 'boxes' ? bodies[i].add : []));
const cutsOf = (bodies, idx) => idx.flatMap(i => (bodies[i]?.kind === 'boxes' ? bodies[i].cut ?? [] : []));
/** a prism: base polygon in the plane of the two other axes, extruded along `axis` */
function prismInfo(b) {
  const A = shoelace(b.base), per = b.base.reduce((s, p, i) => s + D(p, b.base[(i + 1) % b.base.length]), 0);
  return { V: A * b.len, S: 2 * A + per * b.len, A, per };
}
/** the side faces of a prism lying flat at height z (axis 0 or 1 prisms with base coords [u, z]) */
function prismBottomOn(b, z) {
  if (b.axis === 2) return 0;
  let a = 0;
  b.base.forEach((p, i) => { const r = b.base[(i + 1) % b.base.length]; if (close(p[1], z) && close(r[1], z)) a += Math.abs(r[0] - p[0]) * b.len; });
  return a;
}
const polyArea3 = pts => { let c = [0, 0, 0]; for (let i = 0; i < pts.length; i++) { const p = pts[i], r = pts[(i + 1) % pts.length]; c = [c[0] + p[1] * r[2] - p[2] * r[1], c[1] + p[2] * r[0] - p[0] * r[2], c[2] + p[0] * r[1] - p[1] * r[0]]; } return Math.hypot(...c) / 2; };
const CAM = q => { const cam = solids(q)?.cam ?? { az: 30, el: 24 }; const a = (cam.az * Math.PI) / 180, e = (cam.el * Math.PI) / 180; return [Math.sin(a) * Math.cos(e), -Math.cos(a) * Math.cos(e), Math.sin(e)]; };
const UNIT = q => (q.unit ?? '').replace(/[²³]$/, '') || ((q.prompt.match(/\b(\d+(?:\.\d+)?) (in|ft|cm|m|yd)\b/) ?? [])[2] ?? '');
const unitOfLabels = q => ((solids(q)?.labels ?? plan(q)?.labels ?? []).map(l => (String(l.text).match(/ (in|ft|cm|m|yd)$/) ?? [])[1]).find(Boolean)) ?? '';

// ---------------------------------------------------------------- families
const F = {
  split(q) {
    const P = plan(q), pcs = shownPieces(q).map(x => rectOf(x.pts));
    const A = planArea(P), sum = pcs.reduce((s, r) => s + (r[2] - r[0]) * (r[3] - r[1]), 0);
    let ov = 0;
    for (let i = 0; i < pcs.length; i++) for (let j = i + 1; j < pcs.length; j++) ov += overlap(pcs[i], pcs[j]);
    const want = ov > EPS ? /^No: two pieces overlap$/ : sum < A - EPS ? /^No: a part is left out$/ : close(sum, A) ? /^Yes: the pieces cover it exactly once$/ : null;
    return want ? q.choices.map(c => want.test(c)) : null;
  },
  hidden(q) {
    const P = plan(q);
    if (P) { const r = hiddenFromLabels(P); return r && !r.underdetermined ? clean(r.v) : null; }
    const S = solids(q), l = (S?.labels ?? []).find(x => x.text === '?');
    return l ? clean(D(l.a, l.b)) : null;
  },
  areaAdd(q) {
    const A = clean(planArea(plan(q)));
    if (q.input !== 'choice') return A;
    const u = unitOfLabels(q);
    return q.choices.map(c => { const m = c.match(/^([\d.½¼¾]+) (\w+²)$/); return !!m && close(num(m[1]), A) && m[2] === square(u); });
  },
  areaSub: q => clean(planArea(plan(q))),
  twoWays(q) {
    const A = clean(planArea(plan(q)));
    if (/split this .+ into the (?:two|three|four) pieces shown and got ([\d.]+) \w+², the same as the answer key\. Is his method right\?/.test(q.prompt)) {
      const pcs = shownPieces(q).map(x => rectOf(x.pts));
      const sum = pcs.reduce((t, r) => t + (r[2] - r[0]) * (r[3] - r[1]), 0);
      let ov = 0;
      for (let i = 0; i < pcs.length; i++) for (let j = i + 1; j < pcs.length; j++) ov += overlap(pcs[i], pcs[j]);
      const covered = sum - ov, gap = A - covered;
      return q.choices.map(c => (/^No: his pieces overlap and leave a gap; the total only matches by luck$/.test(c) ? ov > EPS && gap > EPS : /^Yes: his total matches the answer key$/.test(c) ? ov < EPS && gap < EPS : false));
    }
    return q.choices.map(c => { const m = c.match(/^([\d.]+) \w+²: any split that covers it exactly once gives the same area$/); return !!m && close(Number(m[1]), A); });
  },
  volAdd(q) { const B = solids(q).bodies; return grid(boxesOf(B, [0]), cutsOf(B, [0])).V; },
  volSub(q) { const B = solids(q).bodies; return grid(boxesOf(B, [0]), cutsOf(B, [0])).V; },
  prismBh(q) {
    const b = solids(q).bodies.find(x => x.kind === 'prism');
    if (q.input === 'choice') {
      const shape = b.base.length === 3 ? 'triangle' : b.base.length === 4 ? 'trapezoid' : null;
      return q.choices.map(c => c === `B × h: B is the area of a ${shape} end, h the length between the ends`);
    }
    return clean(prismInfo(b).V);
  },
  tent(q) {
    const b = solids(q).bodies.find(x => x.kind === 'prism');
    if (!b) return null;
    const V = clean(prismInfo(b).V);
    if (q.input !== 'choice') return V;
    const m = q.prompt.match(/as one prism with a [\w-]+ base: ([\d,.]+) \w+³\./);
    return q.choices.map(c => { const mm = c.match(/^([\d,.]+) \w+³, the same$/); return !!mm && !!m && close(num(mm[1]), V) && close(num(m[1]), V); });
  },
  third(q) {
    const B = solids(q).bodies, box = B.find(x => x.kind === 'boxes')?.add[0], pyr = B.find(x => x.kind === 'pyramid');
    const pV = box.size[0] * box.size[1] * box.size[2];
    const base = polyArea3(pyr.base), h = pyr.apex[2] - pyr.base[0][2], yV = (base * h) / 3;
    const p = q.prompt;
    if (/How many pyramids-full fill the prism\?/.test(p)) return q.choices.map(c => { const m = c.match(/^(\d+)/); return !!m && close(Number(m[1]), pV / yV); });
    if (/How much does the pyramid hold\?/.test(p)) return q.choices.map(c => { const m = c.match(/^([\d.⅓⅔]+) /); return !!m && close(num(m[1]), yV); });
    if (/its slanted face is .+ Kai says the pyramid holds ⅓ of the prism/.test(p)) {
      const lessThird = yV < pV / 3 - EPS;
      return q.choices.map(c => /^No: its height is straight up, shorter than/.test(c) && lessThird);
    }
    if (/Kai says the pyramid holds ⅓ of/.test(p)) {
      return q.choices.map(c => { const m = c.match(/^No: the heights differ\. It holds ⅓ × ([\d.]+) × ([\d.]+) = ([\d.⅓⅔]+) \w+³$/); return !!m && !close(h, box.size[2]) && close(Number(m[1]), base) && close(Number(m[2]), h) && close(num(m[3]), yV); });
    }
    return null;
  },
  pyrVol(q) {
    const pyr = solids(q).bodies.find(x => x.kind === 'pyramid');
    if (!pyr) return null;
    return clean((polyArea3(pyr.base) * (pyr.apex[2] - pyr.base[0][2])) / 3);
  },
  classify(q) {
    const S = solids(q), B = S.bodies, g = (S.glows ?? []).find(x => x.key === 'mk');
    if (!g) return null;
    const G = grid(boxesOf(B, B.map((_, i) => i)), cutsOf(B, B.map((_, i) => i)));
    const c = [0, 1, 2].map(k => g.pts.reduce((s, p) => s + p[k], 0) / g.pts.length);
    const u = [0, 1, 2].map(k => g.pts[1][k] - g.pts[0][k]), v = [0, 1, 2].map(k => g.pts[2][k] - g.pts[1][k]);
    let n = [u[1] * v[2] - u[2] * v[1], u[2] * v[0] - u[0] * v[2], u[0] * v[1] - u[1] * v[0]];
    const ln = Math.hypot(...n); n = n.map(x => x / ln);
    const e = 1e-3, plus = G.occupied(c.map((x, k) => x + e * n[k])), minus = G.occupied(c.map((x, k) => x - e * n[k]));
    if (plus && minus) return q.choices.map(ch => /^No: it is inside, where the blocks touch$/.test(ch));
    if (plus === minus) return null;
    const out = plus ? n.map(x => -x) : n; // outward normal
    const C = CAM(q);
    const facing = out[0] * C[0] + out[1] * C[1] + out[2] * C[2] > EPS;
    let seen = facing;
    if (facing) { for (let t = 0.05; t < 60 && seen; t += 0.05) if (G.occupied(c.map((x, k) => x + (e + t) * C[k]))) seen = false; }
    return q.choices.map(ch => (seen ? /^Yes: it is on the outside, and you can see it$/.test(ch) : /^Yes: it is on the outside, just hidden from this view$/.test(ch)));
  },
  faces(q) {
    const B = solids(q).bodies;
    const boxIdx = B.map((b, i) => (b.kind === 'boxes' ? i : -1)).filter(i => i >= 0);
    const G = grid(boxesOf(B, boxIdx), cutsOf(B, boxIdx));
    const prisms = B.filter(b => b.kind === 'prism');
    let S = G.S;
    for (const pr of prisms) {
      const info = prismInfo(pr);
      const zTop = Math.max(...boxesOf(B, boxIdx).map(b => b.at[2] + b.size[2]));
      const contact = prismBottomOn(pr, zTop);
      S += info.S - 2 * contact;
    }
    return clean(S);
  },
  joinSA(q) {
    const B = solids(q).bodies;
    const one = grid(boxesOf(B, [0])), two = grid(boxesOf(B, [1])), both = grid(boxesOf(B, [0, 1]));
    if (q.input === 'choice') {
      const lost = clean((one.S + two.S - both.S) / 2);
      return q.choices.map(c => { const m = c.match(/^Each block had its own ([\d.]+) \w+² face there, and both are now inside$/); return !!m && close(Number(m[1]), lost); });
    }
    return both.S;
  },
  partialSA(q) { const B = solids(q).bodies, G = grid(boxesOf(B, [0, 1])); return /except the bottom/.test(q.prompt) ? clean(G.S - G.bottom) : G.S; },
  cutJoin(q) {
    const B = solids(q).bodies, p = q.prompt;
    if (/What is the total surface area of the two pieces\?/.test(p)) return clean(grid(boxesOf(B, [0])).S + grid(boxesOf(B, [1])).S);
    if (/is cut into two pieces\. What happens to the total volume and the total surface area\?/.test(p)) return q.choices.map(c => /^The volume stays the same; the surface area grows$/.test(c));
    if (/pushed together end to end \(they meet across a/.test(p)) {
      const apart = grid(boxesOf(B, [0])).S + grid(boxesOf(B, [1])).S, joined = grid(boxesOf(B, [0, 1])).S;
      return q.choices.map(c => { const m = c.match(/^The volume adds; the surface area drops by ([\d.]+) \w+²$/); return !!m && close(Number(m[1]), apart - joined); });
    }
    if (/glued into a long row, then into a block\. Compare the two solids\./.test(p)) {
      const r = grid(boxesOf(B, [0])), k = grid(boxesOf(B, [1]));
      return q.choices.map(c => (/^Same volume, but the row has more surface area$/.test(c) ? close(r.V, k.V) && r.S > k.S : /^Same volume, so the same surface area$/.test(c) ? close(r.V, k.V) && close(r.S, k.S) : false));
    }
    return null;
  },
  which(q) {
    const B = solids(q).bodies, p = q.prompt, u = unitOfLabels(q);
    const G = grid(boxesOf(B, B.map((_, i) => i)), cutsOf(B, B.map((_, i) => i)));
    let want;
    if (/every outside surface except the bottom/.test(p)) want = `${clean(G.S - G.bottom)} ${square(u)}`;
    else if (/every outside surface, bottom included/.test(p)) want = `${G.S} ${square(u)}`;
    else if (/filled to the top with/.test(p)) want = `${G.V} ${cube(u)}`;
    else { const m = p.match(/A tank holds ([\d.]+) (\w+)³ of water\. Its base is ([\d.]+) \2²\. How deep/); if (m) want = `${clean(Number(m[1]) / Number(m[3]))} ${m[2]}`; }
    return want ? q.choices.map(c => c === want) : null;
  },
  cylVol(q) {
    const p = q.prompt;
    let m, r, h;
    if ((m = p.match(/radius of ([\d.]+) \w+ and ([\d.]+) \w+ tall/))) { r = Number(m[1]); h = Number(m[2]); }
    else if ((m = p.match(/([\d.]+) \w+ across \(diameter\) and ([\d.]+) \w+ tall/))) { r = Number(m[1]) / 2; h = Number(m[2]); }
    else return null;
    if (/in terms of π/.test(p)) return clean(r * r * h);
    if (/Use 3\.14 for π and round to the nearest tenth/.test(p)) return Math.round(3.14 * r * r * h * 10 + 1e-9) / 10;
    return null;
  },
  cylSA(q) {
    const p = q.prompt;
    let m;
    if ((m = p.match(/radius of ([\d.]+) \w+ and is ([\d.]+) \w+ tall\. How much material for (.+?)\?/))) {
      const r = Number(m[1]), h = Number(m[2]), what = m[3];
      if (/label that covers only the side/.test(what)) return clean(2 * r * h);
      if (/no lid|open on top/.test(what)) return clean(2 * r * h + r * r);
      if (/closed|with a lid|both ends|whole can/.test(what)) return clean(2 * r * h + 2 * r * r);
      return null;
    }
    if ((m = p.match(/The label on a can with a radius of ([\d.]+) \w+ and ([\d.]+) \w+ tall has an area of ([\d.]+)π \w+²\. The can is made ([\d.]+) \w+ taller/))) return clean(2 * Number(m[1]) * (Number(m[2]) + Number(m[4])));
    if ((m = p.match(/wraps once around a can with a radius of ([\d.]+) \w+\. .+ How long is the label\? Use 3\.14 for π and round to the nearest tenth/))) return Math.round(2 * 3.14 * Number(m[1]) * 10 + 1e-9) / 10;
    return null;
  },
  missing(q) {
    const p = q.prompt;
    let m;
    if ((m = p.match(/holds ([\d.]+)π (\w+)³\. Its radius is ([\d.]+) \2\. How tall is it\?/))) return clean(Number(m[1]) / (Number(m[3]) ** 2));
    if ((m = p.match(/is a pyramid ([\d.]+) (\w+) tall that holds ([\d.]+) \2³\. What is the area of its base\?/))) return clean((3 * Number(m[3])) / Number(m[1]));
    if ((m = p.match(/is a (?:box|prism|cylinder) ([\d.]+) (\w+) tall that holds ([\d.]+) \2³\. What is the area of its base\?/))) return clean(Number(m[3]) / Number(m[1]));
    if ((m = p.match(/is a pyramid with an? ([\d.]+) (\w+) × ([\d.]+) \2 base\. It holds ([\d.]+) \2³\. How tall is it\?/))) return clean((3 * Number(m[4])) / (Number(m[1]) * Number(m[3])));
    if ((m = p.match(/has an? ([\d.]+) (\w+) × ([\d.]+) \2 base and holds ([\d.]+) \2³\. How tall is it\?/))) return clean(Number(m[4]) / (Number(m[1]) * Number(m[3])));
    return null;
  },
  cost(q) {
    const p = q.prompt;
    let m;
    if ((m = p.match(/slab ([\d.]+) ft × ([\d.]+) ft × ([\d.]+) ft is poured\. Concrete costs \$([\d.]+) per cubic yard, and 27 ft³ = 1 yd³\./))) return clean((Number(m[1]) * Number(m[2]) * Number(m[3])) / 27 * Number(m[4]));
    if ((m = p.match(/has ([\d.]+) (\w+)² of outside surface to paint\. One can of paint covers ([\d.]+) \2², and the store sells whole cans only\./))) return Math.ceil(Number(m[1]) / Number(m[3]) - 1e-9);
    if ((m = p.match(/costs \$([\d.]+) per (\w+)²\. How much does the (\w+) cost/)) && plan(q)) return clean(planArea(plan(q)) * Number(m[1]));
    if ((m = p.match(/costs \$([\d.]+) per (\w+)²/)) && solids(q)) { const B = solids(q).bodies; return clean(grid(boxesOf(B, [0])).S * Number(m[1])); }
    return null;
  },
};

// ---------------------------------------------------------------- the world
function worldProblems(q, r) {
  const probs = [];
  const p = q.prompt, P = plan(q), S = solids(q);
  // grammar a student reads
  if (/\b(A|a) (ice|oatmeal|egg|old|apple|orange)\b/.test(p)) probs.push(`"${p.match(/\b(A|a) (ice|oatmeal|egg|old|apple|orange)\b/)[0]}" (an)`);
  if (/\bblock of (cheeses|clays)\b|\bTwo block of\b/.test(p)) probs.push('"block of cheeses / clays" plural');
  // labels must match the drawing unless the plan says it is not to scale
  const notToScale = pic(q)?.note === 'Not to scale' || /not to scale/i.test(p);
  for (const l of (P?.labels ?? S?.labels ?? [])) {
    const t = String(l.text);
    if (t === '?' || notToScale) continue;
    const v = num(t.replace(/\s*[a-z]+$/, ''));
    if (Number.isFinite(v) && !close(v, D(l.a, l.b), 1e-4)) probs.push(`label ${t} is drawn ${clean(D(l.a, l.b))} long`);
  }
  if (P && notToScale && q.family === 'hidden') { const h = hiddenFromLabels(P); if (h?.underdetermined) probs.push('the labels do not fix the ? length'); if (h && h.v <= 0) probs.push(`the labels give ? = ${h.v}`); }
  // numbers the prompt states must be the drawing's
  let m;
  if ((m = p.match(/Block A \(([\d.]+) × ([\d.]+) × ([\d.]+) \w+\) has a surface area of ([\d.]+) \w+² and block B \(([\d.]+) × ([\d.]+) × ([\d.]+) \w+\) of ([\d.]+)/))) {
    const sa = (a, b, c) => 2 * (a * b + b * c + a * c);
    if (!close(sa(+m[1], +m[2], +m[3]), +m[4]) || !close(sa(+m[5], +m[6], +m[7]), +m[8])) probs.push('a stated block surface area is wrong');
  }
  if ((m = p.match(/A small ([\d.]+) × ([\d.]+) × ([\d.]+) \w+ .+ The big block's surface area is ([\d.]+) \w+², the small one's ([\d.]+)/)) && S) {
    const sa = b => 2 * (b.size[0] * b.size[1] + b.size[1] * b.size[2] + b.size[0] * b.size[2]);
    const big = S.bodies[0]?.add?.[0], small = S.bodies[1]?.add?.[0];
    if (big && small && (!close(sa(big), +m[4]) || !close(sa(small), +m[5]))) probs.push('a stated surface area is not the drawn block\'s');
  }
  if ((m = p.match(/A [\w ]+? ([\d.]+) × ([\d.]+) × ([\d.]+) \w+ has a surface area of ([\d.]+)/))) { const a = +m[1], b = +m[2], c = +m[3]; if (!close(2 * (a * b + b * c + a * c), +m[4])) probs.push(`a ${a} × ${b} × ${c} block's surface area is not ${m[4]}`); }
  if (q.family === 'twoWays' && (m = p.match(/as (.+?) = ([\d.]+) \w+²\./))) {
    const v = Function(`return (${m[1].replace(/×/g, '*').replace(/−/g, '-')});`)();
    const A = planArea(P);
    if (!close(v, +m[2]) || !close(v, A)) probs.push(`Mo's ${m[1]} = ${m[2]} is not the area ${clean(A)}`);
  }
  if (q.family === 'third' && (m = p.match(/The prism holds ([\d.]+) \w+³/)) && S) { const b = S.bodies.find(x => x.kind === 'boxes')?.add[0]; if (b && !close(b.size[0] * b.size[1] * b.size[2], +m[1])) probs.push('the stated prism volume is not the drawn box'); }
  if (q.family === 'cost' && /\\cdot/.test(q.board) && P) { const bm = String(q.board).match(/^([\d.]+) \\cdot/); if (bm && !close(+bm[1], planArea(P))) probs.push(`the board's area ${bm[1]} is not the drawn ${clean(planArea(P))}`); }
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
    if (!Number.isFinite(r)) return undefined;
    if (q.input === 'frac') { for (let d = 1; d <= 12; d++) { const n = Math.round(r * d); if (close(n / d, r, 1e-6)) return [n, d]; } }
    return r;
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
    try { probs.push(...worldProblems(q, r)); } catch (e) { probs.push(`could not check the drawing (${e.message})`); }
    return probs.join('; ');
  },
};
