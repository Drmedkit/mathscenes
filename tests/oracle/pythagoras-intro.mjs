// pythagoras-intro oracle (role O, docs/lessons/QUALITY_LAYER.md). Works every practice item out from what the student
// sees: the lengths and areas in the prompt and on the board, the choices, and the drawn triangle (its corners: the
// right angle is found from the drawing, the hypotenuse is the side across from it; side labels sit on R–A, R–B, A–B
// as the drawing places them, pts = [R, A, B]). Lengths: c² = a² + b², a leg = √(c² − b²); exact roots stay roots,
// "to the nearest tenth" rounds half up. Reasons are judged too: a calculator, "it looks right", one example, or
// "solving again" do not check anything.
const EPS = 1e-9;
const r10 = v => Math.round(v * 10 + 1e-9) / 10;
const isSq = n => Number.isInteger(n) && n >= 0 && Math.round(Math.sqrt(n)) ** 2 === n;
const num = t => Number(String(t).replace(/[−–]/g, '-').replace(/,/g, ''));
const UNIT = { inches: 'in', inch: 'in', in: 'in', feet: 'ft', foot: 'ft', ft: 'ft', yards: 'yd', yard: 'yd', yd: 'yd', meters: 'm', meter: 'm', m: 'm', centimeters: 'cm', cm: 'cm', units: 'units', unit: 'units' };
const TO_IN = { in: 1, ft: 12, yd: 36 };

// ---------------------------------------------------------------- the drawn triangle
const picOf = q => q.data?.picture?.pic;
/** the corner index (0..2) with a right angle in the drawing, or -1 */
function rightCorner(pts) {
  for (let i = 0; i < 3; i++) {
    const p = pts[i], a = pts[(i + 1) % 3], b = pts[(i + 2) % 3];
    const d = (a[0] - p[0]) * (b[0] - p[0]) + (a[1] - p[1]) * (b[1] - p[1]);
    const L = Math.hypot(a[0] - p[0], a[1] - p[1]) * Math.hypot(b[0] - p[0], b[1] - p[1]);
    if (Math.abs(d) / L < 1e-6) return i;
  }
  return -1;
}
/** side key (a = R–A, b = R–B, c = A–B) across from corner i of pts = [R, A, B] */
const sideAcross = i => ['c', 'b', 'a'][i];
const texPlainLabel = t => String(t ?? '').replace(/\\text\{\s*([^{}]*)\}/g, ' $1').replace(/\s+/g, ' ').trim();

// ---------------------------------------------------------------- tiny evaluator: 81 + 144, 13.0^2, (√112)^2, 625^2
function ev(t) {
  const s = String(t).replace(/[−–]/g, '-').replace(/×/g, '*').replace(/,/g, '').replace(/\(√(\d+)\)\^2/g, '($1)').replace(/√(\d+)/g, 'Math.sqrt($1)').replace(/\^2/g, '**2').replace(/\^/g, '**');
  if (!/^[\d.+\-*/() Mathsqrt]+$/.test(s)) return NaN;
  try { return Function(`return (${s});`)(); } catch { return NaN; }
}
const same = (a, b) => Math.abs(a - b) < 1e-6;

