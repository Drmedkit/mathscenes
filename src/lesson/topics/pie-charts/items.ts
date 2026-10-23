// items.ts: exercise families for "make a circle graph with percents" (grade 7). One family per sub-goal of the topic
// JSON (plan.ts), each generated from templates with that sub-goal's number ranges, checked exactly (pieMaths.ts),
// and every classic wrong answer tagged with its misconception id (math-curriculum-essentials/misconceptions.json).
// Pure: no DOM, no canvas. A seeded rng makes sessions repeatable.
import { type Item, type Response, type Verdict, fr, gcd, int, pick, shuffle } from '../../runtime/item';
import { type Q, rat, qNum } from '../../../core/math';
import { ans as mark, endOnChoice } from '../../runtime/explain';
import { type Cat, computePie, fmt1, round1, roundQ } from './pieMaths';

export type FamilyId = 'whole' | 'sameShare' | 'toDeg' | 'toPct' | 'estimate' | 'share' | 'pct' | 'roundPct' | 'angle' | 'exact'
  | 'close' | 'adjacent' | 'reflex' | 'label' | 'audit' | 'bound' | 'disclose' | 'gap' | 'fit';
export const FAMILIES: readonly { id: FamilyId; name: string }[] = [
  { id: 'whole', name: 'What is the whole?' },
  { id: 'sameShare', name: 'Same angle, same share' },
  { id: 'toDeg', name: 'Percent to degrees' },
  { id: 'toPct', name: 'Degrees to percent' },
  { id: 'estimate', name: 'Estimate a slice' },
  { id: 'share', name: 'Count over total' },
  { id: 'pct', name: 'Share as a percent' },
  { id: 'roundPct', name: 'Round a percent' },
  { id: 'angle', name: 'Central angle' },
  { id: 'exact', name: 'Round at the end' },
  { id: 'close', name: 'Close the circle' },
  { id: 'adjacent', name: 'Next slice' },
  { id: 'reflex', name: 'Slices over 180°' },
  { id: 'label', name: 'Label the graph' },
  { id: 'audit', name: 'Check against the data' },
  { id: 'bound', name: 'Rounding or a mistake?' },
  { id: 'disclose', name: 'Fix it honestly' },
  { id: 'gap', name: 'Part of the whole missing' },
  { id: 'fit', name: 'Does a circle graph fit?' },
];
export const FAMILY_NAMES: Record<string, string> = Object.fromEntries(FAMILIES.map(f => [f.id, f.name]));

/** what the page can draw for an item */
export type Pic =
  | {
    kind: 'graph'; cats: Cat[]; n?: number; angles?: number[]; start?: number;
    labels?: ([string, string] | null)[] | 'none'; labelAt?: number[]; title?: string; dots?: boolean;
    ring?: 'quarters' | 'pct100' | null; gap?: string | null; plain?: boolean;
    /** the sector the item is about (lit on a miss, target of the work line's leader) */ focus?: number;
    /** sectors drawn before the answer (default all); the rest sweep in on a miss */ show?: number;
    /** the focus label's value after a miss (it shows '?' before) */ reveal?: string;
    ray?: { deg: number; text?: string };
  }
  | { kind: 'two'; deg: number; startA: number; startB: number; rA: number; rB: number }
  | { kind: 'bars'; bars: { name: string; value: number }[]; unit: string; title?: string };
export interface PieItem extends Item {
  family: FamilyId;
  picture?: Pic;
  /** TeX written on the board after a miss (linked to the focus sector) */
  work?: string;
}
type Gen = (R: () => number, n: number, sg?: string) => PieItem;

// ---------- contexts (US, no money except the budget) ----------
interface Ctx { title: string; who: string; one: string; names: readonly string[]; money?: boolean }
const CTX: readonly Ctx[] = [
  { title: 'Lunch choice', who: 'students', one: 'student', names: ['Pizza', 'Tacos', 'Salad', 'Pasta', 'Burgers', 'Soup'] },
  { title: 'Favorite sport', who: 'students', one: 'student', names: ['Soccer', 'Football', 'Baseball', 'Hockey', 'Tennis', 'Track'] },
  { title: 'Way to school', who: 'students', one: 'student', names: ['Walk', 'Bike', 'Bus', 'Car', 'Scooter', 'Train'] },
  { title: 'Most-used app', who: 'teens', one: 'teen', names: ['Music', 'Games', 'Video', 'Chat', 'Photos', 'News'] },
  { title: 'Pet at home', who: 'families', one: 'family', names: ['Dog', 'Cat', 'Fish', 'Bird', 'Hamster', 'Reptile'] },
  { title: 'Club spending', who: 'dollars', one: 'dollar', names: ['Food', 'Trips', 'Gear', 'Shirts', 'Prizes', 'Games'], money: true },
];
const PEOPLE = CTX.filter(c => !c.money);
const qty = (c: Ctx, k: number) => (c.money ? `$${k}` : `${k} ${k === 1 ? c.one : c.who}`);
const whole = (c: Ctx, n: number) => (c.money ? `the $${n} budget` : `all ${n} ${c.who}`);
const titleOf = (c: Ctx, n: number) => (c.money ? `${c.title}, $${n}` : `${c.title}, ${n} ${c.who}`);
const A = (s: string | number) => `<b class="a">${s}</b>`;
const B = (s: string | number) => `<b class="b">${s}</b>`;
const S = (s: string | number) => `<b class="s">${s}</b>`;

/** k positive counts (each a multiple of `unit`, at least `min` units) that add up to n */
function counts(R: () => number, k: number, n: number, unit = 1, min = 1): number[] {
  const P = n / unit;
  if (!Number.isInteger(P) || P < k * min) throw new Error(`counts: cannot split ${n} into ${k} parts of ${unit}`);
  const w = Array.from({ length: k }, () => 0.25 + R());
  const W = w.reduce((s, x) => s + x, 0), rest = P - k * min;
  const parts = w.map(x => min + Math.floor((rest * x) / W));
  let left = P - parts.reduce((s, x) => s + x, 0);
  while (left-- > 0) parts[Math.floor(R() * k)]!++;
  return parts.map(p => p * unit);
}
const lcm = (a: number, b: number) => (a / gcd(a, b)) * b;
/** a data set: k categories of a context, total n, every slice at least minDeg degrees */
function dataSet(R: () => number, c: Ctx, k: number, n: number, o: { wholePct?: boolean; wholeDeg?: boolean; minDeg?: number } = {}): Cat[] {
  let unit = 1;
  if (o.wholePct) unit = lcm(unit, n / gcd(n, 100));
  if (o.wholeDeg) unit = lcm(unit, n / gcd(n, 360));
  const min = Math.max(1, Math.ceil(((o.minDeg ?? 24) * n) / 360 / unit));
  const names = shuffle(R, [...c.names]).slice(0, k);
  return counts(R, k, n, unit, min).map((count, i) => ({ name: names[i]!, count }));
}
/** the data table on the board */
function table(cats: readonly Cat[], n: number | null, c: Ctx, o: { col?: number; totalLabel?: string } = {}): string {
  const cell = (s: string, tag: string, on: boolean) => (on ? `\\cssId{${tag}}{${s}}` : s);
  const rows = cats.map((t, i) => `${cell(`\\text{${t.name}}`, 'f', i === o.col)} & ${cell(`${c.money ? '\\$' : ''}${t.count}`, 'fc', i === o.col)}`);
  if (n !== null) rows.push(`\\hline \\text{${o.totalLabel ?? 'Total'}} & \\cssId{n}{${c.money ? '\\$' : ''}${n}}`);
  return `\\begin{array}{lr} ${rows.join(' \\\\ ')} \\end{array}`;
}

