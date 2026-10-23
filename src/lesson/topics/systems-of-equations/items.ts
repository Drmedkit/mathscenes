// items.ts: exercise families for "systems of linear equations" (secondary-t5-31), generated from templates, checked
// exactly, and every recognised slip classified against the misconception catalogue (math-curriculum-essentials ids).
// A generator gets the SUB-GOAL it practises (plan.ts) and uses that sub-goal's cases from the topic JSON.
// Most items carry a picture: the system on a plane (SysPic) whose answer-revealing parts only appear on the solve.
// Pure: no DOM, no canvas; a seeded rng makes sessions repeatable.
import { type Item, type Response, type Verdict, fr, int, pick, shuffle } from '../../runtime/item';
import { endOnChoice } from '../../runtime/explain';
import {
  type Form, type Lin, type V, type Win, add, clip, htmlExpr, htmlLin, inWin, isInt, lattice, lhsOf, lin, nH, nP, nT, near, on,
  pairH, pairP, pairT, scale, slope, solve, sub, subH, texExpr, texLin, through, yAt, yInt, ySlope,
} from './sysMaths';

export type FamilyId =
  | 'onLine' | 'makeSolution' | 'howMany' | 'pickPair' | 'checkWork' | 'readCross' | 'pointPick' | 'parallelGraph' | 'howManySys'
  | 'sameLine' | 'solOrNot' | 'subChoice' | 'setEqual' | 'subSolve' | 'reportPair' | 'isolate' | 'whichVar' | 'addEq' | 'elimSolve'
  | 'afterAdd' | 'subEq' | 'scaleOne' | 'pickMult' | 'clearFrac' | 'ratSolve' | 'zeroEq' | 'chooseMethod' | 'methodsAgree'
  | 'graphRead' | 'sketchTrap' | 'estimate' | 'writeOne' | 'fillCount' | 'writeSystem' | 'timesAsMany' | 'verify' | 'findSlip'
  | 'exactVsEst' | 'viable' | 'planMeaning' | 'twoPoints' | 'meetOrNot';
export const FAMILIES: readonly { id: FamilyId; name: string }[] = [
  { id: 'onLine', name: 'Is it on the line?' },
  { id: 'makeSolution', name: 'Make a solution' },
  { id: 'howMany', name: 'How many solutions has one equation?' },
  { id: 'pickPair', name: 'Fits both?' },
  { id: 'checkWork', name: 'Check the check' },
  { id: 'readCross', name: 'Read the crossing' },
  { id: 'pointPick', name: 'Which point solves it?' },
  { id: 'parallelGraph', name: 'Parallel or crossing?' },
  { id: 'howManySys', name: 'How many solutions has the system?' },
  { id: 'sameLine', name: 'Two equations, one line' },
  { id: 'solOrNot', name: 'Which pair is on it?' },
  { id: 'subChoice', name: 'Substitute' },
  { id: 'setEqual', name: 'Set them equal' },
  { id: 'subSolve', name: 'Solve by substitution' },
  { id: 'reportPair', name: 'Report the answer' },
  { id: 'isolate', name: 'Get a letter alone' },
  { id: 'whichVar', name: 'Which letter first?' },
  { id: 'addEq', name: 'Add the equations' },
  { id: 'elimSolve', name: 'Solve by elimination' },
  { id: 'afterAdd', name: 'What comes next?' },
  { id: 'subEq', name: 'Subtract the equations' },
  { id: 'scaleOne', name: 'Multiply a whole equation' },
  { id: 'pickMult', name: 'Pick the multiplier' },
  { id: 'clearFrac', name: 'Clear the fractions' },
  { id: 'ratSolve', name: 'Fractions and decimals' },
  { id: 'zeroEq', name: 'When the letters cancel' },
  { id: 'chooseMethod', name: 'Pick a method' },
  { id: 'methodsAgree', name: 'Do methods agree?' },
  { id: 'graphRead', name: 'Graph it yourself' },
  { id: 'sketchTrap', name: 'Outside the window' },
  { id: 'estimate', name: 'Estimate the crossing' },
  { id: 'writeOne', name: 'Story to one equation' },
  { id: 'fillCount', name: 'Find the other count' },
  { id: 'writeSystem', name: 'Story to a system' },
  { id: 'timesAsMany', name: 'Times as many' },
  { id: 'verify', name: 'Check in the originals' },
  { id: 'findSlip', name: 'Find the slip' },
  { id: 'exactVsEst', name: 'Exact or estimate?' },
  { id: 'viable', name: 'Does it make sense?' },
  { id: 'planMeaning', name: 'What the crossing means' },
  { id: 'twoPoints', name: 'Lines through points' },
  { id: 'meetOrNot', name: 'Do the lines meet?' },
];
export const FAMILY_NAMES: Record<string, string> = Object.fromEntries(FAMILIES.map(f => [f.id, f.name]));

// ---------- misconception ids ----------
export const MC = {
  reversed: 'mc.coordinate-geometry.reverses-coordinate-order',
  exactlyOne: 'mc.linear-equations.exactly-one-solution',
  oneCond: 'mc.systems.one-condition-enough',
  diffValues: 'mc.systems.variable-different-values',
  unpaired: 'mc.systems.reports-unpaired-coordinate-values',
  intercept: 'mc.systems.one-graph-intercept-as-system-solution',
  offscreen: 'mc.linear-functions.parallel-lines-meet-offscreen',
  everyPoint: 'mc.systems.infinite-means-every-point',
  uniqueEq: 'mc.functions-concept.unique-equation-for-graph',
  grouping: 'mc.properties.ignores-grouping-symbols',
  firstTerm: 'mc.expressions.substitutes-only-first-term-of-replacement',
  stops: 'mc.systems.stops-before-all-variables',
  noSignChange: 'mc.linear-equations.moves-term-without-sign-change',
  needsSolved: 'mc.systems.substitution-needs-solved-form',
  deletes: 'mc.systems.deletes-opposite-terms-without-adding-remainders',
  keepsCombined: 'mc.systems.keeps-only-combined-equation',
  subNeg: 'mc.integers.subtract-negative-as-positive',
  addsEqual: 'mc.systems.adds-when-coefficients-equal',
  negFirst: 'mc.integers.distribute-negative-first-term-only',
  someTerms: 'mc.linear-equations.scales-only-some-terms',
  multMismatch: 'mc.systems.multipliers-dont-match',
  divZero: 'mc.systems.divides-by-zero-coefficient',
  zeroVsNone: 'mc.linear-equations.zero-vs-no-solution',
  cancelMisread: 'mc.linear-equations.cancellation-outcome-misread',
  method: 'mc.estimation.method-not-chosen-from-numbers',
  methodsDiffer: 'mc.systems.methods-give-different-answers',
  sketch: 'mc.systems.decides-from-sketch',
  approxExact: 'mc.quadratic-polynomial.approximation-as-exact',
  coefAdd: 'mc.expressions.reads-coefficient-as-addition',
  countValue: 'mc.linear-equations.count-and-value-mixed',
  swapRates: 'mc.expressions.swaps-rates-between-variables',
  reverseTimes: 'mc.expressions.reverses-multiplicative-comparison',
  oneLetter: 'mc.expressions.one-letter-for-two-quantities',
  derivedCheck: 'mc.linear-equations.derived-equation-check-proves-original',
  roughGraph: 'mc.data-displays.rough-graph-overrides-exact-algebra',
  allReals: 'mc.functions-concept.context-domain-all-reals',
  rounds: 'mc.linear-equations.rounds-non-integer-exact-solution',
  riseRun: 'mc.linear-functions.rise-run-inverted',
} as const;

// ---------- the picture ----------
export type Col = 'first' | 'second' | 'pick' | 'link' | 'wrong' | 'dim';
export type When = 'start' | 'solve';
export interface PicLine { L: Lin; col: Col; at: When; dashed?: boolean }
export interface PicPt { p: V; col: Col; at: When; label?: string }
export interface SysPic {
  win: Win; gx?: number; gy?: number; names?: [string, string];
  lines: PicLine[];
  pts?: PicPt[];
  guides?: { x?: number; y?: number; col: Col; at: When }[];
  /** on the solve: the crossing in lime, labelled with its pair (labelText overrides the label) */
  cross?: V | null; crossLabel?: string;
  /** on the solve: arrows across the gap between two parallel lines at these x */
  gaps?: number[];
  /** TeX rows on the board (line 1 amber, line 2 teal); `work` = TeX lines the solve writes under them */
  eqs: string[]; work: string[];
}
export interface SysItem extends Item { family: FamilyId; picture?: { sys: SysPic } }
type Gen = (R: () => number, n: number, sg?: string) => SysItem;

// ---------- small helpers ----------
const X = '<i>x</i>', Y = '<i>y</i>';
const nz = (R: () => number, lo: number, hi: number) => { let v = 0; while (v === 0) v = int(R, lo, hi); return v; };
const gcd = (a: number, b: number): number => { a = Math.abs(a); b = Math.abs(b); while (b) [a, b] = [b, a % b]; return a || 1; };
const lcm = (a: number, b: number) => Math.abs(a * b) / gcd(a, b);
/** HTML of k·letter: "y", "−y", "3y" */
const kH = (k: number, v: string) => `${near(k, -1) ? '−' : near(k, 1) ? '' : nH(k)}${v}`;
/** a number for a sum: negatives in parentheses */
const pn = (v: number) => (v < 0 ? `(${nH(v)})` : nH(v));
const PAIR = { pairLead: `(${X}, ${Y}) = (`, pairOp: ',', pairTail: ')' };
const veq = (p: V, q: V) => near(p[0], q[0]) && near(p[1], q[1]);
/** a line through p with direction (dx, dy), integer coefficients, leading coefficient positive */
function dirLine(p: V, dx: number, dy: number): Lin {
  const g = gcd(dx, dy);
  let a = dy / g, b = -dx / g;
  if (a < 0 || (a === 0 && b < 0)) { a = -a; b = -b; }
  return lin(a, b, a * p[0] + b * p[1]);
}
const DIRS: readonly [number, number][] = [[1, 1], [1, -1], [1, 2], [1, -2], [2, 1], [2, -1], [1, 3], [1, -3], [3, 1], [3, -1], [1, 0], [0, 1], [2, 3], [3, 2], [2, -3], [3, -2]];
/** two crossing lines through sol (directions from DIRS); `noAxis` keeps out horizontal / vertical lines */
function twoLines(R: () => number, sol: V, o: { axis?: boolean; ysafe?: boolean } = {}): [Lin, Lin] {
  const ds = DIRS.filter(d => (o.axis || (d[0] !== 0 && d[1] !== 0)) && (!o.ysafe || d[0] === 1));
  for (;;) {
    const d1 = pick(R, ds), d2 = pick(R, ds);
    if (d1[0] * d2[1] === d1[1] * d2[0]) continue;
    return [dirLine(sol, d1[0], d1[1]), dirLine(sol, d2[0], d2[1])];
  }
}
/** a window around these points (and the origin), 8 to 14 units wide and tall */
export function winFor(pts: readonly V[], pad = 2): Win {
  const xs = [0, ...pts.map(p => p[0])], ys = [0, ...pts.map(p => p[1])];
  let x0 = Math.floor(Math.min(...xs)) - pad, x1 = Math.ceil(Math.max(...xs)) + pad, y0 = Math.floor(Math.min(...ys)) - pad, y1 = Math.ceil(Math.max(...ys)) + pad;
  while (x1 - x0 < 8) { x0--; if (x1 - x0 < 8) x1++; }
  while (y1 - y0 < 8) { y0--; if (y1 - y0 < 8) y1++; }
  return { x0, y0, x1, y1 };
}
/** a scaled first-quadrant window for a context: steps from a nice list, at most 10 squares a side */
export function ctxWin(xmax: number, ymax: number): { win: Win; gx: number; gy: number } {
  const step = (m: number) => [1, 2, 5, 10, 20, 25, 50, 100, 200].find(s => m / s <= 9) ?? 500;
  const gx = step(xmax), gy = step(ymax);
  return { win: { x0: 0, y0: 0, x1: Math.ceil((xmax * 1.08) / gx) * gx, y1: Math.ceil((ymax * 1.08) / gy) * gy }, gx, gy };
}
/** a choice item: options with exactly one right; shuffled */
interface Opt { t: string; ok?: boolean; mc?: string; say: string }
function choose(R: () => number, opts: Opt[]): { choices: string[]; answer: Response; check: (r: Response) => Verdict } {
  const o = shuffle(R, opts.slice());
  const right = o.findIndex(x => x.ok);
  return {
    choices: o.map(x => x.t), answer: { kind: 'choice', i: right },
    check: r => {
      if (r.kind !== 'choice') return { ok: false, say: 'Pick one of the answers.' };
      const x = o[r.i];
      if (!x) return { ok: false, say: 'Pick one of the answers.' };
      return x.ok ? { ok: true, say: x.say } : { ok: false, mc: x.mc, say: x.say };
    },
  };
}
const ser = (o: Opt[]) => o; // readability marker
/** the board rows of a system */
const eqT = (L1: Lin, L2: Lin, f1: Form = 'std', f2: Form = 'std') => [texLin(L1, f1), texLin(L2, f2)];
const board2 = (e: string[]) => e.join(' \\qquad ');
const sysH = (L1: Lin, L2: Lin, f1: Form = 'std', f2: Form = 'std') => `<b class="a">${htmlLin(L1, f1)}</b> and <b class="b">${htmlLin(L2, f2)}</b>`;
/** the pair answer, checked: swapped, fits one equation only, axis intercept, rounded, x or y right */
interface PairO { names?: [string, string]; alts?: { p: V; mc?: string; say: string }[]; ctx?: boolean }
function pairCheck(sol: V, L: readonly Lin[], o: PairO = {}): (r: Response) => Verdict {
  const [nx, ny] = o.names ?? ['x', 'y'];
  return r => {
    if (r.kind !== 'pair' || !Number.isFinite(r.x) || !Number.isFinite(r.y)) return { ok: false, say: 'Type both numbers of the pair.' };
    const p: V = [r.x, r.y];
    if (veq(p, sol)) return { ok: true, say: `Yes: ${pairH(sol)} makes both equations true.` };
    for (const a of o.alts ?? []) if (veq(p, a.p)) return { ok: false, mc: a.mc, say: a.say };
    if (!near(sol[0], sol[1]) && veq(p, [sol[1], sol[0]])) return { ok: false, mc: MC.reversed, say: `Those are the right numbers in the wrong order: ${nx} comes first in the pair, then ${ny}.` };
    const on1 = on(L[0]!, p), on2 = on(L[1]!, p);
    if (on1 !== on2) return { ok: false, mc: MC.oneCond, say: `${pairH(p)} fits the ${on1 ? 'first' : 'second'} equation but not the ${on1 ? 'second' : 'first'}. The solution has to make both true.` };
    if ((!isInt(sol[0]) || !isInt(sol[1])) && near(p[0], Math.round(sol[0])) && near(p[1], Math.round(sol[1]))) return { ok: false, mc: MC.approxExact, say: `Rounded numbers are only close. Keep the exact values: ${pairH(sol)}.` };
    if (near(p[0], sol[0])) return { ok: false, say: `${nx} = ${nH(sol[0])} is right. Put it back into one of the original equations to find ${ny}.` };
    if (near(p[1], sol[1])) return { ok: false, say: `${ny} = ${nH(sol[1])} is right. Put it back into one of the original equations to find ${nx}.` };
    return { ok: false, say: `Check ${pairH(p)} in both equations: it does not make them true.` };
  };
}
/** TeX of k·(v): "3(2)", "-(4)", "(-1)" */
const kv = (k: number, v: number) => (near(k, 1) ? (v < 0 ? `(${nT(v)})` : nT(v)) : near(k, -1) ? `-(${nT(v)})` : `${nT(k)}(${nT(v)})`);
/** TeX of a·x + b·y with x (or y) replaced by a value */
function plugT(L: Lin, which: 'x' | 'y', v: number): string {
  if (which === 'x') {
    const xs = near(L.a, 0) ? '' : kv(L.a, v);
    const ys = near(L.b, 0) ? '' : near(L.b, 1) ? 'y' : near(L.b, -1) ? '-y' : `${nT(L.b)}y`;
    return `${xs}${ys ? (xs ? (ys.startsWith('-') ? ` - ${ys.slice(1)}` : ` + ${ys}`) : ys) : ''} = ${nT(L.c)}`;
  }
  const xs = near(L.a, 0) ? '' : near(L.a, 1) ? 'x' : near(L.a, -1) ? '-x' : `${nT(L.a)}x`;
  const ys = near(L.b, 0) ? '' : kv(L.b, v);
  return `${xs}${ys ? (xs ? (ys.startsWith('-') ? ` - ${ys.slice(1)}` : ` + ${ys}`) : ys) : ''} = ${nT(L.c)}`;
}
/** TeX of a·x + b·y with both values put in: "2(3) + 3(-1)" */
export function subT(L: Lin, p: V): string {
  const val = (k: number, v: number) => (near(Math.abs(k), 1) ? (v < 0 || (k < 0 && near(v, 0)) ? `(${nT(v)})` : nT(v)) : `${nT(Math.abs(k))}(${nT(v)})`);   // "−(0)", never "−0"
  const parts: string[] = [];
  if (!near(L.a, 0)) parts.push(`${L.a < 0 ? '-' : ''}${val(L.a, p[0])}`);
  if (!near(L.b, 0)) parts.push(parts.length ? `${L.b < 0 ? '-' : '+'} ${val(L.b, p[1])}` : `${L.b < 0 ? '-' : ''}${val(L.b, p[1])}`);
  return parts.join(' ');
}
/** the elimination work (TeX lines) for a system: multipliers from the least common multiple, add or subtract */
export function elimWork(L1: Lin, L2: Lin, v: 'x' | 'y'): string[] {
  const s = solve(L1, L2);
  const p = v === 'y' ? L1.b : L1.a, q = v === 'y' ? L2.b : L2.a;
  const l = lcm(p, q), m1 = l / Math.abs(p), m2 = l / Math.abs(q);
  const A = scale(L1, m1), B = scale(L2, m2);
  const out: string[] = [];
  if (m1 !== 1) out.push(`\\times ${m1}:\\ ${texLin(A)}`);
  if (m2 !== 1) out.push(`\\times ${m2}:\\ ${texLin(B)}`);
  const same = Math.sign(p) === Math.sign(q);
  const C = same ? sub(A, B) : add(A, B);
  out.push(`\\text{${same ? 'subtract' : 'add'}:}\\ ${texLin(C)}`);
  if (s.kind !== 'one') return out;
  const w = v === 'y' ? 'x' : 'y', val = v === 'y' ? s.x : s.y, other = v === 'y' ? s.y : s.x;
  // the combined equation is already "x = 3" when its coefficient is 1
  if (!near(Math.abs(w === 'x' ? C.a : C.b), 1)) out.push(`${w} = ${nT(val)}`);
  out.push(`${plugT(L1, w, val)} \\Rightarrow ${v} = ${nT(other)}`);
  return out;
}
/** substitution work: y = m x + k (or x = n y + k) into L */
function subWork(iso: Lin, isoForm: 'y' | 'x', L: Lin): string[] {
  const s = solve(iso, L);
  if (s.kind !== 'one') return [];
  if (isoForm === 'y') {
    const m = slope(iso), k = yInt(iso);
    const ax = near(L.a, 0) ? '' : near(L.a, 1) ? 'x' : near(L.a, -1) ? '-x' : `${nT(L.a)}x`;
    const bpart = `${near(Math.abs(L.b), 1) ? '' : nT(Math.abs(L.b))}(${texExpr(m, k)})`;
    const line1 = `${ax}${ax ? (L.b < 0 ? ' - ' : ' + ') : L.b < 0 ? '-' : ''}${bpart} = ${nT(L.c)}`;
    const cx = L.a + L.b * m, cc = L.b * k;
    return [line1, `${texExpr(cx, cc)} = ${nT(L.c)}`, `x = ${nT(s.x)}`, `y = ${valLine(m, s.x, k)} = ${nT(s.y)}`];
  }
  const n = -iso.b / iso.a, k = iso.c / iso.a;
  const by = near(L.b, 0) ? '' : near(Math.abs(L.b), 1) ? 'y' : `${nT(Math.abs(L.b))}y`;
  const apart = `${near(L.a, 1) ? '' : near(L.a, -1) ? '-' : nT(L.a)}(${texExpr(n, k, 'y')})`;
  const line1 = `${apart}${by ? (L.b < 0 ? ' - ' : ' + ') + by : ''} = ${nT(L.c)}`;
  const cy = L.b + L.a * n, cc = L.a * k;
  return [line1, `${texExpr(cy, cc, 'y')} = ${nT(L.c)}`, `y = ${nT(s.y)}`, `x = ${valLine(n, s.y, k)} = ${nT(s.x)}`];
}
/** "2(3) - 1" : m·v + k written out */
function valLine(m: number, v: number, k: number): string {
  const head = kv(m, v);
  return near(k, 0) ? head : `${head} ${k < 0 ? '-' : '+'} ${nT(Math.abs(k))}`;
}
/** HTML of m·v + k written out */
function valH(m: number, v: number, k: number): string { return texToHtml(valLine(m, v, k)); }
/** a check of p in L, written the way L is written: "1 = 2(1) − 1" or "2(3) + 1 = 7" (HTML / TeX) */
const chkH = (L: Lin, f: Form, p: V) => (f === 'y' && !near(L.b, 0) ? `${nH(p[1])} = ${valH(slope(L), p[0], yInt(L))}` : `${subH(L, p)} = ${nH(L.c)}`);
const chkT = (L: Lin, f: Form, p: V) => (f === 'y' && !near(L.b, 0) ? `${nT(p[1])} = ${valLine(slope(L), p[0], yInt(L))}` : `${subT(L, p)} = ${nT(L.c)}`);
/** an estimate as decimals: (−2.5, 3.5) */
const decP = (p: V) => `(${p.map(v => (v < 0 ? '−' : '') + String(Math.abs(Math.round(v * 10) / 10))).join(', ')})`;
const pic = (o: Partial<SysPic> & { win: Win; eqs: string[] }): SysPic => ({ lines: [], work: [], ...o });

