// ckit.ts: what the practice families of "Constructions" share: the picture type (the construction player beside a
// card, a GeoFig figure, a proof frame...), the retry that keeps only readable layouts, random point names, the
// construction makers per kind, the non-construction steps (a ruler, a protractor or the eye) per kind, and the
// three generic families every construction gets:
//   nextStep   the construction drawn so far; which step comes next (a step that cannot come yet, a step that measures
//              or guesses, a step that changes the width are wrong; a second valid next step is never offered)
//   orderSteps the finished construction and its steps in a mixed-up list; which order works (exactly one of the
//              offered orders is valid: every step after what it needs)
//   spotFake   the steps of a construction with ONE step that measures or guesses; which step is not a construction
// Pure: no DOM.
import { type Item, shuffle } from '../../runtime/item';
import { type Base, type GFItem, type GFPicture, type NumWrong, type Opt, choiceItem, numItem } from '../geometry-foundations/kit';
import { FR_LEFT, FR_WIDE, figProblems, galleryFrames, type Frame } from '../geometry-foundations/geo';
import { type Cons, type Kind, type Step, type Tool, angleBis, canDo, copyAngle, copySeg, equilateral, hexagon, isLegal, nextSteps, parallelCorr, parallelPerp, perpAt, perpBis, perpFrom, sg, square, validOrder, withFake } from './cons';
import { type Over, consProblems } from './Construct';

export const MC = {
  eye: 'mc.geometric-proof.construction-by-eye-or-measure',
  inside: 'mc.shapes.boundary-versus-inside',
  width: 'mc.geometric-proof.compass-width-changed',
  noMeet: 'mc.geometric-proof.arcs-do-not-meet',
  someConds: 'mc.geometric-proof.stops-after-some-conditions',
  bisMid: 'mc.shapes.angle-bisector-hits-midpoint',
  anchor: 'mc.geometric-proof.compass-needle-on-wrong-anchor',
  turned: 'mc.transformations.turned-or-flipped-copy-not-congruent',
  midMis: 'mc.geometric-proof.midpoint-bisector-misdefined',
  rayMarks: 'mc.geometric-proof.unequal-ray-marks-in-compass-bisection',
  wrongPlace: 'mc.geometric-proof.perpendicular-or-parallel-wrong-place',
  hexApprox: 'mc.circles.hexagon-closure-approximate',
  anyDiam: 'mc.circles.any-two-diameters-make-square',
  oneCond: 'mc.shapes.one-condition-makes-regular-polygon',
  tangent: 'mc.geometric-proof.tangent-arc-suffices-for-perpendicular-construction',
  armLen: 'mc.angles.angle-size-from-arm-length',
  radiusOnly: 'mc.geometric-proof.copy-angle-radius-only',
  atFoot: 'mc.shapes.second-perpendicular-at-foot',
  slopeSwap: 'mc.coordinate-geometry.parallel-perpendicular-slope-swap',
  nonCorr: 'mc.angles.copies-angle-into-noncorresponding-position',
  converse: 'mc.geometric-proof.converse-assumed-true',
  methodRule: 'mc.measurement-units.method-rule-ignored',
  observed: 'mc.geometric-proof.observed-feature-as-construction-guarantee',
  examples: 'mc.reasoning-language.examples-as-proof',
  centersIn: 'mc.shapes.centers-always-inside',
  appearance: 'mc.geometric-proof.diagram-appearance-as-given',
  circular: 'mc.geometric-proof.circular-reasoning',
  ssa: 'mc.transformations.ssa-accepted-as-criterion',
  aaa: 'mc.transformations.equal-angles-prove-congruence',
  onlyArc: 'mc.shapes.only-arc-points-equidistant',
  iff: 'mc.geometric-proof.iff-one-direction-only',
  boundary: 'mc.geometric-proof.overlooks-boundary-case',
  defaultPt: 'mc.geometric-proof.locus-default-point',
  oneAnswer: 'mc.reasoning-language.one-determinable-answer',
  bisForTwo: 'mc.shapes.angle-bisector-for-two-point-equidistance',
  lociMatch: 'mc.geometric-proof.loci-not-matched-to-constraints',
  alwaysPt: 'mc.shapes.equidistant-point-always-exists',
  decoration: 'mc.geometric-proof.construction-arcs-seen-as-decoration',
  pbOne: 'mc.shapes.perpendicular-bisector-one-condition',
  bisArb: 'mc.geometric-proof.angle-bisector-from-arbitrary-points',
  vertical: 'mc.shapes.parallel-perpendicular-tied-to-horizontal-vertical',
  connector: 'mc.shapes.arbitrary-connector-as-perpendicular',
  measureProof: 'mc.geometric-proof.procedure-or-measurement-as-proof',
  beforeEst: 'mc.geometric-proof.uses-fact-before-established',
} as const;

