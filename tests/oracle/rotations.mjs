// Oracle for the lesson "rotations" (quarter and half turns, 8.G.A.1), role O (docs/lessons/QUALITY_LAYER.md).
// Worked out from what the student sees: the prompt, the spinner pictures (pointer bearing, turn arrow, sections) and
// the dot-paper pictures (pin, figure, after picture, candidate pictures, dots, mirror lines, dashed outlines).
// Every turn is done here with exact integer maths: a quarter turn counterclockwise about c sends c + (dx, dy) to
// c + (−dy, dx). Picture conventions (read from the drawing code, TurnBoard.ts): dot paper is y up; a spinner's `deg`
// is the pointer's bearing (degrees clockwise from up) and its `turn` arrow runs counterclockwise for turn > 0; a
// grid arrow `q` and a watched turn `q` count quarter turns, counterclockwise for q > 0.

const EPS = 1e-9;
const eq = (a, b) => Math.abs(a - b) < 1e-6;
const peq = (p, q) => eq(p[0], q[0]) && eq(p[1], q[1]);
const key = p => `${Math.round(p[0] * 1000)},${Math.round(p[1] * 1000)}`;

// ---------------------------------------------------------------- motions
/** turn p about c by q quarter turns (q > 0 counterclockwise) */
function rot(p, c, q) {
  let dx = p[0] - c[0], dy = p[1] - c[1];
  const n = ((q % 4) + 4) % 4;
  for (let i = 0; i < n; i++) [dx, dy] = [-dy, dx];
  return [c[0] + dx, c[1] + dy];
}
/** reflect p in a dot-paper line { kind: 'v', x } | { kind: 'h', y } | { kind: 'd', p, s } (slope s = ±1) */
function refl(p, L) {
  if (L.kind === 'v') return [2 * L.x - p[0], p[1]];
  if (L.kind === 'h') return [p[0], 2 * L.y - p[1]];
  const [x0, y0] = L.p, dx = p[0] - x0, dy = p[1] - y0;
  return L.s === 1 ? [x0 + dy, y0 + dx] : [x0 - dy, y0 - dx];
}
/** undirected edge set of a closed outline, as a string (same outline drawn = same set) */
function edges(pts) {
  const out = [];
  for (let i = 0; i < pts.length; i++) {
    const a = key(pts[i]), b = key(pts[(i + 1) % pts.length]);
    out.push(a < b ? `${a}|${b}` : `${b}|${a}`);
  }
  return out.sort().join(' ');
}
const sameOutline = (P, Q) => P.length === Q.length && edges(P) === edges(Q);
/** a figure {pts, marks} after a motion f, compared with another: same outline and every letter on the same dot */
function sameFig(f, A, B) {
  const P = A.pts.map(f);
  if (!sameOutline(P, B.pts)) return false;
  for (const m of A.marks ?? []) {
    const t = (B.marks ?? []).find(x => x.label === m.label);
    if (t && !peq(f(m.p), t.p)) return false;
  }
  return true;
}
/** the motion that takes figure A onto B, if it is a turn about c (q = 1, −1 / 3, 2) */
function turnsAbout(A, B, c) { return [1, 2, 3].filter(q => sameFig(p => rot(p, c, q), A, B)); }
/** is B a slide of A (every corner moved by the same steps, not zero)? */
function isSlide(A, B) {
  if (A.length !== B.length) return false;
  const d = [B[0][0] - A[0][0], B[0][1] - A[0][1]];
  return (Math.abs(d[0]) > EPS || Math.abs(d[1]) > EPS) && A.every((p, i) => peq([p[0] + d[0], p[1] + d[1]], B[i]));
}
/** signed area (counterclockwise > 0) of the corners in order */
function area(pts) {
  let s = 0;
  for (let i = 0; i < pts.length; i++) { const a = pts[i], b = pts[(i + 1) % pts.length]; s += a[0] * b[1] - b[0] * a[1]; }
  return s / 2;
}
/** the edge vectors of a polygon in order */
const edgeVecs = P => P.map((p, i) => { const q = P[(i + 1) % P.length]; return [q[0] - p[0], q[1] - p[1]]; });
/** is B (corner by corner) a turn of A by some quarter turns about some point? returns q or 0 */
function isTurnOf(A, B) {
  if (A.length !== B.length) return 0;
  const ea = edgeVecs(A), eb = edgeVecs(B);
  for (const q of [1, 2, 3]) if (ea.every((v, i) => peq(rot(v, [0, 0], q), eb[i]))) return q;
  return 0;
}
/** is B (corner by corner) a mirror image of A in a horizontal / vertical / 45° line? */
function isFlipOf(A, B) {
  if (A.length !== B.length) return false;
  const ea = edgeVecs(A), eb = edgeVecs(B);
  const maps = [v => [-v[0], v[1]], v => [v[0], -v[1]], v => [v[1], v[0]], v => [-v[1], -v[0]]];
  return maps.some(f => ea.every((v, i) => peq(f(v), eb[i])));
}

