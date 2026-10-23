// Oracle for the lesson "pie-charts" (circle graphs with percents, primary.data.make-pie-chart, grade 7). Written from
// what the student sees only: the prompt, the board (count tables read with texTable), the choices and the drawn
// picture (counts, drawn angles, where each label sits). Every answer is worked out from the data: shares as count over
// the stated whole, percent = share × 100, angle = share × 360, rounding only at the end; conceptual choices are judged
// by testing each statement. See docs/lessons/QUALITY_LAYER.md, "O: the oracle".
import { nums, texTable, Q, round, choiceWhere } from '../../tools/quality/oracle-kit.mjs';

const EPS = 1e-9;

// ---------------------------------------------------------------- reading
/** '33⅓' → 33.333…, '12.5' → 12.5 */
const pv = s => { const m = String(s).match(/(\d+(?:\.\d+)?)(⅓|⅔)?/); return m ? Number(m[1]) + (m[2] === '⅓' ? 1 / 3 : m[2] === '⅔' ? 2 / 3 : 0) : NaN; };
/** the count table on the board: { rows: [{ name, v }], total (Total/Asked row or null), totalName } */
function table(q) {
  const T = texTable(q.board ?? '');
  const rows = []; let total = null, totalName = null;
  for (const r of T) {
    if (r.length < 2) continue;
    const name = r[0].trim(), v = nums(r[1])[0];
    if (/^(Total|Asked|Answered)$/.test(name)) { total = v; totalName = name; } else rows.push({ name, v });
  }
  return { rows, total, totalName, sum: rows.reduce((s, r) => s + r.v, 0) };
}
const pic = q => q.data?.picture ?? null;
const catSum = P => (P?.cats ?? []).reduce((s, c) => s + c.count, 0);
/** the angles the picture draws: its own list, or the exact shares of 360° (the closed list is within 1° of these) */
function drawnAngles(P) {
  if (P?.angles) return [...P.angles];
  const n = P?.n ?? catSum(P);
  return (P?.cats ?? []).map(c => (360 * c.count) / n);
}
/** "to the nearest tenth / whole" → places, or null when no rounding is asked */
function placesOf(p) {
  if (/nearest tenth/.test(p)) return 1;
  if (/nearest hundredth/.test(p)) return 2;
  if (/nearest whole|nearest degree|nearest percent/.test(p)) return 0;
  return null;
}
/** exact a/b × k rounded to `places`; and whether it is a tie (exact .5 at that place) */
function roundQ(a, b, k, places) {
  const num = a * k * 10 ** places, den = b;
  const two = 2 * num;
  const tie = two % den === 0 && (two / den) % 2 === 1;
  return { v: round((a * k) / b, places), tie, exact: (a * k) / b };
}
/** does a/b × k have a finite decimal with at most `max` places? */
function terminates(a, b, k, max = 2) {
  const f = Q(a * k, b);
  return Number.isInteger(f.n * 10 ** max / f.d) || Math.abs((f.n * 10 ** max) % f.d) < EPS;
}
const lc = s => String(s).toLowerCase();

// ---------------------------------------------------------------- the families
function solveWhole(q) {
  const p = q.prompt;
  let m = p.match(/slice is (\d+(?:\.\d+)?)% of the circle and stands for (\d+)/);
  if (m) return (Number(m[2]) * 100) / Number(m[1]);
  m = p.match(/^(\d+) (\w+) were asked one question\. (\d+) answered and (\d+) gave no answer\. The graph is titled "(.*?)"/);
  if (m) {
    const N = Number(m[1]), title = m[5];
    if (/ asked$/.test(title)) return choiceWhere(q, c => new RegExp(`^All ${N} \\w+ asked: 100%$`).test(c));
    if (/who answered$/.test(title)) return choiceWhere(q, c => new RegExp(`^Only the ${m[3]} who answered$`).test(c));
  }
  return undefined;
}

function solveSameShare(q) {
  const p = q.prompt, P = pic(q);
  if (P?.kind === 'two') {
    // both slices have the same central angle (one deg drawn in both circles): the same share, whatever size or turn
    const degs = nums(p.match(/Each has a ([\d.]+)° slice/)?.[0] ?? '');
    if (degs.length && Math.abs(degs[0] - P.deg) < EPS) return choiceWhere(q, c => /^Neither: same angle, same share$/.test(c));
    return undefined;
  }
  const m = p.match(/cut into (\d+) pieces\. The lit piece has a central angle of (\d+(?:\.\d+)?)°/);
  if (m) {
    const exact = (Number(m[2]) / 360) * 100;
    return choiceWhere(q, c => /%$/.test(c) && Math.abs(pv(c) - exact) <= 0.05 + EPS);
  }
  return undefined;
}

