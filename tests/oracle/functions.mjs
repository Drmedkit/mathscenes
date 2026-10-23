// functions oracle (role O, docs/lessons/QUALITY_LAYER.md). Works every practice item out from what the student sees:
// the arrows of the mapping diagram, the rows of the table, the pairs on the board, the beads / rings / curves on the
// graph (computed from the drawn geometry, never from the highlight `hi`), the rule or equation text, and the sketches'
// own SVG paths. A verdict choice ("A function: …", "Not a function: …") is right only when its verdict is true AND
// its reason is a valid one whose quoted numbers are true of this picture.
import { Q, texPlain } from '../../tools/quality/oracle-kit.mjs';

// ---------------------------------------------------------------- reading
const M = s => String(s ?? '').replace(/[−–]/g, '-').replace(/’/g, "'");
const N = '(-?\\d+(?:\\.\\d+)?)';
const numOf = t => Number(M(t).replace(/[$,°F\s]/g, ''));
const eqv = (a, b) => (typeof a === 'number' || typeof b === 'number' ? Math.abs(Number(a) - Number(b)) < 1e-9 : String(a) === String(b));
const key = v => (typeof v === 'number' ? String(v) : String(v).trim());
/** a value as the student reads it in a choice: a number or a name */
const val = t => { const s = M(t).trim(); return /^-?\d+(\.\d+)?$/.test(s) ? Number(s) : s; };
const same = (a, b) => key(val(String(a))) === key(val(String(b)));
/** "{−3, −1, 0}" → ['-3', '-1', '0'] */
const setOf = t => { const m = M(t).match(/\{([^}]*)\}/); return m ? m[1].split(',').map(x => x.trim()).filter(Boolean) : null; };
const sameSet = (a, b) => { const A = new Set(a.map(key)), B = new Set(b.map(key)); return A.size === B.size && [...A].every(x => B.has(x)); };

/** the pairs of a relation as the student sees them: [[x, y], …] */
function pairsOf(q) {
  const p = q.data?.picture;
  if (p?.kind === 'map') return p.arrows.map(([i, o]) => [p.ins[i], p.outs[o]]);
  if (p?.kind === 'table') return p.xs.map((x, i) => [x, p.ys[i]]);
  if (p?.kind === 'graph' && !(p.paths ?? []).length) return p.points.map(pt => [pt.x, pt.y]);
  // pairs on the board
  const t = M(texPlain(q.board));
  const out = [...t.matchAll(/\(\s*(-?[\d.]+)\s*,\s*(-?[\d.]+)\s*\)/g)].map(m => [Number(m[1]), Number(m[2])]);
  return out.length ? out : null;
}
/** input → distinct outputs */
function outputsByInput(pairs) {
  const m = new Map();
  for (const [x, y] of pairs) { const k = key(x); if (!m.has(k)) m.set(k, []); if (!m.get(k).some(v => key(v) === key(y))) m.get(k).push(y); }
  return m;
}
const isFn = pairs => [...outputsByInput(pairs).values()].every(v => v.length === 1);
const hasPair = (pairs, x, y) => pairs.some(([a, b]) => same(a, x) && same(b, y));

