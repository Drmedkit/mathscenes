// famB.ts: stage-2 families of "Conditional probability and independence" (sub-goals 10-20): P(A | B) by counting
// in the reduced space and from two-way tables, building a table from records, joint / marginal / conditional
// relative frequencies, P(A | B) versus P(B | A), the formula P(A and B) / P(B), the two independence tests,
// drawing with and without replacement, and the multiplication rule. Pure: no DOM.
import { red, redP, type Gen, type Opt, CALC, MC, ans, choice, dec, fh, fracItem, ft, fx, int, isDec, numItem, pick, round, shuffle, until, who } from './common';
import { CTX2, type Ctx, DIE, cellsOf, countD, diceEvent, genIndep, genTable, numEvent, range, sameEvent, totals } from './cp';
import { an, diceGrid, tableCtx, tablePic } from './famA';

const cap = (s: string) => s[0]!.toUpperCase() + s.slice(1);

// ===================== count-conditional =====================
export const condDice: Gen = (R, n) => {
  const { a, b } = until(() => ({ a: diceEvent(R), b: diceEvent(R) }), ({ a, b }) => {
    const nb = countD(b.f), na = countD(a.f);
    return !sameEvent(a, b) && nb >= 2 && nb <= 18 && na >= 2 && na <= 24;
  });
  const na = countD(a.f), nb = countD(b.f), nab = countD((r, x) => a.f(r, x) && b.f(r, x));
  return fracItem({
    id: `condDice-${n}`, family: 'condDice',
    prompt: `Roll a red die and a blue die. A: <b>${a.t}</b>. B: <b>${b.t}</b>. You are told B happened. What is P(A | B)?`,
    board: `P(A \\mid B) = \\dfrac{n(A \\cap B)}{n(B)} = \\,?`,
    picture: { pics: [diceGrid({ A: cellsOf(a.f), cond: cellsOf(b.f) })] },
    solution: [`Given B, only the ${nb} cells of B are possible: the new whole.`, `${nab} of them ${nab === 1 ? 'is' : 'are'} also in A: P(A | B) = ${red(nab, nb)}.`],
  }, nab, nb, `Yes: ${nab} of the ${nb} cells of B are in A.`,
  [[nab, 36, MC.newWhole, `${ft(nab, 36)} divides by all 36 rolls. Given B, only the ${nb} cells of B are left.`],
   [nab, na, MC.inverse, `${ft(nab, na)} is P(B | A): it looks inside A. Here B is the condition, so look inside B.`],
   [na, 36, MC.newWhole, `${ft(na, 36)} is P(A) with no condition. Look only inside B.`]],
  'Shrink to the cells of B, then count the ones that are also in A.');
};
export const condNumbers: Gen = (R, n) => {
  const N = pick(R, [10, 12, 15, 16, 20]), xs = range(N);
  const { a, b } = until(() => ({ a: numEvent(R, N), b: numEvent(R, N) }), ({ a, b }) => {
    const A = xs.filter(a.f), B = xs.filter(b.f);
    return a.s !== b.s && B.length >= 2 && A.length >= 2 && A.join() !== B.join();
  });
  const A = xs.filter(a.f), B = xs.filter(b.f), I = B.filter(x => a.f(x));
  const ctxt = pick(R, [`A card is drawn at random from ${N} cards numbered 1 to ${N}.`, `A ticket is drawn at random from tickets numbered 1 to ${N}.`, `A raffle ball is drawn at random from balls numbered 1 to ${N}.`]);
  return fracItem({
    id: `condNumbers-${n}`, family: 'condNumbers',
    prompt: `${ctxt} A: <b>${a.t}</b>. B: <b>${b.t}</b>. What is the probability of A, given B?`,
    board: `P(A \\mid B) = \\,?`,
    picture: { pics: [{ kind: 'chips', items: xs.map(String), A: A.map(x => x - 1), cond: B.map(x => x - 1) }] },
    solution: [`Given B, the numbers left are ${B.join(', ')}: ${B.length} of them.`, `${I.length ? `${I.join(', ')} ${I.length === 1 ? 'is' : 'are'} also in A` : 'None of them is in A'}: P(A | B) = ${red(I.length, B.length)}.`],
  }, I.length, B.length, `Yes: ${I.length} of the ${B.length} numbers in B.`,
  [[I.length, N, MC.newWhole, `Out of all ${N} numbers is P(A and B). Given B, the whole is only the ${B.length} numbers in B.`],
   [I.length, A.length, MC.inverse, `That looks inside A: P(B | A). The condition is B.`]],
  'List the numbers in B; that list is the whole. Count the ones in A.');
};

// ===================== table-conditional =====================
export const tableCond: Gen = (R, n) => {
  const { ctx, cells } = tableCtx(R, 0.35);
  const T = totals(cells), C = ctx.cols.length;
  const byRow = R() < 0.5, r = int(R, 0, 1), c = int(R, 0, C - 1);
  const cond = byRow ? ctx.rows[r]! : ctx.cols[c]!, tgt = byRow ? ctx.cols[c]! : ctx.rows[r]!;
  const v = cells[r]![c]!, den = byRow ? T.row[r]! : T.col[c]!, other = byRow ? T.col[c]! : T.row[r]!;
  return fracItem({
    id: `tableCond-${n}`, family: 'tableCond',
    prompt: `${ctx.place}. One of the <b>${cond.group}</b> is picked at random. What is the probability that this ${ctx.one} ${tgt.one}?`,
    board: `P(\\text{${tgt.label}} \\mid \\text{${cond.label}}) = \\,?`,
    picture: { pics: [tablePic(ctx, cells, { whole: { kind: byRow ? 'row' : 'col', i: byRow ? r : c }, parts: [[r, c]] })] },
    solution: [`The condition is the ${cond.label} ${byRow ? 'row' : 'column'}: its total, ${den}, is the new whole.`, `${v} of them ${tgt.has}: ${red(v, den)}.`],
  }, v, den, `Yes: ${v} out of the ${den} ${cond.group}.`,
  [[v, T.all, MC.newWhole, `${v}/${T.all} divides by everyone. The ${ctx.one} is one of the ${cond.group}, so their total, ${den}, is the whole.`],
   [v, other, MC.inverse, `${v}/${other} divides by the ${tgt.label} total: that is the reverse question. The condition is ${cond.label}.`]],
  `Find the ${cond.label} total: it is the whole. The cell inside it is the part.`);
};
export const tableSwitch: Gen = (R, n) => {
  const { ctx, cells } = tableCtx(R, 0.6);
  const T = totals(cells), C = ctx.cols.length;
  const r = int(R, 0, 1), c1 = int(R, 0, C - 1), c2 = until(() => int(R, 0, C - 1), x => x !== c1);
  const row = ctx.rows[r]!, k1 = ctx.cols[c1]!, k2 = ctx.cols[c2]!;
  const v = cells[r]![c2]!;
  return fracItem({
    id: `tableSwitch-${n}`, family: 'tableSwitch',
    prompt: `${ctx.place}. Of the ${k1.group}, ${cells[r]![c1]} out of ${T.col[c1]} ${row.has}. Now ${an(ctx.one)} is picked at random from the <b>${k2.group}</b>. What is the probability the ${ctx.one} ${row.one}?`,
    board: `P(\\text{${row.label}} \\mid \\text{${k2.label}}) = \\,?`,
    picture: { pics: [tablePic(ctx, cells, { whole: { kind: 'col', i: c2 }, parts: [[r, c2]] })] },
    solution: [`A new condition means a new whole: the ${k2.label} column, ${T.col[c2]} ${ctx.who}.`, `${v} of them ${row.has}: ${red(v, T.col[c2]!)}.`],
  }, v, T.col[c2]!, `Yes: ${v} of the ${T.col[c2]} ${k2.group}.`,
  [[v, T.col[c1]!, MC.reuseDen, `${T.col[c1]} was the whole for the ${k1.group}. The condition changed, so the whole changes too: ${T.col[c2]}.`],
   [v, T.all, MC.newWhole, `${T.all} is everyone. Only the ${k2.group} count now.`],
   [v, T.row[r]!, MC.inverse, `${T.row[r]} is the ${row.label} total: that looks inside ${row.label}. The condition is ${k2.label}.`]],
  `The condition is ${k2.label}: use that column's total as the whole.`);
};