// ---------- pictures ----------
export interface ConsPic { c: Cons; upto: number; /** steps drawn by the solve */ after?: number; over?: Over; /** the overlay only after the solve */ overLate?: boolean; focus?: string }
export type CPicture = GFPicture & { cons?: ConsPic; /** step letters of the card, in card order (step ids) */ stepIds?: string[] };
export type CItem = Omit<GFItem, 'picture'> & { picture?: CPicture };
export type Gen = (R: () => number, n: number, sg?: string) => CItem;
export type CBase = Omit<CItem, 'input' | 'choices' | 'answer' | 'check'>;
/** the course's choice helper with this lesson's pictures */
/** the course's number helper with this lesson's pictures */
export const numC = (b: Omit<CItem, 'input' | 'answer' | 'check'>, a: number, wrong: NumWrong[], right: string, general: string): CItem => numItem(b as Parameters<typeof numItem>[0], a, wrong, right, general) as CItem;
export const choose = (R: () => number, b: CBase, opts: Opt[], fixed = false): CItem => choiceItem(R, b as Base, opts, fixed) as CItem;

/** the frame the page draws a construction or a figure in */
export function picFrame(p: CPicture): Frame { return p.proof || p.card || p.cards ? FR_LEFT : FR_WIDE; }
/** try a maker until its pictures lay out readably */
export function fitted<T extends { picture?: CPicture }>(fam: string, make: () => T, tries = 60): T {
  let last = '';
  for (let t = 0; t < tries; t++) {
    let it: T;
    try { it = make(); } catch (e) { last = (e as Error).message; continue; }
    const p = it.picture;
    if (!p) return it;
    const fr = picFrame(p), probs: string[] = [];
    if (p.cons) probs.push(...consProblems(p.cons.c, fr, p.cons.over));
    if (p.fig) probs.push(...figProblems(p.fig, fr));
    if (p.gallery) { const frs = galleryFrames(p.gallery.figs.length); p.gallery.figs.forEach((f, i) => probs.push(...figProblems(f, frs[i]!))); }
    if (!probs.length) return it;
    last = probs.join('; ');
  }
  throw new Error(`${fam}: no readable picture (${last})`);
}

// ---------- names ----------
const POOL = 'ABCDEFGHJKMNPQRSTUVWXYZ';
export function letters(R: () => number, n: number, avoid = ''): string[] {
  const xs = shuffle(R, [...POOL].filter(c => !avoid.includes(c)));
  return xs.slice(0, n);
}
export const STEP = 'abcdefgh';
export const stepTag = (i: number) => `(${STEP[i]})`;

