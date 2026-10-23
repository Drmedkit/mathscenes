// scale-basics oracle (role O, docs/lessons/QUALITY_LAYER.md). Every practice item worked out from what the student
// sees: the prompt, the board and the choices. Lengths are converted with the teacher's own unit facts (exact within a
// system: mm/cm/m and in/ft/yd), a scale drawing : actual is a factor actual ÷ drawing in ONE unit, and every choice is
// judged by testing its claim against those numbers (a sentence is right when its maths is true, never by its wording).
import { Q as Qk, choiceWhere } from '../../tools/quality/oracle-kit.mjs';
/** Q that also takes an exact fraction already made */
const Q = (n, d = 1) => (n && typeof n === 'object' && 'n' in n ? (d === 1 ? n : n.div(d)) : Qk(n, d));

// ---------------------------------------------------------------- units
// metric in mm, imperial in inches (exact); across systems 1 in = 25.4 mm (only for "about" claims)
const UNIT = {
  mm: ['M', 1], cm: ['M', 10], m: ['M', 1000],
  in: ['I', 1], ft: ['I', 12], yd: ['I', 36],
};
const WORD = {
  millimeter: 'mm', millimeters: 'mm', centimeter: 'cm', centimeters: 'cm', meter: 'm', meters: 'm',
  inch: 'in', inches: 'in', foot: 'ft', feet: 'ft', yard: 'yd', yards: 'yd',
  mm: 'mm', cm: 'cm', m: 'm', in: 'in', ft: 'ft', yd: 'yd',
};
const U = w => WORD[String(w).toLowerCase()];
const N = s => Q(String(s).replace(/,/g, ''));
/** x (Q) in unit u → in unit v, exact; null across systems */
function conv(x, u, v) {
  const [su, fu] = UNIT[u], [sv, fv] = UNIT[v];
  if (su !== sv) return null;
  return Q(x).mul(fu).div(fv);
}
/** x in unit u → mm (approximate across systems) */
const mm = (x, u) => Q(x).value * (UNIT[u][0] === 'M' ? UNIT[u][1] : UNIT[u][1] * 25.4);
const NUM = '(\\d[\\d,]*(?:\\.\\d+)?)';
const UN = '(mm|cm|m|in|ft|yd)';
const eqQ = (a, b) => a !== null && b !== null && Q(a).eq(Q(b));

// ---------------------------------------------------------------- plausible actual lengths (cm), generous
const SIZE = {
  'bench seat': [60, 300], banner: [30, 1000], 'bulletin board': [30, 400], poster: [20, 250], tabletop: [40, 400],
  'door mat': [30, 200], 'cutting board': [15, 90], 'garden bed': [50, 1500], desk: [50, 300], 'shelf board': [20, 300],
  'game board': [20, 90], notebook: [8, 40], 'picture frame': [8, 200], window: [25, 500], tile: [5, 120],
  'floor tile': [10, 130], sticker: [1, 40], bookmark: [8, 35], tray: [15, 90], 'photo print': [5, 120], rug: [40, 800],
  phone: [8, 22], laptop: [20, 50], skateboard: [50, 120], tablet: [12, 40], longboard: [70, 160], bike: [90, 250],
  guitar: [60, 140], lamp: [15, 250], chair: [35, 150], car: [200, 700], boat: [150, 6000], 'train car': [800, 3500],
  plane: [500, 8500], house: [500, 4000], ship: [1000, 45000], bridge: [500, 300000], shoe: [10, 40], book: [8, 50],
  leaf: [1, 100], wall: [80, 6000],
};
// room walls (plan / legend stories), cm
const ROOM = {
  hallway: [80, 2500], bedroom: [120, 900], bathroom: [120, 600], kitchen: [120, 1200], 'living room': [250, 1500],
  porch: [100, 2000], garage: [200, 2000], classroom: [400, 2000],
};
function sizeOf(obj, x, u) {
  const r = SIZE[obj]; if (!r || !UNIT[u]) return '';
  const cm = mm(x, u) / 10;
  return cm < r[0] * 0.999 || cm > r[1] * 1.001 ? `an actual ${obj} ${Q(x)} ${u} long (${Math.round(cm)} cm) is not a real ${obj}` : '';
}
function roomOf(room, x, u) {
  const r = ROOM[room]; if (!r || !UNIT[u]) return '';
  const cm = mm(x, u) / 10;
  return cm < r[0] * 0.999 || cm > r[1] * 1.001 ? `a ${room} wall ${Q(x)} ${u} long (${Math.round(cm / 100 * 10) / 10} m) is not a real ${room} wall` : '';
}

