// items.ts: practice families for "Rotate: quarter turn and half turn" (grades 7-8, 8.G.A.1). Each family is one
// deep structure; a generator receives the sub-goal id and uses that sub-goal's cases (topic JSON `cases`).
// Every wrong option carries the catalogue misconception it shows (math-curriculum-essentials/misconceptions.json).
// Pure: no DOM, no canvas. Pictures are plain data (turnMaths.ts) the page draws. PROBES records, per item, typical
// wrong responses and the misconception id they must get (tests).
import { type Gen, type Item, type Response, type Verdict, A, B, int, pick, shuffle } from '../../runtime/item';
import {
  type Fig, type FlipLine, type GridPic, type Mark, type Motion, type ShapeName, type SpinPic, type TiltPic, type TurnPic, type V,
  apply, d2, dirLabel, DIR_WORDS, fitWin, middle, moveFig, onFigure, orient, picFits, picPoints, rotQ, sameSet, shape,
  SHAPE_WORDS, shiftFig, stepTex, stepWords, turnDir, turnTex, turnWords, vadd, veq, vsub,
} from './turnMaths';

export type FamilyId = 'watch' | 'amount' | 'armLength' | 'direction' | 'center' | 'describe' | 'pointer' | 'figure' | 'square'
  | 'distance' | 'steps' | 'pointTurn' | 'build' | 'slip' | 'motion' | 'order' | 'opposite' | 'symmetric' | 'target';
export const FAMILY_NAMES: Record<FamilyId, string> = {
  watch: 'Watch the turn',
  amount: 'How much of a turn?',
  armLength: 'Long arm, short arm',
  direction: 'Which way round?',
  center: 'The point that stays still',
  describe: 'Describe the turn',
  pointer: 'Turn the pointer',
  figure: 'Turn the whole figure',
  square: 'Still the same shape?',
  distance: 'Same distance from the pin',
  steps: 'Steps on dot paper',
  pointTurn: 'Turn a point by its steps',
  build: 'Corner by corner',
  slip: 'Spot the slip',
  motion: 'Slide, turn or flip?',
  order: 'The order of the corners',
  opposite: 'Clockwise or counterclockwise?',
  symmetric: 'More than one move',
  target: 'Onto the target',
};

export interface TurnItem extends Item { family: FamilyId; picture: TurnPic & Record<string, unknown> }
/** wrong responses with the misconception they must be classified as (tests) */
export const PROBES = new WeakMap<Item, { r: Response; mc: string }[]>();

const MC = {
  endPos: 'mc.transformations.motion-identified-with-end-position',
  armLen: 'mc.angles.angle-size-from-arm-length',
  smallQuarter: 'mc.transformations.any-small-turn-is-quarter-turn',
  halfFull: 'mc.transformations.misjudges-turn-amount',
  fixedDir: 'mc.transformations.turns-to-fixed-page-direction',
  onFig: 'mc.transformations.rotation-center-must-lie-on-figure',
  wrongCenter: 'mc.transformations.rotates-about-wrong-center',
  noParams: 'mc.transformations.names-motion-without-parameters',
  oneMotion: 'mc.transformations.end-image-determines-one-motion',
  oppMisjudged: 'mc.transformations.opposite-direction-turns-misjudged',
  degrees: 'mc.angles.misassigns-benchmark-turn-degree-values',
  prototype: 'mc.shapes.prototype-only-recognition',
  reflAsRot: 'mc.transformations.reflection-treated-as-rotation',
  onePointMoved: 'mc.transformations.moves-one-point-redraws-rest',
  distance: 'mc.transformations.rotation-ignores-distance-to-center',
  diagonal: 'mc.coordinate-geometry.independent-moves-replaced-by-diagonal-steps',
  countPoints: 'mc.count.counts-points-not-intervals',
  oneComponent: 'mc.transformations.rotates-one-step-component',
  length: 'mc.transformations.changes-length-when-rotating',
  reverse: 'mc.transformations.reverses-rotation-direction',
  anySlide: 'mc.transformations.calls-any-move-a-translation',
  rotRefl: 'mc.transformations.rotation-and-reflection-confused',
  reflSlide: 'mc.transformations.reflection-as-slide',
  neverMatch: 'mc.transformations.opposite-turn-directions-never-match',
  onePoint: 'mc.transformations.one-point-checked-for-whole-figure',
} as const;
export { MC };

// ---------- shared helpers ----------
interface Opt { t: string; ok?: boolean; say: string; mc?: string }
function choiceCheck(right: number, says: { say: string; mc?: string }[]) {
  return (r: Response): Verdict => {
    if (r.kind !== 'choice' || !says[r.i]) return { ok: false, say: 'Pick one answer.' };
    const s = says[r.i]!;
    return { ok: r.i === right, mc: r.i === right ? undefined : s.mc, say: s.say };
  };
}
/** a choice item from options (shuffled unless keep), with probes for every tagged wrong option */
function choiceItem(R: () => number, base: Omit<TurnItem, 'input' | 'choices' | 'answer' | 'check'>, opts: Opt[], keep = false): TurnItem {
  const seen = new Set<string>();
  const uniq = opts.filter(o => (seen.has(o.t) ? false : (seen.add(o.t), true)));
  const o = keep ? uniq : shuffle(R, uniq.slice());
  const right = o.findIndex(x => x.ok);
  if (right < 0 || o.filter(x => x.ok).length !== 1) throw new Error(`${base.id}: needs exactly one right option`);
  const it: TurnItem = { ...base, input: 'choice', choices: o.map(x => x.t), answer: { kind: 'choice', i: right }, check: choiceCheck(right, o.map(x => ({ say: x.say, mc: x.mc }))) };
  PROBES.set(it, o.flatMap((x, i) => (x.mc && !x.ok ? [{ r: { kind: 'choice', i } as Response, mc: x.mc }] : [])));
  return it;
}
/** numbered candidates (dots or pictures): the right one plus distractors, numbered 1-4 in a shuffled order (corners keep the letters) */
function lettered<T>(R: () => number, right: T, wrongs: { v: T; mc?: string; say: string }[], same: (a: T, b: T) => boolean, max = 4): { order: { v: T; ok: boolean; mc?: string; say: string; label: string }[] } {
  const all: { v: T; ok: boolean; mc?: string; say: string }[] = [{ v: right, ok: true, say: '' }];
  for (const w of wrongs) if (all.length < max && !all.some(a => same(a.v, w.v))) all.push({ ...w, ok: false });
  const order = shuffle(R, all).map((a, i) => ({ ...a, label: '1234'[i]! }));
  return { order };
}
const WHO = ['Maya', 'Leo', 'Ana', 'Sam', 'Kim', 'Ravi', 'Jo', 'Eli', 'Noor', 'Theo'];
const LOOKS = [{ look: 'spinner' as const, thing: 'spinner pointer' }, { look: 'clock' as const, thing: 'clock hand' }];
const EQUAL = (deg: number) => [0, 90, 180, 270].map(a => (deg + a) % 360);
const deg8 = (d: number) => d * 45;
/** retry a generator until its picture fits (pictures come from random placements) */
function fitted(make: () => TurnItem | null, tries = 60): TurnItem {
  for (let i = 0; i < tries; i++) {
    const it = make();
    if (it && picFits(it.picture) === null) return it;
  }
  throw new Error('rotations: no drawable item after many tries');
}
function gridPic(p: Omit<GridPic, 'kind' | 'win'>, min = 7): GridPic & Record<string, unknown> {
  const g: GridPic = { kind: 'grid', win: { x0: 0, y0: 0, x1: 1, y1: 1 }, ...p };
  g.win = fitWin(picPoints(g), min);
  return g as GridPic & Record<string, unknown>;
}
const spinPic = (p: Omit<SpinPic, 'kind'>) => ({ kind: 'spin', ...p }) as SpinPic & Record<string, unknown>;
const figSame = (a: Fig, b: Fig) => sameSet(a.pts, b.pts);
const figShapes: ShapeName[] = ['L', 'F', 'flag', 'tri'];
function figOf(R: () => number, names = figShapes): { fig: Fig; name: ShapeName } {
  const name = pick(R, names);
  const fig = name === 'L' ? shape('L', int(R, 2, 3), 3) : name === 'tri' ? shape('tri', 3, 2) : shape(name);
  return { fig, name };
}
const turnM = (c: V, q: number): Motion => ({ kind: 'turn', c, q });
const flipLetter = 'm';
const pinWord = (L = 'P') => `the pin ${B(L)}`;

// =====================================================================================================
// full-turn-unit: watch a full turn (or a half turn); same photos cannot tell no move from a full turn
const watch: Gen = (R, n) => {
  const mode = pick(R, ['full', 'full', 'same', 'half'] as const);
  const L = pick(R, LOOKS), deg = deg8(int(R, 0, 7)), cw = R() < 0.6, sgn = cw ? -1 : 1;
  const cuts = L.look === 'spinner' ? EQUAL(deg) : null;
  const base = { id: `watch-${mode}-${n}`, family: 'watch' as const, board: '' };
  if (mode === 'same') {
    const picture = spinPic({ spinners: [{ deg, cuts, look: L.look, label: 'before' }, { deg, cuts, look: L.look, label: 'after' }] });
    return choiceItem(R, { ...base, prompt: `A photo of a ${A(L.thing)} before, and one after. The two photos look exactly the same. What happened?`, picture,
      solution: ['No move and one full turn both end in the same place.', 'Two photos only show the end positions, not the path. You have to watch the turn to tell.'] }, [
      { t: 'It may not have moved, or it made a full turn: the photos can’t tell', ok: true, say: 'Right. A full turn ends exactly where it started, so the photos can’t tell it from no move.' },
      { t: 'It did not move', mc: MC.endPos, say: 'Maybe, but a full turn ends in the same place too. The photos show only the ends, not the motion.' },
      { t: 'It made exactly one full turn', mc: MC.endPos, say: 'Maybe, but it may also not have moved at all. Same end position, two different motions.' },
    ]);
  }
  const turn = mode === 'full' ? 360 * sgn : 180 * sgn;
  const picture = spinPic({ spinners: [{ deg, turn, cuts, look: L.look, watch: true }], solve: { i: 0, turn } });
  if (mode === 'full') return choiceItem(R, { ...base, prompt: `Watch the ${A(L.thing)}. It ends pointing the same way it started. What did it do?`, picture,
    solution: ['Follow the tip: it goes all the way around and comes back.', 'Once all the way around is one full turn: four quarter turns.'] }, [
    { t: 'It made one full turn', ok: true, say: 'Yes. It went all the way around and came back: one full turn.' },
    { t: 'It did not move: it ends where it started', mc: MC.endPos, say: 'It ends where it started, but you watched it go all the way around. Same end, different motion: that is a full turn.' },
    { t: 'It made a half turn', say: 'A half turn ends pointing the opposite way. This one came all the way back.' },
  ]);
  return choiceItem(R, { ...base, prompt: `Watch the ${A(L.thing)} turn. How much of a full turn did it make?`, picture,
    solution: ['It stops pointing the opposite way from where it started.', 'Half way around is a half turn: two quarter turns.'] }, [
    { t: 'A half turn', ok: true, say: 'Yes: it ends pointing the opposite way, half way around.' },
    { t: 'A full turn', mc: MC.halfFull, say: 'A full turn comes back to the start. This one stops half way, pointing the opposite way.' },
    { t: 'A quarter turn', say: 'A quarter turn is one of four equal parts of a full turn. This one went two of them.' },
  ]);
};