// ---- rules y = … in x: evaluate exactly (x², |x|, implicit products, unary minus) ----
function evalExpr(text, vars) {
  const s = M(text).replace(/²/g, '^2').replace(/·|×/g, '*').replace(/\s+/g, '');
  const toks = [...s.matchAll(/(\d+(?:\.\d+)?|[a-z]|[-+*/^()|])/g)].map(m => m[1]);
  let p = 0;
  const peek = () => toks[p], next = () => toks[p++];
  function expr() { let v = term(); while (peek() === '+' || peek() === '-') { const op = next(); const w = term(); v = op === '+' ? v.add(w) : v.sub(w); } return v; }
  function term() {
    let v = unary();
    for (;;) {
      const t = peek();
      if (t === '*') { next(); v = v.mul(unary()); } else if (t === '/') { next(); v = v.div(unary()); }
      else if (t !== undefined && (t === '(' || /^[\da-z]/.test(t) || (t === '|' && absOpen === 0))) v = v.mul(power());
      else break;
    }
    return v;
  }
  let absOpen = 0;
  function unary() { if (peek() === '-') { next(); return unary().neg(); } if (peek() === '+') { next(); return unary(); } return power(); }
  function power() { let v = prim(); while (peek() === '^') { next(); const e = Number(next()); let r = Q(1); for (let i = 0; i < e; i++) r = r.mul(v); v = r; } return v; }
  function prim() {
    const t = next();
    if (t === '(') { const v = expr(); if (next() !== ')') throw new Error('missing )'); return v; }
    if (t === '|') { absOpen++; const v = expr(); absOpen--; if (next() !== '|') throw new Error('missing |'); return v.value < 0 ? v.neg() : v; }
    if (/^[a-z]$/.test(t)) { if (!(t in vars)) throw new Error(`unknown ${t}`); return Q(vars[t]); }
    if (/^\d/.test(t)) return Q(Number(t));
    throw new Error(`unexpected ${t}`);
  }
  const v = expr();
  if (p !== toks.length) throw new Error(`trailing in ${s}`);
  return v;
}
/** a rule's right side from text: "y = 3x − 1" or a word rule */
function ruleFn(text) {
  const t = M(text).trim();
  let m;
  if ((m = t.match(/^y\s*=\s*(.+)$/))) { const rhs = m[1]; return x => evalExpr(rhs, { x }).value; }
  if ((m = t.match(/^multiply the number by (-?\d+), then subtract (-?\d+)$/))) return x => x * +m[1] - +m[2];
  if ((m = t.match(/^multiply the number by (-?\d+), then add (-?\d+)$/))) return x => x * +m[1] + +m[2];
  if ((m = t.match(/^double the number and add (-?\d+)$/))) return x => 2 * x + +m[1];
  if ((m = t.match(/^always answer (-?\d+)$/))) return () => +m[1];
  if (/^square the number$/.test(t)) return x => x * x;
  if ((m = t.match(/^take the distance of the number from (-?\d+)$/))) return x => Math.abs(x - +m[1]);
  return null;
}
/** an equation in x and y: a test (x, y) → true / false */
function eqTest(text) {
  const [l, r] = M(text).split('=');
  return (x, y) => evalExpr(l, { x, y }).eq(evalExpr(r, { x, y }));
}

// ---- graphs: what the drawing shows ----
/** the y-values where the vertical line at x meets the drawn paths and beads (closed dots); open dots excluded */
function sliceHits(pic, x) {
  const hits = [];
  const addY = y => { if (!hits.some(h => Math.abs(h - y) < 1e-6)) hits.push(y); };
  const open = pt => (pic.points ?? []).some(p => p.open && Math.abs(p.x - pt[0]) < 1e-9 && Math.abs(p.y - pt[1]) < 1e-9);
  for (const path of pic.paths ?? []) {
    const P = path.pts;
    for (let i = 0; i + 1 < P.length; i++) {
      const [x1, y1] = P[i], [x2, y2] = P[i + 1];
      if (Math.abs(x1 - x2) < 1e-12) { if (Math.abs(x - x1) < 1e-9) return 'vertical'; continue; }
      const lo = Math.min(x1, x2), hi = Math.max(x1, x2);
      if (x < lo - 1e-9 || x > hi + 1e-9) continue;
      const y = y1 + (y2 - y1) * (x - x1) / (x2 - x1);
      if (open([x, y]) && !(pic.points ?? []).some(p => !p.open && Math.abs(p.x - x) < 1e-9 && Math.abs(p.y - y) < 1e-9)) continue;
      addY(y);
    }
  }
  for (const p of pic.points ?? []) if (!p.open && Math.abs(p.x - x) < 1e-9) addY(p.y);
  return hits;
}
/** is the drawn graph y = f(x)? returns { fn, at, ys } (at: an input with two or more outputs) */
function graphFn(pic) {
  const xs = new Set();
  for (const p of pic.points ?? []) xs.add(p.x);
  for (const path of pic.paths ?? []) for (const [x] of path.pts) xs.add(x);
  const lo = Math.min(pic.x0, ...xs), hi = Math.max(pic.x1, ...xs);
  const cand = [...xs];
  for (let x = lo; x <= hi + 1e-9; x += 0.05) cand.push(Math.round(x * 1000) / 1000);
  for (const x of cand) {
    const h = sliceHits(pic, x);
    if (h === 'vertical') return { fn: false, at: x, ys: 'all' };
    // merge hits that are within a drawing tolerance (a polyline's neighbouring segments meet at a vertex)
    const ys = h.sort((a, b) => a - b).filter((y, i, a) => i === 0 || y - a[i - 1] > 0.02);
    if (ys.length >= 2) return { fn: false, at: x, ys };
  }
  return { fn: true };
}
/** is (x, y) on the drawing? (a bead, or within 0.05 of a path) */
function onGraph(pic, x, y) {
  if ((pic.points ?? []).some(p => !p.open && Math.abs(p.x - x) < 1e-9 && Math.abs(p.y - y) < 1e-9)) return true;
  for (const path of pic.paths ?? []) {
    const P = path.pts;
    for (let i = 0; i + 1 < P.length; i++) {
      const [x1, y1] = P[i], [x2, y2] = P[i + 1];
      const dx = x2 - x1, dy = y2 - y1, L = dx * dx + dy * dy;
      const t = L ? Math.max(0, Math.min(1, ((x - x1) * dx + (y - y1) * dy) / L)) : 0;
      if (Math.hypot(x1 + t * dx - x, y1 + t * dy - y) < 0.05) return true;
    }
  }
  return false;
}

