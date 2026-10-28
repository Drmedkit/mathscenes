// famA.ts: stage 1-2 families of "Constructions": the rules (tools, free choices, fakes), arcs as distance
// constraints, circle crossings, the defining conditions, and the construction-specific questions (copy a segment,
// equilateral triangle, perpendicular bisector and midpoint, angle bisector, perpendiculars, inscribed polygons,
// copy an angle, parallels, folding and the drag test). Every picture is exact (cons.ts / geo.ts); every choice list
// has exactly one right answer (choiceItem refuses anything else).
import { type Fig, type GAngle, type GSeg, type Pt, add, at, dist, lerpP, measure, sub } from '../geometry-foundations/geo';
import { type Opt, r, pick, shuffle, ans } from '../geometry-foundations/kit';
import { type Cons, type Kind, type Step, angleBis, arcAt, ccx, copyAngle, copySeg, equilateral, fullCircle, hexagon, lcx, lineDist, lineThru, parallelCorr, parallelPerp, perpAt, perpBis, perpFrom, ray, seg, sg, square } from './cons';
import { type CBase, type CItem, type Gen, MC, KIND_GOAL, choose, numC, fakeItem, fitted, letters, make, nextStepItem, orderItem } from './ckit';

const A = (s: string | number) => `<b class="a">${s}</b>`, S = (s: string | number) => `<b class="s">${s}</b>`;
const cm = (v: number) => `${Number.isInteger(v) ? v : v.toFixed(1)} cm`;
const nm = (c: Cons, i: number) => c.pts[i]!.name;
const half = (R: () => number) => r(R, 0, 1) === 1;

// ===================== generic families (kind chosen by the sub-goal) =====================
const NEXT_KIND: Record<string, Kind[]> = {
  'compass-transfer': ['copySeg'], 'angle-bisector-construct': ['angleBis'], 'parallel-corresponding-angle': ['parallelCorr'],
  'perpendicular-bisector': ['perpBis'], 'angle-bisector': ['angleBis'], 'perp-on-line': ['perpAt'], 'perp-off-line': ['perpFrom'],
};
const ORDER_KIND: Record<string, Kind[]> = {
  'copy-segment': ['copySeg'], 'equilateral-triangle': ['equilateral'], 'perp-bisector-construct': ['perpBis'], 'angle-bisector-construct': ['angleBis'],
  'perp-through-point-on-line': ['perpAt'], 'perp-through-point-off-line': ['perpFrom'], 'copy-angle': ['copyAngle'], 'parallel-through-point': ['parallelPerp'],
};
const FAKE_KIND: Record<string, Kind[]> = {
  'perp-bisector-construct': ['perpBis'], 'perpendicular-bisector': ['perpBis'], 'inscribed-regular-polygons': ['hexagon', 'square'],
  'angle-bisector': ['angleBis'], 'parallel-through-point': ['parallelPerp', 'parallelCorr'],
};
const ANY: Kind[] = ['copySeg', 'equilateral', 'perpBis', 'angleBis', 'perpAt', 'perpFrom', 'copyAngle', 'parallelPerp', 'parallelCorr', 'hexagon', 'square'];
export const nextStep: Gen = (R, n, sgId) => fitted('nextStep', () => nextStepItem(R, n, 'nextStep', make(pick(R, NEXT_KIND[sgId ?? ''] ?? ANY.filter(k => k !== 'hexagon')), R), sgId));
export const orderSteps: Gen = (R, n, sgId) => fitted('orderSteps', () => {
  const kind = pick<Kind>(R, ORDER_KIND[sgId ?? ''] ?? ['perpBis', 'angleBis', 'perpAt', 'perpFrom']);
  return orderItem(R, n, 'orderSteps', make(kind, R, { variant: kind === 'copySeg' ? pick(R, ['short', 'twice']) : undefined }), sgId);
});
export const spotFake: Gen = (R, n, sgId) => fitted('spotFake', () => fakeItem(R, n, 'spotFake', make(pick(R, FAKE_KIND[sgId ?? ''] ?? ANY), R), sgId));

// ===================== construction-rules =====================
const LEGAL_MOVES = (a: string, b: string, p: string) => [
  `Draw a line through ${a} and ${b}, two points you already have.`,
  `Draw a circle about ${a} that passes through ${b}.`,
  `Keep the compass width and move the needle from ${a} to ${b}.`,
  `Name the point ${p} where two arcs cross.`,
  `Open the compass to any width wider than half of ${sg(a + b)}.`,
  `Draw any line through ${p} that crosses ${sg(a + b)}.`,
];
const ILLEGAL_MOVES = (a: string, b: string, p: string) => [
  `Mark the point 4 cm from ${a} using the scale on a ruler.`,
  `Draw a 90° angle at ${a} with a protractor.`,
  `Put ${p} where two lines look like they would meet if they were longer.`,
  `Place a helper point ${p} exactly where the answer looks right.`,
  `Read the compass opening off a ruler and halve it.`,
];
export const toolRules: Gen = (R, n, sgId) => fitted('toolRules', () => {
  const [a, b, p] = letters(R, 3);
  const legalPick = half(R);
  const L = shuffle(R, LEGAL_MOVES(a!, b!, p!)), I = shuffle(R, ILLEGAL_MOVES(a!, b!, p!));
  const opts: Opt[] = legalPick
    ? [{ t: L[0]!, ok: true, say: 'Yes: that move uses only the compass and the unmarked straightedge on points you already have.' }, ...I.slice(0, 3).map(t => ({ t, mc: MC.eye, say: 'That move measures or guesses. A construction never reads a number off a scale and never places a point by eye.' }))]
    : [{ t: I[0]!, ok: true, say: 'Yes: that move measures or guesses, so it is not part of a construction.' }, ...L.slice(0, 3).map(t => ({ t, say: 'That one is allowed: an arc about a known point, a line through known points, a carried width, or a free choice that does not assume the answer.' }))];
  const c = make(pick(R, ['perpBis', 'angleBis', 'equilateral', 'perpAt'] as Kind[]), R);
  const base: CBase = {
    id: `toolRules-${n}`, family: 'toolRules', subgoal: sgId,
    prompt: legalPick ? `In a compass-and-straightedge construction (like the one drawn), which move is allowed?` + ` <span class="dim">(points ${a}, ${b}, ${p})</span>` : `In a compass-and-straightedge construction (like the one drawn), which move is NOT allowed?` + ` <span class="dim">(points ${a}, ${b}, ${p})</span>`,
    board: '\\text{tool rules}', picture: { cons: { c, upto: c.steps.length } },
    solution: ['Allowed: a line through two known points (unmarked straightedge), a circle or arc about a known point with a known or carried width, naming crossings, and free choices that do not assume the result.', 'Not allowed: reading lengths or angles off a scale, and placing anything by eye.'],
  };
  return choose(R, base, opts);
});
export const freeChoice: Gen = (R, n, sgId) => fitted('freeChoice', () => {
  const c = perpBis(R, { names: letters(R, 5) as [string, string, string, string, string] });
  const [a, b, p, q, m] = c.pts.map(x => x.name);
  const opts: Opt[] = [
    { t: `“Open the compass to any width wider than half of ${sg(a! + b!)}.”`, ok: true, say: 'Yes: a freely chosen width is fine, because the construction works for EVERY width wider than half of the segment.' },
    { t: `“Open the compass to exactly the width that puts ${p} right above the midpoint.”`, mc: MC.eye, say: 'That choice assumes the answer: you would have to know where the midpoint is before you construct it.' },
    { t: `“Put a helper point where ${m} looks like it should be, then draw arcs from it.”`, mc: MC.eye, say: 'A helper point placed where the answer looks right is a guess: the construction then only shows what you assumed.' },
    { t: `“Set the compass to half of ${sg(a! + b!)}, read off a ruler.”`, mc: MC.eye, say: 'Reading the width off a ruler measures. And half of the segment is too small anyway: the arcs would only touch.' },
  ];
  const base: CBase = {
    id: `freeChoice-${n}`, family: 'freeChoice', subgoal: sgId, prompt: `To bisect ${sg(a! + b!)}, a construction may choose some things freely. Which free choice is allowed? <span class="dim">(${p}${q} is the line it builds)</span>`,
    board: '\\text{free choice}', picture: { cons: { c, upto: c.steps.length } },
    solution: ['A free choice is allowed when it does not assume the result: the result must hold for every admissible choice.', `Any width wider than half of ${sg(a! + b!)} gives two crossings, and the line through them is the bisector every time.`],
  };
  return choose(R, base, opts);
});

