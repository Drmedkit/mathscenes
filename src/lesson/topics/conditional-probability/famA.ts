// famA.ts: stage-1 families of "Conditional probability and independence" (sub-goals 1-9): reading a compound sample
// space (dice grid, tree), 'and' / 'or' / 'not', the parts of a two-way table, the condition as the new whole, the
// notation P(A | B), renormalizing weights, and the impossible condition (undefined) versus the zero answer. Pure.
import { red, redP, type Gen, type Opt, MC, ans, choice, fh, fracItem, ft, int, numItem, pick, shuffle, until, who, word } from './common';
import { CTX2, CTX23, type Cat, type Ctx, DIE, OUTCOMES, cellsOf, countD, diceEvent, genTable, numEvent, range, sameEvent, totals } from './cp';
import type { CPic } from './CondPic';

// ---------- shared pictures and words ----------
export const an = (w: string) => `${/^[aeiou]/i.test(w) ? 'an' : 'a'} ${w}`;
const SUMS = DIE.map(r => DIE.map(b => String(r + b)));
export const diceGrid = (o: { A?: [number, number][]; B?: [number, number][]; cond?: [number, number][]; title?: string } = {}): CPic =>
  ({ kind: 'grid', rowName: 'red die', colName: 'blue die', rowVals: DIE.map(String), colVals: DIE.map(String), text: SUMS, title: o.title ?? 'one cell per roll; it shows the sum', A: o.A, B: o.B, cond: o.cond });
export const setText = (xs: readonly number[]): string => (xs.length ? `{${xs.join(', ')}}` : 'no outcomes (the empty set)');
/** a context for a table: 2x2 mostly, sometimes 2x3 */
export function tableCtx(R: () => number, wide = 0.3): { ctx: Ctx; cells: number[][] } {
  const w = R() < wide;
  const ctx = w ? pick(R, CTX23) : pick(R, CTX2);
  return { ctx, cells: genTable(R, 2, w ? 3 : 2, 40, 200) };
}
export const tablePic = (ctx: Ctx, cells: number[][], o: Partial<Extract<CPic, { kind: 'table' }>> = {}): CPic =>
  ({ kind: 'table', rows: ctx.rows.map(r => r.label), cols: ctx.cols.map(c => c.label), cells, title: o.title ?? `${totals(cells).all} ${ctx.who}`, ...o });

// ===================== compound-sample-space =====================
export const diceCount: Gen = (R, n) => {
  const ev = diceEvent(R, 'sum,doubles,six,diff,atleast,atmost');
  const v = countD(ev.f);
  const merged = OUTCOMES.filter(([r, b]) => r <= b && ev.f(r, b)).length;
  return numItem({
    id: `diceCount-${n}`, family: 'diceCount',
    prompt: `${who(R)} rolls a red die and a blue die. The grid shows all 36 outcomes: each cell is one (red, blue) roll. How many outcomes are there where <b>${ev.t}</b>?`,
    board: `\\text{outcomes} = \\,?`, unit: 'outcomes',
    picture: { pics: [diceGrid({ A: cellsOf(ev.f) })] },
    solution: [`Each cell is one ordered roll: red 2 with blue 5 is a different cell from red 5 with blue 2.`, `Count the cells where ${ev.t}: ${ans(v)} outcomes.`],
  }, v, `Yes: ${v} cells. Each cell counts once, and (2, 5) and (5, 2) are two different cells.`,
  [[merged, MC.merged, `${merged} treats rolls like (2, 5) and (5, 2) as one outcome. With a red and a blue die they are two different cells: count both.`], [36, undefined, '36 is every outcome. Count only the cells where the event happens.']],
  `Find each cell where ${ev.t}, and count every cell once.`);
};

const COLORS = ['red', 'blue', 'green', 'yellow', 'purple', 'orange'];
export const treeCount: Gen = (R, n) => {
  const v = int(R, 0, 2);
  let levels: { name: string; opts: string[] }[], story: string, what: string;
  if (v === 0) {
    const k = int(R, 3, 6), cols = shuffle(R, COLORS.slice()).slice(0, k);
    levels = [{ name: 'coin', opts: ['H', 'T'] }, { name: 'spinner', opts: cols }];
    story = `You toss a coin, then spin a spinner with ${word(k)} equal sections (${cols.join(', ')}).`; what = 'outcomes';
  } else if (v === 1) {
    const a = int(R, 2, 4), b = int(R, 3, 4);
    const mains = ['pasta', 'tacos', 'curry', 'salad'].slice(0, a), sides = ['soup', 'fries', 'fruit', 'rice'].slice(0, b);
    levels = [{ name: 'main', opts: mains }, { name: 'side', opts: sides }];
    story = `A food truck combo is one main (${mains.join(', ')}) and one side (${sides.join(', ')}).`; what = 'combos';
  } else {
    const k = int(R, 3, 4);
    levels = [{ name: 'spinner', opts: ['1', '2', '3', '4'].slice(0, k) }, { name: 'die', opts: ['1', '2', '3', '4', '5', '6'].slice(0, 4) }];
    story = `You spin a spinner numbered 1 to ${k}, then roll a four-sided die numbered 1 to 4.`; what = 'outcomes';
  }
  const sizes = levels.map(l => l.opts.length), total = sizes[0]! * sizes[1]!;
  return numItem({
    id: `treeCount-${n}`, family: 'treeCount',
    prompt: `${story} The tree is drawn in full for the first ${levels[0]!.name} result only. How many complete ${what} are there in all?`,
    board: `\\text{${what}} = \\,?`, unit: what,
    picture: { pics: [{ kind: 'ctree', levels, grow: 1 }] },
    solution: [`A complete outcome is a whole path: one ${levels[0]!.name} result, then one ${levels[1]!.name} result.`, `Every first branch grows the same ${sizes[1]} second branches: ${sizes[0]} × ${sizes[1]} = ${ans(total)} ${what}.`],
  }, total, `Yes: ${sizes[0]} × ${sizes[1]} = ${total} complete paths.`,
  [[sizes[0]! + sizes[1]!, MC.branchLabels, `${sizes[0]! + sizes[1]!} adds the branch labels. An outcome is a whole path from the root to the end: count the ends of the paths.`]],
  `Count the paths after the first branch, then remember every first branch has the same number.`);
};