// ===================== build-two-way-table =====================
function records(R: () => number) {
  const ctx = pick(R, CTX2);
  const cells = until(() => [[int(R, 2, 7), int(R, 2, 7)], [int(R, 2, 7), int(R, 2, 7)]], g => { const T = totals(g); return T.all >= 12 && T.all <= 24 && new Set([...g.flat(), ...T.row, ...T.col]).size >= 7; });
  const codes = shuffle(R, cells.flatMap((rw, i) => rw.flatMap((k, j) => Array.from({ length: k }, () => `${i === 0 ? 'Y' : 'N'}${j === 0 ? 'Y' : 'N'}`))));
  const key = `${ctx.rows[0]!.label}? ${ctx.cols[0]!.label}?`;
  return { ctx, cells, codes, key };
}
const codeOf = (i: number, j: number) => `${i === 0 ? 'Y' : 'N'}${j === 0 ? 'Y' : 'N'}`;
const recWords = (ctx: Ctx) => `Each card is one ${ctx.one}: the first letter is Y if the ${ctx.one} ${ctx.rows[0]!.one} (N if not), the second is Y if the ${ctx.one} ${ctx.cols[0]!.one} (N if not).`;
export const buildCell: Gen = (R, n) => {
  const { ctx, cells, codes, key } = records(R);
  const T = totals(cells), i = int(R, 0, 1), j = int(R, 0, 1), v = cells[i]![j]!, cd = codeOf(i, j);
  return numItem({
    id: `buildCell-${n}`, family: 'buildCell',
    prompt: `${ctx.place}, ${codes.length} in all. ${recWords(ctx)} To build the two-way table, how many ${ctx.who} go in the cell <b>${ctx.rows[i]!.label} and ${ctx.cols[j]!.label}</b>?`,
    board: `\\text{cell } ${cd} = \\,?`, unit: ctx.who,
    picture: { pics: [{ kind: 'chips', title: key, items: codes, A: codes.map((x, q) => (x === cd ? q : -1)).filter(q => q >= 0) }] },
    solution: [`Each card goes in exactly one cell, by both of its letters at once. The ${ctx.rows[i]!.label} and ${ctx.cols[j]!.label} cell takes the cards ${cd}.`, `There are ${ans(v)} cards ${cd}.`],
  }, v, `Yes: ${v} cards read ${cd}.`,
  [[T.row[i]!, MC.marginTally, `${T.row[i]} counts every card with first letter ${cd[0]}, whatever the second letter. A cell needs both letters to match.`],
   [T.col[j]!, MC.marginTally, `${T.col[j]} counts every card with second letter ${cd[1]}. A cell needs both letters to match.`],
   [T.row[i]! + T.col[j]!, MC.twoCells, `That counts some ${ctx.who} twice, once per letter. Each card goes in one cell only.`]],
  `Count only the cards whose two letters are both right: ${cd}.`);
};
export const buildCond: Gen = (R, n) => {
  const { ctx, cells, codes, key } = records(R);
  const T = totals(cells), i = int(R, 0, 1), j = int(R, 0, 1), v = cells[i]![j]!;
  const rowCat = ctx.rows[i]!, colCat = ctx.cols[j]!;
  return fracItem({
    id: `buildCond-${n}`, family: 'buildCond',
    prompt: `${ctx.place}, ${codes.length} in all. ${recWords(ctx)} Sort the cards into a two-way table. Then: one of the <b>${rowCat.group}</b> is picked at random. What is the probability the ${ctx.one} ${colCat.one}?`,
    board: `P(\\text{${colCat.label}} \\mid \\text{${rowCat.label}}) = \\,?`,
    picture: { pics: [{ kind: 'chips', title: key, items: codes, cond: codes.map((x, q) => (x[0] === codeOf(i, 0)[0] ? q : -1)).filter(q => q >= 0), A: codes.map((x, q) => (x === codeOf(i, j) ? q : -1)).filter(q => q >= 0) }] },
    solution: [`The table: ${ctx.rows[0]!.label} row ${cells[0]![0]} and ${cells[0]![1]}, ${ctx.rows[1]!.label} row ${cells[1]![0]} and ${cells[1]![1]}.`, `The ${rowCat.label} row holds ${T.row[i]} cards; ${v} of them are ${colCat.label}: ${red(v, T.row[i]!)}.`],
  }, v, T.row[i]!, `Yes: ${v} of the ${T.row[i]} ${rowCat.group}.`,
  [[v, T.all, MC.newWhole, `${v}/${T.all} uses every card. Only the ${rowCat.group} are possible.`],
   [v, T.col[j]!, MC.inverse, `${v}/${T.col[j]} looks inside ${colCat.label}. The condition is ${rowCat.label}.`]],
  `Sort the cards first. The ${rowCat.label} row total is the whole.`);
};