// ---------- checking helpers ----------
interface Opt { t: string; ok: boolean; mc?: string; say: string }
function choiceItem(R: () => number, base: Omit<PieItem, 'input' | 'choices' | 'answer' | 'check'>, opts: Opt[]): PieItem {
  const O = shuffle(R, [...opts]);
  const ts = new Set(O.map(o => o.t));
  if (ts.size !== O.length) throw new Error(`choices not unique: ${O.map(o => o.t).join(' | ')}`);
  return {
    ...base, input: 'choice', choices: O.map(o => o.t), answer: { kind: 'choice', i: O.findIndex(o => o.ok) }, solution: endOnChoice(base.solution, O.find(o => o.ok)!.t),
    check: (r: Response): Verdict => {
      const o = r.kind === 'choice' ? O[r.i] : undefined;
      if (!o) return { ok: false, say: 'Pick one.' };
      return { ok: o.ok, mc: o.mc, say: o.say };
    },
  };
}
interface Wrong { v: number; mc?: string; say: string }
/** a number answer: right within tol, or a recognised wrong value (its misconception), or a plain miss */
function numCheck(ans: number, okSay: string, wrongs: Wrong[], missSay: string, tol = 1e-6): (r: Response) => Verdict {
  return r => {
    if (r.kind !== 'num' || !Number.isFinite(r.v)) return { ok: false, say: 'Type a number.' };
    if (Math.abs(r.v - ans) <= tol) return { ok: true, say: okSay };
    for (const w of wrongs) if (Math.abs(w.v - ans) > tol && Math.abs(r.v - w.v) <= tol) return { ok: false, mc: w.mc, say: w.say };
    return { ok: false, say: missSay };
  };
}
const pctStr = (x: Q) => { const v = qNum(x); return Number.isInteger(v) ? String(v) : fmt1(round1(x)); };
const MC = {
  fixed: 'mc.percent.percent-as-fixed-amount',
  subtotal: 'mc.data-displays.incomplete-subtotal-as-whole',
  radius: 'mc.data-displays.sector-share-changes-with-position-or-radius',
  unequal: 'mc.fractions-concept.unequal-parts-counted-as-fractions',
  pctDeg: 'mc.data-displays.percent-as-degrees',
  wrongTotal: 'mc.percent.divides-by-wrong-total',
  noScale: 'mc.percent.appends-percent-sign-to-unscaled-value',
  early: 'mc.decimals.intermediate-precision-always-invalid',
  point: 'mc.decimals.dollars-cents-point-misplaced',
  half: 'mc.angles.wrong-total-line-or-circle',
  times360: 'mc.data-displays.count-times-360',
  forceLast: 'mc.data-displays.forces-last-value-to-close-whole',
  notSum: 'mc.data-displays.counts-not-summing-to-total',
  tiny: 'mc.data-displays.small-share-rounds-to-zero',
  sameRadius: 'mc.angles.sectors-from-same-radius',
  protractor: 'mc.angles.reads-wrong-protractor-scale',
  reflex: 'mc.angles.no-reflex-angles',
  rawLabel: 'mc.data-displays.unconverted-quantities-as-percent-labels',
  noTotal: 'mc.data-displays.omits-total-needed-to-recover-counts',
  swapped: 'mc.data-displays.swapped-labels',
  byAnswer: 'mc.reasoning-language.judges-work-by-final-answer',
  nearMiss: 'mc.estimation.near-miss-accepted-as-match',
  mustSum: 'mc.estimation.rounded-parts-must-sum-to-total',
  remainder: 'mc.data-displays.assigns-unaccounted-remainder-to-unsupported-category',
  nonWhole: 'mc.data-displays.pie-of-non-whole',
} as const;
export { MC };

// ===== 1 circle-is-whole =====
const wholeFam: Gen = (R, n) => {
  const c = pick(R, PEOPLE), v = int(R, 0, 2);
  if (v === 0) {
    // the whole from one slice: p% stands for f people
    const [p, N] = pick(R, [[50, 20], [25, 40], [25, 20], [10, 50], [20, 50], [50, 40], [25, 100], [10, 40], [5, 100], [20, 40]] as const);
    const f = (p * N) / 100;
    const names = shuffle(R, [...c.names]);
    const rest = counts(R, 2, N - f, 1, Math.ceil((N * 30) / 360));
    const cats: Cat[] = [{ name: names[0]!, count: f }, { name: names[1]!, count: rest[0]! }, { name: names[2]!, count: rest[1]! }];
    const labels = cats.map((t, i) => (i === 0 ? [t.name, `${p}%`] as [string, string] : null));
    return {
      id: `whole-${n}`, family: 'whole', input: 'num', unit: c.who,
      prompt: `In a circle graph, the ${B(cats[0]!.name)} slice is ${S(`${p}%`)} of the circle and stands for ${B(qty(c, f))}. How many ${c.who} does the whole circle stand for?`,
      board: `${p}\\% \\to ${f}`, work: `100\\% \\to \\cssId{n}{${N}}`,
      picture: { kind: 'graph', cats, labels, focus: 0 },
      solution: [`${p}% is ${fr(p, 100)} = ${fr(1, 100 / p)} of the whole.`, `So the whole is ${100 / p} × ${f} = ${mark(`${N} ${c.who}`)}: that group is 100%.`],
      answer: { kind: 'num', v: N },
      check: numCheck(N, `Yes: ${f} ${c.who} are ${p}%, so 100% is ${N} ${c.who}.`, [
        { v: p, mc: MC.fixed, say: `${p}% is not ${p} ${c.who}: a percent is a share of the whole, and here the whole is not 100 people. ${p}% stands for ${f}, so 100% stands for ${N}.` },
        { v: 100, mc: MC.fixed, say: `The circle is always 100%, but that is not 100 ${c.who}. ${f} ${c.who} are ${p}%, so the whole is ${N}.` },
      ], `${p}% is ${fr(1, 100 / p)} of the circle. ${fr(1, 100 / p)} of the whole is ${f}, so the whole is ${N}.`),
    };
  }
  // surveyed vs answered: the whole is the named collection
  const N = pick(R, [20, 40, 50]), miss = pick(R, N === 20 ? [2, 3, 4] : [4, 5, 6, 10]);
  const cats = dataSet(R, c, 3, N - miss, { minDeg: 30 });
  cats.push({ name: 'No answer', count: miss });
  const answered = N - miss;
  return choiceItem(R, {
    id: `whole-${n}`, family: 'whole',
    prompt: `${A(N)} ${c.who} were asked one question. ${B(answered)} answered and ${miss} gave no answer. The graph is titled "${c.title} of the ${N} ${c.who} asked". What does the whole circle stand for?`,
    board: table(cats, N, c),
    picture: { kind: 'graph', cats, title: `${c.title}, ${N} asked` },
    solution: [`The title names the whole: the ${A(N)} ${c.who} asked.`, `Every one of them is in a slice, the ${miss} who gave no answer too, so the circle is ${mark(N)} = 100%.`],
  }, [
    { t: `All ${N} ${c.who} asked: 100%`, ok: true, say: `Yes. The title names the whole, and the "No answer" slice keeps all ${N} in the circle.` },
    { t: `Only the ${answered} who answered`, ok: false, mc: MC.subtotal, say: `The title says the ${N} asked, and the ${miss} who gave no answer have their own slice. The whole is ${N}.` },
    { t: `100 ${c.who}`, ok: false, mc: MC.fixed, say: `The circle is 100%, but that is not 100 ${c.who}. 100% here is the ${N} asked.` },
  ]);
};

// ===== 2 sector-share-by-central-angle =====
const sameShare: Gen = (R, n) => {
  if (R() < 0.5) {
    const deg = pick(R, [90, 180, 120, 60, 45, 72, 36]);
    const pct = deg / 3.6;
    const bigIsB = R() < 0.5;
    const rA = bigIsB ? 140 : 205, rB = bigIsB ? 205 : 140;
    const startA = pick(R, [0, 30, 300, 90]), startB = pick(R, [120, 200, 250, 160]);
    const pT = Number.isInteger(pct) ? `${pct}%` : `${fmt1(pct)}%`;
    return choiceItem(R, {
      id: `same-${n}`, family: 'sameShare',
      prompt: `Two circle graphs, A and B, of different sizes. Each has a ${S(`${deg}°`)} slice, turned a different way. Which slice is the bigger share of its own circle?`,
      board: `${deg}^\\circ \\ \\text{and}\\ ${deg}^\\circ`, work: `\\frac{${deg}}{360} ${Number.isInteger(pct * 10) ? '=' : '\\approx'} ${fmt1(pct)}\\%`,
      picture: { kind: 'two', deg, startA, startB, rA, rB },
      solution: [`A slice's share is its angle out of the full turn: ${deg}° out of 360°.`, `Both are ${fr(deg, 360)} = ${pT} of their own circle. Size and turn change nothing.`],
    }, [
      { t: 'Neither: same angle, same share', ok: true, say: `Right: ${deg}° of 360° is ${pT} in any circle, big or small, turned any way.` },
      { t: `Slice ${bigIsB ? 'B' : 'A'}: it is drawn bigger`, ok: false, mc: MC.radius, say: `A bigger circle has a bigger slice, but its WHOLE is bigger too. The share is ${deg}° out of 360° in both: ${pT}.` },
      { t: `It depends on which way each slice points`, ok: false, mc: MC.radius, say: `Turning a slice does not change its angle. Both are ${deg}° out of 360°: ${pT}.` },
    ]);
  }
  // unequal pieces: k pieces is not k equal parts
  const set = pick(R, [[180, 90, 90], [90, 180, 90], [180, 90, 45, 45], [90, 90, 180], [120, 120, 60, 60]] as const);
  const k = set.length;
  const idxs = set.map((_, i) => i).filter(i => Math.abs(set[i]! - 360 / k) > 1);
  const i = pick(R, idxs), deg = set[i]!, pct = deg / 3.6;
  const cats: Cat[] = set.map((d, j) => ({ name: `piece ${j + 1}`, count: d }));
  const opts: Opt[] = [
    { t: `${fmt1(pct)}%`, ok: true, say: `Yes: ${deg}° out of 360° is ${fr(deg, 360)} = ${fmt1(pct)}%. The pieces are not equal, so counting them does not give the share.` },
    { t: `${fmt1(roundQ(rat(100, k)))}%`, ok: false, mc: MC.unequal, say: `There are ${k} pieces, but they are not equal, so each is not ${fr(1, k)}. This piece is ${deg}° of 360°: ${fmt1(pct)}%.` },
  ];
  const third = [10, 25, 50, 75, 20].find(v => !opts.some(o => o.t === `${v}%`))!;
  opts.push({ t: `${third}%`, ok: false, say: `Measure the angle: ${deg}° of 360° is ${fmt1(pct)}%.` });
  return choiceItem(R, {
    id: `same-${n}`, family: 'sameShare',
    prompt: `This circle is cut into ${k} pieces. The lit piece has a central angle of ${S(`${deg}°`)}. What percent of the circle is it?`,
    board: `${k}\\ \\text{pieces}`, work: `\\frac{${deg}}{360} = ${fmt1(pct)}\\%`,
    picture: { kind: 'graph', cats, labels: 'none', focus: i, plain: true },
    solution: [`Only the angle sets the share: ${deg}° out of 360°.`, `${fr(deg, 360)} = ${fmt1(pct)}%. The number of pieces does not, because they are not equal.`],
  }, opts);
};