// ===================== arc-distance, circle-locus =====================
/** an arc about a centre with points on it, inside it and (optionally) outside it */
function arcScene(R: () => number, rr: number, names: string[], o: { inside?: boolean; outside?: boolean; full?: boolean } = {}): Cons {
  const [c, p, q, s, t] = names;
  const C: Pt = [0, 0], a0 = r(R, 10, 60);
  const P = at(C, a0, rr), Q = at(C, a0 + r(R, 70, 100), rr);
  const pts = [{ name: c!, at: C, deps: [] as string[] }, { name: p!, at: P, deps: ['arc'] }, { name: q!, at: Q, deps: ['arc'] }];
  if (o.inside) pts.push({ name: s!, at: at(C, a0 + r(R, 150, 200), rr * (0.5 + 0.15 * R())), deps: [] });
  if (o.outside) pts.push({ name: t!, at: at(C, a0 - r(R, 60, 90), rr * (1.3 + 0.12 * R())), deps: [] });
  const arc = o.full ? fullCircle(C, rr) : { c: C, r: rr, a0: a0 - 30, span: r(R, 150, 170) };
  return { kind: 'copySeg', given: [], givenArcs: [], pts, steps: [{ id: 'arc', tool: 'compass', text: `Needle on ${c}, an arc.`, needs: [c!], after: [], arcs: [arc], lines: [], needle: C }] };
}
export const arcRead: Gen = (R, n, sgId) => fitted('arcRead', () => {
  const rad = r(R, 6, 18) / 2, names = letters(R, 4);
  const c = arcScene(R, 230, names, { inside: true });
  const [o, p, q, s] = names;
  const ins = Math.round((dist(c.pts[3]!.at, c.pts[0]!.at) / 230) * rad * 10) / 10;
  return numC({
    id: `arcRead-${n}`, family: 'arcRead', subgoal: sgId, unit: 'cm',
    prompt: `The compass was opened to ${A(cm(rad))} and an arc was drawn about ${o}. ${p} and ${q} are on the arc, ${s} is inside it. How far is ${q} from ${o}?`,
    board: `${o}${q} = \\,?`, picture: { cons: { c, upto: 1 } },
    solution: [`Every point of an arc about ${o} is exactly the compass width from ${o}.`, `${q} is on the arc, so ${o}${q} = ${ans(rad)} cm, just like ${o}${p}.`],
  }, rad, [{ v: ins, mc: MC.inside, say: `${s} is inside the arc, not on it. ${q} is ON the arc, so it is exactly the width from ${o}.` }, { v: rad / 2, say: 'The arc gives the full compass width, not half of it.' }, { v: 2 * rad, say: 'The width is the radius (needle to pencil), not the diameter.' }], `Yes: ${q} is on the arc, so ${o}${q} is the width, ${cm(rad)}.`, 'An arc about a point records one fact: every point on it is the compass width from the centre.');
});
export const onInside: Gen = (R, n, sgId) => fitted('onInside', () => {
  const rad = r(R, 6, 14) / 2, names = letters(R, 5);
  const c = arcScene(R, 220, names, { inside: true, outside: true, full: true });
  const [o, p, q, s, t] = names;
  const opts: Opt[] = [
    { t: `${q}`, ok: true, say: `Yes: ${q} is on the circle, so ${o}${q} = ${cm(rad)}.` },
    { t: `${s}`, mc: MC.inside, say: `${s} is inside the circle: closer than ${cm(rad)}. The circle is only its boundary, not the region inside.` },
    { t: `${t}`, say: `${t} is outside the circle: farther than ${cm(rad)} from ${o}.` },
    { t: `${s} and ${q}`, mc: MC.inside, say: `Only points ON the circle are exactly ${cm(rad)} from ${o}; ${s} is inside.` },
  ];
  const base: CBase = {
    id: `onInside-${n}`, family: 'onInside', subgoal: sgId,
    prompt: `A circle about ${o} was drawn with the compass at ${A(cm(rad))}. Which point besides ${p} is exactly ${cm(rad)} from ${o}?`,
    board: `${o}X = ${rad}`, picture: { cons: { c, upto: 1, over: { ring: [q!] }, overLate: true } },
    solution: [`A circle is the set of points exactly the radius from its centre: the boundary only.`, `${q} is on it; ${s} is inside (closer) and ${t} outside (farther).`],
  };
  return choose(R, base, opts);
});
export const reopened: Gen = (R, n, sgId) => fitted('reopened', () => {
  const names = letters(R, 5) as [string, string, string, string, string];
  const L = 320, w = L * (0.64 + 0.1 * R()), wB = w * (1.12 + 0.08 * R());
  const c = perpBis(R, { names, w, wB, orient: pick(R, ['h', 's']) });
  const [a, b, p] = names;
  const opts: Opt[] = [
    { t: `${p}${a} is the first width and ${p}${b} the second: they are not equal`, ok: true, say: 'Yes: each arc only records its own width. Re-opening the compass between the arcs breaks the equality.' },
    { t: `${p}${a} = ${p}${b}, because ${p} is on both arcs`, mc: MC.width, say: `Being on both arcs gives ${p}${a} = the first width and ${p}${b} = the second width. Equal only if the width stayed the same.` },
    { t: `${p}${a} = ${p}${b} = half of ${sg(a + b)}`, mc: MC.width, say: 'Neither width is half of the segment (the arcs would only touch), and the two widths differ.' },
  ];
  const base: CBase = {
    id: `reopened-${n}`, family: 'reopened', subgoal: sgId,
    prompt: `Jun drew arcs about ${a}, then opened the compass a little wider before drawing the arcs about ${b}. What do the arcs tell you about ${p}${a} and ${p}${b}?`,
    board: `${p}${a} \\; ? \\; ${p}${b}`, picture: { cons: { c, upto: 2, over: { segs: [{ a: p, b: a, col: 'first', ticks: 1 }, { a: p, b: b, col: 'second', ticks: 2 }] }, overLate: true } },
    solution: [`The arc about ${a} gives ${p}${a} = the first width; the arc about ${b} gives ${p}${b} = the second width.`, 'The widths differ, so the arcs do not make the distances equal.'],
  };
  return choose(R, base, opts);
});
export const circleLocus: Gen = (R, n, sgId) => fitted('circleLocus', () => {
  const d = r(R, 2, 9), [o] = letters(R, 1), what = pick(R, ['tower', 'well', 'buoy', 'cell tower', 'lamp post']);
  const units = pick(R, ['mi', 'ft', 'cm']);
  const opts: Opt[] = [
    { t: `A circle with center ${o} and radius ${d} ${units}`, ok: true, say: 'Yes: the points at one fixed distance from a centre form a circle (its boundary).' },
    { t: `A disk: every point within ${d} ${units} of ${o}`, mc: MC.inside, say: `Points inside are CLOSER than ${d} ${units}. Exactly ${d} ${units} is the boundary only.` },
    { t: `Two points, one on each side of ${o}`, say: 'There are points at that distance in every direction, not just two.' },
    { t: `A square around ${o}`, say: 'A square’s corners are farther from the centre than its sides: the distance is not fixed.' },
  ];
  const c = arcScene(R, 220, [o!, ...letters(R, 2, o)], { full: true });
  const base: CBase = {
    id: `circleLocus-${n}`, family: 'circleLocus', subgoal: sgId,
    prompt: `On a map, ${o} is a ${what}. Which set is every point exactly ${A(`${d} ${units}`)} from ${o}?`,
    board: `\\text{distance } ${d}`, picture: { cons: { c: { ...c, pts: [c.pts[0]!] }, upto: 0, after: 1 } },
    solution: [`“Exactly ${d} ${units} from ${o}” is one distance condition.`, `The points that meet it form the circle about ${o} with radius ${d} ${units}.`],
  };
  return choose(R, base, opts);
});
export const arcMeaning: Gen = (R, n, sgId) => fitted('arcMeaning', () => {
  const c = make(pick(R, ['perpBis', 'equilateral', 'angleBis'] as Kind[]), R);
  const st = c.steps.find(s => s.tool === 'compass' && s.needle)!;
  const center = c.pts.find(p => p.at === st.needle || (Math.abs(p.at[0] - st.needle![0]) < 1e-9 && Math.abs(p.at[1] - st.needle![1]) < 1e-9))!.name;
  const on = c.pts.find(p => p.deps.includes(st.id) && p.name !== center)!.name;
  const rad = Math.round((st.arcs[0]!.r / 60) * 2) / 2;
  const opts: Opt[] = [
    { t: `Every point on that arc is exactly ${cm(rad)} from ${center}, so ${center}${on} = ${cm(rad)}`, ok: true, say: 'Yes: an arc is a record of a distance. Wherever it is crossed, that point is the width from the needle point.' },
    { t: 'Nothing: arcs are guide marks to make the drawing neat', mc: MC.decoration, say: 'The arcs ARE the construction: each one forces a distance, and the proof uses exactly those distances.' },
    { t: `${on} is closer to ${center} than any other point on the paper`, say: `Every point on the arc is the same distance from ${center}; points inside it are closer.` },
  ];
  const base: CBase = {
    id: `arcMeaning-${n}`, family: 'arcMeaning', subgoal: sgId,
    prompt: `${KIND_GOAL[c.kind](c)} The first arc was drawn about ${center} with the compass at ${A(cm(rad))}. What does that arc tell you?`,
    board: `${center}${on}`, picture: { cons: { c, upto: c.steps.length, focus: st.id } },
    solution: [`The arc was drawn about ${center} with width ${cm(rad)}.`, `${on} lies on it, so ${center}${on} = ${cm(rad)}: a guaranteed distance the proof can use.`],
  };
  return choose(R, base, opts);
});

// ===================== circle-intersections =====================
export const howMany: Gen = (R, n, sgId) => fitted('howMany', () => {
  const d = r(R, 6, 12), k = pick(R, [0, 1, 2]);
  const rad = k === 0 ? d / 2 - r(R, 1, 4) / 2 : k === 1 ? d / 2 : d / 2 + r(R, 1, 6) / 2;
  if (rad <= 0.5) throw new Error('radius');
  const [a, b] = letters(R, 2);
  const s = 300 / d, A0: Pt = [0, 0], B0: Pt = [300, 0];
  const X = ccx(A0, rad * s, B0, rad * s);
  if (X.length !== k) throw new Error('count');
  const c: Cons = { kind: 'perpBis', given: [seg(A0, B0)], givenArcs: [], pts: [{ name: a!, at: A0, deps: [] }, { name: b!, at: B0, deps: [] }], steps: [{ id: 'cA', tool: 'compass', text: '', needs: [a!], after: [], arcs: [fullCircle(A0, rad * s)], lines: [], needle: A0 }, { id: 'cB', tool: 'compass', text: '', needs: [b!], after: [], arcs: [fullCircle(B0, rad * s)], lines: [], needle: B0 }] };
  return numC({
    id: `howMany-${n}`, family: 'howMany', subgoal: sgId, unit: 'points',
    prompt: `${sg(a! + b!)} is ${A(cm(d))} long. Circles about ${a} and about ${b} both have radius ${A(cm(rad))}. How many points are on both circles?`,
    board: `r = ${rad},\\; ${a}${b} = ${d}`, picture: { cons: { c, upto: 0, after: 2 } },
    solution: [`Half of ${sg(a! + b!)} is ${cm(d / 2)}.`, k === 0 ? `The radius ${cm(rad)} is less than half: the circles do not reach each other. ${ans(0)} points.` : k === 1 ? `The radius is exactly half: the circles touch at the midpoint only. ${ans(1)} point.` : `The radius ${cm(rad)} is more than half: the circles cross twice, once on each side. ${ans(2)} points.`],
  }, k, [{ v: 2, mc: MC.noMeet, say: `Two crossings need a radius MORE than half of ${sg(a! + b!)} (${cm(d / 2)}).` }, { v: 1, say: k === 0 ? 'The circles do not even touch: the radius is less than half the distance.' : 'Exactly one point happens only when the radius is exactly half the distance.' }, { v: 0, say: 'Compare the radius with half of the distance between the centres.' }], 'Yes: compare the radius with half of the distance between the centres.', `Compare the radius with half of ${sg(a! + b!)}.`);
});
export const bothCond: Gen = (R, n, sgId) => fitted('bothCond', () => {
  const [a, b, x] = letters(R, 3);
  const d = r(R, 8, 12), ra = r(R, 5, 9), rb = r(R, 4, 9);
  if (ra === rb || ra + rb <= d + 1 || Math.abs(ra - rb) >= d - 1) throw new Error('radii');
  const s = 300 / d, A0: Pt = [0, 0], B0: Pt = [300, 0], X0 = ccx(A0, ra * s, B0, rb * s)[0]!;
  const c: Cons = { kind: 'perpBis', given: [seg(A0, B0)], givenArcs: [], pts: [{ name: a!, at: A0, deps: [] }, { name: b!, at: B0, deps: [] }, { name: x!, at: X0, deps: ['cA', 'cB'] }], steps: [{ id: 'cA', tool: 'compass', text: '', needs: [a!], after: [], arcs: [arcAt(A0, ra * s, X0, 22)], lines: [], needle: A0 }, { id: 'cB', tool: 'compass', text: '', needs: [b!], after: [], arcs: [arcAt(B0, rb * s, X0, 22)], lines: [], needle: B0 }] };
  const opts: Opt[] = [
    { t: `${x}${a} = ${cm(ra)} and ${x}${b} = ${cm(rb)}`, ok: true, say: `Yes: ${x} is on both arcs, so it meets both distance conditions at once.` },
    { t: `${x}${a} = ${cm(ra)} only: ${x} is on the arc about ${a}`, mc: MC.someConds, say: `${x} is on the arc about ${b} too: it carries BOTH distances.` },
    { t: `${x}${a} = ${x}${b}`, mc: MC.appearance, say: `The two arcs have different widths (${cm(ra)} and ${cm(rb)}), so ${x} is not equally far from ${a} and ${b}.` },
    { t: `${x}${a} + ${x}${b} = ${cm(d)}`, say: `That would put ${x} on ${sg(a! + b!)}. ${x} is off the segment; the arcs give the two distances themselves.` },
  ];
  const base: CBase = {
    id: `bothCond-${n}`, family: 'bothCond', subgoal: sgId,
    prompt: `An arc about ${a} with width ${A(cm(ra))} and an arc about ${b} with width ${A(cm(rb))} cross at ${x}. What do you know for sure?`,
    board: `${x}${a},\\; ${x}${b}`, picture: { cons: { c, upto: 2, over: { segs: [{ a: x!, b: a!, col: 'first' }, { a: x!, b: b!, col: 'second' }] }, overLate: true } },
    solution: [`${x} is on the arc about ${a}: ${x}${a} = ${cm(ra)}.`, `${x} is on the arc about ${b}: ${x}${b} = ${cm(rb)}. A crossing point inherits both.`],
  };
  return choose(R, base, opts);
});