// ===================== relative-frequency-summaries =====================
export const relKind: Gen = (R, n) => {
  const { ctx, cells } = tableCtx(R, 0.3);
  const T = totals(cells), r = int(R, 0, 1), c = int(R, 0, ctx.cols.length - 1);
  const row = ctx.rows[r]!, col = ctx.cols[c]!;
  const kinds = {
    joint: { num: cells[r]![c]!, den: T.all, t: `joint: the share of all ${ctx.who} who ${row.has} and ${col.has}` },
    marg: { num: T.row[r]!, den: T.all, t: `marginal: the share of all ${ctx.who} who ${row.has}` },
    rowc: { num: cells[r]![c]!, den: T.row[r]!, t: `conditional: the share of the ${row.group} who ${col.has}` },
    colc: { num: cells[r]![c]!, den: T.col[c]!, t: `conditional: the share of the ${col.group} who ${row.has}` },
  };
  const k = pick(R, ['joint', 'marg', 'rowc', 'colc'] as const), q = kinds[k];
  const say = (x: keyof typeof kinds) => x === 'joint' ? `A joint relative frequency divides one cell by the grand total, ${T.all}.` : x === 'marg' ? `A marginal one divides a row or column total by the grand total, ${T.all}.` : `A conditional one divides by a row or column total: ${x === 'rowc' ? T.row[r] : T.col[c]} here.`;
  const mcOf = (x: keyof typeof kinds): string | undefined => (k === 'rowc' && x === 'colc') || (k === 'colc' && x === 'rowc') ? MC.inverse : (k === 'rowc' || k === 'colc') && x === 'joint' ? MC.newWhole : undefined;
  return choice(R, {
    id: `relKind-${n}`, family: 'relKind',
    prompt: `${ctx.place}. Someone computes <b>${q.num} ÷ ${q.den} ≈ ${dec(q.num / q.den, 2)}</b>. What kind of relative frequency is it, and what does it describe?`,
    board: `\\dfrac{${q.num}}{${q.den}} \\approx ${dec(q.num / q.den, 2)}`,
    picture: { pics: [tablePic(ctx, cells)] },
    solution: [`The bottom number names the whole: ${q.den} is ${q.den === T.all ? 'the grand total' : q.den === T.row[r] ? `the ${row.label} row total` : `the ${col.label} column total`}.`, `${q.num} is ${q.num === T.row[r] ? `the ${row.label} total` : `the ${row.label} and ${col.label} cell`}. So it is ${ans(q.t)}.`],
  }, (Object.keys(kinds) as (keyof typeof kinds)[]).map(x => ({ t: kinds[x].t, ok: x === k, key: x, mc: x === k ? undefined : mcOf(x), say: x === k ? `Right: ${say(x)}` : `Look at the bottom number: ${q.den}. ${say(x)}` })));
};
export const relCompute: Gen = (R, n) => {
  const { ctx, cells, r, c, kind } = until(() => {
    const t = tableCtx(R, 0.3), rr = int(R, 0, 1), cc = int(R, 0, t.ctx.cols.length - 1), kk = R() < 0.5 ? 'joint' : 'cond';
    return { ...t, r: rr, c: cc, kind: kk };
  }, q => { const T = totals(q.cells); const p = (100 * q.cells[q.r]![q.c]!) / (q.kind === 'joint' ? T.all : T.row[q.r]!); return Math.abs(p - Math.floor(p) - 0.5) > 0.06; });
  const T = totals(cells), v = cells[r]![c]!, den = kind === 'joint' ? T.all : T.row[r]!, other = kind === 'joint' ? T.row[r]! : T.all;
  const exact = (100 * v) / den, key = round(exact, 0);
  const row = ctx.rows[r]!, col = ctx.cols[c]!;
  const q = kind === 'joint' ? `what percent of <b>all</b> the ${ctx.who} ${row.has} and ${col.has}` : `what percent of the <b>${row.group}</b> ${col.has}`;
  return numItem({
    id: `relCompute-${n}`, family: 'relCompute',
    prompt: `${ctx.place}. From the table, ${q}? Round to the nearest whole percent.${CALC}`,
    board: kind === 'joint' ? `\\text{joint: } \\dfrac{${v}}{${T.all}}` : `\\text{conditional: } \\dfrac{${v}}{${T.row[r]}}`, unit: '%',
    picture: { pics: [tablePic(ctx, cells, { whole: kind === 'joint' ? { kind: 'all', i: 0 } : { kind: 'row', i: r }, parts: [[r, c]] })] },
    solution: [kind === 'joint' ? `"Of all" means the grand total, ${T.all}, is the whole.` : `"Of the ${row.group}" means the ${row.label} row total, ${T.row[r]}, is the whole.`, `${v} ÷ ${den} ≈ ${dec(v / den, 4)}, about ${ans(`${key}%`)}.`],
  }, key, `Yes: ${v} ÷ ${den} is about ${key}%.`,
  [[round((100 * v) / other, 0), kind === 'joint' ? undefined : MC.newWhole, kind === 'joint' ? `That divides by the ${row.label} row total. "Of all" means divide by ${T.all}.` : `That divides by everyone. "Of the ${row.group}" means divide by their total, ${T.row[r]}.`]],
  `Divide the cell by the right whole, ${den}, and turn it into a percent.`, 0.5);
};
export const assocClaim: Gen = (R, n) => {
  const { ctx, cells } = until(() => ({ ctx: pick(R, CTX2), cells: genTable(R, 2, 2, 60, 200, 8) }), q => {
    const a = q.cells[0]![0]! / (q.cells[0]![0]! + q.cells[0]![1]!), b = q.cells[1]![0]! / (q.cells[1]![0]! + q.cells[1]![1]!);
    return Math.abs(a - b) >= 0.15;
  });
  const T = totals(cells), p0 = Math.round((100 * cells[0]![0]!) / T.row[0]!), p1 = Math.round((100 * cells[1]![0]!) / T.row[1]!);
  const hi = p0 > p1 ? 0 : 1, lo = 1 - hi, ph = Math.max(p0, p1), pl = Math.min(p0, p1);
  const col = ctx.cols[0]!, G = ctx.rows;
  const right = `A larger share of the ${G[hi]!.group} ${col.has} (about ${ph}%) than of the ${G[lo]!.group} (about ${pl}%).`;
  return choice(R, {
    id: `assocClaim-${n}`, family: 'assocClaim',
    prompt: `${ctx.place}. Compare the two rows. Which claim do the data support?${CALC}`,
    board: `\\dfrac{${cells[0]![0]}}{${T.row[0]}} \\text{ vs. } \\dfrac{${cells[1]![0]}}{${T.row[1]}}`,
    picture: { pics: [tablePic(ctx, cells)] },
    solution: [`Compare row percents, not raw counts: ${cells[0]![0]}/${T.row[0]} ≈ ${p0}% of the ${G[0]!.group} and ${cells[1]![0]}/${T.row[1]} ≈ ${p1}% of the ${G[1]!.group} ${col.has}.`, `That is an association in this survey; a survey alone cannot show what causes it.`],
  }, [
    { t: right, ok: true, key: 'r', say: 'Right: the row percents differ, and the claim stays about this group of people.' },
    { t: `A larger share of the ${G[lo]!.group} ${col.has} (about ${pl}%) than of the ${G[hi]!.group} (about ${ph}%).`, key: 'rev', say: `Check which percent is larger: ${ph}% belongs to the ${G[hi]!.group}.` },
    { t: `Being one of the ${G[hi]!.group} causes ${ctx.who} to be in the ${col.label} group.`, key: 'cause', mc: MC.causation, say: 'An association in a survey does not show cause. Something else could explain both.' },
    { t: `There is no link: about the same share of each group ${col.has}.`, key: 'none', say: `The shares are about ${ph}% and ${pl}%: a clear difference.` },
  ]);
};