// ===================== event-intersection / event-union =====================
function dicePair(R: () => number, forceEmpty: boolean) {
  return until(() => ({ a: diceEvent(R), b: diceEvent(R) }), ({ a, b }) => {
    if (sameEvent(a, b)) return false;
    const na = countD(a.f), nb = countD(b.f), nab = countD((r, x) => a.f(r, x) && b.f(r, x));
    if (na < 2 || nb < 2 || na > 20 || nb > 20) return false;
    return forceEmpty ? nab === 0 : nab > 0 && nab < Math.min(na, nb);
  });
}
export const andDice: Gen = (R, n) => {
  const { a, b } = dicePair(R, R() < 0.2);
  const na = countD(a.f), nb = countD(b.f), nab = countD((r, x) => a.f(r, x) && b.f(r, x)), nor = countD((r, x) => a.f(r, x) || b.f(r, x));
  return numItem({
    id: `andDice-${n}`, family: 'andDice',
    prompt: `Roll a red die and a blue die. Event A: <b>${a.t}</b>. Event B: <b>${b.t}</b>. How many of the 36 outcomes are in <b>A and B</b> (A ∩ B)?`,
    board: `n(A \\cap B) = \\,?`, unit: 'outcomes',
    picture: { pics: [diceGrid({ A: cellsOf(a.f), B: cellsOf(b.f) })] },
    solution: [`A has ${na} cells and B has ${nb} cells. "A and B" keeps only the cells that are in both.`, nab ? `${nab === 1 ? 'One cell is' : `${nab} cells are`} in both: n(A ∩ B) = ${ans(nab)}.` : `No cell is in both, so A ∩ B is empty: ${ans(0)} outcomes.`],
  }, nab, nab ? `Yes: ${nab} cells are in both events.` : 'Yes: no roll does both, so A and B is empty: 0.',
  [[na + nb, MC.interSum, `${na + nb} adds A (${na}) and B (${nb}). "And" keeps only the cells in both events, so it can't be bigger than either one.`],
   [nor, MC.andOr, `${nor} counts the cells in A or B (either one). "And" needs both at once.`]],
  'Mark the cells of A, then keep only those that are also in B.');
};
export const andList: Gen = (R, n) => {
  const N = int(R, 10, 20), xs = range(N);
  const { a, b } = until(() => ({ a: numEvent(R, N), b: numEvent(R, N) }), ({ a, b }) => {
    const A = xs.filter(a.f), B = xs.filter(b.f);
    return a.s !== b.s && A.length >= 2 && B.length >= 2 && A.length + B.length <= 14 && A.join() !== B.join();
  });
  const A = xs.filter(a.f), B = xs.filter(b.f), I = A.filter(x => b.f(x)), U = xs.filter(x => a.f(x) || b.f(x));
  const right = setText(I);
  const opts: Opt[] = [
    { t: right, ok: true, key: right, say: I.length ? `Right: ${I.join(', ')} ${I.length === 1 ? 'is' : 'are'} in both events.` : 'Right: no number is in both events, so A ∩ B is empty.' },
    { t: setText(U), key: setText(U), mc: MC.andOr, say: `That is A or B: every number in at least one event. "And" keeps only the numbers in both.` },
    { t: setText(A), key: setText(A), say: 'That is all of A. Keep only the numbers of A that are also in B.' },
    { t: setText(B), key: setText(B), say: 'That is all of B. Keep only the numbers of B that are also in A.' },
  ];
  return choice(R, {
    id: `andList-${n}`, family: 'andList',
    prompt: `A number is picked at random from 1 to ${N}. Event A: <b>${a.t}</b>. Event B: <b>${b.t}</b>. Which outcomes are in <b>A and B</b> (A ∩ B)?`,
    board: `A \\cap B = \\,?`,
    picture: { pics: [{ kind: 'chips', items: xs.map(String), A: A.map(x => x - 1), B: B.map(x => x - 1), legend: [`A: ${a.s}`, `B: ${b.s}`] }] },
    solution: [`A = ${setText(A)}, B = ${setText(B)}.`, `A ∩ B keeps the numbers in both lists: ${ans(right)}.`],
  }, opts);
};
export const orDice: Gen = (R, n) => {
  const { a, b } = dicePair(R, R() < 0.15);
  const na = countD(a.f), nb = countD(b.f), nab = countD((r, x) => a.f(r, x) && b.f(r, x)), nor = countD((r, x) => a.f(r, x) || b.f(r, x));
  return numItem({
    id: `orDice-${n}`, family: 'orDice',
    prompt: `Roll a red die and a blue die. Event A: <b>${a.t}</b>. Event B: <b>${b.t}</b>. How many of the 36 outcomes are in <b>A or B</b> (A ∪ B)? "Or" includes rolls that do both.`,
    board: `n(A \\cup B) = \\,?`, unit: 'outcomes',
    picture: { pics: [diceGrid({ A: cellsOf(a.f), B: cellsOf(b.f) })] },
    solution: [`A has ${na} cells, B has ${nb}, and ${nab} ${nab === 1 ? 'cell is' : 'cells are'} in both.`, `Count every cell in at least one event once: ${na} + ${nb} − ${nab} = ${ans(nor)}.`],
  }, nor, `Yes: ${nor} cells are in A, in B, or in both.`,
  [[na + nb, MC.overlap, `${na + nb} counts the ${nab} shared ${nab === 1 ? 'cell' : 'cells'} twice. List each cell once.`],
   [na + nb - 2 * nab, MC.orExcl, `${na + nb - 2 * nab} leaves out the rolls that do both. "Or" includes them.`],
   [nab, MC.andOr, `${nab} counts only the cells in both. "Or" needs at least one.`]],
  'Mark A, then add the cells of B that are not marked yet.');
};
export const orList: Gen = (R, n) => {
  const N = int(R, 10, 16), xs = range(N);
  const { a, b } = until(() => ({ a: numEvent(R, N), b: numEvent(R, N) }), ({ a, b }) => {
    const A = xs.filter(a.f), B = xs.filter(b.f), I = A.filter(x => b.f(x));
    return a.s !== b.s && A.length >= 2 && B.length >= 2 && I.length >= 1 && I.length < Math.min(A.length, B.length) && A.length + B.length <= 13;
  });
  const A = xs.filter(a.f), B = xs.filter(b.f), I = A.filter(x => b.f(x)), U = xs.filter(x => a.f(x) || b.f(x));
  const twice = [...A, ...B].sort((p, q) => p - q), sym = U.filter(x => !(a.f(x) && b.f(x)));
  const right = setText(U);
  return choice(R, {
    id: `orList-${n}`, family: 'orList',
    prompt: `A number is picked at random from 1 to ${N}. Event A: <b>${a.t}</b>. Event B: <b>${b.t}</b>. Which list shows the outcomes in <b>A or B</b> (A ∪ B)?`,
    board: `A \\cup B = \\,?`,
    picture: { pics: [{ kind: 'chips', items: xs.map(String), A: A.map(x => x - 1), B: B.map(x => x - 1), legend: [`A: ${a.s}`, `B: ${b.s}`] }] },
    solution: [`A = ${setText(A)}, B = ${setText(B)}; ${setText(I)} ${I.length === 1 ? 'is' : 'are'} in both.`, `A ∪ B lists every number in at least one event, each once: ${ans(right)}.`],
  }, [
    { t: right, ok: true, key: right, say: 'Right: every number in A or in B, and the shared ones only once.' },
    { t: setText(twice), key: 'twice', mc: MC.overlap, say: `${I.join(' and ')} ${I.length === 1 ? 'appears' : 'appear'} twice. An outcome is listed once, even when it is in both events.` },
    { t: setText(sym), key: setText(sym), mc: MC.orExcl, say: `This drops ${I.join(' and ')}, which ${I.length === 1 ? 'is' : 'are'} in both. In probability "or" includes both.` },
    { t: setText(I), key: setText(I), mc: MC.andOr, say: 'That is A and B: only the numbers in both. "Or" needs at least one.' },
  ]);
};