function solveToDeg(q) {
  const p = q.prompt;
  let m = p.match(/slice is (\d+(?:\.\d+)?)% of the circle/);
  if (m) return Number((Number(m[1]) * 3.6).toFixed(9));
  m = p.match(/slice is (\d+)\/(\d+) of the circle/);
  if (m) return Number(((360 * Number(m[1])) / Number(m[2])).toFixed(9));
  return undefined;
}
function solveToPct(q) {
  const m = q.prompt.match(/central angle of (\d+(?:\.\d+)?)°/);
  return m ? Number(((Number(m[1]) / 360) * 100).toFixed(9)) : undefined;
}

/** a benchmark choice as a test on the share s (in %) */
function rangeTest(c) {
  let m = c.match(/^between (\S+)% and (\S+)%$/);
  if (m) { const lo = pv(m[1]), hi = pv(m[2]); return { edges: [lo, hi], ok: s => s > lo + 0.01 && s < hi - 0.01 }; }
  if ((m = c.match(/^less than (\S+)%$/))) { const hi = pv(m[1]); return { edges: [hi], ok: s => s < hi - 0.01 }; }
  if ((m = c.match(/^more than (\S+)%$/))) { const lo = pv(m[1]); return { edges: [lo], ok: s => s > lo + 0.01 }; }
  if ((m = c.match(/^about (\S+)%$/))) { const v = pv(m[1]); return { edges: [], ok: s => Math.abs(s - v) <= 2 }; }
  return null;
}
function estimateShare(q) {
  const P = pic(q);
  if (!P || P.focus === undefined) return null;
  const A = drawnAngles(P);
  return { deg: A[P.focus], s: (A[P.focus] / 360) * 100 };
}
function solveEstimate(q) {
  const e = estimateShare(q);
  if (!e) return undefined;
  return choiceWhere(q, c => rangeTest(c)?.ok(e.s) ?? false);
}

/** the asked category and the whole of a table question */
function asked(q) {
  const p = q.prompt, t = table(q);
  let name = null;
  let m = p.match(/what fraction of .*? is (.+?)\?/) || p.match(/What percent is (.+?)\?/) || p.match(/What central angle does (.+?) get/) || p.match(/Which label belongs on the (.+?) slice\?/);
  if (m) name = m[1];
  const row = t.rows.find(r => r.name === name);
  let whole = t.total ?? t.sum;
  m = p.match(/of (?:all )?(?:the )?\$?(\d+)\b/);
  return { t, name, row, whole, statedWhole: m ? Number(m[1]) : null };
}
function solveShare(q) {
  const a = asked(q);
  if (!a.row) return undefined;
  return Q(a.row.v, a.whole).pair;
}
function solvePct(q) {
  const a = asked(q);
  if (!a.row) return undefined;
  return Number(((100 * a.row.v) / a.whole).toFixed(9));
}
function solveRoundPct(q) {
  const m = q.prompt.match(/^(\d+) of the (\d+) \w+ picked/);
  const pl = placesOf(q.prompt);
  if (!m || pl === null) return undefined;
  return roundQ(Number(m[1]), Number(m[2]), 100, pl).v;
}
function solveAngle(q) {
  const a = asked(q);
  if (!a.row) return undefined;
  const pl = placesOf(q.prompt);
  if (pl !== null) return roundQ(a.row.v, a.whole, 360, pl).v;
  return Number(((360 * a.row.v) / a.whole).toFixed(9));
}
function solveExact(q) {
  const m = q.prompt.match(/^(\d+) of (\d+) \w+ picked .*?Its label says (\d+)%/);
  if (!m) return undefined;
  const pl = placesOf(q.prompt) ?? 1;
  const v = roundQ(Number(m[1]), Number(m[2]), 360, pl).v;
  return choiceWhere(q, c => Math.abs(nums(c)[0] - v) < EPS && nums(c).length === 1);
}