// ===================== definitions =====================
function segFig(a: string, b: string, L: number, th: number): { fig: Fig; A: Pt; B: Pt; M: Pt } {
  const A0: Pt = [0, 0], B0 = at(A0, th, L), M = lerpP(A0, B0, 0.5);
  return { A: A0, B: B0, M, fig: { segs: [{ id: 'AB', a: A0, b: B0 }], angles: [], points: [{ at: A0, name: a, dir: th + 180 }, { at: B0, name: b, dir: th }] } };
}
export const pbWhich: Gen = (R, n, sgId) => fitted('pbWhich', () => {
  const [a, b] = letters(R, 2), th = pick(R, [0, r(R, 15, 35), -r(R, 15, 35)]);
  const L = 360, kinds = shuffle(R, ['both', 'mid70', 'perpOff']);
  const names = shuffle(R, ['k', 'm', 'n']);
  const figs: Fig[] = kinds.map(k => {
    const f = segFig(a!, b!, L, th);
    const P = k === 'perpOff' ? lerpP(f.A, f.B, 0.3) : f.M;
    const dirDeg = th + (k === 'mid70' ? pick(R, [68, 112]) : 90);
    const top = at(P, dirDeg, 200), bot = at(P, dirDeg + 180, 200);
    const segs: GSeg[] = [{ id: 'AP', a: f.A, b: P, ticks: k === 'perpOff' ? undefined : 1 }, { id: 'PB', a: P, b: f.B, ticks: k === 'perpOff' ? undefined : 1 }, { id: 'ln', a: bot, b: top, kind: 'line', col: 'second' }];
    const angles: GAngle[] = k === 'mid70' ? [{ id: 'q', v: P, p: f.B, q: top, text: `${Math.round(measure(P, f.B, top))}°` }] : [{ id: 'q', v: P, p: f.B, q: top, box: true }];
    return { segs, angles, points: f.fig.points, pad: 70 };
  });
  const iRight = kinds.indexOf('both');
  const opts: Opt[] = kinds.map((k, i) => ({ t: `line ${names[i]}`, ok: k === 'both', mc: k === 'mid70' ? MC.pbOne : k === 'perpOff' ? MC.someConds : undefined, say: k === 'both' ? 'Yes: it passes through the midpoint (equal ticks) AND makes a right angle (the box).' : k === 'mid70' ? 'It passes through the midpoint, but it is not perpendicular: the angle is not 90°.' : 'It is perpendicular, but it misses the midpoint: the two parts are not marked equal.' }));
  void iRight;
  const base: CBase = {
    id: `pbWhich-${n}`, family: 'pbWhich', subgoal: sgId, prompt: `Read only the marks. Which line is the perpendicular bisector of ${sg(a! + b!)}?`,
    board: '\\text{perpendicular bisector}', picture: { gallery: { figs, caps: kinds.map((_, i) => `line ${names[i]}`) } },
    solution: ['A perpendicular bisector must do two things at once: pass through the midpoint, and be perpendicular.', 'Look for equal ticks on the two halves AND a right-angle box.'],
  };
  return choose(R, base, opts, true);
});
export const pbBoth: Gen = (R, n, sgId) => fitted('pbBoth', () => {
  const [a, b, p] = letters(R, 3), th = pick(R, [0, r(R, 15, 35), -r(R, 15, 35)]);
  const mode = pick(R, ['mid', 'perp']);
  const f = segFig(a!, b!, 360, th);
  const P = mode === 'mid' ? f.M : lerpP(f.A, f.B, pick(R, [0.32, 0.68]));
  const ang = mode === 'mid' ? th + pick(R, [70, 110]) : th + 90;
  const top = at(P, ang, 190), bot = at(P, ang + 180, 190);
  const fig: Fig = { segs: [{ id: 'AP', a: f.A, b: P, ticks: mode === 'mid' ? 1 : undefined }, { id: 'PB', a: P, b: f.B, ticks: mode === 'mid' ? 1 : undefined }, { id: 'ln', a: bot, b: top, kind: 'line', col: 'second', name: 'k' }], angles: mode === 'perp' ? [{ id: 'q', v: P, p: f.B, q: top, box: true }] : [], points: [...f.fig.points, { at: P, name: p!, dir: th - 45 }], pad: 80 };
  const opts: Opt[] = mode === 'mid' ? [
    { t: `Only if k is also perpendicular to ${sg(a! + b!)}`, ok: true, say: 'Yes: the midpoint is one of TWO conditions. A line through the midpoint at another angle is not the perpendicular bisector.' },
    { t: `Yes: k passes through the midpoint ${p}`, mc: MC.pbOne, say: 'Through the midpoint is only half of the definition: it must also be perpendicular.' },
    { t: `Yes: every line through ${p} cuts ${sg(a! + b!)} into two equal parts`, mc: MC.someConds, say: 'Every such line bisects the segment, but only one of them is perpendicular: the perpendicular bisector.' },
  ] : [
    { t: `Only if ${p} is also the midpoint of ${sg(a! + b!)}`, ok: true, say: 'Yes: perpendicular is one of TWO conditions. It must also pass through the midpoint.' },
    { t: `Yes: k is perpendicular to ${sg(a! + b!)}`, mc: MC.someConds, say: 'There is a perpendicular at every point of the segment; only the one through the midpoint bisects it.' },
    { t: `No: a perpendicular bisector cannot cross ${sg(a! + b!)}`, say: `It does cross ${sg(a! + b!)}: at the midpoint, at a right angle.` },
  ];
  const base: CBase = {
    id: `pbBoth-${n}`, family: 'pbBoth', subgoal: sgId,
    prompt: mode === 'mid' ? `Line k passes through ${p}, the midpoint of ${sg(a! + b!)}. Is k the perpendicular bisector of ${sg(a! + b!)}?` : `Line k is perpendicular to ${sg(a! + b!)} at ${p}. Is k the perpendicular bisector of ${sg(a! + b!)}?`,
    board: '\\text{both conditions}', picture: { fig, card: { lines: [`Perpendicular bisector of ${sg(a! + b!)}: a line through its midpoint AND perpendicular to it.`] } },
    solution: ['The definition has two parts joined by AND: through the midpoint, and perpendicular.', mode === 'mid' ? 'k meets the first; it is the perpendicular bisector only if it also meets the second.' : 'k meets the second; it is the perpendicular bisector only if it also meets the first.'],
  };
  return choose(R, base, opts);
});
function angleFig(o: string, a: string, b: string, x: string, deg: number, th0: number, o2: { bis?: boolean; text?: string; marks?: boolean } = {}): Fig {
  const O: Pt = [0, 0], Ae = at(O, th0, 330), Be = at(O, th0 + deg, 300), Xe = at(O, th0 + deg / 2, 340);
  const segs: GSeg[] = [{ id: 'OA', a: O, b: Ae, kind: 'ray' }, { id: 'OB', a: O, b: Be, kind: 'ray' }];
  if (o2.bis) segs.push({ id: 'OX', a: O, b: Xe, kind: 'ray', col: 'second' });
  const angles: GAngle[] = o2.marks ? [{ id: 'a1', v: O, p: Ae, q: Xe, arcs: 1, r: 90 }, { id: 'a2', v: O, p: Xe, q: Be, arcs: 1, r: 90 }] : [];
  if (o2.text) angles.push({ id: 'whole', v: O, p: Ae, q: Be, text: o2.text, r: 54, lab: 0.75 });
  return { segs, angles, points: [{ at: O, name: o, dir: th0 + deg / 2 + 180 }, { at: Ae, name: a, dir: th0 - 50 }, { at: Be, name: b, dir: th0 + deg + 50 }, ...(o2.bis ? [{ at: Xe, name: x, dir: th0 + deg / 2 + 40 }] : [])], pad: 80 };
}
export const abHalf: Gen = (R, n, sgId) => fitted('abHalf', () => {
  const [o, a, b, x] = letters(R, 4), deg = 2 * r(R, 18, 72), th0 = r(R, -20, 20);
  return numC({
    id: `abHalf-${n}`, family: 'abHalf', subgoal: sgId, unit: '°',
    prompt: `Ray ${o}${x} bisects ∠${a}${o}${b}, and m∠${a}${o}${b} = ${A(`${deg}°`)}. What is m∠${a}${o}${x}?`,
    board: `m\\angle ${a}${o}${x} = \\,?`, picture: { fig: angleFig(o!, a!, b!, x!, deg, th0, { bis: true, marks: true }) },
    solution: [`A bisector splits the angle into two congruent angles.`, `m∠${a}${o}${x} = ${deg}° ÷ 2 = ${ans(deg / 2)}°.`],
  }, deg / 2, [{ v: deg, say: 'That is the whole angle. The bisector splits it into two equal halves.' }, { v: 90 - deg / 2, say: 'That would be a complement. The bisector halves the angle itself.' }, { v: 180 - deg, say: 'Nothing here is supplementary: halve the angle.' }], `Yes: half of ${deg}° is ${deg / 2}°.`, 'A bisector cuts the angle into two equal angles.');
});
export const abMid: Gen = (R, n, sgId) => fitted('abMid', () => {
  const [a, b, c, d] = letters(R, 4);
  const B0: Pt = [0, 0], C0: Pt = [r(R, 380, 440), 0];
  const angB = r(R, 40, 62), angC = r(R, 28, 50);
  if (Math.abs(angB - angC) < 12) throw new Error('isosceles-ish');
  const A0 = (() => { const u = at(B0, angB, 1), v = at(C0, 180 - angC, 1); const d1 = sub(u, B0), d2 = sub(v, C0); const den = d1[0] * d2[1] - d1[1] * d2[0]; const t = ((C0[0] - B0[0]) * d2[1] - (C0[1] - B0[1]) * d2[0]) / den; return add(B0, [d1[0] * t, d1[1] * t] as Pt); })();
  const AB = dist(A0, B0), AC = dist(A0, C0), D0 = lerpP(B0, C0, AB / (AB + AC));   // angle bisector theorem: BD/DC = AB/AC
  const angA = 180 - angB - angC;
  const fig: Fig = { segs: [{ id: 'AB', a: A0, b: B0 }, { id: 'AC', a: A0, b: C0 }, { id: 'BC', a: B0, b: C0 }, { id: 'AD', a: A0, b: D0, col: 'second' }], angles: [{ id: 'a1', v: A0, p: B0, q: D0, arcs: 1, r: 70 }, { id: 'a2', v: A0, p: D0, q: C0, arcs: 1, r: 70 }], points: [{ at: A0, name: a!, dir: 90 }, { at: B0, name: b!, dir: 200 }, { at: C0, name: c!, dir: -20 }, { at: D0, name: d!, dir: -90 }], fills: [{ pts: [A0, B0, C0], col: 'body' }], pad: 80 };
  const opts: Opt[] = [
    { t: `Not in general: the bisector halves ∠${a}, not ${sg(b! + c!)}`, ok: true, say: `Yes: here ${b}${d} and ${d}${c} are visibly different. The bisector splits the ANGLE; it hits the midpoint of the opposite side only when ${a}${b} = ${a}${c}.` },
    { t: `Yes: a bisector always goes through the middle of the opposite side`, mc: MC.bisMid, say: `A bisector splits the angle into two equal angles. The side ${sg(b! + c!)} is split in the ratio ${a}${b} : ${a}${c}, which is not 1 : 1 here.` },
    { t: `Yes, because ∠${b}${a}${d} ≅ ∠${d}${a}${c}`, mc: MC.bisMid, say: 'Equal angles at the top do not give equal pieces at the bottom: the two triangles have different shapes.' },
  ];
  const base: CBase = {
    id: `abMid-${n}`, family: 'abMid', subgoal: sgId,
    prompt: `In △${a}${b}${c}, m∠${b} = ${angB}° and m∠${c} = ${angC}°, so m∠${a} = ${angA}°. ${sg(a! + d!)} bisects ∠${a}. Is ${d} the midpoint of ${sg(b! + c!)}?`,
    board: `${b}${d} \\; ? \\; ${d}${c}`, picture: { fig },
    solution: [`A bisector of ∠${a} makes ∠${b}${a}${d} ≅ ∠${d}${a}${c}: a statement about angles.`, `The sides ${a}${b} and ${a}${c} are not equal (the base angles differ), so ${d} is not the midpoint of ${sg(b! + c!)}.`],
  };
  return choose(R, base, opts);
});