// ---------------------------------------------------------------- the givens of an item
/** a scale "1 : n" or "a : b" in the prompt (first one, or all) */
const scalesIn = p => [...String(p).matchAll(/(\d[\d,]*)\s*:\s*(\d[\d,]*)/g)].map(m => [N(m[1]), N(m[2])]);
/** "1 in represents 3 ft" / "1 cm = 5 m" */
function legendIn(p) {
  const m = String(p).match(new RegExp(NUM + ' ' + UN + '(?: represents | = | rep\\. )' + NUM + ' ' + UN + '\\b'));
  return m ? { a: N(m[1]), u: m[2], b: N(m[3]), v: m[4] } : null;
}
/** the factor of a legend: b v in units u, per a u */
const legendFactor = L => { const c = conv(L.b, L.v, L.u); return c === null ? null : c.div(L.a); };

// ---------------------------------------------------------------- families
function match(q) {
  const p = q.prompt;
  const m = p.match(new RegExp('is ' + NUM + ' ' + UN + ' by ' + NUM + ' ' + UN + '\\. The actual (.+?) has sides of ' + NUM + ' ' + UN + ' and ' + NUM + ' ' + UN + '\\. Which actual length goes with the drawing\'s ' + NUM + ' ' + UN + ' side'));
  if (!m) return undefined;
  const d = [N(m[1]), N(m[3])], r = [N(m[6]), N(m[8])], ask = N(m[10]);
  // the pairing whose two ratios agree
  const ok = [];
  if (r[0].div(d[0]).eq(r[1].div(d[1]))) ok.push([r[0], r[1]]);
  if (r[1].div(d[0]).eq(r[0].div(d[1]))) ok.push([r[1], r[0]]);
  if (ok.length !== 1 || d[0].eq(d[1])) return -1;
  const want = ask.eq(d[0]) ? ok[0][0] : ask.eq(d[1]) ? ok[0][1] : null;
  if (!want) return -1;
  return choiceWhere(q, c => { const x = c.match(new RegExp('^' + NUM + ' ' + UN + '$')); return x && N(x[1]).eq(want) && x[2] === m[2]; });
}

function pairUp(q) {
  const p = q.prompt;
  const dm = p.match(new RegExp('drawing of .+? is ' + NUM + ' ' + UN + ' long and ' + NUM + ' ' + UN + ' wide'));
  const am = p.match(new RegExp('The actual .+? is ' + NUM + ' ' + UN + ' (long|wide) and ' + NUM + ' ' + UN + ' (long|wide)'));
  if (!dm || !am) return undefined;
  const D = { long: N(dm[1]), wide: N(dm[3]) }, A = { [am[3]]: N(am[1]), [am[6]]: N(am[4]) };
  if (D.long.eq(D.wide) || A.long.eq(A.wide)) return -1;
  return choiceWhere(q, c => {
    const x = c.match(new RegExp('^' + NUM + ' ' + UN + ' and ' + NUM + ' ' + UN + '$'));
    if (!x) return false;
    const a = N(x[1]), b = N(x[3]);
    return (a.eq(D.long) && b.eq(A.long)) || (a.eq(D.wide) && b.eq(A.wide));
  });
}

/** "drawing ... is d u long ... actual ... is a v long" → [d, u, a, v] */
function twoLengths(p) {
  const m = String(p).match(new RegExp('is ' + NUM + ' ' + UN + ' long[.,].*?actual .+? (?:is )?' + NUM + ' ' + UN + ' long'));
  return m ? [N(m[1]), m[2], N(m[3]), m[4]] : null;
}