/** close: judge every listed angle list against the exact angles */
function closeJudge(q) {
  const t = table(q);
  const n = t.total ?? t.sum;
  const exact = t.rows.map(r => (360 * r.v) / n);
  const lists = (q.choices ?? []).map(c => nums(c));
  const judged = lists.map(L => {
    if (L.length !== exact.length) return { valid: false };
    const err = L.map((a, i) => Math.abs(a - exact[i]));
    const total = L.reduce((s, a) => s + a, 0);
    return { valid: Math.abs(total - 360) < EPS && err.every(e => e < 1 - EPS), max: Math.max(...err), sum: err.reduce((s, e) => s + e, 0), L };
  });
  // the textbook closed list: round the running boundaries, each angle = the gap between two rounded boundaries
  let acc = 0, prev = 0; const cum = exact.map(e => { acc += e; const b = Math.round(acc + EPS); const a = b - prev; prev = b; return a; });
  return { exact, judged, cum };
}
function solveClose(q) {
  const { judged, cum } = closeJudge(q);
  const valid = judged.map((j, i) => (j.valid ? i : -1)).filter(i => i >= 0);
  if (valid.length === 0) return -1;
  if (valid.length === 1) return valid[0];
  // more than one list totals 360° with every angle within 1° of exact (sane() flags it): the one the taught procedure
  // gives (rounded cumulative boundaries, curriculum sub-goal close-angle-list), if it is listed
  const c = valid.find(i => judged[i].L.every((a, k) => a === cum[k]));
  return c ?? -1;
}

function solveAdjacent(q) {
  const p = q.prompt;
  let m = p.match(/end at the (\d+(?:\.\d+)?)% mark\. The next slice, .+?, is (\d+(?:\.\d+)?)%/);
  if (m) return Number(m[1]) + Number(m[2]);
  m = p.match(/end at the (\d+(?:\.\d+)?)° mark\. The next slice, .+?, is (\d+(?:\.\d+)?)°/);
  if (m) return Number(m[1]) + Number(m[2]);
  return undefined;
}

function solveReflex(q) {
  const p = q.prompt;
  let m = p.match(/needs a (\d+(?:\.\d+)?)° slice, but your protractor stops at 180°/);
  if (m) return Number(m[1]) - 180;
  m = p.match(/take (\d+(?:\.\d+)?)° together\. .+? gets the rest/);
  if (m) return 360 - Number(m[1]);
  m = p.match(/^All (\d+) \w+ picked (.+?)\. What does the circle graph look like\?/);
  if (m) return choiceWhere(q, c => /whole circle/.test(c) && nums(c).includes(360));
  return undefined;
}

function solveLabel(q) {
  const p = q.prompt;
  if (/just \d+ picked .*less than 1° of the circle/.test(p)) {
    // a tiny category is still a real part of the whole: dropping it hides data, a fake 10° slice distorts it
    return choiceWhere(q, c => /^Keep it: list it in a note/.test(c));
  }
  if (/Which title should this circle graph get\?/.test(p)) {
    const t = table(q), n = t.total ?? t.sum;
    return choiceWhere(q, c => new RegExp(` of ${n} \\w+$`).test(c));
  }
  const a = asked(q);
  if (a.row) {
    const pct = roundQ(a.row.v, a.whole, 100, 0).v;
    return choiceWhere(q, c => c.startsWith(a.name + ' ') && /%$/.test(c) && nums(c.slice(a.name.length))[0] === pct);
  }
  return undefined;
}

/** audit: what is wrong in the drawn graph */
function auditFacts(q) {
  const P = pic(q), t = table(q);
  const n = t.total ?? t.sum;
  const cats = P.cats;
  const exact = cats.map(c => (360 * c.count) / n);
  const drawn = P.angles ? [...P.angles] : exact;
  const wrongSize = cats.map((c, i) => Math.abs(drawn[i] - exact[i]) >= 1 - EPS);
  // label i sits beside sector labelAt[i]; it is wrong when its value does not fit the slice it sits on
  const at = P.labelAt ?? cats.map((_, i) => i);
  const wrongLabel = cats.map((c, i) => at[i] !== i && cats[at[i]].count !== c.count);
  return { cats, exact, drawn, wrongSize, wrongLabel, at };
}
function solveAudit(q) {
  const P = pic(q);
  if (!P?.cats) return undefined;
  const F = auditFacts(q);
  const names = F.cats.map(c => c.name);
  const bad = names.filter((_, i) => F.wrongSize[i]);
  const badL = names.filter((_, i) => F.wrongLabel[i]);
  const allRight = bad.length === 0 && badL.length === 0;
  return choiceWhere(q, c => {
    if (/^Yes/.test(c)) return allRight;
    let m = c.match(/^No: (.+?) is (\d+)° too big and (.+?) (\d+)° too small$/);
    if (m) {
      const i = names.indexOf(m[1]), j = names.indexOf(m[3]);
      return i >= 0 && j >= 0 && bad.length === 2 && badL.length === 0 && F.wrongSize[i] && F.wrongSize[j]
        && Math.abs(F.drawn[i] - F.exact[i] - Number(m[2])) < 0.5 && Math.abs(F.exact[j] - F.drawn[j] - Number(m[4])) < 0.5;
    }
    if ((m = c.match(/^No: only (.+?) is wrong$/))) return bad.length === 1 && badL.length === 0 && bad[0] === m[1];
    if ((m = c.match(/^No: the (.+?) and (.+?) labels are swapped$/))) {
      const i = names.indexOf(m[1]), j = names.indexOf(m[2]);
      return i >= 0 && j >= 0 && bad.length === 0 && badL.length === 2 && F.at[i] === j && F.at[j] === i && F.wrongLabel[i] && F.wrongLabel[j];
    }
    if ((m = c.match(/^No: the (.+?) slice is the wrong size$/))) return bad.length === 1 && bad[0] === m[1] && badL.length === 0;
    return false;
  });
}