// ---------------------------------------------------------------- reading the prompt
const WORDS = { up: 0, 'up-right': 45, right: 90, 'down-right': 135, down: 180, 'down-left': 225, left: 270, 'up-left': 315 };
const nameOf = deg => Object.keys(WORDS).find(k => WORDS[k] === (((deg % 360) + 360) % 360));
/** "a quarter turn clockwise" → −1, "a half turn ..." → 2, "a quarter turn counterclockwise" → 1 (quarter turns, ccw > 0) */
function turnOf(text) {
  const t = String(text);
  if (/half turn/.test(t)) return 2;
  if (/quarter turn counterclockwise/.test(t)) return 1;
  if (/quarter turn clockwise/.test(t)) return -1;
  return null;
}
const choice = (q, pred) => {
  const hits = (q.choices ?? []).map((c, i) => (pred(c, i) ? i : -1)).filter(i => i >= 0);
  return hits.length === 1 ? hits[0] : -1;
};
const amountName = deg => {
  const a = Math.abs(deg);
  if (a < 90 - EPS) return /Less than a quarter/;
  if (eq(a, 90)) return /^A quarter turn$/;
  if (eq(a, 180)) return /^A half turn$/;
  if (eq(a, 360)) return /^A full turn$/;
  return null;
};
/** the dot (or candidate) whose label is "k" for a choice "Dot k" / "Picture k" */
const byLabel = (q, word, label) => choice(q, c => c === `${word} ${label}`);