// quarter-turn-amount / half-turn-amount: read the amount from a curved arrow
const amount: Gen = (R, n, sg) => {
  const half = sg === 'half-turn-amount';
  const mode = half ? pick(R, ['half', 'half', 'twoQuarters'] as const) : pick(R, ['quarter', 'eighth', 'unequal'] as const);
  const deg = deg8(half ? int(R, 0, 7) : int(R, 0, 7)), sgn = R() < 0.5 ? -1 : 1;
  const base = { id: `amount-${mode}-${n}`, family: 'amount' as const, board: '4 \\times \\tfrac{1}{4}\\ \\text{turn} = 1\\ \\text{turn}' };
  if (mode === 'twoQuarters') {
    const it: TurnItem = { ...base, input: 'num', unit: 'quarter turns', prompt: `How many ${B('quarter turns')} in the same direction make ${B('a half turn')}?`,
      picture: spinPic({ spinners: [{ deg, turn: 180 * sgn, cuts: EQUAL(deg) }], solve: { i: 0, turn: 180 * sgn } }),
      solution: ['A full turn is 4 equal quarter turns.', 'Half of a full turn is half of 4 quarter turns: 2 quarter turns.'],
      answer: { kind: 'num', v: 2 },
      check: r => r.kind !== 'num' ? { ok: false, say: 'Type a number.' } : r.v === 2 ? { ok: true, say: 'Yes: two quarter turns, one after the other, make a half turn.' }
        : r.v === 4 ? { ok: false, mc: MC.halfFull, say: '4 quarter turns go all the way around: that is a full turn. A half turn is half of that.' }
          : { ok: false, say: 'Count the quarters on the guide: a half turn goes 2 of the 4 sections.' } };
    PROBES.set(it, [{ r: { kind: 'num', v: 4 }, mc: MC.halfFull }]);
    return it;
  }
  if (mode === 'unequal') {
    const a1 = pick(R, [50, 60, 120, 130]);
    const cuts = [0, a1, 180, 180 + pick(R, [40, 70, 110])].map(a => (deg + a) % 360);
    return choiceItem(R, { ...base, prompt: `This ${A('spinner')} has 4 sections. The pointer moves one section, along the arrow. Is that a quarter turn?`,
      picture: spinPic({ spinners: [{ deg, turn: -a1, cuts }] }),
      solution: ['A quarter turn is one of FOUR EQUAL parts of a full turn.', 'These 4 sections are not equal, so one section is not a quarter.'] }, [
      { t: 'No: the 4 sections are not equal, so one section is not a quarter', ok: true, say: 'Right. Quarters must be equal parts of the full turn.' },
      { t: 'Yes: it moved 1 of the 4 sections', mc: MC.smallQuarter, say: 'Only if the 4 sections were equal. Look: this section is not one fourth of the circle.' },
      { t: 'Yes: it turned clockwise', say: 'The direction does not tell the amount. A quarter is one of four EQUAL parts.' },
    ]);
  }
  const turn = (mode === 'quarter' ? 90 : mode === 'eighth' ? 45 : 180) * sgn;
  const picture = spinPic({ spinners: [{ deg, turn, cuts: EQUAL(deg) }], solve: { i: 0, turn } });
  const prompt = `The arrow shows how far the ${A('pointer')} turns. How much of a full turn is it?`;
  const sol = ['The guide splits a full turn into 4 equal quarters.', `Count the quarters the arrow covers: ${mode === 'quarter' ? 'one' : mode === 'eighth' ? 'less than one' : 'two'}.`];
  if (mode === 'quarter') return choiceItem(R, { ...base, prompt, picture, solution: sol }, [
    { t: 'A quarter turn', ok: true, say: 'Yes: one of the four equal parts of a full turn.' },
    { t: 'A half turn', say: 'A half turn covers two of the four quarters. This arrow covers one.' },
    { t: 'Less than a quarter turn', say: 'The arrow reaches the next guide line: exactly one quarter.' },
  ]);
  if (mode === 'eighth') return choiceItem(R, { ...base, prompt, picture, solution: sol }, [
    { t: 'Less than a quarter turn', ok: true, say: 'Yes: it stops half way to the next guide line.' },
    { t: 'A quarter turn', mc: MC.smallQuarter, say: 'A small turn is not always a quarter. A quarter reaches the next guide line; this one stops half way.' },
    { t: 'A half turn', say: 'A half turn ends pointing the opposite way. This turn is much smaller.' },
  ]);
  return choiceItem(R, { ...base, prompt, picture, solution: sol }, [
    { t: 'A half turn', ok: true, say: 'Yes: two quarters, half way around. It ends pointing the opposite way.' },
    { t: 'A full turn', mc: MC.halfFull, say: 'A full turn comes back to the start. This one stops half way, pointing the opposite way.' },
    { t: 'A quarter turn', say: 'The arrow covers two of the four quarters, not one.' },
  ]);
};

// quarter-turn-amount: a long and a short pointer; the amount of turn does not depend on the arm
const armLength: Gen = (R, n) => {
  const longFirst = R() < 0.5;
  const mode = pick(R, ['same', 'same', 'shortMore', 'longMore'] as const);
  const qs = mode === 'same' ? (R() < 0.5 ? [90, 90] : [180, 180]) : mode === 'shortMore' ? [90, 180] : [180, 90];   // [long, short]
  const sl = R() < 0.5 ? -1 : 1, ss = R() < 0.5 ? -1 : 1;
  const long = { deg: deg8(int(R, 0, 7)), turn: qs[0]! * sl, arm: 0.95, cuts: null }, short = { deg: deg8(int(R, 0, 7)), turn: qs[1]! * ss, arm: 0.45, cuts: null };
  const [a, b] = longFirst ? [long, short] : [short, long];
  const picture = spinPic({ spinners: [{ ...a, label: 'A' }, { ...b, label: 'B' }] });
  const longL = longFirst ? 'A' : 'B', shortL = longFirst ? 'B' : 'A';
  const right = mode === 'same' ? 'same' : mode === 'shortMore' ? shortL : longL;
  const word = (q: number) => (q === 90 ? 'a quarter turn' : 'a half turn');
  const opt = (L: string): Opt => ({ t: `Pointer ${L} turned more`, ok: right === L, mc: right !== L && L === longL ? MC.armLen : undefined,
    say: right === L ? `Yes: pointer ${L} turned ${word(L === longL ? qs[0]! : qs[1]!)}, the other only ${word(L === longL ? qs[1]! : qs[0]!)}.` : L === longL ? 'The long arm sweeps a bigger arc, but the amount of turn is how far it goes round, not how long it is.' : 'Compare how far round each one goes, in quarters of a full turn.' });
  return choiceItem(R, { id: `arm-${mode}-${n}`, family: 'armLength', board: '', prompt: `Pointer ${A('A')} and pointer ${A('B')} each turn along their arrow. Which one turned more?`, picture,
    solution: [`Pointer ${longL}: ${word(qs[0]!)}. Pointer ${shortL}: ${word(qs[1]!)}.`, 'The amount of turn is the part of a full turn; the length of the arm does not change it.'] }, [
    opt('A'), opt('B'),
    { t: 'They turned the same amount', ok: right === 'same', say: right === 'same' ? `Yes: both turned ${word(qs[0]!)}. A longer arm only makes a bigger arc.` : 'Count the quarters of each arrow: they are not the same.' },
  ], true);
};