// ---- generic verdict judging ----
/** the verdict of a "A function: …" / "Not a function: …" choice: true / false / null */
const verdictOf = c => (/^Not a function/.test(c) ? false : /^A function/.test(c) ? true : null);

// ---------------------------------------------------------------- per family (choice families return a boolean per choice)
const F = {
  readMap(q) {
    const p = q.data.picture, who = M(q.prompt).match(/paired with the input (.+?)\?$/)[1];
    const outs = p.arrows.filter(([i]) => same(p.ins[i], who)).map(([, o]) => key(p.outs[o]));
    return q.choices.map(c => {
      const cc = M(c).replace(/ only$/, '');
      const parts = cc.split(' and ').map(s => s.split('→').map(x => x.trim()));
      if (!parts.every(([a]) => same(a, who))) return false;
      return sameSet(parts.map(([, b]) => key(val(b))), outs);
    });
  },
  pairsCount(q) {
    const k = Number(M(q.prompt).match(/the input (-?\d+) have/)[1]);
    const pairs = pairsOf(q);
    return (outputsByInput(pairs).get(key(k)) ?? []).length;
  },
  mapVerdict(q) { return verdictChoices(q, pairsOf(q)); },
  pairVerdict(q) { return verdictChoices(q, pairsOf(q)); },
  tableVerdict(q) { return verdictChoices(q, pairsOf(q)); },
  statedSet(q) {
    const p = q.data.picture, S = setOf(q.prompt).map(val);
    const outsOf = s => p.arrows.filter(([i]) => same(p.ins[i], s)).map(([, o]) => p.outs[o]);
    const noOut = S.filter(s => outsOf(s).length === 0), twoOut = S.filter(s => new Set(outsOf(s).map(key)).size >= 2);
    // arrows from inputs that are not allowed would not count; none are drawn here
    const fn = !noOut.length && !twoOut.length;
    const inS = k => S.some(s => same(s, k));
    return q.choices.map(c => {
      const cc = M(c); let m;
      if ((m = cc.match(new RegExp(`^A function: every allowed input has exactly one output; ${N} is not an allowed input\\.$`)))) return fn && !inS(m[1]);
      if (/^A function: no input has two outputs\.$/.test(cc)) return fn;
      if ((m = cc.match(new RegExp(`^Not a function: the allowed input ${N} has no output\\.$`)))) return inS(m[1]) && noOut.some(s => same(s, m[1]));
      if ((m = cc.match(new RegExp(`^Not a function: ${N} has no output\\.$`)))) return !fn && inS(m[1]) && noOut.some(s => same(s, m[1]));
      return false; // shared outputs are allowed; "the set should include k"; "k just isn't used" (an allowed input must have an output)
    });
  },
  contextInputs(q) {
    const t = M(q.prompt).match(/make sense for (.+)\?$/)[1];
    const kind = /^a number x/.test(t) ? 'all'
      : /^the number of (songs|people|tickets|dogs)/.test(t) ? 'whole'
        : /^the number of laps/.test(t) ? 'whole'         // a count of laps run (see sane: half laps can be run)
          : /^(the hours|the minutes|the gallons|the length|the weight)/.test(t) ? 'nonneg' : null;
    if (!kind) return null;
    return q.choices.map(c => (kind === 'whole' ? /^Whole numbers/.test(c) : kind === 'nonneg' ? /^Any number 0 or more/.test(c) : /^Any number at all/.test(c)));
  },
  readPoint(q) {
    const pts = q.data.picture.points.filter(p => p.col === 'pick');
    return pts.length === 1 ? [pts[0].x, pts[0].y] : undefined;
  },
  outputAt(q) {
    const x = Number(M(q.prompt).match(/for the input (-?\d+)/)[1]);
    const ys = q.data.picture.points.filter(p => p.x === x).map(p => p.y);
    return ys.length === 1 ? ys[0] : undefined;
  },
  domainRange(q) {
    const pairs = pairsOf(q), dom = /domain/.test(q.prompt);
    const want = [...new Set(pairs.map(([x, y]) => key(dom ? x : y)))];
    return q.choices.map(c => { const s = setOf(c); return !!s && sameSet(s.map(v => key(val(v))), want); });
  },
  graphVerdict(q) {
    const pic = q.data.picture, g = graphFn(pic);
    return q.choices.map(c => {
      const cc = M(c), v = verdictOf(cc); let m;
      if (v === null || v !== g.fn) return false;
      if (v) return /^A function: (each input has exactly one output|each vertical slice meets the curve once|each allowed input has exactly one output)\.$/.test(cc)
        && (!/allowed/.test(cc) || /allowed/.test(q.board));
      if ((m = cc.match(new RegExp(`the input ${N} has every output, like ${N} and ${N}\\.$`)))) return sliceHits(pic, +m[1]) === 'vertical' && onGraph(pic, +m[1], +m[2]) && onGraph(pic, +m[1], +m[3]);
      if ((m = cc.match(new RegExp(`the slice at x = ${N} meets it at ${N} and ${N}\\.$`))) || (m = cc.match(new RegExp(`the input ${N} has two points, at ${N} and ${N}\\.$`))))
        return +m[2] !== +m[3] && onGraph(pic, +m[1], +m[2]) && onGraph(pic, +m[1], +m[3]);
      return false;
    });
  },
  segInterval(q) {
    const pic = q.data.picture, [a, b] = pic.points, dom = /domain/.test(q.prompt), v = dom ? 'x' : 'y';
    const ends = [a, b].map(p => ({ c: dom ? p.x : p.y, open: !!p.open })).sort((u, w) => u.c - w.c);
    return q.choices.map(c => {
      const cc = M(c); let m;
      // a flat (or vertical) segment: every point between the dots has this one value, open ends or not
      if (ends[0].c === ends[1].c) { m = cc.match(new RegExp(`^${v} = ${N}$`)); return !!m && +m[1] === ends[0].c; }
      m = cc.match(new RegExp(`^${N} (<|≤) ${v} (<|≤) ${N}$`));
      if (!m) return false;
      return +m[1] === ends[0].c && +m[4] === ends[1].c && (m[2] === '<') === ends[0].open && (m[3] === '<') === ends[1].open;
    });
  },
  ruleVerdict(q) {
    // every rule here gives one value per input (it is a calculation); check that we can read it as one
    const t = M(q.prompt).match(/The rule is (?:“(.+?)”|(y = .+?)), for/);
    const f = ruleFn(t[1] ?? t[2]);
    if (!f) return null;
    const constant = [-2, -1, 0, 1, 2, 3].every(x => f(x) === f(0));
    return q.choices.map(c => {
      if (/^Yes: each input gives exactly one value, the same one every time\.$/.test(c)) return constant;
      if (/^Yes: each input gives exactly one value\.$/.test(c)) return true;
      return false;
    });
  },
  ruleOutput(q) {
    const m = M(q.prompt).match(/For the rule (y = .+?), what is the output when x = (-?\d+(?:\.\d+)?)\?/);
    return ruleFn(m[1])(Number(m[2]));
  },
  whichPair(q) {
    const t = eqTest(M(q.prompt).match(/makes (.+) true\?/)[1]);
    return q.choices.map(c => { const m = M(c).match(new RegExp(`^\\(${N}, ${N}\\)$`)); return !!m && t(+m[1], +m[2]); });
  },
  pairYesNo(q) {
    const m = M(q.prompt).match(new RegExp(`the pair \\(${N}, ${N}\\) make (.+) true\\?`));
    const ok = eqTest(m[3])(+m[1], +m[2]);
    return q.choices.map(c => (/^Yes:/.test(c) ? ok : /^No:/.test(c) ? !ok : false));
  },
  implicitShows(q) {
    const p = M(q.prompt); let m;
    if ((m = p.match(/^(.+?) can be rewritten as y = (.+?)\. Is y a function of x\?$/))) {
      const t = eqTest(m[1]), rhs = m[2];
      // the rewrite is right when (x, rhs(x)) fits for several x; then y is one calculation of x
      const rw = [-3, -1, 0, 2, 5].every(x => t(x, evalExpr(rhs, { x }).value));
      return q.choices.map(c => {
        const cc = M(c); let mm;
        if ((mm = cc.match(/^Yes: each x gives one value of (.+)\.$/))) return rw && [-2, 0, 3].every(x => evalExpr(mm[1], { x }).eq(evalExpr(rhs, { x })));
        if ((mm = cc.match(new RegExp(`^No: \\(${N}, ${N}\\) and \\(${N}, ${N}\\) both work\\.$`)))) return +mm[1] === +mm[3] && +mm[2] !== +mm[4] && t(+mm[1], +mm[2]) && t(+mm[3], +mm[4]);
        return false;
      });
    }
    if ((m = p.match(new RegExp(`^Both \\(${N}, ${N}\\) and \\(${N}, ${N}\\) make (.+) true\\. What does that show\\?$`)))) {
      const t = eqTest(m[5]);
      const witness = +m[1] === +m[3] && +m[2] !== +m[4] && t(+m[1], +m[2]) && t(+m[3], +m[4]);
      return q.choices.map(c => {
        const mm = M(c).match(new RegExp(`^y is not a function of x: the input ${N} has two outputs, ${N} and ${N}\\.$`));
        if (mm) return witness && +mm[1] === +m[1] && new Set([+mm[2], +mm[3]]).size === 2 && [+mm[2], +mm[3]].every(y => y === +m[2] || y === +m[4]);
        return false; // "every equation gives one", "(5, 0) works too": neither shows y is a function
      });
    }
    return null;
  },
  sameFn(q) {
    const S = setOf(q.prompt).map(Number), f = ruleFn(M(q.prompt).match(/the rule (y = .+?) describe/)[1]);
    const pairs = pairsOf(q), by = outputsByInput(pairs);
    const picAt = x => { const v = by.get(key(x)); return v && v.length === 1 ? Number(v[0]) : undefined; };
    const covers = sameSet([...by.keys()], S.map(key));
    const diff = S.filter(x => picAt(x) === undefined || !eqv(picAt(x), f(x)));
    const sameF = covers && !diff.length;
    return q.choices.map(c => {
      const cc = M(c); let m;
      if ((m = cc.match(new RegExp(`^Different: at x = ${N} the (?:graph|table) gives ${N}, the rule gives ${N}\\.$`)))) {
        const x = +m[1]; return S.includes(x) && eqv(picAt(x), +m[2]) && eqv(f(x), +m[3]) && +m[2] !== +m[3];
      }
      if ((m = cc.match(/^The same: they agree at every allowed input, (.+)\.$/))) return sameF && sameSet(m[1].split(',').map(s => key(val(s))), S.map(key));
      return false; // same inputs, one matching input, "checking never proves", "a graph vs an equation"
    });
  },
  sampleOrAll(q) {
    const p = q.data.picture, x = Number(M(q.prompt).match(/output for x = (-?\d+)/)[1]);
    const i = p.xs.findIndex(v => v === x);
    const all = /These are all the allowed inputs/.test(q.prompt);
    return q.choices.map(c => {
      const cc = M(c); let m;
      if (i >= 0) return (m = cc.match(new RegExp(`^${N}\\b`))) ? +m[1] === p.ys[i] && !/continuing/.test(cc) : false;
      if (all) return new RegExp(`^There is none: ${x} is not an allowed input\\.$`).test(cc);
      return /^You can't tell from these rows: other rules fit them too\.$/.test(cc);
    });
  },
  compareAt(q) {
    const m = M(q.prompt).match(/function B is (y = .+?)\. At the input x = (-?\d+)/);
    const x = Number(m[2]), b = ruleFn(m[1])(x);
    const v = outputsByInput(pairsOf(q)).get(key(x));
    if (!v || v.length !== 1) return null;
    const a = Number(v[0]);
    return q.choices.map(c => (/^A has/.test(c) ? a > b : /^B has/.test(c) ? b > a : /^They have the same/.test(c) ? a === b : false));
  },
  crossover(q) {
    const m = M(q.prompt).match(/function B is (y = .+?)\. At x = (-?\d+), A's output is greater\. Is A's output greater at x = (-?\d+) too\?/);
    const f = ruleFn(m[1]), x2 = Number(m[3]);
    const v = outputsByInput(pairsOf(q)).get(key(x2));
    if (!v || v.length !== 1) return null;
    const a = Number(v[0]), b = f(x2);
    return q.choices.map(c => {
      const mm = M(c).match(new RegExp(`^No: at x = ${N}, B gives ${N} and A gives ${N}\\.$`));
      if (mm) return a <= b && +mm[1] === x2 && +mm[2] === b && +mm[3] === a;
      return false; // "it stays greater" and "the bigger numbers" are not reasons
    });
  },
  pickWitness(q) {
    const p = q.data.picture;
    if (p.kind === 'map' && /allowed inputs are/.test(q.prompt)) {
      const S = setOf(q.prompt).map(val);
      return q.choices.map(c => {
        const m = M(c).match(new RegExp(`^The allowed input ${N} has no output\\.$`));
        return !!m && S.some(s => same(s, m[1])) && !p.arrows.some(([i]) => same(p.ins[i], m[1]));
      });
    }
    const pairs = pairsOf(q);
    return q.choices.map(c => {
      const m = M(c).match(new RegExp(`^\\(${N}, ${N}\\) and \\(${N}, ${N}\\): the input ${N} has two outputs\\.$`));
      return !!m && +m[1] === +m[3] && +m[1] === +m[5] && +m[2] !== +m[4] && hasPair(pairs, m[1], m[2]) && hasPair(pairs, m[3], m[4]);
    });
  },
  witnessInput(q) {
    const bad = [...outputsByInput(pairsOf(q)).entries()].filter(([, v]) => v.length >= 2).map(([k]) => Number(k));
    return bad.length === 1 ? bad[0] : bad.length ? bad[0] : undefined;
  },
  enoughProof(q) {
    const p = M(q.prompt); let m;
    if (/each slice met exactly one point/.test(p)) {
      const pairs = pairsOf(q), bad = [...outputsByInput(pairs).entries()].filter(([, v]) => v.length >= 2).map(([k]) => Number(k));
      return q.choices.map(c => {
        const mm = M(c).match(new RegExp(`^No: checking some inputs proves nothing about the rest, and x = ${N} has two points\\.$`));
        return !!mm && bad.includes(+mm[1]);
      });
    }
    if ((m = p.match(/checked (y = .+?) at x = .*The inputs can be any number/))) {
      const rhs = m[1].replace(/^y = /, '');
      return q.choices.map(c => { const mm = M(c).match(/^For every x, (.+) is one calculation with one result\.$/); return !!mm && mm[1].trim() === rhs.trim(); });
    }
    if ((m = p.match(/The allowed inputs are exactly \{(.+?)\}\. \w+ checked all/))) {
      const S = m[1].split(',').map(s => key(val(s)));
      const pairs = pairsOf(q), by = outputsByInput(pairs);
      const complete = sameSet([...by.keys()], S) && isFn(pairs);
      return q.choices.map(c => (/^Yes: every allowed input was checked, and each has one output\.$/.test(M(c)) ? complete : false));
    }
    return null;
  },
  bothWays(q) {
    const p = q.data.picture, pairs = pairsOf(q);
    const fwd = isFn(pairs), back = isFn(pairs.map(([x, y]) => [y, x]));
    const X = p.xName, Y = p.yName;
    return q.choices.map(c => {
      const cc = M(c);
      if (cc === 'Both') return fwd && back;
      if (cc === 'Neither') return !fwd && !back;
      if (cc === `Only ${X} → ${Y}`) return fwd && !back;
      if (cc === `Only ${Y} → ${X}`) return back && !fwd;
      return false;
    });
  },
  reverseWitness(q) {
    const p = q.data.picture, pairs = pairsOf(q);
    const m = M(q.prompt).match(/\((.+?) → (.+?)\)\?$/);
    const rev = m[1] === p.yName && m[2] === p.xName;
    const R = rev ? pairs.map(([x, y]) => [y, x]) : pairs;
    const fn = isFn(R);
    return q.choices.map(c => {
      const cc = M(c); let mm;
      if ((mm = cc.match(/^No: (.+?) goes with both (.+?) and (.+?)\.$/))) {
        const v = mm[1], a = mm[2], b = mm[3];
        return !fn && a !== b && hasPair(R, v, a) && hasPair(R, v, b);
      }
      return false; // "Yes: each <x> has exactly one <y>" reads the forward direction; "missing" is not so in a complete record
    });
  },
  readStory(q) {
    const g = q.data.picture.paths[0].pts, p = M(q.prompt);
    const segs = g.slice(1).map((pt, i) => ({ t0: g[i][0], t1: pt[0], y0: g[i][1], y1: pt[1], slope: (pt[1] - g[i][1]) / (pt[0] - g[i][0]) }));
    const span = c => { const m = M(c).match(/from (\d+) to (\d+) minutes/); return m ? [+m[1], +m[2]] : null; };
    const segOf = sp => segs.find(s => s.t0 === sp[0] && s.t1 === sp[1]);
    if (/When is she at home\?/.test(p)) {
      const atZero = g.filter(pt => pt[1] === 0).map(pt => pt[0]);
      const flatZero = segs.filter(s => s.y0 === 0 && s.y1 === 0);
      return q.choices.map(c => {
        const m = M(c).match(/^At (\d+) minutes and at (\d+) minutes$/);
        if (m) return !flatZero.length && atZero.length === 2 && atZero.includes(+m[1]) && atZero.includes(+m[2]);
        const sp = span(c), s = sp && segOf(sp); return !!s && s.y0 === 0 && s.y1 === 0;
      });
    }
    const pick = test => q.choices.map(c => { const sp = span(c), s = sp && segOf(sp); return !!s && test(s); });
    if (/stay the same\?/.test(p)) return pick(s => s.slope === 0);
    if (/decrease\?/.test(p)) return pick(s => s.slope < 0);
    if (/increase\?/.test(p)) return pick(s => s.slope > 0);
    if (/moving faster: going out or coming back\?/.test(p)) {
      const out = segs.find(s => s.slope > 0), back = segs.find(s => s.slope < 0);
      const fo = Math.abs(out.slope), fb = Math.abs(back.slope);
      return q.choices.map(c => {
        const cc = M(c); let m;
        if (/^The same speed/.test(cc)) return false; // same distance is not same speed (the times differ)
        if ((m = cc.match(/^(Going out|Coming back), from (\d+) to (\d+) minutes: that part is steeper\.$/))) {
          const s = m[1] === 'Going out' ? out : back, o = m[1] === 'Going out' ? fb : fo;
          return s.t0 === +m[2] && s.t1 === +m[3] && Math.abs(s.slope) > o;
        }
        return false; // "it takes longer" is the slower part
      });
    }
    let m;
    if ((m = p.match(/speed of a bike over time\. What happens from (\d+) to (\d+) minutes\?/))) {
      const s = segOf([+m[1], +m[2]]);
      if (!s) return null;
      return q.choices.map(c => {
        if (/steady speed/.test(c)) return s.slope === 0 && s.y0 > 0;
        if (/is stopped/.test(c)) return s.slope === 0 && s.y0 === 0;
        return false; // the graph is speed, not the shape of the road
      });
    }
    return null;
  },
  sketchStory(q) {
    // read each sketch's own drawn line from its SVG (y grows downward; the axis floor is y = 84)
    const P = q.choicesHtml.map(h => {
      const d = [...h.matchAll(/<path d="([^"]*)"/g)].map(m => m[1]).find(s => !/^M14,8/.test(s));
      return [...d.matchAll(/([\d.]+),([\d.]+)/g)].map(m => [+m[1], 84 - +m[2]]);
    });
    const p = M(q.prompt);
    const want = /jogs home faster than she walked|drains quickly/.test(p);
    if (!want) return null;
    return P.map(pts => {
      if (pts.length !== 4) return false;
      const [a, b, c, d] = pts;
      const rise = (b[1] - a[1]) / (b[0] - a[0]), flat = (c[1] - b[1]) / (c[0] - b[0]), fall = (d[1] - c[1]) / (d[0] - c[0]);
      return a[1] === 0 && rise > 0 && Math.abs(flat) < 1e-9 && fall < 0 && Math.abs(d[1]) < 1e-9 && -fall > rise + 1e-9;
    });
  },
};