// ---------------------------------------------------------------- the families
function solveSpin(q) {
  const p = q.prompt, S = q.data.picture.spinners;
  switch (q.family) {
    case 'watch': {
      if (/look exactly the same/.test(p)) return choice(q, c => /can.t tell/.test(c));
      if (/ends pointing the same way it started/.test(p)) {
        // the student watched it go round: a full turn when the arrow is 360°, else it did not move
        const t = Math.abs(S[0].turn ?? 0);
        if (eq(t, 360)) return choice(q, c => /one full turn/.test(c));
        if (eq(t, 0)) return choice(q, c => /did not move/.test(c));
        return -1;
      }
      const re = amountName(S[0].turn ?? 0);
      return re ? choice(q, c => re.test(c)) : -1;
    }
    case 'amount': {
      if (/How many quarter turns in the same direction make a half turn/.test(p)) return 2;
      if (/Is that a quarter turn\?/.test(p)) {
        const s = S[0];
        const cuts = (s.cuts ?? []).slice().sort((a, b) => a - b);
        const gaps = cuts.map((c, i) => (((cuts[(i + 1) % cuts.length] - c) % 360) + 360) % 360 || 360);
        const equal = gaps.every(g => eq(g, 360 / cuts.length));
        if (eq(Math.abs(s.turn), 90) && cuts.length === 4) return -1;   // would be a quarter turn after all: no honest Yes
        return choice(q, c => /^No:/.test(c) && (!/not equal/.test(c) || !equal));
      }
      const re = amountName(S[0].turn ?? 0);
      return re ? choice(q, c => re.test(c)) : -1;
    }
    case 'armLength': {
      const A = S.find(s => s.label === 'A'), B = S.find(s => s.label === 'B');
      const a = Math.abs(A.turn), b = Math.abs(B.turn);
      if (eq(a, b)) return choice(q, c => /the same amount/.test(c));
      return choice(q, c => c === `Pointer ${a > b ? 'A' : 'B'} turned more`);
    }
    case 'direction': {
      if (/Which arrow shows/.test(p)) {
        const want = /quarter turn counterclockwise/.test(p) ? 90 : /quarter turn clockwise/.test(p) ? -90 : /half turn/.test(p) ? 180 : null;
        if (want === null) return -1;
        const fits = S.filter(s => (want === 180 ? eq(Math.abs(s.turn), 180) : eq(s.turn, want))).map(s => s.label);
        if (fits.length === S.length && S.length > 1) return choice(q, c => /^Both arrows$/.test(c));
        if (fits.length !== 1) return -1;
        return choice(q, c => c === `Arrow ${fits[0]}`);
      }
      const t = S[0].turn;
      if (eq(Math.abs(t), 180)) return choice(q, c => /^A half turn$/.test(c));
      if (eq(t, 90)) return choice(q, c => /^A quarter turn counterclockwise$/.test(c));
      if (eq(t, -90)) return choice(q, c => /^A quarter turn clockwise$/.test(c));
      return -1;
    }
    case 'pointer': {
      const m = p.match(/points ([a-z-]+)\. Turn it (.+?)\. Where/);
      if (!m) return -1;
      const start = WORDS[m[1]];
      let deg;   // bearing change, clockwise > 0
      if (/a quarter turn clockwise, then another quarter turn the same way/.test(m[2])) deg = 180;
      else if (/a quarter turn counterclockwise, then another quarter turn the same way/.test(m[2])) deg = -180;
      else if (/half turn/.test(m[2])) deg = 180;
      else if (/quarter turn counterclockwise/.test(m[2])) deg = -90;
      else if (/quarter turn clockwise/.test(m[2])) deg = 90;
      else return -1;
      const end = nameOf(start + deg);
      return choice(q, c => c.replace(/^\S+\s/, '') === end);
    }
    case 'describe':
      if (/Can the two pictures tell which/.test(p)) return choice(q, c => /^No: the pictures look the same either way/.test(c));
      return -1;
    default: return -1;
  }
}

