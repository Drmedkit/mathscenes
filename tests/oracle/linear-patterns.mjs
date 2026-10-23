// Oracle for the lesson "linear-patterns" (recognize a linear relationship, 8.F.A.3 / 8.F.B.4-5). Written from what the
// student sees only: the prompt, the board, the choices and the drawn table / graph (`pic.tg` xs, ys, ys2 and names,
// drawn when `pic.at` is not empty; `focus.hidePoint` = the point the graph leaves out). Words-only items
// (`pic.at` empty) are read from the words alone: their table is only drawn by the solution, and `pic.then` is the
// solution's picture, never read. Every answer is worked out with exact changes per 1 input unit (Δy / Δx).
// Choices that pair a verdict with a reason are right only when the verdict is right AND the reason is a valid argument
// whose numbers are true (a true but irrelevant fact such as "the output goes up every row" does not prove linearity).
// See docs/lessons/QUALITY_LAYER.md, "O: the oracle".
import { nums, texPlain, choiceWhere, Q } from '../../tools/quality/oracle-kit.mjs';

const norm = s => String(s ?? '').replace(/[−–]/g, '-').replace(/\s+/g, ' ').trim();
const num = s => Number(String(s).replace(/[−–]/g, '-').replace(/[$,%]/g, ''));

// ---------------------------------------------------------------- the drawn table / graph
const tgOf = q => q.data?.pic?.tg ?? null;
/** the picture is drawn before the answer (a words-only item draws nothing until the solution) */
const drawn = q => (q.data?.pic?.at ?? []).length > 0;
/** exact changes between rows: [{ dx, dy, rate }] */
function steps(xs, ys) {
  const out = [];
  for (let i = 1; i < xs.length; i++) {
    const dx = xs[i] - xs[i - 1], dy = ys[i] - ys[i - 1];
    out.push({ dx, dy, rate: Q(dy, dx) });
  }
  return out;
}
const isLinear = (xs, ys) => { const s = steps(xs, ys); return s.every(t => t.rate.eq(s[0].rate)); };
/** the constant change per 1 input unit (a Q), or null */
const rateOf = (xs, ys) => (isLinear(xs, ys) ? steps(xs, ys)[0].rate : null);
/** the output at input 0, holding the constant rate back */
const startOf = (xs, ys) => { const r = rateOf(xs, ys); return r ? Q(ys[0]).sub(r.mul(xs[0])) : null; };
const qn = v => (v && typeof v === 'object' && 'n' in v ? v.value : v);
/** a signed change "+7", "−5", "0" → number */
const signed = s => num(String(s).replace(/^\+/, ''));

// ---------------------------------------------------------------- families
const F = {};

// the change from each row to the next (the size; the unit says more / less)
F.rowChange = q => {
  const t = tgOf(q), s = steps(t.xs, t.ys);
  if (!s.every(x => x.dy === s[0].dy)) return undefined;
  return Math.abs(s[0].dy);
};

// could the table be linear? verdict + reason
F.couldBeLinear = q => {
  const t = tgOf(q), lin = isLinear(t.xs, t.ys), s = steps(t.xs, t.ys);
  const sameDy = s.every(x => x.dy === s[0].dy), dy = s[0].dy;
  return choiceWhere(q, c => {
    const x = norm(c);
    let m;
    if ((m = x.match(/^Yes: the output changes by ([+-]?\d+) every row$/))) return lin && sameDy && signed(m[1]) === dy;
    if ((m = x.match(/^Yes: it goes up (\d+) each row$/))) return lin && sameDy && dy === Number(m[1]);
    if ((m = x.match(/^Yes: it goes down (\d+) each row$/))) return lin && sameDy && -dy === Number(m[1]);
    if (/^No: (the changes are not all the same|the change is not the same every row)$/.test(x)) return !lin;
    return false; // "goes up every row", "does not start at 0", "goes down, not up", "nothing changes", "a pattern too", …
  });
};

// input steps of d: the change per row, and per 1 unit
F.perUnit = q => {
  const t = tgOf(q), s = steps(t.xs, t.ys);
  if (!s.every(x => x.dx === s[0].dx && x.dy === s[0].dy)) return undefined;
  return [Math.abs(s[0].dy), Math.abs(qn(s[0].rate))];
};