// ---------- the constructions by kind ----------
export const KIND_GOAL: Record<Kind, (c: Cons) => string> = {
  copySeg: c => `Copy ${sg(c.pts[0]!.name + c.pts[1]!.name)} onto the ray from ${c.pts[2]!.name}${c.pts.length > 4 ? ' twice' : ''}.`,
  equilateral: c => `Construct an equilateral triangle on ${sg(c.pts[0]!.name + c.pts[1]!.name)}.`,
  perpBis: c => `Construct the perpendicular bisector of ${sg(c.pts[0]!.name + c.pts[1]!.name)} and its midpoint.`,
  angleBis: c => `Bisect the angle at ${c.pts[0]!.name}.`,
  perpAt: c => `Construct the perpendicular to ℓ at ${c.pts[0]!.name}, a point on ℓ.`,
  perpFrom: c => `Construct the perpendicular to ℓ through ${c.pts[0]!.name}, a point off ℓ.`,
  copyAngle: c => `Copy the angle at ${c.pts[0]!.name} onto the ray from ${c.pts[3]!.name}.`,
  parallelPerp: c => `Construct the line through ${c.pts[0]!.name} parallel to ℓ, with two perpendiculars.`,
  parallelCorr: c => `Construct the line through ${c.pts[0]!.name} parallel to ℓ by copying an angle.`,
  hexagon: c => (c.steps.find(s => s.id === 'join')!.lines.length === 3 ? `Inscribe an equilateral triangle in the circle with center ${c.pts[0]!.name}.` : `Inscribe a regular hexagon in the circle with center ${c.pts[0]!.name}.`),
  square: c => `Inscribe a square in the circle with center ${c.pts[0]!.name}.`,
};
/** a construction of a kind with random names (and a random variant where the kind has one) */
export function make(kind: Kind, R: () => number, o: { variant?: string } = {}): Cons {
  const v = o.variant;
  switch (kind) {
    case 'copySeg': return copySeg(R, { twice: v === 'twice' || (v === undefined && R() < 0.35), short: v === 'short', names: letters(R, 5) as [string, string, string, string, string] });
    case 'equilateral': return equilateral(R, { both: v === 'both', orient: R() < 0.5 ? 'h' : 's', names: letters(R, 4) as [string, string, string, string] });
    case 'perpBis': return perpBis(R, { names: letters(R, 5) as [string, string, string, string, string] });
    case 'angleBis': return angleBis(R, { names: letters(R, 4) as [string, string, string, string] });
    case 'perpAt': return perpAt(R, { names: letters(R, 4) as [string, string, string, string] });
    case 'perpFrom': return perpFrom(R, { names: letters(R, 5) as [string, string, string, string, string] });
    case 'copyAngle': return copyAngle(R, { names: letters(R, 6) as [string, string, string, string, string, string] });
    case 'parallelPerp': return parallelPerp(R, { names: letters(R, 3) as [string, string, string] });
    case 'parallelCorr': return parallelCorr(R, { names: letters(R, 6) as [string, string, string, string, string, string] });
    case 'hexagon': return hexagon(R, { tri: v === 'tri', names: ['O', ...letters(R, 6, 'O')] });
    case 'square': return square(R, { names: ['O', ...letters(R, 4, 'O')] as [string, string, string, string, string] });
  }
}