function timesAs(q) {
  const t = twoLengths(q.prompt); if (!t) return undefined;
  const a = conv(t[2], t[3], t[1]); if (a === null) return undefined;
  return a.div(t[0]).value;
}

function timesSay(q) {
  const t = twoLengths(q.prompt); if (!t) return undefined;
  const d = t[0], a = conv(t[2], t[3], t[1]);
  return choiceWhere(q, c => {
    let x;
    if ((x = c.match(/^The actual .+? is (\d[\d,]*(?:\/\d+)?) times as long as the drawing\.?$/))) return N(x[1]).eq(a.div(d));
    if ((x = c.match(/^The drawing is (\d[\d,]*(?:\/\d+)?) times as long as the actual .+?\.?$/))) return N(x[1]).eq(d.div(a));
    return false;
  });
}

function scaleCheck(q) {
  const p = q.prompt;
  const m = p.match(new RegExp('drew a .+? ' + NUM + ' ' + UN + ' by ' + NUM + ' ' + UN + '\\. The actual .+? is ' + NUM + ' ' + UN + ' by ' + NUM + ' ' + UN + '\\.'));
  if (!m) return undefined;
  const dL = N(m[1]), dW = N(m[3]), aL = N(m[5]), aW = N(m[7]);
  const k = aW.div(dW);
  const toScale = dL.mul(k).eq(aL);
  return choiceWhere(q, c => {
    let x;
    // "No: 4 × 2 = 8, not 6." : the length check, done right, and it fails
    if ((x = c.match(/^No: (\d[\d,]*) × (\d[\d,]*) = (\d[\d,]*), not (\d[\d,]*)\.?$/))) {
      const a = N(x[1]), f = N(x[2]), r = N(x[3]), w = N(x[4]);
      return !toScale && a.mul(f).eq(r) && !r.eq(w) && a.eq(dL) && f.eq(k) && w.eq(aL);
    }
    // "Yes: × 6 works for the width and the length." : test both
    if ((x = c.match(/^Yes: × (\d[\d,]*) works for the width and the length\.?$/))) { const f = N(x[1]); return dW.mul(f).eq(aW) && dL.mul(f).eq(aL); }
    // one side only, an additive test, "smaller both ways", or "the factor must come from the lengths": not a scale check
    if (/works for the width, so|differ by|smaller than .* both ways|has to come from the lengths/.test(c)) return false;
    return false;
  });
}

function toScale(q) {
  const m = q.prompt.match(new RegExp('The actual .+? is ' + NUM + ' ' + UN + ' long and ' + NUM + ' ' + UN + ' wide'));
  if (!m) return undefined;
  const L = N(m[1]), W = N(m[3]);
  return choiceWhere(q, c => {
    const x = c.match(new RegExp('^' + NUM + ' ' + UN + ' by ' + NUM + ' ' + UN + '$'));
    if (!x) return false;
    const a = N(x[1]), b = N(x[3]);
    // similar: one factor for both lengths (either orientation)
    return L.div(a).eq(W.div(b)) || L.div(b).eq(W.div(a));
  });
}

function sameUnit(q) {
  const m = q.prompt.match(new RegExp('is ' + NUM + ' ' + UN + ' long\\. The actual .+? is ' + NUM + ' ' + UN + ' long'));
  if (!m) return undefined;
  const d = N(m[1]), a = conv(N(m[3]), m[4], m[2]);
  if (a === null) return undefined;
  return a.div(d).value;
}

function convertFirst(q) {
  const m = q.prompt.match(new RegExp('length of ' + NUM + ' ' + UN + '\\. The actual length is ' + NUM + ' ' + UN + '\\.'));
  if (!m) return undefined;
  const d = [N(m[1]), m[2]], a = [N(m[3]), m[4]];
  return choiceWhere(q, c => {
    const x = c.match(new RegExp('^' + NUM + ' ' + UN + ' and ' + NUM + ' ' + UN + '$'));
    if (!x || x[2] !== x[4]) return false;   // the point: one unit
    return eqQ(conv(d[0], d[1], x[2]), N(x[1])) && eqQ(conv(a[0], a[1], x[4]), N(x[3]));
  });
}