// the output at input 0
F.startValue = q => {
  const t = tgOf(q);
  const at = Number((norm(q.prompt).match(/output at (\d+) /) ?? [])[1] ?? 0);
  const i = t.xs.indexOf(at);
  if (i >= 0) return t.ys[i];
  const r = rateOf(t.xs, t.ys);
  return r ? qn(Q(t.ys[0]).sub(r.mul(t.xs[0] - at))) : undefined;
};

/** a story in words → { start, rate } (rate per 1 input unit, signed) */
function storyRule(p) {
  const s = norm(p);
  let m;
  const R = [
    [/starts (\d+) miles from the trailhead and walks (\d+) miles farther each/, 1, 2, 1],
    [/cost \$(\d+) a pack, plus an? \$(\d+) shipping fee/, 2, 1, 1],
    [/costs \$(\d+) to start, plus \$(\d+) for each/, 1, 2, 1],
    [/(\d+) kids are already at camp, and each van brings (\d+) more kids/, 1, 2, 1],
    [/is (\d+) in\. tall and grows (\d+) in\. each/, 1, 2, 1],
    [/holds (\d+) gallons and drains (\d+) gallons each/, 1, 2, -1],
    [/holds (\d+) gallons and fills (\d+) gallons each/, 1, 2, 1],
    [/battery is at (\d+)% and drops (\d+)% each/, 1, 2, -1],
    [/has \$(\d+) saved and adds \$(\d+) each/, 1, 2, 1],
    [/starts with (\d+) tiles at step 0 and adds (\d+) tiles each/, 1, 2, 1],
    [/has \$(\d+) and spends \$(\d+) each/, 1, 2, -1],
    [/candle (\d+) in\. tall burns down (\d+) in\. each/, 1, 2, -1],
  ];
  for (const [re, si, ri, sign] of R) if ((m = s.match(re))) return { start: Number(m[si]), rate: sign * Number(m[ri]) };
  return null;
}
/** the board "start S | +R each U" → { start, rate } */
function boardRule(q) {
  const b = texPlain(q.board).replace(/\s+/g, ' ');
  const m = b.match(/start (\d+) \| ([+-])(\d+) each/);
  return m ? { start: Number(m[1]), rate: (m[2] === '-' ? -1 : 1) * Number(m[3]) } : null;
}

// words → the list of outputs after 0, 1, 2, 3 units
F.wordsToTable = q => {
  const rule = storyRule(q.prompt);
  if (!rule) return undefined;
  const at = (norm(q.prompt).match(/after ([\d, and]+) \w+\?$/) ?? [])[1];
  const xs = at ? nums(at) : [0, 1, 2, 3];
  const want = xs.map(x => rule.start + rule.rate * x);
  return choiceWhere(q, c => { const v = nums(c); return v.length === want.length && v.every((y, i) => y === want[i]); });
};

/** "Starts at X, goes up/down Y each U" judged against a start and a rate */
function describes(c, start, rate) {
  const m = norm(c).match(/^Starts at \$?(\d+(?:\.\d+)?)%?(?: [a-z.]+)?, goes (up|down) \$?(\d+(?:\.\d+)?)%?(?: [a-z.]+)? each \w+$/);
  if (!m) return false;
  const r = qn(rate);
  if (r === 0) return false;
  return Number(m[1]) === qn(start) && (m[2] === 'up' ? r > 0 : r < 0) && Number(m[3]) === Math.abs(r);
}
F.tableToWords = q => {
  const t = tgOf(q), st = startOf(t.xs, t.ys), r = rateOf(t.xs, t.ys);
  if (!st) return undefined;
  return choiceWhere(q, c => describes(c, st, r));
};
F.graphToWords = F.tableToWords;

// the row of the table whose point the graph leaves out
F.plotPoint = q => {
  const t = tgOf(q), h = q.data?.pic?.focus?.hidePoint;
  if (h === undefined) return undefined;
  return [t.xs[h], t.ys[h]];
};

// what a straight line says: the same change every unit
F.graphMeaning = q => {
  const t = tgOf(q), r = rateOf(t.xs, t.ys);
  if (!r) return undefined;
  const v = qn(r);
  return choiceWhere(q, c => {
    const m = norm(c).match(/^The \w+ (loses|gains|covers) the same (\d+(?:\.\d+)?) [a-z.]+ every \w+$/);
    if (!m) return false; // "shaped like a slope / ramp", "goes straight up a hill", "faster and faster"
    return Number(m[2]) === Math.abs(v) && (m[1] === 'loses' ? v < 0 : v > 0);
  });
};

