// Oracle for the lesson "perfect-squares" (square roots of perfect squares, 8.EE.A.2 / 8.NS.A.2). Written from what the
// student sees only: the board TeX, the prompt and the choices (the tile picture only repeats the board's numbers).
// Roots are worked out by squaring whole numbers; choices that pair a verdict with a reason ("No: 5 × 5 = 25, not 36")
// are right only when the verdict is right AND the reason is a valid argument whose arithmetic is true (a true but
// irrelevant fact such as "18 is even" or "3 × 6 = 18" does not prove that a number is a perfect square).
// See docs/lessons/QUALITY_LAYER.md, "O: the oracle".
import { nums, texPlain, choiceWhere } from '../../tools/quality/oracle-kit.mjs';

// ---------------------------------------------------------------- maths
/** the whole-number root of n, or null when n is not a perfect square */
const isqrt = n => { if (!(n >= 0) || !Number.isInteger(n)) return null; const k = Math.round(Math.sqrt(n)); return k * k === n ? k : null; };
const floorRoot = n => { let k = Math.floor(Math.sqrt(n)); while (k * k > n) k--; while ((k + 1) * (k + 1) <= n) k++; return k; };
const norm = s => String(s ?? '').replace(/[−–]/g, '-').replace(/\s+/g, ' ').trim();
/** plain board text with √(x) written as √x */
const board = q => texPlain(q.board).replace(/\\overset\?\=|overset\?=/g, '?=');
/** the numbers on the board */
const bnums = q => nums(texPlain(q.board).replace(/\^2/g, ' ^sq'));

// ---------------------------------------------------------------- reasons (a valid argument whose maths is true)
/** "a × a = s and b × b = t" with b = a + 1 and s < n < t: n sits strictly between two consecutive squares */
function betweenReason(t, n) {
  const m = norm(t).match(/(\d+) × (\d+) = (\d+) and (\d+) × (\d+) = (\d+)/);
  if (!m) return false;
  const [a, a2, s, b, b2, u] = m.slice(1).map(Number);
  return a === a2 && b === b2 && a * a === s && b * b === u && b === a + 1 && s < n && n < u;
}
/** "k × k = n" (the same factor twice, the product right) */
function squareReason(t, n) {
  const m = norm(t).match(/(\d+) × (\d+) = (\d+)/);
  if (!m) return false;
  const [a, b, p] = m.slice(1).map(Number);
  return a === b && a * b === p && p === n;
}
/** Yes/No + reason for "is n a perfect square?" */
function judgeIsSquare(c, n) {
  const t = norm(c);
  const yes = /^Yes\b/.test(t), no = /^No\b/.test(t);
  const sq = isqrt(n) !== null;
  if (yes && sq) return squareReason(t.replace(/^Yes:\s*/, ''), n);
  if (no && !sq) return betweenReason(t, n) && /in between/.test(t);
  return false;
}

// ---------------------------------------------------------------- families
const F = {};

// k² (the board "k^2 = ?"; the prompt says the same: sides of k, k × k, k²)
F.squareOf = q => {
  const m = texPlain(q.board).match(/^(\d+)\^2/);
  const k = m ? Number(m[1]) : nums(q.prompt)[0];
  return k * k;
};

// a rectangle of n tiles: is n a perfect square? (verdict + reason)
F.arrangement = q => {
  const n = bnums(q)[0];
  return choiceWhere(q, c => {
    const t = norm(c);
    if (isqrt(n) === null) return /^No\b/.test(t) && betweenReason(t, n) && /nothing in between/.test(t);
    // a square: "k × k = n too, so the same tiles make a square"
    const m = t.match(/^Yes: (\d+) × (\d+) = (\d+) too, so the same tiles make a square\.?$/);
    return !!m && squareReason(`${m[1]} × ${m[2]} = ${m[3]}`, n);
  });
};

F.sideFromArea = q => isqrt(bnums(q)[0]);

/** the length unit of a board "area = 100 ft^2" (ft, in, yd, m, cm) */
const lenUnit = q => (texPlain(q.board).match(/= \d+ (ft|in|yd|m|cm)\^2/) ?? [])[1];
F.sideUnits = q => {
  const n = bnums(q)[0], k = isqrt(n), u = lenUnit(q);
  return choiceWhere(q, c => {
    const m = norm(c).match(/^(\d+(?:\.\d+)?) (sq )?(ft|in|yd|m|cm)(²)?$/);
    return !!m && Number(m[1]) === k && !m[2] && !m[4] && m[3] === u;
  });
};
F.context = q => isqrt(bnums(q)[0]);

F.evalRoot = q => isqrt(bnums(q)[0]);