// ===================== reverse-conditional =====================
export const reverseTable: Gen = (R, n) => {
  const { ctx, cells } = tableCtx(R, 0.3);
  const T = totals(cells), r = int(R, 0, 1), c = int(R, 0, ctx.cols.length - 1);
  const row = ctx.rows[r]!, col = ctx.cols[c]!, v = cells[r]![c]!;
  const fwdRow = R() < 0.5;   // the given one conditions on the row; the asked one on the column (or the other way)
  const [gN, gD, aD] = fwdRow ? [v, T.row[r]!, T.col[c]!] : [v, T.col[c]!, T.row[r]!];
  const [gc, gt] = fwdRow ? [row, col] : [col, row];
  return fracItem({
    id: `reverseTable-${n}`, family: 'reverseTable',
    prompt: `${ctx.place}. P(${gt.label} | ${gc.label}) = ${gN}/${gD}. Now the reverse: one of the <b>${gt.group}</b> is picked at random. What is the probability the ${ctx.one} ${gc.one}?`,
    board: `P(\\text{${gc.label}} \\mid \\text{${gt.label}}) = \\,?`,
    picture: { pics: [tablePic(ctx, cells, { whole: fwdRow ? { kind: 'col', i: c } : { kind: 'row', i: r }, parts: [[r, c]] })] },
    solution: [`The same cell, ${v}, is the part both times, but the whole changes: now it is the ${gt.label} total, ${aD}.`, `${red(v, aD)}.`],
  }, v, aD, `Yes: ${v}/${aD}. Same top, different bottom.`,
  [[gN, gD, MC.inverse, `${ft(gN, gD)} was P(${gt.label} | ${gc.label}). Reversing the condition changes the whole: divide by the ${gt.label} total.`],
   [v, T.all, MC.newWhole, `${T.all} is everyone. The condition is ${gt.label}.`]],
  `The condition is ${gt.label}: its total is the new whole.`);
};
const CLAIMS: { a: string; b: string; s: string }[] = [
  { a: 'the person smoked', b: 'the person has lung cancer', s: 'Of the patients in a lung-cancer study' },
  { a: 'the crash was within 5 miles of home', b: 'the driver was in a crash', s: 'Of the car crashes a city recorded' },
  { a: 'the email contains the word "free"', b: 'the email is spam', s: 'Of the emails a filter marked as spam' },
  { a: 'the student reads every day', b: 'the student made the honor roll', s: 'Of the students on the honor roll' },
  { a: 'the player is over 6 feet tall', b: 'the player is in the NBA', s: 'Of the players in the NBA' },
  { a: 'the shopper used a coupon', b: 'the shopper bought cereal', s: 'Of the shoppers who bought cereal' },
];
export const reverseClaim: Gen = (R, n) => {
  const q = pick(R, CLAIMS), p = 5 * int(R, 10, 19);
  const pw = `${p}%`, pd = dec(p / 100, 2);
  return choice(R, {
    id: `reverseClaim-${n}`, family: 'reverseClaim',
    prompt: `${q.s}, ${pw} fit A. Here A: <b>${q.a}</b>, and B: <b>${q.b}</b>. Which statement does that fact give?`,
    board: `${pd} = P(\\;?\\;)`,
    solution: [`"${q.s}" names the group we look inside: B, the condition.`, `So ${ans(`P(A | B) = ${pd}`)}. It says nothing directly about P(B | A).`],
  }, [
    { t: `P(A | B) = ${pd}`, ok: true, key: 'r', say: 'Right: the group named first is the condition.' },
    { t: `P(B | A) = ${pd}`, key: 'inv', mc: MC.inverse, say: `That turns it around. P(B | A) looks inside A, a different (often much bigger) group.` },
    { t: `${pw} of everyone with A also has B.`, key: 'words', mc: MC.inverse, say: 'That is P(B | A) in words. The fact is about the group B.' },
    { t: `P(A and B) = ${pd}`, key: 'and', mc: MC.newWhole, say: 'P(A and B) is out of everyone. The fact is out of group B only.' },
  ]);
};

// ===================== formula-conditional =====================
export const formulaDec: Gen = (R, n) => {
  const { pb, q, pab, pa } = until(() => {
    const pb0 = pick(R, [0.2, 0.25, 0.4, 0.5, 0.6, 0.75, 0.8]), q0 = pick(R, [0.1, 0.2, 0.25, 0.3, 0.4, 0.5, 0.6, 0.7, 0.75, 0.8]);
    const pab0 = round(pb0 * q0, 4), pa0 = round(pab0 + int(R, 2, 30) / 100, 2);
    return { pb: pb0, q: q0, pab: pab0, pa: pa0 };
  }, z => z.pab >= 0.04 && z.pa <= 1 - z.pb + z.pab - 0.02 && z.pa !== z.pb && Math.abs(z.pa - z.q) > 1e-9 && String(z.pab).length <= 5);
  const pct = R() < 0.4;
  const S = pick(R, [
    ['a class', 'A: a student takes physics', 'B: a student takes chemistry'],
    ['a store', 'A: a shopper buys a drink', 'B: a shopper buys a sandwich'],
    ['a team', 'A: a game goes to overtime', 'B: the game is at home'],
    ['a town', 'A: a household has a pet', 'B: the household has a yard'],
  ] as const);
  const show = (x: number) => (pct ? `${dec(x * 100, 2)}%` : dec(x, 4));
  return numItem({
    id: `formulaDec-${n}`, family: 'formulaDec',
    prompt: `In ${S[0]}, ${S[1]}; ${S[2]}. P(A) = ${show(pa)}, P(B) = ${show(pb)} and P(A and B) = ${show(pab)}. What is P(A | B)? Give a decimal.`,
    board: `P(A \\mid B) = \\dfrac{P(A \\cap B)}{P(B)} = \\,?`, unit: '',
    picture: { pics: [{ kind: 'venn', a: 'A', b: 'B', vals: { a: dec(pa - pab, 4), ab: dec(pab, 4), b: dec(pb - pab, 4), out: dec(1 - pa - pb + pab, 4) }, hide: ['a', 'b', 'out'], hl: ['ab', 'b'], cond: 'B' }] },
    solution: [`B is the condition, so P(B) = ${dec(pb, 4)} is the new whole.`, `P(A | B) = ${dec(pab, 4)} ÷ ${dec(pb, 4)} = ${ans(dec(q, 4))}.`],
  }, q, `Yes: ${dec(pab, 4)} ÷ ${dec(pb, 4)} = ${dec(q, 4)}.`,
  [[round(pab / pa, 6), MC.inverse, `That divides by P(A): it is P(B | A). The condition is B.`],
   [pa, MC.assumeIndep, `That is P(A) itself, as if B made no difference. Use the formula.`],
   [pab, MC.newWhole, `That is P(A and B), out of everyone. Divide by P(B) to make B the whole.`]],
  'P(A | B) = P(A and B) ÷ P(B).', 1e-9);
};
export const formulaVenn: Gen = (R, n) => {
  const z = until(() => ({ a: int(R, 5, 40), ab: int(R, 3, 30), b: int(R, 5, 40) }), q => q.a + q.ab + q.b <= 95 && q.a + q.ab + q.b >= 50 && q.a !== q.b);
  const out = 100 - z.a - z.ab - z.b;
  const condA = R() < 0.5;
  const den = condA ? z.a + z.ab : z.b + z.ab, other = condA ? z.b + z.ab : z.a + z.ab;
  const h = (x: number) => dec(x / 100, 2);
  return fracItem({
    id: `formulaVenn-${n}`, family: 'formulaVenn',
    prompt: `The Venn diagram gives the probability of each region: A only ${h(z.a)}, both ${h(z.ab)}, B only ${h(z.b)}, neither ${h(out)}. Find <b>P(${condA ? 'B | A' : 'A | B'})</b> as a fraction.`,
    board: `P(${condA ? 'B \\mid A' : 'A \\mid B'}) = \\dfrac{P(A \\cap B)}{P(${condA ? 'A' : 'B'})}`,
    picture: { pics: [{ kind: 'venn', a: 'A', b: 'B', vals: { a: h(z.a), ab: h(z.ab), b: h(z.b), out: h(out) }, hl: condA ? ['a', 'ab'] : ['ab', 'b'], cond: condA ? 'A' : 'B' }] },
    solution: [`P(${condA ? 'A' : 'B'}) is the whole circle: ${condA ? `${h(z.a)} + ${h(z.ab)}` : `${h(z.ab)} + ${h(z.b)}`} = ${h(den)}.`, `${h(z.ab)} ÷ ${h(den)} = ${red(z.ab, den)}.`],
  }, z.ab, den, `Yes: ${h(z.ab)} out of ${h(den)}.`,
  [[z.ab, 100, MC.newWhole, `${h(z.ab)} is P(A and B) out of everything. Divide by the probability of the condition's whole circle.`],
   [z.ab, other, MC.inverse, `That divides by the other circle. The condition is ${condA ? 'A' : 'B'}.`],
   [z.ab, condA ? z.a : z.b, undefined, `The condition's circle includes the overlap: add it to the bottom.`]],
  `Add both regions of the condition's circle; that is the bottom. The overlap is the top.`);
};