// direction-cw-ccw: clockwise or counterclockwise, from any start
const direction: Gen = (R, n) => {
  const d = R() < 0.7 ? pick(R, [0, 0, 2, 4, 6]) : pick(R, [1, 3, 5, 7]), q = R() < 0.5 ? -1 : 1, end = turnDir(d, q);
  if (R() < 0.4) {
    // two spinners, the same start, arrows opposite ways: which shows the named direction?
    const aFirst = R() < 0.5, want = R() < 0.5 ? -1 : 1;
    const qa = aFirst ? want : -want;
    const picture = spinPic({ spinners: [{ deg: deg8(d), turn: qa * 90, cuts: EQUAL(deg8(d)), label: 'A' }, { deg: deg8(d), turn: -qa * 90, cuts: EQUAL(deg8(d)), label: 'B' }], solve: { i: aFirst ? 0 : 1, turn: want * 90 } });
    const right = aFirst ? 'A' : 'B', wrong = aFirst ? 'B' : 'A';
    const endW = turnDir(d, -want);
    const wMc = (want < 0 && endW === 2) || (want > 0 && endW === 6) ? MC.fixedDir : MC.reverse;
    return choiceItem(R, { id: `dir-which-${n}`, family: 'direction', board: '', prompt: `Both pointers start pointing ${DIR_WORDS[d]!}. Which arrow shows ${B(turnWords(want))}?`, picture,
      solution: ['Clockwise is the way a clock’s hands go: over the top to the right, then down.', `Arrow ${right} goes ${want < 0 ? 'that way' : 'against that way'}.`] }, [
      { t: `Arrow ${right}`, ok: true, say: `Yes: arrow ${right} turns ${want < 0 ? 'the way a clock’s hands go' : 'against the clock'}.` },
      { t: `Arrow ${wrong}`, mc: wMc, say: wMc === MC.fixedDir ? `Arrow ${wrong} ends pointing ${want < 0 ? 'right' : 'left'}, but the direction of a turn is about the way round, not where it ends.` : `Arrow ${wrong} goes the other way round.` },
      { t: 'Both arrows', say: 'They go opposite ways round: only one of them is ' + (want < 0 ? 'clockwise.' : 'counterclockwise.') },
    ], true);
  }
  const picture = spinPic({ spinners: [{ deg: deg8(d), turn: q * 90, cuts: EQUAL(deg8(d)) }], clock: true, solve: { i: 0, turn: q * 90 } });
  const cwMc = end === 2 ? MC.fixedDir : MC.reverse, ccwMc = end === 6 ? MC.fixedDir : MC.reverse;
  return choiceItem(R, { id: `dir-${n}`, family: 'direction', board: '', prompt: `The ${A('pointer')} starts pointing ${DIR_WORDS[d]} and turns along the arrow. Describe the turn.`, picture,
    solution: ['Clockwise is the way a clock’s hands go: over the top to the right, then down.', `This pointer goes from ${DIR_WORDS[d]} to ${DIR_WORDS[end]} the ${q < 0 ? 'clockwise' : 'counterclockwise'} way: ${turnWords(q)}.`] }, [
    { t: 'A quarter turn clockwise', ok: q < 0, mc: q < 0 ? undefined : cwMc, say: q < 0 ? 'Yes: it goes round the way a clock’s hands go.' : end === 2 ? 'It ends pointing right, but that does not make it clockwise. Follow the arrow: it goes against the clock.' : 'Follow the arrow: it goes against the way a clock’s hands go.' },
    { t: 'A quarter turn counterclockwise', ok: q > 0, mc: q > 0 ? undefined : ccwMc, say: q > 0 ? 'Yes: against the way a clock’s hands go.' : end === 6 ? 'It ends pointing left, but that does not make it counterclockwise. Follow the arrow: it goes the clock’s way.' : 'Follow the arrow: it goes the way a clock’s hands go.' },
    { t: 'A half turn', say: 'A half turn ends pointing the opposite way. This one turned one quarter.' },
  ], true);
};

// center-fixed-point: watch a turn, find the point that stays still
const center: Gen = (R, n) => fitted(() => {
  const mode = pick(R, ['middle', 'corner', 'outside'] as const);
  const { fig: f0, name } = figOf(R, ['L', 'flag', 'tri']);
  const fig = shiftFig(f0, [int(R, -1, 1), int(R, -1, 1)]);
  const cornerIdx = int(R, 0, fig.pts.length - 1);
  const mid = middle(fig.pts);
  let pin: V;
  if (mode === 'middle') pin = pinOnFigure(R, fig, false);
  else if (mode === 'corner') pin = fig.pts[cornerIdx]!;
  else pin = vadd(fig.pts[0]!, [pick(R, [-3, -2, 4, 5]), pick(R, [-2, -3, 4])]);
  if (mode === 'outside' && onFigure(pin, fig.pts)) return null;
  const others: { p: V; mc: string; say: string }[] = [];
  const far = [...fig.pts].sort((a, b) => d2(b, pin) - d2(a, pin))[0]!;
  if (mode !== 'middle' && !veq(mid, pin)) others.push({ p: mid, mc: mode === 'outside' ? MC.onFig : MC.wrongCenter, say: 'That point is in the middle of the tile, but watch it: it moves in a circle.' });
  others.push({ p: far, mc: mode === 'outside' ? MC.onFig : MC.wrongCenter, say: 'Watch that point: it travels around a circle. It is not the center.' });
  if (others.length < 2) { const c2 = fig.pts.find(p => !veq(p, far) && !veq(p, pin) && d2(p, far) > 1); if (c2) others.push({ p: c2, mc: MC.wrongCenter, say: 'That corner moves too: watch it go around.' }); }
  if (others.length < 2) return null;
  const q = pick(R, [-1, 1, 2]);
  const labels = shuffle(R, ['P', 'Q', 'R']);
  const pts: (Mark & { ok: boolean; mc?: string; say: string })[] = [{ p: pin, label: labels[0]!, ok: true, say: 'Yes: that point never moves. It is the center of the turn.' }, ...others.slice(0, 2).map((o, i) => ({ ...o, label: labels[i + 1]!, ok: false }))];
  if (pts.some((a, i) => pts.some((b, j) => j > i && d2(a.p, b.p) < 1))) return null;
  const sk = mode === 'middle' ? `A ${A(SHAPE_WORDS[name])} spins on a pin through its middle, like a pinwheel.` : mode === 'corner' ? `A ${A(SHAPE_WORDS[name])} swings on a pin at one corner, like a door on its hinge.` : `A ${A(SHAPE_WORDS[name])} is stuck on a clear sheet. The sheet turns about a pin that is not on the tile.`;
  const sheet = mode === 'outside';
  const picture = gridPic({ pin, pinHidden: true, sheet, start: { pts: fig.pts, marks: [] }, points: pts.map(p => ({ p: p.p, label: p.label })), watch: turnM(pin, q), solve: { motion: turnM(pin, q), to: moveFig(turnM(pin, q), { pts: fig.pts, marks: [] }) } });
  const opts = [...pts].sort((a, b) => a.label.localeCompare(b.label)).map(p => ({ t: `Point ${p.label}`, ok: p.ok, mc: p.mc, say: p.say }));
  return choiceItem(R, { id: `center-${mode}-${n}`, family: 'center', board: '', prompt: `${sk} Watch the turn. Which point stays still?`, picture,
    solution: [`Point ${pts[0]!.label} stays still: it is the center of the turn.`, mode === 'outside' ? 'The center does not have to be on the tile. Every point of the sheet circles around it.' : 'Every other point travels around it on a circle.'] }, opts, true);
});

// describe-rotation: a complete description (center, direction, amount); endpoint-only pictures; same pictures
const describe: Gen = (R, n) => {
  const mode = pick(R, ['path', 'path', 'ends', 'none', 'same'] as const);
  if (mode === 'same') {
    const deg = deg8(int(R, 0, 7));
    return choiceItem(R, { id: `describe-same-${n}`, family: 'describe', board: '', prompt: `A ${A('pointer')} is shown before and after. It either did not move, or it made one full turn. Can the two pictures tell which?`,
      picture: spinPic({ spinners: [{ deg, cuts: EQUAL(deg), label: 'before' }, { deg, cuts: EQUAL(deg), label: 'after' }] }),
      solution: ['No move and a full turn end in the same place.', 'Only the path, watched as it happens, can tell them apart.'] }, [
      { t: 'No: the pictures look the same either way. Only watching the turn can tell.', ok: true, say: 'Right. The end pictures are the same for both motions.' },
      { t: 'Yes: it did not move, because it ends in the same place', mc: MC.endPos, say: 'A full turn ends in the same place too. The pictures cannot tell.' },
      { t: 'Yes: it made a full turn, because it is back at the start', mc: MC.endPos, say: 'No move at all is also back at the start. The pictures cannot tell.' },
    ]);
  }
  return fitted(() => {
    const { fig: f0, name } = figOf(R);
    const fig = shiftFig(f0, [int(R, -2, 0), int(R, -2, 0)]);
    const pin = pinOnFigure(R, fig, R() < 0.5);
    const q = pick(R, [-1, 1, 2, -2]);
    const W = SHAPE_WORDS[name];
    if (mode === 'path') {
      const after = moveFig(turnM(pin, q), fig);
      // Q: a plain corner of the tile (not a marked one), away from the pin, for the wrong-center option
      const Q = fig.pts.find(p => !veq(p, pin) && d2(p, pin) >= 2 && !fig.marks.some(m => veq(m.p, p)));
      if (!Q) return null;
      const picture = gridPic({ pin, pinLabel: 'P', start: fig, after, arrows: [{ q, r: 1.6 }], points: [{ p: Q, label: 'Q' }], solve: { motion: turnM(pin, q), to: after } });
      const opts: Opt[] = [
        { t: `${turnWords(q)} about P`, ok: true, say: 'Yes: the center, the direction and the amount. Anyone could repeat that turn.' },
        { t: 'It turned', mc: MC.noParams, say: 'True, but not enough to repeat it. Say the center, the direction and the amount.' },
        { t: `${turnWords(q)} about Q`, mc: MC.wrongCenter, say: 'Look at the pin: the tile turns about P, not Q. Q moves.' },
      ];
      if (Math.abs(q) === 1) opts.push({ t: `${turnWords(-q)} about P`, mc: MC.reverse, say: 'Follow the arrow: it goes the other way round.' });
      else opts.push({ t: `a quarter turn ${q < 0 ? 'clockwise' : 'counterclockwise'} about P`, say: 'The arrow goes half way around: two quarters.' });
      return choiceItem(R, { id: `describe-path-${n}`, family: 'describe', board: '', prompt: `The ${A(W)} turns along the arrow. Describe the turn completely.`, picture,
        solution: ['Center: the pin P stays still.', `Direction: follow the arrow, ${q < 0 ? 'clockwise' : 'counterclockwise'}.`, `Amount: ${Math.abs(q) === 1 ? 'one quarter' : 'two quarters, a half'} of a full turn.`] }, opts);
    }
    const allowed = '<b>Only quarter turns and half turns about P are allowed.</b>';
    if (mode === 'ends') {
      const after = moveFig(turnM(pin, q), fig);
      const picture = gridPic({ pin, pinLabel: 'P', start: fig, after, solve: { motion: turnM(pin, q), to: after } });
      const opts: Opt[] = Math.abs(q) === 1 ? [
        { t: `${turnWords(q)} about P`, ok: true, say: 'Yes: try it with the sheet pinned at P and every corner lands on the new picture.' },
        { t: `${turnWords(-q)} about P`, mc: MC.reverse, say: 'Turn it that way and the tile ends up on the other side. Check one corner, like A.' },
        { t: 'a half turn about P', say: 'A half turn would make it point the opposite way. Look at corner A.' },
        { t: 'none of the allowed turns', say: 'One of them does fit: try each with the sheet pinned at P.' },
      ] : [
        { t: 'a half turn about P, clockwise or counterclockwise', ok: true, say: 'Yes: half way around ends in the same place either way.' },
        { t: 'only a half turn clockwise about P', mc: MC.oneMotion, say: 'Clockwise works, but so does counterclockwise: half way around either way lands in the same place.' },
        { t: 'a quarter turn clockwise about P', say: 'A quarter turn would make it face sideways. This one is upside down.' },
        { t: 'none of the allowed turns', say: 'A half turn about P fits: check corner A.' },
      ];
      return choiceItem(R, { id: `describe-ends-${n}`, family: 'describe', board: turnTex(q, false) + '\\ \\text{or}\\ ' + turnTex(Math.abs(q) === 1 ? 2 : 1, false) + '\\,?', prompt: `${allowed} The ${A(W)} moved from the amber picture to the lavender one. Which allowed turn could have done it?`, picture,
        solution: ['Pin the sheet at P and try each allowed turn.', `${turnWords(q, Math.abs(q) === 1)} about P puts every corner on the new picture${Math.abs(q) === 2 ? ' (either direction)' : ''}.`] }, opts);
    }
    // none: the new picture is a flip or a slide, so no allowed turn fits
    const isFlip = R() < 0.6;
    const m: Motion = isFlip ? { kind: 'flip', line: R() < 0.5 ? { kind: 'v', x: Math.round(middle(fig.pts)[0]) + int(R, 1, 2) } : { kind: 'h', y: Math.round(middle(fig.pts)[1]) - int(R, 2, 3) } } : { kind: 'slide', d: [pick(R, [-3, 3, 4]), pick(R, [-2, 0, 2])] };
    const after = moveFig(m, fig);
    for (const qq of [1, -1, 2]) if (sameSet(moveFig(turnM(pin, qq), fig).pts, after.pts)) return null;
    const picture = gridPic({ pin, pinLabel: 'P', start: fig, after, solve: { motion: m, to: after } });
    return choiceItem(R, { id: `describe-none-${n}`, family: 'describe', board: '\\tfrac{1}{4}\\ \\text{turn or}\\ \\tfrac{1}{2}\\ \\text{turn}\\,?', prompt: `${allowed} The ${A(W)} moved from the amber picture to the lavender one. Which allowed turn could have done it?`, picture,
      solution: [isFlip ? 'The new picture is a mirror image: the corners A → B → C go the other way round.' : 'The new picture faces the same way: it slid.', 'No quarter turn or half turn about P gives it.'] }, [
      { t: 'none of the allowed turns', ok: true, say: isFlip ? 'Right: it is a mirror image, and no turn makes a mirror image.' : 'Right: it still faces the same way, so it slid. No turn about P does that.' },
      { t: 'a half turn about P', mc: isFlip ? MC.reflAsRot : undefined, say: isFlip ? 'Upside down is not enough: trace A → B → C. It goes the other way round, so it is a flip, not a turn.' : 'A half turn would make it face the opposite way. It faces the same way.' },
      { t: 'a quarter turn clockwise about P', say: 'Try it: pinned at P, a quarter turn clockwise puts the tile somewhere else.' },
      { t: 'a quarter turn counterclockwise about P', say: 'Try it: pinned at P, a quarter turn counterclockwise puts the tile somewhere else.' },
    ]);
  });
};

