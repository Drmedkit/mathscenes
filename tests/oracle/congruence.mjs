// congruence oracle (role O, docs/lessons/QUALITY_LAYER.md). Works every practice item out from what the student
// sees: the prompt, the move on the board (and the "then …" line under it), the choices and the drawn figures (corner
// coordinates and corner letters on the plane). Moves are parsed and applied to the drawn corners; congruence is
// decided by trying every corner correspondence of the outlines (distances kept), direct or mirror. A choice is right
// when its claim holds AND its reason is a reason (a tried quarter turn, "they look the same", "it is turned", "two
// corners match", "one example keeps its length" are not).
const EPS = 1e-6;
const close = (a, b) => Math.abs(a - b) < EPS;
const samePt = (p, q) => close(p[0], q[0]) && close(p[1], q[1]);
const dist = (p, q) => Math.hypot(p[0] - q[0], p[1] - q[1]);
const area2 = pts => pts.reduce((s, p, i) => { const q = pts[(i + 1) % pts.length]; return s + p[0] * q[1] - q[0] * p[1]; }, 0);
const orient = pts => (area2(pts) > 0 ? 'ccw' : 'cw');

// ---------------------------------------------------------------- reading
const prime = s => String(s).replace(/′′|″/g, '″').replace(/'/g, '′');
/** the board TeX as plain words: "turn 90° clockwise about the origin", "dilate by 1/2 about (−1, 1)" */
function texWords(tex) {
  let s = String(tex ?? '');
  for (let i = 0; i < 4; i++) s = s.replace(/\\[td]?frac\{([^{}]*)\}\{([^{}]*)\}/g, '$1/$2').replace(/\\text\{([^{}]*)\}/g, '$1').replace(/\{([^{}]*)\}/g, '$1');
  return s.replace(/\^\\circ/g, '°').replace(/\\circlearrowright/g, 'clockwise').replace(/\\circlearrowleft/g, 'counterclockwise')
    .replace(/about\\ O\b|about O\b/g, 'about the origin').replace(/\\to/g, '→').replace(/\\[ ,;]/g, ' ').replace(/\\[a-z]+/g, '')
    .replace(/-/g, '−').replace(/x−axis/g, 'x-axis').replace(/y−axis/g, 'y-axis').replace(/\s+/g, ' ').trim();
}
const numv = t => { const s = String(t).replace(/[−–]/g, '-').trim(); const m = s.match(/^(-?\d+)\/(\d+)$/); return m ? Number(m[1]) / Number(m[2]) : s === '½' ? 0.5 : Number(s); };
const N = '([−-]?\\d+(?:\\.\\d+)?(?:\\/\\d+)?|½)';

/** one move as a function on points; null when the text is not a move */
function parseMove(text, named = {}) {
  const s = String(text).trim().replace(/^then\s+/i, '').replace(/\.$/, '');
  let m;
  if (/^slide nowhere$/i.test(s)) return { kind: 'slide', f: p => p.slice(), v: [0, 0] };
  if ((m = s.match(/^slide (\d+) (left|right|up|down)(?:,? (\d+) (left|right|up|down))?$/i))) {
    const v = [0, 0];
    const add = (n, d) => { const k = Number(n); if (d === 'left') v[0] -= k; if (d === 'right') v[0] += k; if (d === 'up') v[1] += k; if (d === 'down') v[1] -= k; };
    add(m[1], m[2].toLowerCase()); if (m[3]) add(m[3], m[4].toLowerCase());
    return { kind: 'slide', v, f: p => [p[0] + v[0], p[1] + v[1]] };
  }
  if ((m = s.match(/^(?:turn (\d+)°(?: (clockwise|counterclockwise))? about (.+)|A turn of (\d+)°(?: (clockwise|counterclockwise))? about (.+)|A (\d+)° turn(?: (clockwise|counterclockwise))? about (.+?)(?::.*)?)$/i))) {
    const deg = Number(m[1] ?? m[4] ?? m[7]), dir = (m[2] ?? m[5] ?? m[8] ?? '').toLowerCase(), about = (m[3] ?? m[6] ?? m[9]).trim();
    if (deg !== 180 && !dir) return null;
    const c = about === 'the origin' ? [0, 0] : named[about] ?? pointOf(about);
    if (!c) return null;
    const a = ((dir === 'clockwise' ? -1 : 1) * deg * Math.PI) / 180, co = Math.round(Math.cos(a) * 1e9) / 1e9, si = Math.round(Math.sin(a) * 1e9) / 1e9;
    return { kind: 'turn', deg, dir, c, f: p => [c[0] + co * (p[0] - c[0]) - si * (p[1] - c[1]), c[1] + si * (p[0] - c[0]) + co * (p[1] - c[1])] };
  }
  if ((m = s.match(/^(?:A )?flip over (?:the )?(x-axis|y-axis|(?:line )?(x|y) = ([−-]?\d+)|(?:line )?y = x|(?:line )?y = −x)(?::.*)?$/i))) {
    const w = m[1].replace(/^line /, '');
    if (w === 'x-axis') return { kind: 'flip', f: p => [p[0], -p[1]] };
    if (w === 'y-axis') return { kind: 'flip', f: p => [-p[0], p[1]] };
    if (w === 'y = x') return { kind: 'flip', f: p => [p[1], p[0]] };
    if (w === 'y = −x') return { kind: 'flip', f: p => [-p[1], -p[0]] };
    const k = numv(m[3]);
    return m[2] === 'x' ? { kind: 'flip', f: p => [2 * k - p[0], p[1]] } : { kind: 'flip', f: p => [p[0], 2 * k - p[1]] };
  }
  if ((m = s.match(new RegExp(`^dilate by ${N} about (.+)$`, 'i')))) {
    const k = numv(m[1]), about = m[2].trim();
    const c = about === 'the origin' ? [0, 0] : named[about] ?? pointOf(about);
    if (!c) return null;
    return { kind: 'dilate', k, c, f: p => [c[0] + k * (p[0] - c[0]), c[1] + k * (p[1] - c[1])] };
  }
  return null;
}
function pointOf(t) {
  const m = String(t).match(new RegExp(`^\\(${N},\\s*${N}\\)$`));
  return m ? [numv(m[1]), numv(m[2])] : null;
}
/** "A, then B" → list of moves (null when a part is not a move) */
function parseSeq(text, named) {
  const parts = String(text).split(/,?\s+then\s+/i);
  const ms = parts.map(p => parseMove(p, named));
  return ms.every(Boolean) ? ms : null;
}
const run = (ms, p) => ms.reduce((q, m) => m.f(q), p);
/** the board's moves: the board line plus the picture's "then …" lines */
function boardSeq(q) {
  const lines = [texWords(q.board), ...(q.data?.picture?.more ?? []).map(texWords)].filter(Boolean);
  return parseSeq(lines.join(', then '));
}

// ---------------------------------------------------------------- figures
const figs = q => q.data?.picture?.figs ?? [];
const figOf = (q, role) => figs(q).find(f => f.role === role);
/** label → point of a figure */
function named(f) { const o = {}; (f?.labels ?? []).forEach((l, i) => { if (l) o[prime(l)] = f.pts[i]; }); return o; }
/** every correspondence of polygon P onto polygon Q (outline kept: cyclic shift, either direction) that keeps all distances */
function matches(P, Q) {
  const n = P.length; if (Q.length !== n) return [];
  const out = [];
  for (const dir of [1, -1]) for (let s = 0; s < n; s++) {
    const sig = P.map((_, i) => ((s + dir * i) % n + n) % n);
    let ok = true;
    for (let i = 0; i < n && ok; i++) for (let j = i + 1; j < n && ok; j++) if (!close(dist(P[i], P[j]), dist(Q[sig[i]], Q[sig[j]]))) ok = false;
    if (ok) out.push({ sig, mirror: orient(P) !== orient(sig.map(k => Q[k])) });
  }
  return out;
}
const congruent = (P, Q) => matches(P, Q).length > 0;
/** a pure slide carries P onto Q (as point sets) */
const slideFits = (P, Q) => matches(P, Q).some(({ sig }) => { const v = [Q[sig[0]][0] - P[0][0], Q[sig[0]][1] - P[0][1]]; return P.every((p, i) => samePt([p[0] + v[0], p[1] + v[1]], Q[sig[i]])); });
/** the image of P under moves equals Q as an outline */
const landsOn = (ms, P, Q) => { const img = P.map(p => run(ms, p)); return matches(img, Q).some(({ sig }) => img.every((p, i) => samePt(p, Q[sig[i]]))); };
/** moves carry every labelled corner X of `from` onto the corner `to[X]` */
const carries = (ms, from, to, pairs) => pairs.every(([a, b]) => from[a] && to[b] && samePt(run(ms, from[a]), to[b]));
const sideLens = P => P.map((p, i) => dist(p, P[(i + 1) % P.length]));

// ---------------------------------------------------------------- families (per-choice truth, or a value)
const F = {
  cover(q) {
    const P = figOf(q, 'first').pts;
    if (/Which tile can your tracing cover/.test(q.prompt)) {
      const cands = q.data.picture.cands ?? [];
      const fits = cands.filter(c => congruent(P, c.fig.pts)).map(c => c.label);
      return q.choices.map(c => { const m = c.match(/^Tile (\S+)$/); return m ? fits.includes(m[1]) : /^None of them$/.test(c) ? fits.length === 0 : false; });
    }
    const Qf = figOf(q, 'pick').pts;
    const ms = matches(P, Qf), cong = ms.length > 0, slide = slideFits(P, Qf);
    const direct = ms.some(x => !x.mirror), mirror = ms.some(x => x.mirror);
    return q.choices.map(c => {
      if (/^Yes: a slide puts the tracing exactly on Q$/.test(c)) return slide;
      if (/^Yes: a flip and a slide put the tracing exactly on Q$/.test(c)) return mirror && !slide;
      if (/^Yes: a turn and a slide put the tracing exactly on Q$/.test(c)) return direct && !slide;
      if (/^No: one side is a square longer or shorter, so the tracing can’t fit exactly$/.test(c)) {
        if (cong) return false;
        const a = sideLens(P).sort((x, y) => x - y), b = sideLens(Qf).sort((x, y) => x - y);
        return a.some((x, i) => !close(x, b[i]));
      }
      return false; // looks, place, facing, mirror image, turned, close enough, ruler
    });
  },
  partner(q) {
    const A = figOf(q, 'first'), B = figOf(q, 'pick');
    const ms = matches(A.pts, B.pts);
    const maps = ms.map(({ sig }) => { const o = {}; A.labels.forEach((l, i) => { o[l] = B.labels[sig[i]]; }); return o; });
    const allSay = f => q.choices.map(c => maps.length > 0 && maps.every(mp => f(c, mp)));
    let m;
    if ((m = q.prompt.match(/partner of side ([A-Z])([A-Z])\?/))) {
      return allSay((c, mp) => { const mm = c.match(/^side ([A-Z])([A-Z])$/); return !!mm && new Set([mp[m[1]], mp[m[2]]]).size === 2 && [mm[1], mm[2]].sort().join('') === [mp[m[1]], mp[m[2]]].sort().join(''); });
    }
    if ((m = q.prompt.match(/Which corner is the partner of ([A-Z])\?/))) return allSay((c, mp) => c === mp[m[1]]);
    if (/Which congruence statement is right\?/.test(q.prompt)) {
      return allSay((c, mp) => { const mm = c.match(/^△ABC ≅ △([A-Z])([A-Z])([A-Z])$/); return !!mm && mm[1] === mp.A && mm[2] === mp.B && mm[3] === mp.C; });
    }
    return null;
  },
  invariant(q) {
    let m;
    if ((m = q.prompt.match(/^Rectangle P is (\d+) by (\d+)\. Rectangle Q is (\d+) by (\d+)\./))) {
      const P = [+m[1], +m[2]], Qd = [+m[3], +m[4]];
      const cong = [...P].sort().join() === [...Qd].sort().join();
      return q.choices.map(c => {
        const mm = c.match(/^No: P has a side of (\d+) and Q has none, and moves never change a length$/);
        if (mm) return !cong && P.includes(+mm[1]) && !Qd.includes(+mm[1]);
        return false; // a tried quarter turn, same area/perimeter, both rectangles
      });
    }
    if ((m = q.prompt.match(/wrote △ABC ≅ △DEF\. Then .+ saw that AB = (\d+) but DE = (\d+)\./))) {
      const A = named(figOf(q, 'first')), B = named(figOf(q, 'pick'));
      const cong = congruent(figOf(q, 'first').pts, figOf(q, 'pick').pts);
      return q.choices.map(c => {
        if (/^The statement pairs the wrong corners; the triangles can still be congruent$/.test(c)) return cong && !close(dist(A.A, A.B), dist(B.D, B.E));
        if (/^The triangles are not congruent$/.test(c)) return !cong;
        return false;
      });
    }
    return null;
  },
  orient(q) {
    const P = figOf(q, 'first'), I = figOf(q, 'pick');
    const n = P.pts.length;
    let img = I?.pts;
    if (!img) { const ms = boardSeq(q); if (!ms) return null; img = P.pts.map(p => run(ms, p)); }
    const before = orient(P.pts.slice(0, n)), after = orient(img.slice(0, n));
    const word = after === 'ccw' ? 'Counterclockwise' : 'Clockwise';
    return q.choices.map(c => c === word);
  },
  whichMove(q) {
    const A = named(figOf(q, 'first')), B = named(figOf(q, 'pick'));
    const P = ['A', 'B', 'C'].map(k => A[k]), I = ['A′', 'B′', 'C′'].map(k => B[k]);
    let kind;
    if (orient(P) !== orient(I)) kind = 'reflection';
    else { const v = [I[0][0] - P[0][0], I[0][1] - P[0][1]]; kind = P.every((p, i) => samePt([p[0] + v[0], p[1] + v[1]], I[i])) ? 'translation' : 'rotation'; }
    return q.choices.map(c => c.toLowerCase().startsWith(`a ${kind}`));
  },
  specify(q) {
    const A = named(figOf(q, 'first')), B = named(figOf(q, 'pick'));
    const pairs = [['A', 'A′'], ['B', 'B′'], ['C', 'C′']];
    if (q.input === 'pair') {
      const v = [B['A′'][0] - A.A[0], B['A′'][1] - A.A[1]];
      return pairs.every(([a, b]) => samePt([A[a][0] + v[0], A[a][1] + v[1]], B[b])) ? v : null;
    }
    return q.choices.map(c => {
      const mv = parseMove(c, A);
      if (!mv) return false; // "A flip", "A 180° turn": no line / no center
      if (!carries([mv], A, B, pairs)) return false;
      const rule = c.match(/: \(x, y\) → \((.+), (.+)\)$/);
      if (rule) { // the rule must say the same as the words
        const ev = (e, p) => ({ x: p[0], '−x': -p[0], y: p[1], '−y': -p[1] })[e.trim()];
        return [[2, 3], [-1, 5], [4, -7]].every(p => { const r = mv.f(p); return close(ev(rule[1], p), r[0]) && close(ev(rule[2], p), r[1]); });
      }
      return true;
    });
  },
  sequence(q) {
    const m = q.prompt.match(new RegExp(`^A is at \\(${N}, ${N}\\)\\. (.+?)\\. Where does A end up\\?`));
    const ms = parseSeq(m[3]);
    return ms ? run(ms, [numv(m[1]), numv(m[2])]) : null;
  },
  order(q) {
    const m = q.prompt.match(/^Order 1: (.+?)\. Order 2: the same two moves the other way round\./);
    const ms = parseSeq(m[1]); if (!ms) return null;
    const P = figOf(q, 'first').pts;
    const same = P.every(p => samePt(run(ms, p), run([ms[1], ms[0]], p)));
    return q.choices.map(c => (/^Yes: the same image$/.test(c) ? same : /^No: different images$/.test(c) ? !same : false));
  },
  verify(q) {
    const ms = boardSeq(q); if (!ms) return null;
    const A = named(figOf(q, 'first')), B = named(figOf(q, 'pick'));
    const pairs = [['A', 'D'], ['B', 'E'], ['C', 'F']];
    const all = carries(ms, A, B, pairs), aOnD = carries(ms, A, B, [['A', 'D']]);
    const onTri = landsOn(ms, figOf(q, 'first').pts, figOf(q, 'pick').pts);
    return q.choices.map(c => {
      if (/^Yes: every corner lands on its partner$/.test(c)) return all;
      if (/^No: A lands on D, but not every other corner lands on its partner$/.test(c)) return aOnD && !all;
      if (/^No: it lands on the triangle, but on the wrong corners$/.test(c)) return onTri && !all && !aOnD;
      return false;
    });
  },
  plan(q) {
    const A = named(figOf(q, 'first')), B = named(figOf(q, 'pick'));
    const pairs = [['A', 'D'], ['B', 'E'], ['C', 'F']];
    const ok = q.choices.map(c => { const ms = parseSeq(c); return !!ms && carries(ms, A, B, pairs); });
    return q.choices.map((c, i) => (/^None/.test(c) ? !ok.some(Boolean) : ok[i]));
  },
  finish(q) {
    const T = figOf(q, 'first'), D = figOf(q, 'pick');
    const tgt = named(D);
    // the tracing's corners: A′ on D and B′ on E (the prompt says so), C′ labelled
    const tr = { 'A′': tgt.D, 'B′': tgt.E, 'C′': T.pts[T.labels.findIndex(l => prime(l) === 'C′')] };
    const done = samePt(tr['C′'], tgt.F);
    const lands = f => samePt(f(tr['A′']), tgt.D) && samePt(f(tr['B′']), tgt.E) && samePt(f(tr['C′']), tgt.F);
    return q.choices.map(c => {
      let m;
      if (/^Not yet: flip the tracing over the line through D and E$/.test(c)) return !done && lands(p => reflect(p, tgt.D, tgt.E));
      if ((m = c.match(/^Not yet: turn the tracing (\d+)° about D$/))) { const mv = parseMove(`turn ${m[1]}° about D`, { D: tgt.D }); return !done && !!mv && lands(mv.f); }
      if (/^Not yet: slide the tracing until C′ is on F$/.test(c)) { const v = [tgt.F[0] - tr['C′'][0], tgt.F[1] - tr['C′'][1]]; return !done && lands(p => [p[0] + v[0], p[1] + v[1]]); }
      return false; // "two corners match, so the triangle matches"
    });
  },
  twoWays(q) {
    const m = q.prompt.match(/^(\w+): (.+?)\. (\w+): (.+?)\. Both say/);
    const A = named(figOf(q, 'first')), B = named(figOf(q, 'pick'));
    const pairs = [['A', 'D'], ['B', 'E'], ['C', 'F']];
    const w1 = (() => { const ms = parseSeq(m[2]); return !!ms && carries(ms, A, B, pairs); })();
    const w2 = (() => { const ms = parseSeq(m[4]); return !!ms && carries(ms, A, B, pairs); })();
    return q.choices.map(c => {
      if (/^Both of them$/.test(c)) return w1 && w2;
      if (/^Neither of them$/.test(c)) return !w1 && !w2;
      const mm = c.match(/^Only (\w+)(:.*)?$/);
      if (mm) return (mm[1] === m[1] ? w1 && !w2 : mm[1] === m[3] ? w2 && !w1 : false);
      return false;
    });
  },
  undo(q) {
    const m = q.prompt.match(/^(.+?): these moves took △ABC to △A″B″C″\./);
    const ms = parseSeq(m[1]); if (!ms) return null;
    const probe = [[1, 2], [-3, 5], [4, -1], [0, 0]];
    return q.choices.map(c => { const back = parseSeq(c); return !!back && probe.every(p => samePt(run(back, run(ms, p)), p)); });
  },
  dilate(q) {
    const mv = boardSeq(q)?.[0]; if (!mv || mv.kind !== 'dilate') return null;
    const A = named(figOf(q, 'first'));
    const ab = dist(A.A, A.B);
    if (q.input === 'num') {
      const said = q.prompt.match(/^AB is ([\d.]+) units? long\./);
      return Math.abs(mv.k) * (said ? Number(said[1]) : ab);
    }
    return q.choices.map(c => {
      const mm = c.match(/^No: AB is ([\d.]+) but A′B′ is ([\d.]+), and a rigid motion keeps every distance$/);
      return !!mm && !close(mv.k, 1) && close(+mm[1], ab) && close(+mm[2], ab * Math.abs(mv.k));
    });
  },
  identity(q) {
    const p = q.prompt;
    let m;
    if ((m = p.match(new RegExp(`^A dilation by ${N} about corner A keeps A fixed\\. Is it a rigid motion\\?`)))) {
      const k = numv(m[1]); const A = named(figOf(q, 'first')); const ab = dist(A.A, A.B);
      return q.choices.map(c => { const mm = c.match(/^No: AB changes from ([\d.]+) to ([\d.]+); one fixed point is not enough$/); return !!mm && !close(k, 1) && close(+mm[1], ab) && close(+mm[2], ab * k); });
    }
    if ((m = p.match(new RegExp(`dilated by a scale factor of ${N} about the origin\\. Is this dilation a rigid motion\\?`)))) {
      const k = numv(m[1]);
      return q.choices.map(c => (/^Yes: every point stays put, so every distance is kept$/.test(c) ? close(k, 1) : /^No: AB/.test(c) ? !close(k, 1) : false));
    }
    if (/Which dilation is a rigid motion\?/.test(p)) {
      return q.choices.map(c => { const mm = c.match(new RegExp(`^Scale factor ${N}$`)); return !!mm && close(numv(mm[1]), 1); });
    }
    return null;
  },
  table(q) {
    const p = q.prompt;
    let m;
    if ((m = p.match(new RegExp(`dilated by ${N} about the origin\\. Is the image the same shape as △ABC\\?`)))) {
      const k = numv(m[1]);
      return q.choices.map(c => (/^Yes: same angles, different size: similar but not congruent$/.test(c) ? !close(k, 1) : /^Yes, and it is congruent too$/.test(c) ? close(k, 1) : false));
    }
    if ((m = p.match(/^Fill in the table row for (.+?)\. What happens/))) {
      const mv = parseMove(m[1].replace(/^dilate by (\S+) about the origin$/, 'dilate by $1 about the origin'));
      if (!mv) return null;
      const P = figOf(q, 'first').pts, img = P.map(mv.f);
      const kept = orient(P) === orient(img), cong = congruent(P, img);
      const want = `${kept ? 'Kept' : 'Reversed'} orientation · ${cong ? 'congruent' : 'not congruent'}`;
      return q.choices.map(c => c === want);
    }
    if (/Which statement does it back up\?/.test(p)) {
      // the rows: slide, flip, turn keep / reverse; dilations keep the orientation and change the size (k ≠ 1)
      return q.choices.map(c => /^Only flips reverse the orientation$/.test(c));
    }
    return null;
  },
  rule(q) {
    const r = texWords(q.board).match(/^\(x, y\) → \((.+), (.+)\)$/);
    if (!r) return null;
    const term = (e, p) => {
      const t = e.replace(/\s+/g, '').replace(/−/g, '-').replace(/½/g, '1/2');
      const mm = t.match(/^(-?)(\d+\/\d+|\d+)?([xy])([+-]\d+)?$/);
      if (!mm) return NaN;
      const k = (mm[1] ? -1 : 1) * (mm[2] ? numv(mm[2]) : 1);
      return k * (mm[3] === 'x' ? p[0] : p[1]) + (mm[4] ? Number(mm[4]) : 0);
    };
    const f = p => [term(r[1], p), term(r[2], p)];
    const probe = [[0, 0], [1, 0], [0, 1], [3, -2], [-1, 4]];
    const rigid = probe.every((a, i) => probe.every((b, j) => j <= i || close(dist(a, b), dist(f(a), f(b)))));
    return q.choices.map(c => {
      let mm;
      if ((mm = c.match(/^Yes: it is (.+?), and that keeps every length$/))) {
        if (!rigid) return false;
        const t = mm[1].replace(/^a /, '').replace(/^(\d+)° turn (clockwise |counterclockwise )?about/, 'turn $1° $2about');
        // "a 90° turn about the origin" without a direction: true when either turn is the rule
        const cands = /^turn \d+° about/.test(t) && !/^turn 180°/.test(t) ? [t.replace(/^turn (\d+)°/, 'turn $1° clockwise'), t.replace(/^turn (\d+)°/, 'turn $1° counterclockwise')] : [t];
        const mvs = cands.map(x => parseMove(x)).filter(Boolean);
        if (mvs.length) return mvs.some(mv => probe.every(p => samePt(mv.f(p), f(p))));
        if (/^a slide$/.test(mm[1])) { const v = f([0, 0]); return probe.every(p => samePt(f(p), [p[0] + v[0], p[1] + v[1]])); }
        return false;
      }
      if ((mm = c.match(new RegExp(`^No: the side from \\(${N}, ${N}\\) to \\(${N}, ${N}\\) is ${N} long before and ${N} long after$`)))) {
        const a = [numv(mm[1]), numv(mm[2])], b = [numv(mm[3]), numv(mm[4])];
        return !rigid && close(dist(a, b), numv(mm[5])) && close(dist(f(a), f(b)), numv(mm[6])) && !close(numv(mm[5]), numv(mm[6]));
      }
      return false; // one side as proof, sign changes, "every point moves", angles kept, "a dilation by 2"
    });
  },
  justify(q) {
    const p = q.prompt;
    let m;
    if (/^A stencil S must fit an outline O exactly/.test(p)) {
      const S = figOf(q, 'first').pts, O = figOf(q, 'pick').pts;
      return q.choices.map(c => {
        const mm = c.match(/^Congruent: (.+) puts every corner on the outline$/);
        if (mm) { const ms = parseSeq(mm[1]); return !!ms && landsOn(ms, S, O); }
        return false; // looks, facing the other way, a failed quarter turn
      });
    }
    if ((m = p.match(new RegExp(`is dilated by a scale factor of ${N}, then (turned .+?)\\. Is the new .+ congruent to the old one\\?`)))) {
      const k = numv(m[1]);
      return q.choices.map(c => (/^Congruent: a dilation by 1 changes nothing, and a turn keeps every length$/.test(c) ? close(k, 1) : false));
    }
    if ((m = p.match(/: P is (\d+) by (\d+) inches, Q is (\d+) by (\d+) inches\./))) {
      const P = [+m[1], +m[2]], Qd = [+m[3], +m[4]];
      const cong = [...P].sort().join() === [...Qd].sort().join();
      return q.choices.map(c => { const mm = c.match(/^Not congruent: P has a (\d+)-inch side and Q has none, and moves never change a length$/); return !!mm && !cong && P.includes(+mm[1]) && !Qd.includes(+mm[1]); });
    }
    if ((m = p.match(new RegExp(`is enlarged by a scale factor of ${N}, then flipped over the (x|y)-axis\\. Is the new .+ congruent to A\\?`)))) {
      const k = numv(m[1]);
      return q.choices.map(c => {
        const mm = c.match(new RegExp(`^Not congruent: every length was multiplied by ${N}, and a flip can’t change it back$`));
        return !!mm && !close(k, 1) && close(numv(mm[1]), k);
      });
    }
    return null;
  },
};
function reflect(p, a, b) {
  const dx = b[0] - a[0], dy = b[1] - a[1], L = dx * dx + dy * dy;
  const t = ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / L;
  const f = [a[0] + t * dx, a[1] + t * dy];
  return [2 * f[0] - p[0], 2 * f[1] - p[1]];
}

// ---------------------------------------------------------------- what the picture must agree with
function worldProblems(q) {
  const probs = [];
  const p = q.prompt;
  const P = figOf(q, 'first');
  // a stated orientation must be the drawn one
  let m;
  if (q.family === 'orient' && (m = p.match(/^A → B → C(?: → D)? goes (clockwise|counterclockwise)\./))) {
    const n = (p.match(/→ D/) ? 4 : 3);
    const o = orient(P.pts.slice(0, n));
    if ((m[1] === 'counterclockwise') !== (o === 'ccw')) probs.push(`the prompt says ${m[1]}, the drawing goes ${o}`);
    const I = figOf(q, 'pick');
    if (I) {
      const kind = /A flip maps/.test(p) ? 'flip' : /A turn maps/.test(p) ? 'turn' : /A slide maps/.test(p) ? 'slide' : null;
      const ms = matches(P.pts, I.pts).filter(x => x.sig.every((k, i) => k === i));
      if (!ms.length) probs.push('the image is not a copy of the figure');
      else if (kind === 'flip' && !ms[0].mirror) probs.push('the "flip" image is not a mirror image');
      else if (kind !== 'flip' && ms[0].mirror) probs.push(`the "${kind}" image is a mirror image`);
    }
  }
  // stated lengths must be the drawn ones
  if ((m = p.match(/wrote △ABC ≅ △DEF\. Then .+ saw that AB = (\d+) but DE = (\d+)\./))) {
    const A = named(P), B = named(figOf(q, 'pick'));
    if (!close(dist(A.A, A.B), +m[1]) || !close(dist(B.D, B.E), +m[2])) probs.push('AB or DE in the prompt is not the drawn length');
  }
  if ((m = p.match(/^AB is ([\d.]+) units? long\./))) {
    const A = named(P); if (!close(dist(A.A, A.B), +m[1])) probs.push(`AB is drawn ${dist(A.A, A.B)} long, the prompt says ${m[1]}`);
  }
  if ((m = p.match(/^Rectangle P is (\d+) by (\d+)\. Rectangle Q is (\d+) by (\d+)\. They have the same (area|perimeter), (\d+)/))) {
    const a = m[5] === 'area' ? [+m[1] * +m[2], +m[3] * +m[4]] : [2 * (+m[1] + +m[2]), 2 * (+m[3] + +m[4])];
    if (a[0] !== a[1] || a[0] !== +m[6]) probs.push(`the ${m[5]}s are ${a.join(' and ')}, the prompt says both ${m[6]}`);
  }
  // a sequence the prompt calls "these moves map … onto" must exist in the picture's world
  if (q.family === 'justify' && /is enlarged by a scale factor of/.test(p)) {
    const mm = p.match(/then flipped over the (x|y)-axis/), ms = boardSeq(q);
    const B = figOf(q, 'pick');
    if (ms && mm && B) { const fl = parseMove(`flip over the ${mm[1]}-axis`); if (!landsOn([...ms, fl], P.pts, B.pts)) probs.push('B is not A enlarged and flipped'); }
  }
  if (q.family === 'sequence' || q.family === 'undo') {
    // the drawn figure: for "undo" the start (pick) carried by the moves lands on the first figure
    if (q.family === 'undo') {
      const ms = parseSeq(p.match(/^(.+?): these moves/)[1]);
      const S = figOf(q, 'pick');
      if (ms && S && !S.pts.every((pt, i) => samePt(run(ms, pt), P.pts[i]))) probs.push('the drawn △A″B″C″ is not where the moves take △ABC');
    }
  }
  if (/slide nowhere/.test((q.choices ?? []).join('|'))) probs.push('a choice says "slide nowhere" (no slide: the flip alone fits)');
  return probs;
}

// ---------------------------------------------------------------- contract
const pick = arr => {
  if (!Array.isArray(arr)) return undefined;
  const hits = arr.map((ok, i) => (ok ? i : -1)).filter(i => i >= 0);
  return hits.length >= 1 ? hits[0] : -1;
};
const tidy = v => Number(Number(v).toFixed(9));
function runF(q) { const f = F[q.family]; return f ? f(q) : undefined; }

export default {
  solve(q) {
    let r;
    try { r = runF(q); } catch { return undefined; }
    if (r == null) return undefined;
    if (q.input === 'choice') return pick(r);
    if (q.input === 'pair') return Array.isArray(r) ? r.map(tidy) : undefined;
    return tidy(r);
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
    try { probs.push(...worldProblems(q)); } catch (e) { probs.push(`could not check the picture (${e.message})`); }
    return probs.join('; ');
  },
};