// ===================== independence-conditional-test =====================
export const indepTable: Gen = (R, n) => {
  const indep = R() < 0.5;
  const ctx = pick(R, CTX2);
  const cells = indep ? genIndep(R, 2, 2, 200) : until(() => genTable(R, 2, 2, 60, 200, 6), g => { const T = totals(g); return Math.abs(g[0]![0]! / T.row[0]! - T.col[0]! / T.all) >= 0.06; });
  const T = totals(cells), row = ctx.rows[0]!, col = ctx.cols[0]!;
  const a = `P(${col.label} | ${row.label}) = ${redP(cells[0]![0]!, T.row[0]!)}`, b = `P(${col.label}) = ${redP(T.col[0]!, T.all)}`;
  return choice(R, {
    id: `indepTable-${n}`, family: 'indepTable',
    prompt: `${ctx.place} (${T.all} in all). Is "the ${ctx.one} ${col.one}" independent of "the ${ctx.one} ${row.one}"? Compare a conditional probability with the unconditional one.`,
    board: `P(\\text{${col.label}} \\mid \\text{${row.label}}) \\qquad \\overset{?}{=} P(\\text{${col.label}})`,
    picture: { pics: [tablePic(ctx, cells, { whole: { kind: 'row', i: 0 }, parts: [[0, 0]] })] },
    solution: [`${a}.`, `${b}.`, indep ? 'They are equal, so knowing the row changes nothing: independent.' : 'They differ, so knowing the row changes the chance: dependent.'],
  }, [
    { t: `Independent: P(${col.label} | ${row.label}) equals P(${col.label})`, ok: indep, key: 'i', mc: indep ? undefined : MC.assumeIndep, say: indep ? 'Right: the condition leaves the probability unchanged.' : `Check: ${ft(cells[0]![0]!, T.row[0]!)} and ${ft(T.col[0]!, T.all)} are not equal.` },
    { t: `Dependent: P(${col.label} | ${row.label}) is different from P(${col.label})`, ok: !indep, key: 'd', say: !indep ? 'Right: the two probabilities differ, so the events are dependent.' : `Reduce both fractions: they are the same number, ${ft(T.col[0]!, T.all)}.` },
    { t: indep ? `Dependent: being one of the ${row.group} surely affects whether ${an(ctx.one)} ${col.one}` : `Independent: being one of the ${row.group} has nothing to do with whether ${an(ctx.one)} ${col.one}`, key: 'story', mc: MC.noProps, say: 'How the events sound does not decide it. Compare the probabilities from the table.' },
    { t: indep ? `Dependent: only ${cells[0]![0]} ${ctx.who} are in the ${row.label} and ${col.label} cell` : `Independent: ${cells[0]![0]} ${ctx.who} are in the ${row.label} and ${col.label} cell, a typical count`, key: 'cell', mc: MC.oneCell, say: 'One cell count alone cannot decide it. Divide by the totals and compare shares.' },
  ]);
};
interface UEv { t: string; set: number[] }
const DECK = [
  { t: 'the card is a heart', n: 13, tag: 'H' }, { t: 'the card is red', n: 26, tag: 'R' }, { t: 'the card is a face card', n: 12, tag: 'F' },
  { t: 'the card is an ace', n: 4, tag: 'A' }, { t: 'the card is a king', n: 4, tag: 'K' }, { t: 'the card is a spade', n: 13, tag: 'S' },
];
/** cards in both (a standard deck: 4 suits of 13; hearts and diamonds red; 3 face cards per suit) */
const deckBoth = (x: string, y: string): number => {
  const k = [x, y].sort().join('');
  const T: Record<string, number> = { FH: 3, HR: 13, FR: 6, AS: 1, FK: 4, AH: 1, AF: 0, AR: 2, KR: 2, HS: 0, RS: 0, FS: 3, KS: 1, HK: 1, AK: 0 };
  return T[k] ?? -1;
};
export const indepModel: Gen = (R, n) => {
  const deck = R() < 0.45;
  let A: UEv | null = null, B: UEv | null = null, N = 52, na = 0, nb = 0, nab = 0, story = '';
  if (deck) {
    const want = R() < 0.5;
    const [x, y] = until(() => shuffle(R, DECK.slice()).slice(0, 2), ([p, q]) => { const b0 = deckBoth(p!.tag, q!.tag); return b0 >= 0 && (b0 * 52 === p!.n * q!.n) === want; });
    na = x!.n; nb = y!.n; nab = deckBoth(x!.tag, y!.tag); N = 52;
    A = { t: x!.t, set: [] }; B = { t: y!.t, set: [] };
    story = 'A card is drawn at random from a standard 52-card deck (4 suits of 13 cards; hearts and diamonds are red; each suit has 3 face cards: jack, queen, king).';
  } else {
    N = pick(R, [6, 8, 10, 12, 20]);
    const xs = range(N), want = R() < 0.5;
    const pr = until(() => ({ a: numEvent(R, N), b: numEvent(R, N) }), ({ a, b }) => {
      const sa = xs.filter(a.f), sb = xs.filter(b.f), sab = sa.filter(v => b.f(v));
      return a.s !== b.s && sa.length >= 1 && sb.length >= 1 && sa.length < N && sb.length < N && (sab.length * N === sa.length * sb.length) === want;
    }, 6000);
    const sa = xs.filter(pr.a.f), sb = xs.filter(pr.b.f);
    A = { t: pr.a.t, set: sa }; B = { t: pr.b.t, set: sb }; na = sa.length; nb = sb.length; nab = sa.filter(v => pr.b.f(v)).length;
    story = N === 6 ? 'Roll one fair die.' : `A number is picked at random from 1 to ${N}.`;
  }
  const indep = nab * N === na * nb;
  const pAB = ft(nab, nb), pA = ft(na, N);
  return choice(R, {
    id: `indepModel-${n}`, family: 'indepModel',
    prompt: `${story} A: <b>${A!.t}</b>. B: <b>${B!.t}</b>. Are A and B independent?`,
    board: `P(A \\mid B) \\overset{?}{=} P(A)`,
    picture: deck ? undefined : { pics: [{ kind: 'chips', items: range(N).map(String), A: A!.set.map(v => v - 1), cond: B!.set.map(v => v - 1) }] },
    solution: [`Given B, there ${nb === 1 ? 'is 1 outcome' : `are ${nb} outcomes`} and ${nab} of ${nb === 1 ? 'it is' : 'them'} are in A: P(A | B) = ${redP(nab, nb)}.`, `Without the condition, P(A) = ${redP(na, N)}.`, indep ? 'Equal: independent.' : 'Different: dependent.'],
  }, [
    { t: 'Independent: P(A | B) equals P(A)', ok: indep, key: 'i', mc: indep ? undefined : MC.assumeIndep, say: indep ? 'Right: knowing B leaves the chance of A unchanged.' : `P(A | B) = ${pAB}, but P(A) = ${pA}: knowing B changes the chance.` },
    { t: 'Dependent: P(A | B) is different from P(A)', ok: !indep, key: 'd', say: !indep ? 'Right: the condition changes the probability.' : `Reduce them: both are ${pA}. Knowing B changes nothing.` },
    { t: nab > 0 ? (indep ? 'Dependent: A and B share outcomes, so one affects the other' : 'Independent: A and B share outcomes, so they don\'t block each other') : 'Independent: A and B have no outcomes in common', key: 'overlap', mc: MC.disjIndep, say: 'Sharing outcomes (or not) does not decide independence. Compare P(A | B) with P(A).' },
  ]);
};