// execute-pointer-quarter-turn / execute-pointer-half-turn / pointer-endpoint-prediction
const pointer: Gen = (R, n, sg) => {
  const predict = sg === 'pointer-endpoint-prediction';
  const half = sg === 'execute-pointer-half-turn' || (predict && R() < 0.4);
  const d = predict ? (R() < 0.5 ? pick(R, [1, 3, 5, 7]) : pick(R, [0, 2, 4, 6])) : (R() < 0.35 ? 0 : R() < 0.6 ? pick(R, [2, 4, 6]) : pick(R, [1, 3, 5, 7]));
  const q = half ? (R() < 0.5 ? -2 : 2) : (R() < 0.55 ? -1 : 1);
  const L = pick(R, LOOKS);
  const ans = turnDir(d, q);
  const opts: Opt[] = [{ t: dirLabel(ans), ok: true, say: `Yes: ${turnWords(q, !half)} takes it from ${DIR_WORDS[d]} to ${DIR_WORDS[ans]}.` }];
  const add = (dd: number, mc: string | undefined, say: string) => { if (opts.length < 4 && !opts.some(o => o.t === dirLabel(dd))) opts.push({ t: dirLabel(dd), mc, say }); };
  if (!half) {
    add(turnDir(d, -q), MC.oppMisjudged, `That is ${turnWords(-q)}: the other way round. ${q < 0 ? 'Clockwise goes the way a clock’s hands go.' : 'Counterclockwise goes against the clock.'}`);
    add(q < 0 ? 2 : 6, MC.fixedDir, `${q < 0 ? 'Clockwise does not mean “ends pointing right”' : 'Counterclockwise does not mean “ends pointing left”'}: it is a way of turning. Start from ${DIR_WORDS[d]} and go one quarter.`);
    add(turnDir(d, 2), undefined, 'That is half way around: two quarters. Go only one.');
    add(d, undefined, 'It has to move: one quarter of a full turn.');
  } else {
    add(turnDir(d, -1), MC.degrees, 'That is only a quarter turn. A half turn is two quarters: it ends pointing the opposite way.');
    add(turnDir(d, 1), MC.degrees, 'That is only a quarter turn. A half turn is two quarters: it ends pointing the opposite way.');
    add(d, MC.halfFull, 'Back to the start is a full turn. A half turn stops half way, pointing the opposite way.');
  }
  const two = half && !predict && R() < 0.35;
  const how = two ? `a quarter turn ${q < 0 ? 'clockwise' : 'counterclockwise'}, then another quarter turn the same way` : turnWords(q, !half || R() < 0.5);
  const picture = spinPic({ spinners: [{ deg: deg8(d), cuts: predict ? null : EQUAL(deg8(d)), look: L.look }], solve: { i: 0, turn: q * 90 } });
  return choiceItem(R, { id: `pointer-${half ? 'half' : 'quarter'}-${n}`, family: 'pointer', board: turnTex(q, !half), prompt: `${predict ? 'No guide this time. ' : ''}The ${A(L.thing)} points ${B(DIR_WORDS[d]!)}. Turn it ${B(how)}. Where does it point now?`, picture,
    solution: [half ? 'A half turn is two quarter turns: it ends pointing the opposite way.' : `${q < 0 ? 'Clockwise: the way a clock’s hands go.' : 'Counterclockwise: against the clock.'} One quarter of the way around.`, `From ${DIR_WORDS[d]} that ends ${DIR_WORDS[ans]}.`] }, opts);
};

// rotate-whole-figure / external-center / predict-image: pick the right picture of the turned figure
/** a center on the figure: a marked corner, or a dot on the tile that is not a corner */
function pinOnFigure(R: () => number, fig: Fig, vertex: boolean): V {
  if (!vertex) {
    const xs = fig.pts.map(p => p[0]), ys = fig.pts.map(p => p[1]), on: V[] = [];
    for (let x = Math.min(...xs); x <= Math.max(...xs); x++) for (let y = Math.min(...ys); y <= Math.max(...ys); y++) {
      const p: V = [x, y];
      if (onFigure(p, fig.pts) && !fig.pts.some(c => veq(c, p))) on.push(p);
    }
    if (on.length) return pick(R, on);
  }
  return fig.marks[int(R, 0, 2)]!.p;
}
function placeFig(R: () => number, sg: string | undefined): { fig: Fig; name: ShapeName; pin: V; where: 'on' | 'vertex' | 'off' } | null {
  const { fig: f0, name } = figOf(R);
  const off = sg === 'external-center' || (sg === 'predict-image' && R() < 0.6) || (sg === 'draw-image-grid' && R() < 0.5);
  if (!off) {
    const fig = shiftFig(f0, [-1, -1]);
    const inside = R() < 0.5;
    return { fig, name, pin: pinOnFigure(R, fig, !inside), where: inside ? 'on' : 'vertex' };
  }
  const fig = shiftFig(f0, [pick(R, [1, 2, -3, -4]), pick(R, [1, 2, -3, -4])]);
  const pin: V = [0, 0];
  if (onFigure(pin, fig.pts)) return null;
  const gap = Math.min(...fig.pts.map(p => Math.max(Math.abs(p[0]), Math.abs(p[1]))));
  if (gap < 1 || gap > 3) return null;
  return { fig, name, pin, where: 'off' };
}
const mirrorInPlace = (F: Fig): Fig => moveFig({ kind: 'flip', line: { kind: 'v', x: middle(F.pts)[0] } }, F);
const figure: Gen = (R, n, sg) => fitted(() => {
  const P = placeFig(R, sg);
  if (!P) return null;
  const { fig, name, pin } = P;
  const q = sg === 'external-center' && R() < 0.4 ? 2 : pick(R, [-1, 1, 2, -1]);
  const image = moveFig(turnM(pin, q), fig);
  const W = SHAPE_WORDS[name];
  const wrongs: { v: Fig; mc?: string; say: string }[] = [];
  const mir = { v: mirrorInPlace(image), mc: MC.reflAsRot, say: 'That one is a mirror image: trace A → B → C, it goes the other way round. A turn never does that.' };
  const ownMid = middle(fig.pts);
  const inPlace = { v: moveFig(turnM(ownMid, q), fig), mc: sg === 'predict-image' ? MC.distance : MC.wrongCenter, say: `That one faces the right way, but it turned about its own middle. It turns about ${'P'}: every point keeps its distance from P.` };
  const rev = { v: moveFig(turnM(pin, -q), fig), mc: MC.reverse, say: `That one turned ${turnWords(-q)}: the other way round.` };
  const slidA = { v: shiftFig(fig, vsub(image.marks[0]!.p, fig.marks[0]!.p)), mc: MC.onePointMoved, say: 'Only corner A was moved there; the rest just slid along without turning. Every point turns.' };
  const quarter = { v: moveFig(turnM(pin, q > 0 ? 1 : -1), fig), say: 'That one went only a quarter of the way round.' };
  const order = sg === 'rotate-whole-figure' ? [mir, slidA, Math.abs(q) === 1 ? rev : quarter, inPlace]
    : sg === 'external-center' ? [inPlace, Math.abs(q) === 1 ? rev : quarter, mir, slidA]
      : [inPlace, mir, Math.abs(q) === 1 ? rev : quarter, slidA];
  for (const w of order) if (!figSame(w.v, image) && !figSame(w.v, fig)) wrongs.push(w);
  const { order: cands } = lettered(R, image, wrongs, figSame, 4);
  if (cands.length < 3) return null;
  const picture = gridPic({ pin, pinLabel: 'P', sheet: P.where === 'off', start: fig, arrows: [{ q, r: 1.5 }], cands: cands.map(c => ({ label: c.label, fig: c.v })), solve: { motion: turnM(pin, q), to: image } });
  const opts = cands.map(c => ({ t: `Picture ${c.label}`, ok: c.ok, mc: c.mc, say: c.ok ? 'Yes: every corner turned the same amount, the same way, about P, and kept its distance from P.' : c.say }));
  return choiceItem(R, { id: `figure-${P.where}-${n}`, family: 'figure', board: `${turnTex(q)}\\ \\text{about}\\ P`,
    prompt: `The ${A(W)} turns ${B(turnWords(q))} about ${pinWord()}${P.where === 'off' ? ', which is not on the tile (the tile is on a clear sheet pinned at P)' : ''}. Which picture shows where it lands?`, picture,
    solution: ['Every point turns the same amount, the same way, about P.', 'Each point keeps its distance from P, so the tile keeps its shape and size.', 'The corners A → B → C still go the same way round.'] }, opts, true);
});