// ---------------------------------------------------------------- families
const F = {
  findHyp(q) {
    const pic = picOf(q), i = rightCorner(pic.pts);
    if (i < 0) return null;
    const hyp = [0, 1, 2].filter(k => k !== i).map(k => pic.verts[k]).sort().join('');
    return q.choices.map(c => c.split('').sort().join('') === hyp);
  },
  letterC(q) {
    const pic = picOf(q), i = rightCorner(pic.pts);
    if (i < 0) return null;
    const letter = pic.labels?.[sideAcross(i)];
    return q.choices.map(c => c === letter);
  },
  squareArea(q) {
    const m = q.prompt.match(/drawn on the (\d+(?:\.\d+)?) \w+ side/) ?? q.prompt.match(/is (\d+(?:\.\d+)?) \w+ long\. What is the area of the square/);
    return num(m[1]) ** 2;
  },
  areaUnit(q) {
    const m = q.prompt.match(/One side of a right triangle is (\d+(?:\.\d+)?) (\w+)\./);
    const v = num(m[1]) ** 2, u = UNIT[m[2]];
    return q.choices.map(c => { const mm = c.match(/^(\d+(?:\.\d+)?) sq (\w+)$/); return !!mm && same(num(mm[1]), v) && mm[2] === u; });
  },
  tilted(q) { const m = q.prompt.match(/goes (\d+) across and (\d+) up/); return num(m[1]) ** 2 + num(m[2]) ** 2; },
  surroundCalc(q) {
    const m = q.prompt.match(/each side goes (\d+) across and (\d+) up/);
    const p = num(m[1]), r = num(m[2]), S = p + r, T = (p * r) / 2, A = p * p + r * r;
    return q.choices.map(c => { const mm = c.match(/^(\d+) × (\d+) − 4 × ([\d.]+) = (\d+)$/); return !!mm && +mm[1] === S && +mm[2] === S && same(+mm[3], T) && +mm[4] === A; });
  },
  missingArea(q) {
    const s = String(q.board).replace(/\\cssId\{\w+\}\{([^{}]*)\}/g, '$1');
    const m = s.match(/^\s*(\S+)\s*\+\s*(\S+)\s*=\s*(\S+)\s*$/);
    if (!m) return null;
    const [x, y, z] = [m[1], m[2], m[3]];
    if (z === '?') return num(x) + num(y);
    if (x === '?') return num(z) - num(y);
    if (y === '?') return num(z) - num(x);
    return null;
  },
  eqTrue(q) {
    const m = q.prompt.match(/True or false: (.+)\?$/);
    const [L, R] = m[1].split('=').map(ev);
    const ok = same(L, R);
    return q.choices.map(c => {
      let mm;
      if ((mm = c.match(/^True: both sides are (\d+)\.$/))) return ok && same(L, +mm[1]);
      if ((mm = c.match(/^False: (.+?) = (\d+), not (\d+)\.$/))) return !ok && same(ev(mm[1]), +mm[2]) && [L, R].some(v => same(v, +mm[3])) && [L, R].some(v => same(v, +mm[2]));
      if ((mm = c.match(/^False: (.+?) is not (\d+)\.$/))) return !ok && !same(ev(mm[1]), +mm[2]);
      return false; // "a hypotenuse, not a sum", "the answer must come after the ="
    });
  },
  meaning(q) {
    const m = q.prompt.match(/legs (\d+) \w+ and (\d+) \w+ and hypotenuse (\d+) \w+\. What does (\d+) \+ (\d+) = (\d+) say\?/);
    const ok = (+m[1]) ** 2 + (+m[2]) ** 2 === (+m[3]) ** 2;
    return q.choices.map(c => ok && /^The squares on the two legs together have the same area as the square on the hypotenuse\.$/.test(c));
  },
  nonRight(q) {
    const m = q.prompt.match(/Its squares have areas (\d+), (\d+) and (\d+)\./);
    const v = [+m[1], +m[2], +m[3]].sort((a, b) => a - b);
    const right = v[0] + v[1] === v[2];
    return q.choices.map(c => {
      let mm;
      if ((mm = c.match(/^Yes: (\d+) \+ (\d+) = (\d+)\. It is a right triangle\.$/))) return right && +mm[1] + +mm[2] === +mm[3] && +mm[3] === v[2];
      if ((mm = c.match(/^No: (\d+) \+ (\d+) = (\d+), not (\d+)\. It is not a right triangle\.$/))) return !right && +mm[1] + +mm[2] === +mm[3] && +mm[4] === v[2] && +mm[1] + +mm[2] === v[0] + v[1];
      return false;
    });
  },
  rightFirst(q) {
    const p = q.prompt;
    const noRight = /equilateral|angle of (\d+)° between them/.test(p) && !/angle of 90°/.test(p);
    return q.choices.map(c => {
      if (!/^No:/.test(c)) return false;
      if (/there is no right angle, so a² \+ b² = c² does not apply/.test(c)) return noRight && /equilateral/.test(p) && (!/Every side is (\d+)/.test(c) || p.includes(`side of an equilateral triangle is ${c.match(/Every side is (\d+)/)[1]}`));
      const mm = c.match(/^No: the angle between them is (\d+)°, not 90°\.$/);
      return !!mm && noRight && p.includes(`angle of ${mm[1]}°`);
    });
  },
  exactSide(q) {
    const m = q.prompt.match(/has an area of (\d+) (sq \w+)\. How long is one side, exactly\?/);
    const A = +m[1], u = m[2].replace(/^sq /, '');
    const want = isSq(A) ? `${Math.sqrt(A)} ${u}` : `√${A} ${u}`;
    return q.choices.map(c => c === want);
  },
  bracketRoot(q) { const m = q.prompt.match(/area of (\d+) square/); const n = +m[1], f = Math.floor(Math.sqrt(n) + EPS); return isSq(n) ? null : [f, f + 1]; },
  writeEq(q) {
    const pic = picOf(q), i = rightCorner(pic.pts);
    if (i < 0) return null;
    const lab = k => { const t = texPlainLabel(pic.labels?.[k]); const m = t.match(/=\s*(\S+)$/); return m ? m[1] : t; };
    const hk = sideAcross(i), legs = ['a', 'b', 'c'].filter(k => k !== hk).map(lab), hyp = lab(hk);
    return q.choices.map(c => {
      const m = c.match(/^(\S+)\^2 \+ (\S+)\^2 = (\S+)\^2$/);
      return !!m && m[3] === hyp && [m[1], m[2]].sort().join() === [...legs].sort().join();
    });
  },
  hypWhole: q => sides(q.prompt),
  missingLeg: q => sides(q.prompt),
  mixedSides: q => sides(q.prompt),
  exactRoot(q) {
    const sq = sidesSq(q.prompt);
    const u = (q.prompt.match(/(\d+) (\w+)\b(?: and| How|\.)/) ?? [])[2];
    const want = isSq(sq) ? `${Math.sqrt(sq)} ${u}` : `√${sq} ${u}`;
    return q.choices.map(c => c === want);
  },
  roundTenth(q) { const m = q.prompt.match(/is √(\d+) \w+\. How long is that to the nearest tenth\?/); return r10(Math.sqrt(+m[1])); },
  contextHyp(q) {
    return q.choices.map(c => /^The diagonal$|^The ladder$|^The straight line back to the start$|^An? \d+ ft side$/.test(c));
  },
  story(q) {
    const p = q.prompt;
    let m, v;
    if ((m = p.match(/walks (\d+) blocks (?:north|south|east|west), then (\d+) blocks (?:north|south|east|west)\./))) v = Math.hypot(+m[1], +m[2]);
    else if ((m = p.match(/A (\d+) ft ladder leans against a wall\. Its foot is (\d+) ft from the wall/))) v = Math.sqrt((+m[1]) ** 2 - (+m[2]) ** 2);
    else if ((m = p.match(/A screen is (\d+) in wide and (\d+) in tall\./))) v = Math.hypot(+m[1], +m[2]);
    else if ((m = p.match(/two equal sides of (\d+) ft and a base of (\d+) ft\./))) v = Math.sqrt((+m[1]) ** 2 - (+m[2] / 2) ** 2);
    else if ((m = p.match(/A square [\w ]+? is (\d+) (?:ft|in|m|yd) on each side\. How long is its diagonal/))) v = Math.SQRT2 * +m[1];
    else if ((m = p.match(/A rectangular [\w ]+? is (\d+) (?:ft|in|m|yd) (?:long|wide) and (\d+) (?:ft|in|m|yd) (?:long|wide)\./))) v = Math.hypot(+m[1], +m[2]);
    else return null;
    if (/nearest tenth/.test(p)) return r10(v);
    return isSq(Math.round(v * v)) && Math.abs(v - Math.round(v)) < 1e-9 ? Math.round(v) : v;
  },
  mixedUnits(q) {
    const p = q.prompt;
    let m, a, b, unit;
    if ((m = p.match(/rises (\d+) (inches|feet) over a level run of (\d+) (inches|feet|yards?)\. How long is the ramp's surface, in (inches|feet)\?/))) { a = [+m[1], UNIT[m[2]]]; b = [+m[3], UNIT[m[4]]]; unit = UNIT[m[5]]; }
    else if ((m = p.match(/legs of a right triangle are (\d+) (\w+) and (\d+) (\w+)\. How long is the hypotenuse, in (\w+)\?/))) { a = [+m[1], UNIT[m[2]]]; b = [+m[3], UNIT[m[4]]]; unit = UNIT[m[5]]; }
    else return null;
    const conv = ([v, u]) => (v * TO_IN[u]) / TO_IN[unit];
    const h = Math.hypot(conv(a), conv(b));
    return /nearest tenth/.test(p) ? r10(h) : h;
  },
  unitName(q) {
    const m = q.prompt.match(/legs of a right triangle are \d+ (\w+) and \d+ \w+\. The (hypotenuse is|square on the hypotenuse has an area of)/);
    const u = m[1], want = /area/.test(m[2]) ? `sq ${u}` : u;
    return q.choices.map(c => c === want);
  },
  subCheck(q) {
    const p = q.prompt;
    let m, legs, hyp, cand, asks;
    if ((m = p.match(/^Legs (\d+) and (\d+)\. \w+ says the hypotenuse is (?:exactly )?(√\d+|\d+)\./))) { legs = [+m[1], +m[2]]; cand = m[3]; asks = 'hyp'; }
    else if ((m = p.match(/^Hypotenuse (\d+), one leg (\d+)\. \w+ says the other leg is (?:exactly )?(√\d+|\d+)\./))) { hyp = +m[1]; legs = [+m[2]]; cand = m[3]; asks = 'leg'; }
    else return null;
    const cv = ev(cand);
    const ok = asks === 'hyp' ? same(legs[0] ** 2 + legs[1] ** 2, cv * cv) : same(legs[0] ** 2 + cv * cv, hyp * hyp);
    return q.choices.map(c => {
      let mm;
      if ((mm = c.match(/^It checks: (.+)$/))) return ok && claimsHold(mm[1]);
      if ((mm = c.match(/^It fails: (.+)$/))) return !ok && claimsHold(mm[1]);
      return false;
    });
  },
  sizeCheck(q) {
    const p = q.prompt;
    let m;
    if ((m = p.match(/^Hypotenuse (\d+) (\w+), one leg (\d+) \w+\. .+ says the other leg is ([\d.]+) \w+\. Is that a sensible size\?/))) {
      const c0 = +m[1], v = +m[4];
      return q.choices.map(c => { const mm = c.match(/^No: a leg can't be longer than the hypotenuse, (\d+) \w+\.$/); return !!mm && v >= c0 && +mm[1] === c0; });
    }
    if ((m = p.match(/^Legs (\d+)(?: \w+)? and (\d+)(?: \w+)?\. \w+ says the hypotenuse is (\d+)(?: \w+)?/))) {
      const a = +m[1], b = +m[2], v = +m[3], right = a * a + b * b === v * v;
      return q.choices.map(c => {
        let mm;
        if ((mm = c.match(/^No: the hypotenuse must be shorter than (\d+) \+ (\d+) = (\d+)\.$/))) return v >= a + b && +mm[3] === a + b;
        if ((mm = c.match(/^No: it passes the size checks, but (.+)$/))) return !right && v > Math.max(a, b) && v < a + b && claimsHold(mm[1]);
        if ((mm = c.match(/^Yes: (\d+) is between (\d+) and (\d+), and (.+)\.$/))) return right && +mm[1] === v && claimsHold(mm[4]);
        return false;
      });
    }
    return null;
  },
  roundCheck(q) {
    const m = q.prompt.match(/^The exact side is √(\d+)\. \w+ rounded it to ([\d.]+)\./);
    const n = +m[1], v = +m[2], good = same(r10(Math.sqrt(n)), v);
    return q.choices.map(c => {
      let mm;
      if (/^Yes: it was rounded, so .+ only has to be close to \d+, and it is\.$/.test(c)) return good;
      if ((mm = c.match(/^No: ([\d.]+) is too far from (\d+)\. √(\d+) is ([\d.]+)…$/))) return !good && +mm[3] === n && Math.sqrt(n).toFixed(mm[4].split('.')[1]?.length ?? 0).startsWith(mm[4].slice(0, -1));
      return false;
    });
  },
  proofStep(q) {
    const p = q.prompt;
    let m;
    if (/Why is the shape in the middle a square of area c\^2\?/.test(p)) return q.choices.map(c => /^Its sides are 4 hypotenuses of length c, and each corner is 180° − 90° = 90°\.$/.test(c));
    if ((m = p.match(/legs (\d+) and (\d+) sit in a big square of side \1 \+ \2 = (\d+)\. The big square is (\d+)\. The 4 triangles cover 4 × ([\d.]+) = ([\d.]+)\. How much is left uncovered/))) {
      const a = +m[1], b = +m[2], left = (a + b) ** 2 - 2 * a * b;
      return q.choices.map(c => { const mm = c.match(/^(\d+): it is (\d+)\^2 \+ (\d+)\^2 and also c\^2\.$/); return !!mm && +mm[1] === left && +mm[2] === a && +mm[3] === b; });
    }
    if (/What does this argument show\?/.test(p)) return q.choices.map(c => /^a² \+ b² = c² for every right triangle, because it works the same for any legs\.$/.test(c));
    if (/Why is \d+\^2 \+ \d+\^2 the same area as the middle square before\?/.test(p)) return q.choices.map(c => /^The big square and the 4 triangles did not change, so the uncovered area stayed the same\.$/.test(c));
    return null;
  },
};
/** "legs a and b → hypotenuse" / "hypotenuse c and one leg b → other leg", exact or as a number */
function sidesSq(p) {
  let m;
  if ((m = p.match(/legs of a right triangle are (\d+) \w+ and (\d+) \w+/))) return (+m[1]) ** 2 + (+m[2]) ** 2;
  if ((m = p.match(/hypotenuse (\d+) \w+ and (?:one |a )?leg (\d+) \w+/))) return (+m[1]) ** 2 - (+m[2]) ** 2;
  return NaN;
}
function sides(p) { const s = sidesSq(p); return isSq(s) ? Math.sqrt(s) : Math.sqrt(s); }
/** every "X = Y", "X is not Y", "X = Y = Z" claim in a reason is true */
function claimsHold(t) {
  const parts = String(t).replace(/\.$/, '').split(/,? and |, but |; /);
  return parts.every(s => {
    let m;
    if ((m = s.match(/^(.+?) is not (.+)$/))) return !same(ev(m[1]), ev(m[2]));
    if ((m = s.match(/^(.+?), not (.+)$/))) { const sides = m[1].split('=').map(ev); return sides.every(v => same(v, sides[0])) && !same(sides.at(-1), ev(m[2])); }
    if (/=/.test(s)) { const sides = s.split('=').map(x => ev(x.replace(/the equation balances/, ''))); return sides.every(v => Number.isFinite(v) && same(v, sides[0])); }
    if (/^the equation balances$/.test(s.trim())) return true;
    return false;
  });
}

// ---------------------------------------------------------------- the world
function worldProblems(q, r) {
  const probs = [];
  const p = q.prompt, pic = picOf(q);
  let m;
  if (pic?.kind === 'tri' && pic.pts) {
    const i = rightCorner(pic.pts);
    if (pic.right && i < 0) probs.push('the picture marks a right angle but the drawn triangle has none');
    if ((m = p.match(/right angle at ([A-Z])/)) && pic.verts && i >= 0 && pic.verts[i] !== m[1]) probs.push(`the prompt puts the right angle at ${m[1]}, the drawing at ${pic.verts[i]}`);
    // numeric side labels must fit a² + b² = c² with the hypotenuse across from the right angle
    if (i >= 0 && pic.labels) {
      const val = k => { const t = texPlainLabel(pic.labels[k]); const mm = t.match(/(\d+(?:\.\d+)?)\s*(in|ft|yd|m|cm)?$/); return mm && !/^[a-z?]/.test(t.replace(/^[a-z] = /, '')) ? +mm[1] : null; };
      const hk = sideAcross(i), lk = ['a', 'b', 'c'].filter(k => k !== hk);
      const H = val(hk), A = val(lk[0]), B = val(lk[1]);
      const units = ['a', 'b', 'c'].map(k => (texPlainLabel(pic.labels[k]).match(/(in|ft|yd|m|cm)$/) ?? [])[1]).filter(Boolean);
      if (H != null && A != null && B != null && new Set(units).size <= 1 && Math.abs(A * A + B * B - H * H) > 1e-6) probs.push(`the drawn labels ${A}, ${B}, ${H} do not fit a right triangle`);
      if (H != null && ((A != null && A >= H) || (B != null && B >= H))) probs.push('a leg label is not shorter than the hypotenuse label');
    }
    if (pic.areas && i >= 0) {
      const hk = sideAcross(i), lk = ['a', 'b', 'c'].filter(k => k !== hk);
      const v = k => (/^\d+$/.test(pic.areas[k] ?? '') ? +pic.areas[k] : null);
      if (v(hk) != null && v(lk[0]) != null && v(lk[1]) != null && v(lk[0]) + v(lk[1]) !== v(hk)) probs.push('the drawn square areas do not add up');
    }
  }
  if (['roundTenth', 'story', 'mixedUnits'].includes(q.family) && /nearest tenth/.test(p)) {
    const x = typeof r === 'number' ? null : null; void x;
  }
  if (q.family === 'roundTenth' && (m = p.match(/is √(\d+)/))) { const v = Math.sqrt(+m[1]) * 10; if (Math.abs(v - Math.floor(v) - 0.5) < 1e-6) probs.push('a .x5 tie'); }
  if (q.family === 'proofStep' && (m = p.match(/legs (\d+) and (\d+) sit in a big square of side \1 \+ \2 = (\d+)\. The big square is (\d+)\. The 4 triangles cover 4 × ([\d.]+) = ([\d.]+)\./))) {
    const a = +m[1], b = +m[2];
    if (+m[3] !== a + b || +m[4] !== (a + b) ** 2 || +m[5] !== (a * b) / 2 || +m[6] !== 2 * a * b) probs.push('the numbers of the big square or the triangles are wrong');
  }
  if (q.family === 'story' && (m = p.match(/A (\d+) ft ladder leans against a wall\. Its foot is (\d+) ft from the wall/)) && +m[2] >= +m[1]) probs.push('the ladder is shorter than its distance from the wall');
  if (q.family === 'story' && (m = p.match(/A screen is (\d+) in wide and (\d+) in tall/)) && (+m[1] > 120 || +m[2] > 80)) probs.push('a screen that big is not a screen');
  return probs;
}

// ---------------------------------------------------------------- contract
const pick = arr => { const hits = arr.map((ok, i) => (ok ? i : -1)).filter(i => i >= 0); return hits.length ? hits[0] : -1; };
function runF(q) { const f = F[q.family]; return f ? f(q) : undefined; }
export default {
  solve(q) {
    let r;
    try { r = runF(q); } catch { return undefined; }
    if (r == null || (typeof r === 'number' && !Number.isFinite(r))) return undefined;
    if (q.input === 'choice') return Array.isArray(r) ? pick(r) : undefined;
    if (q.input === 'pair') return r;
    return typeof r === 'number' ? Number(r.toFixed(9)) : r;
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
    if (q.input === 'num' && typeof r === 'number' && !/nearest tenth/.test(q.prompt) && Math.abs(r * 1000 - Math.round(r * 1000)) > 1e-6) probs.push(`the answer ${r} is not a whole or short decimal and no rounding is asked`);
    try { probs.push(...worldProblems(q, r)); } catch (e) { probs.push(`could not check the picture (${e.message})`); }
    return probs.join('; ');
  },
};
