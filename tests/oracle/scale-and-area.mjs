// scale-and-area oracle (role O, docs/lessons/QUALITY_LAYER.md). Works every practice item out from what the student
// sees: the lengths, factors, legends and areas in the prompt and on the board, the choices, and the drawn shape
// (its own width / height / cells, used to check the stated areas). The maths: a length factor k multiplies every
// area by k × k; one stretched side multiplies it by that factor only; a perimeter by k. All values are exact
// fractions. Reasons are judged too: an example, a rule quoted back, or "doubling doubles" do not show WHY.
import { Q } from '../../tools/quality/oracle-kit.mjs';

const UNI = { '½': '1/2', '¼': '1/4', '¾': '3/4', '⅛': '1/8', '⅓': '1/3', '⅔': '2/3' };
const uni = s => String(s).replace(/[½¼¾⅛⅓⅔]/g, c => UNI[c]);
/** '3/2' '2.5' '¼' '$1.50' '1,200' → Q */
const q = t => Q(uni(String(t)).replace(/[$,\s]/g, '').replace(/[−–]/g, '-'));
const NUM = '(\\d+\\/\\d+|\\d[\\d,]*(?:\\.\\d+)?|[½¼¾⅛⅓⅔])';
const tex = t => uni(String(t ?? '')).replace(/\\[td]?frac\{(\d+)\}\{(\d+)\}/g, '$1/$2').replace(/\\[td]?frac(\d)(\d)/g, '$1/$2')
  .replace(/\\text\{([^{}]*)\}/g, '$1').replace(/\\times/g, '×').replace(/\\[,;: ]|\\quad/g, ' ').replace(/[{}]/g, '').replace(/\s+/g, ' ').trim();

/** a small evaluator for the triWhy lines: numbers, fractions, ½ ¼ ⅛, ×, ( ) → Q */
function evalQ(text) {
  const s = uni(text).replace(/×/g, '*');
  const toks = s.match(/\d+\/\d+|\d+(?:\.\d+)?|[*()]/g) ?? [];
  let p = 0;
  const peek = () => toks[p], next = () => toks[p++];
  function prod() { let v = atom(); while (peek() === '*' || peek() === '(') { if (peek() === '*') next(); v = v.mul(atom()); } return v; }
  function atom() { const t = next(); if (t === '(') { const v = prod(); if (next() !== ')') throw new Error(')'); return v; } if (t === undefined) throw new Error('end'); return Q(t); }
  const v = prod();
  if (p !== toks.length) throw new Error('trailing');
  return v;
}
/** the area of the drawn shape (rect / para / tri / cells), from its own numbers */
function drawnArea(pic) {
  const s = pic?.shape;
  if (!s) return null;
  if (s.kind === 'rect' || s.kind === 'para') return Q(s.w).mul(s.h);
  if (s.kind === 'tri') return Q(s.w).mul(s.h).div(2);
  if (s.kind === 'cells') return Q(s.cells.length);
  return null;
}
const picOf = qq => qq.data?.pict?.pic;