// ===== 3 percent-degree-double-scale =====
const DEG_BENCH: readonly { t: string; tex: string; pct: number; deg: number; frac: boolean }[] = [
  { t: '1/2', tex: '\\tfrac{1}{2}', pct: 50, deg: 180, frac: true }, { t: '1/4', tex: '\\tfrac{1}{4}', pct: 25, deg: 90, frac: true },
  { t: '1/8', tex: '\\tfrac{1}{8}', pct: 12.5, deg: 45, frac: true }, { t: '1/3', tex: '\\tfrac{1}{3}', pct: 100 / 3, deg: 120, frac: true },
  { t: '1/6', tex: '\\tfrac{1}{6}', pct: 100 / 6, deg: 60, frac: true }, { t: '1/12', tex: '\\tfrac{1}{12}', pct: 100 / 12, deg: 30, frac: true },
  { t: '1/10', tex: '\\tfrac{1}{10}', pct: 10, deg: 36, frac: true }, { t: '3/4', tex: '\\tfrac{3}{4}', pct: 75, deg: 270, frac: true },
  ...[5, 10, 15, 20, 30, 40, 45, 60, 70, 80, 35, 65, 1, 2].map(p => ({ t: `${p}%`, tex: `${p}\\%`, pct: p, deg: p * 3.6, frac: false })),
];
const sliceCats = (deg: number): { cats: Cat[]; angles: number[] } => ({ cats: [{ name: 'slice', count: Math.round(deg * 10) }, { name: 'rest', count: 3600 - Math.round(deg * 10) }], angles: [deg, 360 - deg] });
const toDeg: Gen = (R, n) => {
  const b = pick(R, DEG_BENCH), deg = Math.round(b.deg * 10) / 10;
  const { cats, angles } = sliceCats(deg);
  const half = Math.round((b.deg / 2) * 10) / 10;
  const what = b.frac ? `${b.t.replace(/(\d+)\/(\d+)/, (_, x, y) => fr(x, y))} of the circle` : `${b.pct}% of the circle`;
  return {
    id: `toDeg-${n}`, family: 'toDeg', input: 'num', unit: '°',
    prompt: `A slice is ${S(what)}. What is its central angle?`,
    board: `${b.tex} \\to \\ ?^\\circ`, work: `${b.frac ? b.tex : `\\tfrac{${b.pct}}{100}`} \\times 360^\\circ = \\cssId{s}{${fmt1(deg)}^\\circ}`,
    picture: { kind: 'graph', cats, angles, labels: 'none', ring: 'quarters', focus: 0, plain: true, show: 0 },
    solution: [`The whole circle is 100% and 360° at the same time.`, b.frac ? `${what}: ${b.t} × 360° = ${fmt1(deg)}°.` : `1% of the circle is 3.6°, so ${b.pct}% is ${b.pct} × 3.6° = ${fmt1(deg)}°.`],
    answer: { kind: 'num', v: deg },
    check: numCheck(deg, `Yes: ${fmt1(deg)}°.`, [
      { v: Math.round(b.pct * 10) / 10, mc: MC.pctDeg, say: `${fmt1(b.pct)} is the percent, not the angle. The circle is 100% but 360°, so every percent is 3.6°: ${fmt1(deg)}°.` },
      { v: half, mc: MC.half, say: `That uses 180° for the whole circle. A full turn is 360°, so it is ${fmt1(deg)}°.` },
    ], `Out of 360°: ${fmt1(deg)}°.`, 0.05),
  };
};
const toPct: Gen = (R, n) => {
  const deg = pick(R, [180, 90, 45, 135, 36, 72, 18, 54, 108, 144, 270, 9, 162, 198, 216, 252, 225, 315, 126, 234, 288, 324, 27, 63, 81, 99]);
  const pct = deg / 3.6;
  const { cats, angles } = sliceCats(deg);
  return {
    id: `toPct-${n}`, family: 'toPct', input: 'num', unit: '%',
    prompt: `A slice has a central angle of ${S(`${deg}°`)}. What percent of the circle is it?`,
    board: `${deg}^\\circ \\to \\ ?\\%`, work: `\\tfrac{${deg}}{360} = \\cssId{s}{${fmt1(pct)}\\%}`,
    picture: { kind: 'graph', cats, angles, labels: 'none', ring: 'quarters', focus: 0, plain: true },
    solution: [`360° is the whole circle: 100%.`, `${deg}° out of 360° is ${fr(deg, 360)} = ${fmt1(pct)}%.`],
    answer: { kind: 'num', v: pct },
    check: numCheck(pct, `Yes: ${deg}° is ${fmt1(pct)}% of the circle.`, [
      { v: deg, mc: MC.pctDeg, say: `${deg} is the angle, not the percent. The circle is 360° but 100%: ${deg}° is ${fmt1(pct)}%.` },
      { v: Math.round((deg / 1.8) * 10) / 10, mc: MC.half, say: `That takes 180° as the whole circle. A full turn is 360°: ${fmt1(pct)}%.` },
    ], `Divide by 360° and take that share of 100%: ${fmt1(pct)}%.`, 0.05),
  };
};

// ===== 4 estimate-sector-share =====
const BANDS: readonly { lo: number; hi: number; t: string }[] = [
  { lo: 0, hi: 45, t: 'less than 12.5%' }, { lo: 45, hi: 90, t: 'between 12.5% and 25%' }, { lo: 90, hi: 120, t: 'between 25% and 33⅓%' },
  { lo: 120, hi: 180, t: 'between 33⅓% and 50%' }, { lo: 180, hi: 270, t: 'between 50% and 75%' }, { lo: 270, hi: 360, t: 'more than 75%' },
];
const estimate: Gen = (R, n) => {
  let deg: number;
  do deg = int(R, 14, 340); while ([45, 90, 120, 180, 270].some(b => Math.abs(deg - b) < 8));
  const bi = BANDS.findIndex(b => deg > b.lo && deg < b.hi), band = BANDS[bi]!;
  const ni = bi === 0 ? 1 : bi === BANDS.length - 1 ? bi - 1 : pick(R, [bi - 1, bi + 1]), nb = BANDS[ni]!;
  const far = BANDS[pick(R, [0, 1, 2, 3, 4, 5].filter(x => Math.abs(x - bi) >= 2))]!;
  const { cats, angles } = sliceCats(deg);
  const asPct = `about ${deg}%`;
  const opts: Opt[] = [
    { t: band.t, ok: true, say: `Yes. Its angle is between ${band.lo}° and ${band.hi}°, so its share is ${band.t}. (It is ${deg}°, ${fmt1(deg / 3.6)}%.)` },
    { t: nb.t, ok: false, say: `Compare it with the benchmarks: it is between ${band.lo}° and ${band.hi}°, so ${band.t}.` },
  ];
  if (deg <= 100) opts.push({ t: asPct, ok: false, mc: MC.pctDeg, say: `${deg}° is the angle, but a percent of the circle is out of 100, not 360. It is ${band.t}.` });
  else opts.push({ t: far.t, ok: false, mc: MC.radius, say: `Turn the graph in your head: the angle is what counts, and it is between ${band.lo}° and ${band.hi}°: ${band.t}.` });
  return choiceItem(R, {
    id: `estimate-${n}`, family: 'estimate',
    prompt: `No protractor. About what share of the circle is the lit slice? Compare it with a half, a quarter, an eighth and a third.`,
    board: `?\\%`, work: `${deg}^\\circ \\approx \\cssId{s}{${fmt1(deg / 3.6)}\\%}`,
    picture: { kind: 'graph', cats, angles, labels: 'none', focus: 0, plain: true, start: int(R, 0, 11) * 30 },
    solution: [`Benchmarks: 45° = 12.5%, 90° = 25%, 120° = 33⅓%, 180° = 50%, 270° = 75%.`, `The slice is ${deg}°: ${band.t}.`],
  }, opts);
};