// ===================== event-complement =====================
export const notDice: Gen = (R, n) => {
  const ev = until(() => diceEvent(R, 'sum,atleast,atmost,doubles,six,greater,diff'), e => { const k = countD(e.f); return k >= 3 && k <= 30; });
  const v = countD(ev.f);
  return numItem({
    id: `notDice-${n}`, family: 'notDice',
    prompt: `Roll a red die and a blue die (36 outcomes). Event A: <b>${ev.t}</b>. How many outcomes are in <b>not A</b> (the complement of A)?`,
    board: `n(A^{c}) = 36 - n(A) = \\,?`, unit: 'outcomes',
    picture: { pics: [diceGrid({ A: cellsOf(ev.f) })] },
    solution: [`A has ${v} cells. Not A is every other cell of the 36.`, `36 − ${v} = ${ans(36 - v)}.`],
  }, 36 - v, `Yes: 36 − ${v} = ${36 - v} cells are outside A.`,
  [[v, undefined, `${v} is A itself. Not A is every outcome outside A.`]],
  'Count the cells of A, then take them away from all 36.');
};
const CLUBS: [string, string, string, string, string][] = [
  ['Spanish', 'art', 'take Spanish', 'take art', 'do not take Spanish'], ['soccer', 'band', 'play soccer', 'are in the band', 'do not play soccer'],
  ['chess', 'robotics', 'are in chess club', 'are in robotics', 'are not in chess club'], ['bike', 'bus', 'bike to school some days', 'ride the bus some days', 'never bike to school'],
  ['dog', 'cat', 'have a dog', 'have a cat', 'do not have a dog'],
];
export const notVenn: Gen = (R, n) => {
  const [na, nb, ha, hb, nota] = pick(R, CLUBS);
  const v = until(() => ({ a: int(R, 4, 18), ab: int(R, 2, 9), b: int(R, 4, 18), out: int(R, 3, 14) }), q => new Set([q.a, q.ab, q.b, q.out]).size === 4);
  const tot = v.a + v.ab + v.b + v.out, right = v.b + v.out;
  return numItem({
    id: `notVenn-${n}`, family: 'notVenn',
    prompt: `In a class of ${tot}, the Venn diagram shows who ${ha} (A) and who ${hb} (B). How many students are in <b>not A</b>: they ${nota}?`,
    board: `n(A^{c}) = \\,?`, unit: 'students',
    picture: { pics: [{ kind: 'venn', a: na, b: nb, vals: { a: String(v.a), ab: String(v.ab), b: String(v.b), out: String(v.out) }, hl: ['b', 'out'] }] },
    solution: [`Not A is everything outside circle A: the "${nb} only" region and the region outside both circles.`, `${v.b} + ${v.out} = ${ans(right)} students (check: ${tot} − ${v.a + v.ab} = ${right}).`],
  }, right, `Yes: ${v.b} + ${v.out} = ${right}. Outside A means outside the whole circle, including the students in neither club.`,
  [[v.b, MC.partialComp, `${v.b} is only the part of B outside A. The ${v.out} students in neither are not in A either.`],
   [v.out, MC.partialComp, `${v.out} counts only the students in neither. The ${v.b} in B only are also outside A.`],
   [v.a, undefined, `${v.a} are in A only. Not A is everything outside circle A.`]],
  'Not A is the whole class minus everyone inside circle A.');
};

