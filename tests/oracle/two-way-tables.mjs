// Oracle for the lesson "two-way-tables" (two-way tables, relative frequencies, segmented bar graphs; 8.SP.A.4).
// Written from what the student sees only (docs/lessons/QUALITY_LAYER.md, "O: the oracle"): the prompt, the board,
// the choices and the drawn picture (table cells that are shown, bar segments, tree branches). Cells or branches the
// picture hides ("?", listed in `hide`) and blank cells (null) are never read. The highlight data (`focus`: the ring,
// glow and reveal drawn only after a miss) is never used.
//
// The words of each survey are read through a small vocabulary per drawn label ("No dog" ↔ "adults without a dog",
// "don’t own a dog"), matched longest-first and only for the labels this item's picture shows.
import { nums, round } from '../../tools/quality/oracle-kit.mjs';

// ---------------------------------------------------------------- vocabulary: label → the phrases that name it
const VOCAB = {
  'Curfew': ['a curfew'], 'No curfew': ['no curfew'],
  'Chores': ['do chores'], 'No chores': ['skip chores'],
  'Bus': ['bus riders', 'ride the bus'], 'No bus': ['don’t ride the bus'],
  'Breakfast': ['breakfast eaters', 'eat school breakfast'], 'No breakfast': ['skip school breakfast'],
  'Dog': ['dog owners', 'own a dog'], 'No dog': ['without a dog', 'don’t own a dog'],
  'Walks': ['daily walkers', 'walk every day'], 'No walks': ['don’t walk every day'],
  'Phone': ['their own phone'], 'No phone': ['without a phone', 'don’t have a phone'],
  'Reads': ['read for fun'], 'Rarely': ['rarely read for fun'],
  'House': ['in a house'], 'Apartment': ['in an apartment'], 'Other': ['in other homes', 'another kind of home'],
  'Pet': ['pet owners', 'have a pet'], 'No pet': ['without a pet', 'don’t have a pet'],
  'Card': ['with a library card', 'have a library card'], 'No card': ['without a library card', 'don’t have a library card'],
  'Club': ['homework-club members', 'go to homework club'], 'No club': ['skip homework club'],
  'Grade 6': ['sixth grade'], 'Grade 7': ['seventh grade'], 'Grade 8': ['eighth grade'],
  'Pizza': ['pizza'], 'Salad': ['salad'], 'Tacos': ['taco'],
  'Garden': ['with a garden', 'have a garden'], 'No garden': ['without a garden', 'don’t have a garden'],
  'Market': ['farmers-market shoppers', 'shop at the farmers market'], 'No market': ['skip the market', 'skip the farmers market'],
  'Music': ['take music lessons'], 'No music': ['don’t take music lessons'],
  'Sport': ['athletes', 'play a sport'], 'No sport': ['don’t play a sport'],
  'Before 10': ['before 10'], 'After 10': ['after 10'],
  'Car': ['by car'], 'Walk': ['walkers', 'walk to school'],
  'Teens': ['teens'], 'Adults': ['adults'],
  'Comedy': ['comedy'], 'Action': ['action'], 'Drama': ['drama'],
  // screening tables: truth (rows) × test (columns)
  'Has it': ['have the condition', 'have it'], 'Doesn’t': ['don’t have it', 'don’t have the condition'],
  'Positive': ['test positive'], 'Negative': ['test negative'],
  'Metal': ['hold metal'], 'No metal': ['hold no metal', 'no metal'],
  'Beep': ['make it beep'], 'No beep': ['pass quietly'],
  'Spam': ['are spam', 'spam emails'], 'Not spam': ['are not spam', 'not spam'],
  'Flagged': ['get flagged', 'flagged emails'], 'Through': ['get through'],
};
const norm = s => String(s ?? '').replace(/'/g, '’').toLowerCase();

/** the labels a phrase names, in reading order: [{ label, dim, i }] (dim 'r' row / 'c' column of `labels`) */
function hits(text, labels) {
  let t = norm(text);
  const cands = [];
  for (const L of labels) for (const ph of VOCAB[L.label] ?? [norm(L.label)]) cands.push({ ph: norm(ph), L });
  cands.sort((a, b) => b.ph.length - a.ph.length);
  const out = [];
  for (const c of cands) {
    let k = t.indexOf(c.ph);
    while (k >= 0) {
      out.push({ ...c.L, pos: k });
      t = t.slice(0, k) + '\u0001'.repeat(c.ph.length) + t.slice(k + c.ph.length);
      k = t.indexOf(c.ph);
    }
  }
  return out.sort((a, b) => a.pos - b.pos);
}
const labelsOf = (rows, cols) => [...rows.map((label, i) => ({ label, dim: 'r', i })), ...cols.map((label, i) => ({ label, dim: 'c', i }))];
/** one row hit and/or one column hit of a phrase: { r, c } (undefined when absent); null when a dimension repeats */
function rc(text, labels) {
  const h = hits(text, labels);
  const rs = [...new Set(h.filter(x => x.dim === 'r').map(x => x.i))], cs = [...new Set(h.filter(x => x.dim === 'c').map(x => x.i))];
  if (rs.length > 1 || cs.length > 1) return null;
  return { r: rs[0], c: cs[0], n: (rs.length ? 1 : 0) + (cs.length ? 1 : 0), first: h[0] };
}

// ---------------------------------------------------------------- the picture
const picOf = q => q.data?.picture?.pic;
/** the table as the student sees it: v(r, c) → number or null (blank or "?"); R rows, C cols, margins at index R / C */
function tableOf(T) {
  if (!T) return null;
  const hide = new Set(T.hide ?? []);
  const R = T.rows.length, C = T.cols.length;
  const v = (r, c) => { if (hide.has(`${r},${c}`)) return null; const x = T.vals?.[r]?.[c]; return typeof x === 'number' ? x : null; };
  const labels = labelsOf(T.rows, T.cols);
  return { T, R, C, v, hide, labels, pct: T.fmt === 'pct' };
}
/** a cell / margin with a fallback to adding up the shown cells (row r of R = column margin) */
function cellOr(t, r, c) {
  const x = t.v(r, c);
  if (x !== null) return x;
  if (r === t.R && c < t.C) { let s = 0; for (let i = 0; i < t.R; i++) { const y = t.v(i, c); if (y === null) return null; s += y; } return s; }
  if (c === t.C && r < t.R) { let s = 0; for (let j = 0; j < t.C; j++) { const y = t.v(r, j); if (y === null) return null; s += y; } return s; }
  return null;
}
/** the count (or joint percent) of the people a phrase names: a cell (row + column), a margin (one of them) or everyone */
function countOf(t, h) {
  if (!h) return null;
  if (h.r !== undefined && h.c !== undefined) return cellOr(t, h.r, h.c);
  if (h.r !== undefined) return cellOr(t, h.r, t.C);
  if (h.c !== undefined) return cellOr(t, t.R, h.c);
  return cellOr(t, t.R, t.C);
}

// ---------------------------------------------------------------- rounding the prompt asks for
function places(p) {
  if (/nearest tenth/i.test(p)) return 1;
  if (/nearest hundredth|to the hundredth/i.test(p)) return 2;
  if (/nearest (whole )?(percent|degree|number|whole)/i.test(p)) return 0;
  return null;
}
const clean = v => Number(Number(v).toFixed(9));
const answerNum = (p, v) => (v === null || v === undefined || !Number.isFinite(v) ? undefined : places(p) === null ? clean(v) : round(v, places(p)));
const pctOf = (part, whole) => (part === null || whole === null || whole === 0 ? null : (100 * part) / whole);

// ---------------------------------------------------------------- a 2×2 (or R×C) joint table from statements
/** fill the unknowns of a table (cells + margins + grand total) by row and column sums; returns the filled vals */
function fillTable(vals, R, C) {
  const g = vals.map(r => r.slice());
  for (let pass = 0; pass < 20; pass++) {
    let changed = false;
    for (let r = 0; r <= R; r++) { // row r: cells 0..C-1 add to cell C
      const unk = []; let s = 0;
      for (let c = 0; c < C; c++) { if (g[r][c] === null) unk.push(c); else s += g[r][c]; }
      if (g[r][C] === null && unk.length === 0) { g[r][C] = s; changed = true; } else if (g[r][C] !== null && unk.length === 1) { g[r][unk[0]] = g[r][C] - s; changed = true; }
    }
    for (let c = 0; c <= C; c++) {
      const unk = []; let s = 0;
      for (let r = 0; r < R; r++) { if (g[r][c] === null) unk.push(r); else s += g[r][c]; }
      if (g[R][c] === null && unk.length === 0) { g[R][c] = s; changed = true; } else if (g[R][c] !== null && unk.length === 1) { g[unk[0]][c] = g[R][c] - s; changed = true; }
    }
    if (!changed) break;
  }
  return g;
}

// ---------------------------------------------------------------- association thresholds (percentage points)
const ASSOC = 10, SAME = 5;

// ---------------------------------------------------------------- solve
function solve(q) {
  const p = q.prompt, P = picOf(q), f = q.family;
  const t = P?.table ? tableOf(P.table) : null;
  const B = P?.kind === 'bars' ? P.bars : P?.bars?.spec ?? null;
  let m;
  switch (f) {
    case 'rowPct': case 'colPct': case 'condFromJoint': {
      m = p.match(/Of the (.+?), what percent (.+?)\?/);
      const G = rc(m[1], t.labels), W = rc(m[2], t.labels);
      if (!G || !W || G.n !== 1 || W.n !== 1) return undefined;
      const h = { r: G.r ?? W.r, c: G.c ?? W.c };
      return answerNum(p, pctOf(countOf(t, h), countOf(t, G)));
    }
    case 'matchQuestion': {
      const [a, b] = nums(p.replace(/^.*?worked out/, ''));
      return choiceIdx(q, c => {
        let x;
        if ((x = c.match(/^Of the (.+?), what percent (.+?)\?$/))) {
          const G = rc(x[1], t.labels), W = rc(x[2], t.labels);
          if (!G || !W) return false;
          return countOf(t, { r: G.r ?? W.r, c: G.c ?? W.c }) === a && countOf(t, G) === b;
        }
        if ((x = c.match(/^What percent of all (\d+) \S+(?: \S+)? (.+?)\?$/))) {
          const W = rc(x[2], t.labels);
          return W && countOf(t, W) === a && Number(x[1]) === b && countOf(t, {}) === b;
        }
        return false;
      });
    }
    case 'jointPct': case 'marginalPct': case 'chanceAll': {
      m = p.match(/(?:What percent of all \d+ [a-z ]+?|chance \(as a percent\) that they) ((?:are|have|don’t|go|walk|ride|eat|skip|play|take|own|do|read|rarely|live|chose|shop).+?)\?/);
      if (!m) return undefined;
      const W = rc(m[1], t.labels);
      return answerNum(p, pctOf(countOf(t, W), countOf(t, {})));
    }
    case 'chanceGroup': {
      m = p.match(/from the (.+?) only\. What is the chance \(as a percent\) that they (.+?)\?/);
      const G = rc(m[1], t.labels), W = rc(m[2], t.labels);
      return answerNum(p, pctOf(countOf(t, { r: G.r ?? W.r, c: G.c ?? W.c }), countOf(t, G)));
    }
    case 'chanceWho': {
      m = p.match(/chosen at random (.+?)\. What is the chance that they (.+?)\?/);
      const from = m[1], W = rc(m[2], t.labels);
      let v = null;
      if (/^from all \d+$/.test(from)) v = pctOf(countOf(t, W), countOf(t, {}));
      else if (/^from the /.test(from)) {
        const G = rc(from, t.labels);
        if (G && G.n === 1) v = pctOf(countOf(t, { r: G.r ?? W.r, c: G.c ?? W.c }), countOf(t, G));
      }
      if (v === null) return choiceIdx(q, c => /can’t tell/i.test(c));
      return choiceIdx(q, c => /%$/.test(c) && Math.abs(nums(c)[0] - v) < 0.05 + 1e-9);
    }
    case 'jointRound': {
      const cells = [];
      for (let r = 0; r < t.R; r++) for (let c = 0; c < t.C; c++) cells.push(t.v(r, c));
      const sum = cells.reduce((s, x) => s + x, 0);
      const said = nums(p.match(/adds up to ([\d.]+)%/)[1])[0];
      const slack = 0.05 * cells.length + 1e-9;
      const ok = Math.abs(round(sum, 1) - said) < 1e-9 && Math.abs(said - 100) <= slack;
      return choiceIdx(q, c => (ok ? /^Nothing:/.test(c) : /^Start over/.test(c)));
    }
    case 'marginalFromJoint': {
      m = p.match(/What percent of all the [a-z ]+? (?=(?:are|have|don’t|go|walk|ride|eat|skip|play|take|own|do|read|rarely|live|chose|shop))(.+?)\?/);
      const W = rc(m[1], t.labels);
      if (!W || W.n !== 1) return undefined;
      let s = 0;
      if (W.r !== undefined) for (let c = 0; c < t.C; c++) s += t.v(W.r, c);
      else for (let r = 0; r < t.R; r++) s += t.v(r, W.c);
      return answerNum(p, s);
    }
    case 'weightedTrap': {
      m = p.match(/What percent of all (\d+) really (.+?)\?/);
      const W = rc(m[2], t.labels);
      return answerNum(p, pctOf(countOf(t, W), Number(m[1])));
    }
    case 'nameType': {
      const s = (p.match(/“(.+?)”/) ?? [])[1] ?? '';
      let kind;
      if (/^Of the /.test(s)) kind = 'Conditional';
      else if ((m = s.match(/^[\d.]+% of all \d+ (?:eighth graders|students|adults|families|people) (?:are (?:eighth graders|students|adults|families|people) )?(.+)$/))) {
        const W = rc(m[1], t.labels);
        if (!W) return undefined;
        kind = W.n === 2 ? 'Joint' : W.n === 1 ? 'Marginal' : undefined;
      }
      return kind ? choiceIdx(q, c => c.startsWith(kind + ':')) : undefined;
    }
    case 'nameWhole': {
      const s = (p.match(/“(.+?)”/) ?? [])[1] ?? '';
      let G;
      if ((m = s.match(/^(?:Of|Among) the (.+?), what percent/))) G = rc(m[1], t.labels);
      else if ((m = s.match(/^What percent of the (.+?)\?$/))) { const h = hits(m[1], t.labels); G = h.length === 2 ? (h[0].dim === 'r' ? { r: h[0].i, n: 1 } : { c: h[0].i, n: 1 }) : null; }
      else if (/^What percent of all /.test(s)) G = { n: 0 };
      if (!G) return undefined;
      const want = countOf(t, G);
      return choiceIdx(q, c => {
        if (/^All \d+/.test(c)) return G.n === 0 && nums(c)[0] === want;
        const x = c.match(/^The (\d+) (.+)$/);
        if (!x) return false;
        const H = rc(x[2], t.labels);
        return G.n === 1 && H && H.n === 1 && H.r === G.r && H.c === G.c && Number(x[1]) === want;
      });
    }
    case 'countUnknown': {
      m = p.match(/How many (?:of the [a-z ]+ surveyed|of them) (.+?)\?/);
      const W = rc(m[1], t.labels);
      const N = (p.match(/The survey asked ([\d,]+) /) ?? [])[1];
      if (!N) return choiceIdx(q, c => /^Can’t tell/.test(c));
      const v = (countOf(t, W) * nums(N)[0]) / 100;
      return choiceIdx(q, c => !/^Can’t/.test(c) && Math.abs(nums(c)[0] - v) < 1e-6);
    }
    case 'barSegment': {
      m = p.match(/How long is the (.+?) segment of the (.+?) bar/);
      const byRow = /each row group/.test(p);
      const seg = m[1], bar = m[2];
      if (byRow) {
        const r = t.T.rows.indexOf(bar), c = t.T.cols.indexOf(seg);
        return answerNum(p, pctOf(cellOr(t, r, c), cellOr(t, r, t.C)));
      }
      const c = t.T.cols.indexOf(bar), r = t.T.rows.indexOf(seg);
      return answerNum(p, pctOf(cellOr(t, r, c), cellOr(t, t.R, c)));
    }
    case 'pickGraph': {
      const byRows = /rows\?/.test(p);
      const ok = g => {
        const want = byRows
          ? t.T.rows.map((_, r) => t.T.cols.map((_, c) => pctOf(cellOr(t, r, c), cellOr(t, r, t.C))))
          : t.T.cols.map((_, c) => t.T.rows.map((_, r) => pctOf(cellOr(t, r, c), cellOr(t, t.R, c))));
        if (g.groups.join('|') !== (byRows ? t.T.rows : t.T.cols).join('|')) return false;
        if (g.pcts.some((row, i) => row.some((x, j) => Math.abs(x - want[i][j]) > 0.05))) return false;
        if (g.order && g.order.some(o => o.join() !== o.map((_, k) => k).join() || o.join() !== g.order[0].join())) return false;
        if (g.scale && g.scale.some(s => Math.abs(s - 1) > 1e-9)) return false;
        return true;
      };
      return choiceIdx(q, c => { const k = P.names.indexOf(c.replace(/^Graph /, '')); return k >= 0 && ok(P.graphs[k]); });
    }
    case 'readSeg': {
      m = p.match(/what percent of the (.+?) (come|chose|ride|walk|are)\b(.*)\?/);
      const L = labelsOf(B.groups, B.cats);
      const G = rc(m[1], L), W = rc(m[2] + m[3], L);
      if (!G || !W || G.r === undefined || W.c === undefined) return undefined;
      return answerNum(p, B.pcts[G.r][W.c]);
    }
    case 'readSentence': {
      m = p.match(/the (.+?) segment of the (.+?) bar is ([\d.]+)%/);
      const s = B.cats.indexOf(m[1]), g = B.groups.indexOf(m[2]), v = Number(m[3]);
      const L = labelsOf(B.groups, B.cats);
      return choiceIdx(q, c => {
        const x = c.match(/^([\d.]+)% of the (.+)$/);
        if (!x || Number(x[1]) !== v || /^all /.test(x[2])) return false;
        const h = hits(x[2], L);
        return h.length === 2 && h[0].dim === 'r' && h[0].i === g && h[1].dim === 'c' && h[1].i === s;
      });
    }
    case 'moreWho': {
      m = p.match(/Which group has more (.+?)\?/);
      const L = labelsOf(B.groups, B.cats);
      const W = rc(m[1], L);
      const sizes = (m = p.match(/\(there are (\d+) (.+?) and (\d+) (.+?)\)/)) ? [Number(m[1]), Number(m[3])] : null;
      if (!sizes) return choiceIdx(q, c => /^Can’t tell/.test(c));
      // the first size belongs to the group the text names first
      const g1 = rc(m[2], L), g2 = rc(m[4], L);
      const n = [0, 0]; n[g1.r] = sizes[0]; n[g2.r] = sizes[1];
      const k = n.map((N, g) => (N * B.pcts[g][W.c]) / 100);
      if (Math.abs(k[0] - k[1]) < 1e-9) return choiceIdx(q, c => /^Both/.test(c));
      const big = k[0] > k[1] ? 0 : 1;
      return choiceIdx(q, c => { if (!/^The /.test(c)) return false; const h = rc(c, L); return h && h.n === 1 && h.r === big; });
    }
    case 'countFromBar': {
      m = p.match(/How many (.+?)\?/);
      const L = labelsOf(B.groups, B.cats);
      const W = rc(m[1], L);
      if (!W || W.r === undefined || W.c === undefined) return undefined;
      let size;
      if (B.sizes) size = B.sizes[W.r];
      else {
        const x = p.match(/A survey asked ([\d,]+) [a-z ]+?; (\d+)% of them (.+?)\./);
        const H = rc(x[3], L);
        const share = H.r === W.r ? Number(x[2]) : 100 - Number(x[2]);
        size = (nums(x[1])[0] * share) / 100;
      }
      return answerNum(p, (size * B.pcts[W.r][W.c]) / 100);
    }
    case 'assocTable': case 'assocBars': case 'rawCountClaim': case 'rewriteClaim': case 'pointsDiff':
      return assoc(q, t, B);
    case 'treeLeaf': {
      const T = P.tree, hide = new Set(T.hide ?? []);
      const br = (i, j) => (hide.has(`b${i}${j}`) ? null : T.second[i][j].p);
      const L = labelsOf(T.first.map(x => x.label), T.second[0].map(x => x.label));
      // the branch values are stated in the prompt too; the tree is what the student reads
      m = p.match(/What percent of ALL the [a-z ]+? (?=(?:are|have|don’t|go|walk|ride|eat|skip|play|take|own|do|read|rarely|live|chose|shop|hold))(.+?)\?/);
      const W = rc(m[1], L);
      if (!W || W.n !== 2) return undefined;
      const a = hide.has(`f${W.r}`) ? null : T.first[W.r].p, b = br(W.r, W.c);
      if (a === null || b === null) return undefined;
      return answerNum(p, (a * b) / 100);
    }
    case 'treeMissing': {
      const T = P.tree, hide = new Set(T.hide ?? []);
      const h = [...hide].find(x => /^b\d\d$/.test(x));
      const i = Number(h[1]), j = Number(h[2]);
      const sib = T.second[i].filter((_, k) => k !== j).map((x, k) => (!hide.has(`b${i}${k >= j ? k + 1 : k}`) ? x.p : null));
      if (sib.length && sib.every(x => x !== null)) return answerNum(p, 100 - sib.reduce((s, x) => s + x, 0));
      if ((m = p.match(/shows .+? as ([\d.]+)% of the [a-z ]+, and ([\d.]+)% of ALL/))) return answerNum(p, (100 * Number(m[2])) / Number(m[1]));
      const leaf = T.leaf?.[i]?.[j], first = T.first[i].p;
      if (leaf !== null && leaf !== undefined && !hide.has(`l${i}${j}`) && first) return answerNum(p, (100 * leaf) / first);
      return undefined;
    }
    case 'fillCell': {
      const vals = t.T.vals.map((row, r) => row.map((_, c) => t.v(r, c)));
      const g = fillTable(vals, t.R, t.C);
      const h = [...t.hide][0].split(',').map(Number);
      const v = g[h[0]][h[1]];
      return v === null ? undefined : answerNum(p, round(v, 6));
    }
    case 'fromConditional': {
      // statements → a joint table in percents of everyone
      const R = t.R, C = t.C;
      const vals = Array.from({ length: R + 1 }, () => Array(C + 1).fill(null));
      vals[R][C] = 100;
      const conds = [];
      const sents = p.split(/(?<=\.)\s+(?=[A-Z\d])/);
      let ask = null;
      for (const s of sents) {
        let x;
        if ((x = s.match(/^What percent of all the [a-z ]+? (?=(?:are|have|don’t|go|walk|ride|eat|skip|play|take|own|do|read|rarely|live|chose|shop))(.+?)\?/))) ask = rc(x[1], t.labels);
        else if ((x = s.match(/^Of the (.+?), ([\d.]+)% (.+?)\.$/))) conds.push({ G: rc(x[1], t.labels), W: rc(x[3], t.labels), v: Number(x[2]) });
        else if ((x = s.match(/^([\d.]+)% of all the [a-z ]+? (?=(?:are|have|don’t|go|walk|ride|eat|skip|play|take|own|do|read|rarely|live|chose|shop))(.+?)\.$/))) {
          const W = rc(x[2], t.labels); setCell(vals, R, C, W, Number(x[1]));
        } else if ((x = s.match(/^([\d.]+)% of the [a-z ]+? (?=(?:are|have|don’t|go|walk|ride|eat|skip|play|take|own|do|read|rarely|live|chose|shop))(.+?)\.$/))) {
          const W = rc(x[2], t.labels); setCell(vals, R, C, W, Number(x[1]));
        }
      }
      let g = fillTable(vals, R, C);
      for (let k = 0; k < 3; k++) {
        for (const c of conds) {
          const whole = getCell(g, R, C, c.G);
          if (whole !== null) setCell(g, R, C, { r: c.G.r ?? c.W.r, c: c.G.c ?? c.W.c }, (c.v * whole) / 100);
        }
        g = fillTable(g, R, C);
      }
      if (!ask) return undefined;
      const v = getCell(g, R, C, ask);
      return v === null ? undefined : answerNum(p, round(v, 6));
    }
    case 'screenWord': {
      m = p.match(/What do you call the (?:[\d,]+ )?\S+ that (.+?)(?: \([\d,]+ of them here\))?\?$/);
      const s = norm(m[1]);
      const truthNeg = /don’t have it|hold no metal|are not spam/.test(s);
      const truthPos = !truthNeg && /have the condition|have it|hold metal|are spam/.test(s);
      const testPos = /test positive|make it beep|get flagged/.test(s), testNeg = /test negative|pass quietly|get through/.test(s);
      if ((truthPos === truthNeg) || testPos === testNeg) return undefined;
      const name = `${truthPos === testPos ? 'True' : 'False'} ${testPos ? 'positives' : 'negatives'}`;
      return choiceIdx(q, c => c === name);
    }
    case 'screenPPV': {
      // rows: truth (yes first), columns: test (positive first) — read from the drawn labels
      const posC = t.T.cols.findIndex(c => /^(Positive|Beep|Flagged)$/.test(c)), yesR = t.T.rows.findIndex(r => /^(Has it|Metal|Spam)$/.test(r));
      if (posC < 0 || yesR < 0) return undefined;
      return answerNum(p, pctOf(cellOr(t, yesR, posC), cellOr(t, t.R, posC)));
    }
    case 'confounder':
      if (/What kind of study/.test(p)) return choiceIdx(q, c => /^Randomly assign/.test(c));
      if (/explain the link without one causing the other/.test(p)) return choiceIdx(q, c => /^Something else: .+ could affect both\.$/.test(c));
      return undefined;
    case 'combineGroups': {
      m = p.match(/goes in the (.+?) slice/);
      const s = B.cats.indexOf(m[1]);
      const sizes = B.sizes;
      const tot = sizes.reduce((a, b) => a + b, 0);
      const part = sizes.reduce((a, n, g) => a + (n * B.pcts[g][s]) / 100, 0);
      return answerNum(p, pctOf(part, tot));
    }
    case 'pieAngle': {
      m = p.match(/How many degrees is the (.+?) slice/);
      const c = t.T.cols.indexOf(m[1]), r = t.T.rows.indexOf(m[1]);
      const part = c >= 0 ? cellOr(t, t.R, c) : cellOr(t, r, t.C);
      return answerNum(p, (360 * part) / cellOr(t, t.R, t.C));
    }
    default: return undefined;
  }
}
function getCell(g, R, C, h) {
  if (!h) return null;
  const r = h.r ?? R, c = h.c ?? C;
  return g[r][c];
}
function setCell(g, R, C, h, v) {
  if (!h) return;
  const r = h.r ?? R, c = h.c ?? C;
  if (g[r][c] === null) g[r][c] = v;
}
function choiceIdx(q, pred) {
  const hitsI = (q.choices ?? []).map((c, i) => (pred(c, i) ? i : -1)).filter(i => i >= 0);
  return hitsI.length === 1 ? hitsI[0] : -1;
}

// ---------------------------------------------------------------- association questions
/** row-conditional shares of a table, or the bar percents */
function shares(t, B) {
  if (t) return t.T.rows.map((_, r) => t.T.cols.map((_, c) => pctOf(cellOr(t, r, c), cellOr(t, r, t.C))));
  return B.pcts;
}
function assoc(q, t, B) {
  const p = q.prompt, f = q.family;
  const L = t ? t.labels : labelsOf(B.groups, B.cats);
  const S = shares(t, B);
  let m;
  if (f === 'pointsDiff') {
    m = p.match(/Compare the (.+?) with the (.+?): how many percentage points apart are the percents who (.+?)\?/);
    const g1 = rc(m[1], L), g2 = rc(m[2], L), W = rc(m[3], L);
    return answerNum(p, Math.abs(S[g1.r][W.c] - S[g2.r][W.c]));
  }
  if (f === 'assocTable') {
    m = p.match(/^A survey asked/);
    // the outcome the choices name: "more likely to <W>"
    const ch = q.choices.map(c => {
      let x;
      if ((x = c.match(/^Yes: the (.+?) are more likely to (.+?)\.+$/))) { const G = rc(x[1], L), W = rc(x[2], L); return { yes: true, g: G?.r, w: W?.c }; }
      if ((x = c.match(/^No: about the same share of each group (.+?)\.+$/))) { const W = rc(x[1], L); return { yes: false, w: W?.c }; }
      return null;
    });
    const w = ch.find(x => x)?.w;
    const d = S[0][w] - S[1][w];
    if (Math.abs(d) <= SAME) return ch.findIndex(x => x && !x.yes);
    if (Math.abs(d) < ASSOC) return -1;
    const big = d > 0 ? 0 : 1;
    return choiceIdx(q, (_, i) => ch[i] && ch[i].yes && ch[i].g === big && ch[i].w === w);
  }
  if (f === 'assocBars') {
    const diffs = B.cats.map((_, c) => Math.abs(B.pcts[0][c] - B.pcts[1][c]));
    const mx = Math.max(...diffs);
    return choiceIdx(q, c => {
      let x;
      if ((x = c.match(/^A possible association: the (.+?) share is quite different/))) { const k = B.cats.indexOf(x[1]); return k >= 0 && diffs[k] >= ASSOC; }
      if (/^Little or no association/.test(c)) return mx <= SAME;
      return false;
    });
  }
  if (f === 'rawCountClaim') {
    return choiceIdx(q, c => {
      const x = c.match(/^No: (.+?) are a bigger group\. Compare percents: (.+?) are more likely to (.+?)\.$/);
      if (!x) return false; // "Yes: 81 is more than 52" and "divide both counts by all N" compare counts, not shares
      const big = rc(x[1], L), G = rc(x[2], L), W = rc(x[3], L);
      if (!big || !G || !W || big.r === undefined || G.r === undefined || W.c === undefined) return false;
      const other = 1 - G.r;
      return S[G.r][W.c] - S[other][W.c] >= ASSOC / 2 && cellOr(t, big.r, t.C) > cellOr(t, 1 - big.r, t.C);
    });
  }
  if (f === 'rewriteClaim') {
    return choiceIdx(q, c => {
      const x = c.match(/^(.+?) were more likely to (.+?) \(([\d.]+)% vs ([\d.]+)%\)\.$/);
      if (!x) return false;
      const G = rc(x[1], L), W = rc(x[2], L);
      if (!G || !W || G.r === undefined || W.c === undefined) return false;
      const a = S[G.r][W.c], b = S[1 - G.r][W.c];
      return Math.abs(a - Number(x[3])) < 0.05 && Math.abs(b - Number(x[4])) < 0.05 && a - b >= ASSOC / 2;
    });
  }
  return undefined;
}

// ---------------------------------------------------------------- sane: what is impossible or unfair
function sane(q) {
  const out = [];
  const p = q.prompt, P = picOf(q), f = q.family;
  const t = P?.table ? tableOf(P.table) : null;
  // tables: counts are whole, not negative, and add up where every value is shown
  if (t) {
    for (let r = 0; r <= t.R; r++) for (let c = 0; c <= t.C; c++) {
      const v = t.T.vals?.[r]?.[c];
      if (typeof v !== 'number') continue;
      if (v < 0) out.push('a negative cell');
      if (!t.pct && !Number.isInteger(v)) out.push('a fractional count');
    }
    const all = (r, c) => t.T.vals?.[r]?.[c];
    for (let r = 0; r <= t.R; r++) {
      const row = [...Array(t.C).keys()].map(c => all(r, c));
      if (row.every(x => typeof x === 'number') && typeof all(r, t.C) === 'number' && Math.abs(row.reduce((s, x) => s + x, 0) - all(r, t.C)) > (t.pct ? 0.21 : 1e-9) && f !== 'jointRound') out.push(`row ${r} does not add up to its total`);
    }
    for (let c = 0; c <= t.C; c++) {
      const col = [...Array(t.R).keys()].map(r => all(r, c));
      if (col.every(x => typeof x === 'number') && typeof all(t.R, c) === 'number' && Math.abs(col.reduce((s, x) => s + x, 0) - all(t.R, c)) > (t.pct ? 0.21 : 1e-9) && f !== 'jointRound') out.push(`column ${c} does not add up to its total`);
    }
    const m = p.match(/A survey asked ([\d,]+) /);
    if (m && !t.pct && typeof all(t.R, t.C) === 'number' && nums(m[1])[0] !== all(t.R, t.C)) out.push('the stated survey size is not the table total');
    if (/most|biggest/.test(p) && t && !t.pct) { /* nothing asked as "most" here */ }
  }
  // bars: each bar adds to 100%
  const B = P?.kind === 'bars' ? P.bars : P?.bars?.spec ?? null;
  if (B?.pcts) for (const row of B.pcts) if (Math.abs(row.reduce((s, x) => s + x, 0) - 100) > 1e-6) out.push('a 100% bar that does not add up to 100%');
  if (P?.tree) {
    const T = P.tree;
    if (Math.abs(T.first.reduce((s, x) => s + (x.p ?? 0), 0) - 100) > 1e-9 && T.first.every(x => x.p !== null)) out.push('first branches do not add to 100%');
    T.second.forEach(br => { if (br.every(x => x.p !== null) && Math.abs(br.reduce((s, x) => s + x.p, 0) - 100) > 1e-9) out.push('second branches do not add to 100%'); });
  }
  // the answer and its rounding
  let s;
  try { s = solve(q); } catch { s = undefined; }
  if (q.input === 'choice' && s === -1) out.push('no single right choice');
  if (q.input === 'num' && typeof s === 'number') {
    if (places(p) === null && Math.abs(s * 100 - Math.round(s * 100)) > 1e-6) out.push(`the exact answer ${s} needs rounding, but the question does not say how`);
    if (q.unit === 'students' || /^How many/.test(p)) if (!Number.isInteger(round(s, 6))) out.push('a fractional number of people');
    if (q.unit === '%' && (s < 0 || s > 100)) out.push('a percent outside 0–100%');
  }
  // association questions near the threshold are unfair either way
  if (['assocTable', 'assocBars'].includes(f)) {
    const S = t ? shares(t, B) : B.pcts;
    const d = Math.max(...S[0].map((x, c) => Math.abs(x - S[1][c])));
    if (d > SAME && d < ASSOC) out.push(`the groups differ by ${round(d, 1)} points: neither "associated" nor "about the same" is clear`);
  }
  if (f === 'rawCountClaim' && t) {
    const S = shares(t, B);
    const m = p.match(/so (.+?) are more likely to (.+?)\.”/);
    if (m) {
      const G = rc(m[1], t.labels), W = rc(m[2], t.labels);
      if (G && W && G.r !== undefined && W.c !== undefined && S[G.r][W.c] >= S[1 - G.r][W.c]) out.push('Ravi’s conclusion is true by percents too');
    }
  }
  return [...new Set(out)].join('; ');
}

export default { solve, sane };