// the change per 1 input unit, read from the plotted points
F.graphChange = q => {
  const t = tgOf(q), r = rateOf(t.xs, t.ys);
  return r ? Math.abs(qn(r)) : undefined;
};

// whose line is steeper (changes faster per unit), not higher
F.compareLines = q => {
  const t = tgOf(q);
  const r1 = rateOf(t.xs, t.ys), r2 = rateOf(t.xs, t.ys2);
  if (!r1 || !r2) return undefined;
  const a = Math.abs(qn(r1)), b = Math.abs(qn(r2));
  const [n1, n2] = t.names;
  return choiceWhere(q, c => {
    const x = norm(c);
    if (/^They change at the same rate$/.test(x)) return a === b;
    if (x === `${n1}'s`) return a > b;
    if (x === `${n2}'s`) return b > a;
    return false;
  });
};

// points or a line: only an input that can take in-between values may be joined
const DISCRETE = /^(vans?|packs?|steps?)$/;
const CONTINUOUS = /^(minutes?|hours?|weeks?|min)$/;
const inputName = t => String(t.xName ?? t.xHead?.[0] ?? '').toLowerCase();
F.connectOrNot = q => {
  const t = tgOf(q), x = inputName(t);
  const cont = CONTINUOUS.test(x) ? true : DISCRETE.test(x) ? false : null;
  if (cont === null) return undefined;
  const unit = x.replace(/s$/, '');
  return choiceWhere(q, c => {
    const s = norm(c);
    if (cont) return new RegExp(`^Join them: in-between ${unit}s have values too`).test(s);
    return new RegExp(`^Only the points: there is no half ${unit} or part of a ${unit}$`).test(s);
  });
};

// the change from the row for a to the row for b, read from the table
F.lastChange = q => {
  const t = tgOf(q);
  const m = norm(q.prompt).match(/from the row for (\d+) to the row for (\d+)\?/);
  if (!m) return undefined;
  const i = t.xs.indexOf(Number(m[1])), j = t.xs.indexOf(Number(m[2]));
  if (i < 0 || j < 0) return undefined;
  return t.ys[j] - t.ys[i];
};

// on one straight line? the same change per unit between every pair of neighbours
F.onALine = q => {
  const t = tgOf(q), lin = isLinear(t.xs, t.ys), s = steps(t.xs, t.ys);
  return choiceWhere(q, c => {
    const x = norm(c);
    if (/^Linear: the same change every step, one straight line$/.test(x)) return lin;
    const m = x.match(/^Not linear: the changes are (.+)$/);
    if (m) {
      const listed = m[1].split(',').map(v => signed(v.trim()));
      return !lin && s.every(z => z.dx === s[0].dx) && listed.length === s.length && listed.every((v, i) => v === s[i].dy);
    }
    return false; // "too steep", "does not start at 0", "looks straight / smooth", "goes up every step", "straight pieces"
  });
};

// uneven input gaps: compare the change per 1 unit in every gap
F.unequalGaps = q => {
  const t = tgOf(q), lin = isLinear(t.xs, t.ys), s = steps(t.xs, t.ys), r = rateOf(t.xs, t.ys);
  return choiceWhere(q, c => {
    const x = norm(c);
    let m;
    if ((m = x.match(/^Yes: per 1 \w+ it is ([+-]?\d+(?:\.\d+)?) for every gap$/))) return lin && qn(r) === signed(m[1]);
    if ((m = x.match(/^No: per 1 \w+ it is (.+)$/))) {
      const listed = m[1].split(/, then |, /).map(v => signed(v.trim()));
      return !lin && listed.length === s.length && listed.every((v, i) => Math.abs(v - qn(s[i].rate)) < 1e-9);
    }
    return false; // raw changes compared across unequal gaps, "not evenly spaced", "goes up", "bigger gap"
  });
};

// the change per 1 unit inside one gap
F.gapRate = q => {
  const m = norm(q.prompt).match(/From (\d+) to (\d+) \w+, the output goes from (-?\d+) to (-?\d+)\./);
  if (!m) return undefined;
  const [a, b, c, d] = m.slice(1).map(Number);
  return qn(Q(d - c, b - a));
};