// rotate-whole-figure: a square turned onto its corner is still a square
const square: Gen = (R, n) => {
  const sq = R() < 0.65, deg = pick(R, [45, 30, 60]);
  const who = shuffle(R, WHO.slice()), w0 = who[0]!, w1 = who[1]!;
  const picture = { kind: 'tilt', shape: sq ? 'square' : 'rect', deg } as TiltPic & Record<string, unknown>;
  return choiceItem(R, { id: `square-${n}`, family: 'square', board: '', prompt: `${w0} turns a ${A(sq ? 'square' : 'rectangle')} card so it rests on a corner. ${w1} says: “Now it is a diamond, not a ${sq ? 'square' : 'rectangle'}.” What is the card now?`, picture,
    solution: ['A turn moves the card but does not change its sides or its corners.', `It is the same card: still a ${sq ? 'square' : 'rectangle'}, just turned.`] }, [
    { t: `Still a ${sq ? 'square' : 'rectangle'}: same card, same sides, same square corners`, ok: true, say: 'Yes. Turning changes where it points, not what shape it is.' },
    { t: `A diamond: it is not a ${sq ? 'square' : 'rectangle'} any more`, mc: MC.prototype, say: 'It is the same card. Its sides and corners did not change; only the way it sits on the page did.' },
    { t: sq ? 'A rectangle: its sides changed' : 'A square: its sides changed', mc: MC.length, say: 'A turn never changes a side’s length. Same card, same sides.' },
  ]);
};

// external-center: a marked point on a pinned sheet keeps its distance from the pin
const distance: Gen = (R, n) => fitted(() => {
  const numMode = R() < 0.3;
  const nAx = int(R, 2, 4), axis = int(R, 0, 3);
  const step: V = numMode || R() < 0.6 ? ([[nAx, 0], [0, nAx], [-nAx, 0], [0, -nAx]] as V[])[axis]! : [pick(R, [1, 2, 3, -2, -3]), pick(R, [1, 2, -1, -2])];
  const pin: V = [0, 0], Pp = vadd(pin, step);
  const q = pick(R, [-1, 1, 2]);
  const img = rotQ(Pp, pin, q);
  // a small triangle on the sheet with P as one corner
  const dir: V = [Math.sign(step[0]) || 1, Math.sign(step[1]) || 1];
  const tri: Fig = { pts: [Pp, vadd(Pp, [dir[0] * 2, 0]), vadd(Pp, [0, dir[1] * 1])], marks: [{ p: Pp, label: 'A' }] };
  if (tri.pts.some(p => veq(p, pin))) return null;
  const onLine = step[0] === 0 || step[1] === 0;
  if (numMode) {
    const dist = Math.abs(step[0] + step[1]);
    const picture = gridPic({ pin, pinLabel: 'P', sheet: true, start: tri, segs: [Pp], arrows: [{ q, r: 1.2 }], solve: { motion: turnM(pin, q), to: moveFig(turnM(pin, q), tri) } });
    const it: TurnItem = { id: `distance-num-${n}`, family: 'distance', board: `A\\colon\\ ${stepTex(step)}`, input: 'num', unit: 'steps from P',
      prompt: `Corner ${A('A')} is ${dist} steps from ${pinWord()}. The sheet makes ${B(turnWords(q))} about P. How far from P is A after the turn?`, picture,
      solution: ['The string from P to A turns like a pointer. It does not stretch or shrink.', `So A is still ${dist} steps from P.`], answer: { kind: 'num', v: dist },
      check: r => r.kind !== 'num' ? { ok: false, say: 'Type a number.' } : r.v === dist ? { ok: true, say: `Yes: still ${dist} steps. Every point keeps its distance from the center.` } : { ok: false, mc: MC.distance, say: `The string from P to A keeps its length while it turns: still ${dist} steps.` } };
    PROBES.set(it, [{ r: { kind: 'num', v: dist + 1 }, mc: MC.distance }, { r: { kind: 'num', v: dist - 1 }, mc: MC.distance }]);
    return it;
  }
  const rs = vsub(img, pin);
  const wrongs: { v: V; mc?: string; say: string }[] = [];
  if (onLine) {
    const u: V = [Math.sign(rs[0]), Math.sign(rs[1])];
    wrongs.push({ v: vadd(img, u), mc: MC.distance, say: 'That dot is in the right direction but too far: the string from P keeps its length.' });
    wrongs.push({ v: vsub(img, u), mc: MC.distance, say: 'That dot is in the right direction but too close: the string from P keeps its length.' });
  }
  if (Math.abs(q) === 1) wrongs.push({ v: rotQ(Pp, pin, -q), mc: MC.reverse, say: `That is ${turnWords(-q)}: the other way round.` });
  else { wrongs.push({ v: rotQ(Pp, pin, 1), mc: MC.degrees, say: 'That is only a quarter turn. A half turn goes to the opposite side of P.' }); wrongs.push({ v: rotQ(Pp, pin, -1), mc: MC.degrees, say: 'That is only a quarter turn. A half turn goes to the opposite side of P.' }); }
  if (!onLine) { const sw: V = vadd(pin, [rs[0] * 2, rs[1] * 2]); wrongs.push({ v: sw, mc: MC.distance, say: 'Right direction, but twice as far: the string from P keeps its length.' }); }
  wrongs.push({ v: rotQ(Pp, pin, q > 0 ? 2 : 2) as V, say: 'That is the opposite side of P: a half turn.' });
  const { order } = lettered(R, img, wrongs.filter(w => !veq(w.v, pin) && !veq(w.v, Pp)), veq, 4);
  if (order.length < 3) return null;
  const picture = gridPic({ pin, pinLabel: 'P', sheet: true, start: tri, segs: [Pp], arrows: [{ q, r: 1.2 }], dots: order.map(o => ({ p: o.v, label: o.label })), solve: { motion: turnM(pin, q), to: moveFig(turnM(pin, q), tri), point: img } });
  return choiceItem(R, { id: `distance-dots-${n}`, family: 'distance', board: `A\\colon\\ ${stepTex(step)}`, prompt: `Corner ${A('A')} is tied to ${pinWord()} by a string. The sheet makes ${B(turnWords(q))} about P. Which dot does A land on?`, picture,
    solution: [`A starts ${stepWords(step)} from P.`, 'The string turns like a pointer and keeps its length.', `A lands ${stepWords(rs)} from P.`] }, order.map(o => ({ t: `Dot ${o.label}`, ok: o.ok, mc: o.mc, say: o.ok ? 'Yes: turned the right way, the right amount, and still the same distance from P.' : o.say })), true);
});