// =====================================================================================================================
// 1. pair-on-one-line
// =====================================================================================================================
/** a line for sub-goal 1: std or slope form through an integer point (sometimes a half), and a point on it */
function oneLine(R: () => number, half = false): { L: Lin; form: Form; p: V } {
  if (half) {
    // b = ±2, a odd: x whole, y a half
    const a = pick(R, [1, 3, 5, -1, -3]), b = pick(R, [2, -2]), x = int(R, -3, 3), y = int(R, -3, 3) + 0.5;
    return { L: lin(a, b, a * x + b * y), form: 'std', p: [x, y] };
  }
  const p: V = [int(R, -4, 4), int(R, -4, 4)];
  if (R() < 0.45) { const m = nz(R, -3, 3), k = p[1] - m * p[0]; if (Math.abs(k) <= 8) return { L: ySlope(m, k), form: 'y', p }; }
  const d = pick(R, DIRS.filter(d => d[0] && d[1]));
  return { L: dirLine(p, d[0], d[1]), form: 'std', p };
}
const onLine: Gen = (R, n) => {
  const { L, form, p } = oneLine(R, R() < 0.25);
  const cands: { p: V; mc?: string; why: string }[] = [{ p, why: '' }];
  const rev: V = [p[1], p[0]];
  if (!on(L, rev) && !veq(rev, p)) cands.push({ p: rev, mc: MC.reversed, why: 'x comes first in a pair' });
  const offs: V[] = shuffle(R, [[p[0] + 1, p[1]], [p[0], p[1] + 1], [p[0] - 1, p[1]], [p[0], p[1] - 1], [p[0] + 1, p[1] + 1], [p[0] - 2, p[1]]] as V[]);
  for (const q of offs) if (cands.length < 3 && !on(L, q) && !cands.some(c => veq(c.p, q))) cands.push({ p: q, why: '' });
  const order = shuffle(R, cands.slice());
  const lab = ['A', 'B', 'C'];
  const opts: Opt[] = order.map((c, i) => c === cands[0]
    ? { t: `${lab[i]} ${pairH(c.p)}`, ok: true, say: `Yes: ${chkH(L, form, c.p)}. It makes the equation true.` }
    : { t: `${lab[i]} ${pairH(c.p)}`, mc: c.mc, say: `${form === 'y' ? `For ${X} = ${nH(c.p[0])}, ${Y} = ${nH(yAt(L, c.p[0]))}, not ${nH(c.p[1])}` : `${subH(L, c.p)} = ${nH(lhsOf(L, c.p))}, not ${nH(L.c)}`}.${c.mc ? ' Remember: x comes first in a pair.' : ''}` });
  // keep the shuffled order (labels match the picture), so no second shuffle
  const right = order.indexOf(cands[0]!);
  const e = [texLin(L, form)];
  return {
    id: `onLine-${n}`, family: 'onLine', prompt: `Which point is a solution of <b class="a">${htmlLin(L, form)}</b>? Put each pair in and test it.`,
    board: e[0]!, input: 'choice', choices: opts.map(o => o.t),
    answer: { kind: 'choice', i: right },
    check: r => { if (r.kind !== 'choice' || !opts[r.i]) return { ok: false, say: 'Pick one.' }; const o = opts[r.i]!; return o.ok ? { ok: true, say: o.say } : { ok: false, mc: o.mc, say: o.say }; },
    solution: [`A solution is a pair (${X}, ${Y}) that makes the equation true.`, `${pairH(p)}: ${chkH(L, form, p)}. ✓`, `Every point on the line is a solution; the others are off the line.`],
    picture: { sys: pic({ win: winFor(cands.map(c => c.p)), eqs: e, lines: [{ L, col: 'first', at: 'solve' }],
      pts: order.map((c, i) => ({ p: c.p, col: 'pick', at: 'start', label: lab[i] } as PicPt)),
      work: [`${chkT(L, form, p)}\\ \\checkmark`] }) },
  };
};
const makeSolution: Gen = (R, n) => {
  const half = R() < 0.2;
  const { L, form, p } = oneLine(R, half);
  const x = p[0], y = p[1];
  const ans = y;
  const swapped = near(L.a, 0) ? NaN : (L.c - L.b * x) / L.a;   // treats the given x as y
  const noDiv = L.c - L.a * x;                                   // forgot to divide by b
  return {
    id: `makeSolution-${n}`, family: 'makeSolution',
    prompt: `<b class="a">${htmlLin(L, form)}</b> has many solutions. Make one: when ${X} = <b>${nH(x)}</b>, what is ${Y}?`,
    board: `${texLin(L, form)},\\ \\ x = ${nT(x)}`, input: 'num', unit: '',
    answer: { kind: 'num', v: ans },
    check: r => {
      if (r.kind !== 'num' || !Number.isFinite(r.v)) return { ok: false, say: 'Type a number.' };
      if (near(r.v, ans)) return { ok: true, say: `Yes: ${pairH(p)} is a solution. ${subH(L, p)} = ${nH(L.c)}.` };
      if (Number.isFinite(swapped) && near(r.v, swapped) && !near(swapped, ans)) return { ok: false, mc: MC.reversed, say: `That puts ${nH(x)} in for ${Y}. The given number is ${X}, the first coordinate.` };
      if (form === 'std' && !near(L.b, 1) && near(r.v, noDiv)) return { ok: false, say: `${kH(L.b, Y)} = ${nH(noDiv)}. One more step: divide by ${nH(L.b)}.` };
      return { ok: false, say: `Put ${X} = ${nH(x)} into the equation, then solve for ${Y}.` };
    },
    solution: form === 'y'
      ? [`${Y} = ${valH(slope(L), x, yInt(L))} = ${nH(y)}.`, `So ${pairH(p)} is a solution. Pick any other ${X} to make another.`]
      : [`Put ${X} = ${nH(x)} in: ${plugT(L, 'x', x).replace(/-/g, '−')}.`, `Solve: ${Y} = ${nH(y)}. So ${pairH(p)} is a solution.`],
    picture: { sys: pic({ win: winFor([p]), eqs: [texLin(L, form)], lines: [{ L, col: 'first', at: 'solve' }],
      guides: [{ x, col: 'pick', at: 'start' }], pts: [{ p, col: 'link', at: 'solve', label: pairP(p) }],
      work: [`${plugT(L, 'x', x)}`, `y = ${nT(y)}`] }) },
  };
};
const howMany: Gen = (R, n) => {
  const { L, form, p } = oneLine(R);
  const w = winFor([p], 3);
  const lat = shuffle(R, lattice(L, w).filter(q => inWin(q, w, 0.6))).slice(0, 3);
  const c = choose(R, [
    { t: 'Infinitely many: every point on its line', ok: true, say: 'Yes. Pick any x and you can find the y that goes with it, so there is a solution for every point of the line.' },
    { t: 'Exactly one', mc: MC.exactlyOne, say: `One equation with two letters has many solutions: ${lat.map(pairH).join(', ')} all work.` },
    { t: `Exactly ${lat.length === 3 ? 'three' : 'two'}: the marked points`, say: 'The marked points are only some of them. Every point on the line works.' },
    { t: 'None: it has two letters', say: `${pairH(p)} works: ${subH(L, p)} = ${nH(L.c)}.` },
  ]);
  return {
    id: `howMany-${n}`, family: 'howMany', prompt: `Some solutions of <b class="a">${htmlLin(L, form)}</b> are marked. How many solutions does this one equation have?`,
    board: texLin(L, form), input: 'choice', ...c,
    solution: [`Each marked pair makes the equation true.`, `Choose any ${X}: one ${Y} goes with it. The pairs fill a whole line, so there are infinitely many.`],
    picture: { sys: pic({ win: w, eqs: [texLin(L, form)], lines: [{ L, col: 'first', at: 'solve' }], pts: lat.map(q => ({ p: q, col: 'first', at: 'start' } as PicPt)) }) },
  };
};

// =====================================================================================================================
// 2. pair-satisfies-both
// =====================================================================================================================
/** a system through sol with a lattice point on each line near it (for candidates) */
function sysWithNeighbours(R: () => number, lim = 4): { sol: V; L1: Lin; L2: Lin; q1: V; q2: V } {
  for (;;) {
    const sol: V = [int(R, -lim, lim), int(R, -lim, lim)];
    const ds = DIRS.filter(d => d[0] && d[1] && Math.abs(d[0]) <= 2 && Math.abs(d[1]) <= 3);
    const d1 = pick(R, ds), d2 = pick(R, ds);
    if (d1[0] * d2[1] === d1[1] * d2[0]) continue;
    const t1 = pick(R, [1, -1]), t2 = pick(R, [1, -1]);
    const q1: V = [sol[0] + t1 * d1[0], sol[1] + t1 * d1[1]], q2: V = [sol[0] + t2 * d2[0], sol[1] + t2 * d2[1]];
    if ([q1, q2].some(q => Math.abs(q[0]) > 5 || Math.abs(q[1]) > 5)) continue;
    return { sol, L1: dirLine(sol, d1[0], d1[1]), L2: dirLine(sol, d2[0], d2[1]), q1, q2 };
  }
}
const pickPair: Gen = (R, n) => {
  const { sol, L1, L2, q1, q2 } = sysWithNeighbours(R);
  const cands: { p: V; ok?: boolean; mc?: string; say: string }[] = [
    { p: sol, ok: true, say: `Yes: ${subH(L1, sol)} = ${nH(L1.c)} and ${subH(L2, sol)} = ${nH(L2.c)}. Both true.` },
    { p: q1, mc: MC.oneCond, say: `${pairH(q1)} makes the first equation true, but ${subH(L2, q1)} = ${nH(lhsOf(L2, q1))}, not ${nH(L2.c)}. It has to fit both.` },
    { p: q2, mc: MC.oneCond, say: `${pairH(q2)} makes the second equation true, but ${subH(L1, q2)} = ${nH(lhsOf(L1, q2))}, not ${nH(L1.c)}. It has to fit both.` },
  ];
  const nei: V = [sol[0] + pick(R, [2, -2]), sol[1] + pick(R, [1, -1])];
  if (!on(L1, nei) && !on(L2, nei) && Math.abs(nei[0]) <= 6 && Math.abs(nei[1]) <= 6 && !cands.some(c => veq(c.p, nei)))
    cands.push({ p: nei, say: `${pairH(nei)} fits neither equation: ${subH(L1, nei)} = ${nH(lhsOf(L1, nei))}.` });
  const order = shuffle(R, cands.slice()), lab = ['A', 'B', 'C', 'D'];
  const opts = order.map((c, i) => ({ ...c, t: `${lab[i]} ${pairH(c.p)}` }));
  const e = eqT(L1, L2);
  return {
    id: `pickPair-${n}`, family: 'pickPair', prompt: `Which point solves the system ${sysH(L1, L2)}?`,
    board: board2(e), input: 'choice', choices: opts.map(o => o.t), answer: { kind: 'choice', i: opts.findIndex(o => o.ok) },
    check: r => { const o = r.kind === 'choice' ? opts[r.i] : undefined; if (!o) return { ok: false, say: 'Pick one.' }; return o.ok ? { ok: true, say: o.say } : { ok: false, mc: o.mc, say: o.say }; },
    solution: [`Test each pair in BOTH equations.`, `${pairH(sol)}: ${subH(L1, sol)} = ${nH(L1.c)} ✓ and ${subH(L2, sol)} = ${nH(L2.c)} ✓.`, `A pair that fits only one equation lies on only one line.`],
    picture: { sys: pic({ win: winFor(order.map(c => c.p)), eqs: e, lines: [{ L: L1, col: 'first', at: 'solve' }, { L: L2, col: 'second', at: 'solve' }],
      pts: order.map((c, i) => ({ p: c.p, col: 'pick', at: 'start', label: lab[i] } as PicPt)), cross: sol,
      work: [`${pairT(sol)}\\ \\text{fits both}\\ \\checkmark`] }) },
  };
};
const checkWork: Gen = (R, n) => {
  for (;;) {
    const { sol, L1, L2, q1 } = sysWithNeighbours(R);
    if (near(L2.b, 0)) continue;
    const y2 = yAt(L2, q1[0]);
    if (near(y2, q1[1]) || !isInt(y2) || Math.abs(y2) > 12) continue;
    const name = pick(R, ['Lee', 'Ava', 'Noah', 'Mia', 'Eli', 'Zoe']);
    const fake: V = [q1[0], y2];
    const c = choose(R, [
      { t: `Not a solution: ${subH(L2, q1)} = ${nH(lhsOf(L2, q1))}, not ${nH(L2.c)}`, ok: true, say: `Right. It fits the first equation only, so it is not on the second line.` },
      { t: `A solution: ${subH(L1, q1)} = ${nH(L1.c)} and ${subH(L2, fake)} = ${nH(L2.c)}`, mc: MC.diffValues, say: `That check uses ${Y} = ${nH(q1[1])} in one equation and ${Y} = ${nH(y2)} in the other. One pair means one ${Y} for both.` },
      { t: `A solution: it makes ${htmlLin(L1)} true`, mc: MC.oneCond, say: `One equation is not enough. The solution of a system makes BOTH equations true.` },
    ]);
    const e = eqT(L1, L2);
    return {
      id: `checkWork-${n}`, family: 'checkWork', prompt: `${name} checks whether <b>${pairH(q1)}</b> solves the system ${sysH(L1, L2)}. Which check is right?`,
      board: board2(e), input: 'choice', ...c,
      solution: [`Use ${X} = ${nH(q1[0])} and ${Y} = ${nH(q1[1])} in BOTH equations.`, `First: ${subH(L1, q1)} = ${nH(L1.c)} ✓. Second: ${subH(L2, q1)} = ${nH(lhsOf(L2, q1))} ✗.`, `So ${pairH(q1)} is on the first line only. The solution is ${pairH(sol)}.`],
      picture: { sys: pic({ win: winFor([sol, q1]), eqs: e, lines: [{ L: L1, col: 'first', at: 'solve' }, { L: L2, col: 'second', at: 'solve' }],
        pts: [{ p: q1, col: 'pick', at: 'start', label: pairP(q1) }], cross: sol }) },
    };
  }
};

// =====================================================================================================================
// 3. intersection-as-solution
// =====================================================================================================================
/** a system whose lines have whole-number intercepts on the axes (for intercept distractors) */
function sysGraph(R: () => number, axis: boolean): { sol: V; L1: Lin; L2: Lin; f1: Form; f2: Form } {
  for (;;) {
    const sol: V = [nz(R, -4, 4), nz(R, -4, 4)];
    const m1 = nz(R, -3, 3), k1 = sol[1] - m1 * sol[0];
    if (Math.abs(k1) > 7) continue;
    const L1 = ySlope(m1, k1);
    let L2: Lin, f2: Form = 'y';
    if (axis && R() < 0.5) { L2 = R() < 0.5 ? lin(0, 1, sol[1]) : lin(1, 0, sol[0]); f2 = near(L2.b, 0) ? 'std' : 'y'; }
    else { const m2 = nz(R, -3, 3); if (m2 === m1) continue; const k2 = sol[1] - m2 * sol[0]; if (Math.abs(k2) > 7) continue; L2 = ySlope(m2, k2); }
    return { sol, L1, L2, f1: 'y', f2 };
  }
}
const readCross: Gen = (R, n) => {
  const { sol, L1, L2, f1, f2 } = sysGraph(R, true);
  const ints: V[] = [];
  for (const L of [L1, L2]) { if (!near(L.b, 0)) ints.push([0, yInt(L)]); if (!near(L.a, 0)) ints.push([L.c / L.a, 0]); }
  const alts = ints.filter(p => !veq(p, sol) && !(on(L1, p) && on(L2, p))).map(p => ({ p, mc: MC.intercept, say: `${pairH(p)} is where one line meets an axis. The solution is where the two lines meet each other.` }));
  const e = eqT(L1, L2, f1, f2);
  return {
    id: `readCross-${n}`, family: 'readCross', prompt: `The graph shows both lines of the system ${sysH(L1, L2, f1, f2)}. What is the solution?`,
    board: board2(e), input: 'pair', ...PAIR, answer: { kind: 'pair', x: sol[0], y: sol[1] },
    check: pairCheck(sol, [L1, L2], { alts }),
    solution: [`The lines cross at ${pairH(sol)}: that point is on both lines.`, `Check: ${chkH(L1, f1, sol)} and ${chkH(L2, f2, sol)}.`],
    picture: { sys: pic({ win: winFor([sol, ...ints]), eqs: e, lines: [{ L: L1, col: 'first', at: 'start' }, { L: L2, col: 'second', at: 'start' }], cross: sol,
      work: [`${pairT(sol)}\\ \\text{is on both lines}`] }) },
  };
};
const pointPick: Gen = (R, n) => {
  for (;;) {
    const { sol, L1, L2, f1, f2 } = sysGraph(R, false);
    const icpt: V = R() < 0.5 ? [0, yInt(L1)] : [0, yInt(L2)];
    const rev: V = [sol[1], sol[0]];
    const xint: V | null = isInt(L1.c / L1.a) ? [L1.c / L1.a, 0] : null;
    const pts: { p: V; ok?: boolean; mc?: string; say: string }[] = [{ p: sol, ok: true, say: 'Yes: it is on both lines, so it makes both equations true.' }];
    if (!veq(icpt, sol)) pts.push({ p: icpt, mc: MC.intercept, say: 'That point is where one line meets the y-axis. It is on one line only.' });
    if (!veq(rev, sol) && !on(L1, rev) && !on(L2, rev) && !pts.some(q => veq(q.p, rev))) pts.push({ p: rev, mc: MC.reversed, say: `That point has the coordinates of the crossing in the wrong order.` });
    if (pts.length < 3 && xint && !pts.some(q => veq(q.p, xint))) pts.push({ p: xint, mc: MC.intercept, say: 'That point is where one line meets the x-axis. It is on one line only.' });
    if (pts.length < 3) continue;
    const order = shuffle(R, pts.slice(0, 3)), lab = ['A', 'B', 'C'];
    const opts = order.map((c, i) => ({ ...c, t: `Point ${lab[i]}` }));
    const e = eqT(L1, L2, f1, f2);
    return {
      id: `pointPick-${n}`, family: 'pointPick', prompt: `Three points are marked. Which one is the solution of the system ${sysH(L1, L2, f1, f2)}?`,
      board: board2(e), input: 'choice', choices: opts.map(o => o.t), answer: { kind: 'choice', i: opts.findIndex(o => o.ok) },
      check: r => { const o = r.kind === 'choice' ? opts[r.i] : undefined; if (!o) return { ok: false, say: 'Pick one.' }; return o.ok ? { ok: true, say: o.say } : { ok: false, mc: o.mc, say: o.say }; },
      solution: [`The solution is the point on BOTH lines: where they cross, ${pairH(sol)}.`, `A point where a line meets an axis is on that line only.`],
      picture: { sys: pic({ win: winFor(order.map(o => o.p)), eqs: e, lines: [{ L: L1, col: 'first', at: 'start' }, { L: L2, col: 'second', at: 'start' }],
        pts: order.map((c, i) => ({ p: c.p, col: 'pick', at: 'start', label: lab[i] } as PicPt)), cross: sol }) },
    };
  }
};