// ---------- steps that measure or guess (one per item) ----------
export interface FakeDef { replace: string[]; tool: Tool; text: string }
const N = (c: Cons, i: number) => c.pts[i]!.name;
export function fakesOf(c: Cons): FakeDef[] {
  const n = (i: number) => N(c, i);
  const has = (id: string) => c.steps.some(s => s.id === id);
  switch (c.kind) {
    case 'copySeg': return [
      { replace: has('arc2') ? ['set', 'arc1', 'arc2'] : ['set', 'arc1'], tool: 'ruler', text: `Measure ${sg(n(0) + n(1))} with a ruler, then mark ${has('arc2') ? `${n(3)} and ${n(4)}` : n(3)} along the ray at that many centimeters.` },
      ...(has('arc2') ? [] : [{ replace: ['arc1'], tool: 'eye' as Tool, text: `Mark ${n(3)} on the ray where it looks as far from ${n(2)} as ${n(1)} is from ${n(0)}.` }]),
    ];
    case 'equilateral': return c.pts.length > 3 ? [{ replace: ['arcB'], tool: 'ruler', text: `Measure ${sg(n(0) + n(1))} with a ruler, and mark ${n(2)} and ${n(3)} on the arcs where the ruler reads that length from ${n(1)}.` }] : [
      { replace: ['arcA', 'arcB'], tool: 'eye', text: `Mark ${n(2)} where it looks equally far from ${n(0)} and ${n(1)}.` },
      { replace: ['arcB'], tool: 'ruler', text: `Measure ${sg(n(0) + n(1))} with a ruler, and mark ${n(2)} on the arc where the ruler reads that length from ${n(1)}.` },
    ];
    case 'perpBis': return [
      { replace: ['mid'], tool: 'ruler', text: `Measure ${sg(n(0) + n(1))} with a ruler and mark ${n(4)} at half its length.` },
      { replace: ['line'], tool: 'protractor', text: `Put a protractor on ${sg(n(0) + n(1))} and draw the line through ${n(2)} at 90°.` },
    ];
    case 'angleBis': return [
      { replace: ['arcA', 'arcB'], tool: 'eye', text: `Mark ${n(3)} inside the angle where it looks halfway between the two sides.` },
      { replace: ['ray'], tool: 'protractor', text: `Measure ∠${n(1)}${n(0)}${n(2)} with a protractor and draw a ray from ${n(0)} at half that measure.` },
    ];
    case 'perpAt': return [
      { replace: ['arcA', 'arcB'], tool: 'protractor', text: `Put a protractor on ℓ with its center on ${n(0)} and mark ${n(3)} at 90°.` },
      { replace: ['arcP'], tool: 'ruler', text: `With a ruler, mark ${n(1)} and ${n(2)} on ℓ, 3 cm from ${n(0)} on each side.` },
    ];
    case 'perpFrom': return [
      { replace: ['arcA', 'arcB'], tool: 'eye', text: `Mark ${n(3)} below ℓ where it looks straight across from ${n(0)}.` },
      { replace: ['arcB'], tool: 'ruler', text: `Measure the width of the last arc with a ruler, and draw an arc that many centimeters from ${n(2)}, crossing it at ${n(3)}.` },
    ];
    case 'copyAngle': return [
      { replace: ['set', 'chord'], tool: 'protractor', text: `Measure ∠${n(1)}${n(0)}${n(2)} with a protractor and mark ${n(5)} on the long arc at the same measure from ${n(3)}${n(4)}.` },
    ];
    case 'parallelPerp': return [
      { replace: ['arcP', 'arcCD'], tool: 'protractor', text: `Put a protractor on line m with its center on ${n(0)} and mark ${n(2)} at 90°.` },
      { replace: ['perp1', 'm'], tool: 'eye', text: `Draw line m from ${n(0)} so it looks perpendicular to ℓ, meeting it at ${n(1)}.` },
    ];
    case 'parallelCorr': return [
      { replace: ['set', 'chord'], tool: 'protractor', text: `Measure ∠${n(2)}${n(1)}${n(3)} with a protractor, and mark ${n(5)} on the arc so ∠${n(5)}${n(0)}${n(4)} has the same measure.` },
      { replace: ['line'], tool: 'eye', text: `Draw the line through ${n(0)} that looks parallel to ℓ.` },
    ];
    case 'hexagon': return [
      { replace: c.steps.filter(s => s.tool === 'compass').map(s => s.id), tool: 'protractor', text: `With a protractor at ${n(0)}, mark ${n(2)}, ${n(3)}, ${n(4)}, ${n(5)} and ${n(6)} every 60° around the circle.` },
    ];
    case 'square': return [
      { replace: ['perp'], tool: 'protractor', text: `Put a protractor at ${n(0)} and draw the diameter at 90° to ${sg(n(1) + n(2))}, meeting the circle at ${n(3)} and ${n(4)}.` },
    ];
  }
}

