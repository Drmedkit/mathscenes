// enlarge-on-grids oracle (role O, docs/lessons/QUALITY_LAYER.md). Every practice item worked out from what the
// student sees: the prompt, the board, the choices and the grid picture (figure vertices in grid squares, y up).
// A copy is a scaled copy when, walking both figures from matching corners, every move of the copy is k times the
// original's move (one k across and up); that is tested on the drawn vertices, never on a figure's `of` tag or a
// label's hidden `alt` value. Choices are judged by testing their claims against those numbers.
import { Q, choiceWhere } from '../../tools/quality/oracle-kit.mjs';

// ---------------------------------------------------------------- reading
const N = s => Q(String(s).trim());
const clean = t => String(t ?? '').replace(/&ensp;|&emsp;/g, ' ').replace(/\s+/g, ' ').trim();
/** the scale factor a prompt names: "2 times as big", "scale factor 1/2", "factor 3", "same-size", "× 3" */
function factorOf(p) {
  let m;
  if (/same-size copy/.test(p)) return Q(1);
  if ((m = p.match(/(\d+(?:\/\d+)?) times as big/))) return N(m[1]);
  if ((m = p.match(/scale factor (\d+(?:\/\d+)?)/))) return N(m[1]);
  if ((m = p.match(/with factor (\d+(?:\/\d+)?)/))) return N(m[1]);
  if ((m = p.match(/true × (\d+(?:\/\d+)?) copy/))) return N(m[1]);
  return null;
}
const DIRS = { left: [-1, 0], right: [1, 0], up: [0, 1], down: [0, -1], '←': [-1, 0], '→': [1, 0], '↑': [0, 1], '↓': [0, -1] };

// ---------------------------------------------------------------- the picture
const figsOf = q => q.data?.pict?.pic?.figs ?? [];
const closed = q => figsOf(q).filter(f => !f.open && Array.isArray(f.pts) && f.pts.length >= 3);
const pickSeg = q => figsOf(q).find(f => f.role === 'pick' && f.open && f.pts?.length === 2);
function edges(pts) { return pts.map((p, i) => { const r = pts[(i + 1) % pts.length]; return [r[0] - p[0], r[1] - p[1]]; }); }
function bbox(pts) { const xs = pts.map(p => p[0]), ys = pts.map(p => p[1]); return { w: Math.max(...xs) - Math.min(...xs), h: Math.max(...ys) - Math.min(...ys) }; }
const near = (a, b) => Math.abs(a - b) < 1e-9;
/** the factor k and vertex shift s with copy edge (i+s) = k × original edge i, for every i; null when there is none */
function scaled(A, B) {
  if (!A || !B || A.length !== B.length) return null;
  const ea = edges(A), eb = edges(B), n = A.length, out = [];
  for (let s = 0; s < n; s++) {
    let k = null, ok = true;
    for (let i = 0; i < n && ok; i++) {
      const a = ea[i], b = eb[(i + s) % n];
      for (let c = 0; c < 2 && ok; c++) {
        if (a[c] === 0) { if (b[c] !== 0) ok = false; continue; }
        const r = b[c] / a[c];
        if (k === null) k = r; else if (!near(k, r)) ok = false;
      }
    }
    if (ok && k !== null && k > 0) out.push({ k, s });
  }
  return out.length ? out[0] : null;
}
/** interior angle (degrees) at every vertex */
function angles(P) {
  return P.map((p, i) => {
    const a = P[(i - 1 + P.length) % P.length], b = P[(i + 1) % P.length];
    const u = [a[0] - p[0], a[1] - p[1]], v = [b[0] - p[0], b[1] - p[1]];
    const c = (u[0] * v[0] + u[1] * v[1]) / Math.hypot(...u) / Math.hypot(...v);
    return Math.acos(Math.max(-1, Math.min(1, c))) * 180 / Math.PI;
  });
}
const sameAngles = (A, B) => A.length === B.length && angles(A).every((x, i) => Math.abs(x - angles(B)[i]) < 1e-6);
const segLen = s => Math.hypot(s.pts[1][0] - s.pts[0][0], s.pts[1][1] - s.pts[0][1]);

/** "W by H" of a named figure in the prompt */
function wh(p, re = /(?:[Tt]he|a) (\d+(?:\/\d+)?) by (\d+(?:\/\d+)?) (?:rectangle|square|house|L-shape|photo|drawing)/) {
  const m = p.match(re); return m ? [N(m[1]), N(m[2])] : null;
}
/** a typed answer: an integer when whole, else the exact value */
const num = v => Q(v).value;