// =====================================================================================================================
// 4-5. no-solution-parallel, infinite-coincident (and 14-15 by inspection)
// =====================================================================================================================
type Kind3 = 'one' | 'none' | 'inf';
/** a system of the given kind; `scaled` writes the second line as a multiple (to be seen by scaling) */
function sysKind(R: () => number, kind: Kind3, scaled: boolean): { L1: Lin; L2: Lin; f1: Form; f2: Form; e: string[]; h: string; sol: V | null } {
  const m = nz(R, -3, 3), k1 = int(R, -4, 4);
  const L1 = ySlope(m, k1);
  const std = R() < 0.5;
  let L2: Lin;
  if (kind === 'one') { let m2 = nz(R, -3, 3); if (m2 === m) m2 = -m || 1; const sx = int(R, -3, 3), sy = m * sx + k1; L2 = ySlope(m2, sy - m2 * sx); }
  else if (kind === 'none') { let k2 = int(R, -5, 5); if (k2 === k1) k2 = k1 + pick(R, [2, -3]); L2 = ySlope(m, k2); }
  else L2 = L1;
  const f = scaled || kind === 'inf' ? pick(R, [2, 3, -2, -1]) : 1;
  // standard form with a positive x coefficient: y = 2x + 3 -> 2x - y = -3
  const toStd = (L: Lin) => (L.a < 0 ? scale(L, -1) : L);
  const S1 = std ? toStd(L1) : L1, S2 = scale(std ? toStd(L2) : L2, f);
  const f1: Form = std ? 'std' : 'y';
  let f2: Form, e2: string, h2: string;
  if (!std && f !== 1) {
    // a multiple of y = mx + b, written the way kids meet it: 2y = 4x + 6
    f2 = 'std';
    e2 = `${f === -1 ? '-' : nT(f)}y = ${texExpr(f * slope(L2), f * yInt(L2))}`;
    h2 = `${f === -1 ? '−' : nH(f)}${Y} = ${htmlExpr(f * slope(L2), f * yInt(L2))}`;
  } else { f2 = std ? 'std' : 'y'; e2 = texLin(S2, f2); h2 = htmlLin(S2, f2); }
  const sl = solve(S1, S2);
  return { L1: S1, L2: S2, f1, f2, e: [texLin(S1, f1), e2], h: `<b class="a">${htmlLin(S1, f1)}</b> and <b class="b">${h2}</b>`, sol: sl.kind === 'one' ? [sl.x, sl.y] : null };
}
const parallelGraph: Gen = (R, n) => {
  const kind: Kind3 = R() < 0.7 ? 'none' : 'one';
  const s = sysKind(R, kind, false);
  const opts: Opt[] = kind === 'none' ? [
    { t: 'No solution: the lines never meet', ok: true, say: 'Yes. Same slope, different starting points: the gap between them never closes.' },
    { t: 'Exactly one solution', mc: MC.exactlyOne, say: 'Look at the lines: they have the same slope, so they never cross. Not every system has a solution.' },
    { t: 'One solution, far off the graph', mc: MC.offscreen, say: 'Parallel lines stay the same distance apart forever, on and off the graph. They never meet.' },
    { t: 'Infinitely many solutions', say: 'That would need one line on top of the other. These lines are apart.' },
  ] : [
    { t: 'Exactly one solution', ok: true, say: `Yes. The slopes are different, so the lines cross once, at ${pairH(s.sol!)}.` },
    { t: 'No solution: the lines never meet', say: 'Different slopes always cross. Find the crossing.' },
    { t: 'One solution, far off the graph', say: 'This crossing is right on the graph.' },
    { t: 'Infinitely many solutions', say: 'Two different lines cross once at most.' },
  ];
  const c = choose(R, opts);
  const w = s.sol ? winFor([s.sol, [0, yInt(s.L1)], [0, yInt(s.L2)]], 2) : winFor([[0, yInt(s.L1)], [0, yInt(s.L2)]], 3);
  return {
    id: `parallelGraph-${n}`, family: 'parallelGraph', prompt: `The graph shows the system ${s.h}. How many solutions does it have?`,
    board: board2(s.e), input: 'choice', ...c,
    solution: kind === 'none' ? [`Both lines have slope ${nH(slope(s.L1))} and different ${Y}-intercepts: they are parallel.`, `Parallel lines never meet, so no pair is on both: no solution.`]
      : [`The slopes are ${nH(slope(s.L1))} and ${nH(slope(s.L2))}: different, so the lines cross once.`, `The one solution is ${pairH(s.sol!)}.`],
    picture: { sys: pic({ win: w, eqs: s.e, lines: [{ L: s.L1, col: 'first', at: 'start' }, { L: s.L2, col: 'second', at: 'start' }], cross: s.sol,
      gaps: kind === 'none' ? [w.x0 + 1.5, (w.x0 + w.x1) / 2, w.x1 - 1.5] : undefined }) },
  };
};
const howManySys: Gen = (R, n, sg) => {
  const kind: Kind3 = sg === 'no-solution-parallel' || sg === 'contradiction-no-solution' ? (R() < 0.6 ? 'none' : pick(R, ['one', 'inf'] as Kind3[])) : pick(R, ['one', 'none', 'inf'] as Kind3[]);
  const s = sysKind(R, kind, sg === 'contradiction-no-solution' && R() < 0.6);
  const c = choose(R, [
    { t: 'No solution', ok: kind === 'none', mc: kind === 'inf' ? MC.uniqueEq : undefined, say: kind === 'none' ? 'Yes: same slope, different intercepts. The lines are parallel.' : kind === 'inf' ? 'Multiply out: the two equations say the same thing. They draw the same line.' : 'The slopes are different, so the lines cross once.' },
    { t: 'Exactly one solution', ok: kind === 'one', mc: kind === 'none' ? MC.exactlyOne : kind === 'inf' ? MC.uniqueEq : undefined, say: kind === 'one' ? `Yes: different slopes cross once, at ${pairH(s.sol!)}.` : kind === 'none' ? 'Compare the slopes: they are equal and the intercepts differ. Parallel lines never meet.' : 'Different-looking equations can draw the same line. Then every point of it is a solution.' },
    { t: 'Infinitely many solutions', ok: kind === 'inf', say: kind === 'inf' ? 'Yes: one equation is a multiple of the other, so they draw the same line.' : kind === 'none' ? 'Same slope but different intercepts: two separate lines, no shared point.' : 'Two different lines with different slopes share just one point.' },
  ]);
  const w = s.sol ? winFor([s.sol, [0, yInt(s.L1)]], 2) : winFor([[0, yInt(s.L1)], [0, yInt(s.L2)]], 3);
  return {
    id: `howManySys-${n}`, family: 'howManySys', prompt: `Without solving all the way: how many solutions does the system ${s.h} have?`,
    board: board2(s.e), input: 'choice', ...c,
    solution: [`Write both in the form ${Y} = m${X} + b: slopes ${nH(slope(s.L1))} and ${nH(slope(s.L2))}, intercepts ${nH(yInt(s.L1))} and ${nH(yInt(s.L2))}.`,
      kind === 'one' ? 'Different slopes: the lines cross once.' : kind === 'none' ? 'Same slope, different intercepts: parallel, no solution.' : 'Same slope and same intercept: the same line, infinitely many solutions.'],
    picture: { sys: pic({ win: w, eqs: s.e, lines: [{ L: s.L1, col: 'first', at: 'solve' }, { L: s.L2, col: 'second', at: 'solve', dashed: kind === 'inf' }], cross: s.sol }) },
  };
};
const sameLine: Gen = (R, n) => {
  const s = sysKind(R, 'inf', true);
  const w = winFor([[0, yInt(s.L1)]], 3);
  const c = choose(R, [
    { t: `Infinitely many: every point on the line ${htmlLin(s.L1, s.f1)}`, ok: true, say: 'Yes. Both equations draw the same line, so every point on that line solves both.' },
    { t: 'Infinitely many: every point (x, y) of the plane', mc: MC.everyPoint, say: `Only the points ON the line. (0, ${nH(yInt(s.L1) + 1)}) is off it and solves neither equation.` },
    { t: 'No solution: the equations are different', mc: MC.uniqueEq, say: `Divide the second equation by ${nH(s.L2.b / s.L1.b)}: it becomes the first. Same line.` },
    { t: 'Exactly one solution', mc: MC.exactlyOne, say: 'The lines lie on top of each other: they share every point, not one.' },
  ]);
  return {
    id: `sameLine-${n}`, family: 'sameLine', prompt: `How many solutions does the system ${s.h} have?`,
    board: board2(s.e), input: 'choice', ...c,
    solution: [`The second equation is the first one multiplied by ${nH(s.L2.b / s.L1.b)}.`, `So both draw the same line: every point on it is a solution, and no point off it is.`],
    picture: { sys: pic({ win: w, eqs: s.e, lines: [{ L: s.L1, col: 'first', at: 'solve' }, { L: s.L2, col: 'second', at: 'solve', dashed: true }] }) },
  };
};
const solOrNot: Gen = (R, n) => {
  for (;;) {
    const s = sysKind(R, 'inf', true);
    const w = winFor([[0, yInt(s.L1)]], 3);
    const lat = shuffle(R, lattice(s.L1, w).filter(q => inWin(q, w, 1)));
    if (!lat.length) continue;
    const good = lat[0]!;
    const offs = shuffle(R, [[good[0], good[1] + 1], [good[0] + 1, good[1]], [good[0] - 1, good[1] + 2], [0, 0], [good[1], good[0]]] as V[]).filter(q => !on(s.L1, q));
    if (offs.length < 2 || veq(offs[0]!, offs[1]!)) continue;
    const order = shuffle(R, [good, offs[0]!, offs[1]!]), lab = ['A', 'B', 'C'];
    const ww = winFor([[0, yInt(s.L1)], ...order], 1);
    if (ww.x1 - ww.x0 > 14 || ww.y1 - ww.y0 > 14 || !clip(s.L1, ww)) continue;
    const opts = order.map((p, i) => p === good
      ? { t: `${lab[i]} ${pairH(p)}`, ok: true, mc: undefined as string | undefined, say: `Yes: ${subH(s.L1, p)} = ${nH(s.L1.c)}. It is on the line, so it fits both.` }
      : { t: `${lab[i]} ${pairH(p)}`, ok: false, mc: MC.everyPoint as string | undefined, say: `"Infinitely many" means every point of the line, not every point. ${subH(s.L1, p)} = ${nH(lhsOf(s.L1, p))}, not ${nH(s.L1.c)}.` });
    return {
      id: `solOrNot-${n}`, family: 'solOrNot', prompt: `The system ${s.h} has infinitely many solutions. Which marked point is one of them?`,
      board: board2(s.e), input: 'choice', choices: opts.map(o => o.t), answer: { kind: 'choice', i: opts.findIndex(o => o.ok) },
      check: r => { const o = r.kind === 'choice' ? opts[r.i] : undefined; if (!o) return { ok: false, say: 'Pick one.' }; return o.ok ? { ok: true, say: o.say } : { ok: false, mc: o.mc, say: o.say }; },
      solution: [`Both equations draw the same line, so a solution has to be ON that line.`, `${pairH(good)}: ${subH(s.L1, good)} = ${nH(s.L1.c)} ✓. The other points are off the line.`],
      picture: { sys: pic({ win: ww, eqs: s.e, lines: [{ L: s.L1, col: 'first', at: 'solve' }, { L: s.L2, col: 'second', at: 'solve', dashed: true }], pts: order.map((p, i) => ({ p, col: 'pick', at: 'start', label: lab[i] } as PicPt)) }) },
    };
  }
};