// ---------- generic families ----------
const widthChanged = (s: Step): string | null => (/^Keep (that|the same) width\./.test(s.text) ? s.text.replace(/^Keep (that|the same) width\./, 'Open the compass to a new width.') : null);

/** the construction drawn up to some step: what comes next? */
export function nextStepItem(R: () => number, n: number, fam: string, c: Cons, sgId?: string): CItem {
  const cands: number[] = [];
  for (let i = 1; i < c.steps.length; i++) cands.push(i);
  for (const i of shuffle(R, cands)) {
    const done = new Set(c.steps.slice(0, i).map(s => s.id));
    const valid = nextSteps(c, done).filter(s => isLegal(s.tool));
    if (!valid.length) continue;
    const right = valid.find(s => s.id === c.steps[i]!.id) ?? valid[0]!;
    const opts: Opt[] = [{ t: right.text, ok: true, say: 'Yes: everything that step needs is already on the paper, and it keeps every width the construction depends on.' }];
    const later = c.steps.filter(s => !done.has(s.id) && !valid.includes(s));
    for (const s of shuffle(R, later).slice(0, 1)) opts.push({ t: s.text, mc: MC.beforeEst, say: 'Not yet: that step needs a point or a width that is not on the paper yet.' });
    const fk = fakesOf(c).filter(f => f.replace.some(id => !done.has(id)));
    if (fk.length) opts.push({ t: fk[Math.floor(R() * fk.length)]!.text, mc: MC.eye, say: 'That step measures or guesses. A construction only draws arcs about known points and lines through known points.' });
    const wc = widthChanged(right);
    if (wc) opts.push({ t: wc, mc: MC.width, say: 'The construction needs the SAME width as before: that equal width is what the crossing point inherits. A new width breaks it.' });
    if (opts.length < 3) continue;
    const goal = KIND_GOAL[c.kind](c);
    const base: CBase = {
      id: `${fam}-${n}`, family: fam, subgoal: sgId, prompt: `${goal} The steps so far are drawn. Which step comes next?`, board: `\\text{${c.kind} step ${i + 1}}`,
      picture: { cons: { c, upto: i, after: i + 1, focus: right.id } },
      solution: [`${i} step${i === 1 ? ' is' : 's are'} drawn; the next step must use only points and widths already on the paper.`, `Next comes a step whose points already exist and that keeps the needed widths: ${right.text}`],
    };
    // the solve draws the RIGHT step: put it first so `upto + 1` shows it
    if (right.id !== c.steps[i]!.id) { const j = c.steps.indexOf(right); const steps = c.steps.slice(); steps.splice(j, 1); steps.splice(i, 0, right); base.picture = { cons: { c: { ...c, steps }, upto: i, after: i + 1, focus: right.id } }; }
    return choose(R, base, opts);
  }
  throw new Error(`${fam}: no next-step item for ${c.kind}`);
}