// ===================== compass-transfer, copy-segment =====================
export const keepWidth: Gen = (R, n, sgId) => fitted('keepWidth', () => {
  const c = copySeg(R, { names: letters(R, 5) as [string, string, string, string, string] });
  const [a, b, cc, d] = c.pts.map(x => x.name);
  const opts: Opt[] = [
    { t: `${sg(cc! + d!)} is no longer as long as ${sg(a! + b!)}`, ok: true, say: 'Yes: the arc about the new point carries whatever width the compass has. A slipped width carries the wrong length.' },
    { t: `Nothing: the arc still crosses the ray, so ${sg(cc! + d!)} ≅ ${sg(a! + b!)}`, mc: MC.width, say: 'Crossing the ray is not the point: the copy is right only if the width is the one set from the segment.' },
    { t: `Nothing, as long as the needle is on ${cc}`, mc: MC.width, say: 'The needle on the right point is needed, but so is the width: both together carry the length.' },
    { t: 'The ray has to be drawn again', say: 'The ray is fine. The length on it is what went wrong.' },
  ];
  const base: CBase = {
    id: `keepWidth-${n}`, family: 'keepWidth', subgoal: sgId,
    prompt: `To copy ${sg(a! + b!)}, Ava set the compass from ${a} to ${b}. On the way to ${cc}, the compass slipped a little wider. What goes wrong?`,
    board: `${cc}${d} \\; ? \\; ${a}${b}`, picture: { cons: { c, upto: c.steps.length, over: { segs: [{ a: a!, b: b!, col: 'first', ticks: 1 }, { a: cc!, b: d!, col: 'first', ticks: 1 }] }, overLate: true } },
    solution: ['The compass carries a length only while its width stays fixed.', `Re-opened, the arc about ${cc} marks a different length: ${sg(cc! + d!)} is not a copy of ${sg(a! + b!)}.`],
  };
  return choose(R, base, opts);
});
export const copyTwice: Gen = (R, n, sgId) => fitted('copyTwice', () => {
  const c = copySeg(R, { twice: true, names: letters(R, 5) as [string, string, string, string, string] });
  const [a, b, cc, d, e] = c.pts.map(x => x.name);
  const L = r(R, 5, 19) / 2;
  return numC({
    id: `copyTwice-${n}`, family: 'copyTwice', subgoal: sgId, unit: 'cm',
    prompt: `${sg(a! + b!)} is ${A(cm(L))}. With the width from ${a} to ${b}, arcs were drawn about ${cc} (crossing at ${d}) and then about ${d} (crossing at ${e}). How long is ${sg(cc! + e!)}?`,
    board: `${cc}${e} = \\,?`, picture: { cons: { c, upto: c.steps.length, over: { segs: [{ a: cc!, b: d!, col: 'first', ticks: 1 }, { a: d!, b: e!, col: 'first', ticks: 1 }] }, overLate: true } },
    solution: [`Each arc carries the width ${a}${b} = ${cm(L)}: ${cc}${d} = ${d}${e} = ${cm(L)}.`, `${cc}${e} = ${cm(L)} + ${cm(L)} = ${ans(2 * L)} cm.`],
  }, 2 * L, [{ v: L, say: `${cc}${d} is one copy. ${e} is a second copy further along.` }, { v: 3 * L, say: 'Two arcs along the ray: two copies, not three.' }], `Yes: two copies of ${cm(L)}.`, 'Each arc adds one copy of the width.');
});
export const needleWhere: Gen = (R, n, sgId) => fitted('needleWhere', () => {
  const c = copySeg(R, { names: letters(R, 5) as [string, string, string, string, string] });
  const [a, b, cc] = c.pts.map(x => x.name);
  const opts: Opt[] = [
    { t: `On ${cc}, the endpoint of the ray`, ok: true, say: `Yes: the copy starts at ${cc}, so ${cc} is the centre: every point of the arc is ${a}${b} from ${cc}.` },
    { t: `On ${a}, where the width was set`, mc: MC.anchor, say: `An arc about ${a} marks points ${a}${b} from ${a}; the copy must start at ${cc}.` },
    { t: 'At the far end of the ray, by the arrow', mc: MC.anchor, say: 'The arrow end is not a point of the figure: the ray goes on forever. The copy starts at the endpoint.' },
    { t: `On ${b}`, mc: MC.anchor, say: `An arc about ${b} marks points ${a}${b} from ${b}, nowhere near the ray.` },
  ];
  const base: CBase = {
    id: `needleWhere-${n}`, family: 'needleWhere', subgoal: sgId, prompt: `The compass is set to ${sg(a! + b!)}. To copy ${sg(a! + b!)} onto the ray, where does the needle go?`,
    board: '\\text{needle}', picture: { cons: { c, upto: 1, after: c.steps.length } },
    solution: [`The copy must start at the ray’s endpoint ${cc}.`, `Needle on ${cc}, same width: the arc crosses the ray at the point ${a}${b} from ${cc}.`],
  };
  return choose(R, base, opts);
});
export const turnedCopy: Gen = (R, n, sgId) => fitted('turnedCopy', () => {
  const c = copySeg(R, { names: letters(R, 5) as [string, string, string, string, string] });
  const [a, b, cc, d] = c.pts.map(x => x.name);
  const L = r(R, 6, 17) / 2;
  const opts: Opt[] = [
    { t: `Yes: ${sg(cc! + d!)} ≅ ${sg(a! + b!)}, both ${cm(L)}; the direction does not matter`, ok: true, say: 'Yes: congruent segments have the same length, whichever way they point.' },
    { t: `No: a copy must point the same way as ${sg(a! + b!)}`, mc: MC.turned, say: 'Segments are congruent when they have the same length; a turned copy is still a copy.' },
    { t: `Only if the ray is parallel to ${sg(a! + b!)}`, mc: MC.turned, say: 'Parallel has nothing to do with it: the compass carried the length.' },
  ];
  const base: CBase = {
    id: `turnedCopy-${n}`, family: 'turnedCopy', subgoal: sgId, prompt: `${sg(a! + b!)} = ${A(cm(L))} was copied onto a ray that points another way, giving ${sg(cc! + d!)}. Is ${sg(cc! + d!)} congruent to ${sg(a! + b!)}?`,
    board: `${cc}${d} \\cong ${a}${b}?`, picture: { cons: { c, upto: c.steps.length, over: { segs: [{ a: a!, b: b!, col: 'first', ticks: 1 }, { a: cc!, b: d!, col: 'first', ticks: 1 }] }, overLate: true } },
    solution: [`The compass carried the width ${a}${b}: ${cc}${d} = ${cm(L)}.`, 'Same length, so the segments are congruent: a rotation and a translation carry one onto the other.'],
  };
  return choose(R, base, opts);
});