// =====================================================================================================================
// 6-8. substitution
// =====================================================================================================================
/** a substitution system: y = m x + k (or x = n y + k) and a x + b y = c with |b| (or |a|) >= 2 */
function subSys(R: () => number, o: { half?: boolean; isoX?: boolean } = {}): { sol: V; iso: Lin; isoForm: 'y' | 'x'; L: Lin } {
  for (;;) {
    const sol: V = o.half ? [int(R, -3, 3) + 0.5, int(R, -4, 4)] : [int(R, -5, 5), int(R, -5, 5)];
    if (o.isoX && !o.half) {
      const nn = nz(R, -3, 3), k = sol[0] - nn * sol[1];
      if (Math.abs(k) > 9 || k === 0) continue;
      const a = pick(R, [2, 3, 4, 5, -2, -3]), b = nz(R, -5, 5);
      const iso = lin(1, -nn, k), L = lin(a, b, a * sol[0] + b * sol[1]);
      if (Math.abs(L.c) > 40 || solve(iso, L).kind !== 'one') continue;
      return { sol, iso, isoForm: 'x', L };
    }
    const m = o.half ? pick(R, [2, -2, 4]) : nz(R, -4, 4), k = sol[1] - m * sol[0];
    if (!isInt(k) || Math.abs(k) > 9 || k === 0) continue;
    const a = o.half ? pick(R, [2, 4, -2]) : nz(R, -5, 5), b = pick(R, [2, 3, 4, 5, -2, -3, -4]);
    const L = lin(a, b, a * sol[0] + b * sol[1]);
    if (!isInt(L.c) || Math.abs(L.c) > 45 || solve(ySlope(m, k), L).kind !== 'one') continue;
    return { sol, iso: ySlope(m, k), isoForm: 'y', L };
  }
}
const isoH = (iso: Lin, f: 'y' | 'x') => htmlLin(iso, f);
const subChoice: Gen = (R, n) => {
  for (;;) {
    const isoX = R() < 0.35;
    const { sol, iso, isoForm, L } = subSys(R, { isoX });
    const v = isoForm === 'y' ? Y : X, w = isoForm === 'y' ? X : Y;
    const m = isoForm === 'y' ? slope(iso) : -iso.b / iso.a, k = isoForm === 'y' ? yInt(iso) : iso.c / iso.a;
    const kIso = isoForm === 'y' ? L.b : L.a, kOther = isoForm === 'y' ? L.a : L.b;
    if (Math.abs(kIso) < 2) continue;
    const wv = isoForm === 'y' ? 'x' : 'y';
    const otherTerm = (lead: boolean) => { const s = near(Math.abs(kOther), 1) ? '' : nH(Math.abs(kOther)); return lead ? `${kOther < 0 ? '−' : ''}${s}${w}` : ` ${kOther < 0 ? '−' : '+'} ${s}${w}`; };
    const isoTerm = (inner: string, first: boolean) => `${first ? (kIso < 0 ? '−' : '') : kIso < 0 ? ' − ' : ' + '}${nH(Math.abs(kIso))}${inner}`;
    const build = (inner: string) => isoForm === 'y' ? `${otherTerm(true)}${isoTerm(inner, false)} = ${nH(L.c)}` : `${isoTerm(inner, true)}${otherTerm(false)} = ${nH(L.c)}`;
    const expr = htmlExpr(m, k, wv), mTerm = htmlExpr(m, 0, wv);
    const right = build(`(${expr})`), noPar = build(` · ${expr}`), firstOnly = build(`(${mTerm})`);
    const c = choose(R, [
      { t: right, ok: true, say: `Yes: ${v} is replaced by the whole expression ${expr}, in parentheses, because ${nH(Math.abs(kIso))} multiplies all of it.` },
      { t: noPar, mc: MC.grouping, say: `Without parentheses the ${nH(Math.abs(kIso))} only multiplies the first term. ${v} is the whole ${expr}, so it goes in parentheses.` },
      { t: firstOnly, mc: MC.firstTerm, say: `${v} equals all of ${expr}, not just ${mTerm}. Put the whole expression in.` },
    ]);
    const e = [texLin(iso, isoForm), texLin(L)];
    return {
      id: `subChoice-${n}`, family: 'subChoice', prompt: `In the system <b class="a">${isoH(iso, isoForm)}</b> and <b class="b">${htmlLin(L)}</b>, put the first equation into the second. Which equation do you get?`,
      board: board2(e), input: 'choice', ...c,
      solution: [`${v} = ${expr}, so wherever ${v} stands in the second equation, write (${expr}).`, `${right}. Now only ${w} is left.`],
      picture: { sys: pic({ win: winFor([sol]), eqs: e, lines: [{ L: iso, col: 'first', at: 'start' }, { L, col: 'second', at: 'start' }], cross: sol, work: subWork(iso, isoForm, L).slice(0, 1) }) },
    };
  }
};
const setEqual: Gen = (R, n) => {
  for (;;) {
    const sol: V = [int(R, -4, 4), int(R, -4, 4)];
    const m1 = nz(R, -4, 4), m2 = nz(R, -4, 4);
    if (m1 === m2) continue;
    const k1 = sol[1] - m1 * sol[0], k2 = sol[1] - m2 * sol[0];
    if (k1 === 0 || k2 === 0 || Math.abs(k1) > 9 || Math.abs(k2) > 9) continue;
    if (sol[1] === 0) continue;   // crossing on the x-axis: the sign-flipped equation would have the same solution
    const L1 = ySlope(m1, k1), L2 = ySlope(m2, k2);
    const right = `${htmlExpr(m1, k1)} = ${htmlExpr(m2, k2)}`;
    const firstOnly = `${htmlExpr(m1, k1)} = ${htmlExpr(m2, 0)}`;
    const flip = `${htmlExpr(m1, k1)} = ${htmlExpr(-m2, -k2)}`;
    const c = choose(R, [
      { t: right, ok: true, say: `Yes: both expressions equal the same ${Y}, so they equal each other.` },
      { t: firstOnly, mc: MC.firstTerm, say: `${Y} equals all of ${htmlExpr(m2, k2)}. Keep the ${nH(k2)} too.` },
      { t: flip, say: `Both expressions are equal to ${Y}, with their own signs. Nothing changes sign when you set them equal.` },
    ]);
    const e = eqT(L1, L2, 'y', 'y');
    return {
      id: `setEqual-${n}`, family: 'setEqual', prompt: `Both equations say what ${Y} is: ${sysH(L1, L2, 'y', 'y')}. Which one-letter equation do you get?`,
      board: board2(e), input: 'choice', ...c,
      solution: [`The same ${Y} is in both equations, so ${right}.`, `Solve it: ${X} = ${nH(sol[0])}, then ${Y} = ${nH(sol[1])}. The lines cross at ${pairH(sol)}.`],
      picture: { sys: pic({ win: winFor([sol, [0, k1], [0, k2]], 1), eqs: e, lines: [{ L: L1, col: 'first', at: 'start' }, { L: L2, col: 'second', at: 'start' }], cross: sol,
        work: [`${texExpr(m1, k1)} = ${texExpr(m2, k2)}`, `x = ${nT(sol[0])},\\ y = ${nT(sol[1])}`] }) },
    };
  }
};
/** a system where neither equation is solved yet but one letter has coefficient 1 */
function isoReady(R: () => number): { sol: V; L1: Lin; L2: Lin; which: 0 | 1; v: 'x' | 'y' } {
  for (;;) {
    const sol: V = [int(R, -5, 5), int(R, -5, 5)];
    const which = pick(R, [0, 1] as const), v = pick(R, ['x', 'y'] as const);
    const one = v === 'x' ? lin(1, nz(R, -4, 4), 0) : lin(nz(R, -4, 4), 1, 0);
    const other = lin(pick(R, [2, 3, 4, 5, -2, -3]), pick(R, [2, 3, 5, -2, -3, -4]), 0);
    const A = { ...one, c: one.a * sol[0] + one.b * sol[1] }, B = { ...other, c: other.a * sol[0] + other.b * sol[1] };
    if (Math.abs(A.c) > 30 || Math.abs(B.c) > 40 || solve(A, B).kind !== 'one') continue;
    return which === 0 ? { sol, L1: A, L2: B, which, v } : { sol, L1: B, L2: A, which, v };
  }
}
const subSolve: Gen = (R, n, sg) => {
  let sol: V, L1: Lin, L2: Lin, f1: Form = 'std', work: string[];
  if (sg === 'isolate-then-substitute' || (sg === 'choose-method' && R() < 0.5)) {
    const s = isoReady(R);
    ({ sol, L1, L2 } = s);
    const Lone = s.which === 0 ? L1 : L2, Loth = s.which === 0 ? L2 : L1;
    work = [`${s.v} = ${s.v === 'y' ? texExpr(-Lone.a, Lone.c) : texExpr(-Lone.b, Lone.c, 'y')}`, ...subWork(Lone, s.v, Loth)];
  } else {
    const s = subSys(R, { half: R() < 0.15, isoX: R() < 0.3 });
    sol = s.sol; L1 = s.iso; L2 = s.L; f1 = s.isoForm;
    work = subWork(s.iso, s.isoForm, s.L);
  }
  const e = eqT(L1, L2, f1);
  return {
    id: `subSolve-${n}`, family: 'subSolve', prompt: `Solve the system ${sysH(L1, L2, f1)} by substitution. Give the pair.`,
    board: board2(e), input: 'pair', ...PAIR, answer: { kind: 'pair', x: sol[0], y: sol[1] },
    check: pairCheck(sol, [L1, L2]),
    solution: [...work.map(texToHtml), `So the solution is ${pairH(sol)}. Check it in both original equations.`],
    picture: { sys: pic({ win: winFor([sol]), eqs: e, lines: [{ L: L1, col: 'first', at: 'start' }, { L: L2, col: 'second', at: 'solve' }], cross: sol, work: [...work, `(x, y) = ${pairT(sol)}`] }) },
  };
};
/** a TeX work line shown in the HTML panel (letters in italics, a real minus, fractions) */
export function texToHtml(s: string): string {
  // protect \text{…} words, turn commands into symbols, italicise the single letters, then build fractions
  const words: string[] = [], fracs: [string, string][] = [];
  let t = s.replace(/\\text\{([^}]*)\}/g, (_, w: string) => `@${words.push(w) - 1}@`)
    .replace(/\\tfrac\{([^}]*)\}\{([^}]*)\}/g, (_, a: string, b: string) => `#${fracs.push([a, b]) - 1}#`)
    .replace(/\\times/g, '×').replace(/\\Rightarrow/g, '→').replace(/\\checkmark/g, '✓').replace(/\\neq/g, '≠')
    .replace(/\\qquad|\\quad/g, ' ').replace(/\\[,;: ]/g, ' ').replace(/\\cdot/g, '·');
  const ital = (u: string) => u.replace(/(?<![a-z])([a-z])(?![a-z])/g, '<i>$1</i>');
  t = ital(t).replace(/#(\d+)#/g, (_, i: string) => fr(ital(fracs[+i]![0]), ital(fracs[+i]![1]))).replace(/@(\d+)@/g, (_, i: string) => words[+i]!);
  return t.replace(/(^|[\s(=])-/g, '$1−');
}
const reportPair: Gen = (R, n) => {
  const { sol, iso, isoForm, L } = subSys(R, { isoX: R() < 0.3 });
  const first = isoForm === 'y' ? 'x' : 'y', fv = isoForm === 'y' ? sol[0] : sol[1];
  const rev: V = [sol[1], sol[0]];
  const opts: Opt[] = [
    { t: pairH(sol), ok: true, say: `Yes: the answer is a pair, ${X} first: ${pairH(sol)}.` },
    { t: `${first === 'x' ? X : Y} = ${nH(fv)}`, mc: MC.stops, say: `That is half the answer. Put ${first} = ${nH(fv)} back in to find the other letter, then give the pair.` },
    { t: `${nH(sol[0])} and ${nH(sol[1])}`, mc: MC.unpaired, say: `Two loose numbers do not say which is ${X} and which is ${Y}. Write the ordered pair (${X}, ${Y}).` },
  ];
  if (!near(sol[0], sol[1])) opts.push({ t: pairH(rev), mc: MC.reversed, say: `In (${X}, ${Y}) the ${X} comes first: ${pairH(sol)}.` });
  const c = choose(R, opts);
  const e = [texLin(iso, isoForm), texLin(L)];
  return {
    id: `reportPair-${n}`, family: 'reportPair', prompt: `Solving <b class="a">${isoH(iso, isoForm)}</b> and <b class="b">${htmlLin(L)}</b> gives ${first === 'x' ? X : Y} = ${nH(fv)}. What is the solution of the system?`,
    board: board2(e), input: 'choice', ...c,
    solution: [`Put ${first} = ${nH(fv)} into ${isoH(iso, isoForm)}: ${isoForm === 'y' ? `${Y} = ${valH(slope(iso), sol[0], yInt(iso))} = ${nH(sol[1])}` : `${X} = ${valH(-iso.b / iso.a, sol[1], iso.c / iso.a)} = ${nH(sol[0])}`}.`, `The solution is the pair ${pairH(sol)}.`],
    picture: { sys: pic({ win: winFor([sol]), eqs: e, lines: [{ L: iso, col: 'first', at: 'start' }, { L, col: 'second', at: 'solve' }],
      guides: [first === 'x' ? { x: sol[0], col: 'pick', at: 'start' } : { y: sol[1], col: 'pick', at: 'start' }], cross: sol }) },
  };
};
const isolate: Gen = (R, n) => {
  for (;;) {
    const v = pick(R, ['x', 'y'] as const), k = nz(R, -6, 6), c = nz(R, -12, 12);
    if (Math.abs(k) === 1) continue;
    const L = v === 'x' ? lin(1, k, c) : lin(k, 1, c);
    const w = v === 'x' ? 'y' : 'x', V_ = v === 'x' ? X : Y, W_ = w === 'x' ? X : Y;
    const right = `${V_} = ${htmlExpr(-k, c, w)}`, noSign = `${V_} = ${htmlExpr(k, c, w)}`, flip = `${V_} = ${htmlExpr(k, -c, w)}`;
    const opt = choose(R, [
      { t: right, ok: true, say: `Yes: ${k > 0 ? 'subtract' : 'add'} ${nH(Math.abs(k))}${W_} on both sides.` },
      { t: noSign, mc: MC.noSignChange, say: `To take ${nH(k)}${W_} off the left side, ${k > 0 ? 'subtract' : 'add'} ${nH(Math.abs(k))}${W_} on both sides, so its sign changes on the right.` },
      { t: flip, say: `Check with a number: the constant ${nH(c)} stays as it is on the right side.` },
    ]);
    const w0 = winFor([[0, yAt(L, 0)], [xAtSafe(L, 0), 0]], 1);
    if (!clip(L, w0) || w0.x1 - w0.x0 > 16 || w0.y1 - w0.y0 > 16) continue;
    return {
      id: `isolate-${n}`, family: 'isolate', prompt: `To get ready for substitution, solve <b class="a">${htmlLin(L)}</b> for ${V_}.`,
      board: texLin(L), input: 'choice', ...opt,
      solution: [`${htmlLin(L)}: ${k > 0 ? 'subtract' : 'add'} ${nH(Math.abs(k))}${W_} on both sides.`, `${right}. It is the same line, written another way.`],
      picture: { sys: pic({ win: w0, eqs: [texLin(L)], lines: [{ L, col: 'first', at: 'start' }], work: [`${v} = ${texExpr(-k, c, w)}`] }) },
    };
  }
};
const xAtSafe = (L: Lin, y: number) => (near(L.a, 0) ? 0 : (L.c - L.b * y) / L.a);
const whichVar: Gen = (R, n) => {
  const s = isoReady(R);
  const Lone = s.which === 0 ? s.L1 : s.L2, Loth = s.which === 0 ? s.L2 : s.L1;
  const ord = s.which === 0 ? 'first' : 'second', oth = s.which === 0 ? 'second' : 'first';
  const ov = s.v === 'x' ? 'y' : 'x';
  const solved = s.v === 'x' ? htmlExpr(-Lone.b, Lone.c, 'y') : htmlExpr(-Lone.a, Lone.c);
  const c = choose(R, [
    { t: `Solve the ${ord} equation for ${s.v === 'x' ? X : Y}`, ok: true, say: `Yes: its ${s.v} has coefficient 1, so no fractions appear.` },
    { t: `Solve the ${oth} equation for ${ov === 'x' ? X : Y}`, say: `That works, but dividing by ${nH(ov === 'x' ? Loth.a : Loth.b)} makes fractions. A letter with coefficient 1 is easier.` },
    { t: 'You can’t substitute: no letter is alone yet', mc: MC.needsSolved, say: `You can get a letter alone first. ${htmlLin(Lone)} becomes ${s.v === 'x' ? X : Y} = ${solved}.` },
  ]);
  const e = eqT(s.L1, s.L2);
  return {
    id: `whichVar-${n}`, family: 'whichVar', prompt: `You want to solve ${sysH(s.L1, s.L2)} by substitution. What is the easiest first step?`,
    board: board2(e), input: 'choice', ...c,
    solution: [`Look for a letter with coefficient 1: the ${s.v} in ${htmlLin(Lone)}.`, `${s.v === 'x' ? X : Y} = ${solved}. Then substitute it into the ${oth} equation.`],
    picture: { sys: pic({ win: winFor([s.sol]), eqs: e, lines: [{ L: s.L1, col: 'first', at: 'start' }, { L: s.L2, col: 'second', at: 'start' }], cross: s.sol,
      work: [`${s.v} = ${s.v === 'x' ? texExpr(-Lone.b, Lone.c, 'y') : texExpr(-Lone.a, Lone.c)}`] }) },
  };
};

// =====================================================================================================================
// 9-13. elimination
// =====================================================================================================================
type ElimKind = 'add' | 'sub' | 'one' | 'both';
/** an elimination system of the given kind, eliminating v; integer solution (both: sometimes a half) */
export function elimSys(R: () => number, kind: ElimKind, v: 'x' | 'y' = 'y'): { sol: V; L1: Lin; L2: Lin } {
  for (;;) {
    const half = kind === 'both' && R() < 0.2;
    const sol: V = half ? [int(R, -3, 3) + 0.5, int(R, -4, 4)] : [int(R, -5, 5), int(R, -5, 5)];
    let p: number, q: number;
    if (kind === 'add') { p = int(R, 1, 6); q = -p; }
    else if (kind === 'sub') { p = int(R, 1, 6) * pick(R, [1, -1]); q = p; }
    else if (kind === 'one') { p = int(R, 1, 4); q = p * pick(R, [2, 3, -2, -3]); }
    else { const pr = pick(R, [[2, 3], [3, 4], [2, 5], [3, 5], [4, 3], [3, 2], [5, 2], [4, 5]]); p = pr[0]!; q = pr[1]! * pick(R, [1, -1]); }
    const o1 = nz(R, -6, 6), o2 = nz(R, -6, 6);
    const L1 = v === 'y' ? lin(o1, p, 0) : lin(p, o1, 0), L2 = v === 'y' ? lin(o2, q, 0) : lin(q, o2, 0);
    const A = { ...L1, c: L1.a * sol[0] + L1.b * sol[1] }, B = { ...L2, c: L2.a * sol[0] + L2.b * sol[1] };
    if (!isInt(A.c) || !isInt(B.c) || Math.abs(A.c) > 50 || Math.abs(B.c) > 50 || solve(A, B).kind !== 'one') continue;
    if (kind === 'sub' && (v === 'y' ? A.a === B.a : A.b === B.b)) continue;
    if (kind === 'add' && (v === 'y' ? A.a === -B.a : A.b === -B.b)) continue;
    return { sol, L1: A, L2: B };
  }
}
const kindOf = (sg?: string): ElimKind => (sg === 'eliminate-by-subtracting' ? 'sub' : sg === 'scale-one-equation' ? 'one' : sg === 'scale-both-equations' ? 'both' : 'add');
const elimSolve: Gen = (R, n, sg) => {
  const kind: ElimKind = sg === 'choose-method' ? pick(R, ['add', 'sub', 'one', 'both'] as ElimKind[]) : kindOf(sg);
  const v = pick(R, ['x', 'y'] as const);
  const { sol, L1, L2 } = elimSys(R, kind, v);
  const work = elimWork(L1, L2, v);
  const e = eqT(L1, L2);
  return {
    id: `elimSolve-${n}`, family: 'elimSolve', prompt: `Solve ${sysH(L1, L2)} by elimination. Give the pair.`,
    board: board2(e), input: 'pair', ...PAIR, answer: { kind: 'pair', x: sol[0], y: sol[1] },
    check: pairCheck(sol, [L1, L2]),
    solution: [...work.map(texToHtml), `The solution is ${pairH(sol)}.`],
    picture: { sys: pic({ win: winFor([sol]), eqs: e, lines: [{ L: L1, col: 'first', at: 'start' }, { L: L2, col: 'second', at: 'solve' }],
      guides: [v === 'y' ? { x: sol[0], col: 'link', at: 'solve' } : { y: sol[1], col: 'link', at: 'solve' }], cross: sol, work: [...work, `(x, y) = ${pairT(sol)}`] }) },
  };
};
const addEq: Gen = (R, n) => {
  const v = pick(R, ['x', 'y'] as const);
  const { sol, L1, L2 } = elimSys(R, 'add', v);
  const S = add(L1, L2);
  const keep = v === 'y' ? lin(L1.a, 0, L1.c) : lin(0, L1.b, L1.c);
  const noC = { ...S, c: L1.c };
  const minus = sub(L1, L2);
  const opts: Opt[] = [
    { t: htmlLin(S), ok: true, say: `Yes: add left sides and right sides. The ${v}-terms cancel: ${htmlLin(S)}.` },
    { t: htmlLin(keep), mc: MC.deletes, say: `The ${v}-terms cancel, but everything else still adds: the other letters and both right sides.` },
  ];
  if (!near(noC.c, S.c)) opts.push({ t: htmlLin(noC), mc: MC.deletes, say: `Add the right sides too: ${nH(L1.c)} + ${pn(L2.c)} = ${nH(S.c)}.` });
  opts.push({ t: htmlLin(minus), say: `That subtracts. Adding makes the opposite ${v}-terms cancel.` });
  const c = choose(R, opts.filter((o, i, a) => a.findIndex(q => q.t === o.t) === i && (o.ok || o.t !== htmlLin(S))));
  const e = eqT(L1, L2);
  return {
    id: `addEq-${n}`, family: 'addEq', prompt: `Add the two equations ${sysH(L1, L2)}. What equation do you get?`,
    board: board2(e), input: 'choice', ...c,
    solution: [`Add the left sides and add the right sides: equals added to equals stay equal.`, `The ${v}-terms are opposites and cancel: ${htmlLin(S)}.`, `It is a ${v === 'y' ? 'vertical' : 'horizontal'} line through the crossing ${pairH(sol)}.`],
    picture: { sys: pic({ win: winFor([sol]), eqs: e, lines: [{ L: L1, col: 'first', at: 'start' }, { L: L2, col: 'second', at: 'start' }],
      guides: [v === 'y' ? { x: sol[0], col: 'link', at: 'solve' } : { y: sol[1], col: 'link', at: 'solve' }], cross: sol, work: [`\\text{add:}\\ ${texLin(S)}`] }) },
  };
};
const afterAdd: Gen = (R, n) => {
  const { sol, L1, L2 } = elimSys(R, 'add', 'y');
  const S = add(L1, L2);
  const c = choose(R, [
    { t: `Put ${X} = ${nH(sol[0])} into one of the original equations to find ${Y}`, ok: true, say: 'Yes: a solution is a pair, and an original equation gives the y that goes with it.' },
    { t: `Stop: the answer is ${X} = ${nH(sol[0])}`, mc: MC.stops, say: `The system asks for both letters. ${X} = ${nH(sol[0])} is half of the pair.` },
    { t: `Every pair with ${X} = ${nH(sol[0])} works, like (${nH(sol[0])}, ${nH(sol[1] === 0 ? 1 : 0)})`, mc: MC.keepsCombined, say: `${htmlLin(S)} is only one consequence. (${nH(sol[0])}, ${nH(sol[1] === 0 ? 1 : 0)}) must still fit the original equations, and it does not.` },
    { t: `Add the equations again to find ${Y}`, say: `Adding again gives the same ${htmlLin(S)}. Use an original equation to find ${Y}.` },
  ]);
  const e = eqT(L1, L2);
  return {
    id: `afterAdd-${n}`, family: 'afterAdd', prompt: `Adding ${sysH(L1, L2)} gives <b>${htmlLin(S)}</b>, so ${X} = ${nH(sol[0])}. What comes next?`,
    board: board2(e), input: 'choice', ...c,
    solution: [`${htmlLin(S)} gives ${X} = ${nH(sol[0])}.`, `${texToHtml(plugT(L1, 'x', sol[0]))}, so ${Y} = ${nH(sol[1])}.`, `The solution is ${pairH(sol)}.`],
    picture: { sys: pic({ win: winFor([sol]), eqs: e, lines: [{ L: L1, col: 'first', at: 'start' }, { L: L2, col: 'second', at: 'start' }],
      guides: [{ x: sol[0], col: 'link', at: 'start' }], cross: sol, work: [`${plugT(L1, 'x', sol[0])}`, `y = ${nT(sol[1])}`] }) },
  };
};
const subEq: Gen = (R, n) => {
  for (;;) {
    const { sol, L1, L2 } = elimSys(R, 'sub', 'x');
    if (near(L2.c, 0) || near(L1.b - L2.b, 0) || near(L1.b + L2.b, 0)) continue;
    const D = sub(L1, L2);
    const signSlip = lin(0, L1.b + L2.b, L1.c - L2.c), constSlip = lin(0, L1.b - L2.b, L1.c + L2.c), added = add(L1, L2);
    const opts: Opt[] = [
      { t: htmlLin(D), ok: true, say: `Yes: subtract every term. ${kH(L1.b, Y)} − (${kH(L2.b, Y)}) = ${kH(D.b, Y)} and ${nH(L1.c)} − ${pn(L2.c)} = ${nH(D.c)}.` },
      { t: htmlLin(signSlip), mc: L2.b < 0 ? MC.subNeg : MC.negFirst, say: L2.b < 0 ? `Subtracting ${kH(L2.b, Y)} adds ${kH(-L2.b, Y)}: ${nH(L1.b)} − ${pn(L2.b)} = ${nH(D.b)}.` : `The minus applies to every term of the second equation, the ${Y}-term too.` },
      { t: htmlLin(constSlip), mc: MC.negFirst, say: `The minus applies to the right side too: ${nH(L1.c)} − ${pn(L2.c)} = ${nH(D.c)}.` },
      { t: htmlLin(added), mc: MC.addsEqual, say: `Adding equal ${X}-terms doubles them. Subtract to make them cancel.` },
    ];
    if (new Set(opts.map(o => o.t)).size < opts.length) continue;
    const c = choose(R, opts);
    const e = eqT(L1, L2);
    return {
      id: `subEq-${n}`, family: 'subEq', prompt: `The ${X}-terms are equal. Subtract the second equation from the first: ${sysH(L1, L2)}. What do you get?`,
      board: board2(e), input: 'choice', ...c,
      solution: [`Subtract every term of the second equation: change each of its signs, then add.`, `${htmlLin(D)}, so ${Y} = ${nH(sol[1])}.`],
      picture: { sys: pic({ win: winFor([sol]), eqs: e, lines: [{ L: L1, col: 'first', at: 'start' }, { L: L2, col: 'second', at: 'start' }],
        guides: [{ y: sol[1], col: 'link', at: 'solve' }], cross: sol, work: [`\\text{subtract:}\\ ${texLin(D)}`, `y = ${nT(sol[1])}`] }) },
    };
  }
};
const scaleOne: Gen = (R, n) => {
  for (;;) {
    const a = nz(R, -5, 5), b = nz(R, -5, 5), c = nz(R, -9, 9), k = pick(R, [2, 3, 4, -2, -3]);
    if (Math.abs(a) === Math.abs(b) || Math.abs(b) === 1 && R() < 0.5) continue;
    const L = lin(a, b, c), S = scale(L, k);
    const some = lin(S.a, L.b, S.c), rhs = lin(S.a, S.b, L.c);
    const opts: Opt[] = [
      { t: htmlLin(S), ok: true, say: `Yes: every term on both sides times ${nH(k)}. It is the same line, with the same solutions.` },
      { t: htmlLin(some), mc: MC.someTerms, say: `Multiply EVERY term by ${nH(k)}, the ${Y}-term too: ${nH(b)} × ${nH(k)} = ${nH(S.b)}.` },
      { t: htmlLin(rhs), say: `The right side gets multiplied too: ${nH(c)} × ${nH(k)} = ${nH(S.c)}.` },
    ];
    if (new Set(opts.map(o => o.t)).size < 3) continue;
    const ch = choose(R, opts);
    const w = winFor([[0, yAt(L, 0)]], 3);
    if (!clip(L, w)) continue;
    return {
      id: `scaleOne-${n}`, family: 'scaleOne', prompt: `Multiply the whole equation <b class="a">${htmlLin(L)}</b> by <b>${nH(k)}</b>. Which equation do you get?`,
      board: `${texLin(L)}\\quad \\times ${k < 0 ? `(${k})` : k}`, input: 'choice', ...ch,
      solution: [`Multiply every term, on both sides, by ${nH(k)}: ${htmlLin(S)}.`, `It draws the same line, so it has the same solutions.`],
      picture: { sys: pic({ win: w, eqs: [texLin(L)], lines: [{ L, col: 'first', at: 'start' }, { L: S, col: 'second', at: 'solve', dashed: true }], work: [`${texLin(S)}`] }) },
    };
  }
};
const pickMult: Gen = (R, n, sg) => {
  if (sg !== 'scale-both-equations' && (sg === 'scale-one-equation' || R() < 0.5)) {
    for (;;) {
      const { sol, L1, L2 } = elimSys(R, 'one', 'y');
      const k = L2.b / L1.b;   // L2.b = k L1.b
      if (!isInt(k)) continue;
      const e = eqT(L1, L2);
      const M = scale(L1, -k), S = add(M, L2);
      return {
        id: `pickMult-${n}`, family: 'pickMult', prompt: `To eliminate ${Y} by ADDING the equations ${sysH(L1, L2)}, multiply the first equation by what number?`,
        board: board2(e), input: 'num', unit: '', answer: { kind: 'num', v: -k },
        check: r => {
          if (r.kind !== 'num' || !Number.isFinite(r.v)) return { ok: false, say: 'Type a number.' };
          if (near(r.v, -k)) return { ok: true, say: `Yes: ${pn(-k)} × ${kH(L1.b, Y)} = ${kH(-L2.b, Y)}, the opposite of ${kH(L2.b, Y)}. Adding cancels them.` };
          if (near(r.v, k)) return { ok: false, mc: MC.addsEqual, say: `× ${pn(k)} makes the ${Y}-terms EQUAL, and adding equal terms doubles them. You need opposites: × ${pn(-k)}.` };
          return { ok: false, say: `The ${Y}-terms are ${kH(L1.b, Y)} and ${kH(L2.b, Y)}. What times ${nH(L1.b)} gives ${nH(-L2.b)}?` };
        },
        solution: [`The ${Y}-terms are ${kH(L1.b, Y)} and ${kH(L2.b, Y)}: ${nH(L1.b)} × ${pn(-k)} = ${nH(-L2.b)}, the opposite of ${nH(L2.b)}.`, `Multiply the first equation by <b class="s">${nH(-k)}</b>: ${htmlLin(M)}; adding the second gives ${htmlLin(S)}.`],
        picture: { sys: pic({ win: winFor([sol]), eqs: e, lines: [{ L: L1, col: 'first', at: 'start' }, { L: L2, col: 'second', at: 'start' }], cross: sol,
          work: [`\\times ${-k < 0 ? `(${-k})` : -k}:\\ ${texLin(M)}`, `\\text{add:}\\ ${texLin(S)}`] }) },
      };
    }
  }
  for (;;) {
    const { sol, L1, L2 } = elimSys(R, 'both', 'x');
    const p = Math.abs(L1.a), q = Math.abs(L2.a);
    if (p === q || p % q === 0 || q % p === 0) continue;
    const l = lcm(p, q), m1 = l / p, m2 = l / q;
    const opts: Opt[] = [
      { t: `first × ${m1}, second × ${m2}`, ok: true, say: `Yes: then the ${X}-terms are ${nH(L1.a * m1)}${X} and ${nH(L2.a * m2)}${X}, so they cancel.` },
      { t: `first × ${m2}, second × ${m1}`, mc: MC.multMismatch, say: `That gives ${nH(L1.a * m2)}${X} and ${nH(L2.a * m1)}${X}: they do not match. Multiply each by the OTHER coefficient.` },
      { t: `first × ${m1}, second × ${m1}`, mc: MC.multMismatch, say: `Multiplying both by ${m1} keeps them different: ${nH(L1.a * m1)}${X} and ${nH(L2.a * m1)}${X}.` },
    ];
    if (m1 === m2 || new Set(opts.map(o => o.t)).size < 3) continue;
    const c = choose(R, opts);
    const e = eqT(L1, L2);
    return {
      id: `pickMult-${n}`, family: 'pickMult', prompt: `To eliminate ${X} in ${sysH(L1, L2)}, multiply each equation by what?`,
      board: board2(e), input: 'choice', ...c,
      solution: [`The ${X}-coefficients are ${nH(L1.a)} and ${nH(L2.a)}. A common multiple is ${l}.`, `First × ${m1}: ${htmlLin(scale(L1, m1))}. Second × ${m2}: ${htmlLin(scale(L2, m2))}.`],
      picture: { sys: pic({ win: winFor([sol]), eqs: e, lines: [{ L: L1, col: 'first', at: 'start' }, { L: L2, col: 'second', at: 'start' }], cross: sol, work: elimWork(L1, L2, 'x').slice(0, 3) }) },
    };
  }
};
const money = (v: number) => v.toFixed(2);
const clearFrac: Gen = (R, n) => {
  if (R() < 0.35) {
    // decimals (money): 0.25a + 0.10b = 3.40 -> × 100
    const pa = pick(R, [0.25, 0.1, 0.05, 0.5]), pb = pick(R, [0.1, 0.05, 0.01, 0.25].filter(x => x !== pa));
    const qa = int(R, 2, 14), qb = int(R, 2, 14), tot = Math.round((pa * qa + pb * qb) * 100) / 100;
    const A = Math.round(pa * 100), B = Math.round(pb * 100), T = Math.round(tot * 100);
    const right = `${A}<i>a</i> + ${B}<i>b</i> = ${T}`, some = `${A}<i>a</i> + ${money(pb)}<i>b</i> = ${T}`, rhs = `${A}<i>a</i> + ${B}<i>b</i> = ${money(tot)}`;
    const c = choose(R, [
      { t: right, ok: true, say: 'Yes: every term times 100 turns dollars into cents.' },
      { t: some, mc: MC.someTerms, say: `Every term gets multiplied, the ${money(pb)}<i>b</i> too.` },
      { t: rhs, say: `The right side gets multiplied too: ${money(tot)} × 100 = ${T}.` },
    ]);
    const ctx = ctxWin(tot / pa, tot / pb);
    const L = lin(pa, pb, tot);
    const t0 = `${money(pa)}a + ${money(pb)}b = ${money(tot)}`;
    return {
      id: `clearFrac-${n}`, family: 'clearFrac', prompt: `Coins worth $${money(pa)} and $${money(pb)} make $${money(tot)}: <b class="a">${money(pa)}<i>a</i> + ${money(pb)}<i>b</i> = ${money(tot)}</b>. Multiply by 100 to clear the decimals. Which equation do you get?`,
      board: t0, input: 'choice', ...c,
      solution: [`× 100 on every term: ${right}.`, `Whole numbers, the same solutions (the same line).`],
      picture: { sys: pic({ ...ctx, names: [`coins a`, `coins b`], eqs: [t0], lines: [{ L, col: 'first', at: 'start' }, { L: scale(L, 100), col: 'second', at: 'solve', dashed: true }], work: [`${A}a + ${B}b = ${T}`] }) },
    };
  }
  for (;;) {
    const q1 = pick(R, [2, 3, 4, 5]), q2 = pick(R, [2, 3, 4, 5, 10]), p1 = nz(R, -3, 3), p2 = nz(R, -3, 3), c0 = nz(R, -6, 6);
    if (gcd(p1, q1) !== 1 || gcd(p2, q2) !== 1) continue;
    const l = lcm(q1, q2), A = (p1 * l) / q1, B = (p2 * l) / q2, C = c0 * l;
    const fT = (p: number, q: number, v: string) => `${p < 0 ? '-' : ''}\\tfrac{${Math.abs(p)}}{${q}}${v}`;
    const fH = (p: number, q: number, v: string) => `${p < 0 ? '−' : ''}${fr(Math.abs(p), q)}${v}`;
    const boardT = `${fT(p1, q1, 'x')} ${p2 < 0 ? '-' : '+'} ${fT(Math.abs(p2), q2, 'y')} = ${nT(c0)}`;
    const L = lin(A, B, C);
    const right = htmlLin(L), some = `${kH(A, X)} ${p2 < 0 ? '−' : '+'} ${fH(Math.abs(p2), q2, Y)} = ${nH(C)}`, rhs = htmlLin(lin(A, B, c0)), drop = htmlLin(lin(p1, p2, c0));
    const opts: Opt[] = [
      { t: right, ok: true, say: `Yes: × ${l} on every term clears both denominators.` },
      { t: some, mc: MC.someTerms, say: `Every term gets multiplied by ${l}, the ${Y}-term too.` },
      { t: rhs, say: `The right side gets multiplied too: ${nH(c0)} × ${l} = ${nH(C)}.` },
      { t: drop, say: `Dropping the denominators changes the equation. Multiply every term by ${l} instead.` },
    ];
    if (new Set(opts.map(o => o.t)).size < 4) continue;
    const c = choose(R, opts);
    const w = winFor([[0, yAt(L, 0)]], 3);
    if (!clip(L, w) || Math.abs(yAt(L, 0)) > 8) continue;
    return {
      id: `clearFrac-${n}`, family: 'clearFrac', prompt: `Clear the fractions in <b class="a">${fH(p1, q1, X)} ${p2 < 0 ? '−' : '+'} ${fH(Math.abs(p2), q2, Y)} = ${nH(c0)}</b>: multiply by ${l}. Which equation do you get?`,
      board: boardT, input: 'choice', ...c,
      solution: [`${l} is a common multiple of ${q1} and ${q2}.`, `× ${l} on every term: ${right}. The same line, with whole-number coefficients.`],
      picture: { sys: pic({ win: w, eqs: [boardT], lines: [{ L, col: 'first', at: 'start' }, { L, col: 'second', at: 'solve', dashed: true }], work: [`\\times ${l}:\\ ${texLin(L)}`] }) },
    };
  }
};
const ratSolve: Gen = (R, n) => {
  if (R() < 0.55) {
    const [na, nb, pa, pb] = pick(R, [['quarters', 'dimes', 0.25, 0.1], ['quarters', 'nickels', 0.25, 0.05], ['dimes', 'nickels', 0.1, 0.05]] as const);
    const qa = int(R, 3, 16), qb = int(R, 3, 16), N = qa + qb, T = Math.round((pa * qa + pb * qb) * 100) / 100;
    const L1 = lin(1, 1, N), L2 = lin(pa, pb, T);
    const l1 = na[0]!, l2 = nb[0]!;
    const ctx = ctxWin(N, N);
    const A = Math.round(pa * 100), B = Math.round(pb * 100), TT = Math.round(T * 100);
    const work = [`\\times 100:\\ ${A}${l1} + ${B}${l2} = ${TT}`, `\\times ${B}:\\ ${B}${l1} + ${B}${l2} = ${B * N}`,
      `\\text{subtract:}\\ ${A - B}${l1} = ${TT - B * N}`, `${l1} = ${qa},\\ ${l2} = ${N} - ${qa} = ${qb}`];
    const e = [`${l1} + ${l2} = ${N}`, `${money(pa)}${l1} + ${money(pb)}${l2} = ${money(T)}`];
    return {
      id: `ratSolve-${n}`, family: 'ratSolve',
      prompt: `${N} coins, only ${na} and ${nb}, are worth $${money(T)}: <b class="a"><i>${l1}</i> + <i>${l2}</i> = ${N}</b> and <b class="b">${money(pa)}<i>${l1}</i> + ${money(pb)}<i>${l2}</i> = ${money(T)}</b>. How many of each?`,
      board: board2(e), input: 'pair', pairLead: `(<i>${l1}</i>, <i>${l2}</i>) = (`, pairOp: ',', pairTail: ')',
      answer: { kind: 'pair', x: qa, y: qb }, check: pairCheck([qa, qb], [L1, L2], { names: [l1, l2] }),
      solution: [...work.map(texToHtml), `<b class="s">${qa}</b> ${na} and <b class="s">${qb}</b> ${nb}: ${qa} × $${money(pa)} + ${qb} × $${money(pb)} = $${money(T)}. ✓`],
      picture: { sys: pic({ win: ctx.win, gx: ctx.gx, gy: ctx.gy, names: [na, nb], eqs: e,
        lines: [{ L: L1, col: 'first', at: 'start' }, { L: L2, col: 'second', at: 'solve' }], cross: [qa, qb], work }) },
    };
  }
  for (;;) {
    const q1 = pick(R, [2, 3, 4]), q2 = pick(R, [2, 3, 5]);
    const sol: V = [q1 * nz(R, -2, 2), q2 * nz(R, -2, 2)];
    const c0 = sol[0] / q1 + sol[1] / q2;
    const b2 = pick(R, [-1, 1, 2, -2]);
    const L2 = lin(1, b2, sol[0] + b2 * sol[1]);
    const L1 = lin(1 / q1, 1 / q2, c0), l = lcm(q1, q2);
    if (Math.abs(L2.c) > 20 || solve(L1, L2).kind !== 'one' || Math.abs(sol[0]) > 8 || Math.abs(sol[1]) > 8) continue;
    const t1 = `\\tfrac{x}{${q1}} + \\tfrac{y}{${q2}} = ${nT(c0)}`;
    const C = scale(L1, l);
    const work = [`\\times ${l}:\\ ${texLin(C)}`, ...elimWork(C, L2, 'x')];
    const e = [t1, texLin(L2)];
    return {
      id: `ratSolve-${n}`, family: 'ratSolve', prompt: `Solve the system <b class="a">${fr(X, q1)} + ${fr(Y, q2)} = ${nH(c0)}</b> and <b class="b">${htmlLin(L2)}</b>. Clear the fractions first.`,
      board: board2(e), input: 'pair', ...PAIR, answer: { kind: 'pair', x: sol[0], y: sol[1] }, check: pairCheck(sol, [L1, L2]),
      solution: [...work.map(texToHtml), `The solution is ${pairH(sol)}.`],
      picture: { sys: pic({ win: winFor([sol], 1), eqs: e, lines: [{ L: L1, col: 'first', at: 'start' }, { L: L2, col: 'second', at: 'solve' }], cross: sol, work }) },
    };
  }
};

// =====================================================================================================================
// 14-16. 0 = c, 0 = 0, choosing a method
// =====================================================================================================================
const zeroEq: Gen = (R, n, sg) => {
  const inf = sg === 'identity-infinite' || (sg !== 'contradiction-no-solution' && R() < 0.5);
  for (;;) {
    const s = sysKind(R, inf ? 'inf' : 'none', true);
    // reduce by elimination of x: scale L1 to L2's x coefficient, subtract
    const k = s.L2.a / s.L1.a;
    const D = sub(s.L2, scale(s.L1, k));
    if (!near(D.a, 0) || !near(D.b, 0)) continue;
    const z = D.c;
    if (inf !== near(z, 0)) continue;
    const opts: Opt[] = inf ? [
      { t: `Infinitely many: every point on the line ${htmlLin(s.L1, s.f1)}`, ok: true, say: '0 = 0 is always true: the equations say the same thing. Every point of that one line works.' },
      { t: 'No solution', mc: MC.cancelMisread, say: 'The letters cancelled, but look at what is left: 0 = 0 is TRUE, for every pair on the line.' },
      { t: `${X} = 0`, mc: MC.zeroVsNone, say: `0 = 0 does not say ${X} is 0. It says the two equations are the same line.` },
      { t: 'Every pair (x, y) works', mc: MC.everyPoint, say: `Only pairs on the line ${htmlLin(s.L1, s.f1)}. A point off it fails both equations.` },
    ] : [
      { t: 'No solution: no pair makes both equations true', ok: true, say: `0 = ${nH(z)} is false whatever ${X} and ${Y} are. The lines are parallel.` },
      { t: `${X} = 0`, mc: MC.zeroVsNone, say: `The letters cancelled and left a false statement. That means no solution, not ${X} = 0.` },
      { t: `0${X} = ${nH(z)}, so ${X} = ${nH(z)}`, mc: MC.divZero, say: `You can't divide by 0. No number times 0 gives ${nH(z)}: no solution.` },
      { t: 'Infinitely many solutions', mc: MC.cancelMisread, say: `That would need a TRUE statement like 0 = 0. 0 = ${nH(z)} is false.` },
    ];
    const c = choose(R, opts);
    const w = winFor([[0, yInt(s.L1)], [0, yInt(s.L2)]], 3);
    return {
      id: `zeroEq-${n}`, family: 'zeroEq', prompt: `Solving ${s.h}, all the letters cancel and you get <b>0 = ${nH(z)}</b>. What does that mean?`,
      board: `${board2(s.e)} \\qquad 0 = ${nT(z)}`, input: 'choice', ...c,
      solution: inf ? ['0 = 0 is true for every pair that fits the first equation.', `So every point on the line ${htmlLin(s.L1, s.f1)} is a solution: infinitely many, all on one line.`]
        : [`0 = ${nH(z)} is false, whatever the numbers.`, 'So no pair fits both: no solution. The lines have the same slope and never meet.'],
      picture: { sys: pic({ win: w, eqs: s.e, lines: [{ L: s.L1, col: 'first', at: 'solve' }, { L: s.L2, col: 'second', at: 'solve', dashed: inf }],
        gaps: inf ? undefined : [w.x0 + 1.5, (w.x0 + w.x1) / 2, w.x1 - 1.5], work: [`0 = ${nT(z)}`, inf ? `\\text{same line}` : `\\text{no solution}`] }) },
    };
  }
};
const chooseMethod: Gen = (R, n) => {
  const which = pick(R, ['sub', 'add', 'subtract', 'scale'] as const);
  let L1: Lin, L2: Lin, f1: Form = 'std', sol: V;
  if (which === 'sub') { const s = subSys(R); L1 = s.iso; L2 = s.L; f1 = s.isoForm; sol = s.sol; }
  else { const s = elimSys(R, which === 'add' ? 'add' : which === 'subtract' ? 'sub' : 'both', pick(R, ['x', 'y'] as const)); L1 = s.L1; L2 = s.L2; sol = s.sol; }
  // one best method only: no system that has equal AND opposite coefficients, no "multiply first" when adding or
  // subtracting already works
  if (which !== 'sub') {
    const eq = near(L1.a, L2.a) || near(L1.b, L2.b), opp = near(L1.a, -L2.a) || near(L1.b, -L2.b);
    if ((which === 'add' && eq) || (which === 'subtract' && opp) || (which === 'scale' && (eq || opp))) return chooseMethod(R, n);
  }
  const say = { sub: 'a letter is already alone, so put its expression into the other equation.', add: 'a letter has opposite coefficients, so adding cancels it.', subtract: 'a letter has equal coefficients, so subtracting cancels it.', scale: 'no coefficients match yet, so multiply first to make them match.' };
  const c = choose(R, [
    { t: 'Substitution: a letter is already alone', ok: which === 'sub', mc: which === 'sub' ? undefined : MC.method, say: which === 'sub' ? `Yes: ${say.sub}` : `No letter is alone here: ${say[which]}` },
    { t: 'Elimination by adding: opposite coefficients', ok: which === 'add', mc: which === 'add' ? undefined : MC.method, say: which === 'add' ? `Yes: ${say.add}` : `Look again: ${say[which]}` },
    { t: 'Elimination by subtracting: equal coefficients', ok: which === 'subtract', mc: which === 'subtract' ? undefined : MC.method, say: which === 'subtract' ? `Yes: ${say.subtract}` : `Look again: ${say[which]}` },
    { t: 'Multiply first, then eliminate', ok: which === 'scale', mc: which === 'scale' ? undefined : MC.method, say: which === 'scale' ? `Yes: ${say.scale}` : `No need to multiply: ${say[which]}` },
  ]);
  const e = eqT(L1, L2, f1);
  const work = which === 'sub' ? subWork(L1, f1 as 'y' | 'x', L2) : elimWork(L1, L2, which === 'scale' ? 'x' : near(L1.b + L2.b, 0) || near(L1.b - L2.b, 0) ? 'y' : 'x');
  return {
    id: `chooseMethod-${n}`, family: 'chooseMethod', prompt: `Which method fits the system ${sysH(L1, L2, f1)} best?`,
    board: board2(e), input: 'choice', ...c,
    solution: [`Look at the structure: ${say[which]}`, `Any correct method gives the same answer, ${pairH(sol)}; the best one is the shortest.`],
    picture: { sys: pic({ win: winFor([sol]), eqs: e, lines: [{ L: L1, col: 'first', at: 'start' }, { L: L2, col: 'second', at: 'start' }], cross: sol, work }) },
  };
};
const methodsAgree: Gen = (R, n) => {
  const { sol, L1, L2 } = elimSys(R, pick(R, ['add', 'sub', 'one'] as ElimKind[]), 'y');
  const [a, b] = shuffle(R, ['Ana', 'Ben', 'Kim', 'Raj', 'Tess', 'Omar']).slice(0, 2);
  const opts: Opt[] = [
    { t: pairH(sol), ok: true, say: 'Yes: every correct method finds the same pair, because the lines cross in one place.' },
    { t: 'A different pair: each method gives its own answer', mc: MC.methodsDiffer, say: `The system has one solution, the crossing ${pairH(sol)}. Any correct method must land there.` },
    { t: `Only ${X} = ${nH(sol[0])}: elimination finds one letter`, mc: MC.stops, say: `Elimination finds one letter first, then the other from an original equation: the full pair ${pairH(sol)}.` },
  ];
  if (!near(sol[0], sol[1])) opts.push({ t: pairH([sol[1], sol[0]]), mc: MC.reversed, say: `Same numbers, wrong order: ${X} comes first.` });
  const c = choose(R, opts);
  const e = eqT(L1, L2);
  return {
    id: `methodsAgree-${n}`, family: 'methodsAgree', prompt: `${a} solved ${sysH(L1, L2)} by substitution and got <b>${pairH(sol)}</b>, which checks in both equations. ${b} solves it by elimination. What does ${b} get?`,
    board: board2(e), input: 'choice', ...c,
    solution: ['A system with one solution has exactly one crossing point.', `Substitution and elimination are two ways to find it: both give ${pairH(sol)}.`],
    picture: { sys: pic({ win: winFor([sol]), eqs: e, lines: [{ L: L1, col: 'first', at: 'start' }, { L: L2, col: 'second', at: 'start' }], cross: sol, work: elimWork(L1, L2, 'y') }) },
  };
};

// =====================================================================================================================
// 17, 21. graphing, estimates and exact answers
// =====================================================================================================================
const graphRead: Gen = (R, n) => {
  for (;;) {
    const sol: V = [int(R, -4, 4), int(R, -4, 4)];
    const std = R() < 0.35;
    const mk = (): { L: Lin; f: Form; pts: V[] } | null => {
      if (std) {
        // a·x + b·y = c with both intercepts whole
        const xi = nz(R, -6, 6), yi = nz(R, -6, 6);
        const L0 = through([xi, 0], [0, yi]);
        const g = gcd(gcd(L0.a, L0.b), L0.c), L = { a: L0.a / g, b: L0.b / g, c: L0.c / g };
        const S = L.a < 0 ? scale(L, -1) : L;
        return { L: S, f: 'std', pts: [[xi, 0], [0, yi]] };
      }
      const m = nz(R, -3, 3), k = sol[1] - m * sol[0];
      if (Math.abs(k) > 6) return null;
      return { L: ySlope(m, k), f: 'y', pts: [[0, k], [1, k + m]] };
    };
    const A = mk(), B = std ? null : mk();
    if (!A) continue;
    let L2: { L: Lin; f: Form; pts: V[] };
    if (std) {
      // second line through sol and one of A's intercept-free points: slope form
      const m = nz(R, -3, 3), k = sol[1] - m * sol[0];
      if (Math.abs(k) > 6) continue;
      L2 = { L: ySlope(m, k), f: 'y', pts: [[0, k], [1, k + m]] };
      const s = solve(A.L, L2.L);
      if (s.kind !== 'one' || !isInt(s.x) || !isInt(s.y) || Math.abs(s.x) > 5 || Math.abs(s.y) > 6) continue;
    } else { if (!B) continue; L2 = B; }
    const s = solve(A.L, L2.L);
    if (s.kind !== 'one' || !isInt(s.x) || !isInt(s.y)) continue;
    const P: V = [s.x, s.y];
    const e = [texLin(A.L, A.f), texLin(L2.L, L2.f)];
    const all = [...A.pts, ...L2.pts, P];
    return {
      id: `graphRead-${n}`, family: 'graphRead', prompt: `Graph ${sysH(A.L, L2.L, A.f, L2.f)}: two points of each line are marked. Draw the lines in your head (or on paper). Where do they cross?`,
      board: board2(e), input: 'pair', ...PAIR, answer: { kind: 'pair', x: P[0], y: P[1] }, check: pairCheck(P, [A.L, L2.L]),
      solution: [A.f === 'y' ? `Line 1: start at (0, ${nH(yInt(A.L))}), then 1 right and ${nH(slope(A.L))} up.` : `Line 1 goes through its intercepts ${pairH(A.pts[0]!)} and ${pairH(A.pts[1]!)}.`,
        `Line 2: start at (0, ${nH(yInt(L2.L))}), then 1 right and ${nH(slope(L2.L))} up.`, `They cross at ${pairH(P)}. Check it in both equations.`],
      picture: { sys: pic({ win: winFor(all, 1), eqs: e, lines: [{ L: A.L, col: 'first', at: 'solve' }, { L: L2.L, col: 'second', at: 'solve' }],
        pts: [...A.pts.map(p => ({ p, col: 'first', at: 'start' } as PicPt)), ...L2.pts.map(p => ({ p, col: 'second', at: 'start' } as PicPt))], cross: P,
        work: [`${chkT(A.L, A.f, P)}\\ \\checkmark`, `${chkT(L2.L, L2.f, P)}\\ \\checkmark`] }) },
    };
  }
};
const sketchTrap: Gen = (R, n) => {
  for (;;) {
    const par = R() < 0.35;
    const m1 = pick(R, [0.5, 1, -0.5, -1, 1.5]), k1 = int(R, -3, 3), d = pick(R, [3, -3, 4, -4]);
    const m2 = par ? m1 : m1 + pick(R, [0.5, -0.5]);
    const k2 = k1 + d;
    const L1 = ySlope(m1, k1), L2 = ySlope(m2, k2);
    const win: Win = { x0: -4, y0: -6, x1: 4, y1: 6 };
    const s = solve(L1, L2);
    if (!par && (s.kind !== 'one' || inWin([s.x, s.y], win))) continue;
    if (!clip(L1, win) || !clip(L2, win)) continue;
    const toStd = (L: Lin) => scale(L, 2);   // whole coefficients: 2y = 2mx + 2k
    const e = [`y = ${texExpr(m1, k1)}`, `y = ${texExpr(m2, k2)}`];
    const opts: Opt[] = par ? [
      { t: 'No: same slope, different intercepts, so the lines are parallel', ok: true, say: 'Yes. Equal slopes never meet, however far you look.' },
      { t: 'Yes: they cross somewhere outside the window', mc: MC.offscreen, say: `Both slopes are ${nH(m1)}: the gap between them is always ${nH(Math.abs(d))}, so they never meet.` },
      { t: 'No: they do not meet on this graph', mc: MC.sketch, say: 'The right answer, for a weak reason. A window can hide a crossing; the slopes tell you for sure.' },
    ] : [
      { t: 'Yes: the slopes are different, so the lines cross outside the window', ok: true, say: `Yes. They meet at ${pairH([s.kind === 'one' ? s.x : 0, s.kind === 'one' ? s.y : 0])}, off this graph.` },
      { t: 'No: they do not meet on this graph', mc: MC.sketch, say: `A window only shows part of the plane. Slopes ${nH(m1)} and ${nH(m2)} are different, so the lines cross somewhere.` },
      { t: 'No: they look parallel', mc: MC.sketch, say: `Looks are not enough: slopes ${nH(m1)} and ${nH(m2)} differ, so the lines do meet.` },
    ];
    void toStd;
    const c = choose(R, opts);
    return {
      id: `sketchTrap-${n}`, family: 'sketchTrap', prompt: `In this window the lines of <b class="a">${Y} = ${htmlExpr(m1, k1)}</b> and <b class="b">${Y} = ${htmlExpr(m2, k2)}</b> do not cross. Does the system have a solution?`,
      board: board2(e), input: 'choice', ...c,
      solution: par ? [`Both slopes are ${nH(m1)}: parallel lines, no solution.`] : [`Slopes ${nH(m1)} and ${nH(m2)} are different, so the lines cross once.`, s.kind === 'one' ? `Solving gives ${pairH([s.x, s.y])}: outside the window.` : ''],
      picture: { sys: pic({ win, eqs: e, lines: [{ L: L1, col: 'first', at: 'start' }, { L: L2, col: 'second', at: 'start' }], gaps: par ? [-2.5, 0, 2.5] : undefined,
        work: par ? ['\\text{same slope: no solution}'] : [`\\text{cross at } ${pairT([s.kind === 'one' ? s.x : 0, s.kind === 'one' ? s.y : 0])}`] }) },
    };
  }
};
/** two lines with whole coefficients crossing at a point that is NOT a grid point (thirds, fifths, ...) */
function offGrid(R: () => number): { L1: Lin; L2: Lin; P: V } {
  for (;;) {
    const L1 = lin(nz(R, -4, 4), nz(R, -4, 4), int(R, -8, 8)), L2 = lin(nz(R, -4, 4), nz(R, -4, 4), int(R, -8, 8));
    const s = solve(L1, L2);
    if (s.kind !== 'one') continue;
    const P: V = [s.x, s.y];
    if (isInt(P[0]) && isInt(P[1])) continue;
    if (Math.abs(P[0]) > 4 || Math.abs(P[1]) > 4) continue;
    // nice fractions (denominator <= 7), not too near a half-grid line split
    const den = (v: number) => { for (let q = 1; q <= 7; q++) if (isInt(v * q)) return q; return 99; };
    if (den(P[0]) > 7 || den(P[1]) > 7) continue;
    const h = (v: number) => Math.abs(v * 2 - Math.round(v * 2));
    if (h(P[0]) > 0.34 || h(P[1]) > 0.34 || (isInt(P[0] * 2) && isInt(P[1] * 2))) continue;
    if (L1.a < 0) Object.assign(L1, scale(L1, -1));
    if (L2.a < 0) Object.assign(L2, scale(L2, -1));
    return { L1, L2, P };
  }
}
const half = (v: number) => Math.round(v * 2) / 2;
const dec = (v: number) => (v < 0 ? '−' : '') + String(Math.abs(Math.round(v * 100) / 100));
/** a·x + b·y with decimal values put in: "2(1.5) + 3(2.5)" */
const subD = (L: Lin, p: V) => [L.a ? `${near(L.a, 1) ? '' : near(L.a, -1) ? '−' : dec(L.a)}(${dec(p[0])})` : '', L.b ? `${L.b < 0 ? ' − ' : L.a ? ' + ' : ''}${near(Math.abs(L.b), 1) && p[1] >= 0 ? dec(p[1]) : `${near(Math.abs(L.b), 1) ? '' : dec(Math.abs(L.b))}(${dec(p[1])})`}` : ''].join('');
const estimate: Gen = (R, n) => {
  for (;;) {
    const { L1, L2, P } = offGrid(R);
    const est: V = [half(P[0]), half(P[1])];
    const near1 = (q: V) => Math.hypot(q[0] - P[0], q[1] - P[1]);
    const cand: V[] = [est, [est[0] + 1, est[1]], [est[0], est[1] - 1], [est[0] - 1, est[1] + 1]];
    if (cand.slice(1).some(q => near1(q) < near1(est) + 0.5)) continue;
    const order = shuffle(R, cand.slice());
    const opts = order.map(q => q === est
      ? { t: `about ${decP(q)}`, ok: true, mc: undefined as string | undefined, say: `Yes: the crossing is close to ${decP(est)}. The exact point is ${pairH(P)}.` }
      : { t: `about ${decP(q)}`, ok: false, mc: undefined as string | undefined, say: `Look where the two lines meet: nearer ${decP(est)}.` });
    const e = eqT(L1, L2);
    return {
      id: `estimate-${n}`, family: 'estimate', prompt: `The lines of ${sysH(L1, L2)} do not cross at a grid point. Which estimate is closest?`,
      board: board2(e), input: 'choice', choices: opts.map(o => o.t), answer: { kind: 'choice', i: opts.findIndex(o => o.ok) },
      check: r => { const o = r.kind === 'choice' ? opts[r.i] : undefined; if (!o) return { ok: false, say: 'Pick one.' }; return o.ok ? { ok: true, say: o.say } : { ok: false, say: o.say }; },
      solution: [`Read the crossing between grid lines: about ${decP(est)}.`, `Solving gives the exact point ${pairH(P)}. A graph can only estimate it.`],
      picture: { sys: pic({ win: winFor([P], 3), eqs: e, lines: [{ L: L1, col: 'first', at: 'start' }, { L: L2, col: 'second', at: 'start' }], cross: P, crossLabel: pairP(P), work: [`\\text{exact: } ${pairT(P)}`] }) },
    };
  }
};
const exactVsEst: Gen = (R, n) => {
  const { L1, L2, P } = offGrid(R);
  const est: V = [half(P[0]), half(P[1])];
  const name = pick(R, ['Jo', 'Sam', 'Lia', 'Max', 'Ivy', 'Dev']);
  const c = choose(R, [
    { t: `${pairH(P)}: algebra is exact, the graph only estimates`, ok: true, say: `Yes. ${decP(est)} is close, but it does not make the equations true; ${pairH(P)} does.` },
    { t: `${decP(est)}: you can see it on the graph`, mc: MC.roughGraph, say: `Check ${decP(est)}: ${subD(L1, est)} = ${dec(lhsOf(L1, est))}, not ${nH(L1.c)}. The graph is too rough to be exact.` },
    { t: 'Both: they are the same point', mc: MC.approxExact, say: `${decP(est)} and ${pairH(P)} are close, not equal. Only the exact pair makes both equations true.` },
  ]);
  const e = eqT(L1, L2);
  return {
    id: `exactVsEst-${n}`, family: 'exactVsEst', prompt: `On the graph of ${sysH(L1, L2)}, ${name} reads the crossing as about <b>${decP(est)}</b>. Solving gives <b>${pairH(P)}</b>. Which is the solution?`,
    board: board2(e), input: 'choice', ...c,
    solution: [`Check the estimate: ${subD(L1, est)} = ${dec(lhsOf(L1, est))}, not ${nH(L1.c)}.`, `The exact solution is ${pairH(P)}; the graph reading is an estimate of it.`],
    picture: { sys: pic({ win: winFor([P], 3), eqs: e, lines: [{ L: L1, col: 'first', at: 'start' }, { L: L2, col: 'second', at: 'start' }],
      pts: [{ p: est, col: 'pick', at: 'start', label: `about ${decP(est)}` }], cross: P, crossLabel: pairP(P), work: [`${subD(L1, est).replace(/−/g, '-')} = ${dec(lhsOf(L1, est)).replace('−', '-')} \\neq ${nT(L1.c)}`] }) },
  };
};

// =====================================================================================================================
// 18-19. one constraint, two constraints
// =====================================================================================================================
const CTX = [
  { what: 'tickets', a: 'adult', b: 'student', la: 'a', lb: 's', pa: [8, 12, 15], pb: [4, 5, 7] },
  { what: 'shirts', a: 'large', b: 'small', la: 'l', lb: 's', pa: [14, 18, 20], pb: [9, 10, 12] },
  { what: 'snacks', a: 'sandwich', b: 'drink', la: 'w', lb: 'd', pa: [6, 7, 9], pb: [2, 3, 4] },
  { what: 'plants', a: 'tree', b: 'bush', la: 't', lb: 'b', pa: [25, 30, 40], pb: [8, 10, 12] },
] as const;
const writeOne: Gen = (R, n) => {
  if (R() < 0.3) {
    const fee = pick(R, [20, 25, 30, 40, 50, 60]), rate = pick(R, [10, 12, 15, 18, 22, 35]);
    const what = pick(R, ['gym', 'phone plan', 'climbing club', 'music app', 'pool pass']);
    const c = choose(R, [
      { t: `<i>c</i> = ${rate}<i>m</i> + ${fee}`, ok: true, say: `Yes: $${rate} for each of the m months, plus the $${fee} start fee once.` },
      { t: `<i>c</i> = ${fee}<i>m</i> + ${rate}`, mc: MC.swapRates, say: `The $${rate} comes every month, so it multiplies m. The $${fee} is paid once.` },
      { t: `<i>c</i> = ${rate} + <i>m</i> + ${fee}`, mc: MC.coefAdd, say: `$${rate} for EACH month is ${rate} times m: ${rate}<i>m</i>.` },
      { t: `<i>c</i> = ${rate + fee}<i>m</i>`, say: `The start fee is paid once, not every month.` },
    ]);
    const L = lin(-rate, 1, fee), ctx = ctxWin(10, rate * 10 + fee);
    return {
      id: `writeOne-${n}`, family: 'writeOne', prompt: `A ${what} costs $${fee} to join plus $${rate} a month. Which equation gives the cost <i>c</i> in dollars after <i>m</i> months?`,
      board: `\\$${fee}\\text{ once} + \\$${rate}\\text{ a month}`, input: 'choice', ...c,
      solution: [`Each month adds $${rate}: ${rate}<i>m</i>. The start fee adds $${fee} once.`, `<i>c</i> = ${rate}<i>m</i> + ${fee}. Check: after 2 months, ${rate * 2 + fee} dollars.`],
      picture: { sys: pic({ ...ctx, names: ['months m', 'cost c ($)'], eqs: [`c = ${rate}m + ${fee}`], lines: [{ L, col: 'first', at: 'solve' }], pts: [{ p: [0, fee], col: 'first', at: 'solve', label: `$${fee}` }] }) },
    };
  }
  const t = pick(R, CTX), pa = pick(R, t.pa), pb = pick(R, t.pb);
  const na = int(R, 3, 12), nb = int(R, 3, 12), T = pa * na + pb * nb;
  const A = `<i>${t.la}</i>`, B = `<i>${t.lb}</i>`;
  const c = choose(R, [
    { t: `${pa}${A} + ${pb}${B} = ${T}`, ok: true, say: `Yes: $${pa} for each ${t.a}, $${pb} for each ${t.b}, $${T} in all.` },
    { t: `${A} + ${B} = ${T}`, mc: MC.countValue, say: `${A} + ${B} counts the ${t.what}. $${T} is money, so each count is multiplied by its price.` },
    { t: `${pb}${A} + ${pa}${B} = ${T}`, mc: MC.swapRates, say: `${A} counts the ${t.a} ${t.what}, so it goes with the ${t.a} price, $${pa}.` },
    { t: `(${pa} + ${A}) + (${pb} + ${B}) = ${T}`, mc: MC.coefAdd, say: `$${pa} for EACH ${t.a} ${t.what.replace(/s$/, '')} is ${pa} times ${A}: ${pa}${A}.` },
  ]);
  const L = lin(pa, pb, T), ctx = ctxWin(T / pa, T / pb);
  return {
    id: `writeOne-${n}`, family: 'writeOne', prompt: `${t.a[0]!.toUpperCase() + t.a.slice(1)} ${t.what} cost $${pa}, ${t.b} ${t.what} cost $${pb}. A group spends $${T}. With ${A} ${t.a} and ${B} ${t.b} ${t.what}, which equation fits?`,
    board: `\\$${pa},\\ \\$${pb},\\ \\$${T}`, input: 'choice', ...c,
    solution: [`Money from ${t.a} ${t.what}: ${pa}${A}. From ${t.b} ${t.what}: ${pb}${B}.`, `Together: ${pa}${A} + ${pb}${B} = ${T}. One equation, many possible pairs.`],
    picture: { sys: pic({ ...ctx, names: [`${t.a} ${t.la}`, `${t.b} ${t.lb}`], eqs: [`${pa}${t.la} + ${pb}${t.lb} = ${T}`], lines: [{ L, col: 'first', at: 'solve' }], pts: [{ p: [na, nb], col: 'link', at: 'solve' }] }) },
  };
};
const fillCount: Gen = (R, n) => {
  for (;;) {
    const t = pick(R, CTX), pa = pick(R, t.pa), pb = pick(R, t.pb);
    const na = int(R, 2, 12), nb = int(R, 2, 12), T = pa * na + pb * nb;
    const swapped = (T - pb * na) / pa;
    const A = `<i>${t.la}</i>`, B = `<i>${t.lb}</i>`;
    const ctx = ctxWin(T / pa, T / pb);
    const L = lin(pa, pb, T);
    return {
      id: `fillCount-${n}`, family: 'fillCount', prompt: `<b class="a">${pa}${A} + ${pb}${B} = ${T}</b> is the money from ${A} ${t.a} and ${B} ${t.b} ${t.what}. If ${na} ${t.a} ${t.what} were sold, how many ${t.b} ${t.what}?`,
      board: `${pa}${t.la} + ${pb}${t.lb} = ${T},\\ \\ ${t.la} = ${na}`, input: 'num', unit: `${t.b} ${t.what}`, answer: { kind: 'num', v: nb },
      check: r => {
        if (r.kind !== 'num' || !Number.isFinite(r.v)) return { ok: false, say: 'Type a number.' };
        if (near(r.v, nb)) return { ok: true, say: `Yes: ${pa} × ${na} + ${pb} × ${nb} = ${T}. The pair (${na}, ${nb}) fits.` };
        if (isInt(swapped) && near(r.v, swapped) && !near(swapped, nb)) return { ok: false, mc: MC.swapRates, say: `${na} is the number of ${t.a} ${t.what}, so it goes with $${pa}: ${pa} × ${na} = ${pa * na}.` };
        if (near(r.v, T - pa * na)) return { ok: false, say: `$${T - pa * na} is the money left for ${t.b} ${t.what}. Divide by $${pb} each.` };
        return { ok: false, say: `Put ${A} = ${na} in: ${pa} × ${na} + ${pb}${B} = ${T}. Then solve for ${B}.` };
      },
      solution: [`${pa} × ${na} = ${pa * na}, so ${pb}${B} = ${T} − ${pa * na} = ${T - pa * na}.`, `${B} = ${T - pa * na} ÷ ${pb} = ${nb}.`],
      picture: { sys: pic({ ...ctx, names: [`${t.a} ${t.la}`, `${t.b} ${t.lb}`], eqs: [`${pa}${t.la} + ${pb}${t.lb} = ${T}`], lines: [{ L, col: 'first', at: 'solve' }],
        guides: [{ x: na, col: 'pick', at: 'start' }], pts: [{ p: [na, nb], col: 'link', at: 'solve', label: `(${na}, ${nb})` }], work: [`${pa}(${na}) + ${pb}${t.lb} = ${T}`, `${t.lb} = ${nb}`] }) },
    };
  }
};
const writeSystem: Gen = (R, n) => {
  const t = pick(R, CTX), pa = pick(R, t.pa), pb = pick(R, t.pb);
  const na = int(R, 3, 14), nb = int(R, 3, 14), N = na + nb, T = pa * na + pb * nb;
  const A = `<i>${t.la}</i>`, B = `<i>${t.lb}</i>`;
  const c = choose(R, [
    { t: `${A} + ${B} = ${N} and ${pa}${A} + ${pb}${B} = ${T}`, ok: true, say: `Yes: one equation counts the ${t.what}, the other adds up the money. The same ${A} and ${B} in both.` },
    { t: `${A} + ${B} = ${T} and ${pa}${A} + ${pb}${B} = ${N}`, mc: MC.countValue, say: `${N} is how many ${t.what}: that goes with ${A} + ${B}. The $${T} goes with the prices.` },
    { t: `${A} + ${B} = ${N} and ${pb}${A} + ${pa}${B} = ${T}`, mc: MC.swapRates, say: `${A} counts the ${t.a} ${t.what}, so it goes with $${pa}.` },
    { t: `<i>x</i> + <i>x</i> = ${N} and ${pa}<i>x</i> + ${pb}<i>x</i> = ${T}`, mc: MC.oneLetter, say: `The two counts can be different numbers, so they need two different letters.` },
  ]);
  const L1 = lin(1, 1, N), L2 = lin(pa, pb, T), ctx = ctxWin(Math.max(N, T / pa), Math.max(N, T / pb));
  return {
    id: `writeSystem-${n}`, family: 'writeSystem', prompt: `${N} ${t.what} were sold: ${t.a} ones at $${pa} and ${t.b} ones at $${pb}, for $${T} in all. Let ${A} = the number of ${t.a} ${t.what} and ${B} = the number of ${t.b} ${t.what}. Which system fits?`,
    board: `${N}\\text{ ${t.what}},\\ \\$${T}`, input: 'choice', ...c,
    solution: [`How many: ${A} + ${B} = ${N}. How much money: ${pa}${A} + ${pb}${B} = ${T}.`, `Solving gives (${na}, ${nb}): ${na} ${t.a} and ${nb} ${t.b} ${t.what}.`],
    picture: { sys: pic({ ...ctx, names: [`${t.a} ${t.la}`, `${t.b} ${t.lb}`], eqs: [`${t.la} + ${t.lb} = ${N}`, `${pa}${t.la} + ${pb}${t.lb} = ${T}`],
      lines: [{ L: L1, col: 'first', at: 'solve' }, { L: L2, col: 'second', at: 'solve' }], cross: [na, nb] }) },
  };
};
const TIMES = [
  { a: 'students', b: 'teachers', la: 's', lb: 't' }, { a: 'cars', b: 'buses', la: 'c', lb: 'b' }, { a: 'songs', b: 'albums', la: 's', lb: 'a' },
  { a: 'chairs', b: 'tables', la: 'c', lb: 't' }, { a: 'fans', b: 'players', la: 'f', lb: 'p' }, { a: 'cookies', b: 'kids', la: 'c', lb: 'k' },
] as const;
const timesAsMany: Gen = (R, n) => {
  const t = pick(R, TIMES), k = int(R, 2, 9);
  const A = `<i>${t.la}</i>`, B = `<i>${t.lb}</i>`;
  const c = choose(R, [
    { t: `${A} = ${k}${B}`, ok: true, say: `Yes: there are more ${t.a}, so ${t.la} is the big one: ${t.la} = ${k} × ${t.lb}.` },
    { t: `${k}${A} = ${B}`, mc: MC.reverseTimes, say: `Test it: with ${t.lb} = 2 ${t.b}, ${k}${A} = 2 gives fewer ${t.a}. There should be ${k * 2} ${t.a}.` },
    { t: `${A} + ${k} = ${B}`, say: `"Times as many" multiplies; it does not add.` },
    { t: `${A} = ${B} + ${k}`, say: `"${k} times as many" means ${k} × ${t.lb}, not ${k} more.` },
  ]);
  const L = lin(1, -k, 0), ctx = ctxWin(10, 10 * k);
  return {
    id: `timesAsMany-${n}`, family: 'timesAsMany', prompt: `There are ${k} times as many ${t.a} as ${t.b}. With ${A} = the number of ${t.a} and ${B} = the number of ${t.b}, which equation is right?`,
    board: `${k}\\times\\text{ as many ${t.a} as ${t.b}}`, input: 'choice', ...c,
    solution: [`Test numbers: 2 ${t.b} means ${2 * k} ${t.a}.`, `${t.la} = ${k}${t.lb}: ${2 * k} = ${k} × 2 ✓. ${k}${t.la} = ${t.lb} would give ${k * 2 * k} = 2 ✗.`],
    picture: { sys: pic({ win: { x0: 0, y0: 0, x1: ctx.win.y1, y1: ctx.win.x1 }, gx: ctx.gy, gy: ctx.gx, names: [`${t.a} ${t.la}`, `${t.b} ${t.lb}`], eqs: [`${t.la} = ${k}${t.lb}`],
      lines: [{ L, col: 'first', at: 'solve' }], pts: [{ p: [2 * k, 2], col: 'link', at: 'solve', label: `(${2 * k}, 2)` }] }) },
  };
};

// =====================================================================================================================
// 20. verify in the originals
// =====================================================================================================================
const verify: Gen = (R, n) => {
  for (;;) {
    const { sol, L1, L2, q1, q2 } = sysWithNeighbours(R);
    const kind = pick(R, ['right', 'one1', 'one2', 'derived'] as const);
    let p: V = sol;
    const S = add(L1, L2);
    if (kind === 'one1') p = q1;
    if (kind === 'one2') p = q2;
    if (kind === 'derived') {
      // a point on the sum line that fits neither original
      if (near(S.b, 0) || near(S.a, 0)) continue;
      const x = sol[0] + pick(R, [1, -1, 2]); const y = yAt(S, x);
      if (!isInt(y) || Math.abs(y) > 7 || on(L1, [x, y]) || on(L2, [x, y])) continue;
      p = [x, y];
    }
    const f1 = on(L1, p), f2 = on(L2, p);
    const name = pick(R, ['Max', 'Ana', 'Leo', 'Nia', 'Gus', 'Ruth']);
    const yesMc = kind === 'derived' ? MC.derivedCheck : MC.oneCond;
    const why = kind === 'derived' ? ` ${name} checked it only in ${htmlLin(S)}, the equation from adding.` : kind !== 'right' ? ` ${name} checked it only in the equation used last.` : '';
    const c = choose(R, [
      { t: 'Yes: it makes both original equations true', ok: f1 && f2, mc: f1 && f2 ? undefined : yesMc, say: f1 && f2 ? `Yes: ${subH(L1, p)} = ${nH(L1.c)} and ${subH(L2, p)} = ${nH(L2.c)}.` : `Check BOTH originals. ${!f1 ? `${subH(L1, p)} = ${nH(lhsOf(L1, p))}, not ${nH(L1.c)}.` : `${subH(L2, p)} = ${nH(lhsOf(L2, p))}, not ${nH(L2.c)}.`}` },
      { t: 'No: it fails the first equation only', ok: !f1 && f2, say: !f1 && f2 ? `Right: ${subH(L1, p)} = ${nH(lhsOf(L1, p))}, not ${nH(L1.c)}.` : `Test each original: first ${f1 ? '✓' : '✗'}, second ${f2 ? '✓' : '✗'}.` },
      { t: 'No: it fails the second equation only', ok: f1 && !f2, say: f1 && !f2 ? `Right: ${subH(L2, p)} = ${nH(lhsOf(L2, p))}, not ${nH(L2.c)}.` : `Test each original: first ${f1 ? '✓' : '✗'}, second ${f2 ? '✓' : '✗'}.` },
      { t: 'No: it fails both equations', ok: !f1 && !f2, say: !f1 && !f2 ? 'Right: it fits neither original equation.' : `Test each original: first ${f1 ? '✓' : '✗'}, second ${f2 ? '✓' : '✗'}.` },
    ]);
    const e = eqT(L1, L2);
    return {
      id: `verify-${n}`, family: 'verify', prompt: `${name} solved ${sysH(L1, L2)} and got <b>${pairH(p)}</b>.${kind === 'derived' ? why : ''} Check it in the ORIGINAL equations. Is it the solution?`,
      board: `${board2(e)} \\qquad ${pairT(p)}`, input: 'choice', ...c,
      solution: [`First: ${subH(L1, p)} = ${nH(lhsOf(L1, p))} ${f1 ? '✓' : `≠ ${nH(L1.c)} ✗`}.`, `Second: ${subH(L2, p)} = ${nH(lhsOf(L2, p))} ${f2 ? '✓' : `≠ ${nH(L2.c)} ✗`}.`, `The solution is ${pairH(sol)}.`],
      picture: { sys: pic({ win: winFor([sol, p]), eqs: e, lines: [{ L: L1, col: 'first', at: 'solve' }, { L: L2, col: 'second', at: 'solve' }],
        pts: [{ p, col: 'pick', at: 'start', label: pairP(p) }], cross: veq(p, sol) ? null : sol, work: [`${subT(L1, p)} = ${nT(lhsOf(L1, p))}`, `${subT(L2, p)} = ${nT(lhsOf(L2, p))}`] }) },
    };
  }
};
const findSlip: Gen = (R, n) => {
  for (;;) {
    const { sol, iso, L } = subSys(R);
    const m = slope(iso), k = yInt(iso);
    if (Math.abs(L.b) < 2) continue;
    const slip = pick(R, [1, 2, 4] as const);
    // the worked steps (TeX, on the board), with one slip carried through
    const ax = L.a, b = L.b, c = L.c;
    const coef = ax + b * m;
    const bs = `${b < 0 ? '-' : '+'} ${nT(Math.abs(b))}`;
    const s1ok = `${texExpr(ax, 0)} ${bs}(${texExpr(m, k)}) = ${nT(c)}`;
    let s1 = s1ok, cst = b * k;
    if (slip === 1) { s1 = `${texExpr(ax, 0)} ${bs} \\cdot ${texExpr(m, 0)} ${k < 0 ? '-' : '+'} ${nT(Math.abs(k))} = ${nT(c)}`; cst = k; }
    if (slip === 2) cst = -b * k;
    const xv = (c - cst) / coef;
    if (near(cst, b * k) && slip !== 4) continue;
    if (Math.abs(coef) < 1e-9 || !isInt(xv) || Math.abs(xv) > 20) continue;
    const yv = slip === 4 ? m * xv - k : m * xv + k;
    if (!isInt(yv)) continue;
    const steps = [s1, `${texExpr(coef, cst)} = ${nT(c)}`, `x = ${nT(xv)}`, `y = ${valLine(m, xv, slip === 4 ? -k : k)} = ${nT(yv)}`];
    const fixed = slip === 1 ? s1ok : slip === 2 ? `${texExpr(coef, b * k)} = ${nT(c)}` : `y = ${valLine(m, xv, k)} = ${nT(m * xv + k)}`;
    const opts: Opt[] = [1, 2, 3, 4].map(i => ({
      t: `Step ${i}`, ok: i === slip,
      say: i === slip ? (slip === 1 ? `Yes: the parentheses are missing, so ${nH(b)} multiplies only ${htmlExpr(m, 0)}.` : slip === 2 ? `Yes: ${nH(b)} × ${pn(k)} is ${nH(b * k)}, not ${nH(-b * k)}.` : `Yes: it should be ${Y} = ${valH(m, xv, k)}: the ${nH(k)} keeps its own sign.`)
        : `Step ${i} follows from the step before it. Look for the step where something changes that shouldn’t.`,
    }));
    opts.push({ t: 'No slip: it checks in the last line', mc: MC.derivedCheck, say: `It fits a rewritten line, not the originals: ${subH(L, [xv, yv])} = ${nH(lhsOf(L, [xv, yv]))}, not ${nH(c)}.` });
    // steps stay in order (Step 1 … Step 4, then "no slip"): a shuffled list of step numbers only confuses
    const c2 = { choices: opts.map(o => o.t), answer: { kind: 'choice', i: slip - 1 } as Response,
      check: (r: Response): Verdict => { const o = r.kind === 'choice' ? opts[r.i] : undefined; if (!o) return { ok: false, say: 'Pick one.' }; return o.ok ? { ok: true, say: o.say } : { ok: false, mc: o.mc, say: o.say }; } };
    const e = [texLin(iso, 'y'), texLin(L), ...steps.map((t, i) => `\\text{${i + 1}:}\\ {${t}}`)];
    return {
      id: `findSlip-${n}`, family: 'findSlip', prompt: `The board shows a solution of <b class="a">${htmlLin(iso, 'y')}</b> and <b class="b">${htmlLin(L)}</b> in four steps. One step has a slip. Which one?`,
      board: board2(e.slice(0, 2)), input: 'choice', ...c2,
      solution: [`Step ${slip} is the slip: ${pairH([xv, yv])} does not fit ${htmlLin(L)}.`, `Done right, the solution is ${pairH(sol)}.`],
      picture: { sys: pic({ win: winFor([sol]), eqs: e, lines: [{ L: iso, col: 'first', at: 'start' }, { L, col: 'second', at: 'start' }], cross: sol,
        work: [`\\text{step ${slip}:}\\ ${fixed}`, `(x, y) = ${pairT(sol)}`] }) },
    };
  }
};

// =====================================================================================================================
// 22. viability in context
// =====================================================================================================================
const viable: Gen = (R, n) => {
  const t = pick(R, [
    { a: 'buses', b: 'vans', ca: 'bus', group: 'vehicles', unit: 'seats', sa: [40, 44, 48], sb: [8, 10, 12] },
    { a: 'large boxes', b: 'small boxes', ca: 'large box', group: 'boxes', unit: 'books', sa: [12, 16, 20], sb: [4, 6, 8] },
    { a: 'round tables', b: 'square tables', ca: 'round table', group: 'tables', unit: 'seats', sa: [8, 10], sb: [4] },
  ] as const);
  for (;;) {
    const kind = pick(R, ['half', 'neg', 'ok'] as const);
    const A = pick(R, t.sa), B = pick(R, t.sb);
    const na = kind === 'half' ? int(R, 2, 6) + 0.5 : kind === 'neg' ? -int(R, 1, 3) : int(R, 2, 6);
    // a half count on both sides keeps the totals whole (never "8.5 boxes in all")
    const nb = kind === 'neg' ? int(R, 8, 20) : int(R, 2, 8) + (kind === 'half' ? 0.5 : 0);
    const N = na + nb, S = A * na + B * nb;
    if (!isInt(S) || S <= 0) continue;
    const opts: Opt[] = kind === 'half' ? [
      { t: `Not possible: ${nP(na)} ${t.a} is not a whole number`, ok: true, say: `Right. The equations are solved exactly, but you can't have half a ${t.ca}, so no plan fits both conditions.` },
      { t: `Round: ${Math.ceil(na)} ${t.a} and ${Math.floor(nb)} ${t.b}`, mc: MC.rounds, say: `Rounding breaks the totals: ${Math.ceil(na)} ${t.a} and ${Math.floor(nb)} ${t.b} no longer fit both conditions.` },
      { t: `${nP(na)} ${t.a} and ${nP(nb)} ${t.b} is the answer`, mc: MC.allReals, say: `The algebra is right, but the context needs whole ${t.a}. A count can't be ${nP(na)}.` },
    ] : kind === 'neg' ? [
      { t: 'Not possible: a count can’t be negative', ok: true, say: `Right: ${nP(na)} ${t.a} makes no sense. These conditions can't both be met.` },
      { t: `${-na} ${t.a} and ${nP(nb)} ${t.b} (drop the minus)`, say: 'Dropping the minus changes the totals. The exact solution has a negative count, so it does not fit.' },
      { t: `${nP(na)} ${t.a} and ${nP(nb)} ${t.b} is the answer`, mc: MC.allReals, say: `The algebra is right, but a number of ${t.a} can't be negative.` },
    ] : [
      { t: `It works: ${na} ${t.a} and ${nP(nb)} ${t.b}`, ok: true, say: 'Yes: whole, nonnegative counts that fit both conditions.' },
      { t: 'Not possible: the numbers are too small', say: 'Whole, nonnegative counts are fine. Check: they fit both totals.' },
      { t: `Round up to be safe: ${na + 1} ${t.a}`, mc: MC.rounds, say: `${na} is exact and whole already; changing it breaks the totals.` },
    ];
    const c = choose(R, opts);
    const L1 = lin(1, 1, N), L2 = lin(A, B, S);
    const ctx = ctxWin(Math.max(N, 4), Math.max(N, 4));
    const la = t.a[0]!, lb = t.b[0]! === la ? 'q' : t.b[0]!;
    const e = [`${la} + ${lb} = ${N}`, `${A}${la} + ${B}${lb} = ${S}`];
    return {
      id: `viable-${n}`, family: 'viable', prompt: `${N} ${t.group} hold ${S} ${t.unit}: ${t.a} hold ${A} each, ${t.b} hold ${B} each. Solving the system gives <b>${nP(na)} ${t.a} and ${nP(nb)} ${t.b}</b>. What does that mean?`,
      board: board2(e), input: 'choice', ...c,
      solution: [`Check the math: ${nP(na)} + ${nP(nb)} = ${N} and ${A} × ${pn(na)} + ${B} × ${nP(nb)} = ${S}. The algebra is right.`, kind === 'ok' ? 'The counts are whole and not negative, so the plan works.' : `But counts of ${t.a} must be whole and not negative. This solution can't happen.`],
      picture: kind !== 'neg' ? { sys: pic({ ...ctx, names: [t.a, t.b], eqs: e, lines: [{ L: L1, col: 'first', at: 'start' }, { L: L2, col: 'second', at: 'start' }], cross: [na, nb], crossLabel: `(${nP(na)}, ${nP(nb)})` }) } : undefined,
    };
  }
};
const planMeaning: Gen = (R, n) => {
  for (;;) {
    const same = R() < 0.3;
    const r1 = pick(R, [10, 15, 20, 25]), f1 = pick(R, [20, 40, 50, 60, 80]);
    const r2 = same ? r1 : pick(R, [20, 25, 30, 35, 40].filter(x => x !== r1)), f2 = same ? f1 + pick(R, [20, 30, -10]) : pick(R, [0, 10, 20]);
    if (f2 < 0) continue;
    const L1 = lin(-r1, 1, f1), L2 = lin(-r2, 1, f2);
    const s = solve(L1, L2);
    if (!same && (s.kind !== 'one' || !isInt(s.x) || s.x <= 0 || s.x > 10)) continue;
    const [pA, pB] = shuffle(R, ['A', 'B']);
    const m = s.kind === 'one' ? s.x : 0, cst = s.kind === 'one' ? s.y : 0;
    const opts: Opt[] = same ? [
      { t: 'They never cost the same: same monthly rate, different start fees', ok: true, say: 'Yes: parallel lines. The gap from the start fee never closes.' },
      { t: 'They cost the same at month 0', mc: MC.zeroVsNone, say: `At month 0 they cost $${f1} and $${f2}: not the same. And the gap stays $${Math.abs(f2 - f1)} every month.` },
      { t: 'After a while, when the cheaper plan catches up', mc: MC.offscreen, say: 'Both go up by the same amount each month, so the cheaper one stays cheaper forever.' },
    ] : [
      { t: `After ${m} ${m === 1 ? 'month' : 'months'}, both plans cost $${cst}`, ok: true, say: `Yes: (${m}, ${cst}) is on both lines: same month, same cost.` },
      { t: `After ${cst} months, both plans cost $${m}`, mc: MC.reversed, say: `The first number is the month (x), the second the cost (y): ${m} ${m === 1 ? 'month' : 'months'}, $${cst}.` },
      { t: `It means ${m} ${m === 1 ? 'month' : 'months'}`, mc: MC.stops, say: `Give the whole meaning: after ${m} months, the cost is the same, $${cst}.` },
      { t: `Plan ${pA} is cheaper for the first ${cst} months`, say: `${cst} is a cost in dollars, not a number of months.` },
    ];
    const c = choose(R, opts);
    const ctx = ctxWin(10, Math.max(r1, r2) * 10 + Math.max(f1, f2));
    const h1 = `<i>c</i> = ${r1}<i>m</i> + ${f1}`, h2 = f2 ? `<i>c</i> = ${r2}<i>m</i> + ${f2}` : `<i>c</i> = ${r2}<i>m</i>`;
    const t1 = `c = ${r1}m + ${f1}`, t2 = f2 ? `c = ${r2}m + ${f2}` : `c = ${r2}m`;
    return {
      id: `planMeaning-${n}`, family: 'planMeaning',
      prompt: same ? `Plan ${pA}: <b class="a">${h1}</b>. Plan ${pB}: <b class="b">${h2}</b> (cost <i>c</i> in dollars after <i>m</i> months). Solving gives a false statement. What does it mean?`
        : `Plan ${pA}: <b class="a">${h1}</b>. Plan ${pB}: <b class="b">${h2}</b> (cost <i>c</i> in dollars after <i>m</i> months). The solution is <b>(${m}, ${cst})</b>. What does it mean?`,
      board: `${t1} \\qquad ${t2}`, input: 'choice', ...c,
      solution: same ? [`Both plans add $${r1} a month; they start $${Math.abs(f2 - f1)} apart.`, 'The lines are parallel: the plans never cost the same.'] : [`(${m}, ${cst}) is on both lines: month ${m}, cost $${cst}.`, `After ${m} ${m === 1 ? 'month' : 'months'} both plans cost $${cst}; before or after that, one is cheaper.`],
      picture: { sys: pic({ ...ctx, names: ['months m', 'cost c ($)'], eqs: [t1, t2], lines: [{ L: L1, col: 'first', at: 'start' }, { L: L2, col: 'second', at: 'start' }],
        cross: same ? null : [m, cst], crossLabel: same ? undefined : `(${m}, $${cst})` }) },
    };
  }
};

// =====================================================================================================================
// 23. systems from lines through points
// =====================================================================================================================
const twoPoints: Gen = (R, n) => {
  for (;;) {
    const sol: V = [int(R, -3, 4), int(R, -3, 4)];
    const d1 = pick(R, [[1, 2], [1, -2], [2, 1], [1, 3], [1, 1], [2, -1], [1, -1]] as [number, number][]);
    const d2 = pick(R, [[1, -1], [1, 1], [2, -1], [1, -3], [1, 2], [3, 1], [1, 0]] as [number, number][]);
    if (d1[0] * d2[1] === d1[1] * d2[0]) continue;
    const t = [int(R, -3, -1), int(R, 1, 2), int(R, -2, -1), int(R, 1, 3)];
    const P1: V = [sol[0] + t[0]! * d1[0], sol[1] + t[0]! * d1[1]], P2: V = [sol[0] + t[1]! * d1[0], sol[1] + t[1]! * d1[1]];
    const P3: V = [sol[0] + t[2]! * d2[0], sol[1] + t[2]! * d2[1]], P4: V = [sol[0] + t[3]! * d2[0], sol[1] + t[3]! * d2[1]];
    const pts = [P1, P2, P3, P4];
    if (pts.some(p => Math.abs(p[0]) > 6 || Math.abs(p[1]) > 7)) continue;
    const L1 = through(P1, P2), L2 = through(P3, P4);
    // rise/run inverted: slopes flipped through the first point of each line
    const inv = (A: V, B: V): Lin | null => (B[1] === A[1] ? null : through(A, [A[0] + (B[1] - A[1]), A[1] + (B[0] - A[0])]));
    const I1 = inv(P1, P2), I2 = inv(P3, P4);
    const alts: { p: V; mc?: string; say: string }[] = [];
    if (I1 && I2) { const s = solve(I1, I2); if (s.kind === 'one' && isInt(s.x) && isInt(s.y) && !veq([s.x, s.y], sol)) alts.push({ p: [s.x, s.y], mc: MC.riseRun, say: 'Slope is rise over run: the change in y divided by the change in x.' }); }
    const table = R() < 0.4;
    const desc = (A: V, B: V, cls: string, k: string) => table
      ? `<b class="${cls}">line ${k}</b>: <i>x</i> = ${nH(A[0])}, ${nH(B[0])} → <i>y</i> = ${nH(A[1])}, ${nH(B[1])}`
      : `<b class="${cls}">line ${k}</b> through ${pairH(A)} and ${pairH(B)}`;
    const m1 = (P2[1] - P1[1]) / (P2[0] - P1[0]);
    const eqs = [texLin(L1.a < 0 ? scale(L1, -1) : L1), texLin(L2.a < 0 ? scale(L2, -1) : L2)];
    // the board shows what the kid is given (the points); the equations are the work
    const e = [`\\text{line 1: } ${pairT(P1)},\\ ${pairT(P2)}`, `\\text{line 2: } ${pairT(P3)},\\ ${pairT(P4)}`];
    return {
      id: `twoPoints-${n}`, family: 'twoPoints', prompt: `${desc(P1, P2, 'a', '1')}; ${desc(P3, P4, 'b', '2')}. Where do the lines cross?`,
      board: board2(e), input: 'pair', ...PAIR, answer: { kind: 'pair', x: sol[0], y: sol[1] }, check: pairCheck(sol, [L1, L2], { alts }),
      solution: [`Line 1: slope = ${nH(P2[1] - P1[1])} ÷ ${nH(P2[0] - P1[0])} = ${nH(m1)}; its equation is ${htmlLin(L1.a < 0 ? scale(L1, -1) : L1)}.`, `Line 2: ${htmlLin(L2.a < 0 ? scale(L2, -1) : L2)}.`, `Solve the system: they cross at ${pairH(sol)}.`],
      picture: { sys: pic({ win: winFor([...pts, sol], 1), eqs: e, lines: [{ L: L1, col: 'first', at: 'solve' }, { L: L2, col: 'second', at: 'solve' }],
        pts: [...[P1, P2].map(p => ({ p, col: 'first', at: 'start' } as PicPt)), ...[P3, P4].map(p => ({ p, col: 'second', at: 'start' } as PicPt))], cross: sol, work: [...eqs, `(x, y) = ${pairT(sol)}`] }) },
    };
  }
};
const meetOrNot: Gen = (R, n) => {
  for (;;) {
    const kind = pick(R, ['one', 'none', 'inf'] as Kind3[]);
    const d1 = pick(R, [[1, 2], [1, -1], [2, 1], [1, 1], [2, -1], [1, 3]] as [number, number][]);
    const P1: V = [int(R, -4, 0), int(R, -3, 3)], P2: V = [P1[0] + d1[0] * int(R, 1, 2), P1[1] + d1[1] * int(R, 1, 2)];
    let P3: V, P4: V;
    if (kind === 'none') { const off = pick(R, [2, 3, -2, -3]); P3 = [P1[0] + int(R, 0, 2), P1[1] + off + 0]; P3 = [P3[0], P3[1]]; P4 = [P3[0] + d1[0] * int(R, 1, 2), P3[1] + d1[1] * int(R, 1, 2)]; if (on(through(P1, P2), P3)) continue; }
    else if (kind === 'inf') { P3 = [P1[0] + d1[0] * 2, P1[1] + d1[1] * 2]; P4 = [P1[0] - d1[0], P1[1] - d1[1]]; if (veq(P3, P2) || veq(P4, P2)) P4 = [P1[0] + d1[0] * 3, P1[1] + d1[1] * 3]; }
    else { const d2 = pick(R, [[1, -2], [1, 0], [2, -1], [1, -1], [1, 3]] as [number, number][]); if (d1[0] * d2[1] === d1[1] * d2[0]) continue; P3 = [int(R, -1, 3), int(R, -3, 3)]; P4 = [P3[0] + d2[0] * 2, P3[1] + d2[1] * 2]; }
    const pts = [P1, P2, P3, P4];
    if (pts.some(p => Math.abs(p[0]) > 7 || Math.abs(p[1]) > 7) || veq(P3, P4)) continue;
    const L1 = through(P1, P2), L2 = through(P3, P4);
    const s = solve(L1, L2);
    if (s.kind !== kind) continue;
    if (s.kind === 'one' && (Math.abs(s.x) > 7 || Math.abs(s.y) > 7)) continue;
    const m1 = slope(L1), m2 = near(L2.b, 0) ? NaN : slope(L2);
    const c = choose(R, [
      { t: 'No: they are parallel', ok: kind === 'none', mc: kind === 'inf' ? MC.uniqueEq : undefined, say: kind === 'none' ? `Yes: both slopes are ${nH(m1)} and the lines are apart, so they never meet.` : kind === 'inf' ? `All four points are on ONE line: different point pairs can name the same line.` : `The slopes differ (${nH(m1)} and ${Number.isFinite(m2) ? nH(m2) : 'a vertical line'}), so they meet once.` },
      { t: 'Yes, at exactly one point', ok: kind === 'one', mc: kind !== 'one' ? MC.exactlyOne : undefined, say: kind === 'one' ? `Yes: different slopes, one crossing at ${pairH([(s as { x: number }).x, (s as { y: number }).y])}.` : kind === 'none' ? `Same slope ${nH(m1)}, different lines: they never meet. Not every pair of lines crosses.` : `It is the same line twice: they share every point, not one.` },
      { t: 'Yes, everywhere: it is the same line', ok: kind === 'inf', mc: kind === 'none' ? MC.offscreen : undefined, say: kind === 'inf' ? 'Yes: line 2’s points are on line 1, so it is the same line.' : kind === 'none' ? `Line 2's points are not on line 1: ${pairH(P3)} is off it. Two separate parallel lines.` : 'The slopes differ, so the lines are different and cross once.' },
    ]);
    const eqs = [texLin(L1.a < 0 ? scale(L1, -1) : L1), texLin(L2.a < 0 ? scale(L2, -1) : L2)];
    const e = [`\\text{line 1: } ${pairT(P1)},\\ ${pairT(P2)}`, `\\text{line 2: } ${pairT(P3)},\\ ${pairT(P4)}`];
    return {
      id: `meetOrNot-${n}`, family: 'meetOrNot', prompt: `<b class="a">Line 1</b> goes through ${pairH(P1)} and ${pairH(P2)}. <b class="b">Line 2</b> goes through ${pairH(P3)} and ${pairH(P4)}. Do the lines meet?`,
      board: `${pairT(P1)},\\ ${pairT(P2)} \\qquad ${pairT(P3)},\\ ${pairT(P4)}`, input: 'choice', ...c,
      solution: [`Slope of line 1: ${nH(m1)}. Slope of line 2: ${Number.isFinite(m2) ? nH(m2) : 'none (vertical)'}.`, kind === 'one' ? 'Different slopes: the lines cross once.' : kind === 'none' ? 'Same slope, and line 2’s points are off line 1: parallel, no meeting point.' : 'Same slope, and line 2’s points are on line 1: the same line.'],
      picture: { sys: pic({ win: winFor(s.kind === 'one' ? [...pts, [s.x, s.y]] : pts, 1), eqs: e, lines: [{ L: L1, col: 'first', at: 'solve' }, { L: L2, col: 'second', at: 'solve', dashed: kind === 'inf' }],
        pts: [...[P1, P2].map(p => ({ p, col: 'first', at: 'start' } as PicPt)), ...[P3, P4].map(p => ({ p, col: 'second', at: 'start' } as PicPt))], cross: s.kind === 'one' ? [s.x, s.y] : null, work: eqs }) },
    };
  }
};

/** a choice item's worked lines end on the right choice (docs/lessons/QUALITY_LAYER.md: "So: <right choice>" when no
 *  line marks it yet), for every choice family */
const endsOnChoice = (g: Gen): Gen => (R, n, sg) => {
  const it = g(R, n, sg);
  if (it.input === 'choice' && it.answer.kind === 'choice' && it.choices) it.solution = endOnChoice(it.solution, it.choices[it.answer.i]!);
  return it;
};
export const GENERATORS: Record<FamilyId, Gen> = Object.fromEntries(Object.entries({
  onLine, makeSolution, howMany, pickPair, checkWork, readCross, pointPick, parallelGraph, howManySys, sameLine, solOrNot, subChoice, setEqual,
  subSolve, reportPair, isolate, whichVar, addEq, elimSolve, afterAdd, subEq, scaleOne, pickMult, clearFrac, ratSolve, zeroEq, chooseMethod,
  methodsAgree, graphRead, sketchTrap, estimate, writeOne, fillCount, writeSystem, timesAsMany, verify, findSlip, exactVsEst, viable, planMeaning,
  twoPoints, meetOrNot,
} satisfies Record<FamilyId, Gen>).map(([k, g]) => [k, endsOnChoice(g)])) as Record<FamilyId, Gen>;