// ===================== two-way-table-structure =====================
const label = (x: Cat) => `"${x.label}"`;
export const tableRead: Gen = (R, n) => {
  const { ctx, cells } = tableCtx(R);
  const T = totals(cells), C = ctx.cols.length;
  const r = int(R, 0, 1), c = int(R, 0, C - 1), kind = pick(R, ['joint', 'joint', 'margin', 'comp']);
  const row = ctx.rows[r]!, col = ctx.cols[c]!;
  if (kind === 'joint') {
    const v = cells[r]![c]!;
    return numItem({
      id: `tableRead-${n}`, family: 'tableRead',
      prompt: `${ctx.place}. How many ${ctx.who} ${row.has} <b>and</b> ${col.has}?`,
      board: `n(\\text{${row.label}} \\cap \\text{${col.label}}) = \\,?`, unit: ctx.who,
      picture: { pics: [tablePic(ctx, cells, { parts: [[r, c]] })] },
      solution: [`"And" is one joint cell: the ${label(row)} row crossed with the ${label(col)} column.`, `That cell holds ${ans(v)}.`],
    }, v, `Yes: the joint cell where the ${row.label} row meets the ${col.label} column: ${v}.`,
    [[T.row[r]!, MC.totalCell, `${T.row[r]} is the total of the ${row.label} row: everyone in that row, whatever their column. "And" is one inside cell.`],
     [T.col[c]!, MC.totalCell, `${T.col[c]} is the total of the ${col.label} column. "And" is the one cell where the row and the column meet.`],
     [T.all, MC.totalOne, `${T.all} is everyone surveyed. Find the cell in the ${row.label} row and the ${col.label} column.`]],
    'Find the row, find the column, and read the cell where they cross.');
  }
  if (kind === 'margin') {
    const v = T.col[c]!;
    return numItem({
      id: `tableRead-${n}`, family: 'tableRead',
      prompt: `${ctx.place}. In all, how many of the ${ctx.who} ${col.has}?`,
      board: `n(\\text{${col.label}}) = \\,?`, unit: ctx.who,
      picture: { pics: [tablePic(ctx, cells, { parts: [[2, c]] })] },
      solution: [`One category alone is a margin: the total at the bottom of the ${label(col)} column.`, `${cells.map(rw => rw[c]).join(' + ')} = ${ans(v)}.`],
    }, v, `Yes: the ${col.label} column total, ${v}.`,
    [[T.all, MC.totalOne, `${T.all} is everyone surveyed. Only the ${col.label} column counts.`],
     ...cells.map((rw, i) => [rw[c]!, MC.totalCell, `${rw[c]} is only the ${ctx.rows[i]!.label} part of the column. The column total adds every row.`] as [number, string, string])],
    'One category is a total: the margin of its row or column.');
  }
  const v = T.all - T.col[c]!;
  const others = ctx.cols.map((_, j) => j).filter(j => j !== c);
  return numItem({
    id: `tableRead-${n}`, family: 'tableRead',
    prompt: `${ctx.place}. How many ${ctx.who} are <b>not</b> in the ${label(col)} column, that is, not ${col.group}?`,
    board: `n(\\text{not ${col.label}}) = \\,?`, unit: ctx.who,
    picture: { pics: [tablePic(ctx, cells, { parts: others.map(j => [2, j] as [number, number]) })] },
    solution: [`Not ${col.label} is every other column, or the grand total minus the ${col.label} total.`, `${T.all} − ${T.col[c]} = ${ans(v)}.`],
  }, v, `Yes: ${T.all} − ${T.col[c]} = ${v}.`,
  [...others.flatMap(j => cells.map((rw, i) => [rw[j]!, MC.partialComp, `${rw[j]} is only the ${ctx.rows[i]!.label} part of ${ctx.cols[j]!.label}. Not ${col.label} includes every row of the other column${others.length > 1 ? 's' : ''}.`] as [number, string, string])),
   [T.col[c]!, undefined, `${T.col[c]} are the ${col.label} ${ctx.who} themselves. Not ${col.label} is everyone else.`]],
  'Take the grand total and subtract the total of that column.');
};
export const tableFill: Gen = (R, n) => {
  const { ctx, cells } = tableCtx(R);
  const T = totals(cells), C = ctx.cols.length;
  const r = int(R, 0, 1), c = int(R, 0, C - 1);
  const v = cells[r]![c]!, rest = cells[r]!.filter((_, j) => j !== c);
  return numItem({
    id: `tableFill-${n}`, family: 'tableFill',
    prompt: `${ctx.place}. One count is missing. How many ${ctx.who} ${ctx.rows[r]!.has} and ${ctx.cols[c]!.has}?`,
    board: `\\text{missing} = \\,?`, unit: ctx.who,
    picture: { pics: [tablePic(ctx, cells, { hide: [`${r},${c}`], parts: [[r, c]] })] },
    solution: [`The cells of the ${label(ctx.rows[r]!)} row add up to its total, ${T.row[r]}.`, `${T.row[r]} − ${rest.join(' − ')} = ${ans(v)}.`],
  }, v, `Yes: ${T.row[r]} − ${rest.join(' − ')} = ${v}. Check it with the column too: the column adds up to ${T.col[c]}.`,
  [[T.row[r]!, MC.totalCell, `${T.row[r]} is the whole row. The missing cell is only part of it: subtract the other cell${rest.length > 1 ? 's' : ''}.`],
   [T.row[r]! + rest.reduce((s, x) => s + x, 0), undefined, 'The cells make up the total, so subtract the known cells from the total.']],
  'The cells of a row add up to the row total. Subtract the known cells.');
};