/** verdict choices on a set of pairs (map / pairs / table) */
function verdictChoices(q, pairs) {
  const by = outputsByInput(pairs), fn = isFn(pairs);
  return q.choices.map(c => {
    const cc = M(c), v = verdictOf(cc); let m;
    if (v === null || v !== fn) return false;
    if (v) return /^A function: each input has exactly one output\.$/.test(cc);
    if ((m = cc.match(/^Not a function: the input (.+?) has two outputs, (.+?) and (.+?)\.$/)) || (m = cc.match(/^Not a function: x = (.+?) has the outputs (.+?) and (.+?)\.$/))) {
      const o = by.get(key(val(m[1]))) ?? [];
      return !same(m[2], m[3]) && o.some(y => same(y, m[2])) && o.some(y => same(y, m[3]));
    }
    return false; // order, shared outputs, "never changes", "appears twice", "no two inputs share"
  });
}

// ---------------------------------------------------------------- contract
const pick = arr => {
  if (!Array.isArray(arr)) return undefined;
  const hits = arr.map((ok, i) => (ok ? i : -1)).filter(i => i >= 0);
  return hits.length >= 1 ? hits[0] : -1;   // -1: no choice is right (the sweep then reports it; sane says why)
};

export default {
  solve(q) {
    const f = F[q.family];
    if (!f) return undefined;
    let r;
    try { r = f(q); } catch { return undefined; }
    if (r == null) return undefined;
    if (q.input === 'choice') return pick(r);
    return r;
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
    }
    const pic = q.data?.picture;
    if (q.family === 'outputAt' && pic) {
      const x = Number(M(q.prompt).match(/for the input (-?\d+)/)[1]);
      if (!isFn(pairsOf(q))) probs.push('the graph is said to be a function but an input has two points');
      if (pic.points.filter(p => p.x === x).length !== 1) probs.push(`there is not exactly one point at x = ${x}`);
    }
    if (q.family === 'readPoint' && pic) {
      if (pic.points.filter(p => p.col === 'pick').length !== 1) probs.push('not exactly one lavender point');
      const m = q.prompt.match(/Each grid line is (\d+) units/);
      const step = m ? +m[1] : 1;
      if (step !== pic.xStep || step !== pic.yStep) probs.push('the stated grid step is not the drawn one');
    }
    if (q.family === 'witnessInput') {
      const bad = [...outputsByInput(pairsOf(q)).values()].filter(v => v.length >= 2).length;
      if (bad !== 1) probs.push(`${bad} inputs have two outputs`);
    }
    if (q.family === 'contextInputs' && /number of laps run/.test(q.prompt)) probs.push('"the number of laps run" can be 2.5 laps: whole numbers and "0 or more" both defensible');
    if (q.family === 'crossover' && pic) {
      // the board's "at x = 1: a > b" must be what the table and rule say
      const m = M(q.prompt).match(/function B is (y = .+?)\. At x = (-?\d+), A's output is greater/);
      const x1 = +m[2], a = outputsByInput(pairsOf(q)).get(key(x1)), b = ruleFn(m[1])(x1);
      if (!a || !(Number(a[0]) > b)) probs.push(`A is not greater at x = ${x1}`);
      const bm = M(texPlain(q.board)).match(new RegExp(`at x = ${N}: ${N} > ${N}`));
      if (bm && (+bm[2] !== Number(a?.[0]) || +bm[3] !== b)) probs.push('the board comparison does not match the table and rule');
    }
    if (q.family === 'domainRange' && pic?.kind === 'map') {
      const used = new Set(pic.arrows.map(([i]) => i)), hit = new Set(pic.arrows.map(([, o]) => o));
      if (used.size !== pic.ins.length || hit.size !== pic.outs.length) probs.push('a value in an oval has no arrow');
    }
    if (q.family === 'sampleOrAll' && /all the allowed inputs/.test(q.prompt)) {
      const S = setOf(texPlain(q.board));
      if (S && !sameSet(S.map(v => key(val(v))), pic.xs.map(key))) probs.push('the stated allowed inputs are not the table inputs');
    }
    if (/\t/.test(q.board)) probs.push('a tab character in the board TeX (\\t ate the "\\t" of \\text)');
    return probs.join('; ');
  },
};