// grid-steps-locate: count spaces, not dots; horizontal then vertical
const steps: Gen = (R, n) => fitted(() => {
  const mode = pick(R, ['single', 'two', 'two', 'read'] as const);
  const pin: V = [0, 0];
  const sx = R() < 0.5 ? 1 : -1, sy = R() < 0.5 ? 1 : -1;
  if (mode === 'read') {
    const h = int(R, 1, 5), v = int(R, 1, 4), d: V = [h * sx, v * sy];
    const lead = sx > 0 ? 'right' : 'left', op = sy > 0 ? 'up' : 'down';
    const picture = gridPic({ pin, pinLabel: 'P', point: { p: d, label: 'A' }, steps: { d, when: 'solve' }, solve: { motion: { kind: 'none' }, point: d } });
    const it: TurnItem = { id: `steps-read-${n}`, family: 'steps', board: '', input: 'pair', pairLead: lead, pairOp: op,
      prompt: `How many steps ${B(lead)}, then how many steps ${B(op)}, from ${pinWord()} to the point ${A('A')}? Count the spaces between dots.`, picture,
      solution: [`Go ${lead} along the row first: ${h} spaces.`, `Then ${op}: ${v} spaces. Don’t count the dot you start on.`], answer: { kind: 'pair', x: h, y: v },
      check: r => {
        if (r.kind !== 'pair') return { ok: false, say: 'Fill in both boxes.' };
        if (r.x === h && r.y === v) return { ok: true, say: `Yes: ${h} ${lead}, ${v} ${op}.` };
        if ((r.x === h + 1 && (r.y === v || r.y === v + 1)) || (r.y === v + 1 && r.x === h)) return { ok: false, mc: MC.countPoints, say: 'That counts the dots, including the one you start on. Count the spaces (the jumps) between dots.' };
        if (r.x === v && r.y === h) return { ok: false, say: `Swapped: first ${lead}, then ${op}.` };
        return { ok: false, say: 'Count the jumps from dot to dot: first along the row, then up or down the column.' };
      } };
    PROBES.set(it, [{ r: { kind: 'pair', x: h + 1, y: v + 1 }, mc: MC.countPoints }]);
    return it;
  }
  let d: V; const wrongs: { v: V; mc?: string; say: string }[] = [];
  if (mode === 'single') {
    const k = int(R, 2, 6), horiz = R() < 0.6;
    d = horiz ? [k * sx, 0] : [0, k * sy];
    const u: V = horiz ? [sx, 0] : [0, sy];
    wrongs.push({ v: vsub(d, u), mc: MC.countPoints, say: 'One short: that counts the dot you start on. Count the jumps.' });
    wrongs.push({ v: vadd(d, u), mc: MC.countPoints, say: 'One too far: count the jumps between dots, not the dots.' });
    wrongs.push({ v: horiz ? [0, k * sy] : [k * sx, 0], say: horiz ? 'That goes up or down. This move goes along the row.' : 'That goes along the row. This move goes up or down.' });
  } else {
    let h = int(R, 1, 5), v = int(R, 1, 4);
    if (h === v) h = h === 5 ? 4 : h + 1;
    d = [h * sx, v * sy];
    wrongs.push({ v: [h * sx, h * sy], mc: MC.diagonal, say: `That takes ${h} slanted steps. The moves are separate: ${h} along the row, then ${v} up or down.` });
    if (h >= 2 && v >= 2) wrongs.push({ v: [(h - 1) * sx, (v - 1) * sy], mc: MC.countPoints, say: 'One short each way: that counts the starting dot. Count the jumps.' });
    else wrongs.push({ v: [(h + 1) * sx, (v + 1) * sy], mc: MC.countPoints, say: 'One too far each way: count the jumps between dots, not the dots.' });
    wrongs.push({ v: [v * sx, h * sy], say: 'Swapped: go along the row first, then up or down.' });
    wrongs.push({ v: [h * sx, -v * sy], say: `Check the direction: ${v * sy > 0 ? 'up' : 'down'}.` });
  }
  const { order } = lettered(R, d, wrongs.filter(w => !veq(w.v, pin)), veq, 4);
  const picture = gridPic({ pin, pinLabel: 'P', dots: order.map(o => ({ p: o.v, label: o.label })), steps: { d, when: 'solve' }, solve: { motion: { kind: 'none' }, point: d } });
  return choiceItem(R, { id: `steps-${mode}-${n}`, family: 'steps', board: stepTex(d), prompt: `Start at ${pinWord()}. Go ${B(stepWords(d).replace(', ', ', then '))}. Which dot do you reach?`, picture,
    solution: ['Count the jumps between dots, not the dots: the dot you start on is 0.', mode === 'two' ? 'First along the row, then up or down: two separate moves.' : 'Stay on the row (or the column) the whole way.'] },
  order.map(o => ({ t: `Dot ${o.label}`, ok: o.ok, mc: o.mc, say: o.ok ? 'Yes: counted jump by jump.' : o.say })), true);
});

// rotate-point-grid: turn a point's steps from the center (each step direction turns like a pointer)
const pointTurn: Gen = (R, n) => fitted(() => {
  const onLine = R() < 0.4;
  const pin: V = [0, 0];
  let d: V;
  if (onLine) { const k = int(R, 2, 4); d = pick(R, [[k, 0], [0, k], [-k, 0], [0, -k]] as V[]); }
  else { const a = int(R, 1, 3); let b = int(R, 1, 3); if (a === b) b = a === 3 ? 1 : a + 1; d = [a * (R() < 0.5 ? 1 : -1), b * (R() < 0.5 ? 1 : -1)]; }
  const q = pick(R, [-1, -1, 1, 2]);
  const img = rotQ(d, pin, q), rs = vsub(img, pin);
  const wrongs: { v: V; mc?: string; say: string }[] = [];
  if (Math.abs(q) === 1) wrongs.push({ v: rotQ(d, pin, -q), mc: MC.reverse, say: `That is ${turnWords(-q)}: the other way round.` });
  if (!onLine) { const one = vadd(rotQ([d[0], 0], pin, q), [0, d[1]]); wrongs.push({ v: one, mc: MC.oneComponent, say: `That turns only the ${Math.abs(d[0])} ${d[0] > 0 ? 'right' : 'left'} and leaves the ${Math.abs(d[1])} ${d[1] > 0 ? 'up' : 'down'} as it was. Both steps turn.` }); }
  if (onLine) { const u: V = [Math.sign(rs[0]), Math.sign(rs[1])]; wrongs.push({ v: vsub(img, u), mc: MC.countPoints, say: 'One short: count the jumps between dots, not the dot you start on.' }); }
  if (!onLine) wrongs.push({ v: [rs[1], rs[0]] as V, say: 'Close: check which way each step points after the turn.' });
  if (Math.abs(q) === 2) { wrongs.push({ v: rotQ(d, pin, -1), mc: MC.degrees, say: 'That is a quarter turn. A half turn ends on the opposite side of P.' }); wrongs.push({ v: rotQ(d, pin, 1), mc: MC.degrees, say: 'That is a quarter turn. A half turn ends on the opposite side of P.' }); }
  else wrongs.push({ v: rotQ(d, pin, 2), say: 'That is a half turn: two quarters.' });
  const { order } = lettered(R, img, wrongs.filter(w => !veq(w.v, pin) && !veq(w.v, d)), veq, 4);
  if (order.length < 4) return null;
  const picture = gridPic({ pin, pinLabel: 'P', point: { p: d, label: 'A' }, arrows: [{ q, r: 1 }], steps: { d }, dots: order.map(o => ({ p: o.v, label: o.label })), solve: { motion: turnM(pin, q), point: img } });
  const sayTurn = (s: V) => stepWords(s);
  return choiceItem(R, { id: `pointTurn-${onLine ? 'line' : 'off'}-${n}`, family: 'pointTurn', board: `A\\colon\\ ${stepTex(d)}`,
    prompt: `${A('A')} is ${A(sayTurn(d))} from ${pinWord()}. Turn A ${B(turnWords(q))} about P. Which dot does it land on?`, picture,
    solution: ['Turn each step like a pointer: for a quarter turn clockwise, right → down, up → right, left → up, down → left.', `${sayTurn(d)} turns into ${sayTurn(rs)}.`, 'Count the steps the same: the turn keeps every distance.'] },
  order.map(o => ({ t: `Dot ${o.label}`, ok: o.ok, mc: o.mc, say: o.ok ? `Yes: ${sayTurn(d)} turns into ${sayTurn(rs)}.` : o.say })), true);
});

// draw-image-grid: build the image vertex by vertex (pick the right drawing); spot the slip in a drawing
function buildParts(R: () => number, sg?: string) {
  const name: ShapeName = R() < 0.6 ? 'L' : 'tri';
  const w = name === 'L' ? int(R, 2, 3) : 3, h = name === 'L' ? int(R, 3, 4) : 2;
  const atVertex = R() < 0.5;
  const f0 = shape(name, w, h);
  const fig = atVertex ? shiftFig(f0, [-1, -1]) : shiftFig(f0, [pick(R, [1, 2, -4]), pick(R, [1, 2, -4])]);
  const pin: V = atVertex ? fig.marks[int(R, 0, 2)]!.p : [0, 0];
  if (!atVertex && onFigure(pin, fig.pts)) return null;
  const q = pick(R, [-1, 1, 2, -1]);
  const image = moveFig(turnM(pin, q), fig);
  const long = name === 'L' ? shape('L', w, h + 1) : shape('tri', w + 1, h);
  const longFig = shiftFig(long, vsub(fig.marks[0]!.p, long.marks[0]!.p));
  const lengthChanged = moveFig(turnM(pin, q), longFig);
  const otherCenter = fig.marks.map(m => m.p).find(p => !veq(p, pin))!;
  const wrongCenter = moveFig(turnM(otherCenter, q), fig);
  const reverse = moveFig(turnM(pin, -q), fig);
  void sg;
  return { name, fig, pin, q, image, lengthChanged, wrongCenter, reverse, atVertex };
}
const build: Gen = (R, n, sg) => fitted(() => {
  const P = buildParts(R, sg);
  if (!P) return null;
  const { name, fig, pin, q, image } = P;
  const wrongs = [
    { v: P.lengthChanged, mc: MC.length, say: 'Measure the sides: one got longer. A turn keeps every side length.' },
    ...(Math.abs(q) === 1 ? [{ v: P.reverse, mc: MC.reverse, say: `That one turned ${turnWords(-q)}: the other way round.` }] : [{ v: moveFig(turnM(pin, -1), fig), say: 'That one went only a quarter of the way round.' }]),
    { v: P.wrongCenter, mc: MC.wrongCenter, say: 'That one turned about another corner, not about P. Check: is every corner the same distance from P as before?' },
  ].filter(x => !figSame(x.v, image) && !figSame(x.v, fig));
  const { order } = lettered(R, image, wrongs, figSame, 4);
  if (order.length < 3) return null;
  const picture = gridPic({ pin, pinLabel: 'P', start: fig, arrows: [{ q, r: 1.2 }], cands: order.map(c => ({ label: c.label, fig: c.v })), solve: { motion: turnM(pin, q), to: image } });
  return choiceItem(R, { id: `build-${P.atVertex ? 'vertex' : 'off'}-${n}`, family: 'build', board: `${turnTex(q)}\\ \\text{about}\\ P`,
    prompt: `Turn the ${A(SHAPE_WORDS[name])} ${B(turnWords(q))} about ${pinWord()}, corner by corner. Which drawing is right?`, picture,
    solution: ['Turn each corner by its steps from P, like a pointer.', 'Join the turned corners in the same order.', 'Check: every side kept its length, and A → B → C still goes the same way round.'] },
  order.map(c => ({ t: `Picture ${c.label}`, ok: c.ok, mc: c.mc, say: c.ok ? 'Yes: every corner turned about P, and every side kept its length.' : c.say })), true);
});
const slip: Gen = (R, n, sg) => fitted(() => {
  const P = buildParts(R, sg);
  if (!P) return null;
  const { name, fig, pin, q, image } = P;
  const who = pick(R, WHO);
  const kinds = ['right', 'length', 'center', ...(Math.abs(q) === 1 ? ['reverse'] : [])] as const;
  const kind = pick(R, kinds);
  const drawn = kind === 'right' ? image : kind === 'length' ? P.lengthChanged : kind === 'center' ? P.wrongCenter : P.reverse;
  if (kind !== 'right' && figSame(drawn, image)) return null;
  const nothingMc = kind === 'length' ? MC.length : kind === 'center' ? MC.wrongCenter : kind === 'reverse' ? MC.reverse : undefined;
  const picture = gridPic({ pin, pinLabel: 'P', start: fig, after: drawn, arrows: [{ q, r: 1.2 }], solve: { motion: turnM(pin, q), to: image } });
  return choiceItem(R, { id: `slip-${kind}-${n}`, family: 'slip', board: `${turnTex(q)}\\ \\text{about}\\ P`,
    prompt: `${who} turned the ${A(SHAPE_WORDS[name])} ${B(turnWords(q))} about ${pinWord()} and drew the lavender picture. What do you say?`, picture,
    solution: ['Check three things: is every corner turned about P, the right way, and is every side the same length?', kind === 'right' ? `${who}’s drawing passes all three.` : `${who}’s drawing fails one: ${kind === 'length' ? 'a side changed length' : kind === 'center' ? 'it turned about another point' : 'it turned the other way'}.`] }, [
    { t: `Nothing: ${who}’s drawing is right`, ok: kind === 'right', mc: nothingMc, say: kind === 'right' ? 'Yes: every corner turned about P the right way, and every side kept its length.' : 'Look again: check every side length, the direction, and the distance of each corner from P.' },
    { t: 'It turned the wrong way', ok: kind === 'reverse', say: kind === 'reverse' ? 'Yes: it went the other way round.' : 'The direction is right. Look for another slip.' },
    { t: 'A side changed length', ok: kind === 'length', say: kind === 'length' ? 'Yes: one side got longer. A turn keeps every side length.' : 'Measure the sides: they all kept their length.' },
    { t: 'It turned about the wrong point', ok: kind === 'center', say: kind === 'center' ? 'Yes: it turned about another corner. The corners are not the same distance from P any more.' : 'It turned about P. Look for another slip.' },
  ], true);
});