// ===== 5 relative-frequency =====
const share: Gen = (R, n) => {
  const c = pick(R, CTX), hard = R() < 0.4;
  const N = hard ? pick(R, [120, 150, 200, 250, 300, 400, 500, 600, 800, 1000]) : pick(R, [20, 40, 50, 100]);
  const k = hard ? int(R, 4, 6) : int(R, 2, 4);
  const cats = dataSet(R, c, k, N, { minDeg: 20 });
  const big = Math.max(...cats.map(t => t.count));
  const i = int(R, 0, k - 1), f = cats[i]!.count;
  const showTotal = !hard || R() < 0.5;
  return {
    id: `share-${n}`, family: 'share', input: 'frac', unit: showTotal ? `of ${whole(c, N)}` : `of all the ${c.who}`,
    prompt: `${c.title}: what fraction of ${A(showTotal ? whole(c, N) : `all the ${c.who}`)} is ${B(cats[i]!.name)}?${showTotal ? '' : ' The total is not given: add it up.'}`,
    board: table(cats, showTotal ? N : null, c, { col: i }), work: `\\frac{\\cssId{f}{${f}}}{\\cssId{n}{${N}}}`,
    picture: { kind: 'graph', cats, labels: cats.map(t => [t.name, (c.money ? '$' : '') + t.count]), focus: i, title: c.title },
    solution: [showTotal ? `The total is ${A(N)}.` : `First the total: ${cats.map(t => t.count).join(' + ')} = ${A(N)}.`, `${cats[i]!.name} is ${B(f)} of the ${N}: ${mark(fr(f, N))} (any equal fraction is fine).`],
    answer: { kind: 'frac', w: 0, n: f, d: N },
    check: r => {
      if (r.kind !== 'frac' || r.d <= 0 || r.w < 0 || r.n < 0) return { ok: false, say: 'Type a fraction: the count on top, the total underneath.' };
      const p = r.w * r.d + r.n, q = r.d;
      if (p * N === f * q) return { ok: true, say: `Yes: ${f} out of ${N}, ${fr(f, N)} of the whole.` };
      if (big !== f && p * big === f * q) return { ok: false, mc: MC.wrongTotal, say: `${big} is the biggest group, not the total. Divide by all ${N}: ${fr(f, N)}.` };
      if (p * f === N * q) return { ok: false, say: `That is upside down: the count goes on top, the total underneath: ${fr(f, N)}.` };
      return { ok: false, say: `Count over total: ${fr(f, N)}.` };
    },
  };
};

// ===== 6 percent-from-relative-frequency =====
const pct: Gen = (R, n) => {
  const c = pick(R, CTX);
  const N = pick(R, [20, 25, 50, 20, 25, 50, 8, 40]);
  const k = int(R, 3, 4);
  const cats = dataSet(R, c, k, N, { minDeg: 20 });
  const zero = R() < 0.15;
  if (zero) cats.push({ name: c.names.find(x => !cats.some(t => t.name === x))!, count: 0 });
  const i = zero ? cats.length - 1 : int(R, 0, k - 1), f = cats[i]!.count, p = rat(100 * f, N), pv = qNum(p);
  const dec = f / N;
  return {
    id: `pct-${n}`, family: 'pct', input: 'num', unit: '%',
    prompt: `${c.title} of ${A(whole(c, N))}. What percent is ${B(cats[i]!.name)}?`,
    board: table(cats, N, c, { col: i }), work: `\\tfrac{${f}}{${N}} = \\cssId{s}{${pctStr(p)}\\%}`,
    picture: { kind: 'graph', cats, labels: cats.map((t, j) => (j === i ? [t.name, '?'] : [t.name, `${pctStr(rat(100 * t.count, N))}%`])), focus: f ? i : undefined, reveal: `${pctStr(p)}%`, title: titleOf(c, N) },
    solution: [`${cats[i]!.name} is ${fr(f, N)} of the whole.`, `${fr(f, N)} × 100% = ${S(pctStr(p) + '%')}.${f === 0 ? ' A count of 0 is 0%: it gets no slice.' : ''}`],
    answer: { kind: 'num', v: pv },
    check: numCheck(pv, `Yes: ${fr(f, N)} = ${pctStr(p)}%.`, [
      { v: f, mc: MC.fixed, say: `${f} is the count. A percent is out of 100, and here the whole is ${N}: ${fr(f, N)} × 100% = ${pctStr(p)}%.` },
      { v: dec, mc: MC.noScale, say: `${dec} is the share as a decimal. To make it per 100, multiply by 100: ${pctStr(p)}%.` },
    ], `${fr(f, N)} × 100% = ${pctStr(p)}%.`, 0.001),
  };
};

// ===== 7 round-displayed-percent =====
const roundPct: Gen = (R, n) => {
  const c = pick(R, PEOPLE);
  let N: number, f: number, p: Q;
  do { N = pick(R, [3, 6, 7, 12, 30, 7, 12]); f = int(R, 1, N - 1); p = rat(100 * f, N); } while (Number.isInteger(qNum(p) * 10));
  const tenth = R() < 0.5;
  const ans = tenth ? round1(p) : roundQ(p);
  const early = tenth ? Math.round(Math.round((f / N) * 100) / 100 * 1000) / 10 : NaN;   // share rounded to 0.01 first
  const shift = tenth ? Math.round(round1(p)) / 10 : Math.round(roundQ(p)) / 10;
  const cats: Cat[] = [{ name: c.names[0]!, count: f }, { name: c.names[1]!, count: N - f }];
  const what = tenth ? 'to the nearest tenth of a percent' : 'to the nearest whole percent';
  return {
    id: `round-${n}`, family: 'roundPct', input: 'num', unit: '%',
    prompt: `${B(f)} of the ${A(N)} ${c.who} picked ${cats[0]!.name}. What percent is that, ${what}? (Calculator OK: do 100 × ${f} ÷ ${N} in one go.)`,
    board: `100 \\times ${f} \\div ${N}`, work: `${qNum(p).toFixed(3)}\\ldots \\approx \\cssId{s}{${fmt1(ans)}\\%}`,
    picture: { kind: 'graph', cats, labels: 'none', focus: 0 },
    solution: [`100 × ${f} ÷ ${N} = ${(qNum(p)).toFixed(4)}…`, `Round only at the end, ${what}: ${S(fmt1(ans) + '%')}.`],
    answer: { kind: 'num', v: ans },
    check: numCheck(ans, `Yes: about ${fmt1(ans)}%.`, [
      ...(tenth && Math.abs(early - ans) > 0.05 ? [{ v: early, mc: MC.early, say: `That rounds the share to ${fmt1(Math.round((f / N) * 100) / 100)} first, which loses digits. Keep all the digits and round once at the end: ${fmt1(ans)}%.` }] : []),
      { v: shift, mc: MC.point, say: `The decimal point moved only one place. ${f} ÷ ${N} × 100 moves it two places: ${fmt1(ans)}%.` },
    ], `100 × ${f} ÷ ${N} = ${(qNum(p)).toFixed(3)}…, which rounds to ${fmt1(ans)}%.`, 0.001),
  };
};

// ===== 8 central-angle-from-share =====
const angle: Gen = (R, n) => {
  const c = pick(R, CTX), easy = R() < 0.6;
  const N = easy ? pick(R, [12, 20, 24, 30, 36, 40, 60]) : pick(R, [7, 11, 13, 14, 16, 22, 26, 28, 35, 70]);
  const k = int(R, 3, 4);
  const cats = dataSet(R, c, k, N, { minDeg: 24 });
  const i = int(R, 0, k - 1), f = cats[i]!.count, a = rat(360 * f, N), av = qNum(a);
  const ans = easy ? av : round1(a);
  const tenth = !Number.isInteger(av);
  return {
    id: `angle-${n}`, family: 'angle', input: 'num', unit: '°',
    prompt: `${c.title} of ${A(whole(c, N))}. What central angle does ${B(cats[i]!.name)} get${tenth ? ', to the nearest tenth of a degree' : ''}?`,
    board: table(cats, N, c, { col: i }), work: `\\tfrac{${f}}{${N}} \\times 360^\\circ ${tenth ? '\\approx' : '='} \\cssId{s}{${fmt1(ans)}^\\circ}`,
    picture: { kind: 'graph', cats, labels: cats.map(t => [t.name, (c.money ? '$' : '') + t.count]), focus: i, show: i, title: titleOf(c, N) },
    solution: [`${cats[i]!.name} is ${fr(f, N)} of the whole circle.`, `${fr(f, N)} × 360° = ${tenth ? `${mark(`${fmt1(ans)}°`)} (exactly ${Math.floor(av)} ${fr(a.p % a.q, a.q)}°)` : mark(`${av}°`)}.`],
    answer: { kind: 'num', v: ans },
    check: numCheck(ans, `Yes: ${fr(f, N)} of 360° is ${fmt1(ans)}°.`, [
      { v: f * 360, mc: MC.times360, say: `That is ${f} × 360°, ${f} whole circles. Take ${fr(f, N)} OF 360°: ${fmt1(ans)}°.` },
      { v: round1(rat(100 * f, N)), mc: MC.pctDeg, say: `${fmt1(round1(rat(100 * f, N)))} is the percent. The angle is the same share of 360°: ${fmt1(ans)}°.` },
      { v: round1(rat(180 * f, N)), mc: MC.half, say: `That takes 180° as the whole circle. A full turn is 360°: ${fmt1(ans)}°.` },
    ], `${fr(f, N)} × 360° = ${fmt1(ans)}°.`, 0.05),
  };
};