// ===================== independence-product-test =====================
export const productTest: Gen = (R, n) => {
  const indep = R() < 0.5;
  const z = until(() => {
    const pa = int(R, 2, 8) / 10, pb = pick(R, [0.2, 0.25, 0.3, 0.4, 0.5, 0.6, 0.75]);
    const prod = round(pa * pb, 4), pab = indep ? prod : round(prod + (R() < 0.5 ? -1 : 1) * int(R, 1, 6) / 100, 4);
    return { pa, pb, prod, pab };
  }, q => q.pab > 0 && q.pab < Math.min(q.pa, q.pb) && q.pa + q.pb - q.pab <= 1 && (indep || Math.abs(q.pab - q.prod) > 0.005) && q.pa !== q.pb);
  const S = pick(R, ['A: a student owns a bike; B: the student plays an instrument', 'A: a day is windy; B: the same day is cloudy', 'A: a customer orders dessert; B: the customer orders coffee', 'A: a phone is dropped this year; B: the phone has a case']);
  const opts: Opt[] = [
    { t: `Independent: P(A) × P(B) = ${dec(z.prod, 4)} = P(A and B)`, ok: indep, key: 'i', mc: indep ? undefined : MC.assumeIndep, say: indep ? 'Right: the product matches P(A and B) exactly.' : `P(A) × P(B) = ${dec(z.prod, 4)}, but P(A and B) = ${dec(z.pab, 4)}.` },
    { t: indep ? 'Dependent: the product test fails' : `Dependent: P(A) × P(B) = ${dec(z.prod, 4)}, but P(A and B) = ${dec(z.pab, 4)}`, ok: !indep, key: 'd', say: !indep ? 'Right: the product test fails, so the events are dependent.' : 'Look again: they are the same number.' },
    { t: 'Can’t tell without P(A | B)', key: 'c', say: 'The product test decides it with these three numbers: compare P(A) × P(B) with P(A and B).' },
  ];
  if (!indep) opts.push({ t: `Independent: we can find P(A and B) as P(A) × P(B) = ${dec(z.prod, 4)}`, key: 'circ', mc: MC.circular, say: `Multiplying assumes independence; it can't prove it. Compare with the given P(A and B) = ${dec(z.pab, 4)}.` });
  return choice(R, {
    id: `productTest-${n}`, family: 'productTest',
    prompt: `${S}. P(A) = ${dec(z.pa, 2)}, P(B) = ${dec(z.pb, 2)} and P(A and B) = ${dec(z.pab, 4)}. Use the product test: are A and B independent?`,
    board: `P(A)\\,P(B) \\overset{?}{=} P(A \\cap B)`,
    solution: [`P(A) × P(B) = ${dec(z.pa, 2)} × ${dec(z.pb, 2)} = ${dec(z.prod, 4)}.`, indep ? `That equals P(A and B) = ${dec(z.pab, 4)}: independent.` : `P(A and B) = ${dec(z.pab, 4)} is different: dependent.`],
  }, opts);
};
export const productForward: Gen = (R, n) => {
  const v = int(R, 0, 3);
  let pa: number, pb: number, story: string;
  if (v === 0) { pa = int(R, 55, 90) / 100; pb = pa; story = `A basketball player makes ${dec(pa * 100)}% of her free throws, and her shots are independent of each other. What is the probability she makes both of her next two free throws?`; }
  else if (v === 1) { pa = int(R, 80, 98) / 100; pb = int(R, 80, 98) / 100; story = `A part passes the first inspection with probability ${dec(pa, 2)} and, independently, the second inspection with probability ${dec(pb, 2)}. What is the probability a part passes both?`; }
  else if (v === 2) { pa = int(R, 3, 7) / 10; pb = int(R, 2, 8) / 10; story = `On a drive to school, the first traffic light is green with probability ${dec(pa, 2)} and the second with probability ${dec(pb, 2)}. The lights work independently. What is the probability both are green?`; }
  else { pa = pick(R, [0.5, 0.25, 0.2, 0.4]); pb = int(R, 1, 9) / 10; story = `A game spinner lands on gold with probability ${dec(pa, 2)}, and a separate, independent card draw gives a bonus with probability ${dec(pb, 2)}. What is the probability of gold and a bonus?`; }
  const p = round(pa * pb, 4);
  return numItem({
    id: `productForward-${n}`, family: 'productForward',
    prompt: `${story} Give a decimal.`,
    board: `P(A \\cap B) = P(A) \\times P(B) = \\,?`, unit: '',
    picture: { pics: [{ kind: 'tree', first: [{ label: 'yes', p: dec(pa, 2) }, { label: 'no', p: dec(round(1 - pa, 2), 2) }], second: [[{ label: 'yes', p: dec(pb, 2) }, { label: 'no', p: dec(round(1 - pb, 2), 2) }], [{ label: 'yes', p: dec(pb, 2) }, { label: 'no', p: dec(round(1 - pb, 2), 2) }]], leaf: [[dec(p, 4), null], [null, null]], hide: ['l00'], paths: [[0, 0]] }] },
    solution: ['The events are independent (stated), so the product rule applies.', `${dec(pa, 2)} × ${dec(pb, 2)} = ${ans(dec(p, 4))}.`],
  }, p, `Yes: ${dec(pa, 2)} × ${dec(pb, 2)} = ${dec(p, 4)}.`,
  [[round(pa + pb, 4), undefined, 'Adding gives the chance of at least one, roughly, and can pass 1. "Both" multiplies.'], [pa, undefined, 'That is only the first event. Both must happen: multiply.']],
  'Independent events: multiply their probabilities.');
};