/** bound: the labels, their count and total */
function boundFacts(q) {
  const m = q.prompt.match(/The (\d+) labels on a circle graph are (.*?): a total of (\d+)%/);
  if (!m) return null;
  const k = Number(m[1]), labels = nums(m[2]), T = Number(m[3]);
  return { k, labels, T, within: Math.abs(T - 100) <= k / 2 + EPS };
}
function solveBound(q) {
  const f = boundFacts(q);
  if (!f) return undefined;
  return choiceWhere(q, c => {
    let m;
    if ((m = c.match(/^Rounding can explain it: (\d+) labels can be off by up to (\d+(?:\.\d+)?) points$/))) return f.within && Number(m[1]) === f.k && Math.abs(Number(m[2]) - f.k / 2) < EPS;
    if ((m = c.match(/^A mistake: (\d+) labels can only be off by (\d+(?:\.\d+)?) points$/))) return !f.within && Number(m[1]) === f.k && Math.abs(Number(m[2]) - f.k / 2) < EPS;
    if (/^Rounding: it is close to 100%$/.test(c)) return false; // "close" is no test: the bound is k × 0.5 points
    if (/^Fine: percents never total exactly 100%$/.test(c)) return false; // false: they often total exactly 100%
    if (/^A mistake: rounded percents must total exactly 100%$/.test(c)) return false;
    if (/^A mistake: a category must be missing$/.test(c)) return false; // a gap within the rounding bound proves nothing
    return false;
  });
}

function solveDisclose(q) {
  // the labels are each rounded right; forcing one label or a count to fix the total misstates the data
  return choiceWhere(q, c => /^Keep the labels and add a note: they do not total 100% because of rounding$/.test(c));
}

function solveGap(q) {
  const p = q.prompt, t = table(q);
  let m = p.match(/A survey asked (\d+) (\w+)\. The counts listed add up to (\d+)\. The survey notes say (\d+) \w+ gave no answer\./);
  if (m) {
    const N = Number(m[1]), miss = N - t.sum;
    return choiceWhere(q, c => { const x = c.match(/^Add a "No answer" slice of (\d+(?:\.\d+)?)%$/); return !!x && Math.abs(Number(x[1]) - (100 * miss) / N) < EPS; });
  }
  m = p.match(/A survey asked (\d+) (\w+)\. The counts listed add up to only (\d+), and the source does not say why\./);
  if (m) {
    const miss = Number(m[1]) - t.sum;
    return choiceWhere(q, c => { const x = c.match(/^Show the (\d+) as "not accounted for" and check the source$/); return !!x && Number(x[1]) === miss; });
  }
  m = p.match(/a circle graph of only the (\d+) (\w+) who answered \(of the (\d+) asked\)/);
  if (m) return choiceWhere(q, c => c.endsWith(` of the ${m[1]} ${m[2]} who answered`));
  return undefined;
}

function solveFit(q) {
  const p = q.prompt, P = pic(q);
  if (/could pick every sport/.test(p)) {
    const T = Number(p.match(/percents total (\d+)%/)?.[1]);
    if (T > 100) return choiceWhere(q, c => /^No: .*counted more than once/.test(c));
    return undefined;
  }
  if (/average temperature/.test(p)) return choiceWhere(q, c => /^No: temperatures are not parts of a whole$/.test(c));
  const m = p.match(/^Each of (\d+) (\w+) picked exactly one answer, and the counts add up to (\d+)\./);
  if (m) {
    const t = table(q);
    if (Number(m[1]) === Number(m[3]) && t.sum === Number(m[1])) return choiceWhere(q, c => /^Yes: each \w+ is counted once, and the parts make the whole$/.test(c));
    return choiceWhere(q, () => false);
  }
  void P;
  return undefined;
}