function readScale(q) {
  const s = scalesIn(q.prompt)[0]; if (!s) return undefined;
  const n = s[1].div(s[0]);
  return choiceWhere(q, c => {
    const x = c.match(new RegExp('^' + NUM + ' ' + UN + ' on the drawing represents ' + NUM + ' ' + UN + ' in reality\\.?$'));
    if (!x) return false;   // "Nothing: only works in centimeters" is false: a ratio scale works in any one unit
    const act = conv(N(x[3]), x[4], x[2]);
    return act !== null && act.div(N(x[1])).eq(n);
  });
}

function whichPart(q) {
  const s = scalesIn(q.prompt)[0]; if (!s) return undefined;
  const m = q.prompt.match(/Which number stands for the (.+?)\?/); if (!m) return undefined;
  const actual = /^(actual|real)\b/.test(m[1]);
  const drawing = /^(drawing|model|toy|sketch|plan)\b/.test(m[1]) || /\bon a (?:floor )?(?:plan|drawing|sketch|model)$/.test(m[1]);
  if (actual === drawing) return undefined;
  const want = actual ? s[1] : s[0];
  if (s[0].eq(s[1])) return -1;
  return choiceWhere(q, c => /^\d[\d,]*$/.test(c.trim()) && N(c.trim()).eq(want));
}

function writeScale(q) {
  const m = q.prompt.match(new RegExp('length of ' + NUM + ' ' + UN + ' stands for an actual length of ' + NUM + ' ' + UN + '\\b'));
  if (!m) return undefined;
  const a = conv(N(m[3]), m[4], m[2]); if (a === null) return undefined;
  return [1, a.div(N(m[1])).value];
}

function legendMeaning(q) {
  const L = legendIn(q.prompt); if (!L) return undefined;
  return choiceWhere(q, c => {
    let x;
    // "Each centimeter on the plan stands for 5 meters of the real cabin."  1 u on the plan ↔ k v
    if ((x = c.match(/^Each (\w+) on the plan stands for (\d[\d,]*(?:\.\d+)?) (\w+) of the real/))) {
      const u = U(x[1]), v = U(x[3]); if (!u || !v) return false;
      const d = conv(1, u, L.u), r = d === null ? null : conv(d.div(L.a).mul(L.b), L.v, v);   // 1 u of plan → real, in v
      return r !== null && N(x[2]).eq(r);
    }
    // "Each meter of the real cabin is drawn 5 centimeters long."  1 v of the real thing ↔ k u on the plan
    if ((x = c.match(/^Each (\w+) of the real .+? is drawn (\d[\d,]*(?:\.\d+)?) (\w+) long/))) {
      const v = U(x[1]), u = U(x[3]); if (!u || !v) return false;
      const r = conv(1, v, L.v), d = r === null ? null : conv(r.div(L.b).mul(L.a), L.u, u);   // 1 v of reality → plan, in u
      return d !== null && N(x[2]).eq(d);
    }
    // "1 centimeter and 5 meters are the same length."
    if ((x = c.match(/^(\d[\d,]*(?:\.\d+)?) (\w+) and (\d[\d,]*(?:\.\d+)?) (\w+) are the same length/))) {
      const u = U(x[2]), v = U(x[4]); if (!u || !v) return false;
      return Math.abs(mm(N(x[1]), u) - mm(N(x[3]), v)) < 1e-9;
    }
    return false;
  });
}

function legendWrite(q) {
  const m = q.prompt.match(new RegExp('the (.+?) wall is ' + NUM + ' ' + UN + ' long\\. The real wall is ' + NUM + ' ' + UN + ' long\\. Finish the legend: 1 ' + UN + ' represents how many ' + UN));
  if (!m) return undefined;
  const d = conv(N(m[2]), m[3], m[6]), r = conv(N(m[4]), m[5], m[7]);
  if (d === null || r === null) return undefined;
  return r.div(d).value;
}