// ===================== equilateral triangle =====================
export const eqWhy: Gen = (R, n, sgId) => fitted('eqWhy', () => {
  const c = equilateral(R, { orient: pick(R, ['h', 's']), names: letters(R, 4) as [string, string, string, string] });
  const [a, b, cc] = c.pts.map(x => x.name);
  const opts: Opt[] = [
    { t: `${cc}${a} = ${a}${b} (on the arc about ${a} with width ${a}${b}) and ${cc}${b} = ${a}${b} (on the arc about ${b}, same width)`, ok: true, say: 'Yes: both arcs have width AB, and the crossing is on both.' },
    { t: 'It looks equilateral, and the arcs are neat', mc: MC.appearance, say: 'Looks are not a reason. The arcs force the distances: that is the reason.' },
    { t: `${cc}${a} = ${cc}${b}, because ${cc} is right above the middle of ${sg(a! + b!)}`, mc: MC.someConds, say: `That gives two equal sides only. Equilateral needs all three equal to ${a}${b}.` },
    { t: 'Any two arcs that cross make an equilateral triangle', mc: MC.width, say: `Only arcs with width exactly ${a}${b}. Other widths give an isosceles triangle, or one with no equal sides.` },
  ];
  const base: CBase = {
    id: `eqWhy-${n}`, family: 'eqWhy', subgoal: sgId, prompt: `${KIND_GOAL.equilateral(c)} Why is △${a}${b}${cc} equilateral?`,
    board: `${a}${b} = ${b}${cc} = ${cc}${a}`, picture: { cons: { c, upto: c.steps.length, over: { segs: [{ a: a!, b: b!, col: 'first', ticks: 1 }, { a: a!, b: cc!, col: 'first', ticks: 1 }, { a: b!, b: cc!, col: 'first', ticks: 1 }] }, overLate: true } },
    solution: [`The arc about ${a} has width ${a}${b}: ${cc}${a} = ${a}${b}.`, `The arc about ${b} has the same width: ${cc}${b} = ${a}${b}. All three sides equal ${a}${b}.`],
  };
  return choose(R, base, opts);
});
export const eqRhombus: Gen = (R, n, sgId) => fitted('eqRhombus', () => {
  const c = equilateral(R, { both: true, orient: pick(R, ['h', 's']), names: letters(R, 4) as [string, string, string, string] });
  const [a, b, cc, d] = c.pts.map(x => x.name);
  const L = r(R, 5, 18) / 2;
  return numC({
    id: `eqRhombus-${n}`, family: 'eqRhombus', subgoal: sgId, unit: 'cm',
    prompt: `${sg(a! + b!)} = ${A(cm(L))}. The arcs with width ${a}${b} cross twice, at ${cc} and ${d}. What is the perimeter of ${a}${cc}${b}${d}?`,
    board: `P(${a}${cc}${b}${d}) = \\,?`, picture: { cons: { c, upto: c.steps.length } },
    solution: [`Each crossing is ${a}${b} from ${a} and from ${b}: ${a}${cc} = ${cc}${b} = ${b}${d} = ${d}${a} = ${cm(L)}.`, `Perimeter = 4 × ${cm(L)} = ${ans(4 * L)} cm.`],
  }, 4 * L, [{ v: 3 * L, say: 'That is one triangle. The four outer sides of the rhombus are all equal to AB.' }, { v: 5 * L, say: `${sg(a! + b!)} is inside the shape, a diagonal, not part of its perimeter.` }, { v: 2 * L, say: 'Count all four outer sides.' }], `Yes: four sides of ${cm(L)}.`, 'All four outer sides equal the compass width.');
});

// ===================== perpendicular bisector, midpoint =====================
export const pbWidth: Gen = (R, n, sgId) => fitted('pbWidth', () => {
  const names = letters(R, 5) as [string, string, string, string, string];
  const d = r(R, 6, 12), right = d / 2 + r(R, 1, 4) / 2;
  const c = perpBis(R, { names, w: 320 * (right / d) });
  const [a, b] = names;
  const wrongs = shuffle(R, [d / 2, d / 2 - 0.5, d / 2 - 1, d / 4].filter(w => w > 0.4)).slice(0, 3);
  const opts: Opt[] = [{ t: cm(right), ok: true, say: `Yes: ${cm(right)} is more than half of ${cm(d)}, so the arcs cross twice.` }, ...wrongs.map(w => ({ t: cm(w), mc: MC.noMeet, say: w === d / 2 ? 'Exactly half: the arcs only touch, at one point. You need two crossings for a line.' : `${cm(w)} is less than half of ${cm(d)}: the arcs never meet.` }))];
  const base: CBase = {
    id: `pbWidth-${n}`, family: 'pbWidth', subgoal: sgId,
    prompt: `${sg(a + b)} is ${A(cm(d))} long. Which compass width works for the equal arcs about ${a} and ${b}?`,
    board: `${a}${b} = ${d}`, picture: { cons: { c, upto: 0, after: 3 } },
    solution: [`The arcs must cross twice, so the width must be more than half of ${sg(a + b)}: more than ${cm(d / 2)}.`, `Only ${ans(cm(right))} is.`],
  };
  return choose(R, base, opts);
});
export const midPick: Gen = (R, n, sgId) => fitted('midPick', () => {
  const names = letters(R, 5) as [string, string, string, string, string];
  const c = perpBis(R, { names });
  const [a, b, p, q, m] = names;
  const opts: Opt[] = [
    { t: m, ok: true, say: `Yes: ${m} is where the bisector crosses ${sg(a + b)}. It is on the segment and equally far from both ends.` },
    { t: p, mc: MC.midMis, say: `${p} is equally far from ${a} and ${b}, but it is not on ${sg(a + b)}. A midpoint must lie on the segment.` },
    { t: q, mc: MC.midMis, say: `${q} is an arc crossing: equally far from ${a} and ${b}, but off the segment. The midpoint is on ${sg(a + b)}.` },
  ];
  const base: CBase = {
    id: `midPick-${n}`, family: 'midPick', subgoal: sgId, prompt: `${KIND_GOAL.perpBis(c)} Which point is the midpoint of ${sg(a + b)}?`,
    board: `\\text{midpoint of } \\overline{${a}${b}}`, picture: { cons: { c, upto: c.steps.length, over: { ring: [m] }, overLate: true } },
    solution: [`${p} and ${q} are where the arcs cross: each is equally far from ${a} and ${b}, but off the segment.`, `The midpoint is where line ${p}${q} crosses ${sg(a + b)}: ${S(m)}.`],
  };
  return choose(R, base, opts);
});
export const midNum: Gen = (R, n, sgId) => fitted('midNum', () => {
  const names = letters(R, 5) as [string, string, string, string, string];
  const c = perpBis(R, { names });
  const [a, b, p, q, m] = names;
  const d = r(R, 7, 19);
  const pa = Math.round(((d * dist(c.pts[2]!.at, c.pts[0]!.at)) / dist(c.pts[0]!.at, c.pts[1]!.at)) * 10) / 10;
  return numC({
    id: `midNum-${n}`, family: 'midNum', subgoal: sgId, unit: 'cm',
    prompt: `${sg(a + b)} = ${A(cm(d))}. Line ${p}${q} is its constructed perpendicular bisector and crosses ${sg(a + b)} at ${m}. How long is ${sg(a + m)}?`,
    board: `${a}${m} = \\,?`, picture: { cons: { c, upto: c.steps.length } },
    solution: [`${m} is where the bisector crosses the segment: the midpoint.`, `${a}${m} = ${d} ÷ 2 = ${ans(d / 2)} cm.`],
  }, d / 2, [{ v: d, say: `That is the whole of ${sg(a + b)}. ${m} is halfway.` }, { v: pa, mc: MC.midMis, say: `That is about ${p}${a}, an arc point's distance. ${m} is on the segment.` }], `Yes: half of ${cm(d)}.`, `${m} is the midpoint: half of ${sg(a + b)}.`);
});

// ===================== angle bisector =====================
export const abFlawRays: Gen = (R, n, sgId) => fitted('abFlawRays', () => {
  const names = letters(R, 4) as [string, string, string, string];
  const c = angleBis(R, { unequal: true, names, deg: r(R, 50, 120) });
  const [o, a, b, x] = names;
  const err = Math.abs(measure(c.pts[0]!.at, c.pts[1]!.at, c.pts[3]!.at) - measure(c.pts[0]!.at, c.pts[2]!.at, c.pts[3]!.at));
  if (err < 4) throw new Error('flaw too small to see');
  const opts: Opt[] = [
    { t: `No: ${o}${a} ≠ ${o}${b}, so the two triangles are not congruent`, ok: true, say: 'Yes: the bisector proof needs OA = OB, from ONE arc about the vertex. Two different arcs break it.' },
    { t: `Yes: the arcs about ${a} and ${b} had the same width`, mc: MC.rayMarks, say: `Equal arcs from ${a} and ${b} give ${x}${a} = ${x}${b}, but the marks themselves must be equally far from ${o}.` },
    { t: `Yes: ${x} lies between the two sides`, mc: MC.appearance, say: 'Every ray inside the angle lies between the sides. Only one of them halves it.' },
  ];
  const base: CBase = {
    id: `abFlawRays-${n}`, family: 'abFlawRays', subgoal: sgId, prompt: `Mia marked ${a} and ${b} on the sides with two DIFFERENT arcs about ${o}, then drew equal arcs from ${a} and ${b} and ray ${o}${x}. Does ray ${o}${x} bisect the angle?`,
    board: `${o}${a} \\; ? \\; ${o}${b}`, picture: { cons: { c, upto: c.steps.length, over: { segs: [{ a: o, b: a, col: 'wrong' }, { a: o, b: b, col: 'wrong' }], bad: ['arcO'] }, overLate: true } },
    solution: [`The proof uses △${o}${a}${x} ≅ △${o}${b}${x} by SSS: it needs ${o}${a} = ${o}${b}, ${x}${a} = ${x}${b} and the shared ${o}${x}.`, `Here ${o}${a} ≠ ${o}${b}: the triangles differ, so the two angles at ${o} differ.`],
  };
  return choose(R, base, opts);
});
export const abArbitrary: Gen = (R, n, sgId) => fitted('abArbitrary', () => {
  const [o, a, b, m] = letters(R, 4);
  const deg = r(R, 50, 110), th0 = r(R, -15, 15), O: Pt = [0, 0];
  const ra = r(R, 150, 200), rb = ra + pick(R, [1, -1]) * r(R, 70, 110);
  const A0 = at(O, th0, ra), B0 = at(O, th0 + deg, rb), M0 = lerpP(A0, B0, 0.5);
  const tip = at(O, Math.atan2(M0[1], M0[0]) * 180 / Math.PI, Math.max(dist(O, M0) + 120, 330));
  const off = Math.abs(measure(O, A0, M0) - measure(O, B0, M0));
  if (off < 5) throw new Error('too close to a bisector');
  const c: Cons = { kind: 'angleBis', given: [ray(O, at(O, th0, 360)), ray(O, at(O, th0 + deg, 360))], givenArcs: [], pts: [{ name: o!, at: O, deps: [] }, { name: a!, at: A0, deps: [] }, { name: b!, at: B0, deps: [] }, { name: m!, at: M0, deps: ['ab'] }], steps: [{ id: 'ab', tool: 'straightedge', text: '', needs: [a!, b!], after: [], arcs: [], lines: [seg(A0, B0, 'aux')] }, { id: 'ray', tool: 'straightedge', text: '', needs: [o!, m!], after: [], arcs: [], lines: [ray(O, tip, 'result')] }] };
  const opts: Opt[] = [
    { t: `No: that works only when ${o}${a} = ${o}${b}`, ok: true, say: `Yes: with ${o}${a} ≠ ${o}${b} the midpoint of ${sg(a! + b!)} is pulled toward the nearer mark, and the two angles at ${o} differ.` },
    { t: `Yes: the midpoint of ${sg(a! + b!)} is halfway between the sides`, mc: MC.bisArb, say: 'Halfway along a slanted segment is not halfway in angle. The marks must be equally far from the vertex first.' },
    { t: `Yes: any ray from ${o} through ${sg(a! + b!)} bisects the angle`, mc: MC.bisArb, say: 'There are many rays through the segment; only one halves the angle.' },
  ];
  const base: CBase = {
    id: `abArbitrary-${n}`, family: 'abArbitrary', subgoal: sgId, prompt: `Sam marked ${a} and ${b} on the sides of ∠${o} at different distances from ${o}, joined them, and drew the ray from ${o} through ${m}, the midpoint of ${sg(a! + b!)}. Does it bisect ∠${o}?`,
    board: `\\angle ${a}${o}${m} \\; ? \\; \\angle ${m}${o}${b}`, picture: { cons: { c, upto: 2 } },
    solution: [`△${o}${a}${m} and △${o}${b}${m} share ${o}${m} and have ${a}${m} = ${m}${b}, but ${o}${a} ≠ ${o}${b}.`, 'Without the third pair the angles at the vertex need not match: here they do not.'],
  };
  return choose(R, base, opts);
});