const SOLVERS = {
  whole: solveWhole, sameShare: solveSameShare, toDeg: solveToDeg, toPct: solveToPct, estimate: solveEstimate,
  share: solveShare, pct: solvePct, roundPct: solveRoundPct, angle: solveAngle, exact: solveExact, close: solveClose,
  adjacent: solveAdjacent, reflex: solveReflex, label: solveLabel, audit: solveAudit, bound: solveBound,
  disclose: solveDisclose, gap: solveGap, fit: solveFit,
};

export function solve(q) {
  const f = SOLVERS[q.family];
  return f ? f(q) : undefined;
}

// ---------------------------------------------------------------- sane: what is impossible or unfair
export function sane(q) {
  const out = [];
  const p = q.prompt, P = pic(q), t = table(q);
  let m;

  // the table and the picture must tell the same story
  if (t.rows.length && P?.cats) {
    for (const r of t.rows) {
      const c = P.cats.find(x => x.name === r.name);
      if (!c) out.push(`${r.name} is in the table but not in the graph`);
      else if (c.count !== r.v) out.push(`${r.name}: ${r.v} in the table, ${c.count} in the graph`);
    }
  }
  if (t.rows.length && t.total !== null && t.totalName === 'Total' && Math.abs(t.total - t.sum) > EPS) out.push(`the counts add up to ${t.sum}, the table says Total ${t.total}`);
  if (t.totalName === 'Asked' && t.total < t.sum) out.push('more answers than people asked');
  // a 0-count category is an intended case (topic JSON: zero-frequency categories, 0%); only a negative count is impossible
  for (const r of t.rows) if (r.v < 0) out.push(`${r.name} has ${r.v} answers: a negative count in the table`);
  for (const r of t.rows) if (!Number.isInteger(r.v) && !/\$/.test(q.board)) out.push(`${r.name}: a count of ${r.v}`);
  if (P?.cats) for (const c of P.cats) if (c.count < 0 && !t.rows.length) out.push(`${c.name} has a negative count in the graph`);
  // a stated whole in the prompt must be the table's whole
  if (['share', 'pct', 'angle'].includes(q.family)) {
    const a = asked(q);
    if (!a.row) out.push('the asked category is not in the table');
    if (a.statedWhole !== null && Math.abs(a.statedWhole - a.whole) > EPS) out.push(`the prompt says ${a.statedWhole}, the table ${a.whole}`);
  }
  // label percents shown in the picture must be the rounded shares
  if (P?.cats && Array.isArray(P.labels)) {
    const n = P.n ?? catSum(P);
    P.labels.forEach((L, i) => {
      if (!L) return;
      const v = String(L[1]);
      if (/%$/.test(v) && q.family !== 'whole') { const ex = (100 * P.cats[i].count) / n, got = Number(v.replace('%', '')); if (got !== round(ex) && Math.abs(got - ex) > 1e-9) out.push(`label ${L[0]} ${v} but the data give ${ex}%`); }
      if (/°$/.test(v) && q.family !== 'audit') { const want = (360 * P.cats[i].count) / n; if (Math.abs(nums(v)[0] - want) >= 1) out.push(`label ${L[0]} ${v} but the data give ${want}°`); }
    });
  }

  switch (q.family) {
    case 'whole': {
      if ((m = p.match(/the (.+?) slice is (\d+(?:\.\d+)?)% of the circle and stands for (\d+)/))) {
        const w = (Number(m[3]) * 100) / Number(m[2]);
        if (!Number.isInteger(w)) out.push(`the whole is ${w}: not a whole number of people`);
        if (P?.cats) {
          const c = P.cats.find(x => x.name === m[1]);
          if (c && c.count !== Number(m[3])) out.push('the picture count of the slice is not the stated one');
          if (catSum(P) !== w) out.push(`the picture totals ${catSum(P)}, not ${w}`);
        }
      }
      if ((m = p.match(/^(\d+) (\w+) were asked one question\. (\d+) answered and (\d+) gave no answer/))) {
        const N = Number(m[1]);
        if (Number(m[3]) + Number(m[4]) !== N) out.push('answered + no answer is not the number asked');
        if (t.rows.length && t.sum !== N) out.push('the table does not add up to the number asked');
        if (N === 100) out.push('the whole is 100 people: the "100 people" choice is also right');
      }
      break;
    }
    case 'sameShare': {
      if ((m = p.match(/cut into (\d+) pieces\. The lit piece has a central angle of (\d+(?:\.\d+)?)°/)) && P?.cats) {
        if (P.cats.length !== Number(m[1])) out.push('the picture has another number of pieces');
        const A = drawnAngles(P);
        if (Math.abs(A[P.focus] - Number(m[2])) > 0.5) out.push(`the lit piece is drawn ${A[P.focus]}°, not ${m[2]}°`);
        const exact = (Number(m[2]) / 360) * 100;
        if (Math.abs(exact * 10 - Math.round(exact * 10)) > EPS) {
          const r = roundQ(Number(m[2]), 360, 100, 1); if (r.tie) out.push('the percent is a .x5 tie');
        }
      }
      break;
    }
    case 'toDeg': {
      const v = solveToDeg(q);
      if (v !== undefined && Math.abs(v * 100 - Math.round(v * 100)) > 1e-6 && placesOf(p) === null) out.push(`the angle is ${v}°: no clean value and no rounding asked`);
      if (P?.angles && v !== undefined && Math.abs(P.angles[P.focus ?? 0] - v) > 0.5) out.push('the drawn slice does not fit');
      break;
    }
    case 'toPct': {
      const v = solveToPct(q);
      if (v !== undefined && Math.abs(v * 100 - Math.round(v * 100)) > 1e-6 && placesOf(p) === null) out.push(`the percent is ${v}: no clean answer and no rounding asked`);
      if (P?.angles && (m = p.match(/central angle of (\d+(?:\.\d+)?)°/)) && Math.abs(P.angles[P.focus ?? 0] - Number(m[1])) > 0.5) out.push('the drawn slice does not fit');
      break;
    }
    case 'estimate': {
      const e = estimateShare(q);
      if (e) {
        for (const c of q.choices ?? []) {
          const r = rangeTest(c);
          if (!r) { out.push(`unreadable choice "${c}"`); continue; }
          for (const edge of r.edges) { const d = Math.abs(e.deg - edge * 3.6); if (d < 3 - EPS) out.push(`the slice is ${e.deg}°, within ${round(d, 1)}° of the ${round(edge, 1)}% mark: not tellable by eye`); }
        }
      }
      break;
    }
    case 'pct': {
      const a = asked(q);
      if (a.row && !terminates(a.row.v, a.whole, 100, 1) && placesOf(p) === null) out.push(`${a.name} is ${(100 * a.row.v) / a.whole}%: no clean percent and no rounding asked`);
      break;
    }
    case 'roundPct': {
      if ((m = p.match(/^(\d+) of the (\d+) \w+ picked (.+?)\./))) {
        const a = Number(m[1]), n = Number(m[2]), pl = placesOf(p);
        if (pl !== null && roundQ(a, n, 100, pl).tie) out.push('the exact percent is a .5 tie at the asked place');
        if (a > n) out.push('more pickers than people');
        if (P?.cats) { const c = P.cats.find(x => x.name === m[3]); if (!c || c.count !== a || catSum(P) !== n) out.push('the picture does not fit the counts'); }
        if ((m = p.match(/do 100 × (\d+) ÷ (\d+)/)) && (Number(m[1]) !== a || Number(m[2]) !== n)) out.push('the calculator hint uses other numbers');
      }
      break;
    }
    case 'angle': {
      const a = asked(q), pl = placesOf(p);
      if (a.row) {
        if (pl !== null && roundQ(a.row.v, a.whole, 360, pl).tie) out.push('the exact angle is a .5 tie at the asked place');
        if (pl === null && !terminates(a.row.v, a.whole, 360, 0)) out.push(`the angle is ${(360 * a.row.v) / a.whole}°: not whole and no rounding asked`);
      }
      break;
    }
    case 'exact': {
      if ((m = p.match(/^(\d+) of (\d+) \w+ picked (.+?)\. Its label says (\d+)%/))) {
        const a = Number(m[1]), n = Number(m[2]);
        if (round((100 * a) / n) !== Number(m[4])) out.push(`the label ${m[4]}% is not ${a}/${n} rounded`);
        if (roundQ(a, n, 360, 1).tie) out.push('the exact angle is a .x5 tie');
      }
      break;
    }
    case 'close': {
      const { exact, judged } = closeJudge(q);
      if ((m = p.match(/the angles are (.*?): a total of (\d+)°/))) {
        const L = nums(m[1]);
        if (L.length !== exact.length || L.some((x, i) => x !== round(exact[i]))) out.push('the "rounded one by one" list is not the rounded angles');
        if (L.reduce((s, x) => s + x, 0) !== Number(m[2])) out.push('the stated total is not the sum');
      }
      const valid = judged.map((j, i) => (j.valid ? i : -1)).filter(i => i >= 0);
      if (valid.length === 0) out.push('no listed list totals 360° with every angle within 1°');
      if (valid.length > 1) out.push(`${valid.length} lists total 360° with every angle within 1° of exact: ${valid.map(i => `"${q.choices[i]}" (max error ${round(judged[i].max, 2)}°)`).join(' and ')}`);
      break;
    }
    case 'adjacent': {
      const v = solveAdjacent(q);
      const pctCircle = /percent circle/.test(p);
      if (v !== undefined && v > (pctCircle ? 100 : 360) + EPS) out.push('the slice runs past the full circle');
      if (P?.cats && P.focus !== undefined && (m = p.match(/end at the (\d+(?:\.\d+)?)(%|°) mark\. The next slice, (.+?), is (\d+(?:\.\d+)?)/))) {
        const A = drawnAngles(P), k = pctCircle ? 3.6 : 1;
        const before = A.slice(0, P.focus).reduce((s, x) => s + x, 0);
        if (Math.abs(before - Number(m[1]) * k) > 0.5) out.push(`the drawn slices end at ${round(before, 1)}°, not at the stated mark`);
        if (Math.abs(A[P.focus] - Number(m[4]) * k) > 0.5) out.push('the drawn next slice is not the stated size');
        if (P.cats[P.focus].name !== m[3]) out.push('the lit slice is another category');
        if (P.ray && Math.abs(P.ray.deg - Number(m[1]) * k) > 0.5) out.push('the marked ray is not at the stated mark');
      }
      break;
    }
    case 'reflex': {
      if ((m = p.match(/^(.+?) needs a (\d+(?:\.\d+)?)° slice/))) {
        const d = Number(m[2]);
        if (d <= 180 || d >= 360) out.push(`a ${d}° slice does not need 180° plus more`);
        if (P?.cats && P.focus !== undefined && Math.abs(drawnAngles(P)[P.focus] - d) > 0.5) out.push('the drawn slice is not the stated size');
      }
      if ((m = p.match(/take (\d+(?:\.\d+)?)° together\. (.+?) gets the rest/)) && P?.cats && P.focus !== undefined) {
        const A = drawnAngles(P);
        const others = A.reduce((s, x) => s + x, 0) - A[P.focus];
        if (Math.abs(others - Number(m[1])) > 0.5) out.push('the drawn other slices do not take the stated angle');
        if (P.cats[P.focus].name !== m[2]) out.push('the lit slice is another category');
      }
      if ((m = p.match(/^All (\d+) \w+ picked (.+?)\./)) && P?.cats) {
        if (P.cats.length !== 1 || P.cats[0].count !== Number(m[1])) out.push('the picture is not one category of everyone');
      }
      break;
    }
    case 'label': {
      if ((m = p.match(/In a survey of (\d+) \w+, just (\d+) picked .+?\. That is (\d+(?:\.\d+)?)%: less than 1° of the circle/))) {
        const n = Number(m[1]), a = Number(m[2]);
        if (Math.abs((100 * a) / n - Number(m[3])) > 1e-6) out.push('the stated percent is not the share');
        if ((360 * a) / n >= 1) out.push('the slice is not less than 1°');
      }
      if (/Which label belongs/.test(p)) {
        const a = asked(q);
        if (a.row && !Number.isInteger((100 * a.row.v) / a.whole)) {
          if (roundQ(a.row.v, a.whole, 100, 0).tie) out.push('the label percent is a .5 tie');
        }
        // a degree choice must not equal the percent value (two "right" looking choices)
      }
      break;
    }
    case 'audit': {
      if (P?.cats) {
        const F = auditFacts(q);
        if (P.angles && Math.abs(P.angles.reduce((s, x) => s + x, 0) - 360) > EPS && /angles total 360/.test(p)) out.push('the drawn angles do not total 360° as claimed');
        if (P.labels && P.angles) P.labels.forEach((L, i) => { if (L && /°$/.test(L[1]) && Math.abs(nums(L[1])[0] - P.angles[i]) > EPS) out.push(`label ${L[0]} ${L[1]} is not the drawn angle`); });
        if (P.labelAt) {
          const at = P.labelAt;
          if ([...at].sort().join() !== at.map((_, i) => i).join()) out.push('two labels on one slice');
          F.cats.forEach((c, i) => { if (at[i] !== i && F.cats[at[i]].count === c.count) out.push(`the ${c.name} label moved to a slice of the same size: the graph still reads right`); });
        }
      }
      break;
    }
    case 'bound': {
      const f = boundFacts(q);
      if (f) {
        if (f.labels.length !== f.k) out.push('the number of labels is not the stated one');
        if (f.labels.reduce((s, x) => s + x, 0) !== f.T) out.push('the labels do not add up to the stated total');
        if (P?.cats) {
          const n = catSum(P);
          const want = P.cats.map(c => round((100 * c.count) / n));
          if (want.join() !== f.labels.join()) out.push(`the labels are not the rounded shares of the graph data (${want.join(', ')})`);
          if ((m = (P.title ?? '').match(/, (\d+) \w+$/)) && Number(m[1]) !== n) out.push('the title total is not the data total');
        }
        if (f.T === 100) out.push('the labels total exactly 100%');
      }
      break;
    }
    case 'disclose': {
      if (P?.cats && (m = p.match(/of (\d+) \w+\. The rounded labels total (\d+)%/))) {
        const n = catSum(P);
        if (n !== Number(m[1])) out.push('the data total is not the stated one');
        const lab = P.cats.map(c => round((100 * c.count) / n));
        const T = lab.reduce((s, x) => s + x, 0);
        if (T !== Number(m[2])) out.push(`the rounded labels total ${T}%, not ${m[2]}%`);
        if (T === 100) out.push('the labels already total 100%');
        for (const c of q.choices ?? []) {
          const x = c.match(/^Change the (.+?) label to (\d+)%/);
          if (x) {
            const i = P.cats.findIndex(k => k.name === x[1]);
            if (i < 0) out.push(`no ${x[1]} in the data`);
            else {
              const ex = (100 * P.cats[i].count) / n, to = Number(x[2]);
              if (lab[i] === to) out.push('the "change the label" choice gives its right rounded value');
              else if (Math.abs(Math.abs(to - ex) - 0.5) < 1e-9) out.push(`${x[1]} is exactly ${ex}%: ${to}% is as near as ${lab[i]}%, so changing its label to ${to}% is an honest fix too`);
            }
          }
        }
      }
      break;
    }
    case 'gap': {
      if ((m = p.match(/A survey asked (\d+) \w+\. The counts listed add up to (?:only )?(\d+)/))) {
        const N = Number(m[1]), S = Number(m[2]);
        if (t.sum !== S) out.push(`the counts add up to ${t.sum}, not ${S}`);
        if (t.total !== null && t.total !== N) out.push('the table asked-number is not the stated one');
        if (S >= N) out.push('nothing is missing');
        const x = p.match(/say (\d+) \w+ gave no answer/);
        if (x && Number(x[1]) !== N - S) out.push('the no-answer number does not close the gap');
        if (P?.n !== undefined && P.n !== N) out.push('the picture whole is not the number asked');
        if (/Other/.test(p + (q.choices ?? []).join('|')) && (q.choices ?? []).some(c => /^Put the \d+ into Other$/.test(c)) && !t.rows.some(r => r.name === 'Other')) out.push('a choice puts the gap into an Other that is not in the table');
      }
      if ((m = p.match(/only the (\d+) \w+ who answered \(of the (\d+) asked\)/)) && Number(m[1]) >= Number(m[2])) out.push('everyone answered');
      break;
    }
    case 'fit': {
      if ((m = p.match(/percents total (\d+)%/))) {
        const T = Number(m[1]);
        if (P?.kind === 'bars') { const s = P.bars.reduce((a, b) => a + b.value, 0); if (s !== T) out.push(`the bars total ${s}%, not ${T}%`); if (P.bars.some(b => b.value > 100)) out.push('a bar over 100%'); }
        if (T <= 100) out.push('a pick-all total of at most 100% shows no double counting');
      }
      if ((m = p.match(/^Each of (\d+) \w+ picked exactly one answer, and the counts add up to (\d+)/)) && (t.sum !== Number(m[1]) || Number(m[2]) !== Number(m[1]))) out.push('the counts do not add up to the number of people');
      break;
    }
    default: break;
  }

  // a choice question needs exactly one right choice
  if (q.input === 'choice') {
    let s;
    try { s = solve(q); } catch { s = undefined; }
    if (s === -1) out.push('no single right choice');
  }
  return [...new Set(out)].join('; ');
}

export default { solve, sane };