/** the steps in a mixed-up list: which order works? */
export function orderItem(R: () => number, n: number, fam: string, c: Cons, sgId?: string): CItem {
  const k = c.steps.length;
  if (k < 3 || k > 6) throw new Error(`${fam}: ${k} steps`);
  const card = shuffle(R, c.steps.map((_, i) => i));   // card position -> step index
  const tagOf = (si: number) => STEP[card.indexOf(si)]!;
  const ids = c.steps.map(s => s.id);
  const perms: number[][] = [];
  const permute = (a: number[], l: number) => { if (l === a.length) { perms.push(a.slice()); return; } for (let i = l; i < a.length; i++) { [a[l], a[i]] = [a[i]!, a[l]!]; permute(a, l + 1); [a[l], a[i]] = [a[i]!, a[l]!]; } };
  permute(c.steps.map((_, i) => i), 0);
  const ok = (p: number[]) => validOrder(c, p.map(i => ids[i]!));
  const valid = perms.filter(ok), bad = perms.filter(p => !ok(p));
  if (!valid.length || bad.length < 3) throw new Error(`${fam}: orders`);
  const right = valid[Math.floor(R() * valid.length)]!;
  // wrong orders close to the right one: two neighbours swapped, the last step first, a step moved early
  const close = bad.filter(p => p.filter((x, i) => x !== right[i]).length <= 3);
  const pickBad = shuffle(R, close.length >= 3 ? close : bad).slice(0, 3);
  const txt = (p: number[]) => p.map(tagOf).join(', ');
  const why = (p: number[]): string => {
    const done = new Set<string>();
    for (const i of p) { const s = c.steps[i]!; if (!canDo(c, s, done)) return `Step ${stepTag(card.indexOf(i))} comes too early: it needs a point or a width that is not there yet.`; done.add(s.id); }
    return 'That order breaks a step.';
  };
  const opts: Opt[] = [{ t: txt(right), ok: true, say: 'Yes: every step comes after the points and the width it needs.' }, ...pickBad.map(p => ({ t: txt(p), mc: MC.beforeEst, say: why(p) }))];
  const goal = KIND_GOAL[c.kind](c);
  const base: CBase = {
    id: `${fam}-${n}`, family: fam, subgoal: sgId, prompt: `${goal} The finished construction is drawn; its steps are listed in a mixed-up order. Which order works?`, board: `\\text{${c.kind} order}`,
    picture: { cons: { c, upto: c.steps.length }, card: { lines: card.map((si, j) => `${stepTag(j)} ${c.steps[si]!.text}`) }, stepIds: card.map(si => ids[si]!) },
    solution: [`Find the step that needs only the given points: ${stepTag(card.indexOf(right[0]!))}.`, `Then each step that uses only what is already drawn: ${txt(right)}.`],
  };
  return choose(R, base, opts);
}

/** one step measures or guesses: which? */
export function fakeItem(R: () => number, n: number, fam: string, c0: Cons, sgId?: string): CItem {
  const fks = fakesOf(c0);
  const f = fks[Math.floor(R() * fks.length)]!;
  const c = withFake(c0, f);
  if (c.steps.length < 3 || c.steps.length > 6) throw new Error(`${fam}: ${c.steps.length} steps`);
  const fi = c.steps.findIndex(s => s.id === 'fake');
  const toolWord = f.tool === 'ruler' ? 'reads a length off a ruler' : f.tool === 'protractor' ? 'reads an angle off a protractor' : 'places a point or line by eye';
  const opts: Opt[] = c.steps.map((s, i) => (i === fi
    ? { t: stepTag(i), ok: true, say: `Yes: step ${stepTag(i)} ${toolWord}. Nothing in it is forced by arcs and lines through known points, so the result is only as good as the reading.` }
    : { t: stepTag(i), say: s.free ? `Step ${stepTag(i)} is allowed: a freely chosen width or line is fine, as long as the result works for every choice.` : `Step ${stepTag(i)} is a real construction move: an arc about a known point, or a line through two known points.` }));
  const goal = KIND_GOAL[c.kind](c);
  const base: CBase = {
    id: `${fam}-${n}`, family: fam, subgoal: sgId, prompt: `${goal} Read the steps. One of them is not a compass-and-straightedge step. Which one?`, board: `\\text{${c.kind} fake ${f.tool} ${c.pts.map(p => p.name).join('')}}`,
    picture: { cons: { c, upto: c.steps.length, over: { bad: ['fake'] }, overLate: true }, card: { lines: c.steps.map((s, i) => `${stepTag(i)} ${s.text}`) }, stepIds: c.steps.map(s => s.id) },
    solution: ['A construction may only draw an arc about a known point (with a known or carried width) or a line through two known points, and name points where they cross.', `Step ${stepTag(fi)} ${toolWord}: on the drawing it has no arcs behind it.`],
  };
  return choose(R, base, opts, true);
}
export type { Item };