// recognize-slide / turn-vs-slide / recognize-flip: slide, turn or flip (facing direction, mirror image)
const motion: Gen = (R, n, sg) => fitted(() => {
  const { fig: f0, name } = figOf(R, ['flag', 'L', 'F']);
  const fig = shiftFig(f0, [-4, -2]);
  const W = SHAPE_WORDS[name];
  if (sg === 'recognize-flip') {
    const lk = R() < 0.7 ? pick(R, ['v', 'h'] as const) : 'd';
    const gap = int(R, 1, 2);
    const mx = Math.max(...fig.pts.map(p => p[0])), my = Math.min(...fig.pts.map(p => p[1]));
    const line: FlipLine = lk === 'v' ? { kind: 'v', x: mx + gap } : lk === 'h' ? { kind: 'h', y: my - gap } : { kind: 'd', p: [mx + gap, my], s: 1 };
    const isFlip = R() < 0.6;
    const flipped = moveFig({ kind: 'flip', line }, fig);
    const after = isFlip ? flipped : shiftFig(fig, vsub(middle(flipped.pts), middle(fig.pts)).map(Math.round) as unknown as V);
    if (!isFlip && sameSet(after.pts, flipped.pts)) return null;
    const picture = gridPic({ start: fig, after, lines: [{ line, label: flipLetter }], solve: { motion: isFlip ? { kind: 'flip', line } : { kind: 'slide', d: vsub(after.pts[0]!, fig.pts[0]!) }, to: after } });
    return choiceItem(R, { id: `motion-flip-${isFlip ? 'yes' : 'no'}-${n}`, family: 'motion', board: '', prompt: `The ${A(W)} moved across line ${B(flipLetter)} to the lavender picture. Is that a flip across ${flipLetter}?`, picture,
      solution: ['A flip turns the tile over across the line, like a page: it becomes a mirror image.', isFlip ? 'Here every point lands the same distance on the other side of m, mirrored.' : 'Here the tile only slid across: it faces the same way, so it is not a mirror image.'] }, isFlip ? [
      { t: `Yes: it is a mirror image across ${flipLetter}`, ok: true, say: 'Yes: folded over the line, every point lands on its mirror point.' },
      { t: 'No: it faces a new way, so it is a turn', mc: MC.reflAsRot, say: 'Facing a new way is not enough for a turn: trace A → B → C. It goes the other way round, so it is a flip.' },
      { t: 'No: it just moved to the other side, so it is a slide', say: 'A slide keeps the facing direction. This one is mirrored.' },
    ] : [
      { t: 'No: it only slid across, it is not a mirror image', ok: true, say: 'Right: it faces the same way. A flip would mirror it.' },
      { t: 'Yes: it is on the other side of the line', mc: MC.reflSlide, say: 'Being on the other side is not enough. A flip makes a mirror image; this one faces the same way, so it slid.' },
      { t: 'Yes: it faces a new way', say: 'Look again: it faces the same way as before.' },
    ]);
  }
  const outside = sg === 'turn-vs-slide';
  const isSlide = R() < (outside ? 0.4 : 0.55);
  let m: Motion;
  if (isSlide) m = { kind: 'slide', d: [pick(R, [4, 5, 6]), pick(R, [-2, 0, 2, 3])] };
  else { const c: V = vadd(middle(fig.pts), [pick(R, [3, 4]), pick(R, [-1, 0, 1])]).map(Math.round) as unknown as V; m = turnM(c, pick(R, [-1, 1, 2])); }
  const after = moveFig(m, fig);
  if (!isSlide && sameSet(after.pts, fig.pts)) return null;
  const picture = gridPic({ start: fig, after, solve: { motion: m, to: after } });
  const turnOpts: Opt[] = [
    { t: 'A turn: it faces a new way', ok: true, say: 'Yes: it moved AND faces a new way. A slide never changes the facing direction.' },
    { t: 'A slide: it moved to a new place', mc: MC.anySlide, say: 'Moving to a new place is not enough for a slide: a slide keeps facing the same way. This one faces a new way.' },
    { t: 'A flip: it faces a new way', mc: MC.rotRefl, say: 'Facing a new way can be a turn. Trace A → B → C: it still goes the same way round, so it was not flipped over.' },
  ];
  const slideOpts: Opt[] = [
    { t: 'A slide: it still faces the same way', ok: true, say: 'Yes: it moved but faces exactly the same way.' },
    { t: 'A turn: it moved to a new place', say: 'A turn would change the way it faces. This one faces the same way.' },
    { t: 'A flip: it moved across', say: 'A flip makes a mirror image. This one is not mirrored.' },
  ];
  return choiceItem(R, { id: `motion-${isSlide ? 'slide' : 'turn'}-${n}`, family: 'motion', board: '', prompt: `The ${A(W)} moved from the amber picture to the lavender one. Which move was it?`, picture,
    solution: ['Look at the way it faces (where A points).', isSlide ? 'Same facing direction: a slide (a translation).' : 'A new facing direction, corners still in the same order: a turn.'] }, isSlide ? slideOpts : turnOpts);
});

// turn-vs-flip: the clockwise order of the marked corners is kept by a turn, reversed by a flip
const order: Gen = (R, n) => fitted(() => {
  const { fig: f0, name } = figOf(R, ['tri', 'L', 'flag', 'F']);
  const fig = shiftFig(f0, [-4, -2]);
  const isFlip = R() < 0.5;
  let m: Motion;
  if (isFlip) { const k = pick(R, ['v', 'h', 'd'] as const); const mx = Math.max(...fig.pts.map(p => p[0])); m = { kind: 'flip', line: k === 'v' ? { kind: 'v', x: mx + 1 } : k === 'h' ? { kind: 'h', y: -2 } : { kind: 'd', p: [mx + 1, -2], s: 1 } }; }
  else m = turnM([Math.max(...fig.pts.map(p => p[0])) + 2, 0], pick(R, [-1, 1, 2]));
  const after = moveFig(m, fig);
  const o1 = orient(fig.marks[0]!.p, fig.marks[1]!.p, fig.marks[2]!.p), o2 = orient(after.marks[0]!.p, after.marks[1]!.p, after.marks[2]!.p);
  if ((o1 === o2) === isFlip) throw new Error('order: orientation check failed');
  const picture = gridPic({ start: fig, after, solve: { motion: m, to: after }, orderArrows: true });
  const W = SHAPE_WORDS[name];
  const opts: Opt[] = isFlip ? [
    { t: 'A flip: A → B → C goes the other way round', ok: true, say: `Yes: ${o1 < 0 ? 'clockwise' : 'counterclockwise'} in one, ${o2 < 0 ? 'clockwise' : 'counterclockwise'} in the other. Only turning it over does that.` },
    { t: 'A turn: A → B → C goes the same way round', say: 'Trace it again in each picture: one way is clockwise, the other counterclockwise.' },
    { t: 'A turn: it faces a new way', mc: MC.reflAsRot, say: 'Facing a new way happens in a flip too. Trace A → B → C: the order reversed, so it was flipped over.' },
  ] : [
    { t: 'A turn: A → B → C goes the same way round', ok: true, say: `Yes: ${o1 < 0 ? 'clockwise' : 'counterclockwise'} in both. A turn never reverses the order.` },
    { t: 'A flip: A → B → C goes the other way round', say: 'Trace it again in each picture: it goes the same way round in both.' },
    { t: 'A flip: it faces a new way', mc: MC.rotRefl, say: 'Facing a new way happens in a turn too. Trace A → B → C: same order, so it was not flipped over.' },
  ];
  return choiceItem(R, { id: `order-${isFlip ? 'flip' : 'turn'}-${n}`, family: 'order', board: 'A \\to B \\to C', prompt: `The amber ${A(W)} and the lavender one: go A → B → C in each. Was it a turn or a flip?`, picture,
    solution: [`In the amber picture A → B → C goes ${o1 < 0 ? 'clockwise' : 'counterclockwise'}; in the lavender one ${o2 < 0 ? 'clockwise' : 'counterclockwise'}.`, 'A turn keeps that order (the sheet stays face up); a flip reverses it (the sheet is turned over).'] }, opts);
});