function legendToRatio(q) {
  const L = legendIn(q.prompt); if (!L) return undefined;
  const f = legendFactor(L); return f === null ? undefined : f.value;
}

function ratioToLegend(q) {
  const s = scalesIn(q.prompt)[0];
  const m = q.prompt.match(new RegExp('Finish the legend: 1 ' + UN + ' represents how many ' + UN));
  if (!s || !m) return undefined;
  const n = s[1].div(s[0]);
  const r = conv(n, m[1], m[2]); return r === null ? undefined : r.value;
}

function whatIsN(q) {
  const s = scalesIn(q.prompt)[0];
  const m = q.prompt.match(new RegExp('A part that is ' + NUM + ' ' + UN + ' long on it is ' + NUM + ' ' + UN + ' long on the actual'));
  if (!s || !m) return undefined;
  const n = s[1].div(s[0]), d = N(m[1]), a = conv(N(m[3]), m[4], m[2]);
  return choiceWhere(q, c => {
    if (/^The factor from drawing to actual/.test(c)) return a.div(d).eq(n);
    if (/^How much longer the actual/.test(c)) return a.sub(d).eq(n);
    // "The length of the actual X, in cm": the scale's number is a ratio of two lengths, not a length
    return false;
  });
}

function useFactor(q) {
  const s = scalesIn(q.prompt)[0];
  const ask = q.prompt.match(/How long is the actual (.+?)\?/);
  if (!s || !ask) return undefined;
  const walls = [...q.prompt.matchAll(new RegExp('the ([a-z ]+?) is ' + NUM + ' ' + UN + '\\b', 'g'))].map(m => ({ name: m[1], x: N(m[2]), u: m[3] }));
  const w = walls.find(v => v.name === ask[1]);
  if (!w) return undefined;
  const actual = w.x.mul(s[1]).div(s[0]);
  const unit = U(q.unit) ?? w.u;
  const r = conv(actual, w.u, unit); return r === null ? undefined : r.value;
}

function unitSwap(q) {
  const s = scalesIn(q.prompt)[0]; if (!s) return undefined;
  return choiceWhere(q, c => {
    let x;
    if ((x = c.match(/^Still (\d[\d,]*) : (\d[\d,]*)$/))) return N(x[1]).eq(s[0]) && N(x[2]).eq(s[1]);
    if ((x = c.match(/^(\d[\d,]*) : (\d[\d,]*), because/))) return N(x[2]).div(N(x[1])).eq(s[1].div(s[0]));
    return false;   // "It has no scale in ...": a ratio scale has no unit, it holds in every unit
  });
}

function direction(q) {
  const s = scalesIn(q.prompt)[0]; if (!s) return undefined;
  const n = s[1].div(s[0]);   // actual ÷ drawing
  if (q.input === 'num' && /The actual .+? is how many times as long as/.test(q.prompt)) return n.value;
  if (q.input === 'frac' && /what fraction|as long as the actual/.test(q.prompt)) return Q(1).div(n).pair;
  if (q.input !== 'choice') return undefined;
  return choiceWhere(q, c => {
    let x;
    if ((x = c.match(/^Going either way, the factor is (\d[\d,]*)\.?$/))) return n.eq(1) && N(x[1]).eq(1);
    if ((x = c.match(/^The (?:drawing|model|toy|wall).+? is (\d+)\/(\d+) as long as the actual .+?\.?$/))) return Q(Number(x[1]), Number(x[2])).eq(Q(1).div(n));
    if ((x = c.match(/^The (?:drawing|model|toy|wall).+? is (\d[\d,]*) times as long as the actual .+?\.?$/))) return N(x[1]).eq(Q(1).div(n));
    if ((x = c.match(/^The actual .+? is (\d[\d,]*) times as long as the .+?\.?$/))) return N(x[1]).eq(n);
    return false;
  });
}