// ===================== perpendiculars =====================
export const ponWrong: Gen = (R, n, sgId) => fitted('ponWrong', () => {
  const names = letters(R, 4) as [string, string, string, string];
  const c = perpAt(R, { off: true, names });
  const [p, a, b, x] = names;
  const opts: Opt[] = [
    { t: `No: ${p}${a} ≠ ${p}${b}, so line ${p}${x} misses the right angle`, ok: true, say: `Yes: the equal arcs put ${x} on the perpendicular bisector of ${sg(a + b)}. That line goes through ${p} only if ${p} is the midpoint of ${sg(a + b)}.` },
    { t: `Yes: the arcs about ${a} and ${b} had the same width`, mc: MC.wrongPlace, say: `Equal arcs build the perpendicular bisector of ${sg(a + b)}, which crosses ℓ at the MIDPOINT of ${sg(a + b)}, not at ${p}.` },
    { t: `Yes: ${x} is across from ${p}`, mc: MC.appearance, say: 'Looking across is not a right angle. Check what the arcs force.' },
  ];
  const base: CBase = {
    id: `ponWrong-${n}`, family: 'ponWrong', subgoal: sgId, prompt: `To draw the perpendicular to ℓ at ${p}, Leo marked ${a} and ${b} with two different arcs about ${p}, then drew equal arcs from ${a} and ${b} crossing at ${x}. Is line ${p}${x} perpendicular to ℓ?`,
    board: `${p}${a} \\; ? \\; ${p}${b}`, picture: { cons: { c, upto: c.steps.length, over: { segs: [{ a: p, b: a, col: 'wrong' }, { a: p, b: b, col: 'wrong' }], bad: ['arcP'] }, overLate: true } },
    solution: [`The construction needs ${p}${a} = ${p}${b}: then ${p} is the midpoint of ${sg(a + b)}, and the bisector of ${sg(a + b)} passes through ${p}.`, `Here ${p}${a} ≠ ${p}${b}, so the bisector of ${sg(a + b)} misses ${p} and line ${p}${x} is not perpendicular.`],
  };
  return choose(R, base, opts);
});
export const ponSlant: Gen = (R, n, sgId) => fitted('ponSlant', () => {
  const names = letters(R, 4) as [string, string, string, string];
  const c = perpAt(R, { orient: 's', names });
  const [p, , , x] = names;
  const tilt = Math.round(Math.abs(((Math.atan2(c.given[0]!.b[1] - c.given[0]!.a[1], c.given[0]!.b[0] - c.given[0]!.a[0]) * 180) / Math.PI)));
  const nm2 = pick(R, ['Lena', 'Omar', 'Kai', 'Jada', 'Theo']);
  const opts: Opt[] = [
    { t: `The construction: line ${p}${x} makes 90° with ℓ, and ℓ is tilted, so ${p}${x} is tilted too`, ok: true, say: 'Yes: perpendicular means a right angle with THE LINE, whatever direction the line has on the page.' },
    { t: `${nm2}: a perpendicular always runs straight up the page`, mc: MC.vertical, say: 'Straight up the page is perpendicular only to a horizontal line. This ℓ is tilted.' },
    { t: 'Both: it depends on how you hold the page', mc: MC.vertical, say: 'Turning the page turns ℓ and the perpendicular together: the right angle between them stays.' },
  ];
  const base: CBase = {
    id: `ponSlant-${n}`, family: 'ponSlant', subgoal: sgId, prompt: `ℓ is tilted about ${tilt}° from horizontal. ${nm2} says the perpendicular to ℓ at ${p} should be vertical on the page, but the construction drew a tilted line ${p}${x}. Who is right?`,
    board: `${p}${x} \\perp \\ell`, picture: { cons: { c, upto: c.steps.length } },
    solution: [`The arcs put ${x} on the perpendicular bisector of a segment of ℓ centred at ${p}.`, 'That line makes 90° with ℓ itself. Since ℓ is tilted, so is its perpendicular.'],
  };
  return choose(R, base, opts);
});
export const poffRadius: Gen = (R, n, sgId) => fitted('poffRadius', () => {
  const names = letters(R, 5) as [string, string, string, string, string];
  const c = perpFrom(R, { names });
  const [p] = names;
  const P = c.pts[0]!.at, l = c.given[0]!;
  const dModel = lineDist(P, l.a, l.b), d = r(R, 3, 7), s = dModel / d;
  const radModel = c.steps[0]!.arcs[0]!.r, right = Math.round((radModel / s) * 2) / 2;
  if (right <= d + 0.4) throw new Error('radius');
  const opts: Opt[] = [
    { t: cm(right), ok: true, say: `Yes: ${cm(right)} is more than ${cm(d)}, so the arc cuts ℓ twice.` },
    { t: cm(d), mc: MC.tangent, say: `Exactly ${cm(d)} only TOUCHES ℓ at one point (the foot). You need two points to bisect.` },
    { t: cm(d - 1), mc: MC.noMeet, say: `${cm(d - 1)} is less than the distance to ℓ: the arc never reaches the line.` },
    { t: cm(d / 2), mc: MC.noMeet, say: 'Half the distance does not reach the line at all.' },
  ];
  const base: CBase = {
    id: `poffRadius-${n}`, family: 'poffRadius', subgoal: sgId,
    prompt: `${p} is ${A(cm(d))} from line ℓ. To construct the perpendicular from ${p}, which compass width about ${p} works?`,
    board: `d = ${d}`, picture: { cons: { c, upto: 0, after: 1 } },
    solution: [`The arc about ${p} must cross ℓ at TWO points, so the width must be more than the distance ${cm(d)}.`, `Only ${ans(cm(right))} is. Exactly ${cm(d)} just touches ℓ.`],
  };
  return choose(R, base, opts);
});
export const connector: Gen = (R, n, sgId) => fitted('connector', () => {
  const names = letters(R, 6);
  const c0 = perpFrom(R, { names: names.slice(0, 5) as [string, string, string, string, string] });
  const [p, , , x, f] = c0.pts.map(q => q.name);
  const g = names[5]!, F = c0.pts[4]!.at, l = c0.given[0]!;
  const u = sub(l.b, l.a), L = Math.hypot(u[0], u[1]), t = pick(R, [1, -1]) * r(R, 110, 170);
  const G2: Pt = add(F, [(u[0] / L) * t, (u[1] / L) * t]);
  const c: Cons = { ...c0, pts: [...c0.pts, { name: g, at: G2, deps: [] }] };
  const opts: Opt[] = [
    { t: `No: only line ${p}${x}, through the constructed point, is perpendicular`, ok: true, say: `Yes: ${p}${g} is just some segment from ${p} to ℓ. The perpendicular is the one the arcs force: through ${x}, meeting ℓ at ${f}.` },
    { t: `Yes: any segment from ${p} down to ℓ is perpendicular to it`, mc: MC.connector, say: 'Many segments join P to ℓ, at many angles. Exactly one of them makes a right angle.' },
    { t: `Yes: ${p}${g} is the shortest way from ${p} to ℓ`, mc: MC.connector, say: `The shortest way is the perpendicular ${p}${f}; ${p}${g} is longer.` },
  ];
  const base: CBase = {
    id: `connector-${n}`, family: 'connector', subgoal: sgId, prompt: `The perpendicular from ${p} to ℓ was constructed (line ${p}${x}). ${g} is another point of ℓ. Is ${sg(p! + g)} perpendicular to ℓ?`,
    board: `${p}${g} \\perp \\ell?`, picture: { cons: { c, upto: c.steps.length, over: { segs: [{ a: p!, b: g, col: 'wrong', dash: true }], angs: [{ v: f!, p: p!, q: g, col: 'link', box: true }] }, overLate: true } },
    solution: [`The arcs force line ${p}${x} to be perpendicular to ℓ (it is the perpendicular bisector of the two marks on ℓ).`, `${sg(p! + g)} is a different segment, so it is not perpendicular.`],
  };
  return choose(R, base, opts);
});