// opposite-half-turns: half turns either way give the same image; quarter turns do not
const opposite: Gen = (R, n) => fitted(() => {
  const isHalf = R() < 0.7;
  const P = placeFig(R, R() < 0.5 ? 'external-center' : 'rotate-whole-figure');
  if (!P) return null;
  const { fig, name, pin } = P;
  const [w0, w1] = shuffle(R, WHO.slice());
  const q = isHalf ? 2 : 1;
  const a = moveFig(turnM(pin, -q), fig), b = moveFig(turnM(pin, q), fig);
  if (isHalf !== sameSet(a.pts, b.pts)) throw new Error('opposite: half turns must agree, quarter turns must not');
  const picture = gridPic({ pin, pinLabel: 'P', start: fig, arrows: [{ q: -q, r: 1.3 }, { q, r: 2.1 }], solve: { motion: turnM(pin, -q), to: a, also: { motion: turnM(pin, q), to: b } } });
  const W = SHAPE_WORDS[name];
  return choiceItem(R, { id: `opposite-${isHalf ? 'half' : 'quarter'}-${n}`, family: 'opposite', board: '\\circlearrowright\\ \\ \\text{or}\\ \\ \\circlearrowleft',
    prompt: `${w0} turns the ${A(W)} ${B(turnWords(-q))} about P. ${w1} turns the same ${W} ${B(turnWords(q))} about P. Do they end in the same place?`, picture,
    solution: isHalf ? ['A half turn goes half way around: two quarters.', 'Half way around clockwise and half way around counterclockwise meet at the same place.'] : ['A quarter turn clockwise and a quarter turn counterclockwise go to opposite sides.', 'They end in different places: for quarter turns the direction matters.'] }, isHalf ? [
    { t: 'Yes: half way round either way ends in the same place', ok: true, say: 'Yes: the two half turns meet on the far side of P.' },
    { t: 'No: opposite directions always end in different places', mc: MC.neverMatch, say: 'Not for half turns: half way around clockwise and half way around counterclockwise land in the same place.' },
    { t: `Only if the ${W} is symmetric`, say: `The ${W} is not symmetric, and the two half turns still land in the same place.` },
  ] : [
    { t: 'No: a quarter turn each way lands in different places', ok: true, say: 'Right: one goes to one side of P, the other to the opposite side.' },
    { t: 'Yes: they turn the same amount, so they land in the same place', mc: MC.oppMisjudged, say: 'Same amount, but opposite directions: a quarter turn each way ends on opposite sides of P.' },
    { t: 'Yes: they use the same pin', say: 'Same pin, but the direction matters for a quarter turn.' },
  ]);
});

// symmetric-multiple-motions: for a symmetric figure, more than one listed move can give the same outline
const symmetric: Gen = (R, n) => {
  const nm = pick(R, ['H', 'rect', 'Z', 'square', 'S'] as const);
  const base = nm === 'rect' ? shape('rect', pick(R, [3, 4, 2]), pick(R, [2, 1, 4])) : nm === 'square' ? shape('square', pick(R, [2, 3])) : nm === 'S' ? moveFig({ kind: 'flip', line: { kind: 'v', x: 1.5 } }, shape('Z')) : shape(nm);
  if (nm === 'rect' && sameSet(moveFig(turnM(middle(base.pts), 1), base).pts, base.pts)) return symmetric(R, n);
  const fig = shiftFig(base, [-2, -1]);
  const C = middle(fig.pts);
  const all: { key: string; t: string; m: Motion }[] = [
    { key: 'half', t: 'the half turn about C', m: turnM(C, 2) },
    { key: 'cw', t: 'the quarter turn clockwise about C', m: turnM(C, -1) },
    { key: 'ccw', t: 'the quarter turn counterclockwise about C', m: turnM(C, 1) },
    { key: 'm', t: 'the flip across m', m: { kind: 'flip', line: { kind: 'v', x: C[0] } } },
    { key: 'n', t: 'the flip across n', m: { kind: 'flip', line: { kind: 'h', y: C[1] } } },
    { key: 'slide', t: 'the slide 2 steps right', m: { kind: 'slide', d: [2, 0] } },
  ];
  const moves = [all[0]!, ...shuffle(R, all.slice(1)).slice(0, 3)].sort((a, b) => all.indexOf(a) - all.indexOf(b));
  const keys = moves.map(m => m.key);
  const works = moves.filter(x => sameSet(movePts_(x.m, fig.pts), fig.pts)).map(x => x.key);
  const tOf = (k: string) => moves.find(m => m.key === k)!.t;
  const say = (ks: string[]) => ks.length === 0 ? 'None of them' : ks.length === keys.length ? 'All four moves' : ks.length === 1 ? `Only ${tOf(ks[0]!)}` : cap(ks.map(tOf).join(', ').replace(/, ([^,]*)$/, ' and $1'));
  const flips = keys.filter(k => k === 'm' || k === 'n'), turns = keys.filter(k => k === 'half' || k === 'cw' || k === 'ccw');
  const subsets: string[][] = [works, ['half'], keys, flips, turns, [], ['half', ...flips]];
  const seen = new Set<string>();
  const opts: Opt[] = [];
  const W = SHAPE_WORDS[nm === 'S' ? 'Z' : nm].replace('Z-tile', nm === 'S' ? 'S-tile' : 'Z-tile');
  for (const s0 of subsets) {
    const s = keys.filter(k => s0.includes(k));
    if (!s.length && s0.length) continue;
    const k = s.join(',');
    if (seen.has(k) || opts.length >= 4) continue;
    seen.add(k);
    const ok = k === works.join(',');
    const missing = works.filter(w => !s.includes(w)), extra = s.filter(w => !works.includes(w));
    opts.push({ t: say(s), ok, mc: !ok && s.length >= 1 && works.length > s.length && s.every(x => works.includes(x)) ? MC.oneMotion : undefined,
      say: ok ? 'Yes: each of those puts every corner back on the outline.' : missing.length ? `${cap(tOf(missing[0]!))} also puts the ${W} exactly back on its outline. More than one move can give the same picture.` : `${cap(tOf(extra[0]!))} does not fit: try it, a corner lands off the outline.` });
  }
  if (!opts.some(o => o.ok)) throw new Error('symmetric: the right set is missing');
  const listed = moves.map(m => m.t).join(', ').replace(/, ([^,]*)$/, ', or $1');
  const sol = moves.find(m => m.key === works[0]);
  const picture = gridPic({ start: fig, target: fig.pts, points: [{ p: C, label: 'C' }], lines: [...(keys.includes('m') ? [{ line: { kind: 'v', x: C[0] } as FlipLine, label: 'm' }] : []), ...(keys.includes('n') ? [{ line: { kind: 'h', y: C[1] } as FlipLine, label: 'n' }] : [])], solve: sol ? { motion: sol.m, to: fig } : undefined }, 8);
  return choiceItem(R, { id: `symmetric-${nm}-${n}`, family: 'symmetric', board: '', prompt: `The ${A(W)} must end exactly on its own dashed outline (not moving does not count). Which of these moves could do it: ${listed}?`, picture,
    solution: ['Try each move with tracing paper: does every corner land back on the outline?', `${say(works)} ${works.length === 1 ? 'does' : 'do'}. A symmetric figure can match itself in more than one way.`] }, opts);
};
const movePts_ = (m: Motion, P: readonly V[]) => P.map(p => apply(m, p));
const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

// select-justify-turn: choose the turn that puts the tile exactly on the target outline, checking every corner
const target: Gen = (R, n) => fitted(() => {
  const { fig, name } = figOf(R);
  const k = pick(R, [0, 0, 1, 2]);
  const K = fig.marks[k]!, X = K.label, A0 = K.p;
  const q = pick(R, [-1, 1, 2]);
  const tgt = moveFig(turnM(A0, q), fig);
  const W = SHAPE_WORDS[name];
  const picture = gridPic({ pin: A0, start: fig, target: tgt.pts, solve: { motion: turnM(A0, q), to: tgt } });
  const others = fig.marks.filter(m => m.label !== X).map(m => m.label).join(' and ');
  const opts: Opt[] = Math.abs(q) === 1 ? [
    { t: `${cap(turnWords(q))} about ${X}: every corner lands on the outline`, ok: true, say: `Yes: with ${X} pinned, that turn puts every corner on the outline.` },
    { t: `${cap(turnWords(-q))} about ${X}: corner ${X} lands on the outline`, mc: MC.onePoint, say: `${X} stays on the outline for ANY turn about ${X}. Check ${others}: that way they land on the wrong side.` },
    { t: `A half turn about ${X}`, say: 'A half turn would make the tile point the opposite way.' },
    { t: 'A slide', say: 'A slide keeps the facing direction; the outline faces a new way.' },
  ] : [
    { t: `A half turn about ${X}: every corner lands on the outline`, ok: true, say: `Yes: half way around about ${X} puts every corner on the outline.` },
    { t: `A quarter turn ${R() < 0.5 ? 'clockwise' : 'counterclockwise'} about ${X}: corner ${X} lands on the outline`, mc: MC.onePoint, say: `${X} stays put for ANY turn about ${X}. Check ${others}: a quarter turn puts them off the outline.` },
    { t: `A flip across a line through ${X}`, say: 'A flip makes a mirror image; the outline is the tile turned, not mirrored.' },
    { t: 'A slide', say: 'A slide keeps the facing direction; the outline faces the opposite way.' },
  ];
  return choiceItem(R, { id: `target-${n}`, family: 'target', board: '', prompt: `The ${A(W)} is pinned at its corner ${B(X)}. Which move puts it exactly on the dashed outline?`, picture,
    solution: [`Every turn about ${X} keeps ${X} in place, so ${X} alone proves nothing.`, `Check every corner: only ${turnWords(q)} about ${X} puts all of them on the outline.`] }, opts);
});

export const GENS: Record<FamilyId, Gen> = { watch, amount, armLength, direction, center, describe, pointer, figure, square, distance, steps, pointTurn, build, slip, motion, order, opposite, symmetric, target };
export const GENERATORS = GENS;