function enlarge(q) {
  const p = q.prompt;
  if (/^Which scale \(drawing : actual\) makes the drawing LARGER than/.test(p)) {
    return choiceWhere(q, c => { const x = c.match(/^(\d[\d,]*) : (\d[\d,]*)$/); return !!x && N(x[1]).cmp(N(x[2])) > 0; });
  }
  if (/^Which scale \(drawing : actual\) makes the drawing SMALLER than/.test(p)) {
    return choiceWhere(q, c => { const x = c.match(/^(\d[\d,]*) : (\d[\d,]*)$/); return !!x && N(x[1]).cmp(N(x[2])) < 0; });
  }
  const s = scalesIn(p)[0]; if (!s) return undefined;
  const dOverA = s[0].div(s[1]);   // drawing length ÷ actual length
  if (/What kind of drawing is it\?/.test(p)) {
    return choiceWhere(q, c => {
      if (/^The same size as/.test(c)) return dOverA.eq(1);
      if (/^An enlargement/.test(c)) return dOverA.cmp(1) > 0;
      if (/^A reduction/.test(c)) return dOverA.cmp(1) < 0;
      return false;
    });
  }
  return choiceWhere(q, c => {
    let x;
    if ((x = c.match(/^The actual .+? is (\d[\d,]*) times as long as the drawing\.?$/))) return N(x[1]).eq(Q(1).div(dOverA));
    if ((x = c.match(/^Each drawing length is (\d[\d,]*) times as long as the actual length\.?$/))) return N(x[1]).eq(dOverA);
    if ((x = c.match(/^The drawing is (\d[\d,]*) times smaller than the .+?\.?$/))) return N(x[1]).eq(Q(1).div(dOverA)) && dOverA.cmp(1) < 0;
    return false;
  });
}

function compareScales(q) {
  const ss = scalesIn(q.prompt); if (ss.length < 2) return undefined;
  const larger = /Which drawing is larger\?/.test(q.prompt), smaller = /Which drawing is smaller\?/.test(q.prompt);
  if (larger === smaller) return undefined;
  const f = s => s[0].div(s[1]);   // drawing per actual: bigger = bigger drawing
  const c0 = f(ss[0]).cmp(f(ss[1]));
  return choiceWhere(q, c => {
    if (/^They are the same size/.test(c)) return c0 === 0;
    const x = c.match(/^The (\d[\d,]*) : (\d[\d,]*) drawing$/); if (!x) return false;
    const me = [N(x[1]), N(x[2])];
    const other = ss.find(s => !(s[0].eq(me[0]) && s[1].eq(me[1])));
    if (!other) return false;
    const k = f(me).cmp(f(other));
    return larger ? k > 0 : k < 0;
  });
}

function rateFactor(q) {
  const L = legendIn(q.prompt); if (!L) return undefined;
  const f = legendFactor(L); return f === null ? undefined : f.value;
}

function rateOrFactor(q) {
  const L = legendIn(q.prompt); if (!L) return undefined;
  const m = q.prompt.match(/What does the (\d[\d,]*) tell you\?/); if (!m) return undefined;
  const k = N(m[1]);
  const f = legendFactor(L);
  return choiceWhere(q, c => {
    let x;
    if ((x = c.match(/^Real lengths are (\d[\d,]*) times as long as on the plan$/))) return N(x[1]).eq(k) && f.eq(k);
    if ((x = c.match(/^(\d[\d,]*) (\w+) of the real .+? for each (\w+) of plan$/))) {
      // k v of reality per 1 u of plan: the legend read as a rate
      const v = U(x[2]), u = U(x[3]); if (!u || !v) return false;
      const bv = conv(L.b, L.v, v), au = conv(L.a, L.u, u);
      return N(x[1]).eq(k) && bv !== null && au !== null && N(x[1]).eq(bv.div(au));
    }
    // "The real X is 3 ft long": a legend gives no whole length
    return false;
  });
}