// ===================== inscribed polygons =====================
export const hexClose: Gen = (R, n, sgId) => fitted('hexClose', () => {
  const c = hexagon(R, { names: ['O', ...letters(R, 6, 'O')] });
  const N = c.pts.map(q => q.name);
  const opts: Opt[] = [
    { t: `Exactly on ${N[1]}: each step makes a 60° central angle, and 6 × 60° = 360°`, ok: true, say: 'Yes: chord = radius makes an equilateral triangle with the centre, so each step turns exactly 60°.' },
    { t: `Only approximately: the steps always drift a little`, mc: MC.hexApprox, say: 'In a real drawing the pencil drifts; in the ideal construction it closes exactly: six equilateral triangles fill 360°.' },
    { t: `It overshoots: the circle is 2π ≈ 6.28 radii around`, mc: MC.hexApprox, say: 'The steps are chords (straight), not arcs along the circle. Six chords of one radius close exactly.' },
  ];
  const base: CBase = {
    id: `hexClose-${n}`, family: 'hexClose', subgoal: sgId, prompt: `With the compass at the radius of the circle about ${N[0]}, the marks ${N[2]}, ${N[3]}, ${N[4]}, ${N[5]}, ${N[6]} were stepped round from ${N[1]}. Where does the next step from ${N[6]} land?`,
    board: `6 \\times 60^\\circ`, picture: { cons: { c, upto: 6, over: { segs: [{ a: 'O', b: N[1]!, col: 'first' }, { a: 'O', b: N[2]!, col: 'first' }, { a: N[1]!, b: N[2]!, col: 'first' }] }, overLate: true } },
    solution: [`${N[0]}${N[1]} = ${N[0]}${N[2]} = radius, and ${N[1]}${N[2]} = radius (the compass width): an equilateral triangle, so ∠${N[1]}${N[0]}${N[2]} = 60°.`, 'Six such steps make 360°: the sixth lands exactly back on the start.'],
  };
  return choose(R, base, opts);
});
export const centralAngle: Gen = (R, n, sgId) => fitted('centralAngle', () => {
  const which = pick(R, ['hex', 'tri', 'sq']);
  const c = which === 'sq' ? square(R, { names: ['O', ...letters(R, 4, 'O')] as [string, string, string, string, string] }) : hexagon(R, { tri: which === 'tri', names: ['O', ...letters(R, 6, 'O')] });
  const N = c.pts.map(q => q.name);
  const [v1, v2] = which === 'sq' ? [N[1]!, N[3]!] : which === 'tri' ? [N[1]!, N[3]!] : [N[1]!, N[2]!];
  const a = which === 'hex' ? 60 : which === 'tri' ? 120 : 90;
  const shape = which === 'hex' ? 'regular hexagon' : which === 'tri' ? 'equilateral triangle' : 'square';
  return numC({
    id: `centralAngle-${n}`, family: 'centralAngle', subgoal: sgId, unit: '°',
    prompt: `${KIND_GOAL[c.kind](c)} ${v1} and ${v2} are neighbouring vertices of the ${shape}. What is m∠${v1}${N[0]}${v2}, the central angle?`,
    board: `m\\angle ${v1}${N[0]}${v2} = \\,?`, picture: { cons: { c, upto: c.steps.length, over: { segs: [{ a: N[0]!, b: v1, col: 'first' }, { a: N[0]!, b: v2, col: 'first' }] }, overLate: true } },
    solution: [`A regular polygon in a circle splits the full turn into equal central angles.`, `360° ÷ ${360 / a} = ${ans(a)}°.`],
  }, a, [{ v: which === 'hex' ? 120 : which === 'tri' ? 60 : 45, say: which === 'sq' ? 'That is half a corner of the square. The central angle is at the centre.' : 'That is the angle at a vertex, not at the centre.' }, { v: 360, say: 'That is the full turn; split it equally.' }], `Yes: ${360 / a} equal central angles of ${a}°.`, `Divide 360° by the number of vertices.`);
});
export const polyJoin: Gen = (R, n, sgId) => fitted('polyJoin', () => {
  const skew = half(R);
  const c = square(R, { skew, names: ['O', ...letters(R, 4, 'O')] as [string, string, string, string, string] });
  const N = c.pts.map(q => q.name);
  const q4 = `${N[1]}${N[3]}${N[2]}${N[4]}`;
  const opts: Opt[] = skew ? [
    { t: 'No: the diameters are not perpendicular, so it is a rectangle', ok: true, say: 'Yes: equal diagonals that bisect each other give a rectangle. A square also needs them perpendicular.' },
    { t: 'Yes: any two diameters make a square', mc: MC.anyDiam, say: 'Two diameters always give a rectangle (equal diagonals). It is a square only if they cross at 90°.' },
    { t: 'Yes: all four vertices are on the circle', mc: MC.oneCond, say: 'Every rectangle in a circle has its vertices on the circle. That one condition does not make it regular.' },
  ] : [
    { t: 'Yes: the diameters are perpendicular, so the four central angles are 90°', ok: true, say: 'Yes: congruent radii with congruent 90° central angles give four congruent sides and four right angles.' },
    { t: 'No: you would still have to measure the sides', mc: MC.eye, say: 'The construction guarantees it: equal radii and equal central angles force equal sides. No measuring needed.' },
    { t: 'No: it is only a rectangle', mc: MC.anyDiam, say: 'It would be only a rectangle if the diameters were not perpendicular. These were constructed perpendicular.' },
  ];
  const base: CBase = {
    id: `polyJoin-${n}`, family: 'polyJoin', subgoal: sgId, prompt: skew ? `Two diameters ${sg(N[1]! + N[2]!)} and ${sg(N[3]! + N[4]!)} were drawn through ${N[0]} (the second just another diameter), and the endpoints joined in order. Is ${q4} a square?` : `${sg(N[1]! + N[2]!)} is a diameter and ${sg(N[3]! + N[4]!)} was constructed as its perpendicular bisector; the endpoints were joined in order. Is ${q4} a square?`,
    board: `${q4}`, picture: { cons: { c, upto: c.steps.length, over: { angs: [{ v: N[0]!, p: N[1]!, q: N[3]!, col: skew ? 'wrong' : 'link', box: !skew }] }, overLate: true } },
    solution: skew ? ['Two diameters are equal and bisect each other: the quadrilateral is a rectangle.', `Here the central angles are not 90°, so its sides are not all equal: not a square.`] : ['Perpendicular diameters make four 90° central angles.', 'Equal radii with equal central angles give four equal sides; each corner is 45° + 45° = 90°: a square.'],
  };
  return choose(R, base, opts);
});

// ===================== copy an angle =====================
export const caChord: Gen = (R, n, sgId) => fitted('caChord', () => {
  const names = letters(R, 6) as [string, string, string, string, string, string];
  const c = copyAngle(R, { names });
  const [o, a, b] = names;
  const opts: Opt[] = [
    { t: `From ${a} to ${b}: the distance between where the first arc crosses the sides`, ok: true, say: 'Yes: the chord AB records how far the sides spread at that radius. Carrying it fixes the angle.' },
    { t: 'Keep the same radius as the arcs', mc: MC.radiusOnly, say: 'With the radius again, the new crossing makes a 60° angle every time, whatever angle you started with.' },
    { t: `The full length of the side ${o}${a} as it is drawn`, mc: MC.armLen, say: 'The drawn length of a side says nothing about the angle: sides can be drawn as long as you like.' },
  ];
  const base: CBase = {
    id: `caChord-${n}`, family: 'caChord', subgoal: sgId, prompt: `${KIND_GOAL.copyAngle(c)} The two equal arcs are drawn. To what width do you set the compass next?`,
    board: '\\text{the chord}', picture: { cons: { c, upto: 2, after: 4, over: { segs: [{ a: a, b: b, col: 'first', ticks: 2 }] }, overLate: true } },
    solution: [`The arc about ${o} crosses the sides at ${a} and ${b}; the angle is fixed by how far apart they are at that radius.`, `Set the compass from ${a} to ${b}, and carry that chord to the copy.`],
  };
  return choose(R, base, opts);
});
export const armLength: Gen = (R, n, sgId) => fitted('armLength', () => {
  const names = letters(R, 6) as [string, string, string, string, string, string];
  const c = copyAngle(R, { names, long: true });
  const [o, a, b, o2, a2, b2] = names;
  const opts: Opt[] = [
    { t: 'No: an angle is the turn between its sides, not how long they are drawn', ok: true, say: 'Yes: the copy has the same turn: the same chord at the same radius.' },
    { t: 'Yes: longer sides make a bigger angle', mc: MC.armLen, say: 'Side length is just how far you drew the rays; rays go on forever anyway.' },
    { t: 'Yes, a little: its arc was drawn longer', mc: MC.armLen, say: 'How long an arc is drawn changes nothing; its radius and the chord fix the angle.' },
  ];
  const base: CBase = {
    id: `armLength-${n}`, family: 'armLength', subgoal: sgId, prompt: `∠${a}${o}${b} was copied to ∠${a2}${o2}${b2}, and the copy’s sides were drawn much longer. Is the copy a bigger angle?`,
    board: `\\angle ${a2}${o2}${b2} \\; ? \\; \\angle ${a}${o}${b}`, picture: { cons: { c, upto: c.steps.length, over: { angs: [{ v: o, p: a, q: b, col: 'first' }, { v: o2, p: a2, q: b2, col: 'first' }] }, overLate: true } },
    solution: ['An angle measures the turn from one side to the other.', 'The copy was built with the same radius and the same chord, so it has the same measure, however long its sides are drawn.'],
  };
  return choose(R, base, opts);
});