// ===== 9 keep-unrounded-shares =====
const exact: Gen = (R, n) => {
  const c = pick(R, PEOPLE);
  for (;;) {
    const N = pick(R, [7, 11, 13, 9, 14, 17]), f = int(R, 1, Math.min(4, N - 1));
    const a = rat(360 * f, N);
    const right = round1(a), fromPct = Math.round(3.6 * roundQ(rat(100 * f, N)) * 10) / 10, fromDec = Math.round(360 * (Math.round((f / N) * 1000) / 1000) * 10) / 10;
    if (new Set([right, fromPct, fromDec]).size < 3) continue;
    const cats: Cat[] = [{ name: c.names[2]!, count: f }, { name: 'others', count: N - f }];
    return choiceItem(R, {
      id: `exact-${n}`, family: 'exact',
      prompt: `${B(f)} of ${A(N)} ${c.who} picked ${c.names[2]}. Its label says ${roundQ(rat(100 * f, N))}%. Which central angle is right, to the nearest tenth of a degree?`,
      board: `\\tfrac{${f}}{${N}} \\times 360^\\circ`, work: `\\tfrac{${f}}{${N}} \\times 360^\\circ \\approx \\cssId{s}{${fmt1(right)}^\\circ}`,
      picture: { kind: 'graph', cats, labels: 'none', focus: 0 },
      solution: [`Use the exact share ${fr(f, N)}, not the rounded label.`, `360 × ${f} ÷ ${N} = ${qNum(a).toFixed(3)}…° ≈ ${S(fmt1(right) + '°')}. Round once, at the end.`],
    }, [
      { t: `${fmt1(right)}°`, ok: true, say: `Yes: from the exact share ${fr(f, N)}, 360 × ${f} ÷ ${N} ≈ ${fmt1(right)}°.` },
      { t: `${fmt1(fromPct)}°`, ok: false, mc: MC.early, say: `That starts from the rounded label ${roundQ(rat(100 * f, N))}%. The label is for reading; for the angle use the exact share ${fr(f, N)}: ${fmt1(right)}°.` },
      { t: `${fmt1(fromDec)}°`, ok: false, mc: MC.early, say: `That rounds ${fr(f, N)} to ${Math.round((f / N) * 1000) / 1000} first. Keep every digit until the end: ${fmt1(right)}°.` },
    ]);
  }
};

// ===== 10 close-angle-list =====
const close: Gen = (R, n) => {
  const c = pick(R, PEOPLE);
  for (;;) {
    const N = pick(R, [7, 11, 13, 9, 14, 17, 19]), k = int(R, 3, 5);
    if (N < k + 2) continue;
    const cs = counts(R, k, N);
    if (cs.some(x => (360 * x) / N < 18)) continue;
    const cats = cs.map((count, i) => ({ name: c.names[i]!, count }));
    const m = computePie(cats);
    const indepSum = m.indep.reduce((s, x) => s + x, 0);
    if (indepSum === 360) continue;
    const forced = [...m.indep]; forced[k - 1] = 360 - m.indep.slice(0, -1).reduce((s, x) => s + x, 0);
    const L = (xs: number[]) => xs.map(x => `${x}°`).join(', ');
    if (L(forced) === L(m.draw) || L(m.indep) === L(m.draw)) continue;
    // the 'fix only the last angle' list must break the 1° rule, or it is an honest drawing too (two right lists)
    if (Math.abs(forced[k - 1]! - (360 * cs[k - 1]!) / N) < 1) continue;
    return choiceItem(R, {
      id: `close-${n}`, family: 'close',
      prompt: `${c.title} of ${A(N)} ${c.who}. Rounded one by one, the angles are ${L(m.indep)}: a total of ${indepSum}°. Which list should you draw?`,
      board: table(cats, N, c),      picture: { kind: 'graph', cats, labels: cats.map(t => [t.name, String(t.count)]), title: `${c.title}, ${N} ${c.who}` },
      solution: [`Running totals of the counts: ${cats.map((_, i) => cats.slice(0, i + 1).reduce((s, t) => s + t.count, 0)).join(', ')} of ${N}.`,
        `Boundaries 360 × running total ÷ ${N}, rounded: ${m.bound.join('°, ')}° (the last is 360°).`, `Differences: ${S(L(m.draw))}. They total 360°, each within 1° of exact.`],
    }, [
      { t: L(m.draw), ok: true, say: `Yes: round the running boundaries (${m.bound.join(', ')}) and take the differences. The list closes at 360°.` },
      { t: L(forced), ok: false, mc: MC.forceLast, say: `Changing only the last angle dumps all the rounding error on one slice. Round the running boundaries instead: ${L(m.draw)}.` },
      { t: `${L(m.indep)} (close enough)`, ok: false, mc: MC.notSum, say: `The slices must fill the circle exactly: ${indepSum}° leaves ${indepSum < 360 ? 'a gap' : 'an overlap'}. Round the running boundaries: ${L(m.draw)}.` },
    ]);
  }
};

// ===== 11 draw-adjacent-sectors =====
const adjacent: Gen = (R, n) => {
  const c = pick(R, CTX), pctCircle = R() < 0.35;
  if (pctCircle) {
    const cats = dataSet(R, c, 4, 20, { wholePct: true, minDeg: 36 });
    const j = int(R, 1, 2), m = computePie(cats);
    const before = m.pctLabel.slice(0, j).reduce((s, x) => s + x, 0), p = m.pctLabel[j]!;
    return {
      id: `adj-${n}`, family: 'adjacent', input: 'num', unit: '%',
      prompt: `On a percent circle, the slices so far end at the ${A(`${before}%`)} mark. The next slice, ${cats[j]!.name}, is ${B(`${p}%`)}. At which mark does it end?`,
      board: `${before}\\% + ${p}\\% = \\ ?`, work: `${before}\\% + ${p}\\% = \\cssId{s}{${before + p}\\%}`,
      picture: { kind: 'graph', cats, labels: 'none', ring: 'pct100', focus: j, show: j, ray: { deg: before * 3.6, text: `${before}%` } },
      solution: [`Each slice starts where the last one ended: at ${before}%.`, `${before}% + ${p}% = ${S(before + p + '%')}.`],
      answer: { kind: 'num', v: before + p },
      check: numCheck(before + p, `Yes: from ${before}% on, ${p}% more ends at ${before + p}%.`, [
        { v: p, mc: MC.sameRadius, say: `That measures from the top again, so the slice would cover the first one. Start where the last slice ended: ${before}% + ${p}% = ${before + p}%.` },
      ], `Start at ${before}% and add ${p}%: ${before + p}%.`),
    };
  }
  const N = pick(R, [20, 24, 30, 36, 40, 60]);
  const cats = dataSet(R, c, 4, N, { wholeDeg: true, minDeg: 30 });
  const m = computePie(cats), j = int(R, 1, 2);
  const before = m.bound[j - 1]!, b = m.draw[j]!;
  const wrongScale = before + (180 - b);
  return {
    id: `adj-${n}`, family: 'adjacent', input: 'num', unit: '°',
    prompt: `The slices so far end at the ${A(`${before}°`)} mark. The next slice, ${cats[j]!.name}, is ${B(`${b}°`)}. At what mark on the degree ring does it end?`,
    board: `${before}^\\circ + ${b}^\\circ = \\ ?`, work: `${before}^\\circ + ${b}^\\circ = \\cssId{s}{${before + b}^\\circ}`,
    picture: { kind: 'graph', cats, labels: 'none', ring: 'quarters', focus: j, show: j, ray: { deg: before, text: `${before}°` } },
    solution: [`Put the protractor's 0 on the ray where the last slice ended (${before}°).`, `Measure ${b}° from there: the slice ends at ${before}° + ${b}° = ${S(before + b + '°')}.`],
    answer: { kind: 'num', v: before + b },
    check: numCheck(before + b, `Yes: ${before}° + ${b}° = ${before + b}°.`, [
      { v: b, mc: MC.sameRadius, say: `That measures from the first ray again, so the slices would overlap. Start at the end of the last slice: ${before}° + ${b}° = ${before + b}°.` },
      ...(b !== 90 && wrongScale !== b ? [{ v: wrongScale, mc: MC.protractor, say: `That reads the other scale of the protractor (180° − ${b}° = ${180 - b}°). Use the scale that starts at 0 on your ray: ${before + b}°.` }] : []),
    ], `Start at ${before}° and add ${b}°: ${before + b}°.`),
  };
};