function critique(q) {
  const p = q.prompt;
  let m;
  const who = (p.match(/\b([A-Z][a-z]+) (?:says|measures)\b/) ?? [])[1];
  if (!who) return undefined;
  const judge = (claimTrue, fact) => c => {
    const x = c.match(new RegExp('^' + who + ' is (right|wrong): (.*)$'));
    if (!x) return false;
    if (x[1] === 'right') return claimTrue;
    return !claimTrue && fact(x[2]);
  };
  // 1. unit change: "drawn at 1 : 100 in centimeters. Kai measures it in inches and says: “In inches, the scale is 1 : 39.”"
  if ((m = p.match(/drawn at (\d[\d,]*) : (\d[\d,]*) in (\w+)\. \w+ measures it in (\w+) and says: “In \w+, the scale is (\d[\d,]*) : (\d[\d,]*)\.”/))) {
    const n = N(m[2]).div(N(m[1])), said = N(m[6]).div(N(m[5]));
    return choiceWhere(q, judge(said.eq(n), f => {
      const y = f.match(/^in any one unit it stays (\d[\d,]*) : (\d[\d,]*)\.?$/);
      return !!y && N(y[2]).div(N(y[1])).eq(n);   // "a plan can't be measured in inches" is false
    }));
  }
  // 2. two segments: "On a 1 : 50 plan, the kitchen is 8 cm long and the bathroom is 3 cm long (...). Lena says: “The lengths are different, so the plan uses two different scales.”"
  if ((m = p.match(new RegExp('On a (\\d[\\d,]*) : (\\d[\\d,]*) plan, the .+? is ' + NUM + ' ' + UN + ' long and the .+? is ' + NUM + ' ' + UN + ' long')))) {
    const n = N(m[2]).div(N(m[1])), a = N(m[3]).mul(n), b = N(m[5]).mul(n), u = m[4];
    // the claim "two different scales" is false: one plan, one scale
    return choiceWhere(q, judge(false, f => {
      let y;
      if ((y = f.match(new RegExp('^one scale, × (\\d[\\d,]*), gives ' + NUM + ' ' + UN + ' and ' + NUM + ' ' + UN + '\\.?$')))) return N(y[1]).eq(n) && eqQ(conv(N(y[2]), y[3], u), a) && eqQ(conv(N(y[4]), y[5], u), b);
      if ((y = f.match(new RegExp('^both rooms are ' + NUM + ' ' + UN + ' long\\.?$')))) return eqQ(conv(N(y[1]), y[2], u), a) && a.eq(b);
      return false;
    }));
  }
  // 3. factor as length: "drawn at 1 : 100. The porch is 5 cm long on the plan (...). Omar says: “The scale is 1 : 100, so the porch is 100 cm long.”"
  if ((m = p.match(new RegExp('drawn at (\\d[\\d,]*) : (\\d[\\d,]*)\\. The (.+?) is ' + NUM + ' ' + UN + ' long on the plan.*?so the .+? is ' + NUM + ' ' + UN + ' long\\.”')))) {
    const n = N(m[2]).div(N(m[1])), u = m[5], real = N(m[4]).mul(n);
    const said = conv(N(m[6]), m[7], u);
    return choiceWhere(q, judge(eqQ(said, real), f => {
      let y;
      if ((y = f.match(new RegExp('^(\\d[\\d,]*) is a factor, so the .+? is ' + NUM + ' ' + UN + '\\.?$')))) return N(y[1]).eq(n) && eqQ(conv(N(y[2]), y[3], u), real);
      if ((y = f.match(new RegExp('^the .+? is ' + NUM + ' ' + UN + '\\.?$')))) return eqQ(conv(N(y[1]), y[2], u), real);
      return false;
    }));
  }
  // 4. rate as factor: "says “1 in represents 5 ft” (5 ft = 60 in). Omar says: “So real lengths are 5 times as long as on the plan.”"
  if ((m = p.match(/says: “So real lengths are (\d[\d,]*) times as long as on the plan\.”/))) {
    const L = legendIn(p); if (!L) return undefined;
    const f = legendFactor(L);
    return choiceWhere(q, judge(N(m[1]).eq(f), t => {
      let y;
      if ((y = t.match(new RegExp('^' + NUM + ' ' + UN + ' stands for ' + NUM + ' ' + UN + ', so (\\d[\\d,]*) times as long\\.?$')))) {
        const r = conv(N(y[3]), y[4], y[2]);
        return r !== null && N(y[1]).eq(L.a) && y[2] === L.u && eqQ(r, conv(L.b, L.v, L.u)) && N(y[5]).eq(f);
      }
      if ((y = t.match(/^real lengths are (\d+)\/(\d+) as long\.?$/))) return Q(Number(y[1]), Number(y[2])).eq(f);
      return false;
    }));
  }
  return undefined;
}