// ===================== restrict-sample-space =====================
export const restrictDice: Gen = (R, n) => {
  if (R() < 0.3) {
    const k = int(R, 1, 4), kind = pick(R, ['gt', 'lt', 'even', 'odd']);
    const f = (x: number) => (kind === 'gt' ? x > k : kind === 'lt' ? x < k + 2 : kind === 'even' ? x % 2 === 0 : x % 2 === 1);
    const t = kind === 'gt' ? `greater than ${k}` : kind === 'lt' ? `less than ${k + 2}` : kind;
    const keep = DIE.filter(f);
    return numItem({
      id: `restrictDice-${n}`, family: 'restrictDice',
      prompt: `You roll one die and a friend tells you the roll is <b>${t}</b>. Given that, how many outcomes are still possible?`,
      board: `\\text{outcomes left} = \\,?`, unit: 'outcomes',
      picture: { pics: [{ kind: 'chips', items: DIE.map(String), cond: keep.map(x => x - 1) }] },
      solution: [`"Given" rules out every face that does not fit: keep only the rolls ${t}.`, `They are ${keep.join(', ')}: ${ans(keep.length)} outcomes.`],
    }, keep.length, `Yes: ${keep.join(', ')}. Those ${keep.length} outcomes are the new sample space.`,
    [[6, MC.newWhole, '6 is every face. Once you know the condition, the faces that break it are gone.']],
    'Cross out every face that breaks the condition and count the rest.');
  }
  const ev = until(() => diceEvent(R, 'sum,atleast,atmost,doubles,face,greater,six,diff'), e => { const k = countD(e.f); return k >= 2 && k <= 18; });
  const v = countD(ev.f);
  return numItem({
    id: `restrictDice-${n}`, family: 'restrictDice',
    prompt: `Roll a red die and a blue die. You are told that <b>${ev.t}</b>. Given that, how many of the 36 outcomes are still possible?`,
    board: `\\text{outcomes left} = \\,?`, unit: 'outcomes',
    picture: { pics: [diceGrid({ cond: cellsOf(ev.f) })] },
    solution: [`The condition rules out every cell where it fails. Only the cells where ${ev.t} remain.`, `That leaves ${ans(v)} outcomes: the new sample space.`],
  }, v, `Yes: ${v} cells remain. They are the new whole.`,
  [[36, MC.newWhole, '36 is every roll. Once you know the condition, only the cells that fit it are left.']],
  'Keep only the cells where the condition holds, and count them.');
};
export const restrictTable: Gen = (R, n) => {
  const { ctx, cells } = tableCtx(R, 0.4);
  const T = totals(cells), byRow = R() < 0.5;
  const i = byRow ? int(R, 0, 1) : int(R, 0, ctx.cols.length - 1);
  const cat = byRow ? ctx.rows[i]! : ctx.cols[i]!;
  const word0 = pick(R, ['among', 'of those who', 'given that they']);
  const cond = word0 === 'among' ? `among the ${cat.group}` : word0 === 'of those who' ? `of those who ${cat.has}` : `given that the ${ctx.one} ${cat.one}`;
  const strip = (row: boolean, j: number) => row ? `the ${ctx.rows[j]!.label} row (${T.row[j]} ${ctx.who})` : `the ${ctx.cols[j]!.label} column (${T.col[j]} ${ctx.who})`;
  const right = strip(byRow, i);
  const otherDim = byRow ? int(R, 0, ctx.cols.length - 1) : int(R, 0, 1);
  return choice(R, {
    id: `restrictTable-${n}`, family: 'restrictTable',
    prompt: `${ctx.place}. One ${ctx.one} is picked at random, ${cond}. Which part of the table is now the whole (the reduced sample space)?`,
    board: `\\text{new whole} = \\,?`,
    picture: { pics: [tablePic(ctx, cells, { whole: { kind: byRow ? 'row' : 'col', i } })] },
    solution: [`The condition (${cat.group}) rules out everyone else.`, `Only the ${cat.label} ${byRow ? 'row' : 'column'} is left: its total, ${byRow ? T.row[i] : T.col[i]}, is the new whole.`, `So: ${ans(right)}.`],
  }, [
    { t: right, ok: true, key: 'right', say: `Right: only the ${cat.group} are still possible.` },
    { t: `the whole table (${T.all} ${ctx.who})`, key: 'all', mc: MC.newWhole, say: `The condition rules out everyone who is not one of the ${cat.group}. They are not possible any more.` },
    { t: strip(!byRow, otherDim), key: 'other', mc: MC.inverse, say: `That ${byRow ? 'column' : 'row'} is a different group. The condition names the ${cat.group}.` },
    { t: strip(byRow, byRow ? 1 - i : (i + 1) % ctx.cols.length), key: 'compl', say: `Those are exactly the ${ctx.who} the condition rules out.` },
  ]);
};