// ===== 12 draw-reflex-sector =====
const reflex: Gen = (R, n) => {
  const c = pick(R, PEOPLE);
  if (R() < 0.2) {
    const N = pick(R, [12, 20, 25, 30]), name = pick(R, c.names);
    const cats: Cat[] = [{ name, count: N }];
    return choiceItem(R, {
      id: `reflex-${n}`, family: 'reflex',
      prompt: `All ${A(N)} ${c.who} picked ${name}. What does the circle graph look like?`,
      board: `\\tfrac{${N}}{${N}} = 100\\%`, work: `100\\% = \\cssId{s}{360^\\circ}`,
      picture: { kind: 'graph', cats, labels: [[name, '100%']], focus: 0, show: 0 },
      solution: [`${name} is ${N} of ${N}: 100% of the whole.`, `100% is the full turn, 360°: the whole circle is one slice.`],
    }, [
      { t: 'The whole circle, one slice: 360°', ok: true, say: `Yes: 100% is the whole circle, 360°, with no edges inside.` },
      { t: 'Half the circle: 180°', ok: false, mc: MC.half, say: `180° is half a turn. 100% is the full turn: 360°.` },
      { t: 'No slice at all', ok: false, say: `No slice is for a count of 0. ${name} has every ${c.one}: the whole circle.` },
    ]);
  }
  const N = pick(R, [20, 40, 30, 60, 36]);
  for (;;) {
    const minC = Math.ceil((N * 30) / 360);
    const w = int(R, Math.floor(N / 2) + 1, N - 2 * minC);
    const rest = counts(R, 2, N - w, 1, minC);
    const names = shuffle(R, [...c.names]);
    const order = shuffle(R, [0, 1, 2]);
    const cs = [w, rest[0]!, rest[1]!];
    const cats: Cat[] = order.map((o, j) => ({ name: names[j]!, count: cs[o]! }));
    const mm = computePie(cats), bi = mm.draw.findIndex(x => x > 180);
    if (bi < 0) continue;
    const D = mm.draw[bi]!, others = 360 - D;
    const asPlus = R() < 0.5 && D !== 270;
    if (asPlus) return {
      id: `reflex-${n}`, family: 'reflex', input: 'num', unit: '°',
      prompt: `${B(cats[bi]!.name)} needs a ${B(`${D}°`)} slice, but your protractor stops at 180°. Draw it as 180° plus how many more degrees?`,
      board: `${D}^\\circ = 180^\\circ + \\ ?`, work: `${D}^\\circ - 180^\\circ = \\cssId{s}{${D - 180}^\\circ}`,
      picture: { kind: 'graph', cats, labels: 'none', focus: bi },
      solution: [`Draw a straight line through the centre: that is 180°.`, `Then ${D}° − 180° = ${S(D - 180 + '°')} more on the far side.`],
      answer: { kind: 'num', v: D - 180 },
      check: numCheck(D - 180, `Yes: 180° + ${D - 180}° = ${D}°.`, [
        { v: 360 - D, mc: MC.reflex, say: `${360 - D}° is the smaller opening between the two rays, the rest of the circle. The ${cats[bi]!.name} slice is the big side: 180° + ${D - 180}°.` },
      ], `${D}° − 180° = ${D - 180}°.`),
    };
    return {
      id: `reflex-${n}`, family: 'reflex', input: 'num', unit: '°',
      prompt: `The other slices are drawn first and take ${B(`${others}°`)} together. ${B(cats[bi]!.name)} gets the rest. How big is its angle?`,
      board: `360^\\circ - ${others}^\\circ = \\ ?`, work: `360^\\circ - ${others}^\\circ = \\cssId{s}{${D}^\\circ}`,
      picture: { kind: 'graph', cats, labels: 'none', focus: bi },
      solution: [`The whole turn is 360°.`, `What is left: 360° − ${others}° = ${S(D + '°')}, more than half the circle.`],
      answer: { kind: 'num', v: D },
      check: numCheck(D, `Yes: ${D}°, more than a straight angle.`, [
        { v: others, mc: MC.reflex, say: `${others}° is the smaller opening, and that belongs to the other slices. What is left is the big side: 360° − ${others}° = ${D}°.` },
      ], `360° − ${others}° = ${D}°.`),
    };
  }
};

// ===== 13 label-circle-graph =====
const label: Gen = (R, n) => {
  const c = pick(R, PEOPLE), v = int(R, 0, 2);
  if (v === 2) {
    const N = pick(R, [400, 500, 800, 1000]), name = pick(R, c.names);
    const p = 100 / N;
    return choiceItem(R, {
      id: `label-${n}`, family: 'label',
      prompt: `In a survey of ${A(N)} ${c.who}, just ${B(1)} picked ${name}. That is ${p}%: less than 1° of the circle. What should the graph do with ${name}?`,
      board: `\\tfrac{1}{${N}} = ${p}\\%`,
      solution: [`${name} is not 0: one ${c.one} picked it.`, `Keep it and say so: list it in a note beside the graph (${name}: 1, ${p}%).`],
    }, [
      { t: `Keep it: list it in a note beside the graph`, ok: true, say: `Yes. A positive share never disappears silently: a note shows it.` },
      { t: `Leave it out: it rounds to 0%`, ok: false, mc: MC.tiny, say: `It rounds to 0%, but it is not 0: one ${c.one} picked it. Show it in a note beside the graph.` },
      { t: `Give it a 10° slice so it shows`, ok: false, say: `That would show ${name} as almost 3%, which changes the data. Keep it in a note.` },
    ]);
  }
  const N = pick(R, [20, 40, 50, 60]);
  const cats = dataSet(R, c, int(R, 3, 4), N, { wholePct: true, wholeDeg: N !== 50, minDeg: 36 });
  const m = computePie(cats);
  if (v === 0) {
    const i = int(R, 0, cats.length - 1), t = cats[i]!;
    const opts: Opt[] = [
      { t: `${t.name} ${m.pctLabel[i]}%`, ok: true, say: `Yes: the label gives the name and the percent of the whole.` },
      { t: `${t.name} ${m.draw[i]}°`, ok: false, mc: MC.rawLabel, say: `${m.draw[i]}° is the angle you draw with. The label shows the percent: ${m.pctLabel[i]}%.` },
    ];
    if (t.count !== m.pctLabel[i] && t.count !== m.draw[i]) opts.push({ t: `${t.name} ${t.count}`, ok: false, mc: MC.rawLabel, say: `${t.count} is the count. The label shows the percent: ${t.count} of ${N} is ${m.pctLabel[i]}%.` });
    else opts.push({ t: `${t.name} ${m.pctLabel[i]! + 10}%`, ok: false, say: `Check: ${t.count} of ${N} is ${m.pctLabel[i]}%.` });
    return choiceItem(R, {
      id: `label-${n}`, family: 'label',
      prompt: `${c.title} of ${A(N)} ${c.who}. Which label belongs on the ${B(t.name)} slice?`,
      board: table(cats, N, c, { col: i }), work: `\\tfrac{${t.count}}{${N}} = \\cssId{s}{${m.pctLabel[i]}\\%}`,
      picture: { kind: 'graph', cats, labels: cats.map((x, j) => [x.name, j === i ? '?' : `${m.pctLabel[j]}%`]), focus: i, reveal: `${m.pctLabel[i]}%`, title: titleOf(c, N) },
      solution: [`A circle-graph label is the category and its percent of the whole.`, `${t.count} of ${N} = ${S(m.pctLabel[i] + '%')}. Degrees are only for drawing.`],
    }, opts);
  }
  return choiceItem(R, {
    id: `label-${n}`, family: 'label',
    prompt: `Which title should this circle graph get?`,
    board: table(cats, N, c),
    picture: { kind: 'graph', cats },
    solution: [`The title names the whole and its size n, so a reader can get the counts back.`, `${c.title} of ${N} ${c.who}: 25% of it is ${N / 4} ${c.who}.`],
  }, [
    { t: `${c.title} of ${N} ${c.who}`, ok: true, say: `Yes: it names the whole and its total, so every percent can be turned back into a count.` },
    { t: `${c.title}`, ok: false, mc: MC.noTotal, say: `Without the total, nobody can tell how many ${c.who} a slice stands for. Add it: ${c.title} of ${N} ${c.who}.` },
    { t: `${c.title} (360°)`, ok: false, mc: MC.rawLabel, say: `Every circle is 360°, so that says nothing. Name the whole: ${N} ${c.who}.` },
  ]);
};