// ---------------------------------------------------------------- families
const F = {
  stretchOne(qq) {
    const p = qq.prompt;
    let m;
    if ((m = p.match(new RegExp(`is ${NUM} \\w+ long and ${NUM} \\w+ wide\\. A new one keeps the (width|length) but makes the (length|width) ${NUM} \\w+\\.`)))) {
      const L = q(m[1]), W = q(m[2]), v = q(m[5]);
      return m[4] === 'length' ? v.mul(W) : L.mul(v);
    }
    if ((m = p.match(new RegExp(`is ${NUM} \\w+ long and ${NUM} \\w+ wide\\. Only its (length|width) is multiplied by ${NUM}\\.`)))) {
      return q(m[1]).mul(q(m[2])).mul(q(m[4]));
    }
    return null;
  },
  stretchTimes(qq) { const m = qq.prompt.match(new RegExp(`Its (length|width) is multiplied by ${NUM}, the other side stays\\.`)); return m ? q(m[2]) : null; },
  fillCopy(qq) {
    const m = qq.prompt.match(new RegExp(`^A ${NUM} by ${NUM} rectangle is scaled by ${NUM}: the copy is ${NUM} by ${NUM}\\.`));
    return q(m[4]).mul(q(m[5])).div(q(m[1]).mul(q(m[2])));
  },
  copyArea(qq) {
    const m = qq.prompt.match(new RegExp(`^A ${NUM} by ${NUM} rectangle \\(area ${NUM} square units?\\) is scaled by ${NUM}\\.`));
    const k = q(m[4]); return q(m[1]).mul(q(m[2])).mul(k).mul(k);
  },
  twoFactors(qq) { const m = qq.prompt.match(new RegExp(`length is multiplied by ${NUM} and its width by ${NUM}\\.`)); return q(m[1]).mul(q(m[2])); },
  isScaled(qq) {
    const m = qq.prompt.match(new RegExp(`the length × ${NUM}, the width × ${NUM}\\.`));
    const a = q(m[1]), b = q(m[2]), scaled = a.eq(b), f = a.mul(b);
    return qq.choices.map(c => { const mm = c.match(new RegExp(`^(A scaled copy|Not a scaled copy); the area is × ${NUM}$`)); return !!mm && (mm[1] === 'A scaled copy') === scaled && q(mm[2]).eq(f); });
  },
  tileCount(qq) { const m = qq.prompt.match(new RegExp(`is scaled by ${NUM}\\.`)); const k = q(m[1]); return k.mul(k); },
  onlyRects(qq) {
    const m = qq.prompt.match(new RegExp(`\\(area ${NUM} square units?\\) by ${NUM}`));
    const A = q(m[1]), k = q(m[2]), want = A.mul(k).mul(k);
    return qq.choices.map(c => { const mm = c.match(new RegExp(`^${NUM} square units: ${NUM} copies fill it$`)); return !!mm && q(mm[1]).eq(want) && q(mm[2]).eq(k.mul(k)); });
  },
  unitSquares(qq) {
    const m = qq.prompt.match(new RegExp(`(?:made of |\\()${NUM} unit squares\\)?\\.? (?:It )?is scaled by ${NUM}\\.`));
    const n = q(m[1]), k = q(m[2]);
    if (/How many unit squares make the copy\?/.test(qq.prompt)) return n.mul(k).mul(k);
    if (/how many times the area/.test(qq.prompt)) return k.mul(k);
    return null;
  },
  noWholeCopies(qq) {
    const m = qq.prompt.match(new RegExp(`has an area of ${NUM} (sq \\w+)\\. Every length is multiplied by ${NUM}\\.`));
    const want = q(m[1]).mul(q(m[3])).mul(q(m[3]));
    return qq.choices.map(c => { const mm = c.match(new RegExp(`^${NUM} (sq \\w+)$`)); return !!mm && mm[2] === m[2] && q(mm[1]).eq(want); });
  },
  areaFactor(qq) { const m = qq.prompt.match(new RegExp(`multiplied by ${NUM}\\. The area is multiplied by what number\\?`)); const k = q(m[1]); return k.mul(k); },
  squaredMeans(qq) {
    const m = qq.prompt.match(new RegExp(`is scaled by ${NUM}\\. Its area is multiplied by \\1²\\.`));
    const k = q(m[1]);
    return qq.choices.map(c => { const mm = c.match(new RegExp(`^${NUM} × ${NUM} = ${NUM}: the area is ${NUM} times as large$`)); return !!mm && q(mm[1]).eq(k) && q(mm[2]).eq(k) && q(mm[3]).eq(k.mul(k)) && q(mm[4]).eq(k.mul(k)); });
  },
  areaGiven(qq) { const m = qq.prompt.match(new RegExp(`has an area of ${NUM} sq \\w+\\. A scaled copy has every length × ${NUM}\\.`)); const k = q(m[2]); return q(m[1]).mul(k).mul(k); },
  areaFromDims(qq) { const m = qq.prompt.match(new RegExp(`is ${NUM} \\w+ by ${NUM} \\w+\\. It is scaled by ${NUM}\\.`)); const k = q(m[3]); return q(m[1]).mul(q(m[2])).mul(k).mul(k); },
  fracFactor(qq) {
    let m;
    if ((m = qq.prompt.match(new RegExp(`has an area of ${NUM} sq \\w+\\. Every length is multiplied by ${NUM}\\. What is the new area\\?`)))) { const k = q(m[2]); return q(m[1]).mul(k).mul(k); }
    if ((m = qq.prompt.match(new RegExp(`multiplied by ${NUM} \\(an? (?:enlargement|reduction)\\)\\. The area is multiplied by what number\\?`)))) { const k = q(m[1]); return k.mul(k); }
    return null;
  },
  decFactor(qq) { const m = qq.prompt.match(new RegExp(`multiplied by ${NUM}\\. The area is multiplied by what number\\?`)); const k = q(m[1]); return k.mul(k); },
  shrinkOrGrow(qq) {
    const m = qq.prompt.match(new RegExp(`is scaled by ${NUM}\\.`));
    const k = q(m[1]), f = k.mul(k), bigger = f.cmp(1) > 0;
    return qq.choices.map(c => { const mm = c.match(new RegExp(`^(Larger|Smaller): the area is × ${NUM}$`)); return !!mm && (mm[1] === 'Larger') === bigger && q(mm[2]).eq(f); });
  },
  areaRatio(qq) { const m = qq.prompt.match(/new : original = (\d+) : (\d+)\./); return [Number(m[1]) ** 2, Number(m[2]) ** 2]; },
  planRatio(qq) { const m = qq.prompt.match(/drawing : actual = (\d+) : ([\d,]+)\./); return [Number(m[1]) ** 2, Number(m[2].replace(/,/g, '')) ** 2]; },
  legendArea(qq) {
    const m = qq.prompt.match(new RegExp(`legend ${NUM} (in|cm) : ${NUM} (ft|mi|m|yd|km)\\. .+? is an? ${NUM} \\2 by ${NUM} \\2 rectangle\\.`));
    const per = q(m[3]).div(q(m[1])); // real units per drawing unit
    return q(m[5]).mul(per).mul(q(m[6]).mul(per));
  },
  legendUnit(qq) {
    const m = qq.prompt.match(new RegExp(`legend ${NUM} (in|cm) : ${NUM} (ft|mi|m|yd|km)\\. One square \\w+ on`));
    const per = q(m[3]).div(q(m[1]));
    const want = per.mul(per);
    return qq.choices.map(c => { const mm = c.match(new RegExp(`^${NUM} sq (ft|mi|m|yd|km)$`)); return !!mm && mm[2] === m[4] && q(mm[1]).eq(want); });
  },
  rootK(qq) {
    let m;
    const root = v => { const r = Math.round(Math.sqrt(v)); return r * r === v ? r : null; };
    if ((m = qq.prompt.match(/its area is multiplied by (\d+)\. What is the length scale factor\?/))) { const r = root(Number(m[1])); return r === null ? null : Q(r); }
    if ((m = qq.prompt.match(/has (\d+)\/(\d+) of the original’s area\. What was the length scale factor\?/))) { const a = root(Number(m[1])), b = root(Number(m[2])); return a === null || b === null ? null : Q(a, b); }
    return null;
  },
  planBack(qq) {
    const m = qq.prompt.match(new RegExp(`legend ${NUM} (in|cm) : ${NUM} (ft|mi|m|yd|km)\\. A real \\w+ has an area of ${NUM} sq \\4\\.`));
    const per = q(m[3]).div(q(m[1]));
    return q(m[5]).div(per.mul(per));
  },
  whyFour(qq) {
    return qq.choices.map(c => { const mm = c.match(/^It splits into (\d+) rows of (\d+) copies of the original: (\d+) copies\.$/); return !!mm && +mm[1] === 2 && +mm[2] === 2 && +mm[3] === 4; });
  },
  onlyLength(qq) {
    const m = qq.prompt.match(new RegExp(`^Only the (length|width) of a ${NUM} by ${NUM} rectangle is multiplied by ${NUM}\\.`));
    const k = q(m[4]), A = q(m[2]).mul(q(m[3]));
    return qq.choices.map(c => {
      let mm;
      if ((mm = c.match(new RegExp(`^No: it is ${NUM} copies side by side, so the area is × ${NUM}\\.$`)))) return q(mm[1]).eq(k) && q(mm[2]).eq(k) && !k.eq(k.mul(k));
      if ((mm = c.match(new RegExp(`^No: the area grows by ${NUM} square units\\.$`)))) return q(mm[1]).eq(A.mul(k).sub(A)) && false; // true but not the reason Leo is wrong
      return false;
    });
  },
  eachFactor(qq) {
    const m = qq.prompt.match(new RegExp(`is scaled by ${NUM} \\(`));
    const k = q(m[1]);
    return qq.choices.map(c => { const mm = c.match(new RegExp(`^The length multiplies the area by ${NUM}, the width by ${NUM} again\\.$`)); return !!mm && q(mm[1]).eq(k) && q(mm[2]).eq(k); });
  },
  twoStretches(qq) {
    const m = qq.prompt.match(new RegExp(`\\(area ${NUM}\\) is scaled by ${NUM}\\. Scaling only the length makes the area ${NUM}\\.`));
    const k = q(m[2]);
    return q(m[1]).mul(k).mul(k);
  },
  triFormula(qq) {
    const m = qq.prompt.match(new RegExp(`base ${NUM} and height ${NUM} \\(area ${NUM}\\)\\. It is scaled by ${NUM}\\.`));
    const k = q(m[4]);
    return Q(1, 2).mul(q(m[1]).mul(k)).mul(q(m[2]).mul(k));
  },
  triWhy(qq) {
    const m = qq.prompt.match(new RegExp(`base ${NUM} and height ${NUM}\\. It is scaled by ${NUM}\\. Which line shows why its area is × ${NUM}\\?`));
    const b = q(m[1]), h = q(m[2]), k = q(m[3]);
    const truth = Q(1, 2).mul(b.mul(k)).mul(h.mul(k)), orig = Q(1, 2).mul(b).mul(h);
    return qq.choices.map(c => {
      const [L, Rt] = c.split('=');
      let l, r; try { l = evalQ(L); r = evalQ(Rt); } catch { return false; }
      const fm = Rt.trim().match(/^(\S+) ×/);
      return l.eq(truth) && r.eq(truth) && !!fm && q(fm[1]).eq(k.mul(k)) && truth.div(orig).eq(k.mul(k));
    });
  },
  whichMeasure(qq) {
    const m = qq.prompt.match(new RegExp(`^A ${NUM} (\\w+) by ${NUM} \\w+ rectangle \\(perimeter ${NUM} \\w+, area ${NUM} sq \\w+\\) is scaled by ${NUM}\\. (.+)$`));
    const a = q(m[1]), b = q(m[3]), k = q(m[6]), ask = m[7];
    if (/long side/.test(ask)) return (a.cmp(b) >= 0 ? a : b).mul(k);
    if (/short side/.test(ask)) return (a.cmp(b) <= 0 ? a : b).mul(k);
    if (/perimeter/.test(ask)) return a.add(b).mul(2).mul(k);
    if (/area/.test(ask)) return a.mul(b).mul(k).mul(k);
    return null;
  },
  fieldJobs(qq) {
    const m = qq.prompt.match(new RegExp(`takes ${NUM} min; fertilizing it takes ${NUM} bags?\\. A square field has sides ${NUM} times as long`));
    const k = q(m[3]);
    if (/How many bags/.test(qq.prompt)) return q(m[2]).mul(k).mul(k);
    if (/How many minutes/.test(qq.prompt)) return q(m[1]).mul(k);
    return null;
  },
  costArea(qq) {
    const p = qq.prompt;
    let m;
    if ((m = p.match(new RegExp(`costs \\$${NUM}\\. A big \\w+(?: \\w+)? has every length ${NUM} times as long, made of the same`)))) { const k = q(m[2]); return q(m[1]).mul(k).mul(k); }
    if ((m = p.match(new RegExp(`takes ${NUM} cans? of paint\\. A mural copy of it is enlarged ${NUM} times \\(every length\\)\\.`)))) { const k = q(m[2]); return q(m[1]).mul(k).mul(k); }
    if ((m = p.match(new RegExp(`is ${NUM} ft by ${NUM} ft\\. A bigger [\\w ]+ has every length ${NUM} times as long\\. \\w+ costs \\$${NUM} per sq ft\\.`)))) {
      const k = q(m[3]); return q(m[1]).mul(k).mul(q(m[2]).mul(k)).mul(q(m[4]));
    }
    return null;
  },
  pizzaDeal(qq) {
    const m = qq.prompt.match(new RegExp(`An? ${NUM}-inch pizza costs \\$${NUM}\\. An? ${NUM}-inch pizza \\(same thickness\\) costs \\$${NUM}\\.`));
    const d1 = q(m[1]), p1 = q(m[2]), d2 = q(m[3]), p2 = q(m[4]);
    const areaF = d2.div(d1).mul(d2.div(d1)), priceF = p2.div(p1);
    const c0 = areaF.cmp(priceF); // > 0: the big one gives more pizza per dollar
    return qq.choices.map(c => {
      let mm;
      if (/^They are the same deal$/.test(c)) return c0 === 0;
      if ((mm = c.match(new RegExp(`^The ${NUM}-inch: ${NUM} times the pizza for ${NUM} times the price$`)))) return q(mm[1]).eq(d2) && c0 > 0 && q(mm[2]).eq(areaF) && q(mm[3]).eq(priceF);
      if ((mm = c.match(new RegExp(`^The ${NUM}-inch: the big one is only ${NUM} times the pizza for ${NUM} times the price$`)))) return q(mm[1]).eq(d1) && c0 < 0 && q(mm[2]).eq(areaF) && q(mm[3]).eq(priceF);
      return false;
    });
  },
};