function solveGrid(q) {
  const p = q.prompt, G = q.data.picture;
  const pin = G.pin;
  const fig = G.start;
  switch (q.family) {
    case 'center': {
      // the watched turn: the point that maps to itself
      const still = (G.points ?? []).filter(x => peq(rot(x.p, G.watch.c, G.watch.q), x.p));
      if (still.length !== 1) return -1;
      return choice(q, c => c === `Point ${still[0].label}`);
    }
    case 'describe': {
      if (/Describe the turn completely/.test(p)) {
        const dirArrow = Math.sign(G.arrows?.[0]?.q ?? 0);
        const centers = { P: pin, ...Object.fromEntries((G.points ?? []).map(x => [x.label, x.p])) };
        return choice(q, c => {
          const m = c.match(/^a (quarter|half) turn (clockwise|counterclockwise) about ([A-Z])$/);
          if (!m) return false;
          const qq = m[1] === 'half' ? 2 : m[2] === 'counterclockwise' ? 1 : -1;
          const sign = m[2] === 'counterclockwise' ? 1 : -1;
          if (!centers[m[3]] || sign !== dirArrow) return false;
          return sameFig(x => rot(x, centers[m[3]], qq), fig, G.after);
        });
      }
      // which allowed turn about P (quarter cw / ccw, half) took start to after?
      const ok = { cw: sameFig(x => rot(x, pin, -1), fig, G.after), ccw: sameFig(x => rot(x, pin, 1), fig, G.after), half: sameFig(x => rot(x, pin, 2), fig, G.after) };
      return choice(q, c => {
        if (/^none of the allowed turns$/.test(c)) return !ok.cw && !ok.ccw && !ok.half;
        if (/^a quarter turn clockwise about P$/.test(c)) return ok.cw;
        if (/^a quarter turn counterclockwise about P$/.test(c)) return ok.ccw;
        if (/^a half turn about P(, clockwise or counterclockwise)?$/.test(c)) return ok.half;
        return false;   // "only a half turn clockwise": a half turn either way lands in the same place
      });
    }
    case 'figure': case 'build': {
      const qq = turnOf(p);
      if (qq === null) return -1;
      const hits = (G.cands ?? []).filter(cd => sameFig(x => rot(x, pin, qq), fig, cd.fig));
      return hits.length === 1 ? byLabel(q, 'Picture', hits[0].label) : -1;
    }
    case 'distance': {
      if (q.input === 'num') {
        const m = p.match(/Corner A is (\d+) steps from the pin P/);
        return m ? Number(m[1]) : undefined;
      }
      const qq = turnOf(p), A = G.segs?.[0];
      if (qq === null || !A) return -1;
      const to = rot(A, pin, qq);
      const d = (G.dots ?? []).filter(x => peq(x.p, to));
      return d.length === 1 ? byLabel(q, 'Dot', d[0].label) : -1;
    }
    case 'steps': {
      if (q.input === 'pair') {
        const d = [G.point.p[0] - pin[0], G.point.p[1] - pin[1]];
        return [Math.abs(d[0]), Math.abs(d[1])];
      }
      const v = stepsFrom(p.match(/Go (.+?)\. Which dot/)?.[1] ?? '');
      if (!v) return -1;
      const to = [pin[0] + v[0], pin[1] + v[1]];
      const d = (G.dots ?? []).filter(x => peq(x.p, to));
      return d.length === 1 ? byLabel(q, 'Dot', d[0].label) : -1;
    }
    case 'pointTurn': {
      const v = stepsFrom(p.match(/^A is (.+?) from the pin P/)?.[1] ?? '');
      const qq = turnOf(p);
      if (!v || qq === null) return -1;
      const to = rot([pin[0] + v[0], pin[1] + v[1]], pin, qq);
      const d = (G.dots ?? []).filter(x => peq(x.p, to));
      return d.length === 1 ? byLabel(q, 'Dot', d[0].label) : -1;
    }
    case 'square':
      return choice(q, c => /^Still a (square|rectangle): same card, same sides, same square corners$/.test(c));
    case 'slip': {
      const qq = turnOf(p);
      if (qq === null) return -1;
      const A = G.after;
      const right = sameFig(x => rot(x, pin, qq), fig, A);
      const wrongWay = qq !== 2 && sameFig(x => rot(x, pin, -qq), fig, A);
      const lens = P => edgeVecs(P).map(v => Math.hypot(v[0], v[1]));
      const la = lens(fig.pts), lb = lens(A.pts);
      const lengthChanged = la.length !== lb.length || la.some((l, i) => !eq(l, lb[i]));
      // turned the right amount the right way, about some other point
      const otherPoint = !right && !lengthChanged && isTurnOf(fig.pts, A.pts) === (((qq % 4) + 4) % 4);
      return choice(q, c => {
        if (/^Nothing:/.test(c)) return right;
        if (/turned the wrong way/.test(c)) return wrongWay;
        if (/A side changed length/.test(c)) return lengthChanged;
        if (/turned about the wrong point/.test(c)) return otherPoint;
        return false;
      });
    }
    case 'motion': {
      const A = fig.pts, B = G.after.pts;
      if (/Is that a flip across m\?/.test(p)) {
        const L = G.lines?.[0]?.line;
        const flip = L && sameOutline(A.map(x => refl(x, L)), B) && (G.after.marks ?? []).every(m => { const s = fig.marks.find(x => x.label === m.label); return !s || peq(refl(s.p, L), m.p); });
        return choice(q, c => {
          if (/^Yes: it is a mirror image across m$/.test(c)) return flip;
          if (/^No: it only slid across, it is not a mirror image$/.test(c)) return !flip && isSlide(A, B);
          if (/^No: it faces a new way, so it is a turn$/.test(c)) return !flip && isTurnOf(A, B) > 0;
          if (/^No: it just moved to the other side, so it is a slide$/.test(c)) return !flip && isSlide(A, B);
          return false;   // "Yes: it is on the other side" / "Yes: it faces a new way": not what makes a flip
        });
      }
      const kind = isSlide(A, B) ? 'slide' : isTurnOf(A, B) ? 'turn' : isFlipOf(A, B) ? 'flip' : null;
      if (!kind) return -1;
      return choice(q, c => new RegExp(`^A ${kind}:`).test(c));
    }
    case 'order': {
      const ord = f => { const by = l => f.marks.find(m => m.label === l).p; return Math.sign(area([by('A'), by('B'), by('C')])); };
      const same = ord(fig) === ord(G.after);
      return choice(q, c => (same ? /^A turn: A → B → C goes the same way round$/ : /^A flip: A → B → C goes the other way round$/).test(c));
    }
    case 'opposite': {
      const qq = turnOf(p);
      if (qq === null) return -1;
      const a = fig.pts.map(x => rot(x, pin, Math.abs(qq))), b = fig.pts.map(x => rot(x, pin, -Math.abs(qq)));
      const same = sameOutline(a, b);
      if (same) return choice(q, c => /^Yes: half way round either way ends in the same place$/.test(c));
      return choice(q, c => /^No: a quarter turn each way lands in different places$/.test(c));
    }
    case 'symmetric': {
      const m = p.match(/could do it: (.+)\?$/);
      if (!m) return -1;
      const listed = m[1].split(/, (?:or )?/).map(s => s.replace(/^or /, '').trim());
      const C = (G.points ?? []).find(x => x.label === 'C')?.p;
      const line = n => G.lines?.find(l => l.label === n)?.line;
      const works = name => {
        let f;
        let mm;
        if (/^the half turn about C$/.test(name)) f = x => rot(x, C, 2);
        else if (/^the quarter turn clockwise about C$/.test(name)) f = x => rot(x, C, -1);
        else if (/^the quarter turn counterclockwise about C$/.test(name)) f = x => rot(x, C, 1);
        else if ((mm = name.match(/^the flip across ([a-z])$/))) { const L = line(mm[1]); if (!L) return null; f = x => refl(x, L); }
        else if ((mm = name.match(/^the slide (\d+) steps? right$/))) { const k = Number(mm[1]); f = x => [x[0] + k, x[1]]; }
        else return null;
        return sameOutline(fig.pts.map(f), G.target);
      };
      const res = listed.map(works);
      if (res.some(r => r === null)) return -1;
      const good = listed.filter((_, i) => res[i]);
      const canon = s => s.slice().sort().join('|');
      return choice(q, c => {
        let set;
        if (/^All four moves$/.test(c)) set = listed;
        else if (/^None of them$/.test(c)) set = [];
        else if (/^Only /.test(c)) set = [c.replace(/^Only /, '')];
        else set = c.replace(/^The /, 'the ').split(/, | and /).map(s => s.trim());
        return canon(set) === canon(good);
      });
    }
    case 'target': {
      const T = G.target;
      const pinL = p.match(/pinned at its corner ([A-Z])/)?.[1];
      const corner = l => fig.marks.find(m => m.label === l)?.p;
      return choice(q, c => {
        let m;
        if ((m = c.match(/^A (quarter|half) turn ?(clockwise|counterclockwise)? about ([A-Z])(?:: (every corner|corner [A-Z]) lands on the outline)?$/))) {
          const qq = m[1] === 'half' ? 2 : m[2] === 'counterclockwise' ? 1 : -1;
          const cp = corner(m[3]);
          if (!cp) return false;
          const ok = sameOutline(fig.pts.map(x => rot(x, cp, qq)), T);
          if (m[4] && m[4] !== 'every corner') return false;   // "corner A lands": one corner checked is no reason
          return ok;
        }
        if ((m = c.match(/^A flip across a line through ([A-Z])$/))) {
          const cp = corner(m[1]);
          const Ls = [{ kind: 'v', x: cp[0] }, { kind: 'h', y: cp[1] }, { kind: 'd', p: cp, s: 1 }, { kind: 'd', p: cp, s: -1 }];
          return Ls.some(L => sameOutline(fig.pts.map(x => refl(x, L)), T));
        }
        if (/^A slide$/.test(c)) {
          const d = [T[0][0] - fig.pts[0][0], T[0][1] - fig.pts[0][1]];
          return isSlide(fig.pts, fig.pts.map(x => [x[0] + d[0], x[1] + d[1]])) && sameOutline(fig.pts.map(x => [x[0] + d[0], x[1] + d[1]]), T);
        }
        return false;
      });
    }
    default: return -1;
  }
}