// ===================== parallels =====================
export const secondPerp: Gen = (R, n, sgId) => fitted('secondPerp', () => {
  const c = parallelPerp(R, { names: letters(R, 3) as [string, string, string] });
  const [p, f] = c.pts.map(q => q.name);
  const opts: Opt[] = [
    { t: `At ${p}, perpendicular to m`, ok: true, say: `Yes: a line through ${p} perpendicular to m is parallel to ℓ, because ℓ is perpendicular to m too.` },
    { t: `At ${f}, perpendicular to m`, mc: MC.atFoot, say: `At ${f} the perpendicular to m is ℓ itself. The new line must go through ${p}.` },
    { t: `At ${p}, perpendicular to ℓ`, mc: MC.slopeSwap, say: `The line through ${p} perpendicular to ℓ is m again. You want perpendicular to m.` },
  ];
  const base: CBase = {
    id: `secondPerp-${n}`, family: 'secondPerp', subgoal: sgId, prompt: `${KIND_GOAL.parallelPerp(c)} Line m, the perpendicular from ${p} to ℓ (foot ${f}), is drawn. Where do you construct the second perpendicular?`,
    board: '\\text{second perpendicular}', picture: { cons: { c, upto: 2, after: c.steps.length } },
    solution: ['Two lines in a plane that are perpendicular to the same line are parallel.', `ℓ ⊥ m already; so build the line through ${p} perpendicular to m.`],
  };
  return choose(R, base, opts);
});
export const ddWhy: Gen = (R, n, sgId) => fitted('ddWhy', () => {
  const c = parallelPerp(R, { names: letters(R, 3) as [string, string, string] });
  const [p, , y] = c.pts.map(q => q.name);
  const opts: Opt[] = [
    { t: `n and ℓ are both perpendicular to m, and two lines perpendicular to the same line are parallel`, ok: true, say: 'Yes: that is exactly what the two perpendiculars were built for.' },
    { t: 'n stays the same distance from ℓ on the drawing', mc: MC.appearance, say: 'On a drawing everything looks about right. The reason is what the steps force: two right angles with m.' },
    { t: 'n is perpendicular to ℓ', mc: MC.slopeSwap, say: 'Perpendicular to ℓ would cross it at a right angle. n never meets ℓ.' },
  ];
  const base: CBase = {
    id: `ddWhy-${n}`, family: 'ddWhy', subgoal: sgId, prompt: `${KIND_GOAL.parallelPerp(c)} Why is line n (= ${p}${y}) parallel to ℓ?`,
    board: 'n \\parallel \\ell', picture: { cons: { c, upto: c.steps.length } },
    solution: ['m ⊥ ℓ (first construction) and n ⊥ m (second construction).', 'In a plane, two lines perpendicular to the same line are parallel: n ∥ ℓ.'],
  };
  return choose(R, base, opts);
});
export const corrCheck: Gen = (R, n, sgId) => fitted('corrCheck', () => {
  const wrong = half(R);
  const names = letters(R, 6) as [string, string, string, string, string, string];
  const c = parallelCorr(R, { wrongSide: wrong, names });
  const [p, q, a, b, b2, a2] = names;
  const opts: Opt[] = wrong ? [
    { t: 'No: the angle was copied into a position that is not corresponding', ok: true, say: `Yes: corresponding means the same position at each crossing: on the same side of t as ${a}. This copy sits on the other side.` },
    { t: 'Yes: the copied angle is congruent, so the lines are parallel', mc: MC.nonCorr, say: 'Congruent angles force parallel lines only in corresponding (or alternate) positions.' },
    { t: `Yes: line ${p}${a2} looks parallel`, mc: MC.appearance, say: 'Look at the steps, not the look: where was the angle copied?' },
  ] : [
    { t: 'Yes: the copy is in the corresponding position, so the lines are parallel', ok: true, say: `Yes: ∠${a2}${p}${b2} matches ∠${a}${q}${b} in the same position at each crossing of t.` },
    { t: `No: the angle at ${p} is on the far side of t`, mc: MC.nonCorr, say: `The copy is on the same side of t as ${a}, and above ℓ: exactly the corresponding position.` },
    { t: 'Only if you measure both angles first', mc: MC.eye, say: 'The compass already made the angles congruent; no measuring needed.' },
  ];
  const opt0 = opts;
  const base: CBase = {
    id: `corrCheck-${n}`, family: 'corrCheck', subgoal: sgId, prompt: `The angle at ${q} between ℓ and t was copied to ${p}, giving line ${p}${a2}. Is line ${p}${a2} parallel to ℓ?`,
    board: `${p}${a2} \\parallel \\ell ?`, picture: { cons: { c, upto: c.steps.length, over: { angs: [{ v: q, p: a, q: b, col: 'first' }, { v: p, p: a2, q: b2, col: wrong ? 'wrong' : 'first' }] }, overLate: true } },
    solution: [`At ${q} the angle sits between ℓ (toward ${a}) and t (toward ${p}).`, wrong ? `At ${p} the copy sits on the OTHER side of t: not corresponding, so the line is not parallel.` : `At ${p} the copy sits between t (beyond ${p}) and the same side as ${a}: corresponding. Congruent corresponding angles force ${p}${a2} ∥ ℓ.`],
  };
  return choose(R, base, opt0);
});
export const corrWhy: Gen = (R, n, sgId) => fitted('corrWhy', () => {
  const names = letters(R, 6) as [string, string, string, string, string, string];
  const c = parallelCorr(R, { names });
  const [p, q, a, b, b2, a2] = names;
  const opts: Opt[] = [
    { t: 'Congruent corresponding angles at a transversal force the lines to be parallel', ok: true, say: 'Yes: that is the converse direction, the one this construction needs. (Slide ℓ along t: the angle lands on the copy.)' },
    { t: 'Parallel lines make congruent corresponding angles', mc: MC.converse, say: 'True, but it is the other direction: it starts from parallel lines. Here you must conclude that they are parallel.' },
    { t: `Line ${p}${a2} looks parallel to ℓ`, mc: MC.appearance, say: 'Looks prove nothing; the steps force the congruent angles, and a theorem turns those into parallel lines.' },
  ];
  const base: CBase = {
    id: `corrWhy-${n}`, family: 'corrWhy', subgoal: sgId, prompt: `∠${a2}${p}${b2} was constructed congruent to ∠${a}${q}${b}, in the corresponding position. Which statement justifies ${p}${a2} ∥ ℓ?`,
    board: `${p}${a2} \\parallel \\ell`, picture: { cons: { c, upto: c.steps.length, over: { angs: [{ v: q, p: a, q: b, col: 'first' }, { v: p, p: a2, q: b2, col: 'first' }] } } },
    solution: ['The construction gives congruent corresponding angles.', 'The converse of the corresponding angles postulate: congruent corresponding angles make the lines parallel.'],
  };
  return choose(R, base, opts);
});

// ===================== other tools =====================
export const foldWhich: Gen = (R, n, sgId) => fitted('foldWhich', () => {
  const [a, b, p] = letters(R, 3) as [string, string, string];
  const target = pick(R, ['pb', 'ab', 'perp']);
  const FOLDS: Record<string, string> = {
    pb: `Fold the paper so ${a} lands exactly on ${b}, and crease`,
    ab: `Fold one side of the angle onto the other, creasing through the vertex ${a}`,
    perp: `Fold ℓ onto itself so that the crease passes through ${p}`,
    line: `Fold so that the crease passes through ${a} and ${b}`,
  };
  const goal = target === 'pb' ? `the perpendicular bisector of ${sg(a! + b!)}` : target === 'ab' ? `the bisector of the angle at ${a}` : `the perpendicular to ℓ through ${p}`;
  const opts: Opt[] = (['pb', 'ab', 'perp', 'line'] as const).filter(k => !(target === 'ab' && k === 'line')).map(k => ({ t: FOLDS[k]!, ok: k === target, mc: k === target ? undefined : MC.methodRule, say: k === target ? 'Yes: the fold is a reflection that matches exactly the two things the goal needs to be equal.' : `That crease is ${k === 'pb' ? 'the perpendicular bisector of a segment' : k === 'ab' ? 'an angle bisector' : k === 'perp' ? 'a perpendicular to ℓ' : `line ${a}${b} itself`}, not ${goal}.` }));
  const fig: Fig = target === 'pb' ? segFig(a!, b!, 360, r(R, -25, 25)).fig : target === 'ab' ? angleFig(a!, letters(R, 1, a + b + p)[0]!, letters(R, 1, a + b + p + 'Z')[0]!, 'X', r(R, 50, 120), r(R, -20, 20)) : { segs: [{ id: 'l', a: [-300, 0], b: [300, 0], kind: 'line', name: 'ℓ' }], angles: [], points: [{ at: [r(R, -120, 120), 0], name: p!, dir: -90 }], pad: 90 };
  const base: CBase = {
    id: `foldWhich-${n}`, family: 'foldWhich', subgoal: sgId, prompt: `On patty paper, which fold makes a crease along ${goal}?`,
    board: '\\text{fold}', picture: { fig },
    solution: ['A fold is a reflection: it matches each point with its mirror image and keeps distances.', target === 'pb' ? `Folding ${a} onto ${b} makes every crease point equally far from ${a} and ${b}: the perpendicular bisector.` : target === 'ab' ? 'Folding one side onto the other matches the two angles at the vertex: the bisector.' : `Folding ℓ onto itself makes the crease perpendicular to ℓ; passing it through ${p} gives the one you want.`],
  };
  return choose(R, base, opts);
});
export const dragTest: Gen = (R, n, sgId) => fitted('dragTest', () => {
  const names = letters(R, 5) as [string, string, string, string, string];
  const c = perpBis(R, { names });
  const [a, b] = names;
  const who = shuffle(R, ['Kai', 'Ava', 'Ravi', 'Mia']);
  const opts: Opt[] = [
    { t: `${who[0]}’s line, built from two circles and the line through their crossings`, ok: true, say: 'Yes: it is defined by the circles, so it follows A and B wherever they go. That is the drag test.' },
    { t: `${who[1]}’s line, placed by eye through the middle`, mc: MC.eye, say: 'A line placed by eye stays where it was put; drag B and it no longer bisects.' },
    { t: 'Both: they matched before the drag', mc: MC.eye, say: 'Matching once is not enough. Only a construction keeps its property in every position.' },
  ];
  const base: CBase = {
    id: `dragTest-${n}`, family: 'dragTest', subgoal: sgId, prompt: `In geometry software, ${who[0]} built the perpendicular bisector of ${sg(a + b)} from circles about ${a} and ${b}; ${who[1]} placed a line by eye that looked the same. Then ${b} is dragged far away. Whose line still bisects ${sg(a + b)}?`,
    board: '\\text{drag test}', picture: { cons: { c, upto: c.steps.length } },
    solution: ['A construction keeps its relationships: its points are defined by the circles and lines it uses.', 'A line placed by eye is not tied to A and B; after a drag it breaks.'],
  };
  return choose(R, base, opts);
});
export const foldWhy: Gen = (R, n, sgId) => fitted('foldWhy', () => {
  const [a, b, y] = letters(R, 3);
  const f = segFig(a!, b!, 360, r(R, -25, 25));
  const M = f.M, th = Math.atan2(f.B[1] - f.A[1], f.B[0] - f.A[0]) * 180 / Math.PI;
  const Y = at(M, th + 90, r(R, 110, 170));
  const fig: Fig = { segs: [{ id: 'AB', a: f.A, b: f.B }, { id: 'cr', a: at(M, th - 90, 210), b: at(M, th + 90, 230), kind: 'line', dash: true, col: 'second' }, { id: 'YA', a: Y, b: f.A, col: 'first', ticks: 1, solve: true }, { id: 'YB', a: Y, b: f.B, col: 'first', ticks: 1, solve: true }], angles: [], points: [...f.fig.points, { at: Y, name: y!, dir: th + 60 }], pad: 80 };
  const opts: Opt[] = [
    { t: `The fold is a reflection that swaps ${a} and ${b} and keeps distances, so ${y}${a} = ${y}${b}`, ok: true, say: 'Yes: Y stays put (it is on the crease) while A goes to B; a reflection keeps the distance from Y.' },
    { t: 'The crease looks like it is in the middle', mc: MC.appearance, say: 'The reason is the reflection, not the look: the fold matched A with B exactly.' },
    { t: 'Paper folding measures the two distances', mc: MC.methodRule, say: 'Folding measures nothing; it reflects. Reflections preserve distance: that is the reason.' },
  ];
  const base: CBase = {
    id: `foldWhy-${n}`, family: 'foldWhy', subgoal: sgId, prompt: `Folding ${a} onto ${b} made the dashed crease. ${y} is any point on the crease. Why is ${y}${a} = ${y}${b}?`,
    board: `${y}${a} = ${y}${b}`, picture: { fig },
    solution: [`The fold is the reflection across the crease; it carries ${a} onto ${b}.`, `${y} is on the crease, so it stays where it is: the distance ${y}${a} becomes ${y}${b}.`],
  };
  return choose(R, base, opts);
});
export type { CItem };
export { half, nm };