// ===================== replacement-effect =====================
function bag(R: () => number) {
  const nTot = int(R, 4, 10), r = int(R, 2, nTot - 2);
  const [c1, c2] = pick(R, [['red', 'blue'], ['green', 'white'], ['black', 'yellow']] as const);
  return { nTot, r, b: nTot - r, c1, c2 };
}
const bagPic = (g: { r: number; b: number; c1: string; c2: string }) => ({ kind: 'tokens' as const, names: [...Array.from({ length: g.r }, () => g.c1[0]!.toUpperCase()), ...Array.from({ length: g.b }, () => g.c2[0]!.toUpperCase())], groups: [...Array.from({ length: g.r }, () => 0), ...Array.from({ length: g.b }, () => 1)], legend: [g.c1, g.c2] as [string, string] });
export const replaceCond: Gen = (R, n) => {
  const g = bag(R), wr = R() < 0.35;
  const [num, den] = wr ? [g.r, g.nTot] : [g.r - 1, g.nTot - 1];
  return fracItem({
    id: `replaceCond-${n}`, family: 'replaceCond',
    prompt: `A bag holds ${g.r} ${g.c1} and ${g.b} ${g.c2} counters. You draw one, ${wr ? '<b>put it back</b>, mix,' : '<b>keep it out</b>,'} and draw again. The first counter was ${g.c1}. What is P(second is ${g.c1} | first was ${g.c1})?`,
    board: `P(2\\text{nd } ${g.c1} \\mid 1\\text{st } ${g.c1}) = \\,?`,
    picture: { pics: [bagPic(g)] },
    solution: wr ? [`It goes back, so the bag is the same: ${g.r} ${g.c1} out of ${g.nTot}.`, `${red(g.r, g.nTot)}.`]
      : [`One ${g.c1} counter is out: ${g.r - 1} ${g.c1} left out of ${g.nTot - 1}.`, `${red(g.r - 1, g.nTot - 1)}.`],
  }, num, den, wr ? 'Yes: putting it back restores the bag.' : `Yes: ${g.r - 1} of the ${g.nTot - 1} counters left.`,
  wr ? [[g.r - 1, g.nTot - 1, undefined, 'The counter went back in, so the bag has not changed.']]
    : [[g.r, g.nTot, MC.assumeIndep, `${ft(g.r, g.nTot)} is the full bag. The first ${g.c1} counter stays out, so the bag has changed.`], [g.r - 1, g.nTot, undefined, 'One counter is out, so there are fewer counters in all too.']],
  'Look at what is in the bag for the second draw.');
};
export const replaceDecide: Gen = (R, n) => {
  const v = R() < 0.25 ? 'cards' : R() < 0.5 ? 'with' : 'without';
  if (v === 'cards') {
    return choice(R, {
      id: `replaceDecide-${n}`, family: 'replaceDecide',
      prompt: `Two cards are dealt from a shuffled standard deck (52 cards, 13 hearts, 4 aces, one of them the ace of hearts) <b>without replacement</b>. A: the first card is a heart. B: the second card is an ace. Are A and B independent?`,
      board: `P(B \\mid A) \\overset{?}{=} P(B) = \\tfrac{4}{52}`,
      solution: ['P(B) = 4/52 = 1/13: before you look at anything, every card is equally likely to be second.', 'Given a heart first: it is the ace of hearts with chance 1/13 (then 3 aces in 51), else 4 aces in 51. P(B | A) = (1/13)(3/51) + (12/13)(4/51) = 51/663 = 1/13.', 'Equal: independent, even without replacement.'],
    }, [
      { t: 'Independent: P(B | A) = P(B) = 1/13', ok: true, key: 'i', say: 'Right: the two cases balance out exactly. Decide by calculating.' },
      { t: 'Dependent: draws without replacement are always dependent', key: 'always', mc: MC.wrAlways, say: 'Not always. Here the calculation gives P(B | A) = 1/13 = P(B).' },
      { t: 'Dependent: P(B | A) = 3/51', key: '351', say: '3/51 is only the case where the first heart was the ace. Usually it was not.' },
      { t: 'They cannot both happen: different draws are mutually exclusive', key: 'excl', mc: MC.drawsExcl, say: 'A heart first and an ace second can both happen; they are about different draws.' },
    ]);
  }
  const g = bag(R), wr = v === 'with';
  const pa = ft(g.r, g.nTot), pc = wr ? pa : ft(g.r - 1, g.nTot - 1);
  return choice(R, {
    id: `replaceDecide-${n}`, family: 'replaceDecide',
    prompt: `A bag holds ${g.r} ${g.c1} and ${g.b} ${g.c2} counters. Two are drawn ${wr ? '<b>with replacement</b> (the first goes back before the second draw)' : '<b>without replacement</b>'}. A: the first is ${g.c1}. B: the second is ${g.c1}. Are A and B independent?`,
    board: `P(B \\mid A) \\overset{?}{=} P(B)`,
    picture: { pics: [bagPic(g)] },
    solution: [`P(B) = ${pa}: before anything is seen, each counter is equally likely to be second.`, wr ? `With replacement, the bag is the same for draw 2: P(B | A) = ${pa}. Equal: independent.` : `Without replacement, one ${g.c1} is gone: P(B | A) = ${redP(g.r - 1, g.nTot - 1)}. Different: dependent.`],
  }, [
    { t: `Independent: P(B | A) = P(B) = ${pa}`, ok: wr, key: 'i', mc: wr ? undefined : MC.assumeIndep, say: wr ? 'Right: putting it back makes the second draw start fresh.' : `Without replacement P(B | A) = ${pc}, not ${pa}.` },
    { t: `Dependent: P(B | A) = ${ft(g.r - 1, g.nTot - 1)}, but P(B) = ${pa}`, ok: !wr, key: 'd', say: !wr ? 'Right: the first draw changes what is left.' : 'The counter goes back, so the second draw sees the full bag.' },
    { t: 'They cannot both happen: different draws are mutually exclusive', key: 'excl', mc: MC.drawsExcl, say: `Both draws can be ${g.c1}: they are different draws.` },
  ]);
};

// ===================== general-multiplication-rule =====================
export const twoDraws: Gen = (R, n) => {
  const g = bag(R), wr = R() < 0.35;
  const [num, den] = wr ? [g.r * g.r, g.nTot * g.nTot] : [g.r * (g.r - 1), g.nTot * (g.nTot - 1)];
  return fracItem({
    id: `twoDraws-${n}`, family: 'twoDraws',
    prompt: `A bag holds ${g.r} ${g.c1} and ${g.b} ${g.c2} counters. You draw two ${wr ? '<b>with replacement</b>' : '<b>without replacement</b>'}. What is the probability both are ${g.c1}?`,
    board: `P(${g.c1[0]!.toUpperCase()}_1 \\cap ${g.c1[0]!.toUpperCase()}_2) = P(${g.c1[0]!.toUpperCase()}_1)\\,P(${g.c1[0]!.toUpperCase()}_2 \\mid ${g.c1[0]!.toUpperCase()}_1)`,
    picture: { pics: [bagPic(g)] },
    solution: [`First ${g.c1}: ${g.r}/${g.nTot}. ${wr ? `It goes back, so second ${g.c1}: ${g.r}/${g.nTot} again.` : `Then ${g.r - 1} ${g.c1} of ${g.nTot - 1} are left: ${g.r - 1}/${g.nTot - 1}.`}`, `${g.r}/${g.nTot} × ${wr ? `${g.r}/${g.nTot}` : `${g.r - 1}/${g.nTot - 1}`} = ${ans(ft(num, den))}.`],
  }, num, den, `Yes: ${ft(num, den)}.`,
  wr ? [[g.r * (g.r - 1), g.nTot * (g.nTot - 1), undefined, 'With replacement the bag is the same for the second draw.']]
    : [[g.r * g.r, g.nTot * g.nTot, MC.assumeIndep, `That uses ${g.r}/${g.nTot} twice, as if the first counter went back. Without replacement, the second draw sees ${g.r - 1} of ${g.nTot - 1}.`]],
  'Multiply P(first) by P(second | first).');
};
export const treePath: Gen = (R, n) => {
  const g = bag(R);
  const N = g.nTot, r = g.r, b = g.b, L1 = g.c1, L2 = g.c2;
  const i = int(R, 0, 1), j = int(R, 0, 1);
  const p1 = [[r, N], [b, N]] as const;
  const p2 = [[[r - 1, N - 1], [b, N - 1]], [[r, N - 1], [b - 1, N - 1]]] as const;
  const [a1, d1] = p1[i]!, [a2, d2] = p2[i]![j]!;
  const lab = [L1, L2];
  const leafs = [0, 1].map(x => [0, 1].map(y => ft(p1[x]![0] * p2[x]![y]![0], p1[x]![1] * p2[x]![y]![1])));
  return fracItem({
    id: `treePath-${n}`, family: 'treePath',
    prompt: `A bag holds ${r} ${L1} and ${b} ${L2} counters. Two are drawn without replacement; the tree shows every branch probability. What is the probability that the first is <b>${lab[i]}</b> and the second is <b>${lab[j]}</b>?`,
    board: `P = \\tfrac{${a1}}{${d1}} \\times \\tfrac{${a2}}{${d2}} = \\,?`,
    picture: { pics: [{ kind: 'tree', first: [{ label: L1, p: fx(r, N, true) }, { label: L2, p: fx(b, N, true) }], second: [[{ label: L1, p: fx(r - 1, N - 1, true) }, { label: L2, p: fx(b, N - 1, true) }], [{ label: L1, p: fx(r, N - 1, true) }, { label: L2, p: fx(b - 1, N - 1, true) }]], leaf: leafs.map(rw => rw.map(s => (s.includes('/') ? `\\tfrac{${s.split('/')[0]}}{${s.split('/')[1]}}` : s))), hide: ['l00', 'l01', 'l10', 'l11'], paths: [[i, j]] }] },
    solution: [`Follow the path: ${lab[i]} first (${a1}/${d1}), then ${lab[j]} given that (${a2}/${d2}).`, `Multiply along the path: ${a1}/${d1} × ${a2}/${d2} = ${ans(ft(a1 * a2, d1 * d2))}.`],
  }, a1 * a2, d1 * d2, `Yes: multiply along the path.`,
  [[a1 * p1[j]![0], d1 * N, MC.assumeIndep, 'The second branch must be the updated one: one counter is already out.'],
   [a1 * d2 + a2 * d1, d1 * d2, undefined, 'Along a path, multiply. Adding is for joining different paths.']],
  'Multiply the branch probabilities along the path.');
};