// ===================== conditional-notation =====================
function events(R: () => number) {
  const ctx = pick(R, CTX2);
  return { ctx, A: ctx.cols[0]!, B: ctx.rows[0]! };
}
export const notationRead: Gen = (R, n) => {
  const { ctx, A, B } = events(R);
  const flip = R() < 0.5;
  const [X, Y] = flip ? [B, A] : [A, B];   // the board shows P(X | Y) with X, Y named A / B
  const xn = flip ? 'B' : 'A', yn = flip ? 'A' : 'B';
  const right = `Of the ${Y.group}, the fraction who ${X.has}`;
  return choice(R, {
    id: `notationRead-${n}`, family: 'notationRead',
    prompt: `${ctx.place}. One ${ctx.one} is picked at random. A: the ${ctx.one} ${A.one}. B: the ${ctx.one} ${B.one}. What does <b>P(${xn} | ${yn})</b> mean?`,
    board: `P(${xn} \\mid ${yn})`,
    solution: [`The event after the bar is the condition: it names the group we look inside.`, `P(${xn} | ${yn}): among the ${Y.group}, the share who ${X.has}.`],
  }, [
    { t: right, ok: true, key: 'r', say: `Right: ${yn} comes after the bar, so the ${Y.group} are the whole.` },
    { t: `Of the ${X.group}, the fraction who ${Y.has}`, key: 'inv', mc: MC.inverse, say: `That is P(${yn} | ${xn}): the condition is the event after the bar, ${yn}.` },
    { t: `The fraction of all ${ctx.who} who ${Y.has} and ${X.has}`, key: 'and', mc: MC.newWhole, say: `That is P(${xn} and ${yn}), out of everyone. The bar shrinks the whole to the ${Y.group}.` },
    { t: `P(${xn}) divided by P(${yn})`, key: 'div', mc: MC.barDiv, say: 'The bar is not a division sign. It means "given": look only inside the condition.' },
  ]);
};
export const notationWrite: Gen = (R, n) => {
  const { ctx, A, B } = events(R);
  const flip = R() < 0.5;
  const [X, Y] = flip ? [B, A] : [A, B];
  const xn = flip ? 'B' : 'A', yn = flip ? 'A' : 'B';
  const phr = pick(R, [
    `the probability that ${an(ctx.one)} who ${Y.one} also ${X.one}`,
    `among the ${Y.group}, the probability that one picked at random ${X.one}`,
    `the probability that the ${ctx.one} ${X.one}, given that the ${ctx.one} ${Y.one}`,
  ]);
  return choice(R, {
    id: `notationWrite-${n}`, family: 'notationWrite',
    prompt: `${ctx.place}. One ${ctx.one} is picked at random. A: the ${ctx.one} ${A.one}. B: the ${ctx.one} ${B.one}. Which notation means <b>${phr}</b>?`,
    board: `P(\\;?\\;)`,
    solution: [`The condition is what we already know: the ${ctx.one} ${Y.one}, event ${yn}. It goes after the bar.`, `So it is ${ans(`P(${xn} | ${yn})`)}.`],
  }, [
    { t: `P(${xn} | ${yn})`, ok: true, key: 'r', say: `Right: ${yn} is the condition, so it goes after the bar.` },
    { t: `P(${yn} | ${xn})`, key: 'inv', mc: MC.inverse, say: `That makes ${xn} the condition. Here we know the ${ctx.one} ${Y.one}: that is ${yn}.` },
    { t: `P(${xn} and ${yn})`, key: 'and', mc: MC.newWhole, say: `P(${xn} and ${yn}) is out of everyone. Here the whole is only the ${Y.group}.` },
    { t: `P(${xn}) ÷ P(${yn})`, key: 'div', mc: MC.barDiv, say: 'A conditional probability is not P of one event divided by P of the other.' },
  ]);
};