// linear from the words alone
F.contextLinear = q => {
  const p = norm(q.prompt);
  let grows = null, unit = null, m;
  if (/double every \w+/.test(p)) grows = true;
  else if (/each week saves \$\d+ more than the week before/.test(p)) grows = true; // the total saved: +3, +4, +5, …
  else if ((m = p.match(/grows \d+ in\. each (\w+)/))) { grows = false; unit = m[1]; }
  else if ((m = p.match(/earns \$\d+ for every (\w+)/))) { grows = false; unit = m[1]; }
  else if ((m = p.match(/plus \$\d+ per (\w+)/))) { grows = false; unit = m[1]; }
  if (grows === null) return undefined;
  return choiceWhere(q, c => {
    const x = norm(c);
    if (grows) return /^Not linear: the change gets bigger$/.test(x);
    return x === `Linear: the same change every ${unit}`;
  });
};

// the reason that proves it: every step checked (linear) or one pair of equal steps with different changes (not)
F.bestReason = q => {
  const t = tgOf(q), lin = isLinear(t.xs, t.ys), s = steps(t.xs, t.ys);
  return choiceWhere(q, c => {
    const x = norm(c);
    let m;
    if ((m = x.match(/^The input goes up by (\d+) every row, and the output goes (up|down) by (\d+) every row$/))) {
      const dx = Number(m[1]), dy = (m[2] === 'up' ? 1 : -1) * Number(m[3]);
      return lin && s.every(z => z.dx === dx && z.dy === dy);
    }
    if ((m = x.match(/^From (\d+) to (\d+) it changes by ([+-]?\d+), but from (\d+) to (\d+) by ([+-]?\d+)$/))) {
      // two neighbouring-row steps of the same input width whose changes differ (the steps need not touch)
      const [a, b, c1, d] = [m[1], m[2], m[4], m[5]].map(Number);
      const i = t.xs.indexOf(a), j = t.xs.indexOf(b), k = t.xs.indexOf(c1), l = t.xs.indexOf(d);
      if (lin || i < 0 || k < 0 || j !== i + 1 || l !== k + 1 || b - a !== d - c1) return false;
      return t.ys[j] - t.ys[i] === signed(m[3]) && t.ys[l] - t.ys[k] === signed(m[6]) && signed(m[3]) !== signed(m[6]);
    }
    return false; // "graph would look like a line", "outputs keep getting bigger", "look random", "does not start at 0"
  });
};

// could be linear (a few rows agree) or must be linear (a rule for every step)
F.couldOrMust = q => {
  const b = texPlain(q.board), p = norm(q.prompt);
  const rule = /This rule holds for every \w+/.test(p) || /^rule:/.test(b);
  if (rule) return choiceWhere(q, c => /^It must be linear: the rule says the same change every time$/.test(norm(c)));
  if (/No rule is given/.test(p)) {
    const t = tgOf(q);
    if (!isLinear(t.xs, t.ys)) return undefined;
    return choiceWhere(q, c => /^It could be linear: these rows have the same change$/.test(norm(c)));
  }
  return undefined;
};

// predict far ahead with the rule: the table's first row + rule × the steps after it
F.farPredict = q => {
  const t = tgOf(q), p = norm(q.prompt);
  const m = p.match(/adds \$?(\d+)/), target = p.match(/(?:for|at|after) (?:step )?(\d+)(?: \w+)?\?$/);
  if (!m || !target) return undefined;
  const rate = Number(m[1]), x = Number(target[1]);
  return t.ys[0] + rate * (x - t.xs[0]);
};

function solve(q) {
  const f = F[q.family];
  return f ? f(q) : undefined;
}