const FAM = {
  match, pairUp, timesAs, timesSay, scaleCheck, toScale, sameUnit, convertFirst, readScale, whichPart, writeScale,
  legendMeaning, legendWrite, legendToRatio, ratioToLegend, whatIsN, useFactor, unitSwap, direction, enlarge,
  compareScales, rateFactor, rateOrFactor, critique,
};

function solve(q) {
  const f = FAM[q.family];
  return f ? f(q) : undefined;
}

// ---------------------------------------------------------------- the world
function sane(q) {
  const p = q.prompt, out = [];
  let m;
  // the actual object's length
  const re = new RegExp('(?:The|the) actual ([a-z ]+?) (?:is|has sides of) ' + NUM + ' ' + UN + '\\b(?: long| wide)?(?: (?:and|by) ' + NUM + ' ' + UN + ')?', 'g');
  for (const x of p.matchAll(re)) {
    const obj = x[1];
    const big = x[4] ? (N(x[2]).cmp(conv(N(x[4]), x[5], x[3]) ?? N(x[2])) >= 0 ? [N(x[2]), x[3]] : [N(x[4]), x[5]]) : [N(x[2]), x[3]];
    const s = sizeOf(obj, big[0], big[1]); if (s) out.push(s);
  }
  if ((m = p.match(new RegExp('the ([a-z ]+?) wall is ' + NUM + ' ' + UN + ' long\\. The real wall is ' + NUM + ' ' + UN)))) { const s = roomOf(m[1], N(m[4]), m[5]); if (s) out.push(s); }
  // plan stories: rooms worked out at the plan's scale
  if (q.family === 'useFactor' && (m = p.match(/drawn at (\d[\d,]*) : (\d[\d,]*)\./))) {
    const n = N(m[2]).div(N(m[1]));
    for (const w of p.matchAll(new RegExp('the ([a-z ]+?) wall is ' + NUM + ' ' + UN, 'g'))) { const s = roomOf(w[1], N(w[2]).mul(n), w[3]); if (s) out.push(s); }
  }
  if (q.family === 'critique' && (m = p.match(new RegExp('On a (\\d[\\d,]*) : (\\d[\\d,]*) plan, the (.+?) is ' + NUM + ' ' + UN + ' long and the (.+?) is ' + NUM + ' ' + UN + ' long')))) {
    const n = N(m[2]).div(N(m[1]));
    for (const [r, x, u] of [[m[3], m[4], m[5]], [m[6], m[7], m[8]]]) { const s = roomOf(r, N(x).mul(n), u); if (s) out.push(s); }
  }
  if (q.family === 'critique' && (m = p.match(new RegExp('drawn at (\\d[\\d,]*) : (\\d[\\d,]*)\\. The (.+?) is ' + NUM + ' ' + UN + ' long on the plan')))) {
    const s = roomOf(m[3], N(m[4]).mul(N(m[2]).div(N(m[1]))), m[5]); if (s) out.push(s);
  }
  // a drawing (not an enlargement) bigger than the thing
  if (['timesAs', 'sameUnit'].includes(q.family)) { const v = solve(q); if (typeof v === 'number' && v <= 1) out.push('the drawing is not smaller than the actual thing'); }
  // a choice question needs exactly one right choice
  if (q.input === 'choice') {
    let s; try { s = solve(q); } catch { s = undefined; }
    if (s === -1) out.push('no single right choice');
  }
  return [...new Set(out)].join('; ');
}

export default { solve, sane };