// ===== 14 audit-against-source =====
const audit: Gen = (R, n) => {
  const c = pick(R, PEOPLE);
  for (;;) {
    const N = pick(R, [20, 40, 60]);
    const cats = dataSet(R, c, 4, N, { wholePct: true, wholeDeg: true, minDeg: 40 });
    const m = computePie(cats);
    const a = int(R, 0, 3), b = (a + int(R, 1, 3)) % 4;
    if (Math.abs(m.draw[a]! - m.draw[b]!) < 25) continue;
    const swap = R() < 0.55;
    if (swap) {
      const labelAt = [0, 1, 2, 3]; labelAt[a] = b; labelAt[b] = a;
      const other = [0, 1, 2, 3].find(x => x !== a && x !== b)!;
      return choiceItem(R, {
        id: `audit-${n}`, family: 'audit',
        prompt: `Kai's graph of this data: the percents total 100% and the angles total 360°. Is the graph right?`,
        board: table(cats, N, c),
        picture: { kind: 'graph', cats, labelAt, title: titleOf(c, N), focus: a },
        solution: [`Check each slice against the data, not just the totals.`, `${cats[a]!.name} is ${m.pctLabel[a]}% (${m.draw[a]}°), but its label sits on the ${m.draw[b]}° slice: the ${cats[a]!.name} and ${cats[b]!.name} labels are swapped.`],
      }, [
        { t: `No: the ${cats[a]!.name} and ${cats[b]!.name} labels are swapped`, ok: true, say: `Yes. Swapping two labels keeps both totals, so the totals cannot catch it. Only checking each slice does.` },
        { t: `Yes: both totals are right`, ok: false, mc: MC.byAnswer, say: `Right totals are needed but not enough. The ${cats[a]!.name} label sits on a ${m.draw[b]}° slice, but ${cats[a]!.name} is ${m.draw[a]}°: two labels are swapped.` },
        { t: `No: the ${cats[other]!.name} slice is the wrong size`, ok: false, say: `${cats[other]!.name} is ${m.draw[other]}°, and so is its slice. The problem is the ${cats[a]!.name} and ${cats[b]!.name} labels: swapped.` },
      ]);
    }
    // compensating error: one slice 18° too big, another 18° too small
    const angles = [...m.draw]; angles[a] = angles[a]! + 18; angles[b] = angles[b]! - 18;
    if (angles[b]! < 20) continue;
    const other = [0, 1, 2, 3].find(x => x !== a && x !== b)!;
    return choiceItem(R, {
      id: `audit-${n}`, family: 'audit',
      prompt: `Jada drew this graph of the data. Her angles total 360°. Is every slice right? (Calculator OK.)`,
      board: table(cats, N, c),
      picture: { kind: 'graph', cats, angles, labels: cats.map((t, i) => [t.name, `${angles[i]}°`]), title: titleOf(c, N), focus: a },
      solution: [`Recompute each angle: count ÷ ${N} × 360°.`, `${cats[a]!.name} should be ${m.draw[a]}° (drawn ${angles[a]}°) and ${cats[b]!.name} ${m.draw[b]}° (drawn ${angles[b]}°): the two errors cancel in the total.`],
    }, [
      { t: `No: ${cats[a]!.name} is 18° too big and ${cats[b]!.name} 18° too small`, ok: true, say: `Yes: the errors cancel, so the total still says 360°. Each slice has to be checked.` },
      { t: `Yes: the angles total 360°`, ok: false, mc: MC.byAnswer, say: `A right total can hide two errors that cancel. ${cats[a]!.name} should be ${m.draw[a]}°, not ${angles[a]}°.` },
      { t: `No: only ${cats[other]!.name} is wrong`, ok: false, say: `${cats[other]!.name}: ${cats[other]!.count} ÷ ${N} × 360° = ${m.draw[other]}°, which is right. Check ${cats[a]!.name} and ${cats[b]!.name}.` },
    ]);
  }
};

// ===== 15 rounding-error-bound =====
const bound: Gen = (R, n) => {
  const c = pick(R, PEOPLE);
  if (R() < 0.55) {
    // genuine rounding: equal groups or real data whose labels do not total 100
    for (;;) {
      const k = int(R, 3, 6), N = k * int(R, 1, 4) * (R() < 0.5 ? 1 : 3) + (R() < 0.5 ? 0 : int(R, 1, k - 1));
      const cats = dataSet(R, c, k, N, { minDeg: 30 });
      const m = computePie(cats), T = m.pctLabel.reduce((s, x) => s + x, 0);
      if (T === 100) continue;
      const lab = m.pctLabel.map(x => `${x}%`).join(', ');
      return choiceItem(R, {
        id: `bound-${n}`, family: 'bound',
        prompt: `The ${k} labels on a circle graph are ${lab}: a total of ${A(`${T}%`)}. A rounding slip, or a real mistake?`,
        board: `\\text{total} = ${T}\\%`,
        picture: { kind: 'graph', cats, title: `${c.title}, ${N} ${c.who}` },
        solution: [`Each rounded label is off by at most 0.5 points.`, `${k} labels can be off by up to ${k} × 0.5 = ${fmt1(k / 2)} points. ${T}% is ${Math.abs(100 - T)} off: rounding can explain it.`],
      }, [
        { t: `Rounding can explain it: ${k} labels can be off by up to ${fmt1(k / 2)} points`, ok: true, say: `Yes. ${Math.abs(100 - T)} point${Math.abs(100 - T) > 1 ? 's' : ''} off is within ${fmt1(k / 2)}.` },
        { t: `A mistake: rounded percents must total exactly 100%`, ok: false, mc: MC.mustSum, say: `Rounded parts often miss 100% a little. ${k} labels can be off by up to ${fmt1(k / 2)} points, and this is ${Math.abs(100 - T)} off.` },
        { t: `A mistake: a category must be missing`, ok: false, say: `A missing category would leave a bigger gap. ${Math.abs(100 - T)} point${Math.abs(100 - T) > 1 ? 's' : ''} is within the ${fmt1(k / 2)} that rounding allows.` },
      ]);
    }
  }
  // too far off for rounding
  const k = int(R, 3, 5), off = pick(R, [3, 4, 5, 6, 8, 12].filter(d => d > k / 2 + 0.5));
  const T = R() < 0.6 ? 100 - off : 100 + off;
  const labels = counts(R, k, T, 1, 8);
  return choiceItem(R, {
    id: `bound-${n}`, family: 'bound',
    prompt: `The ${k} labels on a circle graph are ${labels.map(x => `${x}%`).join(', ')}: a total of ${A(`${T}%`)}. A rounding slip, or a real mistake?`,
    board: `${labels.join(' + ')} = ${T}\\%`,
    solution: [`Each rounded label is off by at most 0.5 points, so ${k} labels by at most ${fmt1(k / 2)}.`, `${T}% is ${off} points off: too far for rounding. Check the data.`],
  }, [
    { t: `A mistake: ${k} labels can only be off by ${fmt1(k / 2)} points`, ok: true, say: `Yes. ${off} points is more than rounding can explain.` },
    { t: `Rounding: it is close to 100%`, ok: false, mc: MC.nearMiss, say: `Close is not enough: ${k} labels can be off by at most ${fmt1(k / 2)} points, and this is ${off} off.` },
    { t: `Fine: percents never total exactly 100%`, ok: false, mc: MC.nearMiss, say: `Often they do, and when they don't, the gap is at most ${fmt1(k / 2)} points for ${k} labels. ${off} is too much.` },
  ]);
};

// ===== 16 disclose-rounding =====
const disclose: Gen = (R, n) => {
  const c = pick(R, PEOPLE);
  for (;;) {
    const eq = R() < 0.5;
    const k = eq ? pick(R, [3, 6]) : int(R, 3, 5);
    const N = eq ? k * pick(R, [2, 3, 4, 5]) : int(R, 11, 40);
    const cats = eq ? Array.from({ length: k }, (_, i) => ({ name: c.names[i]!, count: N / k })) : dataSet(R, c, k, N, { minDeg: 30 });
    const m = computePie(cats), T = m.pctLabel.reduce((s, x) => s + x, 0);
    if (T === 100) continue;
    const forced = 100 - m.pctLabel.slice(0, -1).reduce((s, x) => s + x, 0);
    const last = cats[k - 1]!.name;
    // relabelling the last slice must really misstate it: an exact x.5% could honestly round either way
    if (Math.abs(forced - (100 * cats[k - 1]!.count) / N) <= 0.5) continue;
    return choiceItem(R, {
      id: `disclose-${n}`, family: 'disclose',
      prompt: `${c.title} of ${A(N)} ${c.who}. The rounded labels total ${B(`${T}%`)}. What is the honest fix?`,
      board: `\\text{total} = ${T}\\%`,
      picture: { kind: 'graph', cats, title: `${c.title}, ${N} ${c.who}` },
      solution: [`The data are right; only the rounding makes ${T}%.`, `Keep the labels and the counts, and add a note: "Percents do not total 100% because of rounding."`],
    }, [
      { t: `Keep the labels and add a note: they do not total 100% because of rounding`, ok: true, say: `Yes: the data stay true, and the reader is told why the total is ${T}%.` },
      { t: `Change the ${last} label to ${forced}% so the total is 100%`, ok: false, mc: MC.forceLast, say: `${last} is ${m.pctLabel[k - 1]}%, not ${forced}%: that changes the data to hide the rounding. Keep the labels, add a note.` },
      { t: `Change one count so the percents total 100%`, ok: false, mc: MC.forceLast, say: `The counts are the data: never change them to fit a total. Keep them and add a rounding note.` },
    ]);
  }
};