// ---------------------------------------------------------------- families
function whichScaled(q) {
  const big = /just bigger/.test(q.prompt), small = /just smaller/.test(q.prompt);
  const F = closed(q), O = F.find(f => f.role === 'first');
  if (!O) return undefined;
  return choiceWhere(q, c => {
    const m = c.match(/^Copy ([A-Z])$/); if (!m) return false;
    const f = F.find(g => g.caption === m[1]); if (!f) return false;
    const r = scaled(O.pts, f.pts);
    return !!r && (big ? r.k > 1 + 1e-9 : small ? r.k < 1 - 1e-9 : true);
  });
}

function photoFit(q) {
  const m = q.prompt.match(/A (\d+) by (\d+) photo is printed twice, (bigger|smaller): print A is (\d+) by (\d+), print B is (\d+) by (\d+)\./);
  if (!m) return undefined;
  const [W, H, a1, a2, b1, b2] = [m[1], m[2], m[4], m[5], m[6], m[7]].map(Number);
  const okA = a1 * H === a2 * W, okB = b1 * H === b2 * W;
  return choiceWhere(q, c => {
    if (/^Print A$/.test(c)) return okA;
    if (/^Print B$/.test(c)) return okB;
    if (/^Both/.test(c)) return okA && okB;
    return false;
  });
}

function matchPart(q) {
  const F = closed(q), O = F.find(f => f.role === 'first' && f.letters), C = F.find(f => f.role === 'second' && f.letters);
  if (!O || !C) return undefined;
  const r = scaled(O.pts, C.pts); if (!r) return -1;
  const n = O.pts.length, map = L => { const i = O.letters.indexOf(L); return i < 0 ? null : C.letters[(i + r.s) % n]; };
  let m;
  if ((m = q.prompt.match(/matches side ([A-Z])([A-Z])\?/))) {
    const a = map(m[1]), b = map(m[2]); if (!a || !b) return undefined;
    return choiceWhere(q, ch => ch.length === 2 && new Set([ch[0], ch[1]]).size === 2 && [a, b].every(x => ch.includes(x)));
  }
  if ((m = q.prompt.match(/matches corner ([A-Z])\?/))) { const a = map(m[1]); return choiceWhere(q, ch => ch.trim() === a); }
  return undefined;
}