// ---------------------------------------------------------------- world
/** what each story's output can and cannot do */
function worldOfSeries(name, xs, ys) {
  const n = String(name).toLowerCase();
  if (ys.some(y => y < 0)) return `${name} below 0 (${ys.join(', ')})`;
  const s = steps(xs, ys);
  if (/height of the plant|height \(in\.\)$/.test(n) && /plant/.test(n) && s.some(z => z.dy < 0)) return `a plant that shrinks (${ys.join(', ')})`;
  if (/candle/.test(n) && s.some(z => z.dy > 0)) return `a candle that grows (${ys.join(', ')})`;
  if (/trailhead|distance/.test(n) && s.some(z => z.dy < 0) && s.some(z => z.dy > 0)) return '';
  if (/battery/.test(n) && ys.some(y => y > 100)) return `a battery over 100% (${ys.join(', ')})`;
  return '';
}
function sane(q) {
  const t = tgOf(q), p = norm(q.prompt), b = texPlain(q.board);
  const what = (p.match(/(?:shows|show|of) the ([a-z ]+?)(?: \(| for |\. |\?|$)/) ?? [])[1] ?? '';
  if (t && drawn(q)) {
    const w = worldOfSeries(what || t.yName, t.xs, t.ys);
    if (w) return w;
    if (t.ys2) { const w2 = worldOfSeries(what, t.xs, t.ys2); if (w2) return w2; }
  }
  if (q.family === 'rowChange' && t) {
    const s = steps(t.xs, t.ys), dy = s[0].dy;
    if (/go up/.test(p) && dy < 0) return 'asks how much it goes up, but it goes down';
    if (/go down/.test(p) && dy > 0) return 'asks how much it goes down, but it goes up';
  }
  if (q.family === 'startValue' && t) {
    const at = Number((p.match(/output at (\d+) /) ?? [])[1] ?? 0);
    if (!t.xs.includes(at) && !/The change is the same for every \w+, back to/.test(p)) return 'the start is not in the table and nothing says the change holds back to 0';
  }
  if ((q.family === 'tableToWords' || q.family === 'graphToWords') && t && t.xs[0] !== 0 && !/same back to 0/.test(p)) return 'the start is not in the table and nothing says the change holds back to 0';
  if (q.family === 'wordsToTable') {
    const r = storyRule(p), br = boardRule(q);
    if (r && br && (r.start !== br.start || r.rate !== br.rate)) return 'the board rule differs from the words';
    if (r) for (const x of [0, 1, 2, 3]) if (r.start + r.rate * x < 0) return `the story goes below 0 at ${x}`;
  }
  if (q.family === 'lastChange' && t) {
    const listed = nums(b.replace(/\|/g, ' ')), s = steps(t.xs, t.ys);
    if (!listed.every((v, i) => s[i] && s[i].dy === v)) return 'the board changes differ from the table';
    if (q.unit === 'more' && solve(q) < 0) return 'unit "more" for a change that goes down';
  }
  if (q.family === 'bestReason' && t) {
    const lin = isLinear(t.xs, t.ys);
    if (/could be linear/.test(p) && !lin) return 'the speaker is called right, but the table is not linear';
    if (/is not linear/.test(p) && lin) return 'the speaker is called right, but the table is linear';
  }
  if (q.family === 'couldOrMust' && t) {
    const br = b.match(/rule: \| ([+-])(\d+) every/);
    if (br) {
      const r = (br[1] === '-' ? -1 : 1) * Number(br[2]), rr = rateOf(t.xs, t.ys);
      if (!rr || qn(rr) !== r) return 'the table does not follow the stated rule';
    }
  }
  if (q.family === 'farPredict' && t) {
    const m = p.match(/adds \$?(\d+)/);
    const rr = rateOf(t.xs, t.ys);
    if (m && (!rr || qn(rr) !== Number(m[1]))) return 'the table does not follow the stated rule';
  }
  if (q.family === 'contextLinear' && /each week saves \$\d+ more than the week before/.test(p))
    return 'which quantity? the amount saved each week (+1 every week) is linear; only the running total is not';
  if (q.family === 'compareLines' && t) {
    const r1 = rateOf(t.xs, t.ys), r2 = rateOf(t.xs, t.ys2);
    const m = p.match(/At (\d+) \w+, (\w+)'s line is higher/);
    if (m && r1 && r2) {
      const i = t.xs.indexOf(Number(m[1]));
      const hi = t.ys[i] > t.ys2[i] ? t.names[0] : t.ys2[i] > t.ys[i] ? t.names[1] : null;
      if (i >= 0 && hi !== m[2]) return `the prompt says ${m[2]}'s line is higher at ${m[1]}, the graph does not`;
    }
  }
  return '';
}

export default { solve, sane };