/** "3 left, 2 up" / "3 right" / "1 left, 2 down" → step vector */
function stepsFrom(t) {
  const v = [0, 0];
  const parts = [...String(t).matchAll(/(\d+) (left|right|up|down)/g)];
  if (!parts.length) return null;
  for (const [, n, d] of parts) {
    const k = Number(n);
    if (d === 'left') v[0] -= k; else if (d === 'right') v[0] += k; else if (d === 'up') v[1] += k; else v[1] -= k;
  }
  return v;
}

function solve(q) {
  const P = q.data?.picture;
  if (!P) return undefined;
  if (P.kind === 'spin') return solveSpin(q);
  if (P.kind === 'grid') return solveGrid(q);
  if (P.kind === 'tilt') return solveGrid(q);
  return undefined;
}

function sane(q) {
  const out = [];
  const P = q.data?.picture ?? {};
  const p = q.prompt;
  // the words of the prompt and the picture tell the same story
  if (P.kind === 'spin' && q.family === 'pointer') {
    const m = p.match(/points ([a-z-]+)\./);
    if (m && P.spinners?.[0] && WORDS[m[1]] !== (((P.spinners[0].deg % 360) + 360) % 360)) out.push('the prompt names another start direction than the picture');
  }
  if (P.kind === 'spin' && /starts? pointing ([a-z-]+)/.test(p)) {
    const w = p.match(/starts? pointing ([a-z-]+)/)[1];
    if (P.spinners.some(s => WORDS[w] !== (((s.deg % 360) + 360) % 360))) out.push('the prompt names another start direction than the picture');
  }
  if (P.kind === 'grid' && P.arrows?.length === 1 && P.pin && /turn/.test(p) && q.family !== 'describe') {
    const qq = turnOf(p);
    const aq = P.arrows[0].q;
    if (qq !== null && !(qq === 2 ? Math.abs(aq) === 2 : aq === qq)) out.push('the turn arrow and the prompt disagree');
  }
  if (P.kind === 'grid' && (q.family === 'pointTurn')) {
    const v = stepsFrom(p.match(/^A is (.+?) from the pin P/)?.[1] ?? '');
    if (v && P.point && !peq([P.pin[0] + v[0], P.pin[1] + v[1]], P.point.p)) out.push('the steps in the prompt do not reach the drawn point A');
  }
  if (P.kind === 'grid' && q.family === 'distance' && q.input === 'num') {
    const m = p.match(/Corner A is (\d+) steps from the pin P/);
    const A = P.segs?.[0];
    if (m && A && !eq(Math.hypot(A[0] - P.pin[0], A[1] - P.pin[1]), Number(m[1]))) out.push('A is not as far from P as the prompt says');
  }
  if (P.kind === 'grid' && q.family === 'steps' && q.input === 'pair') {
    const m = p.match(/How many steps (left|right), then how many steps (up|down)/);
    const d = [P.point.p[0] - P.pin[0], P.point.p[1] - P.pin[1]];
    if (m && ((m[1] === 'left') !== (d[0] < 0) || (m[2] === 'down') !== (d[1] < 0))) out.push('the asked directions do not match where A is');
  }
  if (q.input === 'choice') {
    let s;
    try { s = solve(q); } catch { s = undefined; }
    if (s === -1) out.push('no single right choice');
  }
  return [...new Set(out)].join('; ');
}

export default { solve, sane };