// ===================== renormalize-new-whole =====================
const SPIN = ['red', 'blue', 'green', 'yellow'];
export const spinnerCond: Gen = (R, n) => {
  const k = int(R, 3, 4), D = pick(R, [8, 10, 12]);
  const w = until(() => { const xs: number[] = []; let left = D; for (let i = 0; i < k - 1; i++) { const x = int(R, 1, left - (k - 1 - i)); xs.push(x); left -= x; } xs.push(left); return xs; }, xs => xs.every(x => x >= 1) && new Set(xs).size >= k - 1);
  const cols = shuffle(R, SPIN.slice()).slice(0, k);
  const out = int(R, 0, k - 1), keep = cols.map((_, i) => i).filter(i => i !== out);
  const t = pick(R, keep), tot = keep.reduce((s, i) => s + w[i]!, 0);
  return fracItem({
    id: `spinnerCond-${n}`, family: 'spinnerCond',
    prompt: `A spinner has ${word(k)} sections of different sizes; the legend gives the probability of each color. You spin, and a friend tells you it did <b>not</b> land on ${cols[out]}. What is the probability it landed on <b>${cols[t]}</b>?`,
    board: `P(\\text{${cols[t]}} \\mid \\text{not ${cols[out]}}) = \\,?`,
    picture: { pics: [{ kind: 'spinner', sectors: cols.map((c0, i) => ({ label: c0, w: w[i]!, p: `\\tfrac{${w[i]! / gcdN(w[i]!, D)}}{${D / gcdN(w[i]!, D)}}` })), cond: keep }] },
    solution: [`Not ${cols[out]} leaves ${keep.map(i => cols[i]).join(', ')}: together ${keep.map(i => `${w[i]}/${D}`).join(' + ')} = ${tot}/${D}. That is the new whole.`,
      `${cols[t]} keeps its weight: (${w[t]}/${D}) ÷ (${tot}/${D}) = ${red(w[t]!, tot)}.`],
  }, w[t]!, tot, `Yes: ${cols[t]} is ${w[t]} of the ${tot} parts that are left, ${ft(w[t]!, tot)}.`,
  [[1, keep.length, MC.equiprob, `The ${keep.length} colors left are not equally likely: ${cols[t]} keeps its own size. Divide its probability by the total that is left.`],
   [w[t]!, D, MC.newWhole, `${ft(w[t]!, D)} is ${cols[t]} out of the whole spinner. Not ${cols[out]} is ruled out, so the whole is only what is left.`]],
  `Add the probabilities that are left: that is the new whole. Divide ${cols[t]}'s probability by it.`);
};
const gcdN = (a: number, b: number): number => (b ? gcdN(b, a % b) : a);
export const jarCond: Gen = (R, n) => {
  const names = shuffle(R, ['red', 'blue', 'green', 'yellow']).slice(0, 3);
  const cnt = until(() => names.map(() => int(R, 2, 7)), xs => new Set(xs).size === 3 && xs.reduce((s, x) => s + x, 0) <= 16);
  const out = int(R, 0, 2), keep = [0, 1, 2].filter(i => i !== out), t = pick(R, keep);
  const tot = keep.reduce((s, i) => s + cnt[i]!, 0), N = cnt.reduce((s, x) => s + x, 0);
  const items = names.flatMap((nm, i) => Array.from({ length: cnt[i]! }, () => nm[0]!.toUpperCase()));
  const key = names.map(x => `${x[0]!.toUpperCase()} = ${x}`).join(', ');
  return fracItem({
    id: `jarCond-${n}`, family: 'jarCond',
    prompt: `A jar holds ${cnt.map((x, i) => `${x} ${names[i]}`).join(', ')} marbles. ${who(R)} pulls one out without looking and says, "It's not ${names[out]}." What is the probability it is <b>${names[t]}</b>?`,
    board: `P(\\text{${names[t]}} \\mid \\text{not ${names[out]}}) = \\,?`,
    picture: { pics: [{ kind: 'chips', title: key, items, cond: items.map((x, i) => (x !== names[out]![0]!.toUpperCase() ? i : -1)).filter(i => i >= 0), A: items.map((x, i) => (x === names[t]![0]!.toUpperCase() ? i : -1)).filter(i => i >= 0) }] },
    solution: [`Not ${names[out]} leaves ${tot} marbles: the new whole.`, `${cnt[t]} of them are ${names[t]}: ${red(cnt[t]!, tot)}.`],
  }, cnt[t]!, tot, `Yes: ${cnt[t]} of the ${tot} marbles that are left.`,
  [[1, 2, MC.equiprob, `Two colors are left, but not equally many marbles: count the ${names[t]} ones out of all that are left.`],
   [cnt[t]!, N, MC.newWhole, `${ft(cnt[t]!, N)} uses all ${N} marbles. The ${cnt[out]} ${names[out]} ones are ruled out.`]],
  'Cross out the ruled-out marbles, then count inside what is left.');
};