// ---------------------------------------------------------------- the world
const SIZES = { // area ranges a careful teacher accepts (sq ft unless noted)
  'tablecloth|sq ft': [4, 60], 'rug|sq ft': [4, 300], 'banner|sq ft': [2, 300], 'patio|sq ft': [20, 1500], 'garden bed|sq ft': [4, 400],
  'poster|sq in': [40, 2500], 'photo|sq in': [4, 400], 'sticker|sq in': [0.25, 60], 'poster|sq ft': [1, 40], 'photo|sq ft': [0.1, 10],
};
function worldProblems(qq, r) {
  const probs = [];
  const p = qq.prompt;
  let m;
  // the stated area must be the drawn shape's area
  const pic = picOf(qq);
  if (pic && (m = p.match(new RegExp(`\\(area ${NUM} square units?\\)`)))) {
    const A = drawnArea(pic);
    if (A && !A.eq(q(m[1]))) probs.push(`the drawn shape has area ${A}, the prompt says ${m[1]}`);
  }
  if (pic && (m = p.match(/(\d+) unit squares/)) && pic.shape?.kind === 'cells' && pic.shape.cells.length !== +m[1]) probs.push(`the drawing has ${pic.shape.cells.length} squares, the prompt says ${m[1]}`);
  if ((m = p.match(/\(perimeter (\d+) \w+, area (\d+) sq \w+\)/))) {
    const d = p.match(/^A (\d+) \w+ by (\d+) \w+ rectangle/);
    if (d && (2 * (+d[1] + +d[2]) !== +m[1] || +d[1] * +d[2] !== +m[2])) probs.push('the stated perimeter or area is not the rectangle\'s');
  }
  if ((m = p.match(/A (\w+(?: bed)?) has an area of ([\d.]+) (sq \w+)\./))) {
    const rng = SIZES[`${m[1]}|${m[3]}`];
    if (rng && (+m[2] < rng[0] || +m[2] > rng[1])) probs.push(`a ${m[1]} of ${m[2]} ${m[3]} is not a real ${m[1]}`);
  }
  if ((m = p.match(/A (room|yard|kitchen floor) is (\d+) ft by (\d+) ft\./)) && +m[2] * +m[3] < 40) probs.push(`a ${m[2]} ft by ${m[3]} ft ${m[1]} is too small for a real ${m[1]}`);
  if ((m = p.match(/A (yard|site|deck) plan .+ A real room has an area/))) probs.push(`a "room" on a ${m[1]} plan`);
  if (qq.family === 'onlyLength' && /grows by/.test(qq.choices.join('|'))) {
    const mm = p.match(new RegExp(`^Only the (length|width) of a ${NUM} by ${NUM} rectangle is multiplied by ${NUM}\\.`));
    const A = q(mm[2]).mul(q(mm[3])), grow = A.mul(q(mm[4])).sub(A);
    const c = qq.choices.find(x => /grows by/.test(x)); const g = c.match(/grows by (\d+)/);
    if (g && q(g[1]).eq(grow)) probs.push(`"${c}" (meant as wrong) is true`);
  }
  if (qq.family === 'whichMeasure' && (m = p.match(/^A (\d+) \w+ by (\d+) \w+ rectangle/)) && +m[1] === +m[2] && /long side|short side/.test(p)) probs.push('a square has no long side');
  if (r && typeof r === 'object' && 'n' in r && ['costArea'].includes(qq.family) && /dollars/.test(qq.unit) && r.mul(100).d !== 1) probs.push('not whole cents');
  return probs;
}

// ---------------------------------------------------------------- contract
const pick = arr => { const hits = arr.map((ok, i) => (ok ? i : -1)).filter(i => i >= 0); return hits.length ? hits[0] : -1; };
function runF(qq) { const f = F[qq.family]; return f ? f(qq) : undefined; }
export default {
  solve(qq) {
    let r;
    try { r = runF(qq); } catch { return undefined; }
    if (r == null) return undefined;
    if (qq.input === 'choice') return Array.isArray(r) ? pick(r) : undefined;
    if (qq.input === 'pair') return r;
    if (qq.input === 'frac') return r.pair;
    return r.value;
  },
  sane(qq) {
    let r;
    try { r = runF(qq); } catch (e) { return `could not read the item (${e.message})`; }
    const probs = [];
    if (qq.input === 'choice' && Array.isArray(r)) {
      const n = r.filter(Boolean).length;
      if (n === 0) probs.push('no choice is right');
      if (n > 1) probs.push(`${n} choices are right: ${qq.choices.filter((_, i) => r[i]).join(' | ')}`);
    }
    try { probs.push(...worldProblems(qq, r)); } catch (e) { probs.push(`could not check the world (${e.message})`); }
    return probs.join('; ');
  },
};