// reading and writing √
F.translate = q => {
  const p = norm(q.prompt);
  let m;
  // "A square of A tiles has sides of k. Which equation goes with it?" → √A = k
  if ((m = p.match(/A square of (\d+) tiles has sides of (\d+)\. Which equation/))) {
    const A = Number(m[1]), k = Number(m[2]);
    if (k * k !== A) return undefined;
    return choiceWhere(q, c => { const e = norm(c).match(/^√(\d+) = (\d+)$/); return !!e && Number(e[1]) === A && Number(e[2]) === k; });
  }
  // "How do you read √N aloud?"
  if ((m = p.match(/How do you read √(\d+) aloud/))) return choiceWhere(q, c => norm(c).replace(/[“”"]/g, '') === `the square root of ${m[1]}`);
  // "k × k = A. Which says the same thing?" → the equation √A = k
  if ((m = p.match(/^(\d+) × (\d+) = (\d+)\. Which says the same thing/))) {
    const [a, b, A] = m.slice(1).map(Number);
    if (a !== b || a * b !== A) return undefined;
    return choiceWhere(q, c => { const e = norm(c).match(/^√(\d+) = (\d+)$/); return !!e && Number(e[1]) === A && Number(e[2]) === a; });
  }
  // "In √A = k, what does k / A stand for?"
  if ((m = p.match(/In √(\d+) = (\d+), what does (\d+) stand for/))) {
    const A = Number(m[1]), k = Number(m[2]), w = Number(m[3]);
    if (k * k !== A) return undefined;
    const isSide = w === k && w !== A, isArea = w === A && w !== k;
    return choiceWhere(q, c => {
      const t = norm(c);
      let e;
      if ((e = t.match(/^The side of a square with area (\d+)$/))) return isSide && Number(e[1]) === A;
      if ((e = t.match(/^The area of a square with side (\d+)$/))) return isArea && Number(e[1]) === k;
      if (/^The side of the square$/.test(t)) return isSide;
      if (/^The area of the square$/.test(t)) return isArea;
      return false; // "Half of 81", "64 times 64"
    });
  }
  return undefined;
};

/** is a claim "√a = b" (with b a number) true? */
const rootClaim = (a, b) => isqrt(a) !== null && isqrt(a) === b;

F.zeroRoot = q => {
  const p = norm(q.prompt), b = texPlain(q.board);
  if (/^What is √0\?/.test(p)) return choiceWhere(q, c => { const t = norm(c); return /^0, because 0 × 0 = 0$/.test(t); });
  if (/^Which is true for every whole number A/.test(p)) {
    // √A ≥ 0 for every A (√0 = 0, so "always more than 0" is false, and a root is never negative)
    return choiceWhere(q, c => /^√A is 0 or more\.?$/.test(norm(c)));
  }
  if (/^Which is true\?/.test(p)) {
    // every "√a = b" in the choice must hold, and "has no value" is false for whole numbers
    return choiceWhere(q, c => {
      const t = norm(c);
      if (/no value/.test(t)) return false;
      const claims = [...t.matchAll(/√(\d+) = (-?\d+(?:\.\d+)?)/g)];
      return claims.length > 0 && claims.every(e => rootClaim(Number(e[1]), Number(e[2])));
    });
  }
  // "√n = ?" with choices like "5", "5 or −5", "12.5": the one value the root has
  let m;
  if ((m = b.match(/^√\((\d+)\) = \?$/)) || (m = p.match(/^√(\d+) = \?/))) {
    const r = isqrt(Number(m[1]));
    return choiceWhere(q, c => { const t = norm(c); return /^\d+(\.\d+)?$/.test(t) && Number(t) === r; });
  }
  return undefined;
};

/** X says √n = c. Check it by squaring. (verdict + a check by squaring that is true) */
function judgeClaim(c, n, claim) {
  const t = norm(c), right = claim * claim === n, r = isqrt(n);
  if (/^Yes\b/.test(t)) {
    if (!right) return false;
    const m = t.match(/^Yes: (\d+) × (\d+) = (\d+)\.?$/);
    return !!m && Number(m[1]) === claim && Number(m[2]) === claim && Number(m[3]) === n;
  }
  if (/^No\b/.test(t)) {
    if (right) return false;
    // "No: c × c = s, not n. √n = r."
    const m = t.match(/^No: (\d+) × (\d+) = (\d+), not (\d+)\. √(\d+) = (\d+)\.?$/);
    return !!m && Number(m[1]) === claim && Number(m[2]) === claim && claim * claim === Number(m[3]) && Number(m[4]) === n
      && Number(m[5]) === n && Number(m[6]) === r;
  }
  return false;
}
F.checkRoot = q => {
  const m = norm(q.prompt).match(/says √(\d+) = (\d+)\. Check it by squaring/);
  if (!m) return undefined;
  return choiceWhere(q, c => judgeClaim(c, Number(m[1]), Number(m[2])));
};

F.whichSquare = q => choiceWhere(q, c => /^\d+$/.test(norm(c)) && isqrt(Number(norm(c))) !== null);

F.isSquare = q => {
  const n = bnums(q)[0];
  return choiceWhere(q, c => judgeIsSquare(c, n));
};

F.between = q => { const n = bnums(q)[0]; const k = floorRoot(n); return isqrt(n) !== null ? undefined : [k * k, (k + 1) * (k + 1)]; };
F.boundRoot = q => { const n = bnums(q)[0]; const k = floorRoot(n); return isqrt(n) !== null ? undefined : [k, k + 1]; };

// √n between k and k + 1: nearer to the whole number whose square is nearer to n (distances n − k², (k+1)² − n)
F.nearer = q => {
  const m = texPlain(q.board).match(/(\d+) < √\((\d+)\) < (\d+)/) ?? norm(q.prompt).match(/√(\d+) is between (\d+) and (\d+)/);
  if (!m) return undefined;
  const [lo, n, hi] = /√\(/.test(m[0]) ? [Number(m[1]), Number(m[2]), Number(m[3])] : [Number(m[2]), Number(m[1]), Number(m[3])];
  const dLo = n - lo * lo, dHi = hi * hi - n;
  if (dLo === dHi || hi !== lo + 1) return undefined;
  const near = dLo < dHi ? lo : hi;
  return choiceWhere(q, c => {
    // "6: 35 − 25 = 10 and 36 − 35 = 1"
    const e = norm(c).match(/^(\d+): (\d+) - (\d+) = (\d+) and (\d+) - (\d+) = (\d+)$/);
    if (!e) return false;
    const v = e.slice(1).map(Number);
    return v[0] === near && v[1] === n && v[2] === lo * lo && v[3] === dLo && v[4] === hi * hi && v[5] === n && v[6] === dHi;
  });
};

F.halving = q => {
  const p = norm(q.prompt);
  let m;
  // "Which is bigger: √n or n ÷ 2?"
  if ((m = p.match(/^Which is bigger: √(\d+) or (\d+) ÷ 2\?/))) {
    const n = Number(m[1]), r = isqrt(n), h = n / 2;
    if (r === null) return undefined;
    const want = r > h ? 'root' : r < h ? 'half' : 'same';
    return choiceWhere(q, c => {
      const t = norm(c);
      if (/^They are the same\.?$/.test(t)) return want === 'same';
      if (new RegExp(`^√${n}$`).test(t)) return want === 'root';
      const e = t.match(new RegExp(`^${n} ÷ 2: it is (\\d+(?:\\.\\d+)?), and √${n} is only (\\d+)\\.?$`));
      if (e) return want === 'half' && Number(e[1]) === h && Number(e[2]) === r;
      return false;
    });
  }
  // "Zoe says k² = v. Is that right?"
  if ((m = p.match(/says (\d+)² = (\d+)\. Is that right/))) {
    const k = Number(m[1]), v = Number(m[2]), right = k * k === v;
    return choiceWhere(q, c => {
      const t = norm(c);
      if (/^Yes\b/.test(t)) {
        if (!right) return false;
        const e = t.match(/^Yes: (\d+)² = (\d+) × (\d+) = (\d+)\.?$/);
        return !!e && Number(e[2]) === k && Number(e[3]) === k && Number(e[4]) === v;
      }
      if (/^No\b/.test(t)) {
        if (right) return false;
        const e = t.match(/^No: (\d+)² = (\d+) × (\d+) = (\d+)\.?$/);
        return !!e && Number(e[1]) === k && Number(e[2]) === k && Number(e[3]) === k && Number(e[4]) === k * k;
      }
      return false;
    });
  }
  // "Kai says √n = c, because half of n is c. Check it by squaring."
  if ((m = p.match(/says √(\d+) = (\d+), because half of \d+ is \d+\. Check it by squaring/))) {
    return choiceWhere(q, c => judgeClaim(c, Number(m[1]), Number(m[2])));
  }
  return undefined;
};

F.counterexample = q => {
  const p = norm(q.prompt), b = texPlain(q.board);
  let m;
  // which number breaks √N = N ÷ 2
  if (/shows that “√N = N ÷ 2” is NOT always true/.test(p)) {
    return choiceWhere(q, c => { const t = norm(c); if (!/^\d+$/.test(t)) return false; const N = Number(t), r = isqrt(N); return r !== null && r !== N / 2; });
  }
  // always / sometimes / never: √N = N ÷ 2 holds for 0 and 4 only
  if (/is always half of it\.” Is that always, sometimes, or never true/.test(p)) {
    return choiceWhere(q, c => {
      const t = norm(c);
      const e = t.match(/^Sometimes: it works for (\d+) and (\d+), but √(\d+) = (\d+) and (\d+) ÷ 2 = (\d+)\.?$/);
      if (!e) return false;
      const v = e.slice(1).map(Number);
      const works = N => isqrt(N) !== null && isqrt(N) === N / 2;
      return works(v[0]) && works(v[1]) && v[2] === v[4] && isqrt(v[2]) === v[3] && v[4] / 2 === v[5] && v[3] !== v[5];
    });
  }
  // √(a + b) = √a + √b?
  if ((m = b.match(/^√\((\d+) \+ (\d+)\) \?= √\((\d+)\) \+ √\((\d+)\)$/)) || (m = b.replace(/overset\?=/, '?=').match(/√\((\d+) \+ (\d+)\) \?= √\((\d+)\) \+ √\((\d+)\)/))) {
    const a = Number(m[1]), c2 = Number(m[2]);
    const ra = isqrt(a), rb = isqrt(c2), rs = isqrt(a + c2);
    if (ra === null || rb === null) return undefined;
    const holds = rs !== null && rs === ra + rb;
    return choiceWhere(q, c => {
      const t = norm(c);
      if (/^Yes\b/.test(t)) return false; // neither "take the root of each part" nor "it always works" is a valid reason
      if (holds) return false;
      // "No: √25 = 5, but 4 + 3 = 7."
      const e = t.match(/^No: √(\d+) = (\d+), but (\d+) \+ (\d+) = (\d+)\.?$/);
      if (!e) return false;
      const v = e.slice(1).map(Number);
      return v[0] === a + c2 && rs === v[1] && v[2] === ra && v[3] === rb && v[4] === ra + rb && v[1] !== v[4];
    });
  }
  return undefined;
};

function solve(q) {
  const f = F[q.family];
  return f ? f(q) : undefined;
}

// ---------------------------------------------------------------- world
const LEN = { in: [1, 30], ft: [2, 40], yd: [2, 30], m: [2, 40], cm: [1, 60] };
const OBJ = [ // a square object and the side lengths (in its own unit) a real one can have
  [/sticky note/, { in: [1, 5], cm: [3, 12] }],
  [/sticker/, { in: [1, 6], cm: [1, 15] }],
  [/floor tile/, { in: [4, 24], cm: [10, 60] }],
  [/chessboard/, { in: [8, 30], cm: [20, 75] }],
  [/quilt block/, { in: [4, 24], cm: [10, 60] }],
  [/rug/, { ft: [2, 15], m: [1, 5], yd: [1, 5] }],
  [/window/, { ft: [1, 10], in: [12, 120], m: [1, 3] }],
  [/room|classroom/, { ft: [6, 40], m: [2, 15], yd: [2, 13] }],
  [/patio/, { ft: [5, 40], m: [2, 12], yd: [2, 13] }],
  [/garden plot/, { ft: [3, 60], m: [1, 20], yd: [1, 20] }],
  [/stage/, { ft: [8, 60], m: [3, 20], yd: [3, 20] }],
];
function sane(q) {
  const p = norm(q.prompt);
  // a story square: its side must suit the object
  if (/^A square [a-z ]+ has an area of/.test(p)) {
    const n = bnums(q)[0], k = isqrt(n), u = lenUnit(q);
    const obj = p.match(/^A square ([a-z ]+?) has an area/)[1];
    if (k === null) return `area ${n} is not a perfect square`;
    for (const [re, R] of OBJ) {
      if (!re.test(obj)) continue;
      const r = R[u];
      if (!r) return `a square ${obj} measured in ${u}`;
      if (k < r[0] || k > r[1]) return `a square ${obj} with sides of ${k} ${u}`;
    }
    if (q.family === 'context' && q.unit && q.unit !== u) return `the answer unit ${q.unit} is not the side unit ${u}`;
  }
  // the root families need a perfect square; the bounds families need a non-square
  if (['sideFromArea', 'evalRoot', 'context', 'sideUnits'].includes(q.family) && isqrt(bnums(q)[0]) === null) return 'not a perfect square';
  if (['between', 'boundRoot'].includes(q.family) && isqrt(bnums(q)[0]) !== null) return `${bnums(q)[0]} is a perfect square itself`;
  // two choices that both name the right number in "which whole number is it nearer to?" (one with a wrong reason)
  if (q.family === 'nearer') {
    const ans = solve(q);
    if (ans >= 0) {
      const right = Number(norm(q.choices[ans]).match(/^\d+/)[0]);
      const same = q.choices.filter(c => { const m = norm(c).match(/^(\d+)[:,]/); return m && Number(m[1]) === right; });
      if (same.length > 1) return `two choices name ${right} (the question asks only for the whole number)`;
    }
  }
  if (q.family === 'halving') {
    const m = p.match(/says (\d+)² = (\d+)\. Is that right/);
    if (m && Number(m[1]) === 2) return '2² = 4 = 2 × 2: the halving claim is true for 2';
  }
  return '';
}

export default { solve, sane };