function timesAsLong(q) {
  const m = q.prompt.match(/The original \w+ is (\d+) squares? long, the copy's matching \w+ is (\d+)\./);
  return m ? num(N(m[2]).div(N(m[1]))) : undefined;
}

function countLen(q) {
  const s = pickSeg(q); return s ? segLen(s) : undefined;   // the lavender side, counted on the grid
}

function missingDim(q) {
  const p = q.prompt; let m;
  if ((m = p.match(/copy of the (\d+) by (\d+) rectangle is (\d+) wide(?:[,:][^.]*)?\. How tall is it\?/))) return num(N(m[2]).mul(N(m[3])).div(N(m[1])));
  if ((m = p.match(/copy of the (\d+) by (\d+) rectangle is (\d+) tall(?:[,:][^.]*)?\. How wide is it\?/))) return num(N(m[1]).mul(N(m[3])).div(N(m[2])));
  return undefined;
}

function oneFactor(q) {
  const d = wh(q.prompt), k = factorOf(q.prompt); if (!d || !k) return undefined;
  const [W, H] = d, cw = W.mul(k), ch = H.mul(k);
  return choiceWhere(q, c => {
    let x;
    if ((x = c.match(/^Every length is (\d+(?:\/\d+)?) times as long: (\d+) by (\d+)\.?$/))) return N(x[1]).eq(k) && N(x[2]).eq(cw) && N(x[3]).eq(ch);
    if ((x = c.match(/^Every side gets (\d+) more: (\d+) by (\d+)\.?$/))) return W.add(N(x[1])).eq(cw) && H.add(N(x[1])).eq(ch) && N(x[2]).eq(cw) && N(x[3]).eq(ch);
    if ((x = c.match(/^It covers (\d+(?:\/\d+)?) times as many squares: (\d+) squares\.?$/))) { const area = W.mul(H); return area.mul(N(x[1])).eq(cw.mul(ch)) && N(x[2]).eq(cw.mul(ch)); }
    if ((x = c.match(/^Only the width is (\d+(?:\/\d+)?) times as long: (\d+) by (\d+)\.?$/))) return N(x[2]).eq(cw) && N(x[3]).eq(ch) && H.eq(ch) && !k.eq(1);
    return false;
  });
}

function addOrTimes(q) {
  const m = q.prompt.match(/adds (\d+) to every side of a (\d+) by (\d+) rectangle and gets (\d+) by (\d+)\. The width is now (\d+(?:\/\d+)?) times as long\. For a scaled copy, how tall/);
  if (!m) return undefined;
  const W = N(m[2]), H = N(m[3]), w2 = N(m[4]);
  return num(H.mul(w2).div(W));
}

function addCheck(q) {
  const m = q.prompt.match(/Add (\d+) to every side of the (\d+) by (\d+) (?:square|rectangle): it becomes (\d+) by (\d+)\./);
  if (!m) return undefined;
  const [, , W, H, a, b] = m.map(Number);
  const yes = a * H === b * W;
  return choiceWhere(q, c => (/^Yes/.test(c) ? yes : /^No/.test(c) ? !yes : false));
}

function halfOf(q) {
  const p = q.prompt; let m;
  if ((m = p.match(/The (\d+) by (\d+) rectangle gets a scaled copy with scale factor (\d+(?:\/\d+)?)\. How (wide|tall) is the copy\?/))) return num(N(m[4] === 'wide' ? m[1] : m[2]).mul(N(m[3])));
  if ((m = p.match(/copy of the (\d+) by (\d+) rectangle is (\d+) wide: half as wide\. How tall is it\?/))) return num(N(m[2]).mul(N(m[3])).div(N(m[1])));
  if ((m = p.match(/copy of the (\d+) by (\d+) rectangle is (\d+) tall: half as tall\. How wide is it\?/))) return num(N(m[1]).mul(N(m[3])).div(N(m[2])));
  return undefined;
}

function halfReverse(q) {
  const m = q.prompt.match(/enlarged a drawing with scale factor (\d+(?:\/\d+)?)\. The copy is (\d+) by (\d+)\. How (wide|tall) was the original\?/);
  if (!m) return undefined;
  return num(N(m[4] === 'wide' ? m[2] : m[3]).div(N(m[1])));
}

/** "The original's lavender side goes left 4" (one move) → k × 4 */
function oneMove(q) {
  const k = factorOf(q.prompt);
  const m = q.prompt.match(/The original's lavender side goes (left|right|up|down) (\d+)\. The copy's (?:next )?move: (left|right|up|down) how many\?/);
  if (!k || !m || m[1] !== m[3]) return undefined;
  return num(N(m[2]).mul(k));
}

function rectCorner(q) {
  const m = q.prompt.match(/copy of the (\d+) by (\d+) rectangle (\d+(?:\/\d+)?) times as big, from the dot\. Its far corner \((top|bottom) (right|left)\)/);
  if (!m || !q.pair) return undefined;
  const k = N(m[3]), across = num(N(m[1]).mul(k)), up = num(N(m[2]).mul(k));
  const first = (q.pair.lead.match(/\b(left|right|up|down)\b/) ?? [])[1];
  if (!first) return undefined;
  return /left|right/.test(first) ? [across, up] : [up, across];
}

/** "→ 4 ↑ 1 ← 3" → [[dir, n], ...] */
const moves = t => [...clean(t).matchAll(/([←→↑↓])\s*(\d+(?:\/\d+)?)/g)].map(m => [m[1], N(m[2])]);
function walkList(q) {
  const m = clean(q.prompt).match(/walked from the dot: (.+?)\. Which walk draws a copy/);
  const k = factorOf(q.prompt);
  if (!m || !k) return undefined;
  const orig = moves(m[1]);
  return choiceWhere(q, c => {
    const mv = moves(c);
    return mv.length === orig.length && mv.every((x, i) => x[0] === orig[i][0] && x[1].eq(orig[i][1].mul(k)));
  });
}

/** a two-step side "left 1, up 2" × k into the pair's boxes, in the pair's order */
function twoStep(q) {
  const k = factorOf(q.prompt);
  const m = q.prompt.match(/goes (left|right) (\d+), (up|down) (\d+)\./);
  if (!k || !m || !q.pair) return undefined;
  const val = { [m[1]]: num(N(m[2]).mul(k)), [m[3]]: num(N(m[4]).mul(k)) };
  const d1 = (q.pair.lead.match(/\b(left|right|up|down)\b/) ?? [])[1], d2 = (q.pair.op.match(/\b(left|right|up|down)\b/) ?? [])[1];
  if (!(d1 in val) || !(d2 in val)) return undefined;
  return [val[d1], val[d2]];
}

function slantHow(q) {
  const m = q.prompt.match(/A slanted side goes (left|right) (\d+), (up|down) (\d+)\. How do you draw it in a copy (\d+(?:\/\d+)?) times as big\?/);
  if (!m) return undefined;
  const k = N(m[5]), want = { [m[1]]: N(m[2]).mul(k), [m[3]]: N(m[4]).mul(k) };
  return choiceWhere(q, c => {
    const x = c.match(/^(left|right) (\d+), (up|down) (\d+)$/);
    if (!x) return false;   // "it crosses n squares": counting crossed squares is not a length
    return x[1] in want && x[3] in want && want[x[1]].eq(N(x[2])) && want[x[3]].eq(N(x[4]));
  });
}

function halfWalk(q) {
  return q.input === 'pair' ? twoStep(q) : oneMove(q);
}

function twoFactors(q) {
  const m = q.prompt.match(/The (\d+) by (\d+) rectangle and a (\d+) by (\d+) copy\./);
  if (!m) return undefined;
  const [, W, H, a, b] = m.map(Number);
  const yes = a * H === b * W;
  return choiceWhere(q, c => (/^Scaled/.test(c) ? yes : /^Stretched/.test(c) ? !yes : false));
}

function factorPair(q) {
  const F = closed(q), O = F.find(f => f.role === 'first'), C = F.find(f => f.role === 'second');
  if (!O || !C) return undefined;
  const a = bbox(O.pts), b = bbox(C.pts);
  const fx = Q(b.w, a.w), fy = Q(b.h, a.h);
  const first = /across/.test(q.pair?.lead ?? '') ? 'x' : /up/.test(q.pair?.lead ?? '') ? 'y' : null;
  if (!first) return undefined;
  return first === 'x' ? [fx.value, fy.value] : [fy.value, fx.value];
}

function notch(q) {
  const F = closed(q), O = F.find(f => f.role === 'first'), C = F.find(f => f.role === 'second');
  if (!O || !C) return undefined;
  const yes = !!scaled(O.pts, C.pts);
  return choiceWhere(q, c => (/^Yes/.test(c) ? yes : /^No/.test(c) ? !yes : false));
}

function notchFix(q) {
  const k = factorOf(q.prompt), s = pickSeg(q);
  if (!k || !s) return undefined;
  return num(Q(segLen(s)).mul(k));
}

function angleSame(q) {
  const F = closed(q);
  const O = F.find(f => f.caption === 'original'), C1 = F.find(f => f.caption === 'copy 1'), C2 = F.find(f => f.caption === 'copy 2');
  if (!O || !C1 || !C2) return undefined;
  const keep = { 1: sameAngles(O.pts, C1.pts), 2: sameAngles(O.pts, C2.pts) };
  const sum = P => angles(P).reduce((a, b) => a + b, 0);
  return choiceWhere(q, c => {
    let x;
    if ((x = c.match(/^Copy (\d) keeps every angle; copy (\d) does not\.?$/))) return keep[x[1]] && !keep[x[2]];
    if (/^Both keep every angle/.test(c)) return keep[1] && keep[2];
    if ((x = c.match(/^Copy (\d)'s angles are (\d+) times as big\.?$/))) { const P = x[1] === "1" ? C1 : C2; return angles(P.pts).every((a, i) => near(a, Number(x[2]) * angles(O.pts)[i])); }
    if (/^Both copies have bigger angles/.test(c)) return [C1, C2].every(f => angles(f.pts).every((a, i) => a > angles(O.pts)[i] + 1e-9)) && sum(O.pts) > 0;
    return false;
  });
}

function rectAngles(q) {
  const m = q.prompt.match(/Is the (\d+) by (\d+) rectangle a scaled copy of the (\d+) by (\d+) one\?/);
  if (!m) return undefined;
  const a = N(m[1]), b = N(m[2]), W = N(m[3]), H = N(m[4]);
  const fx = a.div(W), fy = b.div(H), yes = fx.eq(fy);
  return choiceWhere(q, c => {
    let x;
    if ((x = c.match(/^No: the angles match, but the (width|height) is × (\d+(?:\/\d+)?) and the (width|height) is × (\d+(?:\/\d+)?)\.?$/))) {
      const f = { width: fx, height: fy };
      return !yes && f[x[1]].eq(N(x[2])) && f[x[3]].eq(N(x[4])) && x[1] !== x[3];
    }
    // "it is bigger, so" / "all its angles match": neither shows one factor both ways
    return false;
  });
}

function repair(q) {
  const p = q.prompt; let m;
  if ((m = p.match(/resizes a (\d+) by (\d+) .+? to (\d+) wide and types \d+ for the height\. .*What should the height be\?/))) return num(N(m[2]).mul(N(m[3])).div(N(m[1])));
  if ((m = p.match(/resizes a (\d+) by (\d+) .+? to (\d+) tall and types \d+ for the width\. .*What should the width be\?/))) return num(N(m[1]).mul(N(m[3])).div(N(m[2])));
  return undefined;
}

function resizeJudge(q) {
  const m = q.prompt.match(/resized a (\d+) by (\d+) .+? to (\d+) by (\d+)\. What should/);
  if (!m) return undefined;
  const W = N(m[1]), H = N(m[2]), a = N(m[3]), b = N(m[4]);
  const ok = a.mul(H).eq(b.mul(W));
  return choiceWhere(q, c => {
    let x;
    if ((x = c.match(/^Change the height to (\d+(?:\/\d+)?)$/))) return !ok && N(x[1]).eq(H.mul(a).div(W));
    if ((x = c.match(/^Change the width to (\d+(?:\/\d+)?)$/))) return !ok && N(x[1]).eq(W.mul(b).div(H));
    if (/^Keep it/.test(c)) return ok;
    return false;
  });
}

const FAM = {
  whichScaled, photoFit, matchPart, timesAsLong, countLen, missingDim, oneFactor, addOrTimes, addCheck, halfOf,
  halfReverse, rectWalk: oneMove, rectCorner, walkNext: oneMove, walkList, slantMove: twoStep, slantHow, halfWalk,
  twoFactors, factorPair, notch, notchFix, angleSame, rectAngles, repair, resizeJudge,
};

function solve(q) {
  const f = FAM[q.family];
  return f ? f(q) : undefined;
}

// ---------------------------------------------------------------- the world: does the picture show what the words say?
function sane(q) {
  const p = q.prompt, out = [], F = closed(q), O = F.find(f => f.role === 'first');
  // "the W by H figure" against the drawn original
  // (rectAngles names the copy first: "Is the a by b rectangle a scaled copy of the W by H one?")
  const d = q.family === 'rectAngles' ? wh(p, /of the (\d+(?:\/\d+)?) by (\d+(?:\/\d+)?) one\?/) : wh(p);
  if (d && O && !['halfReverse'].includes(q.family)) {
    const b = bbox(O.pts);
    if (!(d[0].eq(b.w) && d[1].eq(b.h))) out.push(`the prompt says ${d[0]} by ${d[1]}, the original is drawn ${b.w} by ${b.h}`);
  }
  // the lavender side named in the prompt is the one drawn
  let m;
  const s = pickSeg(q);
  if (s && (m = p.match(/The original's lavender side goes (left|right|up|down) (\d+)(?:, (left|right|up|down) (\d+))?\./))) {
    const v = [s.pts[1][0] - s.pts[0][0], s.pts[1][1] - s.pts[0][1]];
    const want = [0, 0];
    for (const [dir, n] of [[m[1], m[2]], [m[3], m[4]]]) if (dir) { want[0] += DIRS[dir][0] * Number(n); want[1] += DIRS[dir][1] * Number(n); }
    if (v[0] !== want[0] || v[1] !== want[1]) out.push(`the lavender side is drawn (${v}), the prompt says (${want})`);
  }
  // countLen: the lavender side of the copy is k × its original side
  if (q.family === 'countLen' && s && d) {
    const k = factorOf(p), C = F.find(f => f.role === 'second');
    if (k && C) { const r = scaled(O.pts, C.pts); if (!r || !near(r.k, k.value)) out.push('the drawn copy is not the named factor'); }
  }
  // a grid answer must land on the grid (whole squares)
  if (q.input === 'num' || q.input === 'pair') {
    let v; try { v = solve(q); } catch { v = undefined; }
    const vs = Array.isArray(v) ? v : [v];
    if (!['timesAsLong', 'factorPair'].includes(q.family) && vs.some(x => typeof x === 'number' && !Number.isInteger(x))) out.push(`an answer of ${vs.join(', ')} squares is not on the grid`);
    if (vs.some(x => typeof x === 'number' && x <= 0)) out.push('a length of 0');
  }
  // a choice question needs exactly one right choice
  if (q.input === 'choice') {
    let r; try { r = solve(q); } catch { r = undefined; }
    if (r === -1) out.push('no single right choice');
  }
  return [...new Set(out)].join('; ');
}

export default { solve, sane };