// ===================== zero-probability-condition =====================
const IMPOSSIBLE = ['the roll is 7', 'the roll is greater than 6', 'the roll is 0'];
export const zeroOrUndef: Gen = (R, n) => {
  const imp = R() < 0.5;
  const A = pick(R, [{ t: 'the roll is even', f: (x: number) => x % 2 === 0 }, { t: 'the roll is 5', f: (x: number) => x === 5 }, { t: 'the roll is less than 3', f: (x: number) => x < 3 }, { t: 'the roll is a 1', f: (x: number) => x === 1 }, { t: 'the roll is odd', f: (x: number) => x % 2 === 1 }]);
  let B: { t: string; f: (x: number) => boolean };
  if (imp) B = { t: pick(R, IMPOSSIBLE), f: () => false };
  else B = until(() => pick(R, [{ t: 'the roll is even', f: (x: number) => x % 2 === 0 }, { t: 'the roll is odd', f: (x: number) => x % 2 === 1 }, { t: 'the roll is greater than 4', f: (x: number) => x > 4 }, { t: 'the roll is 6', f: (x: number) => x === 6 }, { t: 'the roll is less than 3', f: (x: number) => x < 3 }]), b => DIE.some(b.f) && !DIE.some(x => b.f(x) && A.f(x)));
  const pa = DIE.filter(A.f).length;
  const nb = DIE.filter(B.f).length;
  return choice(R, {
    id: `zeroOrUndef-${n}`, family: 'zeroOrUndef',
    prompt: `Roll one fair die. A: <b>${A.t}</b>. B: <b>${B.t}</b>. What is P(A | B)?`,
    board: `P(A \\mid B) = \\dfrac{P(A \\cap B)}{P(B)}`,
    picture: { pics: [{ kind: 'chips', items: DIE.map(String), A: DIE.filter(A.f).map(x => x - 1), B: DIE.filter(B.f).map(x => x - 1), legend: ['A', 'B'] }] },
    solution: imp ? [`B can never happen on a die (${B.t}), so P(B) = 0.`, `There is no group to look inside, and the formula would divide by 0: P(A | B) is undefined.`, `So: ${ans('undefined: B can never happen')}.`]
      : [`B can happen: ${nb} ${nb === 1 ? 'face' : 'faces'} (${DIE.filter(B.f).join(', ')}).`, `None of them is in A, so P(A | B) = 0/${nb} = ${ans('0')}.`],
  }, [
    { t: '0', ok: !imp, key: '0', mc: imp ? MC.zeroDen : undefined, say: imp ? 'B never happens, so there is nothing to look inside: dividing by P(B) = 0 is not 0, it is undefined.' : `Right: B can happen, and none of its faces is in A, so the answer is 0.` },
    { t: 'undefined: B can never happen', ok: imp, key: 'u', say: imp ? 'Right: P(B) = 0, so a probability "given B" has no meaning.' : `B can happen (${DIE.filter(B.f).join(', ')}). It just never happens together with A, so the answer is 0.` },
    { t: `${fh(pa, 6)}, the same as P(A)`, key: 'pa', say: imp ? 'Knowing B tells you something impossible happened; the formula divides by 0.' : 'Inside B, no face is in A, so the chance is not P(A).' },
    { t: '1', key: '1', say: 'For 1, every outcome of B would have to be in A.' },
  ]);
};
export const zeroFormula: Gen = (R, n) => {
  const imp = R() < 0.5;
  const pb = imp ? 0 : int(R, 2, 8) / 10, pa = int(R, 1, 6) / 10;
  const story = pick(R, [
    ['a game', 'A: you win a prize', 'B: you roll a 7 on a standard die', 'B: you land on a bonus square'],
    ['a board game', 'A: your token lands on the bonus square', 'B: you roll a sum of 13 with two dice', 'B: your token lands on the jail square'],
    ['a raffle with one prize per person', 'A: you win the bike', 'B: you hold ticket number 0 (tickets start at 1)', 'B: you win the TV'],
  ] as const);
  const bText = imp ? story[2] : story[3];
  return choice(R, {
    id: `zeroFormula-${n}`, family: 'zeroFormula',
    prompt: `In ${story[0]}, ${story[1]}, ${bText}. You know P(A) = ${pa}, P(B) = ${pb} and P(A and B) = 0. What is P(A | B)?`,
    board: `P(A \\mid B) = \\dfrac{P(A \\cap B)}{P(B)} = \\dfrac{0}{${pb}}`,
    solution: imp ? ['P(B) = 0: B never happens, so the fraction has 0 on the bottom.', `Dividing by 0 has no value: P(A | B) is ${ans('undefined')}.`]
      : [`P(B) = ${pb} > 0, so the formula works.`, `0 ÷ ${pb} = ${ans('0')}: inside B, A never happens.`],
  }, [
    { t: '0', ok: !imp, key: '0', mc: imp ? MC.zeroDen : undefined, say: imp ? 'The bottom is 0 too: 0 ÷ 0 is not 0. A probability given an impossible event is undefined.' : 'Right: B can happen, and A never happens with it.' },
    { t: 'undefined', ok: imp, key: 'u', say: imp ? 'Right: P(B) = 0, so there is no group to look inside.' : `P(B) = ${pb} is not 0, so the answer is a number: 0 ÷ ${pb}.` },
    { t: String(pa), key: 'pa', mc: MC.assumeIndep, say: 'That is P(A) itself. Use the formula: P(A and B) on top.' },
    { t: '1', key: '1', say: 'The top of the fraction is 0.' },
  ]);
};