// ===================== multiplication-rule-given-probabilities =====================
export const multCount: Gen = (R, n) => {
  if (R() < 0.5) {
    const { p, s } = until(() => ({ p: int(R, 1, 12), s: int(R, 80, 99) }), q => (q.p * q.s) % 10 === 0);
    const v = (p * s) / 10;
    return numItem({
      id: `multCount-${n}`, family: 'multCount',
      prompt: `A condition affects ${p}% of people. A screening test catches it in ${s}% of people who have it. Out of 1,000 people, how many do you expect to <b>have the condition and test positive</b>?${CALC}`,
      board: `1000 \\times ${dec(p / 100, 2)} \\times ${dec(s / 100, 2)} = \\,?`, unit: 'people',
      picture: { pics: [{ kind: 'tree', first: [{ label: 'has it', p: dec(p / 100, 2) }, { label: 'does not', p: dec(1 - p / 100, 2) }], second: [[{ label: 'positive', p: dec(s / 100, 2) }, { label: 'negative', p: dec(1 - s / 100, 2) }], [{ label: 'positive', p: '' }, { label: 'negative', p: '' }]], paths: [[0, 0]] }] },
      solution: [`Have it: ${p}% of 1,000 = ${p * 10}. Of those, ${s}% test positive.`, `${p * 10} × ${dec(s / 100, 2)} = ${ans(v)} people.`],
    }, v, `Yes: P(has it and positive) = ${dec(p / 100, 2)} × ${dec(s / 100, 2)} = ${dec(v / 1000, 4)}, about ${v} in 1,000.`,
    [[s * 10, MC.inverse, `${s * 10} applies ${s}% to everyone. It only applies to the ${p * 10} people who have the condition.`], [p * 10, undefined, `${p * 10} have the condition; not all of them test positive.`]],
    'First take the share who have it, then the share of those who test positive.');
  }
  const S = pick(R, [['it rains', 'the bus is late', 'rain', 'the student misses first period'], ['a part comes from the night shift', 'the part fails inspection', 'night shift', 'the part is sent back for repair'], ['a customer is a member', 'the customer buys the special', 'member', 'the customer adds a drink']] as const);
  const pa = int(R, 2, 5) / 10, pba = int(R, 2, 6) / 10, three = R() < 0.35, pc = int(R, 5, 9) / 10;
  const v = round(pa * pba * (three ? pc : 1), 4);
  return numItem({
    id: `multCount-${n}`, family: 'multCount',
    prompt: `P(${S[0]}) = ${dec(pa, 2)}. P(${S[1]} | ${S[2]}) = ${dec(pba, 2)}.${three ? ` Given both of those, the probability that ${S[3]} is ${dec(pc, 2)}.` : ''} What is the probability that ${S[0]}, ${S[1]}${three ? ` and ${S[3]}` : ''}? Give a decimal.`,
    board: three ? `P = ${dec(pa, 2)} \\times ${dec(pba, 2)} \\times ${dec(pc, 2)}` : `P(A \\cap B) = P(A)\\,P(B \\mid A)`, unit: '',
    solution: [`The second probability is already conditional on the first: P(A and B) = P(A) × P(B | A).`, `${dec(pa, 2)} × ${dec(pba, 2)}${three ? ` × ${dec(pc, 2)}` : ''} = ${ans(dec(v, 4))}.`],
  }, v, `Yes: multiply along the path: ${dec(v, 4)}.`,
  [[pba, MC.inverse, `${dec(pba, 2)} is only the chance given ${S[2]}. Multiply by the chance of ${S[2]} first.`], [round(pa + pba, 4), undefined, '"And" multiplies along the path; it does not add.']],
  'P(A and B) = P(A) × P(B | A).');
};
export const multChoose: Gen = (R, n) => {
  const indep = R() < 0.5;
  if (indep) {
    const p = int(R, 60, 90) / 100, story = pick(R, [`A ${dec(p * 100)}% free-throw shooter takes two shots, and her shots are independent.`, `A seed sprouts with probability ${dec(p, 2)}, and two seeds in separate pots sprout independently.`]);
    const right = `${dec(p, 2)} × ${dec(p, 2)} = ${dec(round(p * p, 4), 4)}`;
    return choice(R, {
      id: `multChoose-${n}`, family: 'multChoose',
      prompt: `${story} Which calculation gives the probability that <b>both</b> succeed?`,
      board: `P(A \\cap B) = \\,?`,
      solution: ['Independence is stated, so P(B | A) = P(B): the product of the two probabilities.', `${ans(right)}.`],
    }, [
      { t: right, ok: true, key: 'r', say: 'Right: independent, so multiply the two probabilities.' },
      { t: `${dec(p, 2)} + ${dec(p, 2)} = ${dec(round(2 * p, 2), 2)}`, key: 'add', say: 'A probability above 1 is impossible. "Both" multiplies.' },
      { t: `${dec(p, 2)}`, key: 'one', say: 'That is one success. Both must happen.' },
      { t: `${dec(p, 2)} × ${dec(round(1 - p, 2), 2)} = ${dec(round(p * (1 - p), 4), 4)}`, key: 'miss', say: 'That is one success and one miss.' },
    ]);
  }
  const S = pick(R, [['rain', 'the bus is late'], ['a car is older than 10 years', 'it fails the emissions test'], ['a student studied', 'the student passes the quiz']] as const);
  const pa = int(R, 2, 5) / 10, pba = until(() => int(R, 3, 7) / 10, x => x !== pa), pb = until(() => int(R, 1, 6) / 10, x => Math.abs(x - pba) > 0.05 && x !== pa);
  const right = `${dec(pa, 2)} × ${dec(pba, 2)} = ${dec(round(pa * pba, 4), 4)}`;
  return choice(R, {
    id: `multChoose-${n}`, family: 'multChoose',
    prompt: `P(${S[0]}) = ${dec(pa, 2)}. Overall, P(${S[1]}) = ${dec(pb, 2)}, but P(${S[1]} | ${S[0]}) = ${dec(pba, 2)}. Which calculation gives P(${S[0]} and ${S[1]})?`,
    board: `P(A \\cap B) = P(A)\\,P(B \\mid A)`,
    solution: [`P(B | A) = ${dec(pba, 2)} differs from P(B) = ${dec(pb, 2)}: dependent, so use the conditional branch.`, `${ans(right)}.`],
  }, [
    { t: right, ok: true, key: 'r', say: 'Right: dependent, so P(A) × P(B | A).' },
    { t: `${dec(pa, 2)} × ${dec(pb, 2)} = ${dec(round(pa * pb, 4), 4)}`, key: 'ind', mc: MC.assumeIndep, say: `That treats them as independent. P(B | A) = ${dec(pba, 2)} is not P(B) = ${dec(pb, 2)}.` },
    { t: `${dec(pba, 2)}`, key: 'cond', mc: MC.inverse, say: 'That is the chance given A, not the chance of A and B together.' },
    { t: `${dec(pa, 2)} + ${dec(pba, 2)} = ${dec(round(pa + pba, 2), 2)}`, key: 'add', say: '"And" multiplies along a path.' },
  ]);
};

export { DIE };