// ===== 17 incomplete-whole =====
const gap: Gen = (R, n) => {
  const c = pick(R, PEOPLE);
  const N = pick(R, [20, 40, 50, 100]), miss = pick(R, N === 20 ? [2, 3, 4] : [4, 5, 6, 8, 10, 12]);
  const cats = dataSet(R, c, 3, N - miss, { minDeg: 30 });
  if (!cats.some(t => t.name === 'Other') && R() < 0.5) cats[2] = { name: 'Other', count: cats[2]!.count };
  const listed = N - miss, gp = rat(100 * miss, N);
  const v = int(R, 0, 2);
  const pic: Pic = { kind: 'graph', cats, n: N, gap: v === 1 ? 'No answer' : '?', title: `${c.title}, ${N} asked` };
  if (v === 0) return choiceItem(R, {
    id: `gap-${n}`, family: 'gap',
    prompt: `A survey asked ${A(N)} ${c.who}. The counts listed add up to only ${B(listed)}, and the source does not say why. What should the graph do?`,
    board: table(cats, N, c, { totalLabel: 'Asked' }),
    picture: pic,
    solution: [`${miss} of the ${N} are not accounted for: ${pctStr(gp)}% of the circle.`, `Show them as "not accounted for" and check the source. Don't invent a category for them.`],
  }, [
    { t: `Show the ${miss} as "not accounted for" and check the source`, ok: true, say: `Yes: the gap stays visible and honest until the source explains it.` },
    { t: `Put the ${miss} into ${cats.some(t => t.name === 'Other') ? 'Other' : 'a new "Other" slice'}`, ok: false, mc: MC.remainder, say: `Nothing says those ${miss} picked anything. Calling them Other invents data. Show the gap as "not accounted for".` },
    { t: `Graph the ${listed} and title it "${N} ${c.who}"`, ok: false, mc: MC.subtotal, say: `Then the circle would claim ${listed} ${c.who} are all ${N}. Keep the whole at ${N} and show the gap.` },
  ]);
  if (v === 1) return choiceItem(R, {
    id: `gap-${n}`, family: 'gap',
    prompt: `A survey asked ${A(N)} ${c.who}. The counts listed add up to ${B(listed)}. The survey notes say ${miss} ${c.who} gave no answer. What should the graph do?`,
    board: table(cats, N, c, { totalLabel: 'Asked' }),
    picture: pic,
    solution: [`The source explains the gap: ${miss} gave no answer.`, `So "No answer" is a real category: ${miss} of ${N} = ${pctStr(gp)}%.`],
  }, [
    { t: `Add a "No answer" slice of ${pctStr(gp)}%`, ok: true, say: `Yes: the source says what the ${miss} are, so they get their own slice and the circle is all ${N}.` },
    { t: `Leave them out and call the ${listed} all ${N}`, ok: false, mc: MC.subtotal, say: `Then the percents would be out of ${listed}, not ${N}. The source says who they are: add a "No answer" slice.` },
    { t: `Share the ${miss} out over the other slices`, ok: false, mc: MC.remainder, say: `Those ${miss} gave no answer, so they did not pick any of those. Give them a "No answer" slice.` },
  ]);
  return choiceItem(R, {
    id: `gap-${n}`, family: 'gap',
    prompt: `You want a circle graph of only the ${B(listed)} ${c.who} who answered (of the ${N} asked). What should the title say?`,
    board: table(cats, listed, c, { totalLabel: 'Answered' }),
    picture: { kind: 'graph', cats },
    solution: [`If the whole is changed to the ${listed} who answered, the graph must say so.`, `Title: "${c.title} of the ${listed} ${c.who} who answered".`],
  }, [
    { t: `${c.title} of the ${listed} ${c.who} who answered`, ok: true, say: `Yes: the title names the smaller whole, so every percent is out of ${listed}.` },
    { t: `${c.title} of the ${N} ${c.who} asked`, ok: false, mc: MC.nonWhole, say: `The slices only hold ${listed} ${c.who}. Calling them all ${N} would be wrong: name the ${listed} who answered.` },
    { t: `${c.title}`, ok: false, mc: MC.noTotal, say: `A reader needs to know which whole: the ${listed} who answered, not the ${N} asked.` },
  ]);
};

// ===== 18 reject-overlapping-categories =====
const fit: Gen = (R, n) => {
  const v = int(R, 0, 2);
  if (v === 0) {
    const c = CTX[1]!;
    const names = shuffle(R, [...c.names]).slice(0, 4);
    let ps: number[];
    do ps = names.map(() => int(R, 15, 55)); while (ps.reduce((s, x) => s + x, 0) < 115);
    const T = ps.reduce((s, x) => s + x, 0);
    return choiceItem(R, {
      id: `fit-${n}`, family: 'fit',
      prompt: `${A(40)} students could pick ${B('every')} sport they play. The percents total ${T}%. Should this data go in a circle graph?`,
      board: `\\text{total} = ${T}\\%`,
      picture: { kind: 'bars', bars: names.map((x, i) => ({ name: x, value: ps[i]! })), unit: '%', title: 'Sports played (pick all), 40 students' },
      solution: [`A student who plays two sports is in two categories: they overlap.`, `So the parts are not pieces of one whole (${T}% ≠ 100%). A bar graph shows each sport on its own.`],
    }, [
      { t: `No: students are counted more than once. Use a bar graph.`, ok: true, say: `Yes: the categories overlap, so they are not slices of one whole.` },
      { t: `Yes: shrink every slice so the total is 100%`, ok: false, mc: MC.nonWhole, say: `Shrinking hides the overlap and changes every share. The categories overlap: a bar graph fits.` },
      { t: `Yes: ${T}% is close enough to 100%`, ok: false, mc: MC.nearMiss, say: `${T}% is ${T - 100} points over: that's overlap, not rounding. Use a bar graph.` },
    ]);
  }
  if (v === 1) {
    const months = ['Jan', 'Mar', 'May', 'Jul', 'Sep', 'Nov'].slice(0, int(R, 4, 6));
    const base = int(R, 20, 40);
    const temps = months.map((_, i) => base + Math.round(45 * Math.sin((Math.PI * i) / (months.length - 1))) + int(R, -3, 3));
    return choiceItem(R, {
      id: `fit-${n}`, family: 'fit',
      prompt: `This data shows the average temperature in ${A('some months')} of one year. Should it go in a circle graph?`,
      board: `\\text{per month, }{}^\\circ\\text{F}`,
      picture: { kind: 'bars', bars: months.map((x, i) => ({ name: x, value: temps[i]! })), unit: '°F', title: 'Average temperature' },
      solution: [`A circle graph shows parts of ONE whole.`, `Temperatures are not parts of anything: adding them means nothing. A bar or line graph fits.`],
    }, [
      { t: `No: temperatures are not parts of a whole`, ok: true, say: `Yes: there is no whole that the months share out. A bar graph fits.` },
      { t: `Yes: each month gets a slice`, ok: false, mc: MC.nonWhole, say: `A slice is a share of a whole. Temperatures do not add up to a whole, so slices would mean nothing.` },
      { t: `Yes, as long as there are no more than 6 months`, ok: false, mc: MC.nonWhole, say: `The number of categories is not the point: the values must be parts of one whole, and temperatures are not.` },
    ]);
  }
  const c = pick(R, PEOPLE), N = pick(R, [20, 40, 50]);
  const cats = dataSet(R, c, int(R, 3, 4), N, { minDeg: 30 });
  return choiceItem(R, {
    id: `fit-${n}`, family: 'fit',
    prompt: `Each of ${A(N)} ${c.who} picked exactly ${B('one')} answer, and the counts add up to ${N}. Should this data go in a circle graph?`,
    board: table(cats, N, c),
    picture: { kind: 'graph', cats, title: `${c.title}, ${N} ${c.who}` },
    solution: [`Every ${c.one} is counted once, and the counts add up to the whole.`, `So the categories are slices of one whole: a circle graph fits.`],
  }, [
    { t: `Yes: each ${c.one} is counted once, and the parts make the whole`, ok: true, say: `Yes: one answer each, no gaps, no overlap. A circle graph fits.` },
    { t: `No: a circle graph needs exactly 100 ${c.who}`, ok: false, mc: MC.fixed, say: `100% is the whole, whatever its size: here ${N} ${c.who}.` },
    { t: `No: surveys always need a bar graph`, ok: false, say: `A bar graph would work too, but a choose-one survey is exactly what a circle graph is for.` },
  ]);
};

export const GENERATORS: Record<FamilyId, Gen> = {
  whole: wholeFam, sameShare, toDeg, toPct, estimate, share, pct, roundPct, angle, exact, close, adjacent, reflex, label, audit, bound, disclose, gap, fit,
};
